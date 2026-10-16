import { http } from '@/lib/http';
import type { SummaryKind, SummaryListItem, SummaryReport } from './types';

export const summariesApi = {
  list: () => http.get<SummaryListItem[]>('/summaries'),
  get: (id: string) => http.get<SummaryReport>(`/summaries/${id}`),
  create: (body: { from: string; to: string; kind?: SummaryKind }) => http.post<SummaryReport>('/summaries', body),
  remove: (id: string) => http.del(`/summaries/${id}`),
  /** Download link (the browser opens it directly). */
  exportUrl: (id: string) => http.url(`/summaries/${id}/export`),
};
