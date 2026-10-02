# Every file, and what it's for

For the reasoning behind this layout, see [ARCHITECTURE.md](../ARCHITECTURE.md).

**Layer** says what kind of file it is:

| Layer | Meaning |
|---|---|
| **route** | HTTP endpoints (API) or a page URL (web) |
| **service** | business rules and database work |
| **dto** | input validation |
| **model** | data shapes and domain constants |
| **data** | API calls from the web app |
| **state** | caching and refreshing data (React Query) |
| **rules** | pure logic, no UI |
| **ui** | screens and widgets |
| **infra** | setup, config, plumbing |

---

## Project root

| File | Layer | What it is |
|---|---|---|
| `README.md` | doc | What the product does, how to run it, demo logins, API list |
| `ARCHITECTURE.md` | doc | How the system is built: layers, roles, workflows |
| `docs/FILES.md` | doc | This file |
| `docs/ROADMAP.md` | doc | Planned architecture improvements, in phases |
| `package.json` | infra | Shortcut scripts for the whole repo (`dev:api`, `dev:web`, `build`, `db:setup`) |
| `docker-compose.yml` | infra | Runs database + API + web together: `docker compose up --build` |
| `.gitignore` | infra | Files git must never commit: `node_modules`, builds, **all `.env` files**, local database data |
| `.github/workflows/ci.yml` | infra | GitHub automatic checks: on every push, builds the API, creates tables, seeds, type-checks and builds the web app |
| `.local-postgres/start.mjs` | infra | Starts a local PostgreSQL 16 without Docker (development only) |
| `.local-postgres/package.json` | infra | Its one dependency (`embedded-postgres`) |

---

## API: `apps/api`

### Setup and config
| File | Layer | What it is |
|---|---|---|
| `package.json` | infra | API dependencies and scripts (`dev`, `build`, `db:push`, `seed`) |
| `.env.example` | infra | Template of the settings the API needs. Copy to `.env` (which is never committed) |
| `Dockerfile` | infra | Builds the API image; on start it syncs the schema, optionally seeds, then runs |
| `.dockerignore` | infra | Keeps `node_modules`/`dist` out of the Docker build |
| `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json` | infra | NestJS and TypeScript compiler settings |

### Database
| File | Layer | What it is |
|---|---|---|
| `prisma/schema.prisma` | model | **The database tables**: Tenant, User, Department, Project, Report, AuditLog, and their enums |
| `prisma/seed.ts` | infra | Demo data: the Dura municipality, its plan projects, demo users |

### Startup and wiring
| File | Layer | What it is |
|---|---|---|
| `src/main.ts` | infra | Starts the server: security headers, cookies, input validation, the database-error filter, port 4000 |
| `src/app.module.ts` | infra | Registers every feature module and the three global guards (rate limit, login, roles) |
| `src/health.controller.ts` | route | `GET /health`: "is the server alive" |
| `src/prisma/prisma.service.ts` | infra | The database client, shared by every service |
| `src/prisma/prisma.module.ts` | infra | Makes the database client available everywhere |

### Shared building blocks: `src/common`
| File | Layer | What it is |
|---|---|---|
| `auth.guard.ts` | infra | Runs on every request: reads the login cookie, verifies it, **re-loads the user** (so disabling takes effect at once) |
| `roles.guard.ts` | infra | Blocks a request if the user's role isn't listed in `@Roles(...)` |
| `decorators.ts` | infra | `@Public()`, `@Roles()`, `@CurrentUser()`, `@TenantId()`, and the `AuthUser` type |
| `prisma-exception.filter.ts` | infra | Turns "already deleted" into 404 and "duplicate" into 409, so double clicks never crash |
| `util.ts` | infra | `plain()` / `num()`: turn exact database decimals into normal numbers for JSON |

### Features
Each feature folder follows **controller (route) → service (rules + data) → dto (input)**, plus a module that wires them together.

| File | Layer | What it is |
|---|---|---|
| **auth/** | | |
| `auth.controller.ts` | route | `/auth/login`, `/signup`, `/logout`, `/me`, `/password`; sets and clears the cookie |
| `auth.service.ts` | service | Password check, account and municipality status, sign-up as PENDING, profile and password change |
| `auth.dto.ts` | dto | Login, sign-up, profile and password inputs |
| `auth.module.ts` | infra | Wiring |
| **projects/** | | |
| `projects.controller.ts` | route | `/projects` list, get, create, edit, delete; Excel export, template and import |
| `projects.service.ts` | service | Search and filters, create and edit (with departments and assignees), delete |
| `projects-excel.service.ts` | service | Excel export, import template, and import with row-by-row errors |
| `excel.ts` | rules | The spreadsheet columns (Arabic headers), status and level translations, cell reading |
| `project-rules.ts` | rules | Shared project rules: `visibleProjects()` (staff see only assigned), `CLOSED_STATUSES`, `REASON_REQUIRED_STATUSES` |
| `projects.dto.ts` | dto | Project fields (4 steps) and which fields staff may change (`PROGRESS_FIELDS`) |
| `projects.module.ts` | infra | Wiring |
| **reports/** | | |
| `reports.controller.ts` | route | Submit, list, view, approve, reject, withdraw |
| `reports.service.ts` | service | The approval workflow: required fields, one pending report at a time, auto-apply for admins, apply on approve |
| `reports.dto.ts` | dto | Approve (optional note) and reject (reason required) |
| `reports.module.ts` | infra | Wiring |
| **users/** | | |
| `users.controller.ts` | route | `/users` (admin only): list, view, add, edit/approve/disable, followed projects, reset password, delete/decline |
| `users.service.ts` | service | Email uniqueness, user limit, "can't demote or delete yourself", audit actions |
| `users.dto.ts` | dto | Create, update, assign projects, reset password inputs |
| `users.module.ts` | infra | Wiring |
| **departments/** | | |
| `departments.controller.ts` | route | List (any user), add, edit, delete (admin) |
| `departments.service.ts` | service | Unique name per municipality |
| `departments.dto.ts` | dto | Name, English name, external flag |
| `departments.module.ts` | infra | Wiring |
| **dashboard/** | | |
| `dashboard.controller.ts` | route | Admin dashboard, calendar, staff home |
| `dashboard.service.ts` | service | All the totals, charts, overdue and upcoming lists, calendar events (read-only) |
| `dashboard.module.ts` | infra | Wiring |
| **settings/** | | |
| `settings.controller.ts` | route | View and save the admin's own municipality settings |
| `settings.service.ts` | service | Load and save, with audit |
| `settings.dto.ts` | dto | Name, city, logo, plan year, "reports need approval" |
| `settings.module.ts` | infra | Wiring |
| **platform/** | | |
| `platform.controller.ts` | route | Platform owner only: stats, municipalities list, view, create, edit/suspend |
| `platform.service.ts` | service | Creates municipality + default departments + first admin in one transaction |
| `platform.dto.ts` | dto | Create and update municipality inputs |
| `default-departments.ts` | rules | The departments every new municipality starts with |
| `platform.module.ts` | infra | Wiring |
| **public/** | | |
| `public.controller.ts` | route | No login needed: municipalities and departments for the sign-up form |
| `public.service.ts` | service | Only returns **active** municipalities |
| `public.module.ts` | infra | Wiring |
| **audit/** | | |
| `audit.controller.ts` | route | `GET /audit`: the activity log (admin) |
| `audit.service.ts` | service | `log()` used by every feature to record actions, and `list()` for the activity page |
| `audit.module.ts` | infra | Wiring; global, so every feature can log |

---

## Web: `apps/web`

### Setup and config
| File | Layer | What it is |
|---|---|---|
| `package.json` | infra | Web dependencies and scripts (`dev`, `build`, `lint`) |
| `.env.example` | infra | Template: `API_URL`, where `/api` is forwarded. Copy to `.env.local` (never committed) |
| `next.config.mjs` | infra | Forwards `/api/*` to the API; standalone build for Docker |
| `tailwind.config.ts` | infra | Brand colours (`brand` green, `accent` terracotta, `ink` greys), font, shadows |
| `postcss.config.mjs` | infra | Runs Tailwind |
| `.eslintrc.json` | infra | Lint rules (Next.js recommended) |
| `tsconfig.json`, `next-env.d.ts` | infra | TypeScript settings; `@/…` means `src/…` |
| `Dockerfile`, `.dockerignore` | infra | Builds a small production image |
| `public/icon.svg` | ui | The City+ logo / browser-tab icon |

### Routing and app frame: `src/`
| File | Layer | What it is |
|---|---|---|
| `middleware.ts` | infra | Runs before pages: no login → `/login`; wrong role → home. Uses `features/auth/roles.ts` |
| `app/layout.tsx` | ui | Root HTML: font, language and direction (RTL/LTR) from the cookie, page title, icon |
| `app/providers.tsx` | infra | Wraps the app in translations, React Query and toast messages |
| `app/page.tsx` | route | `/`: sends each role to its home page |
| `app/not-found.tsx` | ui | The 404 page |
| `app/globals.css` | ui | Tailwind base styles |

### Pages: `src/app/…` (route layer)
Each page only puts hooks and components together.

| File | What the page is |
|---|---|
| `(auth)/login/page.tsx` | Login form |
| `(auth)/signup/page.tsx` | Self sign-up (pick municipality and department) |
| `admin/layout.tsx` | Admin sidebar menu with pending-reports and pending-users badges |
| `admin/page.tsx` | Admin dashboard: KPIs, charts, calendar, overdue and upcoming, recent activity |
| `admin/projects/page.tsx` | Projects list: search, filters, sort, pages, Excel import and export |
| `admin/projects/new/page.tsx` | Create a project (wizard) |
| `admin/projects/[id]/page.tsx` | Project details (admin buttons) |
| `admin/projects/[id]/edit/page.tsx` | Edit a project (wizard) |
| `admin/projects/[id]/report/page.tsx` | Admin submits a progress update (applied immediately) |
| `admin/reports/page.tsx` | Reports to review, by status |
| `admin/reports/[id]/page.tsx` | Review one report: before/after per field, approve or reject |
| `admin/users/page.tsx` | Pending sign-ups (approve/decline), user list, add user |
| `admin/users/[id]/page.tsx` | One user: edit, role/status, followed projects, reset password, delete |
| `admin/departments/page.tsx` | Departments: add, edit, delete |
| `admin/activity/page.tsx` | Activity log |
| `admin/settings/page.tsx` | Municipality settings and subscription usage |
| `admin/profile/page.tsx` | My profile |
| `portal/layout.tsx` | Staff sidebar menu (admins also get a link back to `/admin`) |
| `portal/page.tsx` | Staff home: my projects, calendar, my recent reports |
| `portal/projects/page.tsx` | My projects (active / completed / all) |
| `portal/projects/[id]/page.tsx` | Project details (staff buttons) |
| `portal/projects/[id]/report/page.tsx` | Submit a progress report |
| `portal/reports/page.tsx` | My reports: review notes, withdraw, resubmit |
| `portal/profile/page.tsx` | My profile |
| `platform/layout.tsx` | Platform owner menu |
| `platform/page.tsx` | Platform overview and municipalities table |
| `platform/tenants/new/page.tsx` | Create a municipality and its first admin |
| `platform/tenants/[id]/page.tsx` | One municipality: edit plan and limits, suspend or activate |
| `platform/profile/page.tsx` | My profile |

### Features: `src/features/<name>/`
Every feature has the same core files:

| File | Layer | What it is |
|---|---|---|
| `types.ts` | model | The data shapes of that feature, plus its constants |
| `api.ts` | data | One typed function per API endpoint (`usersApi.update(...)`) |
| `hooks.ts` | state | `xKeys` cache keys, query hooks (`useUsers`) and action hooks (`useApproveUser`), each knowing what to refresh after a change |

Extra files per feature:

| File | Layer | What it is |
|---|---|---|
| **auth/** | | |
| `roles.ts` | rules | **Role rules for the web app**: cookie name, each role's home page, which roles may open each area |
| `components/AuthLayout.tsx` | ui | Two-column frame of the login and sign-up pages |
| `components/ProfilePage.tsx` | ui | Profile screen (name, phone, change password), used by all three areas |
| **projects/** | | |
| `project-form.ts` | rules | Wizard rules without UI: project → form, required fields per step, form → API body, funding gap |
| `components/ProjectWizard.tsx` | ui | The 4-step form screen (admin mode and staff report mode) |
| `components/ProjectDetail.tsx` | ui | Project details screen, shared by admin and portal |
| `components/ProjectCard.tsx` | ui | Project card on the staff portal |
| `components/ImportModal.tsx` | ui | Excel upload dialog with row errors |
| `components/StatusBadge.tsx` | ui | Status pill and the colour of each status (also used by charts and calendar) |
| **reports/** | | |
| `report-fields.ts` | rules | Which fields a report can change and how to display each value |
| `components/ReportForm.tsx` | ui | Progress report screen (wizard in report mode) |
| `components/ReportBadge.tsx` | ui | Pending / approved / rejected pill |
| **users/** | | |
| `components/AddUserModal.tsx` | ui | "Add user" dialog |
| `components/UserStatusBadge.tsx` | ui | Pending / active / disabled pill |
| **dashboard/** | | |
| `components/Calendar.tsx` | ui | Month calendar of start and due dates |
| `components/DueList.tsx` | ui | Overdue / upcoming project list |
| **departments/, settings/, platform/, audit/** | | Only `types.ts`, `api.ts`, `hooks.ts`; their screens are the pages above |

### Shared UI: `src/components`
| File | Layer | What it is |
|---|---|---|
| `ui/index.ts` | ui | One import point for all building blocks |
| `ui/Button.tsx` | ui | Button with variants, sizes, loading spinner |
| `ui/form.tsx` | ui | `Field` (label, required `**`, error), `Input`, `Textarea`, `Select`, `Toggle` |
| `ui/layout.tsx` | ui | `Card`, `CardHeader`, `PageHeader`, `Stat` tile |
| `ui/feedback.tsx` | ui | `Spinner`, `Loading`, `Empty`, `Progress`, `ProgressLabel` |
| `ui/Badge.tsx` | ui | Generic `Badge` pill and `Avatar` |
| `ui/Modal.tsx` | ui | `Modal` dialog and `ConfirmModal` |
| `ui/Segmented.tsx` | ui | Tab-style switch |
| `layout/AppShell.tsx` | ui | App frame: sidebar, mobile drawer, header, `Logo`, `LangToggle` |

### Plumbing: `src/lib`
| File | Layer | What it is |
|---|---|---|
| `http.ts` | infra | The HTTP client: calls `/api/...`, turns errors into `ApiError`, sends you to login on 401 |
| `query.ts` | state | `useAction()` (run a change, toast, refresh data) and `useErrorMessage()` (error code → translated text) |
| `i18n.tsx` | infra | Language context: `t('key')`, `n(entity)` for Arabic/English names, language switch |
| `dict.ts` | infra | All UI text, Arabic and English |
| `format.ts` | infra | Money (×1000$), numbers, dates, "days from now" |
| `types.ts` | model | Types shared by all features: `Role`, `NamedRef`, `Paged` |
| `cn.ts` | infra | Joins CSS class names |
