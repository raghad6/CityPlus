export type Plan = 'BASIC' | 'STANDARD' | 'PREMIUM';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED';

/** A municipality as the platform owner sees it. */
export interface Tenant {
  id: string; name: string; nameEn?: string | null; slug: string; city?: string | null; status: TenantStatus;
  plan: Plan; maxUsers: number; createdAt: string; _count: { users: number; projects: number; departments: number };
}

export interface TenantDetail extends Omit<Tenant, '_count'> {
  _count: { users: number; projects: number; departments: number; reports: number };
  users: { id: string; name: string; email: string; status: string; lastLoginAt?: string | null }[];
}

export interface PlatformStats { tenants: number; activeTenants: number; users: number; projects: number; reports: number }

export interface CreateTenantInput {
  name: string; nameEn?: string; slug: string; city?: string; plan: Plan; maxUsers: number; planYear: number;
  seedDefaultDepartments: boolean; adminName: string; adminEmail: string; adminPassword: string;
}

export interface UpdateTenantInput {
  name?: string; nameEn?: string; city?: string; plan?: Plan; maxUsers?: number; status?: TenantStatus;
}
