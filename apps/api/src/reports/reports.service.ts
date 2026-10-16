import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators';
import { plain } from '../common/util';
import { PROGRESS_FIELDS, ProgressFieldsDto } from '../projects/projects.dto';
import { REASON_REQUIRED_STATUSES, visibleProjects } from '../projects/project-rules';
import { ProjectEventsService } from '../project-events/project-events.service';

/**
 * Progress-report workflow: staff submit proposed changes, an admin approves (changes are copied onto
 * the project) or rejects (with a reason). Admin reports, or municipalities without approval, apply at once.
 */
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService, private audit: AuditService, private events: ProjectEventsService) {}

  async submit(user: AuthUser, projectId: string, dto: ProgressFieldsDto) {
    const tenantId = user.tenantId!;
    const project = await this.prisma.project.findFirst({ where: { ...visibleProjects(user), id: projectId } });
    if (!project) throw new NotFoundException();

    // Required (**) fields from the municipality form
    const missing: string[] = [];
    if (!dto.status) missing.push('status');
    if (dto.spentK == null) missing.push('spentK');
    if (!dto.activities?.trim()) missing.push('activities');
    if (dto.localContributionK == null) missing.push('localContributionK');
    if (dto.partnerContributionK == null) missing.push('partnerContributionK');
    if (dto.status && REASON_REQUIRED_STATUSES.includes(dto.status) && !dto.nonExecutionReasons?.trim()) missing.push('nonExecutionReasons');
    if (missing.length) throw new BadRequestException({ code: 'REQUIRED_FIELDS', fields: missing });

    const pending = await this.prisma.report.findFirst({ where: { projectId, authorId: user.id, status: 'PENDING' } });
    if (pending) throw new ConflictException({ code: 'REPORT_PENDING' });

    const payload: Record<string, unknown> = {};
    for (const f of PROGRESS_FIELDS) if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    if (payload.status === 'COMPLETED' && payload.completionPercent === undefined) payload.completionPercent = 100;

    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const autoApprove = user.role === 'ADMIN' || !tenant.requireApproval;

    const report = await this.prisma.$transaction(async (tx) => {
      const r = await tx.report.create({
        data: {
          tenantId, projectId, authorId: user.id, payload: payload as Prisma.InputJsonValue,
          status: autoApprove ? 'APPROVED' : 'PENDING',
          reviewerId: autoApprove ? user.id : null,
          reviewedAt: autoApprove ? new Date() : null,
        },
      });
      if (autoApprove) await tx.project.update({ where: { id: projectId }, data: payload as any });
      return r;
    });
    await this.audit.log(user, 'report.submit', 'Report', report.id, project.componentName);
    if (autoApprove) this.events.scanSoon();
    return report;
  }

  /** Admins see every report in the municipality; staff only their own. */
  async list(user: AuthUser, filters: { status?: string; projectId?: string }) {
    const where: Prisma.ReportWhereInput = { tenantId: user.tenantId! };
    if (user.role === 'STAFF') where.authorId = user.id;
    if (filters.status) where.status = filters.status as any;
    if (filters.projectId) where.projectId = filters.projectId;
    const items = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        project: { select: { id: true, componentName: true, programName: true, status: true, completionPercent: true } },
        author: { select: { id: true, name: true, department: { select: { name: true, nameEn: true } } } },
        reviewer: { select: { id: true, name: true } },
      },
    });
    return plain(items);
  }

  async get(user: AuthUser, id: string) {
    const report = await this.prisma.report.findFirst({
      where: { id, tenantId: user.tenantId!, ...(user.role === 'STAFF' ? { authorId: user.id } : {}) },
      include: {
        project: true,
        author: { select: { id: true, name: true, email: true, department: { select: { name: true, nameEn: true } } } },
        reviewer: { select: { id: true, name: true } },
      },
    });
    if (!report) throw new NotFoundException();
    return plain(report);
  }

  async approve(user: AuthUser, id: string, note?: string) {
    const report = await this.pending(user.tenantId!, id);
    await this.prisma.$transaction([
      this.prisma.project.update({ where: { id: report.projectId }, data: report.payload as any }),
      this.prisma.report.update({
        where: { id }, data: { status: 'APPROVED', reviewerId: user.id, reviewedAt: new Date(), reviewNote: note },
      }),
    ]);
    await this.audit.log(user, 'report.approve', 'Report', id, report.project.componentName);
    this.events.scanSoon();
    return { ok: true };
  }

  async reject(user: AuthUser, id: string, note: string) {
    const report = await this.pending(user.tenantId!, id);
    await this.prisma.report.update({
      where: { id }, data: { status: 'REJECTED', reviewerId: user.id, reviewedAt: new Date(), reviewNote: note },
    });
    await this.audit.log(user, 'report.reject', 'Report', id, report.project.componentName);
    return { ok: true };
  }

  /** Staff can withdraw their own pending report; admins can withdraw any. */
  async withdraw(user: AuthUser, id: string) {
    const report = await this.pending(user.tenantId!, id);
    if (report.authorId !== user.id && user.role !== 'ADMIN') throw new ForbiddenException();
    await this.prisma.report.delete({ where: { id } });
    await this.audit.log(user, 'report.withdraw', 'Report', id, report.project.componentName);
    return { ok: true };
  }

  private async pending(tenantId: string, id: string) {
    const report = await this.prisma.report.findFirst({ where: { id, tenantId }, include: { project: { select: { componentName: true } } } });
    if (!report) throw new NotFoundException();
    if (report.status !== 'PENDING') throw new ConflictException({ code: 'ALREADY_REVIEWED' });
    return report;
  }
}
