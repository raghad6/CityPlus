'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import { Avatar, Button, Card, CardHeader, ConfirmModal, Field, Input, Loading, PageHeader, Select, Toggle } from '@/components/ui';
import { useMe } from '@/features/auth/hooks';
import { useDepartments } from '@/features/departments/hooks';
import { useAllProjects } from '@/features/projects/hooks';
import { StatusBadge } from '@/features/projects/components/StatusBadge';
import { useAssignProjects, useDeleteUser, useResetPassword, useUpdateUser, useUser } from '@/features/users/hooks';
import type { UpdateUserInput } from '@/features/users/types';
import { UserStatusBadge } from '@/features/users/components/UserStatusBadge';

export default function UserPage({ params }: { params: { id: string } }) {
  const { t, n, lang } = useI18n();
  const router = useRouter();
  const { data: me } = useMe();
  const { data: departments = [] } = useDepartments();
  const { data: user, isLoading } = useUser(params.id);
  const projects = useAllProjects();

  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'STAFF', departmentId: '', status: 'ACTIVE' });
  const [assigned, setAssigned] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [pq, setPq] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name, email: user.email, phone: user.phone ?? '', role: user.role,
      departmentId: user.department?.id ?? '', status: user.status,
    });
    setAssigned(user.projectIds ?? []);
  }, [user]);

  const save = useUpdateUser(params.id, { success: t('common.saved') });
  const saveProjects = useAssignProjects(params.id, { success: t('common.saved') });
  const reset = useResetPassword(params.id, { success: t('users.passwordReset'), onSuccess: () => setPassword('') });
  const del = useDeleteUser(params.id, { success: t('users.deleted'), onSuccess: () => router.replace('/admin/users') });

  if (isLoading || !user) return <Loading />;
  const isSelf = me?.id === user.id;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...assigned, id] : assigned.filter((x) => x !== id);
    setAssigned(next);
    saveProjects.mutate(next);
  };
  const projectList = (projects.data?.items ?? []).filter((p) => !pq || p.componentName.includes(pq) || p.programName.includes(pq));

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/users" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
            <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {t('users.title')}
          </Link>
        }
        title={
          <span className="flex items-center gap-3">
            <Avatar name={user.name} className="h-11 w-11 text-base" /> {user.name}
          </span>
        }
        subtitle={`${user.email} · ${user.lastLoginAt ? `${t('users.lastLogin')}: ${date(lang, user.lastLoginAt, true)}` : t('users.never')}`}
        actions={<UserStatusBadge status={user.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={t('users.account')} />
            <div className="space-y-4 p-5">
              <Field label={t('auth.name')}><Input value={form.name} onChange={set('name')} /></Field>
              <Field label={t('auth.email')}><Input type="email" value={form.email} onChange={set('email')} /></Field>
              <Field label={t('auth.phone')}><Input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} /></Field>
              <Field label={t('auth.department')}>
                <Select value={form.departmentId} onChange={set('departmentId')}>
                  <option value="">{t('common.none')}</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{n(d)}</option>)}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('users.role')}>
                  <Select value={form.role} onChange={set('role')} disabled={isSelf}>
                    <option value="STAFF">{t('role.STAFF')}</option>
                    <option value="ADMIN">{t('role.ADMIN')}</option>
                  </Select>
                </Field>
                <Field label={t('users.status')}>
                  <Select value={form.status} onChange={set('status')} disabled={isSelf}>
                    <option value="ACTIVE">{t('userStatus.ACTIVE')}</option>
                    <option value="PENDING">{t('userStatus.PENDING')}</option>
                    <option value="DISABLED">{t('userStatus.DISABLED')}</option>
                  </Select>
                </Field>
              </div>
              <Button className="w-full" loading={save.isPending} onClick={() => save.mutate({ ...form, departmentId: form.departmentId || null, phone: form.phone || undefined } as UpdateUserInput)}>{t('common.saveChanges')}</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('users.security')} />
            <div className="space-y-3 p-5">
              <Field label={t('users.newPassword')} hint={t('auth.passwordShort')}>
                <Input type="text" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </Field>
              <Button variant="secondary" disabled={password.length < 8} loading={reset.isPending} onClick={() => reset.mutate(password)}>
                {t('users.resetPassword')}
              </Button>
            </div>
          </Card>

          {!isSelf && (
            <Card className="border-red-100 p-5">
              <div className="font-semibold text-red-700">{t('users.dangerZone')}</div>
              <p className="mt-1 text-sm text-ink-500">{t('users.dangerBody')}</p>
              <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmDelete(true)}>{t('common.delete')}</Button>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-3">
          <CardHeader title={t('users.projects')} subtitle={t('users.projectsHint')} />
          <div className="p-5 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-ink-400" />
              <Input value={pq} onChange={(e) => setPq(e.target.value)} placeholder={t('projects.searchPh')} className="ps-9" />
            </div>
          </div>
          {projects.isLoading ? (
            <Loading />
          ) : (
            <ul className="max-h-[640px] divide-y divide-ink-100 overflow-y-auto px-5 pb-4">
              {projectList.map((p) => {
                const on = assigned.includes(p.id);
                return (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-sm font-medium text-ink-800">{p.componentName}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                        <StatusBadge status={p.status} />
                        <span className="truncate">{p.department ? n(p.department) : ''}</span>
                      </div>
                    </div>
                    <Toggle checked={on} onChange={(v) => toggle(p.id, v)} label={p.componentName} disabled={saveProjects.isPending} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => del.mutate(undefined)}
        loading={del.isPending}
        title={`${t('common.delete')}: ${user.name}`}
        body={t('users.dangerBody')}
      />
    </>
  );
}
