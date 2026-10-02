'use client';

import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui';
import type { UserStatus } from '../types';

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const { t } = useI18n();
  const cls = { PENDING: 'bg-amber-50 text-amber-800', ACTIVE: 'bg-brand-50 text-brand-700', DISABLED: 'bg-ink-100 text-ink-600' }[status];
  return <Badge className={cls}>{t(`userStatus.${status}`)}</Badge>;
}
