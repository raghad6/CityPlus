import type { NamedRef } from '@/lib/types';

export interface Department extends NamedRef {
  /** جهة خارجية: a partner outside the municipality. */
  isExternal: boolean;
  _count?: { users: number; primaryProjects: number };
}

export interface DepartmentInput { name: string; nameEn?: string; isExternal: boolean }
