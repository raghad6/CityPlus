# City+ · CityPlus

**منصة لمتابعة وتقييم مشاريع الخطة التنموية للبلديات والهيئات المحلية**

City+ helps municipalities follow their yearly development-plan projects in one place instead of many Excel files. Departments report their progress, the municipality approves it, and dashboards, alerts and reports update by themselves.

It's a multi-municipality platform: each municipality has its own users, departments and projects, and can never see another municipality's data. The interface is Arabic first (right-to-left), with a one-click switch to English.

---

## The 3 roles

| Role | Who | Where | What they can do |
|---|---|---|---|
| **Platform owner** (`SUPER_ADMIN`) | The team running City+ | `/platform-owner` | Add municipalities and their first admin, set each one's plan and user limit, and suspend or activate them. |
| **Municipality admin** (`ADMIN`, المسؤول) | The planning unit of a municipality | `/admin` | See the dashboard; add projects, import them from Excel or export them; approve or reject staff reports; manage users and departments; create weekly, monthly or on-demand reports; view the activity log; change settings. |
| **Staff** (`STAFF`) | Department employees or external partners | `/portal` | See only the projects assigned to them, send progress reports, mark projects complete, and follow up on their reports. |

Everyone gets in-app notifications when their projects start, reach their end date or are completed.

## Main features

- **Dashboard:** totals, completion by department, projects by status, budget vs. spent, overdue and upcoming projects, and a calendar.
- **Projects:**
  - a 4-step form: name and numbers, follow-up, achievement level, funding;
  - search and filters;
  - select several projects to delete them together.
- **Excel import:** reads the municipality's existing plan sheet, even if the columns don't match exactly. Projects that already exist are updated instead of being duplicated.
- **Progress reports:** staff submit updates, and the admin approves them after seeing a before/after comparison.
- **Weekly, monthly and on-demand reports:** created automatically or whenever needed, viewable in the app, downloadable as Excel, and printable.
- **Activity log:** every important action is recorded.

## Tech stack

| Part | Built with |
|---|---|
| **Frontend** (`apps/web`) | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** (`apps/api`) | NestJS 10, TypeScript, Prisma 5 |
| **Database** | PostgreSQL 16 |

Other libraries: TanStack Query (data loading), Recharts (charts), ExcelJS (Excel files) and lucide-react (icons). The full list is in each app's `package.json`.

---

## How it works

### Request flow

```
Browser ──► Web app (Next.js :3000) ──/api/*──► API (NestJS :4000) ──► PostgreSQL (:5432)
            pages + cached data                 rules, permissions        storage
```

- The browser only calls `/api/...` on the web app's own address. Next.js forwards those calls to the API (`apps/web/next.config.mjs`). That keeps the login cookie first-party and avoids CORS.
- **The API is the only place that enforces permissions.** The web app hides areas and buttons a role can't use, but every request is checked again on the server.

### Inside the API: what happens on every request

1. `ThrottlerGuard`: rate limit (300 requests per minute).
2. `AuthGuard` (`common/auth.guard.ts`): reads the `cityplus_token` cookie, verifies the JWT and re-reads the user, so a disabled user or suspended municipality is cut off immediately. Routes marked `@Public()` skip this.
3. `RolesGuard` (`common/roles.guard.ts`): checks the `@Roles(...)` on the controller.
4. `ValidationPipe`: checks the body against the DTO and strips unknown fields.
5. The **controller** passes the request to the **service**, which applies the rules, saves through Prisma and writes to the activity log.
6. `PrismaExceptionFilter` turns "not found" and "duplicate" database errors into clean 404 and 409 responses.

### Multi-tenancy

Each municipality is a `Tenant`. Every business table has a `tenantId`. The API always takes it from the signed-in user (`@TenantId()`), never from the request, so one municipality can never read or change another's data. Staff see only the projects assigned to them (`projects/project-rules.ts`).

### Login and routing

`POST /auth/login` checks the password, signs a JWT (7 days by default) and sets it as an httpOnly cookie. In the web app, `middleware.ts` reads the role from that cookie and sends each user to their area (`/platform-owner`, `/admin` or `/portal`). The rules are in `features/auth/roles.ts`.

### Progress-report workflow

1. Staff submit changes for a project (steps 2–4 of the project form).
2. If the municipality requires approval, the report waits as `PENDING`. The admin approves it, which copies the changes onto the project in one transaction, or rejects it with a reason.
3. Reports from admins, and from municipalities that don't require approval, apply immediately.

