import { http } from '@/lib/http';
import type { CreateTenantInput, PlatformStats, Tenant, TenantDetail, UpdateTenantInput } from './types';

export const platformApi = {
  stats: () => http.get<PlatformStats>('/platform/stats'),
  tenants: () => http.get<Tenant[]>('/platform/tenants'),
  tenant: (id: string) => http.get<TenantDetail>(`/platform/tenants/${id}`),
  create: (body: CreateTenantInput) => http.post<Tenant>('/platform/tenants', body),
  update: (id: string, body: UpdateTenantInput) => http.patch<Tenant>(`/platform/tenants/${id}`, body),
};
