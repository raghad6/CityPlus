'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Check, Search, UserPlus, Users, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { date } from '@/lib/format';
import { Avatar, Badge, Button, Card, CardHeader, Empty, Input, Loading, PageHeader, Select } from '@/components/ui';
import { useDepartments } from '@/features/departments/hooks';
import { useApproveUser, useDeclineUser, usePendingUsers, useUsers } from '@/features/users/hooks';
import { AddUserModal } from '@/features/users/components/AddUserModal';
import { UserStatusBadge } from '@/features/users/components/UserStatusBadge';

function UsersList() {
  const { t, n, lang } = useI18n();
  const params = useSearchParams();
  const { data: departments = [] } = useDepartments();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(params.get('status') === 'PENDING' ? '' : params.get('status') ?? '');
  const [departmentId, setDepartmentId] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const { data: users, isLoading } = useUsers({ q, status, departmentId });
  const pending = usePendingUsers();
  const approve = useApproveUser({ success: t('users.approved') });
  const decline = useDeclineUser({ success: t('users.deleted') });
  /** The pending user whose request is being sent: their buttons stay disabled until it finishes (no double clicks). */
  const busyId = approve.isPending ? approve.variables : decline.isPending ? decline.variables : null;

  const list = (users ?? []).filter((u) => u.status !== 'PENDING' || status === 'PENDING');

  return (
    <>
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={<Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>{t('users.add')}</Button>}
      />

      {!!pending.data?.length && (
        <Card className="mb-6 border-amber-200">
          <CardHeader title={<span className="flex items-center gap-2">{t('users.pendingTitle')} <Badge className="bg-amber-100 text-amber-800">{pending.data.length}</Badge></span>} />
          <ul className="divide-y divide-ink-100 p-2">
            {pending.data.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <Avatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink-900">{u.name}</div>
                  <div className="text-sm text-ink-500"><span dir="ltr">{u.email}</span>{u.department && ` · ${n(u.department)}`}</div>
                </div>
                <div className="text-xs text-ink-400">{date(lang, u.createdAt)}</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    icon={<Check className="h-4 w-4" />}
                    loading={approve.isPending && busyId === u.id}
                    disabled={!!busyId}
                    onClick={() => approve.mutate(u.id)}
                  >
                    {t('users.approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<X className="h-4 w-4" />}
                    loading={decline.isPending && busyId === u.id}
                    disabled={!!busyId}
                    onClick={() => decline.mutate(u.id)}
                  >
                    {t('users.decline')}
                  </Button>
                  <Link href={`/admin/users/${u.id}`}><Button size="sm" variant="ghost">{t('common.view')}</Button></Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('users.searchPh')} className="ps-9" />
          </div>
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">{t('projects.filterDept')}: {t('common.all')}</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{n(d)}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('users.status')}: {t('common.all')}</option>
            <option value="ACTIVE">{t('userStatus.ACTIVE')}</option>
            <option value="DISABLED">{t('userStatus.DISABLED')}</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <Loading />
        ) : !list.length ? (
          <Empty icon={<Users className="h-6 w-6" />} title={t('common.noResults')} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {list.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="flex flex-col gap-3 px-4 py-3.5 hover:bg-ink-50/70 sm:flex-row sm:items-center">
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink-900">{u.name}</div>
                    <div className="truncate text-sm text-ink-500">
                      <span dir="ltr">{u.email}</span>{u.department && ` · ${n(u.department)}`}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge className={u.role === 'ADMIN' ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-700'}>{t(`role.${u.role}`)}</Badge>
                    <UserStatusBadge status={u.status} />
                    <span className="text-xs text-ink-500">{t('users.projectsCount', { n: u._count?.assignments ?? 0 })}</span>
                    <span className="hidden w-28 text-end text-xs text-ink-400 md:block">{u.lastLoginAt ? date(lang, u.lastLoginAt) : t('users.never')}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <UsersList />
    </Suspense>
  );
}
