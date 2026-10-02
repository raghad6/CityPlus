'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Building2, FolderKanban, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useDeleteDepartment, useDepartments, useSaveDepartment } from '@/features/departments/hooks';
import type { Department } from '@/features/departments/types';
import { Badge, Button, Card, ConfirmModal, Empty, Field, Input, Loading, Modal, PageHeader } from '@/components/ui';

export default function DepartmentsPage() {
  const { t, n } = useI18n();
  const { data, isLoading } = useDepartments();
  const [editing, setEditing] = useState<Partial<Department> | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const save = useSaveDepartment({ success: t('common.saved'), onSuccess: () => setEditing(null) });
  const del = useDeleteDepartment({ success: t('common.saved'), onSuccess: () => setDeleting(null) });

  return (
    <>
      <PageHeader
        title={t('deps.title')}
        subtitle={t('deps.subtitle')}
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ name: '', nameEn: '', isExternal: false })}>{t('deps.add')}</Button>}
      />
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Card><Empty icon={<Building2 className="h-6 w-6" />} title={t('common.noResults')} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((d) => (
            <Card key={d.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink-900">{n(d)}</div>
                  {d.nameEn && d.name !== n(d) && <div className="text-xs text-ink-500">{d.name}</div>}
                  {d.nameEn && n(d) === d.name && <div className="text-xs text-ink-500" dir="ltr">{d.nameEn}</div>}
                  {d.isExternal && <Badge className="mt-1 bg-violet-50 text-violet-700">{t('deps.external')}</Badge>}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-ink-600">
                <Link href={`/admin/projects?departmentId=${d.id}`} className="inline-flex items-center gap-1.5 hover:text-brand-700">
                  <FolderKanban className="h-4 w-4" /> {t('deps.projects', { n: d._count?.primaryProjects ?? 0 })}
                </Link>
                <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {t('deps.users', { n: d._count?.users ?? 0 })}</span>
              </div>
              <div className="mt-4 flex gap-2 border-t border-ink-100 pt-3">
                <Button size="sm" variant="ghost" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(d)}>{t('common.edit')}</Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleting(d)}>
                  {t('common.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? t('deps.edit') : t('deps.add')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button disabled={(editing?.name ?? '').trim().length < 2} loading={save.isPending} onClick={() => editing && save.mutate({ id: editing.id, name: editing.name ?? '', nameEn: editing.nameEn || undefined, isExternal: !!editing.isExternal })}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('deps.name')}>
            <Input value={editing?.name ?? ''} onChange={(e) => setEditing((d) => ({ ...d, name: e.target.value }))} dir="rtl" />
          </Field>
          <Field label={t('deps.nameEn')}>
            <Input value={editing?.nameEn ?? ''} onChange={(e) => setEditing((d) => ({ ...d, nameEn: e.target.value }))} dir="ltr" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={!!editing?.isExternal} onChange={(e) => setEditing((d) => ({ ...d, isExternal: e.target.checked }))} />
            {t('deps.external')}
          </label>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && del.mutate(deleting.id)}
        loading={del.isPending}
        title={`${t('common.delete')}: ${deleting ? n(deleting) : ''}`}
      />
    </>
  );
}
