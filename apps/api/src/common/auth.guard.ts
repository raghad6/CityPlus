import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC } from './decorators';

export const COOKIE_NAME = 'cityplus_token';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    const token = req.cookies?.[COOKIE_NAME] ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
    if (!token) throw new UnauthorizedException();

    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }

    // Re-read the user so disabling a user or suspending a municipality takes effect immediately.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: { select: { status: true } } },
    });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException();
    if (user.role !== 'SUPER_ADMIN' && user.tenant?.status !== 'ACTIVE') {
      throw new UnauthorizedException('Municipality suspended');
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      departmentId: user.departmentId,
    };
    return true;
  }
}
