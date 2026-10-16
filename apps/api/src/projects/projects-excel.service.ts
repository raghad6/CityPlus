import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators';
import { plain } from '../common/util';
import { cellText, COLUMNS, LEVEL_AR, matchHeaders, newWorkbook, normText, parseDate, parseLevel, parseNumber, parseStatus, STATUS_AR } from './excel';
import { listInclude, ProjectQuery, ProjectsService } from './projects.service';
import { ProjectEventsService } from '../project-events/project-events.service';

/** Excel export, import template and import of projects, using the municipality's plan-sheet columns. */
@Injectable()
export class ProjectsExcelService {
  constructor(private prisma: PrismaService, private audit: AuditService, private projects: ProjectsService, private events: ProjectEventsService) {}

  async exportXlsx(user: AuthUser, q: ProjectQuery): Promise<Buffer> {
    const items = await this.prisma.project.findMany({
      where: this.projects.buildWhere(user, q),
      include: listInclude,
      orderBy: [{ programNumber: 'asc' }, { componentNumber: 'asc' }],
    });
    const { wb, ws } = newWorkbook();
    for (const p of plain(items) as any[]) {
      const row: Record<string, unknown> = {};
      for (const c of COLUMNS) {
        if (c.type === 'dept') row[c.key] = p.department?.name ?? '';
        else if (c.type === 'depts') row[c.key] = p.departments.map((d: any) => d.department.name).join('، ');
        else if (c.type === 'status') row[c.key] = STATUS_AR[p.status] ?? p.status;
        else if (c.type === 'level') row[c.key] = p.achievementLevel ? LEVEL_AR[p.achievementLevel] : '';
        else if (c.type === 'date') row[c.key] = p[c.key] ? new Date(p[c.key]) : null;
        else row[c.key] = p[c.key] ?? '';
      }
      ws.addRow(row);
    }
    ws.eachRow((r, i) => { if (i > 1) r.alignment = { vertical: 'top', wrapText: true }; });
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async templateXlsx(tenantId: string): Promise<Buffer> {
    const { wb, ws } = newWorkbook();
    const deps = await this.prisma.department.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    ws.addRow({
      programNumber: '1', programName: 'مثال: تطوير البنية التحتية', componentNumber: '1.1',
      componentName: 'مثال: تعبيد شارع رئيسي', department: deps[0]?.name ?? '', totalCostK: 150, yearCostK: 50,
      planYear: tenant.planYear, status: 'لم يبدأ', completionPercent: 0,
    });
    const help = wb.addWorksheet('القوائم', { views: [{ rightToLeft: true }] });
    help.columns = [
      { header: 'الأقسام', key: 'd', width: 36 },
      { header: 'حالات المشروع', key: 's', width: 18 },
      { header: 'مستوى الإنجاز', key: 'l', width: 16 },
    ];
    const statuses = Object.values(STATUS_AR);
    const levels = Object.values(LEVEL_AR);
    for (let i = 0; i < Math.max(deps.length, statuses.length); i++) {
      help.addRow({ d: deps[i]?.name ?? '', s: statuses[i] ?? '', l: levels[i] ?? '' });
    }
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  /**
   * Import projects from any Excel sheet. The header row is found automatically (any sheet, first 15 rows) and
   * columns are matched to project fields by name; columns that match nothing are ignored.
   */
  async importXlsx(user: AuthUser, buffer: Buffer) {
    const tenantId = user.tenantId!;
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as any);
    } catch {
      throw new BadRequestException({ code: 'INVALID_FILE' });
    }

    // Pick the sheet and header row whose cells match the most project fields.
    let best: { ws: ExcelJS.Worksheet; headerRow: number; headers: Map<number, string>; cols: Map<string, number> } | null = null;
    for (const ws of wb.worksheets) {
      for (let r = 1; r <= Math.min(15, ws.rowCount); r++) {
        const headers = new Map<number, string>();
        ws.getRow(r).eachCell((cell, col) => { const t = cellText(cell.value); if (t) headers.set(col, t); });
        const cols = matchHeaders(headers);
        if (cols.size > (best?.cols.size ?? 0)) best = { ws, headerRow: r, headers, cols };
      }
    }
    if (!best) throw new BadRequestException({ code: 'MISSING_HEADERS' });
    const { ws, headerRow, headers, cols } = best;

    // No name column recognised: use the first unmatched column that holds text.
    const usedCols = new Set(cols.values());
    if (!cols.has('componentName') && !cols.has('programName')) {
      const textCol = [...headers.keys()].find((c) => {
        if (usedCols.has(c)) return false;
        for (let r = headerRow + 1; r <= Math.min(ws.rowCount, headerRow + 20); r++) {
          const t = cellText(ws.getRow(r).getCell(c).value);
          if (t && parseNumber(t) == null) return true;
        }
        return false;
      });
      if (!textCol) throw new BadRequestException({ code: 'MISSING_HEADERS' });
      cols.set('componentName', textCol);
      usedCols.add(textCol);
    }

    const deps = await this.prisma.department.findMany({ where: { tenantId } });
    const depByName = new Map<string, string>();
    for (const d of deps) {
      depByName.set(normText(d.name), d.id);
      if (d.nameEn) depByName.set(normText(d.nameEn), d.id);
    }
    // Sum rows such as "المجموع الكلي (متناه) - دولار أمريكي" or "Grand total" are not projects.
    const totalPrefixes = ['المجموع', 'الاجمالي', 'اجمالي', 'total', 'grand total', 'subtotal', 'sub total'].map(normText);
    const isTotalRow = (name: string) => totalPrefixes.some((t) => normText(name).startsWith(t));
    const errors: { row: number; message: string }[] = [];
    let created = 0;
    let updated = 0;
    let unchanged = 0;

    // Existing projects, so a row that matches one updates it instead of creating a duplicate.
    const existing = await this.prisma.project.findMany({
      where: { tenantId },
      include: { departments: { select: { departmentId: true } } },
    });
    const pool: ExistingProject[] = existing.map((p) => ({ ...p, extraIds: p.departments.map((d) => d.departmentId) }));

    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const raw = (key: string) => { const c = cols.get(key); return c ? row.getCell(c).value : null; };
      const get = (key: string) => cellText(raw(key));
      const num = (key: string) => parseNumber(get(key));

      const componentName = get('componentName');
      const programName = get('programName');
      const name = componentName || programName;
      if (!name || isTotalRow(name)) continue;

      const depName = get('department');
      const departmentId = depName ? depByName.get(normText(depName)) : undefined;
      if (depName && !departmentId) errors.push({ row: r, message: `القسم غير موجود: ${depName}` });
      const extra = [...new Set(get('extraDepartments').split(/[،,؛;\n]/).map((s) => depByName.get(normText(s))).filter(Boolean) as string[])];

      const statusText = get('status');
      const status = statusText ? parseStatus(statusText) : undefined;
      if (statusText && !status) errors.push({ row: r, message: `حالة غير معروفة: ${statusText}` });
      const levelText = get('achievementLevel');
      const achievementLevel = levelText ? parseLevel(levelText) : undefined;

      // A cell formatted as a percentage holds 0.45 for 45%.
      const pctCell = cols.has('completionPercent') ? row.getCell(cols.get('completionPercent')!) : null;
      let pct = num('completionPercent');
      if (pct != null && pctCell?.numFmt?.includes('%') && pct <= 1) pct *= 100;

      // Only the cells that have a value; an empty cell never erases existing data.
      const fields: Record<string, any> = {};
      if (programName) fields.programName = programName;
      if (componentName) fields.componentName = componentName;
      for (const k of ['programNumber', 'componentNumber', 'nonExecutionReasons', 'activities', 'kpiName', 'kpiTarget', 'kpiActual', 'localBudgetLine', 'partnerName']) {
        const v = get(k);
        if (v) fields[k] = v;
      }
      for (const k of ['totalCostK', 'yearCostK', 'spentK', 'localContributionK', 'partnerContributionK', 'planYear']) {
        const v = num(k);
        if (v != null) fields[k] = k === 'planYear' ? Math.round(v) : v;
      }
      for (const k of ['startDate', 'dueDate']) {
        const d = parseDate(raw(k));
        if (d) fields[k] = d;
      }
      if (departmentId) fields.departmentId = departmentId;
      if (status) fields.status = status;
      if (achievementLevel) fields.achievementLevel = achievementLevel;
      if (pct != null) fields.completionPercent = Math.max(0, Math.min(100, Math.round(pct)));

      try {
        const match = findExisting(pool, { componentName, programName, componentNumber: get('componentNumber'), programNumber: get('programNumber') });
        if (match) {
          // Names that differ only in spacing or letter forms (أ/ا, ة/ه) are the same name: keep the stored spelling.
          const changes = Object.fromEntries(Object.entries(fields).filter(([k, v]) =>
            NAME_FIELDS.includes(k) ? normText((match as any)[k] ?? '') !== normText(v) : !sameValue((match as any)[k], v)));
          const newExtra = extra.filter((d) => d !== (changes.departmentId ?? match.departmentId));
          const extraChanged = newExtra.length > 0 && !sameSet(newExtra, match.extraIds);
          if (!Object.keys(changes).length && !extraChanged) { unchanged++; continue; }
          await this.prisma.project.update({
            where: { id: match.id },
            data: {
              ...changes,
              ...(extraChanged && { departments: { deleteMany: {}, create: newExtra.map((departmentId) => ({ departmentId })) } }),
            },
          });
          Object.assign(match, changes);
          if (extraChanged) match.extraIds = newExtra;
          updated++;
        } else {
          const finalStatus = status ?? 'NOT_STARTED';
          const p = await this.prisma.project.create({
            data: {
              ...fields,
              tenantId,
              programName: programName || componentName,
              componentName: componentName || programName,
              planYear: fields.planYear ?? tenant.planYear,
              status: finalStatus,
              completionPercent: fields.completionPercent ?? (finalStatus === 'COMPLETED' ? 100 : 0),
              departments: { create: extra.filter((d) => d !== departmentId).map((departmentId) => ({ departmentId })) },
            } as any,
          });
          // A later row of the same file can now match (and update) this project.
          pool.push({ ...p, extraIds: extra.filter((d) => d !== departmentId) });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: r, message: e?.message?.slice(0, 200) ?? 'error' });
      }
    }
    await this.audit.log(user, 'project.import', 'Project', undefined, `${created} new, ${updated} updated, ${unchanged} unchanged`);
    this.events.scanSoon();

    const matched = [...cols].sort((a, b) => a[1] - b[1]).map(([key, col]) => {
      const c = COLUMNS.find((x) => x.key === key)!;
      return { column: headers.get(col) ?? '', field: key, label: c.header, labelEn: c.labelEn };
    });
    const ignored = [...headers].filter(([col]) => !usedCols.has(col)).map(([, text]) => text);
    return { created, updated, unchanged, errors, sheet: ws.name, headerRow, matched, ignored };
  }
}

