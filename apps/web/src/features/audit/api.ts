import { http } from '@/lib/http';
import type { Paged } from '@/lib/types';
import type { AuditLog } from './types';

export const auditApi = {
  list: (page: number, pageSize = 30) => http.get<Paged<AuditLog>>('/audit', { page, pageSize }),
};
