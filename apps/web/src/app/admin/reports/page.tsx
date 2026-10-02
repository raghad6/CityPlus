'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import { Avatar, Card, Empty, Loading, PageHeader, Segmented } from '@/components/ui';
import { useReports } from '@/features/reports/hooks';
import type { ReportStatus } from '@/features/reports/types';
import { ReportBadge } from '@/features/reports/components/ReportBadge';

export default function ReportsPage() {
  const { t, n, lang } = useI18n();
  const [status, setStatus] = useState<ReportStatus>('PENDING');
  const { data, isLoading } = useReports({ status });
  const pending = useReports({ status: 'PENDING' });

  return (
    <>
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <div className="mb-4">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'PENDING', label: t('reportStatus.PENDING'), count: pending.data?.length },
            { value: 'APPROVED', label: t('reportStatus.APPROVED') },
            { value: 'REJECTED', label: t('reportStatus.REJECTED') },
          ]}
        />
      </div>
      <Card>
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty icon={<ClipboardCheck className="h-6 w-6" />} title={t('reports.empty')} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/reports/${r.id}`} className="flex flex-col gap-3 p-4 hover:bg-ink-50/70 sm:flex-row sm:items-center">
                  <Avatar name={r.author?.name ?? '?'} />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 font-medium text-ink-900">{r.project?.componentName}</div>
                    <div className="text-sm text-ink-500">
                      {t('reports.submittedBy', { name: r.author?.name ?? '' })}
                      {r.author?.department && ` · ${n(r.author.department)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {r.payload.completionPercent != null && (
                      <span className="tabular-nums text-ink-600">
                        {r.project?.completionPercent}% → <b className="text-brand-700">{r.payload.completionPercent}%</b>
                      </span>
                    )}
                    <ReportBadge status={r.status} />
                    <span className="text-xs text-ink-400">{date(lang, r.createdAt, true)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
