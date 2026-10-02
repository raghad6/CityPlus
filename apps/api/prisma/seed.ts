/* eslint-disable no-console */
import { PrismaClient, ProjectStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_DEPARTMENTS } from '../src/platform/default-departments';

const prisma = new PrismaClient();
const day = 86400_000;
const d = (offsetDays: number) => new Date(Date.now() + offsetDays * day);

// Projects from the Dura municipality plan shown in the prototype. Costs/progress are demo values.
const DURA_PROJECTS: {
  programNumber: string; programName: string; componentNumber: string; componentName: string; dept: string; extra?: string[];
  total: number; year: number; status: ProjectStatus; pct: number; spent?: number; start: number; due: number; reasons?: string;
}[] = [
  { programNumber: '1', programName: 'تطوير شبكة الطرق', componentNumber: '1.1', componentName: 'مشروع تعبيد شبكة طرق مستشفى دورا الحكومي', dept: 'البيئة والبنى التحتية', extra: ['الهندسة والتخطيط'], total: 420, year: 200, status: 'IN_PROGRESS', pct: 55, spent: 110, start: -120, due: 20 },
  { programNumber: '1', programName: 'تطوير شبكة الطرق', componentNumber: '1.2', componentName: 'تأهيل طرق داخلية بطول 15 كم', dept: 'البيئة والبنى التحتية', total: 900, year: 300, status: 'PARTIAL', pct: 30, spent: 95, start: -200, due: 90, reasons: 'تأخر وصول التمويل من الجهة المانحة' },
  { programNumber: '2', programName: 'تطوير الاقتصاد المحلي', componentNumber: '2.1', componentName: 'انشاء وتجهيز سوق خضار مركزي', dept: 'مجال تنمية الاقتصاد المحلي', extra: ['قسم الهندسة والتنظيم'], total: 650, year: 250, status: 'COMPLETED', pct: 100, spent: 250, start: -300, due: -10 },
  { programNumber: '2', programName: 'تطوير الاقتصاد المحلي', componentNumber: '2.2', componentName: 'بناء قدرات ودعم المشاريع الزراعية الريادية', dept: 'مجال تنمية الاقتصاد المحلي', total: 120, year: 60, status: 'IN_PROGRESS', pct: 40, spent: 22, start: -60, due: 45 },
  { programNumber: '2', programName: 'تطوير الاقتصاد المحلي', componentNumber: '2.3', componentName: 'توفير برامج تدريب لرفع القدرات البشرية في القطاع السياحي', dept: 'مجال تنمية الاقتصاد المحلي', total: 80, year: 40, status: 'NOT_STARTED', pct: 0, start: 15, due: 150, reasons: 'بانتظار توقيع اتفاقية الشراكة' },
  { programNumber: '3', programName: 'الطاقة والخدمات', componentNumber: '3.1', componentName: 'ربط المدارس بخط كهرباء 63 أمبير', dept: 'الخدمات العامة', total: 75, year: 75, status: 'IN_PROGRESS', pct: 70, spent: 48, start: -90, due: 3 },
  { programNumber: '3', programName: 'الطاقة والخدمات', componentNumber: '3.2', componentName: 'نظام التحكم عن بعد في شبكات المياه SCADA', dept: 'البيئة والبنى التحتية', total: 350, year: 150, status: 'IN_PROGRESS', pct: 25, spent: 40, start: -45, due: 12 },
  { programNumber: '3', programName: 'الطاقة والخدمات', componentNumber: '3.3', componentName: 'توسعة شبكة المياه 10 كم', dept: 'البيئة والبنى التحتية', total: 500, year: 180, status: 'POSTPONED', pct: 10, spent: 12, start: -150, due: -5, reasons: 'تأجيل بسبب إعادة ترتيب أولويات الموازنة' },
  { programNumber: '3', programName: 'الطاقة والخدمات', componentNumber: '3.4', componentName: 'التوعية بأهمية استخدام الطاقة البديلة في المؤسسات الحكومية والأهلية', dept: 'الخدمات العامة', total: 30, year: 30, status: 'COMPLETED', pct: 100, spent: 28, start: -240, due: -60 },
  { programNumber: '4', programName: 'التنمية الاجتماعية', componentNumber: '4.1', componentName: 'توزيع مساعدات نقدية للأسر الفقيرة والمهمشة في مدينة دورا', dept: 'مجال التنمية الاجتماعية', total: 200, year: 100, status: 'IN_PROGRESS', pct: 60, spent: 58, start: -80, due: 7 },
  { programNumber: '4', programName: 'التنمية الاجتماعية', componentNumber: '4.2', componentName: 'أنشطة تعزيز الوعي المجتمعي في قضايا ذوي الإعاقة', dept: 'مجال التنمية الاجتماعية', extra: ['قسم العلاقات العامة والإعلام'], total: 25, year: 25, status: 'IN_PROGRESS', pct: 35, spent: 8, start: -30, due: 60 },
  { programNumber: '4', programName: 'التنمية الاجتماعية', componentNumber: '4.3', componentName: 'توفير مشاريع صغيرة للفئات المهمشة', dept: 'مجال التنمية الاجتماعية', total: 150, year: 70, status: 'STOPPED', pct: 15, spent: 10, start: -180, due: 30, reasons: 'توقف التمويل من الشريك' },
  { programNumber: '4', programName: 'التنمية الاجتماعية', componentNumber: '4.4', componentName: 'تأهيل استاد دورا الدولي كمركز إيواء في حالات الكوارث', dept: 'الخدمات العامة', extra: ['الهندسة والتخطيط'], total: 380, year: 120, status: 'NOT_STARTED', pct: 0, start: 30, due: 200, reasons: 'قيد إعداد المخططات الهندسية' },
  { programNumber: '5', programName: 'الحكم الرشيد والرقمنة', componentNumber: '5.1', componentName: 'توفير قاعدة بيانات إلكترونية مركزية', dept: 'الإدارة والحكم الرشيد', total: 90, year: 90, status: 'IN_PROGRESS', pct: 80, spent: 70, start: -150, due: 25 },
  { programNumber: '5', programName: 'الحكم الرشيد والرقمنة', componentNumber: '5.2', componentName: 'مشروع رقمنة خدمات البلدية (Work Flow & E. Municipality)', dept: 'الإدارة والحكم الرشيد', extra: ['قسم العلاقات العامة والإعلام'], total: 160, year: 80, status: 'IN_PROGRESS', pct: 45, spent: 35, start: -100, due: 75 },
  { programNumber: '6', programName: 'السياحة والترفيه', componentNumber: '6.1', componentName: 'أعمال صيانة وتطوير متحف دورا التاريخي', dept: 'قسم الهندسة والتنظيم', total: 140, year: 70, status: 'IN_PROGRESS', pct: 65, spent: 45, start: -110, due: 0 },
  { programNumber: '6', programName: 'السياحة والترفيه', componentNumber: '6.2', componentName: 'صيانة وتطوير الأماكن الترفيهية التابعة للبلدية (المسبح، منتزه سيدنا، حديقة بير الواد)', dept: 'قسم الهندسة والتنظيم', total: 210, year: 100, status: 'PARTIAL', pct: 50, spent: 50, start: -160, due: 40, reasons: 'تم تنفيذ المسبح والمنتزه، الحديقة في المرحلة القادمة' },
  { programNumber: '7', programName: 'البنية المجتمعية', componentNumber: '7.1', componentName: 'إنشاء مقبرة تضم 200 قبر', dept: 'الهندسة والتخطيط', total: 60, year: 60, status: 'COMPLETED', pct: 100, spent: 58, start: -270, due: -30 },
  { programNumber: '7', programName: 'البنية المجتمعية', componentNumber: '7.2', componentName: 'إنشاء وتشطيب طابق إضافي للمستشفى لاستيعاب الأقسام الإضافية', dept: 'الهندسة والتخطيط', extra: ['البيئة والبنى التحتية'], total: 1200, year: 400, status: 'CANCELLED', pct: 0, start: -60, due: 300, reasons: 'تم نقل المشروع إلى وزارة الصحة' },
];

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  // Platform owner
  await prisma.user.upsert({
    where: { email: 'owner@cityplus.app' },
    update: {},
    create: { name: 'مالك المنصة', email: 'owner@cityplus.app', passwordHash: await hash('Owner@12345'), role: 'SUPER_ADMIN', status: 'ACTIVE' },
  });

  // Municipality: Dura
  const dura = await prisma.tenant.upsert({
    where: { slug: 'dura' },
    update: {},
    create: { name: 'بلدية دورا', nameEn: 'Dura Municipality', slug: 'dura', city: 'دورا - الخليل', planYear: 2025, plan: 'PREMIUM', maxUsers: 100 },
  });
  for (const dep of DEFAULT_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { tenantId_name: { tenantId: dura.id, name: dep.name } },
      update: {},
      create: { ...dep, tenantId: dura.id },
    });
  }
  const deps = await prisma.department.findMany({ where: { tenantId: dura.id } });
  const depId = (name: string) => deps.find((x) => x.name === name)!.id;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dura.ps' },
    update: {},
    create: { tenantId: dura.id, name: 'مدير النظام', email: 'admin@dura.ps', passwordHash: await hash('Admin@12345'), role: 'ADMIN', status: 'ACTIVE', departmentId: depId('الإدارة والحكم الرشيد') },
  });
  const staffDefs = [
    { email: 'social@dura.ps', name: 'موظف التنمية الاجتماعية', dept: 'مجال التنمية الاجتماعية', status: 'ACTIVE' as const },
    { email: 'engineering@dura.ps', name: 'موظف الهندسة والتخطيط', dept: 'الهندسة والتخطيط', status: 'ACTIVE' as const },
    { email: 'media@dura.ps', name: 'موظف العلاقات العامة', dept: 'قسم العلاقات العامة والإعلام', status: 'ACTIVE' as const },
    { email: 'partner@example.org', name: 'ممثل جهة شريكة', dept: 'جهة خارجية', status: 'PENDING' as const },
  ];
  const staff: Record<string, string> = {};
  for (const s of staffDefs) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { tenantId: dura.id, name: s.name, email: s.email, passwordHash: await hash('Staff@12345'), role: 'STAFF', status: s.status, departmentId: depId(s.dept) },
    });
    staff[s.email] = u.id;
  }

  if ((await prisma.project.count({ where: { tenantId: dura.id } })) === 0) {
    for (const p of DURA_PROJECTS) {
      const project = await prisma.project.create({
        data: {
          tenantId: dura.id,
          programNumber: p.programNumber, programName: p.programName,
          componentNumber: p.componentNumber, componentName: p.componentName,
          departmentId: depId(p.dept),
          totalCostK: p.total, yearCostK: p.year, planYear: 2025,
          status: p.status, completionPercent: p.pct, spentK: p.spent ?? 0,
          nonExecutionReasons: p.reasons,
          activities: p.pct > 0 ? 'تم تنفيذ الأنشطة حسب الخطة الزمنية المعتمدة' : null,
          startDate: d(p.start), dueDate: d(p.due),
          localBudgetLine: 'موازنة المشاريع التطويرية', localContributionK: Math.round(p.year * 0.3),
          partnerName: 'صندوق تطوير وإقراض الهيئات المحلية', partnerContributionK: Math.round(p.year * 0.7),
          achievementLevel: p.pct >= 80 ? 'EXCELLENT' : p.pct >= 50 ? 'GOOD' : p.pct >= 20 ? 'AVERAGE' : null,
          departments: { create: (p.extra ?? []).map((n) => ({ departmentId: depId(n) })) },
        },
      });
      // Assign staff by department
      const assignees = staffDefs
        .filter((s) => s.status === 'ACTIVE' && (s.dept === p.dept || p.extra?.includes(s.dept)))
        .map((s) => staff[s.email]);
      if (assignees.length) {
        await prisma.projectAssignment.createMany({ data: assignees.map((userId) => ({ userId, projectId: project.id })) });
      }
    }
    // Engineering staff also follows the hospital roads project (as in the prototype)
    const roads = await prisma.project.findFirst({ where: { tenantId: dura.id, componentNumber: '1.1' } });
    if (roads) {
      await prisma.projectAssignment.upsert({
        where: { projectId_userId: { projectId: roads.id, userId: staff['engineering@dura.ps'] } },
        update: {},
        create: { projectId: roads.id, userId: staff['engineering@dura.ps'] },
      });
      // A pending report waiting for admin review
      await prisma.report.create({
        data: {
          tenantId: dura.id, projectId: roads.id, authorId: staff['engineering@dura.ps'], status: 'PENDING',
          payload: {
            status: 'IN_PROGRESS', completionPercent: 65, spentK: 140,
            activities: 'تم الانتهاء من أعمال الحفر والتسوية وصب الطبقة الأساسية لمسافة 1.2 كم',
            localContributionK: 60, partnerContributionK: 140, kpiName: 'طول الطرق المعبدة (كم)', kpiTarget: '2', kpiActual: '1.2',
          },
        },
      });
    }
    await prisma.auditLog.create({ data: { tenantId: dura.id, userId: admin.id, action: 'project.import', entityType: 'Project', summary: `${DURA_PROJECTS.length} rows` } });
  }

  // A second municipality to demonstrate tenant isolation
  const demo = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: { name: 'بلدية تجريبية', nameEn: 'Demo Municipality', slug: 'demo', city: 'فلسطين', planYear: 2025, plan: 'BASIC', maxUsers: 20 },
  });
  if ((await prisma.department.count({ where: { tenantId: demo.id } })) === 0) {
    await prisma.department.createMany({ data: DEFAULT_DEPARTMENTS.map((x) => ({ ...x, tenantId: demo.id })) });
  }
  await prisma.user.upsert({
    where: { email: 'admin@demo.ps' },
    update: {},
    create: { tenantId: demo.id, name: 'مدير البلدية التجريبية', email: 'admin@demo.ps', passwordHash: await hash('Admin@12345'), role: 'ADMIN', status: 'ACTIVE' },
  });

  console.log('Seed complete.');
  console.log('  Platform owner : owner@cityplus.app / Owner@12345');
  console.log('  Dura admin     : admin@dura.ps / Admin@12345');
  console.log('  Dura staff     : engineering@dura.ps / Staff@12345 (also social@, media@)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
