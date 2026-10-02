import type { DictKey } from '@/lib/dict';
import type { Lang } from '@/lib/i18n';
import { money } from '@/lib/format';

/** The fields a progress report can change, in display order, with how to format each value. */
export const REPORT_FIELDS: { key: string; label: DictKey; kind?: 'status' | 'level' | 'money' | 'pct' }[] = [
  { key: 'status', label: 'wiz.status', kind: 'status' },
  { key: 'completionPercent', label: 'projects.col.progress', kind: 'pct' },
  { key: 'nonExecutionReasons', label: 'wiz.reasons' },
  { key: 'spentK', label: 'dash.spent', kind: 'money' },
  { key: 'activities', label: 'wiz.activities' },
  { key: 'achievementLevel', label: 'wiz.level', kind: 'level' },
  { key: 'kpiName', label: 'wiz.kpiName' },
  { key: 'kpiTarget', label: 'wiz.kpiTarget' },
  { key: 'kpiActual', label: 'wiz.kpiActual' },
  { key: 'evaluationNotes', label: 'wiz.evalNotes' },
  { key: 'localBudgetLine', label: 'wiz.budgetLine' },
  { key: 'localContributionK', label: 'wiz.local', kind: 'money' },
  { key: 'partnerName', label: 'wiz.partnerName' },
  { key: 'partnerContributionK', label: 'wiz.partner', kind: 'money' },
];

export function formatField(kind: string | undefined, v: unknown, lang: Lang, t: (k: DictKey) => string) {
  if (v == null || v === '') return '—';
  if (kind === 'status') return t(`status.${v}` as DictKey);
  if (kind === 'level') return t(`level.${v}` as DictKey);
  if (kind === 'money') return money(lang, Number(v));
  if (kind === 'pct') return `${v}%`;
  return String(v);
}
