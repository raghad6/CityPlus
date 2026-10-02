'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useErrorMessage } from '@/lib/query';
import { Button, Field, Input } from '@/components/ui';
import { useLogin } from '@/features/auth/hooks';
import { homeFor } from '@/features/auth/roles';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const errMsg = useErrorMessage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useLogin();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { user } = await login.mutateAsync({ email, password });
      const home = homeFor(user.role);
      const next = params.get('next');
      router.replace(next && next.startsWith(home) ? next : home);
      router.refresh();
    } catch (err) {
      setError(errMsg(err, ['auth']));
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-ink-900">{t('auth.login.title')}</h1>
      <p className="mt-2 text-ink-500">{t('auth.login.subtitle')}</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Field label={t('auth.email')}>
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@municipality.ps" />
        </Field>
        <Field label={t('auth.password')}>
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={login.isPending || login.isSuccess}>
          {t('auth.login')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        {t('auth.noAccount')}{' '}
        <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
          {t('auth.createAccount')}
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
