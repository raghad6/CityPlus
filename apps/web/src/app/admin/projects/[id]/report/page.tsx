'use client';

import { Suspense } from 'react';
import { ReportForm } from '@/features/reports/components/ReportForm';
import { Loading } from '@/components/ui';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<Loading />}>
      <ReportForm id={params.id} area="admin" />
    </Suspense>
  );
}
