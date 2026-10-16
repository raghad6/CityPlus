import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Project, SummaryKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../common/decorators';
import { num, plain } from '../common/util';
import { addDays, localMidnight } from '../common/time';
import { CLOSED_STATUSES } from '../projects/project-rules';

type ProjectWithDept = Project & { department: { name: string; nameEn: string | null } | null };

export interface SummaryRow {
  id: string; name: string; program: string; department: string | null; departmentEn: string | null;
  status: string; completionPercent: number; startDate: string | null; dueDate: string | null;
  totalCostK: number | null; yearCostK: number | null; spentK: number | null;
}

const row = (p: ProjectWithDept): SummaryRow => ({
  id: p.id, name: p.componentName, program: p.programName,
  department: p.department?.name ?? null, departmentEn: p.department?.nameEn ?? null,
  status: p.status, completionPercent: p.completionPercent,
  startDate: p.startDate?.toISOString() ?? null, dueDate: p.dueDate?.toISOString() ?? null,
  totalCostK: p.totalCostK == null ? null : Number(p.totalCostK),
  yearCostK: p.yearCostK == null ? null : Number(p.yearCostK),
  spentK: p.spentK == null ? null : Number(p.spentK),
});
const inRange = (d: Date | null, from: Date, to: Date) => !!d && d >= from && d < to;

/** Weekly, monthly and on-demand performance reports for a municipality. */
@Injectable()
export class SummariesService {
  constructor(private prisma: PrismaService, private audit: AuditService, private notifications: NotificationsService) {}

