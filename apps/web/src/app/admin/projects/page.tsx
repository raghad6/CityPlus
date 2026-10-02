'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FolderKanban, MessageSquareWarning, Plus, Search, Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';
import { daysFromNow, date, money } from '@/lib/format';
import { Button, Card, Empty, Input, Loading, PageHeader, ProgressLabel, Select } from '@/components/ui';
import { useDepartments } from '@/features/departments/hooks';
import { projectsApi } from '@/features/projects/api';
import { useProjects } from '@/features/projects/hooks';
import { isOpen, PROJECT_STATUSES } from '@/features/projects/types';
import { ImportModal } from '@/features/projects/components/ImportModal';
import { StatusBadge } from '@/features/projects/components/StatusBadge';

function ProjectsList() {
  const { t, n, lang } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { data: departments = [] } = useDepartments();
  const [importOpen, setImportOpen] = useState(false);

  const filters = {
    q: params.get('q') ?? '',
    status: params.get('status') ?? '',
    departmentId: params.get('departmentId') ?? '',
    due: params.get('due') ?? '',
    sort: params.get('sort') ?? 'updated',
    page: Number(params.get('page') ?? 1),
  };
  const [q, setQ] = useState(filters.q);

  const update = (patch: Partial<typeof filters>) => {
    const next = { ...filters, page: 1, ...patch };
    const sp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && !(k === 'page' && v === 1) && !(k === 'sort' && v === 'updated') && sp.set(k, String(v)));
    const str = sp.toString();
    router.replace(`/admin/projects${str ? `?${str}` : ''}`);
  };

  useEffect(() => {
    const id = setTimeout(() => q !== filters.q && update({ q }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const { data, isLoading } = useProjects({ ...filters, pageSize: 20 });

  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;
  const { page: _p, sort: _s, ...exportFilters } = filters;

  return (
    <>
      <PageHeader
        title={t('projects.title')}
        subtitle={t('projects.subtitle')}
        actions={
          <>
            <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => setImportOpen(true)}>{t('common.import')}</Button>
            <a href={projectsApi.exportUrl(exportFilters)}>
              <Button variant="secondary" icon={<Download className="h-4 w-4" />}>{t('common.export')}</Button>
            </a>
            <Link href="/admin/projects/new">
              <Button icon={<Plus className="h-4 w-4" />}>{t('projects.new')}</Button>
            </Link>
          </>
        }
      />

      <Card className="mb-4 p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_repeat(4,minmax(0,170px))]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('projects.searchPh')} className="ps-9" />
          </div>
          <Select value={filters.status} onChange={(e) => update({ status: e.target.value })} aria-label={t('projects.filterStatus')}>
            <option value="">{t('projects.filterStatus')}: {t('common.all')}</option>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </Select>
          <Select value={filters.departmentId} onChange={(e) => update({ departmentId: e.target.value })} aria-label={t('projects.filterDept')}>
            <option value="">{t('projects.filterDept')}: {t('common.all')}</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{n(d)}</option>)}
          </Select>
          <Select value={filters.due} onChange={(e) => update({ due: e.target.value })} aria-label={t('projects.filterDue')}>
            <option value="">{t('projects.filterDue')}: {t('common.all')}</option>
            <option value="overdue">{t('projects.dueOverdue')}</option>
            <option value="soon">{t('projects.dueSoon')}</option>
          </Select>
          <Select value={filters.sort} onChange={(e) => update({ sort: e.target.value })} aria-label={t('projects.sort')}>
            {(['updated', 'name', 'due', 'progress', 'cost'] as const).map((s) => (
              <option key={s} value={s}>{t('projects.sort')}: {t(`projects.sort.${s}`)}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <Loading />
        ) : !data?.items.length ? (
          <Empty
            icon={<FolderKanban className="h-6 w-6" />}
            title={t('projects.empty')}
            body={t('projects.emptyBody')}
            action={<Link href="/admin/projects/new"><Button icon={<Plus className="h-4 w-4" />}>{t('projects.new')}</Button></Link>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">{t('projects.col.project')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('projects.col.department')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('projects.col.status')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('projects.col.progress')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('projects.col.cost')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('projects.col.due')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {data.items.map((p) => {
                    const d = daysFromNow(p.dueDate);
                    const late = d !== null && d < 0 && isOpen(p.status);
                    return (
                      <tr key={p.id} className="cursor-pointer hover:bg-ink-50/70" onClick={() => router.push(`/admin/projects/${p.id}`)}>
                        <td className="max-w-md px-4 py-3">
                          <div className="flex items-center gap-2">
                            {p.componentNumber && <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600" dir="ltr">{p.componentNumber}</span>}
                            <Link href={`/admin/projects/${p.id}`} className="line-clamp-1 font-medium text-ink-900 hover:text-brand-700" onClick={(e) => e.stopPropagation()}>
                              {p.componentName}
                            </Link>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                            <span className="line-clamp-1">{p.programName}</span>
                            {!!p._count?.reports && (
                              <span className="inline-flex shrink-0 items-center gap-1 text-amber-700">
                                <MessageSquareWarning className="h-3.5 w-3.5" /> {t('projects.pendingReports', { n: p._count.reports })}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-700">{p.department ? n(p.department) : '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3"><ProgressLabel value={p.completionPercent} /></td>
                        <td className="px-4 py-3 tabular-nums text-ink-700">{money(lang, p.totalCostK)}</td>
                        <td className={cn('px-4 py-3 tabular-nums', late ? 'font-medium text-accent-700' : 'text-ink-600')}>{date(lang, p.dueDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="divide-y divide-ink-100 md:hidden">
              {data.items.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/projects/${p.id}`} className="block space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-ink-900">{p.componentName}</div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-xs text-ink-500">{p.department ? n(p.department) : '—'} · {date(lang, p.dueDate)}</div>
                    <ProgressLabel value={p.completionPercent} />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 text-sm text-ink-500">
              <span>{t('projects.showing', { from, to, total: data.total })}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" disabled={data.page <= 1} onClick={() => update({ page: data.page - 1 })} aria-label="previous">
                  <ChevronRight className="h-4 w-4 ltr:rotate-180" />
                </Button>
                <Button variant="ghost" size="sm" disabled={to >= data.total} onClick={() => update({ page: data.page + 1 })} aria-label="next">
                  <ChevronLeft className="h-4 w-4 ltr:rotate-180" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProjectsList />
    </Suspense>
  );
}
