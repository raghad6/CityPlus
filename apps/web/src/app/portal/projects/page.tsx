'use client';

import { useState } from 'react';
import { FolderKanban, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card, Empty, Input, Loading, PageHeader, Segmented } from '@/components/ui';
import { useStaffDashboard } from '@/features/dashboard/hooks';
import type { StaffProject } from '@/features/dashboard/types';
import { isOpen } from '@/features/projects/types';
import { ProjectCard } from '@/features/projects/components/ProjectCard';

export default function MyProjects() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'active' | 'done' | 'all'>('active');
  const [q, setQ] = useState('');
  const { data, isLoading } = useStaffDashboard();
  const all = data?.projects ?? [];
  const isDone = (p: StaffProject) => !isOpen(p.status);
  const list = all
    .filter((p) => (tab === 'all' ? true : tab === 'done' ? isDone(p) : !isDone(p)))
    .filter((p) => !q || p.componentName.includes(q) || p.programName.includes(q));

  return (
    <>
      <PageHeader title={t('nav.myProjects')} subtitle={t('portal.subtitle')} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: t('portal.active') },
            { value: 'done', label: t('portal.completed') },
            { value: 'all', label: t('common.all') },
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-ink-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} className="ps-9" />
        </div>
      </div>
      {isLoading ? (
        <Loading />
      ) : list.length === 0 ? (
        <Card><Empty icon={<FolderKanban className="h-6 w-6" />} title={all.length ? t('common.noResults') : t('portal.noProjects')} body={all.length ? undefined : t('portal.noProjectsBody')} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}
