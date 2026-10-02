'use client';

import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui';
import type { ReportStatus } from '../types';

export function ReportBadge({ status }: { status: ReportStatus }) {
  const { t } = useI18n();
  const cls = { PENDING: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200', APPROVED: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200', REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200' }[status];
  return <Badge className={cls}>{t(`reportStatus.${status}`)}</Badge>;
}
