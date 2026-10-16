export type SummaryKind = 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface SummaryTotals {
  projects: number; avgCompletion: number; open: number; completed: number; overdue: number;
  totalCostK: number; yearCostK: number; spentK: number; spentPct: number | null;
  localContributionK: number; partnerContributionK: number;
  startedInPeriod: number; completedInPeriod: number; reportsInPeriod: number;
}

export interface SummaryRow {
  id: string; name: string; program: string; department: string | null; departmentEn: string | null;
  status: string; completionPercent: number; startDate: string | null; dueDate: string | null;
  totalCostK: number | null; yearCostK: number | null; spentK: number | null;
}

export interface SummaryData {
  tenant: { name: string; nameEn: string | null; planYear: number };
  periodStart: string; periodEnd: string; generatedAt: string;
  totals: SummaryTotals;
  byStatus: { status: string; count: number }[];
  byDepartment: { name: string | null; nameEn: string | null; count: number; avgCompletion: number; totalCostK: number; spentK: number }[];
  started: SummaryRow[]; completed: SummaryRow[]; due: SummaryRow[]; overdue: SummaryRow[]; upcoming: SummaryRow[];
  reports: { submitted: number; approved: number; rejected: number; pending: number; items: { project: string; author: string; status: string; date: string }[] };
}

interface SummaryBase { id: string; kind: SummaryKind; periodStart: string; periodEnd: string; createdById: string | null; createdAt: string }
export interface SummaryListItem extends SummaryBase { totals: SummaryTotals | null }
export interface SummaryReport extends SummaryBase { data: SummaryData }
