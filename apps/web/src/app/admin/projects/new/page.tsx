'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { PageHeader } from '@/components/ui';
import { useMe } from '@/features/auth/hooks';
import { useCreateProject } from '@/features/projects/hooks';
import { ProjectWizard } from '@/features/projects/components/ProjectWizard';

export default function NewProjectPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: me } = useMe();
  const create = useCreateProject({ success: t('projects.created'), onSuccess: (p) => router.replace(`/admin/projects/${p.id}`) });
  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/projects" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
            <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {t('nav.projects')}
          </Link>
        }
        title={t('nav.newProject')}
      />
      <ProjectWizard
        mode="admin"
        planYear={me?.tenant?.planYear ?? new Date().getFullYear()}
        onSubmit={(d) => create.mutate(d)}
        submitting={create.isPending}
      />
    </>
  );
}
