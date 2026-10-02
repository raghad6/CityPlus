'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { auditApi } from './api';

export const auditKeys = { page: (page: number) => ['audit', page] as const };

export function useAuditLog(page: number) {
  return useQuery({ queryKey: auditKeys.page(page), queryFn: () => auditApi.list(page), placeholderData: keepPreviousData });
}
