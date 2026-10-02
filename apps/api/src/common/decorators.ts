import { createParamDecorator, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string | null;
  departmentId: string | null;
}

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});

/** Tenant id of the signed-in user. Throws for platform users without a tenant. */
export const TenantId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const user: AuthUser = ctx.switchToHttp().getRequest().user;
  if (!user?.tenantId) throw new ForbiddenException('No municipality context');
  return user.tenantId;
});
