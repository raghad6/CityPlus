import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators';
import { plain } from '../common/util';
import { ProjectDto, UpdateProjectDto } from './projects.dto';
import { CLOSED_STATUSES, visibleProjects } from './project-rules';

export interface ProjectQuery {
  q?: string;
  status?: string;
  departmentId?: string;
  planYear?: number;
  due?: 'overdue' | 'soon';
  sort?: 'updated' | 'name' | 'due' | 'progress' | 'cost';
  page?: number;
  pageSize?: number;
}

/** Relations loaded with every project in lists and exports. */
export const listInclude = {
  department: { select: { id: true, name: true, nameEn: true } },
  departments: { select: { department: { select: { id: true, name: true, nameEn: true } } } },
  _count: { select: { reports: { where: { status: 'PENDING' } }, assignments: true } },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  /** Turns the list filters (search, status, department, due date) into a database filter. */
  buildWhere(user: AuthUser, q: ProjectQuery): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = { ...visibleProjects(user) };
    const and: Prisma.ProjectWhereInput[] = [];
    if (q.q) {
      and.push({
        OR: [
          { programName: { contains: q.q, mode: 'insensitive' } },
          { componentName: { contains: q.q, mode: 'insensitive' } },
          { programNumber: { contains: q.q } },
          { componentNumber: { contains: q.q } },
        ],
      });
    }
    if (q.status) where.status = { in: q.status.split(',') as any };
    if (q.departmentId) {
      and.push({ OR: [{ departmentId: q.departmentId }, { departments: { some: { departmentId: q.departmentId } } }] });
    }
    if (q.planYear) where.planYear = Number(q.planYear);
    const now = new Date();
    if (q.due === 'overdue') {
      where.dueDate = { lt: now };
      and.push({ status: { notIn: CLOSED_STATUSES } });
    } else if (q.due === 'soon') {
      where.dueDate = { gte: now, lte: new Date(now.getTime() + 30 * 86400_000) };
      and.push({ status: { notIn: CLOSED_STATUSES } });
    }
    if (and.length) where.AND = and;
    return where;
  }

  async list(user: AuthUser, q: ProjectQuery) {
    const where = this.buildWhere(user, q);
    const take = Math.min(Number(q.pageSize) || 20, 200);
    const skip = (Math.max(Number(q.page) || 1, 1) - 1) * take;
    const orderBy: Prisma.ProjectOrderByWithRelationInput[] =
      q.sort === 'name' ? [{ componentName: 'asc' }]
      : q.sort === 'due' ? [{ dueDate: { sort: 'asc', nulls: 'last' } }]
      : q.sort === 'progress' ? [{ completionPercent: 'desc' }]
      : q.sort === 'cost' ? [{ totalCostK: { sort: 'desc', nulls: 'last' } }]
      : [{ updatedAt: 'desc' }];
    const [items, total] = await Promise.all([
      this.prisma.project.findMany({ where, include: listInclude, orderBy, skip, take }),
      this.prisma.project.count({ where }),
    ]);
    return plain({ items, total, page: Math.floor(skip / take) + 1, pageSize: take });
  }

  async get(user: AuthUser, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { ...visibleProjects(user), id },
      include: {
        ...listInclude,
        assignments: { select: { user: { select: { id: true, name: true, email: true, department: { select: { name: true, nameEn: true } } } } } },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { author: { select: { id: true, name: true } }, reviewer: { select: { id: true, name: true } } },
        },
      },
    });
    if (!project) throw new NotFoundException();
    return plain(project);
  }

  private async checkRefs(tenantId: string, dto: Partial<ProjectDto>) {
    const depIds = [dto.departmentId, ...(dto.extraDepartmentIds ?? [])].filter(Boolean) as string[];
    if (depIds.length) {
      const n = await this.prisma.department.count({ where: { tenantId, id: { in: depIds } } });
      if (n !== new Set(depIds).size) throw new BadRequestException({ code: 'DEPARTMENT_NOT_FOUND' });
    }
    if (dto.assigneeIds?.length) {
      const n = await this.prisma.user.count({ where: { tenantId, id: { in: dto.assigneeIds } } });
      if (n !== new Set(dto.assigneeIds).size) throw new BadRequestException({ code: 'USER_NOT_FOUND' });
    }
  }

  private data(dto: Partial<ProjectDto>) {
    const { extraDepartmentIds, assigneeIds, departmentId, startDate, dueDate, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (data.status === 'COMPLETED' && data.completionPercent === undefined) data.completionPercent = 100;
    return { data, departmentId };
  }

  async create(user: AuthUser, dto: ProjectDto) {
    const tenantId = user.tenantId!;
    await this.checkRefs(tenantId, dto);
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const { data, departmentId } = this.data(dto);
    const extra = [...new Set(dto.extraDepartmentIds ?? [])].filter((d) => d !== departmentId);
    const project = await this.prisma.project.create({
      data: {
        ...(data as any),
        planYear: dto.planYear ?? tenant.planYear,
        tenant: { connect: { id: tenantId } },
        department: departmentId ? { connect: { id: departmentId } } : undefined,
        departments: { create: extra.map((departmentId) => ({ departmentId })) },
        assignments: { create: [...new Set(dto.assigneeIds ?? [])].map((userId) => ({ userId })) },
      },
    });
    await this.audit.log(user, 'project.create', 'Project', project.id, project.componentName);
    return this.get(user, project.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateProjectDto) {
    const tenantId = user.tenantId!;
    const existing = await this.prisma.project.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException();
    await this.checkRefs(tenantId, dto);
    const { data, departmentId } = this.data(dto);
    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          ...(data as any),
          ...(departmentId !== undefined
            ? { department: departmentId ? { connect: { id: departmentId } } : { disconnect: true } }
            : {}),
        },
      });
      if (dto.extraDepartmentIds) {
        const primary = departmentId !== undefined ? departmentId : existing.departmentId;
        const extra = [...new Set(dto.extraDepartmentIds)].filter((d) => d !== primary);
        await tx.projectDepartment.deleteMany({ where: { projectId: id } });
        await tx.projectDepartment.createMany({ data: extra.map((departmentId) => ({ projectId: id, departmentId })) });
      }
      if (dto.assigneeIds) {
        await tx.projectAssignment.deleteMany({ where: { projectId: id } });
        await tx.projectAssignment.createMany({ data: [...new Set(dto.assigneeIds)].map((userId) => ({ projectId: id, userId })) });
      }
    });
    await this.audit.log(user, 'project.update', 'Project', id, dto.componentName ?? existing.componentName);
    return this.get(user, id);
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.project.findFirst({ where: { id, tenantId: user.tenantId! } });
    if (!existing) throw new NotFoundException();
    await this.prisma.project.delete({ where: { id } });
    await this.audit.log(user, 'project.delete', 'Project', id, existing.componentName);
    return { ok: true };
  }
}
