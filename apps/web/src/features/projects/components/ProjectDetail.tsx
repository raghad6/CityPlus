'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardEdit, Pencil, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { daysFromNow, date, money } from '@/lib/format';
import { Avatar, Badge, Button, Card, CardHeader, ConfirmModal, Loading, Progress } from '@/components/ui';
import { ReportBadge } from '@/features/reports/components/ReportBadge';
import { useDeleteProject, useProject } from '../hooks';
import { isOpen } from '../types';
import { StatusBadge } from './StatusBadge';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="whitespace-pre-line text-sm text-ink-900">{value ?? '—'}</dd>
    </div>
  );
}

/** Read-only project page. Admins get edit/delete/update buttons; staff get "submit report" on open projects. */
export function ProjectDetail({ id, area }: { id: string; area: 'admin' | 'portal' }) {
  const { t, n, lang } = useI18n();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: p, isLoading } = useProject(id);
  const del = useDeleteProject(id, { success: t('projects.deleted'), onSuccess: () => router.replace('/admin/projects') });

  if (isLoading || !p) return <Loading />;
  const d = daysFromNow(p.dueDate);
  const open = isOpen(p.status);
  const reportHref = `/${area}/projects/${p.id}/report`;
  const hasPending = p.reports?.some((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${area}/projects`} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
          <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {t(area === 'admin' ? 'nav.projects' : 'nav.myProjects')}
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={p.status} />
              {p.componentNumber && <Badge className="bg-ink-100 text-ink-600"><span dir="ltr">{p.componentNumber}</span></Badge>}
              {p.department && <Badge className="bg-brand-50 text-brand-800">{n(p.department)}</Badge>}
              {p.departments.map((x) => <Badge key={x.department.id} className="bg-ink-100 text-ink-600">{n(x.department)}</Badge>)}
            </div>
            <h1 className="text-2xl font-bold leading-snug text-ink-900">{p.componentName}</h1>
            <p className="mt-1 text-sm text-ink-500">{t('projects.program')}: {p.programName}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {area === 'admin' ? (
              <>
                <Button variant="secondary" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>{t('common.delete')}</Button>
                <Link href={reportHref}><Button variant="secondary" icon={<ClipboardEdit className="h-4 w-4" />}>{t('portal.update')}</Button></Link>
                <Link href={`/admin/projects/${p.id}/edit`}><Button icon={<Pencil className="h-4 w-4" />}>{t('projects.editProject')}</Button></Link>
              </>
            ) : (
              open && !hasPending && (
                <>
                  <Link href={`${reportHref}?complete=1`}><Button variant="secondary" icon={<CheckCircle2 className="h-4 w-4" />}>{t('portal.markComplete')}</Button></Link>
                  <Link href={reportHref}><Button icon={<ClipboardEdit className="h-4 w-4" />}>{t('projects.submitReport')}</Button></Link>
                </>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="text-sm text-ink-500">{t('projects.col.progress')}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{p.completionPercent}%</div>
          <Progress value={p.completionPercent} className="mt-2" />
        </Card>
        <Card className="p-5">
          <div className="text-sm text-ink-500">{t('dash.totalCost')}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{money(lang, p.totalCostK)}</div>
          <div className="mt-1 text-xs text-ink-500">{p.planYear}: {money(lang, p.yearCostK)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-ink-500">{t('dash.spent')}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{money(lang, p.spentK)}</div>
          {!!p.yearCostK && <Progress tone="brand" value={((p.spentK ?? 0) / p.yearCostK) * 100} className="mt-2" />}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-1.5 text-sm text-ink-500"><CalendarDays className="h-4 w-4" /> {t('projects.timeline')}</div>
          <div className="mt-1 text-sm tabular-nums">{date(lang, p.startDate)} – {date(lang, p.dueDate)}</div>
          {d !== null && open && (
            <div className={`mt-1 text-xs font-medium ${d < 0 ? 'text-accent-700' : 'text-ink-500'}`}>
              {d === 0 ? t('dash.dueToday') : d > 0 ? t('dash.dueIn', { n: d }) : t('dash.lateBy', { n: -d })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={t('projects.followup')} />
            <dl className="divide-y divide-ink-100 px-5 pb-3">
              <Row label={t('wiz.status')} value={<StatusBadge status={p.status} />} />
              <Row label={t('wiz.reasons')} value={p.nonExecutionReasons} />
              <Row label={t('wiz.spent', { year: p.planYear })} value={money(lang, p.spentK)} />
              <Row label={t('wiz.activities')} value={p.activities} />
            </dl>
          </Card>
          <Card>
            <CardHeader title={t('projects.evaluation')} />
            <dl className="divide-y divide-ink-100 px-5 pb-3">
              <Row label={t('wiz.level')} value={p.achievementLevel ? t(`level.${p.achievementLevel}`) : null} />
              <Row label={t('wiz.kpiName')} value={p.kpiName} />
              <Row label={`${t('wiz.kpiTarget')} / ${t('wiz.kpiActual')}`} value={p.kpiTarget || p.kpiActual ? `${p.kpiTarget ?? '—'} / ${p.kpiActual ?? '—'}` : null} />
              <Row label={t('wiz.evalNotes')} value={p.evaluationNotes} />
            </dl>
          </Card>
          <Card>
            <CardHeader title={t('projects.funding')} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-50 p-4">
                <div className="text-sm font-medium text-brand-800">{t('wiz.local')}</div>
                <div className="mt-1 text-xl font-bold tabular-nums">{money(lang, p.localContributionK)}</div>
                <div className="mt-1 text-xs text-ink-600">{p.localBudgetLine ?? '—'}</div>
              </div>
              <div className="rounded-xl bg-ink-50 p-4">
                <div className="text-sm font-medium text-ink-700">{t('wiz.partner')}</div>
                <div className="mt-1 text-xl font-bold tabular-nums">{money(lang, p.partnerContributionK)}</div>
                <div className="mt-1 text-xs text-ink-600">{p.partnerName ?? '—'}</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t('projects.team')} />
            <ul className="space-y-1 p-3">
              {!p.assignments?.length && <li className="px-2 py-4 text-center text-sm text-ink-400">{t('projects.noTeam')}</li>}
              {p.assignments?.map(({ user }) => (
                <li key={user.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <Avatar name={user.name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-800">{user.name}</div>
                    <div className="truncate text-xs text-ink-500">{user.department ? n(user.department) : user.email}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title={t('projects.history')} />
            <ol className="space-y-3 p-5">
              {!p.reports?.length && <li className="py-2 text-center text-sm text-ink-400">{t('projects.noReports')}</li>}
              {p.reports?.map((r) => {
                const inner = (
                  <div className="rounded-lg border border-ink-100 p-3 transition hover:border-brand-200">
                    <div className="flex items-center justify-between gap-2">
                      <ReportBadge status={r.status} />
                      <span className="text-xs text-ink-400">{date(lang, r.createdAt, true)}</span>
                    </div>
                    <div className="mt-2 text-sm text-ink-700">{t('reports.submittedBy', { name: r.author?.name ?? '' })}</div>
                    {r.payload.completionPercent != null && <div className="text-xs text-ink-500">{t('projects.col.progress')}: {r.payload.completionPercent}%</div>}
                    {r.reviewNote && <div className="mt-1 rounded bg-ink-50 px-2 py-1 text-xs text-ink-600">{r.reviewNote}</div>}
                  </div>
                );
                return (
                  <li key={r.id}>
                    {area === 'admin' ? <Link href={`/admin/reports/${r.id}`}>{inner}</Link> : inner}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => del.mutate(undefined)}
        loading={del.isPending}
        title={`${t('common.delete')}: ${p.componentName}`}
      />
    </div>
  );
}
