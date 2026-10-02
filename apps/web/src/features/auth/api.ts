import { http } from '@/lib/http';
import type { ChangePasswordInput, LoginInput, Me, ProfileInput, PublicDepartment, PublicTenant, SignupInput } from './types';

export const authApi = {
  login: (body: LoginInput) => http.post<{ user: Me }>('/auth/login', body),
  logout: () => http.post('/auth/logout'),
  signup: (body: SignupInput) => http.post<{ ok: true; status: 'PENDING' }>('/auth/signup', body),
  me: () => http.get<Me>('/auth/me'),
  updateProfile: (body: ProfileInput) => http.patch<Me>('/auth/me', body),
  changePassword: (body: ChangePasswordInput) => http.post('/auth/password', body),
  // Public lookups for the sign-up form (no login needed)
  publicTenants: () => http.get<PublicTenant[]>('/public/tenants'),
  publicDepartments: (slug: string) => http.get<PublicDepartment[]>(`/public/tenants/${slug}/departments`),
};
