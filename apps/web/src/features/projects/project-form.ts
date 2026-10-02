import { toInputDate } from '@/lib/format';
import type { Project, ProjectInput } from './types';

/**
 * The project wizard's form model, kept apart from the screen:
 * how a project becomes form fields, which fields are required, and how the fields become the API body.
 */

/** 'admin' edits every step; 'report' is a staff progress report (step 1 locked). */
export type WizardMode = 'admin' | 'report';

/** The form keeps every value as a string, exactly as typed. */
export type ProjectForm = Record<string, string>;

const NUMERIC = ['totalCostK', 'yearCostK', 'spentK', 'localContributionK', 'partnerContributionK', 'completionPercent', 'planYear'];

/** Statuses for which "reasons for non-execution" is mandatory (same rule as the API). */
export const REASON_REQUIRED = ['NOT_STARTED', 'PARTIAL', 'POSTPONED', 'STOPPED', 'CANCELLED'];

const PROGRESS_KEYS = [
  'status', 'completionPercent', 'nonExecutionReasons', 'spentK', 'activities', 'achievementLevel', 'kpiName', 'kpiTarget',
  'kpiActual', 'evaluationNotes', 'localBudgetLine', 'localContributionK', 'partnerName', 'partnerContributionK',
];
const ADMIN_KEYS = ['programName', 'programNumber', 'componentName', 'componentNumber', 'totalCostK', 'yearCostK', 'planYear', 'departmentId', 'startDate', 'dueDate'];

/** Project → form fields. */
export function toForm(p?: Partial<Project>): ProjectForm {
  const s = (v: unknown) => (v == null ? '' : String(v));
  return {
    programName: s(p?.programName), programNumber: s(p?.programNumber),
    componentName: s(p?.componentName), componentNumber: s(p?.componentNumber),
    totalCostK: s(p?.totalCostK), yearCostK: s(p?.yearCostK), planYear: s(p?.planYear),
    departmentId: s(p?.departmentId ?? p?.department?.id),
    startDate: toInputDate(p?.startDate), dueDate: toInputDate(p?.dueDate),
    status: s(p?.status), completionPercent: s(p?.completionPercent ?? ''),
    nonExecutionReasons: s(p?.nonExecutionReasons), spentK: s(p?.spentK), activities: s(p?.activities),
    achievementLevel: s(p?.achievementLevel), kpiName: s(p?.kpiName), kpiTarget: s(p?.kpiTarget), kpiActual: s(p?.kpiActual),
    evaluationNotes: s(p?.evaluationNotes),
    localBudgetLine: s(p?.localBudgetLine), localContributionK: s(p?.localContributionK),
    partnerName: s(p?.partnerName), partnerContributionK: s(p?.partnerContributionK),
  };
}

/** Required fields per step, mirroring the "**" fields of the municipal form. */
export function requiredFor(mode: WizardMode, step: number, form: ProjectForm): string[] {
  if (step === 0) return mode === 'admin' ? ['programName', 'componentName'] : [];
  if (mode === 'admin') return [];
  if (step === 1) {
    const r = ['status', 'spentK', 'activities'];
    if (REASON_REQUIRED.includes(form.status)) r.push('nonExecutionReasons');
    return r;
  }
  if (step === 3) return ['localContributionK', 'partnerContributionK'];
  return [];
}

/** Required fields that are still empty, for steps 0..upTo. */
export function missingFields(mode: WizardMode, form: ProjectForm, upTo: number): Record<string, boolean> {
  const errs: Record<string, boolean> = {};
  for (let s = 0; s <= upTo; s++) for (const k of requiredFor(mode, s, form)) if (!form[k]?.trim()) errs[k] = true;
  return errs;
}

/** Form fields → API body. Empty fields become null when editing, so a cleared value is saved as cleared. */
export function toPayload(
  mode: WizardMode,
  form: ProjectForm,
  opts: { editing: boolean; extraDepartmentIds: string[]; assigneeIds: string[] },
): ProjectInput {
  const out: ProjectInput = {};
  const keys = mode === 'admin' ? [...ADMIN_KEYS, ...PROGRESS_KEYS] : PROGRESS_KEYS;
  for (const k of keys) {
    const v = form[k]?.trim() ?? '';
    if (v === '') {
      if (k === 'status' || k === 'completionPercent' || k === 'planYear') continue;
      out[k] = mode === 'admin' || opts.editing ? null : undefined;
    } else if (NUMERIC.includes(k)) {
      out[k] = Number(v);
    } else if (k === 'startDate' || k === 'dueDate') {
      out[k] = new Date(v).toISOString();
    } else out[k] = v;
  }
  if (mode === 'admin') {
    out.extraDepartmentIds = opts.extraDepartmentIds.filter((d) => d !== form.departmentId);
    out.assigneeIds = opts.assigneeIds;
  }
  return out;
}

/** Funding summary on step 4: total contributions and the remaining gap. */
export function funding(form: ProjectForm) {
  const total = (Number(form.localContributionK) || 0) + (Number(form.partnerContributionK) || 0);
  return { total, gap: (Number(form.totalCostK) || 0) - total };
}
