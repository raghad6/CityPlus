'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Download, FileBarChart, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date, money } from '@/lib/format';
import { Badge, Button, Card, ConfirmModal, Empty, Loading, PageHeader } from '@/components/ui';
import { summariesApi } from '@/features/summaries/api';
import { useDeleteSummary, useSummaries } from '@/features/summaries/hooks';
import { CreateSummaryModal } from '@/features/summaries/components/CreateSummaryModal';
import { periodLabel } from '@/features/summaries/period';
import type { SummaryKind } from '@/features/summaries/types';

const KIND_STYLE: Record<SummaryKind, string> = {
  WEEKLY: 'bg-sky-50 text-sky-800',
  MONTHLY: 'bg-brand-50 text-brand-800',
  CUSTOM: 'bg-ink-100 text-ink-700',
};

export default function SummariesPage() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useSummaries();
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const del = useDeleteSummary({ success: t('summaries.deleted'), onSuccess: () => setToDelete(null) });

  return (
    <>
      <PageHeader
        title={t('nav.summaries')}
        subtitle={t('summaries.subtitle')}
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>{t('summaries.new')}</Button>}
      />
      <Card className="overflow-hidden">
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty icon={<FileBarChart className="h-6 w-6" />} title={t('summaries.empty')} body={t('summaries.emptyBody')}
            action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>{t('summaries.new')}</Button>} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <Link href={`/admin/summaries/${r.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={KIND_STYLE[r.kind]}>{t(`summaries.kind.${r.kind}`)}</Badge>
                    <span className="font-medium text-ink-900">{periodLabel(lang, r.periodStart, r.periodEnd)}</span>
                  </div>
                  {r.totals && (
                    <div className="mt-1 text-xs text-ink-500">
                      {t('summaries.line', { p: r.totals.projects, c: r.totals.avgCompletion, o: r.totals.overdue, s: money(lang, r.totals.spentK) })}
                    </div>
                  )}
                  <div className="mt-0.5 text-[11px] text-ink-400">
                    {t('summaries.createdAt')}: {date(lang, r.createdAt, true)} · {r.createdById ? t('summaries.manual') : t('summaries.auto')}
                  </div>
                </Link>
                <div className="flex shrink-0 gap-2">
                  <a href={summariesApi.exportUrl(r.id)}><Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />}>Excel</Button></a>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(r.id)} aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <CreateSummaryModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ConfirmModal open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && del.mutate(toDelete)} loading={del.isPending} title={t('summaries.deleteTitle')} />
    </>
  );
}
