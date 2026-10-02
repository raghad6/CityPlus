import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators';
import { CreateUserDto, UpdateUserDto } from './users.dto';

/** Fields returned for a user (never the password hash). */
const userSelect = {
  id: true, name: true, email: true, phone: true, role: true, status: true, lastLoginAt: true, createdAt: true,
  department: { select: { id: true, name: true, nameEn: true } },
  _count: { select: { assignments: true, reports: true } },
} satisfies Prisma.UserSelect;

/** User management inside one municipality: approve sign-ups, add, edit, assign projects, reset, delete. */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  list(tenantId: string, filters: { q?: string; status?: string; departmentId?: string }) {
    const where: Prisma.UserWhereInput = { tenantId };
    if (filters.status) where.status = filters.status as any;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.q) where.OR = [{ name: { contains: filters.q, mode: 'insensitive' } }, { email: { contains: filters.q, mode: 'insensitive' } }];
    return this.prisma.user.findMany({ where, select: userSelect, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] });
  }

  async get(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { ...userSelect, assignments: { select: { projectId: true } } },
    });
    if (!user) throw new NotFoundException();
    return { ...user, projectIds: user.assignments.map((a) => a.projectId) };
  }

  /** Admin-created users are active straight away (no approval step). */
  async create(actor: AuthUser, tenantId: string, dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException({ code: 'EMAIL_TAKEN' });
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    if ((await this.prisma.user.count({ where: { tenantId } })) >= tenant.maxUsers) {
      throw new BadRequestException({ code: 'USER_LIMIT_REACHED' });
    }
    await this.checkDepartment(tenantId, dto.departmentId);
    const projectIds = await this.validProjectIds(tenantId, dto.projectIds ?? []);
    const user = await this.prisma.user.create({
      data: {
        tenantId, name: dto.name, email, phone: dto.phone, role: dto.role ?? 'STAFF', status: 'ACTIVE',
        departmentId: dto.departmentId || null,
        passwordHash: await bcrypt.hash(dto.password, 10),
        assignments: { create: projectIds.map((projectId) => ({ projectId })) },
      },
      select: userSelect,
    });
    await this.audit.log(actor, 'user.create', 'User', user.id, `${user.name} <${user.email}>`);
    return user;
  }

  /** Also used to approve (PENDING → ACTIVE), disable and re-enable a user. */
  async update(actor: AuthUser, tenantId: string, id: string, dto: UpdateUserDto) {
    const existing = await this.ensure(tenantId, id);
    if (id === actor.id && ((dto.role && dto.role !== 'ADMIN') || (dto.status && dto.status !== 'ACTIVE'))) {
      throw new BadRequestException({ code: 'CANNOT_DEMOTE_SELF' });
    }
    if (dto.departmentId) await this.checkDepartment(tenantId, dto.departmentId);
    const data: Prisma.UserUpdateInput = {
      name: dto.name, phone: dto.phone, role: dto.role, status: dto.status,
    };
    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      const other = await this.prisma.user.findUnique({ where: { email } });
      if (other && other.id !== id) throw new ConflictException({ code: 'EMAIL_TAKEN' });
      data.email = email;
    }
    if (dto.departmentId !== undefined) {
      data.department = dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true };
    }
    const user = await this.prisma.user.update({ where: { id }, data, select: userSelect });
    const action = dto.status && dto.status !== existing.status
      ? (dto.status === 'ACTIVE' ? (existing.status === 'PENDING' ? 'user.approve' : 'user.enable') : 'user.disable')
      : 'user.update';
    await this.audit.log(actor, action, 'User', id, user.name);
    return user;
  }

  /** Replaces the list of projects the user follows. */
  async assignProjects(actor: AuthUser, tenantId: string, id: string, ids: string[]) {
    const user = await this.ensure(tenantId, id);
    const projectIds = await this.validProjectIds(tenantId, ids);
    await this.prisma.$transaction([
      this.prisma.projectAssignment.deleteMany({ where: { userId: id } }),
      this.prisma.projectAssignment.createMany({ data: projectIds.map((projectId) => ({ projectId, userId: id })) }),
    ]);
    await this.audit.log(actor, 'user.assign', 'User', id, `${user.name}: ${projectIds.length}`);
    return { projectIds };
  }

  async resetPassword(actor: AuthUser, tenantId: string, id: string, password: string) {
    const user = await this.ensure(tenantId, id);
    await this.prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
    await this.audit.log(actor, 'user.resetPassword', 'User', id, user.name);
    return { ok: true };
  }

  /** Also used to decline a pending sign-up. */
  async remove(actor: AuthUser, tenantId: string, id: string) {
    if (id === actor.id) throw new BadRequestException({ code: 'CANNOT_DELETE_SELF' });
    const user = await this.ensure(tenantId, id);
    await this.prisma.user.delete({ where: { id } });
    await this.audit.log(actor, 'user.delete', 'User', id, `${user.name} <${user.email}>`);
    return { ok: true };
  }

  private async ensure(tenantId: string, id: string) {
    const u = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!u) throw new NotFoundException();
    return u;
  }

  private async checkDepartment(tenantId: string, departmentId?: string | null) {
    if (!departmentId) return;
    const d = await this.prisma.department.findFirst({ where: { id: departmentId, tenantId } });
    if (!d) throw new BadRequestException({ code: 'DEPARTMENT_NOT_FOUND' });
  }

  /** Keeps only ids of projects that belong to this municipality. */
  private async validProjectIds(tenantId: string, ids: string[]) {
    if (!ids.length) return [];
    const found = await this.prisma.project.findMany({ where: { tenantId, id: { in: ids } }, select: { id: true } });
    return found.map((p) => p.id);
  }
}
