# Architecture roadmap

Where City+'s architecture should go next, in order. Each item names the problem in today's code, what to do, and why it matters. Phases build on each other. Within a phase, items are roughly in priority order.

**Already done** (October 2026 restructure):
- API split into controller → service → DTO for every feature.
- Shared project rules in one place (`project-rules.ts`).
- Database errors mapped to clean 404/409 answers (no crash on double clicks).
- Web app split into `features/<name>/{types, api, hooks, components}`, with pages using hooks only.
- Wizard rules separated from the wizard screen (`project-form.ts`).
- Role rules in one file (`features/auth/roles.ts`).
- Generic UI split from business UI.

---

## Phase 1: Safety net (do first)

Make changes safe to ship before adding more features.

| # | Item | Today | Do | Why |
|---|---|---|---|---|
| 1.1 | **Automated tests in the repo** | No tests at all. The checks run during this work (97 API checks) live outside the repo. | API: end-to-end tests with Jest + Supertest against a test database (sign-up → approve, report approve/reject, permissions per role, tenant isolation). Web: Vitest unit tests for pure rules (`project-form.ts`, `report-fields.ts`, `format.ts`). Run both in CI. | Refactors and new features can't silently break approval, permissions or tenant isolation. |
| 1.2 | **Database migrations instead of `db push`** | `Dockerfile` runs `prisma db push`, which can drop data when the schema changes. | Create a baseline with `prisma migrate dev --name init`. Production runs `prisma migrate deploy`. Commit the `prisma/migrations/` folder. | Safe, reviewable, repeatable schema changes in production. |
| 1.3 | **Fail fast on missing config** | `app.module.ts` falls back to the secret `'dev-secret-change-me'` if `JWT_SECRET` is missing. Production would start with a known secret. | Validate env vars at startup (`ConfigModule` + a schema): `DATABASE_URL`, `JWT_SECRET` (min length), `COOKIE_SECURE`. Refuse to start in production when they're missing or weak. | Login tokens can't be forged because of a forgotten setting. |
| 1.4 | **Tighter CORS** | `enableCors({ origin: … ?? true, credentials: true })` accepts any website when `WEB_ORIGIN` isn't set. | Default to no CORS (the browser uses the same-origin `/api` proxy anyway); allow only listed origins. | Smaller attack surface. |
| 1.5 | **CI runs lint + tests** | CI builds and type-checks only. | Add `npm run lint`, API tests and web tests to `.github/workflows/ci.yml`; block merging when they fail. | Problems are caught on the pull request, not in production. |

## Phase 2: One source of truth between API and web

Today the same shapes and rules are written twice: once in the API and once in the web app.

| # | Item | Today | Do | Why |
|---|---|---|---|---|
| 2.1 | **Shared package** | `ProjectStatus`, `REASON_REQUIRED`, the required report fields and the API body types are hand-copied in `apps/api` and `apps/web`. | Turn the repo into an npm workspace with `packages/shared`, holding enums, constants and validation rules, used by both apps. | Changing a rule in one place changes it everywhere. No drift. |
| 2.2 | **Generated API client** | `features/*/api.ts` and `types.ts` are written by hand to match the API. | Describe the API with `@nestjs/swagger` (OpenAPI), then generate TypeScript types for the web app (`openapi-typescript`). Keep the hand-written hooks on top. | If the API changes, the web app fails to compile instead of failing for users. |
| 2.3 | **Validation schemas shared with forms** | Required fields are checked in `project-form.ts` (web) and again in `reports.service.ts` (API). | Define the rules once (e.g. Zod in `packages/shared`). The web form and the API both use them. | Same messages and rules on both sides. |

## Phase 3: Data and multi-tenancy at scale

| # | Item | Today | Do | Why |
|---|---|---|---|---|
| 3.1 | **Tenant isolation enforced by the database** | Every service must remember to filter by `tenantId`. One forgotten filter would leak data between municipalities. | Add a Prisma client extension that adds the tenant filter automatically, or PostgreSQL Row-Level Security policies. Add a test per endpoint that another municipality gets 404. | Isolation no longer depends on every developer remembering. |
| 3.2 | **Pagination everywhere** | `GET /reports` returns up to 200 items; `GET /users` returns everyone; the user page loads 200 projects for the "followed projects" toggles. | Paginate all list endpoints; use search-as-you-type for pickers. | Stays fast for large municipalities. |
| 3.3 | **Soft delete and history** | Deleting a project or user removes it for good (with its reports). | Add `deletedAt`, and keep report history when projects change. | Mistakes can be undone; audit trails stay complete. |
| 3.4 | **Audit log retention and indexes** | The audit log grows forever. | Archive old entries; review indexes on large tables (`Report`, `AuditLog`). | Predictable database size and speed. |

## Phase 4: Product features (from the README's next steps)

Each lands as a new feature folder in both apps, following the checklist in [ARCHITECTURE.md](../ARCHITECTURE.md#7-adding-a-new-feature-checklist).

| # | Item | Architecture it needs |
|---|---|---|
| 4.1 | **Email notifications** (report submitted, approved or rejected; account approved) | A background job queue (BullMQ + Redis) so sending email never slows a request; a `notifications` module; email templates in Arabic and English. |
| 4.2 | **File attachments on reports** (photos, invoices) | S3-compatible storage with signed upload URLs; an `Attachment` table linked to `Report`; virus/size checks. |
| 4.3 | **Printable PDF reports** per project or department | A PDF service (server-side rendering with RTL Arabic fonts), run as a background job for large reports. |
| 4.4 | **Subscription billing** | A `billing` module with Stripe webhooks; `Plan` limits enforced in one place (today only `maxUsers` is). |

## Phase 5: Running in production

| # | Item | Today | Do |
|---|---|---|---|
| 5.1 | **Logging and error tracking** | `console.log` and default Nest logs. | Structured logs (pino) with a request id; error tracking (Sentry) for API and web. |
| 5.2 | **Several API instances** | Rate limiting is stored in memory, per process. | Move the rate-limit store to Redis so limits hold across instances; keep the API stateless. |
| 5.3 | **Environments** | Local only. | Staging and production with separate databases, secrets in a secret manager, automatic deploy from `main` after CI passes. |
| 5.4 | **Backups** | None configured. | Daily automatic PostgreSQL backups with a tested restore. |

## Phase 6: Front-end polish and scale

| # | Item | Today | Do |
|---|---|---|---|
| 6.1 | **Split translations per feature** | One 800-line `lib/dict.ts`. | `features/<name>/i18n.ts` merged at startup; a check that every Arabic key has an English one. |
| 6.2 | **Browser end-to-end tests** | None. | Playwright tests for the main flows (login per role, wizard, approve/reject, Excel import) in both languages. |
| 6.3 | **UI component catalogue** | Building blocks only visible inside pages. | Storybook for `components/ui`, so the design system can be reviewed on its own. |
| 6.4 | **Accessibility** | Partly done (labels, roles). | Audit with axe; keyboard navigation in the wizard and modals. |

---

### Suggested order at a glance

```
Phase 1 (safety net) ─► Phase 2 (shared contracts) ─► Phase 3 (data at scale)
                                                    └► Phase 4 (features, one at a time)
Phase 5 (production) runs alongside 3–4 once there is a real deployment.
Phase 6 any time, in small steps.
```
