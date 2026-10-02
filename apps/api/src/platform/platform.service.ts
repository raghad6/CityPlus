import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators';
import { CreateTenantDto, UpdateTenantDto } from './platform.dto';
import { DEFAULT_DEPARTMENTS } from './default-departments';

/** Platform-owner tools: onboard municipalities, change plans and limits, suspend or activate them. */
@Injectable()
export class PlatformService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async stats() {
    const [tenants, activeTenants, users, projects, reports] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      this.prisma.project.count(),
      this.prisma.report.count(),
    ]);
    return { tenants, activeTenants, users, projects, reports };
  }

  tenants() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, projects: true, departments: true } } },
    });
  }

  async tenant(id: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, projects: true, departments: true, reports: true } },
        users: { where: { role: 'ADMIN' }, select: { id: true, name: true, email: true, status: true, lastLoginAt: true } },
      },
    });
    if (!t) throw new NotFoundException();
    return t;
  }

  /** Creates the municipality, its default departments and its first admin in one transaction. */
  async create(user: AuthUser, dto: CreateTenantDto) {
    if (await this.prisma.tenant.findUnique({ where: { slug: dto.slug } })) throw new ConflictException({ code: 'SLUG_TAKEN' });
    const adminEmail = dto.adminEmail.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email: adminEmail } })) throw new ConflictException({ code: 'EMAIL_TAKEN' });

    const tenant = await this.prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          name: dto.name, nameEn: dto.nameEn, slug: dto.slug, city: dto.city,
          plan: dto.plan, maxUsers: dto.maxUsers, planYear: dto.planYear ?? new Date().getFullYear(),
        },
      });
      if (dto.seedDefaultDepartments !== false) {
        await tx.department.createMany({ data: DEFAULT_DEPARTMENTS.map((d) => ({ ...d, tenantId: t.id })) });
      }
      await tx.user.create({
        data: {
          tenantId: t.id, name: dto.adminName, email: adminEmail,
          passwordHash: await bcrypt.hash(dto.adminPassword, 10), role: 'ADMIN', status: 'ACTIVE',
        },
      });
      return t;
    });
    await this.audit.log(user, 'tenant.create', 'Tenant', tenant.id, tenant.name, null);
    return tenant;
  }

  /** Also used to suspend (status SUSPENDED) and re-activate a municipality. */
  async update(user: AuthUser, id: string, dto: UpdateTenantDto) {
    const t = await this.prisma.tenant.update({ where: { id }, data: dto });
    await this.audit.log(user, 'tenant.update', 'Tenant', id, JSON.stringify(dto), null);
    return t;
  }
}
