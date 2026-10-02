import { http } from '@/lib/http';
import type { CreateUserInput, UpdateUserInput, User, UserFilters } from './types';

export const usersApi = {
  list: (filters: UserFilters = {}) => http.get<User[]>('/users', { ...filters }),
  get: (id: string) => http.get<User>(`/users/${id}`),
  create: (body: CreateUserInput) => http.post<User>('/users', body),
  update: (id: string, body: UpdateUserInput) => http.patch<User>(`/users/${id}`, body),
  assignProjects: (id: string, projectIds: string[]) => http.put<{ projectIds: string[] }>(`/users/${id}/projects`, { projectIds }),
  resetPassword: (id: string, password: string) => http.post(`/users/${id}/password`, { password }),
  remove: (id: string) => http.del(`/users/${id}`),
};
