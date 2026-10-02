'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAction, type ActionOptions } from '@/lib/query';
import { authApi } from './api';
import type { ChangePasswordInput, Me, ProfileInput } from './types';

export const authKeys = {
  me: ['me'] as const,
  publicTenants: ['public', 'tenants'] as const,
  publicDepartments: (slug: string) => ['public', 'departments', slug] as const,
};

export function useMe() {
  return useQuery({ queryKey: authKeys.me, queryFn: authApi.me, staleTime: 60_000 });
}

/** Signs in and caches the user, so the next page doesn't need to load it again. */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: authApi.login, onSuccess: ({ user }) => qc.setQueryData(authKeys.me, user) });
}

export function useSignup() {
  return useMutation({ mutationFn: authApi.signup });
}

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  return async () => {
    await authApi.logout().catch(() => undefined);
    qc.clear();
    router.replace('/login');
  };
}

export function useUpdateProfile(opts?: ActionOptions<Me, ProfileInput>) {
  const qc = useQueryClient();
  return useAction(authApi.updateProfile, {
    ...opts,
    onSuccess: (me, v) => { qc.setQueryData(authKeys.me, me); opts?.onSuccess?.(me, v); },
  });
}

export function useChangePassword(opts?: ActionOptions<unknown, ChangePasswordInput>) {
  return useAction(authApi.changePassword, opts);
}

export function usePublicTenants() {
  return useQuery({ queryKey: authKeys.publicTenants, queryFn: authApi.publicTenants });
}

export function usePublicDepartments(slug: string) {
  return useQuery({ queryKey: authKeys.publicDepartments(slug), queryFn: () => authApi.publicDepartments(slug), enabled: !!slug });
}
