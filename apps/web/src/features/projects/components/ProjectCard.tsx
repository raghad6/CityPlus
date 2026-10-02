'use client';

import Link from 'next/link';
import { CheckCircle2, ClipboardEdit } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { daysFromNow, date } from '@/lib/format';
import { Button, Card, Progress } from '@/components/ui';
import type { StaffProject } from '@/features/dashboard/types';
import { isOpen } from '../types';
import { StatusBadge } from './StatusBadge';

/** A project card on the staff portal, with "update progress" and "mark complete" buttons. */
export function ProjectCard({ p }: { p: StaffProject }) {
  const { t, n, lang } = useI18n();
  const d = daysFromNow(p.dueDate);
  const open = isOpen(p.status);
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/portal/projects/${p.id}`} className="font-semibold leading-snug text-ink-900 hover:text-brand-700">{p.componentName}</Link>
        <StatusBadge status={p.status} />
      </div>
      <div className="mt-1 text-sm text-ink-500">{p.programName}</div>
      <div className="mt-4 flex items-center gap-3">
        <Progress value={p.completionPercent} className="flex-1" />
        <span className="text-sm font-semibold tabular-nums">{p.completionPercent}%</span>
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-ink-500">
        <span>{p.department ? n(p.department) : ''}</span>
        {d !== null && open && (
          <span className={d < 0 ? 'font-medium text-accent-700' : ''}>
            {d === 0 ? t('dash.dueToday') : d > 0 ? t('dash.dueIn', { n: d }) : t('dash.lateBy', { n: -d })}
          </span>
        )}
        {!open && <span>{t('portal.lastUpdate', { d: date(lang, p.updatedAt) })}</span>}
      </div>
      {open && (
        <div className="mt-4 flex gap-2 border-t border-ink-100 pt-4">
          <Link href={`/portal/projects/${p.id}/report`} className="flex-1">
            <Button size="sm" className="w-full" icon={<ClipboardEdit className="h-4 w-4" />}>{t('portal.update')}</Button>
          </Link>
          <Link href={`/portal/projects/${p.id}/report?complete=1`}>
            <Button size="sm" variant="secondary" icon={<CheckCircle2 className="h-4 w-4" />}>{t('portal.markComplete')}</Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
