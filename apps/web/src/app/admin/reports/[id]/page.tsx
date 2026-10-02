'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import { Avatar, Button, Card, CardHeader, Field, Loading, Modal, PageHeader, Textarea } from '@/components/ui';
import { useApproveReport, useRejectReport, useReport } from '@/features/reports/hooks';
import { formatField, REPORT_FIELDS } from '@/features/reports/report-fields';
import { ReportBadge } from '@/features/reports/components/ReportBadge';

export default function ReviewReportPage({ params }: { params: { id: string } }) {
  const { t, n, lang } = useI18n();
  const router = useRouter();
  const [note, setNote] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { data: r, isLoading } = useReport(params.id);
  const backToList = () => router.push('/admin/reports');
  const approve = useApproveReport(params.id, { success: t('reports.approved'), onSuccess: backToList });
  const reject = useRejectReport(params.id, { success: t('reports.rejected'), onSuccess: backToList });

  if (isLoading || !r) return <Loading />;
  const payload = r.payload as Record<string, unknown>;
  const project = r.project as unknown as Record<string, unknown>;
  const rows = REPORT_FIELDS.filter((f) => f.key in payload);

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/reports" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
            <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {t('reports.title')}
          </Link>
        }
        title={t('reports.newFor', { name: r.project.componentName })}
        actions={<ReportBadge status={r.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('reports.changes')} />
          <div className="overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-500">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">{t('reports.field')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('reports.current')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('reports.proposed')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((f) => {
                  const cur = formatField(f.kind, project[f.key], lang, t);
                  const next = formatField(f.kind, payload[f.key], lang, t);
                  const changed = r.status === 'PENDING' && cur !== next;
                  return (
                    <tr key={f.key} className={cn(changed && 'bg-amber-50/60')}>
                      <td className="w-1/4 px-3 py-2.5 align-top text-ink-600">{t(f.label)}</td>
                      <td className="px-3 py-2.5 align-top whitespace-pre-line text-ink-500">{r.status === 'PENDING' ? cur : '—'}</td>
                      <td className={cn('px-3 py-2.5 align-top whitespace-pre-line', changed ? 'font-medium text-ink-900' : 'text-ink-700')}>{next}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={r.author?.name ?? '?'} />
              <div>
                <div className="font-medium text-ink-900">{r.author?.name}</div>
                <div className="text-xs text-ink-500">{r.author?.department ? n(r.author.department) : r.author?.email}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-ink-500">{date(lang, r.createdAt, true)}</div>
            <Link href={`/admin/projects/${r.projectId}`} className="mt-3 block text-sm font-medium text-brand-700 hover:underline">
              {r.project.componentName}
            </Link>
          </Card>

          {r.status === 'PENDING' ? (
            <Card className="space-y-4 p-5">
              <Field label={t('reports.note')}>
                <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <div className="flex gap-2">
                <Button className="flex-1" icon={<Check className="h-4 w-4" />} loading={approve.isPending} disabled={reject.isPending} onClick={() => approve.mutate(note)}>
                  {t('reports.approve')}
                </Button>
                <Button variant="secondary" className="flex-1" icon={<X className="h-4 w-4" />} onClick={() => setRejectOpen(true)}>
                  {t('reports.reject')}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-5 text-sm">
              {r.reviewer && <div className="text-ink-600">{t('reports.reviewedBy', { name: r.reviewer.name })} · {date(lang, r.reviewedAt, true)}</div>}
              {r.reviewNote && <div className="mt-2 rounded-lg bg-ink-50 p-3 text-ink-700">{r.reviewNote}</div>}
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={t('reports.reject')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" disabled={reason.trim().length < 2} loading={reject.isPending} onClick={() => reject.mutate(reason)}>
              {t('reports.reject')}
            </Button>
          </>
        }
      >
        <Field label={t('reports.rejectReason')} required>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </Field>
      </Modal>
    </>
  );
}
