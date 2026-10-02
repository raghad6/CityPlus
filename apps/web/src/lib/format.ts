import type { Lang } from './i18n';

const nf = (lang: Lang, opts?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(lang === 'ar' ? 'ar-PS-u-nu-latn' : 'en-US', opts);

/** Values are stored in thousands of USD (×1000$), as in the municipal plan. */
export function money(lang: Lang, k?: number | null) {
  if (k == null) return '—';
  const v = k * 1000;
  if (Math.abs(v) >= 1_000_000) return `$${nf(lang, { maximumFractionDigits: 2 }).format(v / 1_000_000)}M`;
  if (Math.abs(v) >= 1_000) return `$${nf(lang, { maximumFractionDigits: 1 }).format(v / 1000)}K`;
  return `$${nf(lang).format(v)}`;
}

export const number = (lang: Lang, n?: number | null) => (n == null ? '—' : nf(lang).format(n));

export function date(lang: Lang, d?: string | Date | null, withTime = false) {
  if (!d) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(d));
}

export function daysFromNow(d?: string | null) {
  if (!d) return null;
  const ms = new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export const toInputDate = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
