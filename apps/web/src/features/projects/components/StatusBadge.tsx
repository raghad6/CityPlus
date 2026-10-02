'use client';

import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui';
import type { ProjectStatus } from '../types';

/** Colour of each project status: `badge` for pills, `color` for charts and the calendar. */
export const STATUS_STYLE: Record<ProjectStatus, { badge: string; color: string }> = {
  NOT_STARTED: { badge: 'bg-ink-100 text-ink-700', color: '#9aa4a4' },
  IN_PROGRESS: { badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200', color: '#0284c7' },
  PARTIAL: { badge: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200', color: '#f59e0b' },
  COMPLETED: { badge: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200', color: '#1a7a64' },
  POSTPONED: { badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', color: '#8b5cf6' },
  STOPPED: { badge: 'bg-accent-50 text-accent-700 ring-1 ring-accent-200', color: '#b4534b' },
  CANCELLED: { badge: 'bg-ink-800 text-white', color: '#3d4444' },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useI18n();
  return <Badge className={STATUS_STYLE[status].badge}>{t(`status.${status}`)}</Badge>;
}
