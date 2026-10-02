import ExcelJS from 'exceljs';

/** Column definitions shared by export, import and the import template. Headers match the municipality's plan sheet. */
export const COLUMNS: { key: string; header: string; width: number; type?: 'number' | 'date' | 'status' | 'level' | 'dept' | 'depts' }[] = [
  { key: 'programNumber', header: 'رقم البرنامج', width: 12 },
  { key: 'programName', header: 'اسم البرنامج', width: 40 },
  { key: 'componentNumber', header: 'رقم مكون المشروع', width: 14 },
  { key: 'componentName', header: 'اسم مكون المشروع/البرنامج', width: 50 },
  { key: 'department', header: 'القسم المسؤول', width: 28, type: 'dept' },
  { key: 'extraDepartments', header: 'أقسام مشاركة', width: 28, type: 'depts' },
  { key: 'totalCostK', header: 'التكلفة التقديرية لكامل المشروع ×1000$', width: 18, type: 'number' },
  { key: 'yearCostK', header: 'التكلفة التقديرية للسنة ×1000$', width: 18, type: 'number' },
  { key: 'planYear', header: 'سنة الخطة', width: 10, type: 'number' },
  { key: 'startDate', header: 'تاريخ البدء', width: 14, type: 'date' },
  { key: 'dueDate', header: 'تاريخ الانتهاء المتوقع', width: 14, type: 'date' },
  { key: 'status', header: 'حالة المشروع', width: 14, type: 'status' },
  { key: 'completionPercent', header: 'نسبة التنفيذ %', width: 12, type: 'number' },
  { key: 'nonExecutionReasons', header: 'أسباب عدم التنفيذ أو الإلغاء أو التوقيف أو الإضافة', width: 40 },
  { key: 'spentK', header: 'ما تم صرفه خلال العام ×1000$', width: 16, type: 'number' },
  { key: 'activities', header: 'النشاط والتكلفة ومؤشر القياس', width: 50 },
  { key: 'achievementLevel', header: 'مستوى الإنجاز', width: 14, type: 'level' },
  { key: 'kpiName', header: 'مؤشر القياس', width: 24 },
  { key: 'kpiTarget', header: 'القيمة المستهدفة', width: 14 },
  { key: 'kpiActual', header: 'القيمة المتحققة', width: 14 },
  { key: 'localBudgetLine', header: 'الهيئة المحلية - بند الموازنة', width: 24 },
  { key: 'localContributionK', header: 'الهيئة المحلية - قيمة المساهمة ×1000$', width: 18, type: 'number' },
  { key: 'partnerName', header: 'الجهة الشريكة', width: 24 },
  { key: 'partnerContributionK', header: 'الشريك - قيمة المساهمة ×1000$', width: 18, type: 'number' },
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
