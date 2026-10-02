import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Read-only lookups for visitors who aren't signed in (the sign-up form). Only active municipalities. */
@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  tenants() {
    return this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, name: true, nameEn: true, logoUrl: true },
      orderBy: { name: 'asc' },
    });
  }

  async departments(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.status !== 'ACTIVE') throw new NotFoundException();
    return this.prisma.department.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true, nameEn: true, isExternal: true },
      orderBy: { name: 'asc' },
    });
  }
}
