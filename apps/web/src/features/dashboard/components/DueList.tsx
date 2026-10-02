'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { daysFromNow } from '@/lib/format';
import { Card, CardHeader, Progress } from '@/components/ui';
import type { DueProject } from '../types';

/** A list of projects with their due date: red for overdue, amber for due soon. */
export function DueList({ title, items, tone }: { title: string; items: DueProject[]; tone: 'late' | 'soon' }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader title={title} />
      <ul className="divide-y divide-ink-100 px-5 py-2">
        {items.length === 0 && <li className="py-6 text-center text-sm text-ink-400">{t('common.none')}</li>}
        {items.map((p) => {
          const d = daysFromNow(p.dueDate) ?? 0;
          const label = d === 0 ? t('dash.dueToday') : d > 0 ? t('dash.dueIn', { n: d }) : t('dash.lateBy', { n: -d });
          return (
            <li key={p.id}>
              <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-3 py-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${tone === 'late' ? 'bg-accent-500' : 'bg-amber-500'}`} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm text-ink-800">{p.componentName}</span>
                  <Progress value={p.completionPercent} className="mt-1 h-1.5" />
                </span>
                <span className={`shrink-0 text-xs font-medium ${tone === 'late' ? 'text-accent-700' : 'text-amber-700'}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
