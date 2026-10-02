'use client';

import { useQuery } from '@tanstack/react-query';
import { useAction, type ActionOptions } from '@/lib/query';
import { dashboardKeys } from '@/features/dashboard/hooks';
import { projectKeys } from '@/features/projects/hooks';
import type { ProjectInput } from '@/features/projects/types';
import { reportsApi } from './api';
import type { Report, ReportFilters } from './types';

export const reportKeys = {
  all: ['reports'] as const,
  list: (f: ReportFilters) => ['reports', 'list', f] as const,
  detail: (id: string) => ['reports', 'detail', id] as const,
};

/** A report decision can change the project, so refresh projects and dashboards too. */
const affected = [reportKeys.all, projectKeys.all, dashboardKeys.all];

/** Admins get every report; staff only get their own (the API decides). */
export function useReports(filters: ReportFilters = {}) {
  return useQuery({ queryKey: reportKeys.list(filters), queryFn: () => reportsApi.list(filters) });
}

export function useReport(id: string) {
  return useQuery({ queryKey: reportKeys.detail(id), queryFn: () => reportsApi.get(id) });
}

export function useSubmitReport(projectId: string, opts?: ActionOptions<Report, ProjectInput>) {
  return useAction((body: ProjectInput) => reportsApi.submit(projectId, body), { ...opts, invalidate: affected });
}

export function useApproveReport(id: string, opts?: ActionOptions<unknown, string | undefined>) {
  return useAction((note: string | undefined) => reportsApi.approve(id, note), { ...opts, invalidate: affected });
}

export function useRejectReport(id: string, opts?: ActionOptions<unknown, string>) {
  return useAction((note: string) => reportsApi.reject(id, note), { ...opts, invalidate: affected });
}

export function useWithdrawReport(opts?: ActionOptions<unknown, string>) {
  return useAction(reportsApi.withdraw, { ...opts, invalidate: affected });
}