### Background jobs (`project-events/`)

| When | What |
|---|---|
| Every 5 minutes | Notify people about projects that started, reached their end date or were completed (each event only once) |
| Sunday 07:00 | Generate last week's performance report |
| 1st of the month, 07:00 | Generate last month's performance report |

Times use `APP_TZ` (default `Asia/Hebron`).

### Database (`apps/api/prisma/schema.prisma`)

```
Tenant (municipality)
 ├── User            role SUPER_ADMIN | ADMIN | STAFF; status PENDING | ACTIVE | DISABLED
 ├── Department      isExternal = an outside partner
 ├── Project         the 4-step plan form (identity, follow-up, evaluation, funding)
 │    ├── ProjectDepartment   extra departments sharing the project
 │    ├── ProjectAssignment   staff who follow the project
 │    └── Report              progress report; payload = proposed changes
 ├── Notification    in-app notification, stored in Arabic and English
 ├── SummaryReport   weekly / monthly / on-demand report (data snapshot)
 └── AuditLog        who did what, and when
```

Money fields are stored in thousands of USD, as in the municipal plan sheet.

---

## Run it locally

You need **Node.js 20 or newer** and **Git**. Get the code first:

```bash
git clone https://github.com/raghad6/CityPlus.git
cd CityPlus
```

Then choose **one** of the options below.

### Option A: With Docker (easiest)

If you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed, run:

```bash
docker compose up --build
```

This starts the database, the backend and the website together, and fills them with demo data. Open **http://localhost:3000** when it's ready.

### Option B: Without Docker

You'll use **3 terminals**, all starting in the project folder.

**Terminal 1: database.** If you already have PostgreSQL 16, create a database and skip this step. Otherwise, the project includes a small local PostgreSQL you can start with:

```bash
npm --prefix .local-postgres install
node .local-postgres/start.mjs
```

Leave this terminal open. The database runs on port 5432, and its data is saved in `.local-postgres/data`.

**Terminal 2: backend.**

```bash
cd apps/api
cp .env.example .env     # settings; already match the local database above
npm install
npx prisma db push       # creates the database tables
npm run seed             # adds demo data and demo accounts (optional)
npm run dev              # starts the backend on http://localhost:4000
```

**Terminal 3: website.**

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev              # starts the website on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

### Signing in

The seed step creates demo accounts you can use right away, one for each role:

| Role | Email | Password |
|---|---|---|
| Platform owner | `owner@cityplus.app` | `Owner@12345` |
| Dura municipality admin | `admin@dura.ps` | `Admin@12345` |
| Engineering staff | `engineering@dura.ps` | `Staff@12345` |

**New users:** when the platform owner or a municipality admin adds a user, that user signs in with the email and password they were given.

To try the Docker setup without demo data, run `SEED_DEMO=false docker compose up --build`.

### Viewing the database

To browse the tables and data in your browser, run:

```bash
cd apps/api
npx prisma studio        # opens http://localhost:5555
```

The tables are defined in `apps/api/prisma/schema.prisma`.

### Common problems

| Problem | Fix |
|---|---|
| `Can't reach database server` | The database isn't running. Start Terminal 1 again, or check `DATABASE_URL` in `apps/api/.env`. |
| `Port 3000/4000/5432 is already in use` | Another copy is still running. Close it, or stop whatever is using that port. |
| The website loads but nothing works | The backend (Terminal 2) isn't running. |

---

## Before going live

Change these settings in the backend environment:

| Setting | Value |
|---|---|
| `JWT_SECRET` | A long random value |
| `COOKIE_SECURE` | `true` (the site must use HTTPS) |
| `SEED_DEMO` | `false`, so the demo accounts aren't created |
| `DATABASE_URL` | Your production database |
| `APP_TZ` | Your time zone (default `Asia/Hebron`) |

## Project structure

```
cityplus/
├── apps/
│   ├── api/                  backend (NestJS), port 4000
│   └── web/                  website (Next.js), port 3000
├── .local-postgres/          local PostgreSQL for running without Docker
├── .github/workflows/ci.yml  CI: builds the API, creates tables, seeds, type-checks and builds the web app
├── docker-compose.yml        runs database + API + web together
└── package.json              shortcut scripts for the whole repo
```

### Backend: `apps/api`

