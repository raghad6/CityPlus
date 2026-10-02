'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, Loading, PageHeader, Select } from '@/components/ui';
import { useTenant, useUpdateTenant } from '@/features/platform/hooks';
import type { Plan } from '@/features/platform/types';

export default function TenantPage({ params }: { params: { id: string } }) {
  const { t, n, lang } = useI18n();
  const { data, isLoading } = useTenant(params.id);
  const [f, setF] = useState({ name: '', nameEn: '', city: '', plan: 'STANDARD', maxUsers: '50' });
  useEffect(() => {
    if (data) setF({ name: data.name, nameEn: data.nameEn ?? '', city: data.city ?? '', plan: data.plan, maxUsers: String(data.maxUsers) });
  }, [data]);
  const save = useUpdateTenant(params.id, { success: t('common.saved') });
  if (isLoading || !data) return <Loading />;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <>
      <PageHeader
        back={<Link href="/platform" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowRight className="h-4 w-4 ltr:rotate-180" /> {t('platform.tenants')}</Link>}
        title={n(data)}
        subtitle={<code>{data.slug}</code>}
        actions={
          <>
            <Badge className={data.status === 'ACTIVE' ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'}>{t(`tenantStatus.${data.status}`)}</Badge>
            <Button
              variant={data.status === 'ACTIVE' ? 'danger' : 'primary'}
              loading={save.isPending}
              onClick={() => save.mutate({ status: data.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
            >
              {data.status === 'ACTIVE' ? t('platform.suspend') : t('platform.activate')}
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('settings.title')} />
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.name')}><Input value={f.name} onChange={set('name')} /></Field>
              <Field label={t('settings.nameEn')}><Input dir="ltr" value={f.nameEn} onChange={set('nameEn')} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t('settings.city')}><Input value={f.city} onChange={set('city')} /></Field>
              <Field label={t('settings.plan')}>
                <Select value={f.plan} onChange={set('plan')}>
                  {(['BASIC', 'STANDARD', 'PREMIUM'] as const).map((p) => <option key={p} value={p}>{t(`plan.${p}`)}</option>)}
                </Select>
              </Field>
              <Field label={t('platform.maxUsers')}><Input type="number" min={1} value={f.maxUsers} onChange={set('maxUsers')} /></Field>
            </div>
            <Button loading={save.isPending} onClick={() => save.mutate({ ...f, plan: f.plan as Plan, maxUsers: Number(f.maxUsers), nameEn: f.nameEn || undefined, city: f.city || undefined })}>
              {t('common.saveChanges')}
            </Button>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title={t('platform.usage')} />
            <dl className="grid grid-cols-2 gap-4 p-5 text-sm">
              <div><dt className="text-ink-500">{t('platform.users')}</dt><dd className="text-xl font-bold tabular-nums">{data._count.users}</dd></div>
              <div><dt className="text-ink-500">{t('platform.projects')}</dt><dd className="text-xl font-bold tabular-nums">{data._count.projects}</dd></div>
              <div><dt className="text-ink-500">{t('nav.departments')}</dt><dd className="text-xl font-bold tabular-nums">{data._count.departments}</dd></div>
              <div><dt className="text-ink-500">{t('platform.reports')}</dt><dd className="text-xl font-bold tabular-nums">{data._count.reports}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title={t('platform.admins')} />
            <ul className="space-y-1 p-3">
              {data.users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <Avatar name={u.name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="truncate text-xs text-ink-500" dir="ltr">{u.email}</div>
                    <div className="text-xs text-ink-400">{u.lastLoginAt ? date(lang, u.lastLoginAt, true) : t('users.never')}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
