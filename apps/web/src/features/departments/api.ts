import { http } from '@/lib/http';
import type { Department, DepartmentInput } from './types';

export const departmentsApi = {
  list: () => http.get<Department[]>('/departments'),
  create: (body: DepartmentInput) => http.post<Department>('/departments', body),
  update: (id: string, body: DepartmentInput) => http.patch<Department>(`/departments/${id}`, body),
  remove: (id: string) => http.del(`/departments/${id}`),
};
