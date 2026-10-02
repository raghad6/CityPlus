'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAction, type ActionOptions } from '@/lib/query';
import { settingsApi } from './api';
import type { SettingsInput, TenantSettings } from './types';

export const settingsKeys = { all: ['settings'] as const };

export function useSettings() {
  return useQuery({ queryKey: settingsKeys.all, queryFn: settingsApi.get });
}

/** Settings (plan year, municipality name…) show up everywhere, so refresh all cached data after saving. */
export function useSaveSettings(opts?: ActionOptions<TenantSettings, SettingsInput>) {
  const qc = useQueryClient();
  return useAction(settingsApi.update, {
    ...opts,
    onSuccess: (r, v) => { qc.invalidateQueries(); opts?.onSuccess?.(r, v); },
  });
}
