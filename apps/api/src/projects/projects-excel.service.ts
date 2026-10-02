import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators';
import { plain } from '../common/util';
import { cellText, COLUMNS, LEVEL_AR, LEVEL_FROM_AR, newWorkbook, STATUS_AR, STATUS_FROM_AR } from './excel';
import { listInclude, ProjectQuery, ProjectsService } from './projects.service';

/** Excel export, import template and import of projects, using the municipality's plan-sheet columns. */
@Injectable()
export class ProjectsExcelService {
  constructor(private prisma: PrismaService, private audit: AuditService, private projects: ProjectsService) {}

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

  async importXlsx(user: AuthUser, buffer: Buffer) {
    const tenantId = user.tenantId!;
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as any);
    } catch {
      throw new BadRequestException({ code: 'INVALID_FILE' });
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException({ code: 'INVALID_FILE' });

    // Map header text -> column index (tolerant to extra spaces and ×/x variations)
    const norm = (s: string) => s.replace(/\s+/g, '').replace(/[×xX*]/g, '');
    const headerIdx = new Map<string, number>();
    ws.getRow(1).eachCell((cell, col) => headerIdx.set(norm(cellText(cell.value)), col));
    const colOf = (key: string) => headerIdx.get(norm(COLUMNS.find((c) => c.key === key)!.header));
    if (!colOf('componentName') && !colOf('programName')) throw new BadRequestException({ code: 'MISSING_HEADERS' });

    const deps = await this.prisma.department.findMany({ where: { tenantId } });
    const depByName = new Map(deps.map((d) => [d.name.trim(), d.id]));
    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const get = (key: string) => {
        const c = colOf(key);
        return c ? cellText(row.getCell(c).value) : '';
      };
      const componentName = get('componentName');
      const programName = get('programName') || componentName;
      if (!componentName && !programName) continue;
      const numOrNull = (key: string) => {
        const v = get(key).replace(/[,\s$]/g, '');
        if (!v) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const dateOrNull = (key: string) => {
        const v = get(key);
        if (!v) return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };
      const depName = get('department');
      const departmentId = depName ? depByName.get(depName) : undefined;
      if (depName && !departmentId) errors.push({ row: r, message: `القسم غير موجود: ${depName}` });
      const extra = get('extraDepartments').split(/[،,]/).map((s) => depByName.get(s.trim())).filter(Boolean) as string[];
      const statusText = get('status');
      const status = (STATUS_FROM_AR[statusText] ?? (STATUS_AR[statusText] ? statusText : 'NOT_STARTED')) as any;
      const levelText = get('achievementLevel');
      const achievementLevel = (LEVEL_FROM_AR[levelText] ?? (LEVEL_AR[levelText] ? levelText : null)) as any;
      const pct = numOrNull('completionPercent');
      try {
        await this.prisma.project.create({
          data: {
            tenantId,
            programName: programName || componentName,
            programNumber: get('programNumber') || null,
            componentName: componentName || programName,
            componentNumber: get('componentNumber') || null,
            departmentId: departmentId ?? null,
            totalCostK: numOrNull('totalCostK'),
            yearCostK: numOrNull('yearCostK'),
            planYear: numOrNull('planYear') ?? tenant.planYear,
            startDate: dateOrNull('startDate'),
            dueDate: dateOrNull('dueDate'),
            status,
            completionPercent: Math.max(0, Math.min(100, Math.round(pct ?? (status === 'COMPLETED' ? 100 : 0)))),
            nonExecutionReasons: get('nonExecutionReasons') || null,
            spentK: numOrNull('spentK'),
            activities: get('activities') || null,
            achievementLevel,
            kpiName: get('kpiName') || null,
            kpiTarget: get('kpiTarget') || null,
            kpiActual: get('kpiActual') || null,
            localBudgetLine: get('localBudgetLine') || null,
            localContributionK: numOrNull('localContributionK'),
            partnerName: get('partnerName') || null,
            partnerContributionK: numOrNull('partnerContributionK'),
            departments: { create: [...new Set(extra)].filter((d) => d !== departmentId).map((departmentId) => ({ departmentId })) },
          },
        });
        created++;
      } catch (e: any) {
        errors.push({ row: r, message: e?.message?.slice(0, 200) ?? 'error' });
      }
    }
    await this.audit.log(user, 'project.import', 'Project', undefined, `${created} rows`);
    return { created, errors };
  }
}
