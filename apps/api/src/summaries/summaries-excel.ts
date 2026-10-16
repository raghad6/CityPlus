import ExcelJS from 'exceljs';
import { STATUS_AR } from '../projects/excel';
import type { SummaryData, SummaryRow } from './summaries.service';

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

function sheet(wb: ExcelJS.Workbook, name: string, columns: { header: string; key: string; width: number }[], rows: Record<string, unknown>[]) {
  const ws = wb.addWorksheet(name, { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] });
  ws.columns = columns;
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E5E54' } };
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  rows.forEach((r) => ws.addRow(r));
  return ws;
}

const PROJECT_COLS = [
  { header: 'المشروع', key: 'name', width: 46 },
  { header: 'البرنامج', key: 'program', width: 30 },
  { header: 'القسم', key: 'department', width: 26 },
  { header: 'الحالة', key: 'status', width: 14 },
  { header: 'نسبة الإنجاز %', key: 'completionPercent', width: 12 },
  { header: 'تاريخ البدء', key: 'startDate', width: 13 },
  { header: 'تاريخ الانتهاء', key: 'dueDate', width: 13 },
  { header: 'التكلفة الكلية ×1000$', key: 'totalCostK', width: 16 },
  { header: 'تكلفة السنة ×1000$', key: 'yearCostK', width: 16 },
  { header: 'المصروف ×1000$', key: 'spentK', width: 14 },
];
const projectRows = (rows: SummaryRow[]) =>
  rows.map((r) => ({ ...r, status: STATUS_AR[r.status] ?? r.status, startDate: day(r.startDate), dueDate: day(r.dueDate) }));

/** One workbook per performance report: a summary sheet plus one sheet per list. */
export async function summaryWorkbook(d: SummaryData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'City+';
  const t = d.totals;
  sheet(wb, 'الملخص', [{ header: 'البند', key: 'k', width: 40 }, { header: 'القيمة', key: 'v', width: 24 }], [
    { k: 'البلدية', v: d.tenant.name },
    { k: 'من', v: day(d.periodStart) },
    { k: 'إلى (غير شامل)', v: day(d.periodEnd) },
    { k: 'تاريخ الإنشاء', v: d.generatedAt.slice(0, 16).replace('T', ' ') },
    { k: 'عدد المشاريع', v: t.projects },
    { k: 'متوسط نسبة الإنجاز %', v: t.avgCompletion },
    { k: 'مشاريع مفتوحة', v: t.open },
    { k: 'مشاريع منجزة', v: t.completed },
    { k: 'مشاريع متأخرة', v: t.overdue },
    { k: 'بدأت خلال الفترة', v: t.startedInPeriod },
    { k: 'اكتملت خلال الفترة', v: t.completedInPeriod },
    { k: 'تقارير متابعة خلال الفترة', v: t.reportsInPeriod },
    { k: 'التكلفة التقديرية الكلية ×1000$', v: t.totalCostK },
    { k: 'تكلفة السنة ×1000$', v: t.yearCostK },
    { k: 'المصروف ×1000$', v: t.spentK },
    { k: 'نسبة الصرف من موازنة السنة %', v: t.spentPct ?? '' },
    { k: 'مساهمة الهيئة المحلية ×1000$', v: t.localContributionK },
    { k: 'مساهمة الشركاء ×1000$', v: t.partnerContributionK },
  ]);
  sheet(wb, 'حسب الحالة', [{ header: 'الحالة', key: 'status', width: 20 }, { header: 'عدد المشاريع', key: 'count', width: 14 }],
    d.byStatus.map((s) => ({ status: STATUS_AR[s.status] ?? s.status, count: s.count })));
  sheet(wb, 'حسب القسم', [
    { header: 'القسم', key: 'name', width: 34 }, { header: 'المشاريع', key: 'count', width: 10 },
    { header: 'متوسط الإنجاز %', key: 'avgCompletion', width: 14 }, { header: 'التكلفة ×1000$', key: 'totalCostK', width: 14 },
    { header: 'المصروف ×1000$', key: 'spentK', width: 14 },
  ], d.byDepartment.map((x) => ({ ...x, name: x.name ?? 'بدون قسم' })));
  sheet(wb, 'بدأت', PROJECT_COLS, projectRows(d.started));
  sheet(wb, 'اكتملت', PROJECT_COLS, projectRows(d.completed));
  sheet(wb, 'تستحق خلال الفترة', PROJECT_COLS, projectRows(d.due));
  sheet(wb, 'متأخرة', PROJECT_COLS, projectRows(d.overdue));
  sheet(wb, 'القادمة', PROJECT_COLS, projectRows(d.upcoming));
  sheet(wb, 'تقارير المتابعة', [
    { header: 'المشروع', key: 'project', width: 46 }, { header: 'مقدم التقرير', key: 'author', width: 24 },
    { header: 'الحالة', key: 'status', width: 14 }, { header: 'التاريخ', key: 'date', width: 13 },
  ], d.reports.items.map((r) => ({ ...r, status: { PENDING: 'بانتظار الاعتماد', APPROVED: 'معتمد', REJECTED: 'مرفوض' }[r.status] ?? r.status, date: day(r.date) })));
  return Buffer.from(await wb.xlsx.writeBuffer());
}
