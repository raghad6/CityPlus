'use client';

import { useQuery } from '@tanstack/react-query';
import { useAction, type ActionOptions } from '@/lib/query';
import { platformApi } from './api';
import type { CreateTenantInput, Tenant, UpdateTenantInput } from './types';

export const platformKeys = {
  all: ['platform'] as const,
  stats: ['platform', 'stats'] as const,
  tenants: ['platform', 'tenants'] as const,
  tenant: (id: string) => ['platform', 'tenants', id] as const,
};

export function usePlatformStats() {
  return useQuery({ queryKey: platformKeys.stats, queryFn: platformApi.stats });
}

export function useTenants() {
  return useQuery({ queryKey: platformKeys.tenants, queryFn: platformApi.tenants });
}

export function useTenant(id: string) {
  return useQuery({ queryKey: platformKeys.tenant(id), queryFn: () => platformApi.tenant(id) });
}

export function useCreateTenant(opts?: ActionOptions<Tenant, CreateTenantInput>) {
  return useAction(platformApi.create, { ...opts, invalidate: [platformKeys.all] });
}

/** Also used to suspend / re-activate a municipality. */
export function useUpdateTenant(id: string, opts?: ActionOptions<Tenant, UpdateTenantInput>) {
  return useAction((body: UpdateTenantInput) => platformApi.update(id, body), { ...opts, invalidate: [platformKeys.all] });
}
