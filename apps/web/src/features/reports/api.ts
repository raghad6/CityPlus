import { http } from '@/lib/http';
import type { ProjectInput } from '@/features/projects/types';
import type { Report, ReportFilters, ReportWithProject } from './types';

export const reportsApi = {
  list: (filters: ReportFilters = {}) => http.get<Report[]>('/reports', { ...filters }),
  get: (id: string) => http.get<ReportWithProject>(`/reports/${id}`),
  submit: (projectId: string, body: ProjectInput) => http.post<Report>(`/projects/${projectId}/reports`, body),
  approve: (id: string, note?: string) => http.post(`/reports/${id}/approve`, { note: note || undefined }),
  reject: (id: string, note: string) => http.post(`/reports/${id}/reject`, { note }),
  withdraw: (id: string) => http.del(`/reports/${id}`),
};
