'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, MailCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useErrorMessage } from '@/lib/query';
import { Button, Field, Input, Select } from '@/components/ui';
import { usePublicDepartments, usePublicTenants, useSignup } from '@/features/auth/hooks';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

export default function SignupPage() {
  const { t, n } = useI18n();
  const errMsg = useErrorMessage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', tenantSlug: '', departmentId: '' });
  const [error, setError] = useState('');
  const signup = useSignup();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value, ...(k === 'tenantSlug' ? { departmentId: '' } : {}) }));

  const tenants = usePublicTenants();
  const deps = usePublicDepartments(form.tenantSlug);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError(t('auth.passwordShort'));
    if (form.password !== form.confirm) return setError(t('auth.passwordMismatch'));
    const { confirm: _confirm, ...body } = form;
    signup.mutate(
      { ...body, departmentId: body.departmentId || undefined, phone: body.phone || undefined },
      { onError: (err) => setError(errMsg(err, ['auth'])) },
    );
  }

  if (signup.isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">{t('auth.signup.done')}</h1>
          <p className="mt-2 text-ink-500">{t('auth.signup.doneBody')}</p>
          <Link href="/login" className="mt-6 inline-block">
            <Button variant="secondary">{t('auth.login')}</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold text-ink-900">{t('auth.signup.title')}</h1>
      <p className="mt-2 text-ink-500">{t('auth.signup.subtitle')}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Field label={t('auth.name')}>
          <Input required minLength={2} value={form.name} onChange={set('name')} autoComplete="name" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.email')}>
            <Input type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
          </Field>
          <Field label={`${t('auth.phone')} (${t('common.optional')})`}>
            <Input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} autoComplete="tel" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.municipality')}>
            <Select required value={form.tenantSlug} onChange={set('tenantSlug')}>
              <option value="">{t('auth.selectMunicipality')}</option>
              {tenants.data?.map((x) => (
                <option key={x.slug} value={x.slug}>{n(x)}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('auth.department')}>
            <Select required value={form.departmentId} onChange={set('departmentId')} disabled={!form.tenantSlug}>
              <option value="">{t('auth.selectDepartment')}</option>
              {deps.data?.map((d) => (
                <option key={d.id} value={d.id}>{n(d)}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.password')}>
            <Input type="password" required minLength={8} value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          <Field label={t('auth.confirmPassword')}>
            <Input type="password" required value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </Field>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={signup.isPending}>
          {t('auth.createAccount')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        {t('auth.haveAccount')}{' '}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">{t('auth.login')}</Link>
      </p>
    </AuthLayout>
  );
}
