import { http } from '@/lib/http';
import type { Paged } from '@/lib/types';
import type { ImportResult, Project, ProjectFilters, ProjectInput } from './types';

export const projectsApi = {
  list: (filters: ProjectFilters) => http.get<Paged<Project>>('/projects', { ...filters }),
  get: (id: string) => http.get<Project>(`/projects/${id}`),
  create: (body: ProjectInput) => http.post<Project>('/projects', body),
  update: (id: string, body: ProjectInput) => http.patch<Project>(`/projects/${id}`, body),
  remove: (id: string) => http.del(`/projects/${id}`),
  removeMany: (ids: string[]) => http.post<{ deleted: number }>('/projects/bulk-delete', { ids }),
  import: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.upload<ImportResult>('/projects/import', fd);
  },
  /** Download links (the browser opens them directly). */
  exportUrl: (filters: ProjectFilters) => http.url('/projects/export', { ...filters }),
  templateUrl: () => http.url('/projects/import/template'),
};
