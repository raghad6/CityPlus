'use client';

import { useMemo, useState } from 'react';
import { Check, Lock, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n';
import { money } from '@/lib/format';
import { Button, Card, Field, Input, Select, Textarea } from '@/components/ui';
import { useDepartments } from '@/features/departments/hooks';
import { useUsers } from '@/features/users/hooks';
import { funding, missingFields, requiredFor, toForm, toPayload, type WizardMode } from '../project-form';
import { LEVELS, PROJECT_STATUSES, type Project, type ProjectInput } from '../types';

/**
 * The 4-step project form from the municipal prototype. Used by admins to create/edit a project
 * (mode "admin") and by staff to submit a progress report (mode "report": step 1 is read-only).
 * The rules (required fields, payload) live in project-form.ts; this file is only the screen.
 */
export function ProjectWizard({
  mode, project, planYear, onSubmit, submitting, submitLabel, initialStatus,
}: {
  mode: WizardMode;
  project?: Project;
  planYear: number;
  onSubmit: (data: ProjectInput) => void;
  submitting?: boolean;
  submitLabel?: string;
  initialStatus?: string;
}) {
  const { t, n, lang } = useI18n();
  const { data: departments = [] } = useDepartments();
  // Only admins pick assignees; staff don't have access to the user list.
  const users = useUsers({ status: 'ACTIVE' }, { enabled: mode === 'admin' });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>(() => {
    const f = toForm(project);
    if (initialStatus) {
      f.status = initialStatus;
      if (initialStatus === 'COMPLETED') f.completionPercent = '100';
    }
    return f;
  });
  const [extraDeps, setExtraDeps] = useState<string[]>(project?.departments?.map((d) => d.department.id) ?? []);
  const [assignees, setAssignees] = useState<string[]>(project?.assignments?.map((a) => a.user.id) ?? []);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [userQuery, setUserQuery] = useState('');

  const year = Number(form.planYear) || project?.planYear || planYear;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v, ...(k === 'status' && v === 'COMPLETED' ? { completionPercent: '100' } : {}) }));
    setErrors((er) => ({ ...er, [k]: false }));
  };

  const steps = [t('wiz.step1'), t('wiz.step2'), t('wiz.step3'), t('wiz.step4')];
  const locked = mode === 'report'; // step 1 is admin-only in report mode
  const isReq = (k: string, s: number) => requiredFor(mode, s, form).includes(k);

  /** Marks empty required fields up to `upTo` and jumps to the first step with a problem. */
  function validate(upTo: number) {
    const errs = missingFields(mode, form, upTo);
    setErrors(errs);
    const firstBad = [0, 1, 2, 3].find((s) => s <= upTo && requiredFor(mode, s, form).some((k) => errs[k]));
    if (firstBad !== undefined) setStep(firstBad);
    return firstBad === undefined;
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(3, s + 1));
  }

  function submit() {
    if (!validate(3)) return;
    onSubmit(toPayload(mode, form, { editing: !!project, extraDepartmentIds: extraDeps, assigneeIds: assignees }));
  }

  const { total: fundingTotal, gap } = funding(form);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return (users.data ?? []).filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users.data, userQuery]);


  return (
    <Card className="overflow-hidden">
      {/* Stepper */}
      <ol className="flex border-b border-ink-100 bg-ink-50/60 px-2 sm:px-6">
        {steps.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                onClick={() => (i < step || mode === 'admin' ? setStep(i) : next())}
                className={cn(
                  'flex w-full flex-col items-center gap-1.5 border-b-2 px-1 py-4 text-center text-xs font-medium transition sm:flex-row sm:justify-center sm:gap-2 sm:text-sm',
                  active ? 'border-brand-600 text-brand-800' : 'border-transparent text-ink-500 hover:text-ink-800',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    active ? 'bg-brand-700 text-white' : done ? 'bg-brand-100 text-brand-700' : 'bg-white text-ink-500 ring-1 ring-ink-200',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className="leading-tight">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="p-5 sm:p-8">
        {step === 0 && (
          <div className="space-y-5">
            {locked && (
              <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-600">
                <Lock className="h-4 w-4" /> {t('wiz.adminOnly')}
              </div>
            )}
            <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
                  <Field label={t('wiz.programName')} required={isReq('programName', 0)} error={errors.programName ? t('wiz.fieldRequired') : undefined}>
                    <Input value={form.programName} onChange={set('programName')} disabled={locked} invalid={errors.programName} />
                  </Field>
                  <Field label={t('wiz.programNumber')} required={isReq('programNumber', 0)} error={errors.programNumber ? t('wiz.fieldRequired') : undefined}>
                    <Input value={form.programNumber} onChange={set('programNumber')} disabled={locked} dir="ltr" />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
                  <Field label={t('wiz.componentName')} required={isReq('componentName', 0)} error={errors.componentName ? t('wiz.fieldRequired') : undefined}>
                    <Input value={form.componentName} onChange={set('componentName')} disabled={locked} invalid={errors.componentName} />
                  </Field>
                  <Field label={t('wiz.componentNumber')} required={isReq('componentNumber', 0)} error={errors.componentNumber ? t('wiz.fieldRequired') : undefined}>
                    <Input value={form.componentNumber} onChange={set('componentNumber')} disabled={locked} dir="ltr" />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t('wiz.totalCost')} required={isReq('totalCostK', 0)} error={errors.totalCostK ? t('wiz.fieldRequired') : undefined}>
                    <Input type="number" min={0} step="0.01" value={form.totalCostK} onChange={set('totalCostK')} disabled={locked} />
                  </Field>
                  <Field label={t('wiz.yearCost', { year })} required={isReq('yearCostK', 0)} error={errors.yearCostK ? t('wiz.fieldRequired') : undefined}>
                    <Input type="number" min={0} step="0.01" value={form.yearCostK} onChange={set('yearCostK')} disabled={locked} />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label={t('wiz.startDate')} required={isReq('startDate', 0)} error={errors.startDate ? t('wiz.fieldRequired') : undefined}>
                    <Input type="date" value={form.startDate} onChange={set('startDate')} disabled={locked} />
                  </Field>
                  <Field label={t('wiz.dueDate')} required={isReq('dueDate', 0)} error={errors.dueDate ? t('wiz.fieldRequired') : undefined}>
                    <Input type="date" value={form.dueDate} onChange={set('dueDate')} disabled={locked} />
                  </Field>
                  <Field label={t('dash.planYear')} required={isReq('planYear', 0)} error={errors.planYear ? t('wiz.fieldRequired') : undefined}>
                    <Input type="number" min={2000} max={2100} value={form.planYear} placeholder={String(planYear)} onChange={set('planYear')} disabled={locked} />
                  </Field>
                </div>
              </div>

              <div className="space-y-5 rounded-xl bg-ink-50 p-4">
                <Field label={t('wiz.department')} required={isReq('departmentId', 0)} error={errors.departmentId ? t('wiz.fieldRequired') : undefined}>
                  <Select value={form.departmentId} onChange={set('departmentId')} disabled={locked}>
                    <option value="">{t('wiz.selectDept')}</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{n(d)}</option>)}
                  </Select>
                </Field>
                <div>
                  <div className="mb-1.5 text-sm font-medium text-ink-800">{t('wiz.extraDepartments')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {departments.filter((d) => d.id !== form.departmentId).map((d) => {
                      const on = extraDeps.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          disabled={locked}
                          onClick={() => setExtraDeps((x) => (on ? x.filter((i) => i !== d.id) : [...x, d.id]))}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs transition disabled:opacity-60',
                            on ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400',
                          )}
                        >
                          {n(d)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {mode === 'admin' && (
              <div className="rounded-xl border border-ink-100 p-4">
                <div className="mb-1 text-sm font-medium text-ink-800">{t('wiz.assignees')}</div>
                <p className="mb-3 text-xs text-ink-500">{t('wiz.assigneesHint')}</p>
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-ink-400" />
                  <Input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder={t('users.searchPh')} className="ps-9" />
                </div>
                <div className="grid max-h-56 gap-1 overflow-y-auto sm:grid-cols-2">
                  {filteredUsers.map((u) => {
                    const on = assignees.includes(u.id);
                    return (
                      <label key={u.id} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-50', on && 'bg-brand-50')}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setAssignees((x) => (on ? x.filter((i) => i !== u.id) : [...x, u.id]))}
                          className="h-4 w-4 rounded border-ink-300 text-brand-600 accent-brand-600"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-ink-800">{u.name}</span>
                          <span className="block truncate text-xs text-ink-500">{u.department ? n(u.department) : u.email}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('wiz.status')} required={isReq('status', 1)} error={errors.status ? t('wiz.fieldRequired') : undefined}>
                <Select value={form.status} onChange={set('status')} invalid={errors.status}>
                  <option value="">{t('wiz.selectStatus')}</option>
                  {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                </Select>
              </Field>
              <Field label={t('wiz.completion')} required={isReq('completionPercent', 1)} error={errors.completionPercent ? t('wiz.fieldRequired') : undefined}>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={0} max={100} step={5}
                    value={Number(form.completionPercent) || 0}
                    onChange={set('completionPercent')}
                    className="flex-1 accent-brand-600"
                  />
                  <Input type="number" min={0} max={100} value={form.completionPercent} onChange={set('completionPercent')} className="w-20 text-center" />
                </div>
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('wiz.reasons')} required={isReq('nonExecutionReasons', 1)} error={errors.nonExecutionReasons ? t('wiz.fieldRequired') : undefined}>
                <Textarea rows={3} value={form.nonExecutionReasons} onChange={set('nonExecutionReasons')} invalid={errors.nonExecutionReasons} />
              </Field>
              <Field label={t('wiz.spent', { year })} required={isReq('spentK', 1)} error={errors.spentK ? t('wiz.fieldRequired') : undefined}>
                <Input type="number" min={0} step="0.01" value={form.spentK} onChange={set('spentK')} invalid={errors.spentK} />
              </Field>
            </div>
            <Field label={t('wiz.activities')} required={isReq('activities', 1)} error={errors.activities ? t('wiz.fieldRequired') : undefined}>
              <Textarea rows={5} value={form.activities} onChange={set('activities')} invalid={errors.activities} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-medium text-ink-800">{t('wiz.level')}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, achievementLevel: f.achievementLevel === l ? '' : l }))}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-sm font-medium transition',
                      form.achievementLevel === l ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600' : 'border-ink-200 text-ink-700 hover:border-brand-300',
                    )}
                  >
                    {t(`level.${l}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label={t('wiz.kpiName')} required={isReq('kpiName', 2)} error={errors.kpiName ? t('wiz.fieldRequired') : undefined}>
                <Input value={form.kpiName} onChange={set('kpiName')} />
              </Field>
              <Field label={t('wiz.kpiTarget')} required={isReq('kpiTarget', 2)} error={errors.kpiTarget ? t('wiz.fieldRequired') : undefined}>
                <Input value={form.kpiTarget} onChange={set('kpiTarget')} />
              </Field>
              <Field label={t('wiz.kpiActual')} required={isReq('kpiActual', 2)} error={errors.kpiActual ? t('wiz.fieldRequired') : undefined}>
                <Input value={form.kpiActual} onChange={set('kpiActual')} />
              </Field>
            </div>
            <Field label={t('wiz.evalNotes')} required={isReq('evaluationNotes', 2)} error={errors.evaluationNotes ? t('wiz.fieldRequired') : undefined}>
              <Textarea rows={4} value={form.evaluationNotes} onChange={set('evaluationNotes')} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className="font-semibold text-ink-900">{t('wiz.fundingTitle')}</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-ink-100 p-4">
                <div className="font-medium text-brand-800">{t('wiz.local')}</div>
                <Field label={t('wiz.budgetLine')} required={isReq('localBudgetLine', 3)} error={errors.localBudgetLine ? t('wiz.fieldRequired') : undefined}>
                  <Input value={form.localBudgetLine} onChange={set('localBudgetLine')} />
                </Field>
                <Field label={t('wiz.contribution')} required={isReq('localContributionK', 3)} error={errors.localContributionK ? t('wiz.fieldRequired') : undefined}>
                  <Input type="number" min={0} step="0.01" value={form.localContributionK} onChange={set('localContributionK')} invalid={errors.localContributionK} />
                </Field>
              </div>
              <div className="space-y-4 rounded-xl border border-ink-100 p-4">
                <div className="font-medium text-brand-800">{t('wiz.partner')}</div>
                <Field label={t('wiz.partnerName')} required={isReq('partnerName', 3)} error={errors.partnerName ? t('wiz.fieldRequired') : undefined}>
                  <Input value={form.partnerName} onChange={set('partnerName')} />
                </Field>
                <Field label={t('wiz.contribution')} required={isReq('partnerContributionK', 3)} error={errors.partnerContributionK ? t('wiz.fieldRequired') : undefined}>
                  <Input type="number" min={0} step="0.01" value={form.partnerContributionK} onChange={set('partnerContributionK')} invalid={errors.partnerContributionK} />
                </Field>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-1 rounded-xl bg-ink-50 px-4 py-3 text-sm">
              <span>{t('wiz.fundingTotal')}: <b className="tabular-nums">{money(lang, fundingTotal)}</b></span>
              {Number(form.totalCostK) > 0 && (
                <span>
                  {t('wiz.fundingGap')}: <b className={cn('tabular-nums', gap > 0 ? 'text-accent-700' : 'text-brand-700')}>{money(lang, Math.max(gap, 0))}</b>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-ink-100 bg-ink-50/60 px-5 py-4 sm:flex-row sm:items-center sm:px-8">
        <div className="text-xs leading-relaxed text-ink-500 sm:flex-1">
          {mode === 'report' && <div>{t('wiz.adminOnly')}</div>}
          {mode === 'report' && <div>{t('common.required')}</div>}
          {Object.values(errors).some(Boolean) && <div className="text-red-600">{t('wiz.fixErrors')}</div>}
        </div>
        <div className="flex gap-2">
          {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}>{t('common.back')}</Button>}
          {mode === 'admin' && step < 3 && (
            <Button variant="outline" onClick={submit} loading={submitting}>{submitLabel ?? t('common.save')}</Button>
          )}
          {step < 3 ? (
            <Button onClick={next}>{t('common.next')}</Button>
          ) : (
            <Button onClick={submit} loading={submitting}>{submitLabel ?? t('common.submit')}</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
