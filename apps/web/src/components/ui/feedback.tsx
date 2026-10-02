'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';

/** Loading, empty and progress indicators. */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} />;
}

export function Loading() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-500">
      <Spinner /> {t('common.loading')}
    </div>
  );
}

export function Empty({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">{icon}</div>}
      <div className="font-semibold text-ink-800">{title}</div>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Progress({ value, className, tone }: { value: number; className?: string; tone?: 'auto' | 'brand' }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const color = tone === 'brand' ? 'bg-brand-600' : v >= 80 ? 'bg-brand-600' : v >= 40 ? 'bg-amber-500' : 'bg-accent-500';
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function ProgressLabel({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={value} className="w-20" />
      <span className="w-9 text-xs font-medium tabular-nums text-ink-700">{value}%</span>
    </div>
  );
}
