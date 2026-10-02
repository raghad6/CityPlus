'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Badge, Button, Card, CardHeader, Field, Input, Loading, PageHeader, Progress, Toggle } from '@/components/ui';
import { useSaveSettings, useSettings } from '@/features/settings/hooks';

export default function SettingsPage() {
  const { t } = useI18n();
  const { data, isLoading } = useSettings();
  const [form, setForm] = useState({ name: '', nameEn: '', city: '', logoUrl: '', planYear: '', requireApproval: true });
  useEffect(() => {
    if (data) setForm({ name: data.name, nameEn: data.nameEn ?? '', city: data.city ?? '', logoUrl: data.logoUrl ?? '', planYear: String(data.planYear), requireApproval: data.requireApproval });
  }, [data]);
  const save = useSaveSettings({ success: t('common.saved') });
  if (isLoading || !data) return <Loading />;
  const set = (k: 'name' | 'nameEn' | 'city' | 'logoUrl' | 'planYear') => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.name')}><Input value={form.name} onChange={set('name')} /></Field>
              <Field label={t('settings.nameEn')}><Input dir="ltr" value={form.nameEn} onChange={set('nameEn')} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.city')}><Input value={form.city} onChange={set('city')} /></Field>
              <Field label={t('settings.planYear')}><Input type="number" min={2000} max={2100} value={form.planYear} onChange={set('planYear')} /></Field>
            </div>
            <Field label={t('settings.logo')}><Input dir="ltr" type="url" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://" /></Field>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-ink-50 p-4">
              <span className="text-sm text-ink-800">{t('settings.requireApproval')}</span>
              <Toggle checked={form.requireApproval} onChange={(v) => setForm((f) => ({ ...f, requireApproval: v }))} />
            </div>
            <Button loading={save.isPending} onClick={() => save.mutate({ ...form, planYear: Number(form.planYear), nameEn: form.nameEn || undefined, city: form.city || undefined, logoUrl: form.logoUrl || undefined })}>{t('common.saveChanges')}</Button>
          </div>
        </Card>
        <Card>
          <CardHeader title={t('settings.subscription')} />
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">{t('settings.plan')}</span>
              <Badge className="bg-brand-700 text-white">{t(`plan.${data.plan}`)}</Badge>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-ink-500">{t('platform.users')}</span>
                <span className="tabular-nums text-ink-800">{t('settings.usersUsed', { n: data._count.users, max: data.maxUsers })}</span>
              </div>
              <Progress tone="brand" value={(data._count.users / data.maxUsers) * 100} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">{t('platform.slug')}</span>
              <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">{data.slug}</code>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
