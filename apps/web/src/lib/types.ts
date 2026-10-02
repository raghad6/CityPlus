/** Types shared by every feature. Each feature keeps its own models in features/<name>/types.ts. */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

/** Anything with an Arabic name and optional English name (departments, municipalities…). */
export interface NamedRef { id: string; name: string; nameEn?: string | null }

/** A page of results from a paginated list endpoint. */
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }
