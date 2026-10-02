'use client';

import Link from 'next/link';
import { Building, ClipboardCheck, FolderKanban, Plus, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import { Badge, Button, Card, Loading, PageHeader, Stat } from '@/components/ui';
import { usePlatformStats, useTenants } from '@/features/platform/hooks';

export default function PlatformHome() {
  const { t, n, lang } = useI18n();
  const stats = usePlatformStats();
  const tenants = useTenants();
  if (stats.isLoading || tenants.isLoading) return <Loading />;
  const s: Partial<NonNullable<typeof stats.data>> = stats.data ?? {};
  return (
    <>
      <PageHeader
        title={t('platform.title')}
        subtitle={t('platform.subtitle')}
        actions={<Link href="/platform/tenants/new"><Button icon={<Plus className="h-4 w-4" />}>{t('platform.newTenant')}</Button></Link>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t('platform.tenants')} value={s.tenants ?? 0} sub={`${s.activeTenants ?? 0} ${t('platform.activeTenants')}`} icon={<Building className="h-5 w-5" />} />
        <Stat label={t('platform.users')} value={s.users ?? 0} icon={<Users className="h-5 w-5" />} tone="sky" />
        <Stat label={t('platform.projects')} value={s.projects ?? 0} icon={<FolderKanban className="h-5 w-5" />} tone="amber" />
        <Stat label={t('platform.reports')} value={s.reports ?? 0} icon={<ClipboardCheck className="h-5 w-5" />} tone="accent" />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('platform.tenants')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('settings.plan')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('platform.users')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('platform.projects')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('users.status')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('platform.createdAt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tenants.data?.map((x) => (
                <tr key={x.id} className="hover:bg-ink-50/70">
                  <td className="px-4 py-3">
                    <Link href={`/platform/tenants/${x.id}`} className="font-medium text-ink-900 hover:text-brand-700">{n(x)}</Link>
                    <div className="text-xs text-ink-500"><code>{x.slug}</code>{x.city ? ` · ${x.city}` : ''}</div>
                  </td>
                  <td className="px-4 py-3"><Badge className="bg-brand-50 text-brand-800">{t(`plan.${x.plan}`)}</Badge></td>
                  <td className="px-4 py-3 tabular-nums">{x._count.users} / {x.maxUsers}</td>
                  <td className="px-4 py-3 tabular-nums">{x._count.projects}</td>
                  <td className="px-4 py-3">
                    <Badge className={x.status === 'ACTIVE' ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'}>{t(`tenantStatus.${x.status}`)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{date(lang, x.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
