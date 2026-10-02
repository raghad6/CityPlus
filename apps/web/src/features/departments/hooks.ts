'use client';

import { useQuery } from '@tanstack/react-query';
import { useAction, type ActionOptions } from '@/lib/query';
import { dashboardKeys } from '@/features/dashboard/hooks';
import { departmentsApi } from './api';
import type { DepartmentInput } from './types';

export const departmentKeys = { all: ['departments'] as const };

const affected = [departmentKeys.all, dashboardKeys.all];

export function useDepartments() {
  return useQuery({ queryKey: departmentKeys.all, queryFn: departmentsApi.list, staleTime: 60_000 });
}

/** Creates a department, or updates it when an id is given. */
export function useSaveDepartment(opts?: ActionOptions<unknown, DepartmentInput & { id?: string }>) {
  return useAction(
    ({ id, ...body }: DepartmentInput & { id?: string }) => (id ? departmentsApi.update(id, body) : departmentsApi.create(body)),
    { ...opts, invalidate: affected },
  );
}

export function useDeleteDepartment(opts?: ActionOptions<unknown, string>) {
  return useAction(departmentsApi.remove, { ...opts, invalidate: affected });
}
