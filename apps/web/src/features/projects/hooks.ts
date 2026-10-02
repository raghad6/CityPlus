'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAction, type ActionOptions } from '@/lib/query';
import { dashboardKeys } from '@/features/dashboard/hooks';
import { projectsApi } from './api';
import type { ImportResult, Project, ProjectFilters, ProjectInput } from './types';

export const projectKeys = {
  all: ['projects'] as const,
  list: (f: ProjectFilters) => ['projects', 'list', f] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

/** Data that changes when a project changes. */
const affected = [projectKeys.all, dashboardKeys.all];

export function useProjects(filters: ProjectFilters) {
  return useQuery({ queryKey: projectKeys.list(filters), queryFn: () => projectsApi.list(filters), placeholderData: keepPreviousData });
}

/** Every project, name-sorted: for pickers such as "projects this user follows". */
export function useAllProjects() {
  return useProjects({ pageSize: 200, sort: 'name' });
}

export function useProject(id: string) {
  return useQuery({ queryKey: projectKeys.detail(id), queryFn: () => projectsApi.get(id) });
}

export function useCreateProject(opts?: ActionOptions<Project, ProjectInput>) {
  return useAction(projectsApi.create, { ...opts, invalidate: affected });
}

export function useUpdateProject(id: string, opts?: ActionOptions<Project, ProjectInput>) {
  return useAction((body: ProjectInput) => projectsApi.update(id, body), { ...opts, invalidate: affected });
}

export function useDeleteProject(id: string, opts?: ActionOptions) {
  return useAction(() => projectsApi.remove(id), { ...opts, invalidate: affected });
}

export function useImportProjects(opts?: ActionOptions<ImportResult, File>) {
  return useAction(projectsApi.import, { ...opts, invalidate: affected });
}
