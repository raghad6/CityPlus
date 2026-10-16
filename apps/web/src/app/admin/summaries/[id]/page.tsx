'use client';

import Link from 'next/link';
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, Download, FolderKanban, Gauge, Printer, Wallet, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date, money } from '@/lib/format';
import { Badge, Button, Card, CardHeader, Loading, PageHeader, ProgressLabel, Stat } from '@/components/ui';
import { StatusBadge } from '@/features/projects/components/StatusBadge';
import { summariesApi } from '@/features/summaries/api';
import { useSummary } from '@/features/summaries/hooks';
import { periodLabel } from '@/features/summaries/period';
import type { SummaryRow } from '@/features/summaries/types';
import type { DictKey } from '@/lib/dict';

/** A list of projects (started, completed, due, overdue, upcoming) inside the report. */
function ProjectTable({ title, rows }: { title: DictKey; rows: SummaryRow[] }) {
  const { t, n, lang } = useI18n();
  return (
    <Card className="break-inside-avoid overflow-hidden">
      <CardHeader title={<>{t(title)} <span className="text-sm font-normal text-ink-400">({rows.length})</span></>} />
      {!rows.length ? (
        <p className="px-5 py-5 text-sm text-ink-400">{t('summaries.none')}</p>
      ) : (
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full text-sm">
            <thead className="text-xs text-ink-500">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{t('projects.col.project')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('projects.col.department')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('projects.col.status')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('projects.col.progress')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('projects.col.due')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('projects.col.cost')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-xs px-3 py-2"><Link href={`/admin/projects/${r.id}`} className="line-clamp-2 font-medium text-ink-900 hover:text-brand-700">{r.name}</Link></td>
                  <td className="px-3 py-2 text-ink-600">{r.department ? n({ name: r.department, nameEn: r.departmentEn }) : '—'}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status as any} /></td>
                  <td className="px-3 py-2"><ProgressLabel value={r.completionPercent} /></td>
                  <td className="px-3 py-2 tabular-nums text-ink-600">{date(lang, r.dueDate)}</td>
                  <td className="px-3 py-2 tabular-nums text-ink-600">{money(lang, r.totalCostK)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function SummaryPage({ params }: { params: { id: string } }) {
  const { t, n, lang } = useI18n();
  const { data: r, isLoading } = useSummary(params.id);
  if (isLoading || !r) return <Loading />;
  const d = r.data;
  const tt = d.totals;

  return (
    <div className="space-y-6">
      <PageHeader
        back={
          <Link href="/admin/summaries" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 print:hidden">
            <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {t('nav.summaries')}
          </Link>
        }
        title={<>{t(`summaries.kind.${r.kind}`)}: {periodLabel(lang, r.periodStart, r.periodEnd)}</>}
        subtitle={<>{n(d.tenant)} · {t('summaries.asOf', { date: date(lang, d.generatedAt, true) })}</>}
        actions={
          <div className="flex gap-2 print:hidden">
            <Button variant="secondary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>{t('summaries.print')}</Button>
            <a href={summariesApi.exportUrl(r.id)}><Button icon={<Download className="h-4 w-4" />}>{t('summaries.excel')}</Button></a>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('summaries.projects')} value={tt.projects} sub={t('summaries.openDone', { o: tt.open, c: tt.completed })} icon={<FolderKanban className="h-5 w-5" />} />
        <Stat label={t('summaries.avgCompletion')} value={`${tt.avgCompletion}%`} icon={<Gauge className="h-5 w-5" />} tone="sky" />
        <Stat label={t('summaries.spent')} value={money(lang, tt.spentK)} sub={tt.spentPct != null ? t('summaries.ofBudget', { p: tt.spentPct, b: money(lang, tt.yearCostK) }) : undefined} icon={<Wallet className="h-5 w-5" />} tone="amber" />
        <Stat label={t('summaries.overdue')} value={tt.overdue} icon={<AlertTriangle className="h-5 w-5" />} tone="accent" />
        <Stat label={t('summaries.started')} value={tt.startedInPeriod} icon={<CalendarClock className="h-5 w-5" />} />
        <Stat label={t('summaries.completed')} value={tt.completedInPeriod} icon={<CheckCircle2 className="h-5 w-5" />} />
        <Stat label={t('summaries.reports')} value={tt.reportsInPeriod} sub={t('summaries.reportsLine', { a: d.reports.approved, r: d.reports.rejected, p: d.reports.pending })} icon={<ClipboardCheck className="h-5 w-5" />} tone="sky" />
        <Stat label={t('summaries.funding')} value={money(lang, tt.localContributionK + tt.partnerContributionK)} sub={t('summaries.fundingLine', { l: money(lang, tt.localContributionK), p: money(lang, tt.partnerContributionK) })} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="break-inside-avoid">
          <CardHeader title={t('summaries.byStatus')} />
          <ul className="space-y-2 p-5">
            {d.byStatus.map((s) => (
              <li key={s.status} className="flex items-center justify-between text-sm">
                <StatusBadge status={s.status as any} />
                <span className="font-semibold tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="break-inside-avoid overflow-hidden lg:col-span-2">
          <CardHeader title={t('summaries.byDept')} />
          <div className="overflow-x-auto px-2 pb-3 pt-2">
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-500">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">{t('projects.col.department')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('summaries.projects')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('projects.col.progress')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('projects.col.cost')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('dash.spent')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {d.byDepartment.map((x, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-ink-800">{x.name ? n(x) : t('summaries.noDept')}</td>
                    <td className="px-3 py-2 tabular-nums">{x.count}</td>
                    <td className="px-3 py-2"><ProgressLabel value={x.avgCompletion} /></td>
                    <td className="px-3 py-2 tabular-nums">{money(lang, x.totalCostK)}</td>
                    <td className="px-3 py-2 tabular-nums">{money(lang, x.spentK)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ProjectTable title="summaries.list.started" rows={d.started} />
      <ProjectTable title="summaries.list.completed" rows={d.completed} />
      <ProjectTable title="summaries.list.due" rows={d.due} />
      <ProjectTable title="summaries.list.overdue" rows={d.overdue} />
      <ProjectTable title="summaries.list.upcoming" rows={d.upcoming} />

      <div>
        <Card className="break-inside-avoid">
          <CardHeader title={<>{t('summaries.reports')} <span className="text-sm font-normal text-ink-400">({d.reports.submitted})</span></>} />
          {!d.reports.items.length ? <p className="px-5 py-5 text-sm text-ink-400">{t('summaries.none')}</p> : (
            <ul className="divide-y divide-ink-100 px-5 pb-3">
              {d.reports.items.map((x, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0"><span className="block truncate text-ink-900">{x.project}</span><span className="text-xs text-ink-500">{x.author} · {date(lang, x.date)}</span></span>
                  <Badge className="shrink-0 bg-ink-100 text-ink-600">{t(`reportStatus.${x.status}` as DictKey)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
