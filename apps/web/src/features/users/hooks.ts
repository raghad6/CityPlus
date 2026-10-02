'use client';

import { useQuery } from '@tanstack/react-query';
import { useAction, type ActionOptions } from '@/lib/query';
import { dashboardKeys } from '@/features/dashboard/hooks';
import { projectKeys } from '@/features/projects/hooks';
import { usersApi } from './api';
import type { CreateUserInput, UpdateUserInput, User, UserFilters } from './types';

export const userKeys = {
  all: ['users'] as const,
  list: (f: UserFilters) => ['users', 'list', f] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};

/** The dashboard counts pending users, so refresh it whenever users change. */
const affected = [userKeys.all, dashboardKeys.all];

export function useUsers(filters: UserFilters = {}, { enabled = true } = {}) {
  return useQuery({ queryKey: userKeys.list(filters), queryFn: () => usersApi.list(filters), enabled });
}

export function usePendingUsers() {
  return useUsers({ status: 'PENDING' });
}

export function useUser(id: string) {
  return useQuery({ queryKey: userKeys.detail(id), queryFn: () => usersApi.get(id) });
}

export function useCreateUser(opts?: ActionOptions<User, CreateUserInput>) {
  return useAction(usersApi.create, { ...opts, invalidate: affected });
}

export function useUpdateUser(id: string, opts?: ActionOptions<User, UpdateUserInput>) {
  return useAction((body: UpdateUserInput) => usersApi.update(id, body), { ...opts, invalidate: affected });
}

/** Approve a pending sign-up: the user becomes ACTIVE and can sign in. */
export function useApproveUser(opts?: ActionOptions<User, string>) {
  return useAction((id: string) => usersApi.update(id, { status: 'ACTIVE' }), { ...opts, invalidate: affected });
}

/** Decline a pending sign-up: the request is deleted. */
export function useDeclineUser(opts?: ActionOptions<unknown, string>) {
  return useAction(usersApi.remove, { ...opts, invalidate: affected });
}

export function useAssignProjects(id: string, opts?: ActionOptions<{ projectIds: string[] }, string[]>) {
  return useAction((ids: string[]) => usersApi.assignProjects(id, ids), { ...opts, invalidate: [...affected, projectKeys.all] });
}

export function useResetPassword(id: string, opts?: ActionOptions<unknown, string>) {
  return useAction((password: string) => usersApi.resetPassword(id, password), opts);
}

export function useDeleteUser(id: string, opts?: ActionOptions) {
  return useAction(() => usersApi.remove(id), { ...opts, invalidate: affected });
}
