import type { NamedRef } from '@/lib/types';
import type { Report } from '@/features/reports/types';

export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PARTIAL' | 'COMPLETED' | 'POSTPONED' | 'STOPPED' | 'CANCELLED';
export type AchievementLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'WEAK';

export const PROJECT_STATUSES: ProjectStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'PARTIAL', 'COMPLETED', 'POSTPONED', 'STOPPED', 'CANCELLED'];
export const LEVELS: AchievementLevel[] = ['EXCELLENT', 'GOOD', 'AVERAGE', 'WEAK'];

/** Once a project reaches one of these it is no longer "open", so it can't be late. */
export const CLOSED_STATUSES: ProjectStatus[] = ['COMPLETED', 'CANCELLED'];
export const isOpen = (status: ProjectStatus) => !CLOSED_STATUSES.includes(status);

/** A project from the development plan. Money fields are in thousands of USD (×1000$). */
export interface Project {
  id: string;
  // Step 1: identity (admin only)
  programName: string; programNumber?: string | null; componentName: string; componentNumber?: string | null;
  totalCostK?: number | null; yearCostK?: number | null; planYear: number;
  departmentId?: string | null; department?: NamedRef | null;
  departments: { department: NamedRef }[];
  startDate?: string | null; dueDate?: string | null;
  // Step 2: follow-up
  status: ProjectStatus; completionPercent: number; nonExecutionReasons?: string | null; spentK?: number | null; activities?: string | null;
  // Step 3: evaluation
  achievementLevel?: AchievementLevel | null; kpiName?: string | null; kpiTarget?: string | null; kpiActual?: string | null; evaluationNotes?: string | null;
  // Step 4: funding
  localBudgetLine?: string | null; localContributionK?: number | null; partnerName?: string | null; partnerContributionK?: number | null;
  updatedAt: string; createdAt: string;
  _count?: { reports: number; assignments: number };
  assignments?: { user: { id: string; name: string; email: string; department?: NamedRef | null } }[];
  reports?: Report[];
}

/** Filters of the projects list (they mirror the URL query string). */
export interface ProjectFilters {
  q?: string; status?: string; departmentId?: string; due?: string; sort?: string; page?: number; pageSize?: number;
}

/** Body sent when creating or editing a project (built by the wizard). */
export type ProjectInput = Record<string, unknown> & { extraDepartmentIds?: string[]; assigneeIds?: string[] };

export interface ImportResult {
  created: number;
  /** Rows that matched an existing project and changed it. */
  updated: number;
  /** Rows that matched an existing project with nothing new. */
  unchanged: number;
  errors: { row: number; message: string }[];
  sheet: string;
  headerRow: number;
  /** Sheet columns that were matched to a project field. */
  matched: { column: string; field: string; label: string; labelEn: string }[];
  /** Sheet columns that matched no field and were skipped. */
  ignored: string[];
}
