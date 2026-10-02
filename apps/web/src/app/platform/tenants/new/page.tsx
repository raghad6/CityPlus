'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useCreateTenant } from '@/features/platform/hooks';
import type { Plan } from '@/features/platform/types';
import { Button, Card, CardHeader, Field, Input, PageHeader, Select } from '@/components/ui';

export default function NewTenant() {
  const { t } = useI18n();
  const router = useRouter();
  const [f, setF] = useState({
    name: '', nameEn: '', slug: '', city: '', plan: 'STANDARD', maxUsers: '50', planYear: String(new Date().getFullYear()),
    seedDefaultDepartments: true, adminName: '', adminEmail: '', adminPassword: '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const create = useCreateTenant({ success: t('platform.created'), onSuccess: (r) => router.replace(`/platform/tenants/${r.id}`) });
  const submit = () => create.mutate({
    ...f, plan: f.plan as Plan, maxUsers: Number(f.maxUsers), planYear: Number(f.planYear), nameEn: f.nameEn || undefined, city: f.city || undefined,
  });
  const valid = f.name.length >= 2 && /^[a-z0-9-]{2,40}$/.test(f.slug) && f.adminName.length >= 2 && f.adminEmail.includes('@') && f.adminPassword.length >= 8;

  return (
    <>
      <PageHeader title={t('platform.newTenant')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('platform.tenants')} />
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.name')}><Input value={f.name} onChange={set('name')} placeholder="بلدية الخليل" /></Field>
              <Field label={t('settings.nameEn')}><Input dir="ltr" value={f.nameEn} onChange={set('nameEn')} placeholder="Hebron Municipality" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('platform.slug')} hint={t('platform.slugHint')}>
                <Input dir="ltr" value={f.slug} onChange={(e) => setF((x) => ({ ...x, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
              </Field>
              <Field label={t('settings.city')}><Input value={f.city} onChange={set('city')} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t('settings.plan')}>
                <Select value={f.plan} onChange={set('plan')}>
                  {(['BASIC', 'STANDARD', 'PREMIUM'] as const).map((p) => <option key={p} value={p}>{t(`plan.${p}`)}</option>)}
                </Select>
              </Field>
              <Field label={t('platform.maxUsers')}><Input type="number" min={1} value={f.maxUsers} onChange={set('maxUsers')} /></Field>
              <Field label={t('settings.planYear')}><Input type="number" value={f.planYear} onChange={set('planYear')} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.seedDefaultDepartments} onChange={(e) => setF((x) => ({ ...x, seedDefaultDepartments: e.target.checked }))} />
              {t('platform.seedDeps')}
            </label>
          </div>
        </Card>
        <Card>
          <CardHeader title={t('platform.firstAdmin')} />
          <div className="space-y-4 p-5">
            <Field label={t('auth.name')}><Input value={f.adminName} onChange={set('adminName')} /></Field>
            <Field label={t('auth.email')}><Input type="email" value={f.adminEmail} onChange={set('adminEmail')} /></Field>
            <Field label={t('auth.password')} hint={t('auth.passwordShort')}><Input dir="ltr" value={f.adminPassword} onChange={set('adminPassword')} autoComplete="new-password" /></Field>
            <Button className="w-full" disabled={!valid} loading={create.isPending} onClick={submit}>{t('platform.newTenant')}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
