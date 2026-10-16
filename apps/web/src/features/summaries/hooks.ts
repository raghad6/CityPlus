'use client';

import { useQuery } from '@tanstack/react-query';
import { useAction, type ActionOptions } from '@/lib/query';
import { summariesApi } from './api';
import type { SummaryKind, SummaryReport } from './types';

export const summaryKeys = {
  all: ['summaries'] as const,
  detail: (id: string) => ['summaries', id] as const,
};

export function useSummaries() {
  return useQuery({ queryKey: summaryKeys.all, queryFn: summariesApi.list });
}

export function useSummary(id: string) {
  return useQuery({ queryKey: summaryKeys.detail(id), queryFn: () => summariesApi.get(id) });
}

export function useCreateSummary(opts?: ActionOptions<SummaryReport, { from: string; to: string; kind?: SummaryKind }>) {
  return useAction(summariesApi.create, { ...opts, invalidate: [summaryKeys.all] });
}

export function useDeleteSummary(opts?: ActionOptions<unknown, string>) {
  return useAction(summariesApi.remove, { ...opts, invalidate: [summaryKeys.all] });
}
