'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import type { DictKey } from '@/lib/dict';
import { Avatar, Button, Card, Empty, Loading, PageHeader } from '@/components/ui';
import { useAuditLog } from '@/features/audit/hooks';

export default function ActivityPage() {
  const { t, lang } = useI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLog(page);
  return (
    <>
      <PageHeader title={t('activity.title')} subtitle={t('activity.subtitle')} />
      <Card>
        {isLoading ? (
          <Loading />
        ) : !data?.items.length ? (
          <Empty icon={<History className="h-6 w-6" />} title={t('common.noResults')} />
        ) : (
          <>
            <ul className="divide-y divide-ink-100">
              {data.items.map((l) => (
                <li key={l.id} className="flex items-start gap-3 px-5 py-3">
                  <Avatar name={l.user?.name ?? '⚙'} className="h-8 w-8 text-xs" />
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-medium text-ink-900">{l.user?.name ?? t('activity.system')}</span>{' '}
                    <span className="text-ink-600">{t(`action.${l.action}` as DictKey)}</span>
                    {l.summary && <div className="mt-0.5 line-clamp-2 text-xs text-ink-500">{l.summary}</div>}
                  </div>
                  <time className="shrink-0 text-xs tabular-nums text-ink-400">{date(lang, l.createdAt, true)}</time>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-1 border-t border-ink-100 px-4 py-3">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="previous">
                <ChevronRight className="h-4 w-4 ltr:rotate-180" />
              </Button>
              <span className="text-sm tabular-nums text-ink-500">{page}</span>
              <Button variant="ghost" size="sm" disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)} aria-label="next">
                <ChevronLeft className="h-4 w-4 ltr:rotate-180" />
              </Button>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