  async list(tenantId: string) {
    const items = await this.prisma.summaryReport.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 100 });
    // The list shows the headline numbers only.
    return items.map(({ data, ...r }) => ({ ...r, totals: (data as any)?.totals ?? null }));
  }

  async get(tenantId: string, id: string) {
    const r = await this.prisma.summaryReport.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException();
    return r;
  }

  async remove(user: AuthUser, id: string) {
    await this.get(user.tenantId!, id);
    await this.prisma.summaryReport.delete({ where: { id } });
    await this.audit.log(user, 'summary.delete', 'SummaryReport', id);
    return { ok: true };
  }

  /** On demand: `from` and `to` are local dates (YYYY-MM-DD), both included. */
  async request(user: AuthUser, kind: SummaryKind, from: string, to: string) {
    if (to < from) throw new BadRequestException({ code: 'INVALID_PERIOD' });
    if ((Date.parse(to) - Date.parse(from)) / 86400_000 > 366) throw new BadRequestException({ code: 'PERIOD_TOO_LONG' });
    const report = await this.generate(user.tenantId!, kind, localMidnight(from), localMidnight(addDays(to, 1)), user.id);
    await this.audit.log(user, 'summary.create', 'SummaryReport', report.id, `${from} → ${to}`);
    return report;
  }

  /** Builds and saves the report for [start, end). Scheduled runs notify the municipality's admins. */
  async generate(tenantId: string, kind: SummaryKind, start: Date, end: Date, createdById?: string) {
    const data = await this.build(tenantId, start, end);
    const report = await this.prisma.summaryReport.create({
      data: { tenantId, kind, periodStart: start, periodEnd: end, data: data as unknown as Prisma.InputJsonValue, createdById },
    });
    if (!createdById) {
      const label = kind === 'WEEKLY' ? ['الأسبوعي', 'Weekly'] : ['الشهري', 'Monthly'];
      await this.notifications.send(tenantId, await this.notifications.admins(tenantId), {
        type: 'SUMMARY_READY',
        title: `التقرير ${label[0]} جاهز`,
        titleEn: `${label[1]} report ready`,
        body: `${data.totals.projects} مشروع · متوسط الإنجاز ${data.totals.avgCompletion}% · متأخرة ${data.totals.overdue}`,
        bodyEn: `${data.totals.projects} projects · ${data.totals.avgCompletion}% average completion · ${data.totals.overdue} overdue`,
        link: `/admin/summaries/${report.id}`,
      });
    }
    return report;
  }

  /** True when a scheduled report for this period already exists (so restarts don't duplicate it). */
  async exists(tenantId: string, kind: SummaryKind, start: Date) {
    return !!(await this.prisma.summaryReport.findFirst({ where: { tenantId, kind, periodStart: start }, select: { id: true } }));
  }

  async build(tenantId: string, start: Date, end: Date) {
    const now = new Date();
    const len = end.getTime() - start.getTime();
    const [tenant, projects, reports] = await Promise.all([
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { name: true, nameEn: true, planYear: true } }),
      this.prisma.project.findMany({ where: { tenantId }, include: { department: { select: { name: true, nameEn: true } } } }),
      this.prisma.report.findMany({
        where: { tenantId, createdAt: { gte: start, lt: end } },
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { componentName: true } }, author: { select: { name: true } } },
      }),
    ]);

    const open = projects.filter((p) => !CLOSED_STATUSES.includes(p.status));
    const sum = (k: 'totalCostK' | 'yearCostK' | 'spentK' | 'localContributionK' | 'partnerContributionK') =>
      projects.reduce((s, p) => s + num(p[k]), 0);
    const yearCostK = sum('yearCostK');
    const spentK = sum('spentK');
    const overdue = open.filter((p) => p.dueDate && p.dueDate < end);

    const statusCounts = new Map<string, number>();
    for (const p of projects) statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1);

    const depts = new Map<string, { name: string | null; nameEn: string | null; count: number; completion: number; totalCostK: number; spentK: number }>();
    for (const p of projects) {
      const key = p.departmentId ?? '';
      const d = depts.get(key) ?? { name: p.department?.name ?? null, nameEn: p.department?.nameEn ?? null, count: 0, completion: 0, totalCostK: 0, spentK: 0 };
      d.count++; d.completion += p.completionPercent; d.totalCostK += num(p.totalCostK); d.spentK += num(p.spentK);
      depts.set(key, d);
    }

    return {
      tenant: { name: tenant.name, nameEn: tenant.nameEn, planYear: tenant.planYear },
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      generatedAt: now.toISOString(),
      totals: {
        projects: projects.length,
        avgCompletion: projects.length ? Math.round(projects.reduce((s, p) => s + p.completionPercent, 0) / projects.length) : 0,
        open: open.length,
        completed: statusCounts.get('COMPLETED') ?? 0,
        overdue: overdue.length,
        totalCostK: sum('totalCostK'),
        yearCostK,
        spentK,
        spentPct: yearCostK ? Math.round((spentK / yearCostK) * 100) : null,
        localContributionK: sum('localContributionK'),
        partnerContributionK: sum('partnerContributionK'),
        startedInPeriod: projects.filter((p) => inRange(p.startDate, start, end)).length,
        completedInPeriod: projects.filter((p) => inRange(p.completedAt, start, end)).length,
        reportsInPeriod: reports.length,
      },
      byStatus: [...statusCounts].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      byDepartment: [...depts.values()]
        .map((d) => ({ name: d.name, nameEn: d.nameEn, count: d.count, avgCompletion: Math.round(d.completion / d.count), totalCostK: d.totalCostK, spentK: d.spentK }))
        .sort((a, b) => b.count - a.count),
      started: projects.filter((p) => inRange(p.startDate, start, end)).map(row),
      completed: projects.filter((p) => inRange(p.completedAt, start, end)).map(row),
      due: projects.filter((p) => inRange(p.dueDate, start, end)).map(row),
      overdue: overdue.sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime()).map(row),
      upcoming: open.filter((p) => inRange(p.dueDate, end, new Date(end.getTime() + Math.max(len, 30 * 86400_000)))).map(row),
      reports: {
        submitted: reports.length,
        approved: reports.filter((r) => r.status === 'APPROVED').length,
        rejected: reports.filter((r) => r.status === 'REJECTED').length,
        pending: reports.filter((r) => r.status === 'PENDING').length,
        items: reports.slice(0, 50).map((r) => ({ project: r.project.componentName, author: r.author.name, status: r.status, date: r.createdAt.toISOString() })),
      },
    };
  }
}

export type SummaryData = Awaited<ReturnType<SummariesService['build']>>;
