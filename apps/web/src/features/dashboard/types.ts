import type { Project, ProjectStatus } from '@/features/projects/types';
import type { Report } from '@/features/reports/types';

/** A project in a due-date list (overdue / upcoming). */
export interface DueProject { id: string; componentName: string; dueDate: string; completionPercent: number; status: ProjectStatus }

/** Admin dashboard for the whole municipality. Money is in thousands of USD. */
export interface AdminDashboard {
  totals: {
    projects: number; avgCompletion: number; totalCostK: number; yearCostK: number; spentK: number;
    localContributionK: number; partnerContributionK: number; pendingReports: number; pendingUsers: number; overdue: number;
  };
  byStatus: { status: ProjectStatus; count: number }[];
  byDepartment: { departmentId: string | null; name: string | null; nameEn: string | null; count: number; avgCompletion: number; totalCostK: number; spentK: number }[];
  overdue: DueProject[];
  upcoming: DueProject[];
  recent: { id: string; action: string; summary?: string; createdAt: string; user?: { name: string } | null }[];
  years: number[];
}

/** A project as shown on the staff portal cards. */
export type StaffProject = Pick<Project, 'id' | 'componentName' | 'programName' | 'status' | 'completionPercent' | 'dueDate' | 'updatedAt'> & {
  department?: { name: string; nameEn?: string | null } | null;
};

/** Staff home page: my assigned projects and my latest reports. */
export interface StaffDashboard {
  totals: { projects: number; active: number; completed: number; overdue: number; pendingReports: number; rejectedReports: number };
  projects: StaffProject[];
  reports: (Report & { project: { id: string; componentName: string } })[];
}

export interface CalendarEvent { date: string; type: 'start' | 'due'; projectId: string; title: string; status: ProjectStatus }
