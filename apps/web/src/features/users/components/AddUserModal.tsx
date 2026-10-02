'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button, Field, Input, Modal, Select } from '@/components/ui';
import { useDepartments } from '@/features/departments/hooks';
import { useCreateUser } from '../hooks';

/** Admin adds a user directly (active straight away, no approval needed). */
export function AddUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, n } = useI18n();
  const { data: departments = [] } = useDepartments();
  const empty = { name: '', email: '', password: '', role: 'STAFF', departmentId: '', phone: '' };
  const [form, setForm] = useState(empty);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const create = useCreateUser({ success: t('users.created'), onSuccess: () => { setForm(empty); onClose(); } });
  const valid = form.name.length >= 2 && form.email.includes('@') && form.password.length >= 8;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('users.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={!valid} loading={create.isPending} onClick={() => create.mutate({ ...form, role: form.role as 'ADMIN' | 'STAFF', departmentId: form.departmentId || undefined, phone: form.phone || undefined })}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('auth.name')}><Input value={form.name} onChange={set('name')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.email')}><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label={t('auth.phone')}><Input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.department')}>
            <Select value={form.departmentId} onChange={set('departmentId')}>
              <option value="">{t('auth.selectDepartment')}</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{n(d)}</option>)}
            </Select>
          </Field>
          <Field label={t('users.role')}>
            <Select value={form.role} onChange={set('role')}>
              <option value="STAFF">{t('role.STAFF')}</option>
              <option value="ADMIN">{t('role.ADMIN')}</option>
            </Select>
          </Field>
        </div>
        <Field label={t('auth.password')} hint={t('auth.passwordShort')}>
          <Input type="text" dir="ltr" value={form.password} onChange={set('password')} autoComplete="new-password" />
        </Field>
      </div>
    </Modal>
  );
}
