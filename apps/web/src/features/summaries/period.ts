import { date } from '@/lib/format';
import type { Lang } from '@/lib/i18n';

/** The period is stored with an exclusive end; show the last included day. */
export const periodLabel = (lang: Lang, start: string, end: string) =>
  `${date(lang, start)} – ${date(lang, new Date(new Date(end).getTime() - 1))}`;
