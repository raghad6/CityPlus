'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import { Button, Card, Empty, Loading, PageHeader } from '@/components/ui';
import { useReports, useWithdrawReport } from '@/features/reports/hooks';
import { ReportBadge } from '@/features/reports/components/ReportBadge';

export default function MyReports() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useReports();
  const withdraw = useWithdrawReport({ success: t('reports.withdrawn') });

  return (
    <>
      <PageHeader title={t('nav.myReports')} />
      <Card>
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty icon={<FileText className="h-6 w-6" />} title={t('reports.empty')} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <Link href={`/portal/projects/${r.projectId}`} className="font-medium text-ink-900 hover:text-brand-700">{r.project?.componentName}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <ReportBadge status={r.status} />
                    <span>{date(lang, r.createdAt, true)}</span>
                    {r.payload.status && <span>· {t(`status.${r.payload.status}`)}</span>}
                    {r.payload.completionPercent != null && <span>· {r.payload.completionPercent}%</span>}
                  </div>
                  {r.reviewNote && (
                    <div className={`mt-2 rounded-lg px-3 py-2 text-sm ${r.status === 'REJECTED' ? 'bg-red-50 text-red-800' : 'bg-ink-50 text-ink-700'}`}>
                      <span className="font-medium">{t('reports.reviewNote')}:</span> {r.reviewNote}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {r.status === 'PENDING' && (
                    <Button size="sm" variant="secondary" loading={withdraw.isPending && withdraw.variables === r.id} disabled={withdraw.isPending} onClick={() => withdraw.mutate(r.id)}>
                      {t('reports.withdraw')}
                    </Button>
                  )}
                  {r.status === 'REJECTED' && (
                    <Link href={`/portal/projects/${r.projectId}/report`}>
                      <Button size="sm">{t('projects.submitReport')}</Button>
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
