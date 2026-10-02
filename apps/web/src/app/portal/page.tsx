'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, FolderKanban, XCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import { Card, CardHeader, Empty, Loading, Stat } from '@/components/ui';
import { useMe } from '@/features/auth/hooks';
import { useStaffDashboard } from '@/features/dashboard/hooks';
import { Calendar } from '@/features/dashboard/components/Calendar';
import { isOpen } from '@/features/projects/types';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { ReportBadge } from '@/features/reports/components/ReportBadge';

export default function PortalHome() {
  const { t, lang } = useI18n();
  const { data: me } = useMe();
  const { data, isLoading } = useStaffDashboard();
  if (isLoading || !data) return <Loading />;
  const active = data.projects.filter((p) => isOpen(p.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{t('portal.welcome', { name: me?.name.split(' ')[0] ?? '' })}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('portal.subtitle')}</p>
      </div>

      {data.totals.rejectedReports > 0 && (
        <Link href="/portal/reports" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 hover:bg-red-100">
          <XCircle className="h-5 w-5" /> {data.totals.rejectedReports} · {t('portal.rejected')}
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t('portal.assigned')} value={data.totals.projects} icon={<FolderKanban className="h-5 w-5" />} href="/portal/projects" />
        <Stat label={t('portal.completed')} value={data.totals.completed} icon={<CheckCircle2 className="h-5 w-5" />} tone="sky" />
        <Stat label={t('portal.pending')} value={data.totals.pendingReports} icon={<Clock className="h-5 w-5" />} tone="amber" href="/portal/reports" />
        <Stat label={t('dash.overdue')} value={data.totals.overdue} icon={<AlertTriangle className="h-5 w-5" />} tone="accent" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">{t('portal.active')}</h2>
            <Link href="/portal/projects" className="text-sm font-medium text-brand-700 hover:underline">{t('common.viewAll')}</Link>
          </div>
          {active.length === 0 ? (
            <Card><Empty icon={<FolderKanban className="h-6 w-6" />} title={t('portal.noProjects')} body={t('portal.noProjectsBody')} /></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {active.slice(0, 6).map((p) => <ProjectCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <Calendar projectHref={(id) => `/portal/projects/${id}`} />
          <Card>
            <CardHeader title={t('portal.recentReports')} />
            <ul className="divide-y divide-ink-100 px-5 py-2">
              {data.reports.length === 0 && <li className="py-6 text-center text-sm text-ink-400">{t('reports.empty')}</li>}
              {data.reports.map((r) => (
                <li key={r.id} className="py-3">
                  <Link href={`/portal/projects/${r.project.id}`} className="line-clamp-1 text-sm font-medium text-ink-800 hover:text-brand-700">{r.project.componentName}</Link>
                  <div className="mt-1 flex items-center justify-between">
                    <ReportBadge status={r.status} />
                    <span className="text-xs text-ink-400">{date(lang, r.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
