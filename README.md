# City+ · CityPlus

**منصة SaaS لمتابعة وتقييم مشاريع الخطة التنموية للبلديات والهيئات المحلية**
A multi-tenant SaaS for monitoring and evaluating municipal development-plan projects.

Built from the Dura Municipality prototype: an **admin panel** for the municipality, a **staff portal** for departments and partners, and a **platform panel** for you (the SaaS owner) to onboard municipalities.

---

## التشغيل السريع · Quick start (Docker)

```bash
docker compose up --build
```

Then open **http://localhost:3000**. Demo accounts (created because `SEED_DEMO=true`):

| الدور · Role | Email | Password |
|---|---|---|
| مالك المنصة · Platform owner | `owner@cityplus.app` | `Owner@12345` |
| مسؤول بلدية دورا · Dura admin | `admin@dura.ps` | `Admin@12345` |
| موظف الهندسة · Engineering staff | `engineering@dura.ps` | `Staff@12345` |
| موظف التنمية الاجتماعية · Social dev staff | `social@dura.ps` | `Staff@12345` |
| مسؤول بلدية تجريبية · Demo municipality admin | `admin@demo.ps` | `Admin@12345` |

`partner@example.org` is a pending sign-up, so you can try the approval flow.

> For production: set a long random `JWT_SECRET`, set `SEED_DEMO=false`, put the app behind HTTPS and set `COOKIE_SECURE=true`.

## التطوير المحلي · Local development

Requirements: Node 20+ and PostgreSQL 16 (or `docker compose up -d db`).

```bash
# 1) API
cd apps/api
cp .env.example .env          # adjust DATABASE_URL if needed
npm install
npx prisma db push            # create tables
npm run seed                  # demo data (optional)
npm run dev                   # http://localhost:4000

# 2) Web (second terminal)
cd apps/web
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

When the schema changes, prefer `npx prisma migrate dev --name <change>` so you keep migration history for production.

## البنية · Architecture

```
apps/
  api/   NestJS 10 + Prisma 5 + PostgreSQL   → REST API on :4000
  web/   Next.js 14 (App Router) + React 18 + Tailwind + TanStack Query → :3000
```

- The browser only talks to `/api/*` on the web origin; Next.js forwards it to the API. The login cookie is `httpOnly` and first-party, so no CORS setup is needed.
- **Multi-tenancy**: every record has a `tenantId`. The API always takes the tenant from the signed-in user and never from the request, so municipalities cannot see each other's data.
- **Roles**: `SUPER_ADMIN` (platform owner), `ADMIN` (municipality admin, المسؤول), `STAFF` (department employee or external partner).
- Every sensitive action is written to an **audit log** (سجل النشاط).

## الوظائف · Features

**Admin panel (`/admin`)**
- Dashboard: KPIs, completion by department, projects by status, cost vs. spent, funding split, calendar of start and due dates, overdue and upcoming lists, recent activity.
- Projects: search, filters (status, department, overdue or due soon), sort, pagination, and the **4-step wizard** from the prototype:
  1. اسم ورقم المشروع: program and component name and number, total and yearly cost ×1000$, responsible and additional departments, dates, assigned staff
  2. المتابعة والتقييم: status, completion %, reasons for non-execution, spent this year, activities
  3. تقييم مستوى الإنجاز: achievement level, KPI name, target and actual, notes
  4. الجهة الممولة: local authority budget line and contribution, partner and contribution, funding gap
- **Excel import and export** using the plan-matrix columns (Arabic headers), plus a downloadable template.
- Reports: approve or reject staff progress reports, with a before/after comparison of every field.
- Users: approve sign-ups, add users, set roles and departments, disable users, reset passwords, and **toggle which projects each user follows** (as in the prototype).
- Departments CRUD, activity log, and municipality settings (plan year, whether reports need approval).

**Staff portal (`/portal`)**
- Home: my projects, calendar, pending and rejected reports.
- My projects: cards with progress, **Update progress** and **Mark complete**.
- Progress report wizard: step 1 is locked (*فقط المسؤول يمكنه التعديل على هذه المعلومات*). Fields marked `**` are required, as in the prototype.
- My reports: see the review note, withdraw a pending report, and resubmit a rejected one.

**Platform panel (`/platform`)**
- Create municipalities with their first admin and default departments; set plan and user limit; suspend or activate.

**Everywhere**: Arabic-first RTL UI with a one-click English toggle, responsive down to phone width, and self-service sign-up with admin approval.

## API overview

| Method | Path | Who |
|---|---|---|
| POST | `/auth/login` · `/auth/signup` · `/auth/logout` | public |
| GET/PATCH | `/auth/me` · POST `/auth/password` | any user |
| GET | `/public/tenants` · `/public/tenants/:slug/departments` | public (sign-up form) |
| GET/POST/PATCH/DELETE | `/projects` `/projects/:id` | list/get: admin + assigned staff; write: admin |
| GET | `/projects/export` · `/projects/import/template` · POST `/projects/import` | admin (export: any) |
| POST | `/projects/:id/reports` | assigned staff, admin |
| GET | `/reports` · `/reports/:id` · POST `/reports/:id/approve` `/reject` · DELETE `/reports/:id` | admin; staff see their own |
| CRUD | `/users` · PUT `/users/:id/projects` · POST `/users/:id/password` | admin |
| CRUD | `/departments` | read: any; write: admin |
| GET | `/dashboard` · `/dashboard/me` · `/dashboard/calendar?month=YYYY-MM` | admin / staff |
| GET/PATCH | `/settings` · GET `/audit` | admin |
| CRUD | `/platform/tenants` · GET `/platform/stats` | platform owner |

## Next steps (suggested)

- Email notifications (report submitted, approved, rejected, account approved) through SMTP.
- File attachments on reports (photos and invoices) stored in S3-compatible storage.
- Printable PDF report per project or department for council meetings.
- Billing for subscriptions (e.g. Stripe) if you sell the platform to more municipalities.
# CityPlus
