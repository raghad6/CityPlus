# City+ architecture

City+ is a multi-tenant SaaS where municipalities track the projects in their yearly development plan. A municipality admin records projects, staff send progress reports, the admin approves them, and the dashboards update. One installation serves many municipalities, and each sees only its own data.

- **What every file is for:** [docs/FILES.md](docs/FILES.md)
- **Where the architecture goes next:** [docs/ROADMAP.md](docs/ROADMAP.md)
- **How to run it:** [README.md](README.md)

---

## 1. The big picture

```
 Browser ──► Web app (Next.js, :3000) ──/api/*──► API (NestJS, :4000) ──► PostgreSQL (:5432)
             screens + client-side data            rules, permissions, data     storage
```

- The browser only calls `/api/...` on the web app's own address. Next.js forwards it to the API (`apps/web/next.config.mjs`). So the login cookie is a simple first-party, httpOnly cookie, with no CORS setup.
- **The API is the only place that enforces permissions.** The web app hides buttons and areas a role can't use, but that's for convenience; every request is checked again on the server.

---

## 2. Roles: who can do what

| Role | Who | Area in the web app | What the API lets them do |
|---|---|---|---|
| `SUPER_ADMIN` | Platform owner (you) | `/platform` | Create, edit, suspend municipalities. No access to any municipality's data. |
| `ADMIN` | Municipality admin (المسؤول) | `/admin` (may also use `/portal`) | Everything inside **their own** municipality: projects, reports, users, departments, settings, Excel. |
| `STAFF` | Employee or partner | `/portal` | See **only projects assigned to them**, submit progress reports, see and withdraw their own reports. |

Where these rules live:

| Rule | API | Web |
|---|---|---|
| Which role may call an endpoint | `@Roles(...)` on each controller, checked by `common/roles.guard.ts` | `features/auth/roles.ts` (`AREA_ROLES`) used by `middleware.ts` |
| Which municipality's data | `@TenantId()`, always from the logged-in user, never from the request | (none needed) |
| Staff only see assigned projects | `projects/project-rules.ts` → `visibleProjects(user)` | (none needed) |
| Home page per role | (none) | `features/auth/roles.ts` → `ROLE_HOME` / `homeFor()` |

---

## 3. API layers (`apps/api`)

Every feature folder (`users/`, `projects/`, `reports/`…) has the same files, each with **one job**:

| File | Job | May use |
|---|---|---|
| `x.controller.ts` | **HTTP only.** Defines URLs, who may call them (`@Roles`), and passes the logged-in user, ids, query and body to the service. No database code, no business rules. | the service, decorators |
| `x.service.ts` | **Business rules and data.** Validation that needs the database (duplicate email, user limit…), tenant scoping, transactions, audit logging. | `PrismaService`, `AuditService`, shared rules |
| `x.dto.ts` | **Input shape.** Classes with `class-validator` rules; unknown fields are stripped automatically. | nothing |
| `x.module.ts` | **Wiring.** Registers the controller and service with NestJS. | |

Shared code in `common/`:
- **guards**: `auth.guard.ts` (who you are), `roles.guard.ts` (what you may do)
- **decorators**: `@Public`, `@Roles`, `@CurrentUser`, `@TenantId`
- `prisma-exception.filter.ts`: turns "record not found" / "duplicate" database errors into clean 404 / 409 answers.

**A request, step by step:**
1. `ThrottlerGuard` applies the rate limit.
2. `AuthGuard` checks the login cookie and re-reads the user, so disabled users and suspended municipalities are cut off immediately.
3. `RolesGuard` checks `@Roles`.
4. `ValidationPipe` checks the body against the DTO.
5. The controller calls the service.
6. The service runs the rules, saves to the database and writes the audit log.

---

## 4. Web layers (`apps/web/src`)

