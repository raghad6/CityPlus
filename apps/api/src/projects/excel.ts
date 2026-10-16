import ExcelJS from 'exceljs';

/**
 * Column definitions shared by export, import and the import template. Headers match the municipality's plan sheet.
 * `aliases` are other header spellings accepted on import (Arabic or English). An alias starting with `=` must match
 * the whole header; the others may also appear inside a longer header.
 */
export const COLUMNS: {
  key: string; header: string; labelEn: string; width: number; aliases: string[];
  type?: 'number' | 'date' | 'status' | 'level' | 'dept' | 'depts';
}[] = [
  { key: 'programNumber', header: 'رقم البرنامج', labelEn: 'Program number', width: 12, aliases: ['program number', 'program no'] },
  { key: 'programName', header: 'اسم البرنامج', labelEn: 'Program name', width: 40, aliases: ['=البرنامج', 'program name', '=program'] },
  { key: 'componentNumber', header: 'رقم مكون المشروع', labelEn: 'Component number', width: 14, aliases: ['رقم المكون', 'رقم المشروع', 'component number', 'project number', 'project no'] },
  { key: 'componentName', header: 'اسم مكون المشروع/البرنامج', labelEn: 'Component / project name', width: 50, aliases: ['اسم مكون المشروع', 'اسم المكون', 'مكون المشروع', 'اسم المشروع', '=المشروع', '=المكون', 'component name', 'project name', '=component', '=project', '=name', '=title'] },
  { key: 'department', header: 'القسم المسؤول', labelEn: 'Responsible department', width: 28, type: 'dept', aliases: ['الجهة المسؤولة', 'الدائرة المسؤولة', '=القسم', '=الدائرة', 'responsible department', '=department', '=dept'] },
  { key: 'extraDepartments', header: 'أقسام مشاركة', labelEn: 'Partner departments', width: 28, type: 'depts', aliases: ['الأقسام المشاركة', 'الجهات المشاركة', 'partner departments', 'extra departments', 'other departments'] },
  { key: 'totalCostK', header: 'التكلفة التقديرية لكامل المشروع ×1000$', labelEn: 'Total cost ×1000$', width: 18, type: 'number', aliases: ['التكلفة التقديرية لكامل المشروع', 'التكلفة الكلية', 'التكلفة الإجمالية', 'total cost', '=التكلفة', '=cost'] },
  { key: 'yearCostK', header: 'التكلفة التقديرية للسنة ×1000$', labelEn: 'Cost this year ×1000$', width: 18, type: 'number', aliases: ['التكلفة التقديرية للسنة', 'تكلفة السنة', 'التكلفة السنوية', 'year cost', 'annual cost', 'yearly cost'] },
  { key: 'planYear', header: 'سنة الخطة', labelEn: 'Plan year', width: 10, type: 'number', aliases: ['plan year', '=السنة', '=year'] },
  { key: 'startDate', header: 'تاريخ البدء', labelEn: 'Start date', width: 14, type: 'date', aliases: ['تاريخ البداية', 'start date', '=start'] },
  { key: 'dueDate', header: 'تاريخ الانتهاء المتوقع', labelEn: 'Due date', width: 14, type: 'date', aliases: ['تاريخ الانتهاء', 'due date', 'end date', 'deadline', '=end'] },
  { key: 'status', header: 'حالة المشروع', labelEn: 'Status', width: 14, type: 'status', aliases: ['الحالة', 'status'] },
  { key: 'completionPercent', header: 'نسبة التنفيذ %', labelEn: 'Completion %', width: 12, type: 'number', aliases: ['نسبة التنفيذ', 'نسبة الإنجاز', 'completion', 'progress'] },
  { key: 'nonExecutionReasons', header: 'أسباب عدم التنفيذ أو الإلغاء أو التوقيف أو الإضافة', labelEn: 'Reasons for non-execution', width: 40, aliases: ['أسباب عدم التنفيذ', '=الأسباب', 'reasons'] },
  { key: 'spentK', header: 'ما تم صرفه خلال العام ×1000$', labelEn: 'Spent this year ×1000$', width: 16, type: 'number', aliases: ['ما تم صرفه', 'المصروف', 'spent'] },
  { key: 'activities', header: 'النشاط والتكلفة ومؤشر القياس', labelEn: 'Activities', width: 50, aliases: ['الأنشطة', '=النشاط', 'activities', '=activity'] },
  { key: 'achievementLevel', header: 'مستوى الإنجاز', labelEn: 'Achievement level', width: 14, type: 'level', aliases: ['achievement level', '=level'] },
  { key: 'kpiName', header: 'مؤشر القياس', labelEn: 'KPI', width: 24, aliases: ['=المؤشر', 'kpi name', 'indicator', '=kpi'] },
  { key: 'kpiTarget', header: 'القيمة المستهدفة', labelEn: 'KPI target', width: 14, aliases: ['المستهدف', 'target'] },
  { key: 'kpiActual', header: 'القيمة المتحققة', labelEn: 'KPI actual', width: 14, aliases: ['المتحقق', 'actual'] },
  { key: 'localBudgetLine', header: 'الهيئة المحلية - بند الموازنة', labelEn: 'Local budget line', width: 24, aliases: ['بند الموازنة', 'budget line'] },
  { key: 'localContributionK', header: 'الهيئة المحلية - قيمة المساهمة ×1000$', labelEn: 'Local contribution ×1000$', width: 18, type: 'number', aliases: ['مساهمة الهيئة المحلية', 'local contribution'] },
  { key: 'partnerName', header: 'الجهة الشريكة', labelEn: 'Partner', width: 24, aliases: ['الجهة الممولة', '=الشريك', 'partner name', '=partner', 'funder', 'donor'] },
  { key: 'partnerContributionK', header: 'الشريك - قيمة المساهمة ×1000$', labelEn: 'Partner contribution ×1000$', width: 18, type: 'number', aliases: ['مساهمة الشريك', 'partner contribution'] },
];

