import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SummariesService } from '../summaries/summaries.service';
import { addDays, APP_TZ, localDate, localMidnight, monthStart } from '../common/time';

/** Events older than this when first noticed are recorded silently, so a first run doesn't flood people. */
const RECENT_MS = 7 * 86400_000;

/**
 * Background jobs:
 * - every 5 minutes: announce projects that started, reached their end date, or were completed
 *   (each event is announced once);
 * - Sunday 07:00: last week's report; the 1st of the month 07:00: last month's report.
 * Times use APP_TZ (default Asia/Hebron).
 */
@Injectable()
export class ProjectEventsService {
  private log = new Logger(ProjectEventsService.name);
  private scanning = false;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private summaries: SummariesService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledScan() {
    await this.scanAll();
  }

  /** Runs the event check now (also called right after a project changes). Never throws. */
  async scanAll() {
    if (this.scanning) return;
    this.scanning = true;
    try {
      const tenants = await this.prisma.tenant.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
      for (const t of tenants) await this.scanTenant(t.id);
    } catch (e: any) {
      this.log.error(`Event scan failed: ${e?.message}`);
    } finally {
      this.scanning = false;
    }
  }

  /** Fire-and-forget version for request handlers. */
  scanSoon() {
    setTimeout(() => void this.scanAll(), 500);
  }

  private async scanTenant(tenantId: string) {
    const now = new Date();
    const recent = new Date(now.getTime() - RECENT_MS);

    // Started: start date reached, not yet announced for this start date.
    const starting = await this.prisma.project.findMany({
      where: { tenantId, startDate: { gte: recent, lte: now } },
      select: { id: true, componentName: true, startDate: true, startNotifiedAt: true, status: true },
    });
    for (const p of starting.filter((p) => !p.startNotifiedAt || p.startNotifiedAt < p.startDate!)) {
      if (p.status !== 'CANCELLED') {
        await this.notifications.send(tenantId, await this.notifications.projectRecipients(tenantId, p.id), {
          type: 'PROJECT_STARTED',
          title: `بدأ المشروع: ${p.componentName}`,
          titleEn: `Project started: ${p.componentName}`,
          body: `تاريخ البدء ${p.startDate!.toISOString().slice(0, 10)}`,
          bodyEn: `Start date ${p.startDate!.toISOString().slice(0, 10)}`,
          link: `/{area}/projects/${p.id}`,
        });
      }
      await this.prisma.project.update({ where: { id: p.id }, data: { startNotifiedAt: now } });
    }

    // End date reached: tell whether it finished on time or is now overdue.
    const ending = await this.prisma.project.findMany({
      where: { tenantId, dueDate: { gte: recent, lte: now } },
      select: { id: true, componentName: true, dueDate: true, dueNotifiedAt: true, status: true, completionPercent: true },
    });
    for (const p of ending.filter((p) => !p.dueNotifiedAt || p.dueNotifiedAt < p.dueDate!)) {
      if (p.status !== 'CANCELLED') {
        const done = p.status === 'COMPLETED';
        await this.notifications.send(tenantId, await this.notifications.projectRecipients(tenantId, p.id), {
          type: 'PROJECT_DUE',
          title: done ? `انتهى موعد المشروع وهو منجز: ${p.componentName}` : `انتهى موعد المشروع ولم يكتمل: ${p.componentName}`,
          titleEn: done ? `End date reached, project completed: ${p.componentName}` : `End date reached, not completed: ${p.componentName}`,
          body: `نسبة الإنجاز ${p.completionPercent}% · تاريخ الانتهاء ${p.dueDate!.toISOString().slice(0, 10)}`,
          bodyEn: `${p.completionPercent}% complete · end date ${p.dueDate!.toISOString().slice(0, 10)}`,
          link: `/{area}/projects/${p.id}`,
        });
      }
      await this.prisma.project.update({ where: { id: p.id }, data: { dueNotifiedAt: now } });
    }

    // Completed: announce once.
    const completed = await this.prisma.project.findMany({
      where: { tenantId, status: 'COMPLETED', completedAt: null },
      select: { id: true, componentName: true, updatedAt: true, dueDate: true },
    });
    for (const p of completed) {
      const fresh = p.updatedAt >= recent;
      await this.prisma.project.update({ where: { id: p.id }, data: { completedAt: fresh ? now : p.updatedAt } });
      if (!fresh) continue;
      await this.notifications.send(tenantId, await this.notifications.projectRecipients(tenantId, p.id), {
        type: 'PROJECT_COMPLETED',
        title: `اكتمل المشروع: ${p.componentName}`,
        titleEn: `Project completed: ${p.componentName}`,
        body: p.dueDate ? `الموعد المخطط ${p.dueDate.toISOString().slice(0, 10)}` : undefined,
        bodyEn: p.dueDate ? `Planned end date ${p.dueDate.toISOString().slice(0, 10)}` : undefined,
        link: `/{area}/projects/${p.id}`,
      });
    }

    // Reopened: forget the completion so a later completion is announced again.
    await this.prisma.project.updateMany({ where: { tenantId, status: { not: 'COMPLETED' }, completedAt: { not: null } }, data: { completedAt: null } });
  }

  /** Sunday 07:00: the 7 days before today. */
  @Cron('0 7 * * 0', { timeZone: APP_TZ })
  async weeklyReports() {
    const today = localDate(new Date());
    await this.periodReports('WEEKLY', localMidnight(addDays(today, -7)), localMidnight(today));
  }

  /** 1st of the month 07:00: the previous calendar month. */
  @Cron('0 7 1 * *', { timeZone: APP_TZ })
  async monthlyReports() {
    const today = localDate(new Date());
    await this.periodReports('MONTHLY', localMidnight(monthStart(today, -1)), localMidnight(monthStart(today)));
  }

  private async periodReports(kind: 'WEEKLY' | 'MONTHLY', start: Date, end: Date) {
    const tenants = await this.prisma.tenant.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
    for (const t of tenants) {
      try {
        if (await this.summaries.exists(t.id, kind, start)) continue;
        await this.summaries.generate(t.id, kind, start, end);
      } catch (e: any) {
        this.log.error(`${kind} report for tenant ${t.id} failed: ${e?.message}`);
      }
    }
  }
}
