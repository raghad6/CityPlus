import type { NamedRef, Role } from '@/lib/types';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'DISABLED';

/** A user of a municipality, as the admin sees them. */
export interface User {
  id: string; name: string; email: string; phone?: string | null; role: Role; status: UserStatus;
  lastLoginAt?: string | null; createdAt: string; department?: NamedRef | null;
  _count?: { assignments: number; reports: number };
  /** Only on the single-user endpoint: projects this user follows. */
  projectIds?: string[];
}

export interface UserFilters { q?: string; status?: string; departmentId?: string }

export interface CreateUserInput {
  name: string; email: string; password: string; role: 'ADMIN' | 'STAFF'; departmentId?: string; phone?: string;
}

export interface UpdateUserInput {
  name?: string; email?: string; phone?: string; role?: 'ADMIN' | 'STAFF'; departmentId?: string | null; status?: UserStatus;
}