export const STATUS_AR: Record<string, string> = {
  NOT_STARTED: 'لم يبدأ', IN_PROGRESS: 'قيد التنفيذ', PARTIAL: 'منفذ جزئياً', COMPLETED: 'منجز',
  POSTPONED: 'مؤجل', STOPPED: 'متوقف', CANCELLED: 'ملغى',
};
export const LEVEL_AR: Record<string, string> = { EXCELLENT: 'ممتاز', GOOD: 'جيد', AVERAGE: 'متوسط', WEAK: 'ضعيف' };

const invert = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]));
export const STATUS_FROM_AR = invert(STATUS_AR);
export const LEVEL_FROM_AR = invert(LEVEL_AR);

export function newWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'City+';
  const ws = wb.addWorksheet('المشاريع', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] });
  ws.columns = COLUMNS.map((c) => ({ key: c.key, header: c.header, width: c.width }));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E5E54' } };
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  header.height = 36;
  return { wb, ws };
}

export function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (v instanceof Date) return v.toISOString();
    if ('richText' in v) return v.richText.map((r) => r.text).join('');
    if ('text' in v) return String(v.text);
    if ('result' in v) return v.result == null ? '' : String(v.result);
  }
  return String(v).trim();
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** Arabic-Indic digits → 0-9, Arabic decimal/thousands marks → . and , */
export const latinDigits = (s: string) =>
  s.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d))).replace(/٫/g, '.').replace(/٬/g, ',');

/** Normalise text for loose comparison: lower case, no diacritics/spaces/punctuation, unified alef/ya/ta marbuta. */
export function normText(s: string): string {
  return latinDigits(s)
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[×x*]?\s*1000/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

const MATCHERS = COLUMNS.map((c) => ({
  key: c.key,
  exact: [c.header, c.labelEn, c.key, ...c.aliases].map((a) => normText(a.replace(/^=/, ''))),
  partial: [c.header, c.labelEn, ...c.aliases.filter((a) => !a.startsWith('='))].map(normText).filter((a) => a.length >= 3),
}));

/**
 * Match a sheet's header cells to project fields. Exact matches win, then the longest alias found inside a header.
 * Each field and each sheet column is used at most once. Returns field key → column number.
 */
export function matchHeaders(headers: Map<number, string>): Map<string, number> {
  const candidates: { score: number; key: string; col: number }[] = [];
  for (const [col, text] of headers) {
    const h = normText(text);
    if (!h) continue;
    for (const m of MATCHERS) {
      if (m.exact.includes(h)) candidates.push({ score: 1000 + h.length, key: m.key, col });
      else {
        const best = Math.max(0, ...m.partial.filter((a) => h.includes(a)).map((a) => a.length));
        if (best) candidates.push({ score: best, key: m.key, col });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.col - b.col);
  const byKey = new Map<string, number>();
  const usedCols = new Set<number>();
  for (const c of candidates) {
    if (byKey.has(c.key) || usedCols.has(c.col)) continue;
    byKey.set(c.key, c.col);
    usedCols.add(c.col);
  }
  return byKey;
}

const STATUS_WORDS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(STATUS_AR).flatMap(([k, ar]) => [[normText(ar), k], [normText(k), k]])),
  [normText('مكتمل')]: 'COMPLETED', [normText('منتهي')]: 'COMPLETED', [normText('منفذ')]: 'COMPLETED',
  [normText('done')]: 'COMPLETED', [normText('جاري التنفيذ')]: 'IN_PROGRESS', [normText('جاري')]: 'IN_PROGRESS',
  [normText('ongoing')]: 'IN_PROGRESS', [normText('partial')]: 'PARTIAL', [normText('ملغي')]: 'CANCELLED',
  [normText('canceled')]: 'CANCELLED', [normText('on hold')]: 'STOPPED', [normText('لم ينفذ')]: 'NOT_STARTED',
};
const LEVEL_WORDS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(LEVEL_AR).flatMap(([k, ar]) => [[normText(ar), k], [normText(k), k]])),
  [normText('جيد جدا')]: 'GOOD', [normText('very good')]: 'GOOD', [normText('مقبول')]: 'AVERAGE', [normText('poor')]: 'WEAK',
};
/** Status from Arabic or English text; undefined when not recognised. */
export const parseStatus = (s: string) => STATUS_WORDS[normText(s)];
/** Achievement level from Arabic or English text; undefined when not recognised. */
export const parseLevel = (s: string) => LEVEL_WORDS[normText(s)];

/** A number from a cell: accepts Arabic digits, thousands separators, $ and %. */
export function parseNumber(s: string): number | null {
  const v = latinDigits(s).replace(/[,\s$%]/g, '');
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** A date from a cell: real Excel dates, Excel serial numbers, yyyy-mm-dd, or dd/mm/yyyy (day first). */
export function parseDate(v: ExcelJS.CellValue): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === 'number') return v > 20000 && v < 80000 ? new Date(Date.UTC(1899, 11, 30) + v * 864e5) : null;
  const s = latinDigits(cellText(v));
  if (!s) return null;
  const dmy = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (dmy) return new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
