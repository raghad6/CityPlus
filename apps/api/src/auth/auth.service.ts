import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators';
import { ChangePasswordDto, LoginDto, SignupDto, UpdateProfileDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private audit: AuditService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: { tenant: true },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }
    if (user.status === 'PENDING') throw new UnauthorizedException({ code: 'PENDING_APPROVAL' });
    if (user.status === 'DISABLED') throw new UnauthorizedException({ code: 'ACCOUNT_DISABLED' });
    if (user.role !== 'SUPER_ADMIN' && user.tenant?.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'TENANT_SUSPENDED' });
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role, tenantId: user.tenantId });
    return { token, user: await this.me(user.id) };
  }

  async signup(dto: SignupDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant || tenant.status !== 'ACTIVE') throw new BadRequestException({ code: 'TENANT_NOT_FOUND' });

    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException({ code: 'EMAIL_TAKEN' });

    if (dto.departmentId) {
      const dep = await this.prisma.department.findFirst({ where: { id: dto.departmentId, tenantId: tenant.id } });
      if (!dep) throw new BadRequestException({ code: 'DEPARTMENT_NOT_FOUND' });
    }
    const count = await this.prisma.user.count({ where: { tenantId: tenant.id } });
    if (count >= tenant.maxUsers) throw new BadRequestException({ code: 'USER_LIMIT_REACHED' });

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        phone: dto.phone,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: 'STAFF',
        status: 'PENDING',
        tenantId: tenant.id,
        departmentId: dto.departmentId || null,
      },
    });
    await this.audit.log(null, 'user.signup', 'User', user.id, `${user.name} <${user.email}>`, tenant.id);
    return { ok: true, status: 'PENDING' };
  }

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true, role: true, status: true, lastLoginAt: true,
        department: { select: { id: true, name: true, nameEn: true } },
        tenant: { select: { id: true, name: true, nameEn: true, slug: true, logoUrl: true, planYear: true, requireApproval: true, plan: true } },
      },
    });
  }

  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await bcrypt.compare(dto.currentPassword, u.passwordHash))) {
      throw new BadRequestException({ code: 'WRONG_PASSWORD' });
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) } });
    await this.audit.log(user, 'user.password', 'User', user.id);
    return { ok: true };
  }

  async updateProfile(user: AuthUser, dto: UpdateProfileDto) {
    await this.prisma.user.update({ where: { id: user.id }, data: { name: dto.name, phone: dto.phone } });
    return this.me(user.id);
  }
}
