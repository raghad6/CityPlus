import type { NamedRef } from '@/lib/types';
import type { Project } from '@/features/projects/types';

export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** A staff progress report. `payload` holds the proposed project changes (steps 2–4). */
export interface Report {
  id: string; projectId: string; status: ReportStatus; payload: Partial<Project>; reviewNote?: string | null;
  createdAt: string; reviewedAt?: string | null;
  author?: { id: string; name: string; email?: string; department?: NamedRef | null };
  reviewer?: { id: string; name: string } | null;
  project?: Partial<Project> & { id: string; componentName: string };
}

/** A report together with the full current project (review page: before vs. after). */
export type ReportWithProject = Report & { project: Project };

export interface ReportFilters { status?: ReportStatus; projectId?: string }
