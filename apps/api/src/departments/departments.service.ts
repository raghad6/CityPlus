import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators';
import { DepartmentDto } from './departments.dto';

/** Departments of one municipality. Names are unique per municipality. */
@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  list(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true, primaryProjects: true } } },
    });
  }

  async create(user: AuthUser, tenantId: string, dto: DepartmentDto) {
    await this.ensureUniqueName(tenantId, dto.name);
    const d = await this.prisma.department.create({ data: { ...dto, tenantId } });
    await this.audit.log(user, 'department.create', 'Department', d.id, d.name);
    return d;
  }

  async update(user: AuthUser, tenantId: string, id: string, dto: DepartmentDto) {
    await this.ensure(tenantId, id);
    await this.ensureUniqueName(tenantId, dto.name, id);
    const d = await this.prisma.department.update({ where: { id }, data: dto });
    await this.audit.log(user, 'department.update', 'Department', id, d.name);
    return d;
  }

  async remove(user: AuthUser, tenantId: string, id: string) {
    const d = await this.ensure(tenantId, id);
    await this.prisma.department.delete({ where: { id } });
    await this.audit.log(user, 'department.delete', 'Department', id, d.name);
    return { ok: true };
  }

  private async ensure(tenantId: string, id: string) {
    const d = await this.prisma.department.findFirst({ where: { id, tenantId } });
    if (!d) throw new NotFoundException();
    return d;
  }

  private async ensureUniqueName(tenantId: string, name: string, exceptId?: string) {
    const clash = await this.prisma.department.findFirst({ where: { tenantId, name, ...(exceptId ? { id: { not: exceptId } } : {}) } });
    if (clash) throw new ConflictException({ code: 'DUPLICATE' });
  }
}
