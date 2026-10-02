import type { NamedRef, Role } from '@/lib/types';
import type { UserStatus } from '@/features/users/types';

/** The signed-in user, with their department and municipality. */
export interface Me {
  id: string; name: string; email: string; phone?: string | null; role: Role; status: UserStatus;
  department?: NamedRef | null;
  tenant?: { id: string; name: string; nameEn?: string | null; slug: string; logoUrl?: string | null; planYear: number; requireApproval: boolean; plan: string } | null;
}

export interface LoginInput { email: string; password: string }

export interface SignupInput {
  name: string; email: string; password: string; tenantSlug: string; departmentId?: string; phone?: string;
}

export interface ProfileInput { name: string; phone?: string }

export interface ChangePasswordInput { currentPassword: string; newPassword: string }

/** A municipality as listed on the public sign-up form. */
export interface PublicTenant { slug: string; name: string; nameEn?: string | null }

export interface PublicDepartment extends NamedRef { isExternal: boolean }
