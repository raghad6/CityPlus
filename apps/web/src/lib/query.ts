'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from './http';
import { useI18n } from './i18n';
import type { DictKey } from './dict';

/** What a screen can add to an action: the success message and what happens next. */
export interface ActionOptions<TRes = unknown, TVars = void> {
  success?: string;
  onSuccess?: (result: TRes, vars: TVars) => void;
}

/** Translate an API error into a friendly message, looking up `<prefix>.err.<CODE>` keys. */
export function useErrorMessage() {
  const { t } = useI18n();
  return (e: unknown, prefixes: string[] = ['auth', 'users', 'reports', 'profile', 'platform', 'common']) => {
    if (e instanceof ApiError && e.code) {
      for (const p of prefixes) {
        const key = `${p}.err.${e.code}` as DictKey;
        const msg = t(key);
        if (msg !== key) return msg;
      }
    }
    if (e instanceof ApiError && e.status === 400 && e.message) return e.message;
    return t('common.error');
  };
}

/** Mutation helper: runs `fn`, refreshes the cached data in `invalidate`, and shows a toast. */
export function useAction<TVars = void, TRes = unknown>(
  fn: (v: TVars) => Promise<TRes>,
  opts: ActionOptions<TRes, TVars> & { invalidate?: QueryKey[] } = {},
) {
  const qc = useQueryClient();
  const errMsg = useErrorMessage();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r, v) => {
      if (opts.success) toast.success(opts.success);
      opts.invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      opts.onSuccess?.(r, v);
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}