```
app/          ROUTES      one folder per URL; pages compose feature hooks + components. No API URLs, no data types here.
features/     FEATURES    one folder per business area (auth, projects, reports, users, departments, dashboard, settings, platform, audit)
  x/types.ts      MODEL     the data shapes (what a Project, User, Report looks like) and domain constants
  x/api.ts        DATA      the API endpoints of that feature, typed: one function per endpoint
  x/hooks.ts      STATE     React Query hooks: cache keys, loading data, and what to refresh after a change
  x/*.ts          RULES     pure logic with no UI, e.g. projects/project-form.ts (wizard rules), reports/report-fields.ts
  x/components/   UI        screens and widgets that belong to that feature (ProjectWizard, StatusBadge, AddUserModal…)
components/   SHARED UI   ui/ = generic building blocks (Button, Card, Modal…) that know nothing about the business;
                          layout/ = the app frame (sidebar, header, logo, language switch)
lib/          PLUMBING    http client, query helpers (useAction), translations (i18n + dict), formatting, shared types
middleware.ts             sends visitors to login or to their own area, using features/auth/roles.ts
```

**Dependency rules** (what may import what):
- `components/ui` → only `lib`. It never imports from `features`.
- `features/x` → `lib`, `components`, and other features' **types / hooks / components**. Never another feature's `api.ts`.
- `app/` pages → `features` and `components`. A page never calls `http` directly and never declares data types.
- **Only `features/*/hooks.ts` use React Query.** Pages get data from hooks like `useProjects()`, `useApproveUser()`.

**Data flow in the web app (example: approving a sign-up):**
1. `app/admin/users/page.tsx` renders the Approve button and calls `approve.mutate(id)`.
2. `features/users/hooks.ts` → `useApproveUser()` runs `usersApi.update(id, { status: 'ACTIVE' })`, shows the toast, and refreshes `users` and `dashboard` data.
3. `features/users/api.ts` → `http.patch('/users/:id')`.
4. `lib/http.ts` sends it to `/api/users/:id`, and Next.js forwards it to the API.

---

## 5. Database (`apps/api/prisma/schema.prisma`)

```
Tenant (a municipality)
 ├── User         role: SUPER_ADMIN | ADMIN | STAFF,  status: PENDING | ACTIVE | DISABLED
 ├── Department   e.g. "الهندسة والتخطيط"; isExternal = outside partner
 ├── Project      the 4-step municipal form (identity, follow-up, evaluation, funding)
 │    ├── ProjectDepartment   extra departments sharing the project
 │    ├── ProjectAssignment   staff who follow the project
 │    └── Report              a progress report; `payload` = proposed changes, applied only when approved
 └── AuditLog     who did what, when
```

Every business table has a `tenantId`, which the API always takes from the logged-in user.

---

## 6. Main workflows

- **Login:** `POST /auth/login` checks the password and status, signs a 7-day JWT and sets the `cityplus_token` cookie. `/` then redirects by role.
- **Self sign-up:** creates a `PENDING` user. The admin sees a badge on Users and approves (ACTIVE) or declines (the request is deleted).
- **Progress report:**
  1. Staff submit steps 2–4.
  2. If the municipality requires approval, the report waits as `PENDING`. The admin approves (the changes are copied onto the project in one transaction) or rejects (a reason is required, and staff can resubmit).
  3. Admin reports, or municipalities that don't require approval, are applied immediately.
- **New municipality:** the platform owner creates the municipality, its default departments and its first admin in one transaction.

---

## 7. Adding a new feature (checklist)

1. **Database:** add the model to `schema.prisma`, then run `npx prisma migrate dev --name <change>`.
2. **API:** create `src/<feature>/` with `dto`, `service`, `controller`, `module`; add `@Roles` on the controller; register the module in `app.module.ts`.
3. **Web:** create `src/features/<feature>/` with `types.ts`, `api.ts`, `hooks.ts` (with a `xKeys` object), and `components/` if needed.
4. **Page:** add `src/app/<area>/<feature>/page.tsx` that uses only the hooks and components.
5. **Text:** add Arabic and English strings to `lib/dict.ts`, and any `common.err.<CODE>` error messages.
