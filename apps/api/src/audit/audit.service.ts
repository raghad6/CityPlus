import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators';

/** The activity log: every important action is recorded here, and admins can page through it. */
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(user: AuthUser | null, action: string, entityType: string, entityId?: string, summary?: string, tenantId?: string | null) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: tenantId ?? user?.tenantId ?? null,
        userId: user?.id ?? null,
        action,
        entityType,
        entityId,
        summary,
      },
    });
  }

  async list(tenantId: string, page: number, pageSize: number) {
    const take = Math.min(pageSize || 30, 100);
    const skip = (Math.max(page || 1, 1) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.auditLog.count({ where: { tenantId } }),
    ]);
    return { items, total, page: Math.floor(skip / take) + 1, pageSize: take };
  }
}
