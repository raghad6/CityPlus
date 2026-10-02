'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Loading, PageHeader } from '@/components/ui';
import { useMe } from '@/features/auth/hooks';
import { useProject, useUpdateProject } from '@/features/projects/hooks';
import { ProjectWizard } from '@/features/projects/components/ProjectWizard';

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const { t } = useI18n();
  const router = useRouter();
  const { data: me } = useMe();
  const { data: p, isLoading } = useProject(params.id);
  const save = useUpdateProject(params.id, { success: t('projects.updated'), onSuccess: () => router.replace(`/admin/projects/${params.id}`) });
  if (isLoading || !p) return <Loading />;
  return (
    <>
      <PageHeader
        back={
          <Link href={`/admin/projects/${p.id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
            <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {p.componentName}
          </Link>
        }
        title={t('projects.editProject')}
      />
      <ProjectWizard
        mode="admin"
        project={p}
        planYear={me?.tenant?.planYear ?? new Date().getFullYear()}
        onSubmit={(d) => save.mutate(d)}
        submitting={save.isPending}
        submitLabel={t('common.saveChanges')}
      />
    </>
  );
}
