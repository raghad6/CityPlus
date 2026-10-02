import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators';
import { UpdateSettingsDto } from './settings.dto';

/** The signed-in admin's own municipality settings. */
@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  get(tenantId: string) {
    return this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      include: { _count: { select: { users: true } } },
    });
  }

  async update(user: AuthUser, tenantId: string, dto: UpdateSettingsDto) {
    const t = await this.prisma.tenant.update({ where: { id: tenantId }, data: dto });
    await this.audit.log(user, 'settings.update', 'Tenant', tenantId, JSON.stringify(dto));
    return t;
  }
}
