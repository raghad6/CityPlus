'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertTriangle, ArrowLeft, Banknote, ClipboardCheck, FolderKanban, Gauge, Plus, UserPlus,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '@/lib/i18n';
import { money, date } from '@/lib/format';
import type { DictKey } from '@/lib/dict';
import { Button, Card, CardHeader, Empty, Loading, Progress, Select, Stat } from '@/components/ui';
import { useMe } from '@/features/auth/hooks';
import { useAdminDashboard } from '@/features/dashboard/hooks';
import { Calendar } from '@/features/dashboard/components/Calendar';
import { DueList } from '@/features/dashboard/components/DueList';
import { STATUS_STYLE } from '@/features/projects/components/StatusBadge';

const short = (s: string, n = 22) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export default function AdminDashboard() {
  const { t, lang, dir, n } = useI18n();
  const { data: me } = useMe();
  const [year, setYear] = useState<string>('');
  const { data, isLoading } = useAdminDashboard(year);

  if (isLoading || !data) return <Loading />;
  const { totals } = data;
  const rtl = dir === 'rtl';
  const deptData = data.byDepartment.map((d) => ({
    name: short(d.departmentId ? n({ name: d.name, nameEn: d.nameEn }) : '—'),
    completion: d.avgCompletion,
    cost: d.totalCostK,
    spent: d.spentK,
    count: d.count,
  }));
  const statusData = data.byStatus.map((s) => ({ name: t(`status.${s.status}`), value: s.count, color: STATUS_STYLE[s.status].color }));
  const spentPct = totals.yearCostK ? Math.round((totals.spentK / totals.yearCostK) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{t('dash.welcome', { name: me?.name.split(' ')[0] ?? '' })}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('dash.subtitle', { year: year || me?.tenant?.planYear || '' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {data.years.length > 1 && (
            <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-36" aria-label={t('dash.planYear')}>
              <option value="">{t('common.all')}</option>
              {data.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          )}
          <Link href="/admin/projects/new">
            <Button icon={<Plus className="h-4 w-4" />}>{t('projects.new')}</Button>
          </Link>
        </div>
      </div>

      {/* Attention strip */}
      {(totals.pendingReports > 0 || totals.pendingUsers > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {totals.pendingReports > 0 && (
            <Link href="/admin/reports" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 hover:bg-amber-100">
              <ClipboardCheck className="h-5 w-5" />
              <span className="flex-1 text-sm font-medium">{totals.pendingReports} · {t('dash.pendingReports')}</span>
              <span className="text-sm font-semibold">{t('dash.reviewNow')}</span>
              <ArrowLeft className="h-4 w-4 ltr:rotate-180" />
            </Link>
          )}
          {totals.pendingUsers > 0 && (
            <Link href="/admin/users?status=PENDING" className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 hover:bg-sky-100">
              <UserPlus className="h-5 w-5" />
              <span className="flex-1 text-sm font-medium">{totals.pendingUsers} · {t('dash.pendingUsers')}</span>
              <span className="text-sm font-semibold">{t('dash.reviewNow')}</span>
              <ArrowLeft className="h-4 w-4 ltr:rotate-180" />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t('dash.totalProjects')} value={totals.projects} icon={<FolderKanban className="h-5 w-5" />} href="/admin/projects" />
        <Stat
          label={t('dash.avgCompletion')}
          value={`${totals.avgCompletion}%`}
          icon={<Gauge className="h-5 w-5" />}
          tone="sky"
          sub={<Progress value={totals.avgCompletion} className="mt-1.5 w-32" />}
        />
        <Stat
          label={t('dash.spent')}
          value={money(lang, totals.spentK)}
          icon={<Banknote className="h-5 w-5" />}
          tone="amber"
          sub={`${spentPct}% ${t('dash.ofYearBudget', { v: money(lang, totals.yearCostK) })}`}
        />
        <Stat
          label={t('dash.overdue')}
          value={totals.overdue}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="accent"
          href="/admin/projects?due=overdue"
          sub={`${t('dash.totalCost')}: ${money(lang, totals.totalCostK)}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={t('dash.byDepartment')} />
          <div className="h-80 px-2 pb-4 pt-2" dir="ltr">
            {deptData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} stroke="#eef0f0" />
                  <XAxis type="number" domain={[0, 100]} reversed={rtl} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: '#727d7d' }} />
                  <YAxis type="category" dataKey="name" width={170} orientation={rtl ? 'right' : 'left'} tick={{ fontSize: 12, fill: '#3d4444' }} />
                  <Tooltip formatter={(v) => [`${v}%`, t('dash.avgCompletion')]} cursor={{ fill: '#f7f8f8' }} />
                  <Bar dataKey="completion" fill="#1a7a64" radius={[4, 4, 4, 4]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty title={t('common.noResults')} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title={t('dash.byStatus')} />
          <div className="h-80 pb-4" dir="ltr">
            {statusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={2} stroke="none">
                    {statusData.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, direction: dir }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty title={t('common.noResults')} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={t('dash.budget')}
            subtitle={`${t('dash.fundingSplit')}: ${t('dash.local')} ${money(lang, totals.localContributionK)} · ${t('dash.partner')} ${money(lang, totals.partnerContributionK)}`}
          />
          <div className="h-80 px-2 pb-4 pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rtl ? [...deptData].reverse() : deptData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="#eef0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#3d4444' }} interval={0} height={60} angle={-20} textAnchor="end" />
                <YAxis orientation={rtl ? 'right' : 'left'} tick={{ fontSize: 12, fill: '#727d7d' }} tickFormatter={(v) => money(lang, Number(v))} width={64} />
                <Tooltip formatter={(v) => money(lang, Number(v))} cursor={{ fill: '#f7f8f8' }} />
                <Legend wrapperStyle={{ fontSize: 12, direction: dir }} />
                <Bar dataKey="cost" name={t('dash.totalCost')} fill="#b3e4d3" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name={t('dash.spent')} fill="#1a7a64" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Calendar projectHref={(id) => `/admin/projects/${id}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DueList title={t('dash.overdueList')} items={data.overdue} tone="late" />
        <DueList title={t('dash.upcoming')} items={data.upcoming} tone="soon" />
        <Card>
          <CardHeader title={t('dash.recent')} action={<Link href="/admin/activity" className="text-sm font-medium text-brand-700 hover:underline">{t('common.viewAll')}</Link>} />
          <ul className="divide-y divide-ink-100 px-5 py-2">
            {data.recent.length === 0 && <li className="py-6 text-center text-sm text-ink-400">{t('common.none')}</li>}
            {data.recent.map((r) => (
              <li key={r.id} className="py-2.5 text-sm">
                <span className="font-medium text-ink-800">{r.user?.name ?? t('activity.system')}</span>{' '}
                <span className="text-ink-600">{t(`action.${r.action}` as DictKey)}</span>
                {r.summary && <div className="line-clamp-1 text-xs text-ink-500">{r.summary}</div>}
                <div className="text-xs text-ink-400">{date(lang, r.createdAt, true)}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
