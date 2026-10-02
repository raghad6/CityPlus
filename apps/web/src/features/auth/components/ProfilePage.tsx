'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useChangePassword, useMe, useUpdateProfile } from '../hooks';
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, Loading, PageHeader } from '@/components/ui';

export function ProfilePage() {
  const { t, n } = useI18n();
  const { data: me } = useMe();
  const [info, setInfo] = useState({ name: '', phone: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  useEffect(() => { if (me) setInfo({ name: me.name, phone: me.phone ?? '' }); }, [me]);

  const saveInfo = useUpdateProfile({ success: t('profile.updated') });
  const savePw = useChangePassword({
    success: t('profile.passwordChanged'), onSuccess: () => setPw({ currentPassword: '', newPassword: '', confirm: '' }),
  });

  if (!me) return <Loading />;
  const pwOk = pw.newPassword.length >= 8 && pw.newPassword === pw.confirm && pw.currentPassword.length > 0;

  return (
    <>
      <PageHeader title={t('profile.title')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('profile.info')} />
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <Avatar name={me.name} className="h-12 w-12 text-base" />
              <div className="min-w-0">
                <div className="truncate text-sm text-ink-600" dir="ltr">{me.email}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge className="bg-brand-700 text-white">{t(`role.${me.role}`)}</Badge>
                  {me.department && <Badge className="bg-white text-ink-700 ring-1 ring-ink-200">{n(me.department)}</Badge>}
                  {me.tenant && <Badge className="bg-white text-ink-700 ring-1 ring-ink-200">{n(me.tenant)}</Badge>}
                </div>
              </div>
            </div>
            <Field label={t('auth.name')}><Input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></Field>
            <Field label={t('auth.phone')}><Input type="tel" dir="ltr" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} /></Field>
            <Button loading={saveInfo.isPending} disabled={info.name.trim().length < 2} onClick={() => saveInfo.mutate({ name: info.name, phone: info.phone || undefined })}>{t('common.saveChanges')}</Button>
          </div>
        </Card>
        <Card>
          <CardHeader title={t('profile.changePassword')} />
          <div className="space-y-4 p-5">
            <Field label={t('profile.current')}>
              <Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" />
            </Field>
            <Field label={t('profile.new')} hint={t('auth.passwordShort')}>
              <Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" />
            </Field>
            <Field label={t('profile.confirm')} error={pw.confirm && pw.confirm !== pw.newPassword ? t('auth.passwordMismatch') : undefined}>
              <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
            </Field>
            <Button variant="secondary" disabled={!pwOk} loading={savePw.isPending} onClick={() => savePw.mutate({ currentPassword: pw.currentPassword, newPassword: pw.newPassword })}>{t('profile.changePassword')}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
