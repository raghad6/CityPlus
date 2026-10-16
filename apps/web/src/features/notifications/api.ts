import { http } from '@/lib/http';
import type { AppNotification } from './types';

export const notificationsApi = {
  list: () => http.get<AppNotification[]>('/notifications'),
  count: () => http.get<{ count: number }>('/notifications/count'),
  read: (id: string) => http.post(`/notifications/${id}/read`),
  readAll: () => http.post('/notifications/read-all'),
};
