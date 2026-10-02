'use client';

import { ProjectDetail } from '@/features/projects/components/ProjectDetail';

export default function Page({ params }: { params: { id: string } }) {
  return <ProjectDetail id={params.id} area="admin" />;
}
