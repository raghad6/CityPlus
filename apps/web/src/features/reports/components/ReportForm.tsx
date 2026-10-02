'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Loading, PageHeader } from '@/components/ui';
import { useMe } from '@/features/auth/hooks';
import { useProject } from '@/features/projects/hooks';
import { ProjectWizard } from '@/features/projects/components/ProjectWizard';
import { useSubmitReport } from '../hooks';

/** Progress report: staff (or admin) update steps 2–4; step 1 stays locked. */
export function ReportForm({ id, area }: { id: string; area: 'admin' | 'portal' }) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { data: me } = useMe();
  const { data: p, isLoading } = useProject(id);
  const submit = useSubmitReport(id, {
    onSuccess: (r) => {
      toast.success(r.status === 'PENDING' ? t('reports.submittedPending') : t('reports.submittedApplied'));
      router.replace(`/${area}/projects/${id}`);
    },
  });

  if (isLoading || !p) return <Loading />;
  return (
    <>
      <PageHeader
        back={
          <Link href={`/${area}/projects/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
            <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {p.componentName}
          </Link>
        }
        title={t('reports.new')}
        subtitle={p.componentName}
      />
      <ProjectWizard
        mode="report"
        project={p}
        planYear={me?.tenant?.planYear ?? new Date().getFullYear()}
        initialStatus={params.get('complete') ? 'COMPLETED' : undefined}
        onSubmit={(data) => submit.mutate(data)}
        submitting={submit.isPending}
        submitLabel={t('common.submit')}
      />
    </>
  );
}