```
prisma/
  schema.prisma        database tables and enums
  seed.ts              demo data and demo accounts
src/
  main.ts              starts the server (helmet, cookies, validation, error filter)
  app.module.ts        registers every module and the global guards
  health.controller.ts GET /health
  common/              guards, decorators (@Public, @Roles, @CurrentUser, @TenantId), error filter, helpers
  prisma/              database connection (PrismaService)
  auth/                login, sign-up, logout, profile, change password
  public/              lookups for the sign-up page (no login needed)
  platform/            platform owner: create and manage municipalities
  users/               users of a municipality: approve, add, edit, assign projects
  departments/         departments
  projects/            projects, shared project rules, Excel import/export
  reports/             progress reports: submit, approve, reject, withdraw
  dashboard/           dashboard numbers, charts and calendar
  summaries/           weekly / monthly / on-demand performance reports (+ Excel)
  notifications/       in-app notifications
  project-events/      scheduled background jobs
  settings/            municipality settings
  audit/               activity log
```

Every feature folder follows the same pattern:

| File | Job |
|---|---|
| `x.controller.ts` | HTTP only: URLs, `@Roles`, passes user, ids and body to the service |
| `x.service.ts` | Business rules, database work and audit logging |
| `x.dto.ts` | Shape and validation of the request body |
| `x.module.ts` | Registers the controller and service |

### Frontend: `apps/web/src`

```
app/                  pages: one folder per URL
  layout.tsx          root layout (font, CSS, providers)
  page.tsx            "/" sends each role to its home area
  (auth)/             /login and /signup (brackets = not part of the URL)
    _components/      AuthLayout, shared by both pages
  admin/              municipality admin area: dashboard, projects, reports, summaries,
                      users, departments, activity, settings, profile
  portal/             staff area: home, projects, reports, profile
  platform-owner/     platform owner area: municipalities, profile
  <page>/_components/ components used by that one page only
features/             one folder per business area (projects, reports, users, auth, …)
  types.ts            data shapes and constants
  api.ts              backend calls, one function per endpoint
  hooks.ts            TanStack Query hooks: cache keys, loading, refreshing after changes
  components/         UI used by several pages (ProjectWizard, StatusBadge, ReportForm…)
components/
  ui/                 generic building blocks: Button, Card, Modal, inputs, badges
  layout/AppShell.tsx app frame: sidebar, header, notifications, language switch
styles/globals.css    global CSS (Tailwind layers)
i18n/                 ar.ts (every text key), en.ts (same keys in English), index.tsx (useI18n)
lib/                  http client, useAction helper, formatting, shared types
middleware.ts         sends visitors to login or to their own area
```

**Example: approving a sign-up from start to finish**
1. `app/admin/users/page.tsx` shows the Approve button and calls `approve.mutate(id)`.
2. `features/users/hooks.ts` → `useApproveUser()` calls the API, shows a toast and refreshes the cached users and dashboard data.
3. `features/users/api.ts` → `http.patch('/users/:id')`.
4. `lib/http.ts` sends `/api/users/:id`, Next.js forwards it to the API, and `users.service.ts` updates the user.

---

## Conventions

| You want to add… | Put it in |
|---|---|
| A new page | `apps/web/src/app/<area>/<name>/page.tsx` |
| A component for that one page | `apps/web/src/app/<area>/<name>/_components/` |
| A component used by several pages | `apps/web/src/features/<feature>/components/` |
| A generic widget (no business logic) | `apps/web/src/components/ui/` |
| Backend calls and data hooks | `apps/web/src/features/<feature>/api.ts` and `hooks.ts` |
| New text | `apps/web/src/i18n/ar.ts` **and** `en.ts` (TypeScript reports a missing English key) |
| A new endpoint | `apps/api/src/<feature>/`: controller + service + DTO; add `@Roles` |
| A new table or column | `apps/api/prisma/schema.prisma`, then `npx prisma db push` |

Rules the code follows:
- Pages never call the API directly. They use hooks from `features/*/hooks.ts`.
- `components/ui` never imports from `features`, so it stays reusable.
- Business rules and database code live in services, not controllers.
- Always take the tenant from `@TenantId()`, never from the request.
- API error codes (for example `DUPLICATE`) are shown to the user through `common.err.<CODE>` text keys.

## Useful scripts

| Where | Command | What it does |
|---|---|---|
| root | `npm run install:all` | Install both apps |
| root | `npm run db:setup` | Create tables and load demo data |
| root | `npm run dev:api` / `npm run dev:web` | Start the backend / website in dev mode |
| root | `npm run build` | Production build of both apps |
| `apps/api` | `npx prisma studio` | Browse the database at http://localhost:5555 |
| `apps/web` | `npm run lint` | Lint the website |
