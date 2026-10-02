import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { num, plain } from '../common/util';
import { CLOSED_STATUSES, visibleProjects } from '../projects/project-rules';

const OPEN = { notIn: CLOSED_STATUSES };

/** Numbers, charts and lists for the dashboards and the calendar. Read-only. */
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /** Admin dashboard for the whole municipality, optionally for one plan year. */
  async admin(tenantId: string, planYear?: string) {
    const base: Prisma.ProjectWhereInput = { tenantId, ...(planYear ? { planYear: Number(planYear) } : {}) };
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400_000);

    const [agg, byStatus, byDept, departments, pendingReports, pendingUsers, overdue, upcoming, recent, years] = await Promise.all([
      this.prisma.project.aggregate({
        where: base,
        _count: true,
        _avg: { completionPercent: true },
        _sum: { totalCostK: true, yearCostK: true, spentK: true, localContributionK: true, partnerContributionK: true },
      }),
      this.prisma.project.groupBy({ by: ['status'], where: base, _count: true }),
      this.prisma.project.groupBy({
        by: ['departmentId'], where: base, _count: true,
        _avg: { completionPercent: true }, _sum: { totalCostK: true, spentK: true },
      }),
      this.prisma.department.findMany({ where: { tenantId }, select: { id: true, name: true, nameEn: true } }),
      this.prisma.report.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.user.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.project.findMany({
        where: { ...base, status: OPEN, dueDate: { lt: now } },
        select: { id: true, componentName: true, dueDate: true, completionPercent: true, status: true },
        orderBy: { dueDate: 'asc' }, take: 8,
      }),
      this.prisma.project.findMany({
        where: { ...base, status: OPEN, dueDate: { gte: now, lte: in30 } },
        select: { id: true, componentName: true, dueDate: true, completionPercent: true, status: true },
        orderBy: { dueDate: 'asc' }, take: 8,
      }),
      this.prisma.auditLog.findMany({
        where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 8,
        include: { user: { select: { name: true } } },
      }),
      this.prisma.project.groupBy({ by: ['planYear'], where: { tenantId }, orderBy: { planYear: 'desc' } }),
    ]);

    const depName = new Map(departments.map((d) => [d.id, d]));
    const overdueCount = await this.prisma.project.count({ where: { ...base, status: OPEN, dueDate: { lt: now } } });

    return plain({
      totals: {
        projects: agg._count,
        avgCompletion: Math.round(agg._avg.completionPercent ?? 0),
        totalCostK: num(agg._sum.totalCostK),
        yearCostK: num(agg._sum.yearCostK),
        spentK: num(agg._sum.spentK),
        localContributionK: num(agg._sum.localContributionK),
        partnerContributionK: num(agg._sum.partnerContributionK),
        pendingReports,
        pendingUsers,
        overdue: overdueCount,
      },
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byDepartment: byDept
        .map((d) => ({
          departmentId: d.departmentId,
          name: d.departmentId ? depName.get(d.departmentId)?.name ?? '—' : null,
          nameEn: d.departmentId ? depName.get(d.departmentId)?.nameEn ?? null : null,
          count: d._count,
          avgCompletion: Math.round(d._avg.completionPercent ?? 0),
          totalCostK: num(d._sum.totalCostK),
          spentK: num(d._sum.spentK),
        }))
        .sort((a, b) => b.count - a.count),
      overdue,
      upcoming,
      recent,
      years: years.map((y) => y.planYear),
    });
  }

  /** Calendar entries (start / due dates) for a month, scoped to what the user can see. */
  async calendar(user: AuthUser, month?: string) {
    const [y, m] = (month ?? new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 1));
    const items = await this.prisma.project.findMany({
      where: { ...visibleProjects(user), OR: [{ dueDate: { gte: from, lt: to } }, { startDate: { gte: from, lt: to } }] },
      select: { id: true, componentName: true, startDate: true, dueDate: true, status: true },
    });
    const events: { date: string; type: 'start' | 'due'; projectId: string; title: string; status: string }[] = [];
    for (const p of items) {
      if (p.startDate && p.startDate >= from && p.startDate < to)
        events.push({ date: p.startDate.toISOString().slice(0, 10), type: 'start', projectId: p.id, title: p.componentName, status: p.status });
      if (p.dueDate && p.dueDate >= from && p.dueDate < to)
        events.push({ date: p.dueDate.toISOString().slice(0, 10), type: 'due', projectId: p.id, title: p.componentName, status: p.status });
    }
    return events;
  }

  /** Staff home page: the projects assigned to this user and their own reports. */
  async me(user: AuthUser) {
    const tenantId = user.tenantId!;
    const scope: Prisma.ProjectWhereInput = { tenantId, assignments: { some: { userId: user.id } } };
    const now = new Date();
    const [projects, reports, pending, rejected] = await Promise.all([
      this.prisma.project.findMany({
        where: scope,
        select: {
          id: true, componentName: true, programName: true, status: true, completionPercent: true, dueDate: true, updatedAt: true,
          department: { select: { name: true, nameEn: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.report.findMany({
        where: { tenantId, authorId: user.id },
        orderBy: { createdAt: 'desc' }, take: 6,
        include: { project: { select: { id: true, componentName: true } } },
      }),
      this.prisma.report.count({ where: { tenantId, authorId: user.id, status: 'PENDING' } }),
      this.prisma.report.count({ where: { tenantId, authorId: user.id, status: 'REJECTED' } }),
    ]);
    const open = projects.filter((p) => !CLOSED_STATUSES.includes(p.status));
    return plain({
      totals: {
        projects: projects.length,
        active: open.length,
        completed: projects.filter((p) => p.status === 'COMPLETED').length,
        overdue: open.filter((p) => p.dueDate && p.dueDate < now).length,
        pendingReports: pending,
        rejectedReports: rejected,
      },
      projects,
      reports,
    });
  }
}