type ExistingProject = Project & { extraIds: string[] };
const NAME_FIELDS = ['programName', 'componentName', 'programNumber', 'componentNumber'];

/**
 * The existing project a sheet row refers to, if any:
 * same component number (and program number, when both sides have one), otherwise the same component name.
 * When several projects match, the program name decides; if it still can't, the row is treated as new.
 */
function findExisting(
  pool: ExistingProject[],
  row: { componentName: string; programName: string; componentNumber: string; programNumber: string },
): ExistingProject | undefined {
  const k = (s?: string | null) => normText(s ?? '');
  const pick = (list: ExistingProject[]) => {
    if (list.length <= 1) return list[0];
    const byProgram = row.programName ? list.filter((p) => k(p.programName) === k(row.programName)) : [];
    return byProgram.length === 1 ? byProgram[0] : undefined;
  };
  if (row.componentNumber) {
    const byNumber = pool.filter((p) =>
      k(p.componentNumber) === k(row.componentNumber)
      && (!row.programNumber || !p.programNumber || k(p.programNumber) === k(row.programNumber)));
    const sameName = byNumber.filter((p) => k(p.componentName) === k(row.componentName || row.programName));
    const found = pick(sameName.length ? sameName : byNumber);
    if (found) return found;
  }
  return pick(pool.filter((p) => k(p.componentName) === k(row.componentName || row.programName)));
}

/** Compares a stored value (string, Decimal, Date, null) with a value read from the sheet. */
function sameValue(stored: unknown, incoming: unknown): boolean {
  if (stored == null) return incoming == null;
  if (incoming instanceof Date) return stored instanceof Date && stored.getTime() === incoming.getTime();
  if (typeof incoming === 'number') return Number(stored) === incoming;
  return String(stored).trim() === String(incoming).trim();
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
