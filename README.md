# City+ · CityPlus

**منصة لمتابعة وتقييم مشاريع الخطة التنموية للبلديات والهيئات المحلية**

City+ helps municipalities follow their yearly development-plan projects in one place instead of many Excel files. Departments report their progress, the municipality approves it, and dashboards, alerts and reports update by themselves.

It's a multi-municipality platform: each municipality has its own users, departments and projects, and can never see another municipality's data. The interface is Arabic first (right-to-left), with a one-click switch to English.

**More docs:** [Architecture](ARCHITECTURE.md) · [Every file explained](docs/FILES.md) · [Roadmap](docs/ROADMAP.md)

---

## The 3 roles

| Role | Who | Where | What they can do |
|---|---|---|---|
| **Platform owner** (`SUPER_ADMIN`) | The team running City+ | `/platform` | Add municipalities and their first admin, set each one's plan and user limit, and suspend or activate them. |
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
| Frontend (`apps/web`) | Next.js 14, React 18, TypeScript, Tailwind CSS, TanStack Query, Recharts |
| Backend (`apps/api`) | NestJS 10, TypeScript, Prisma 5 |
| Database | PostgreSQL 16 |

The browser only talks to the web app. The web app forwards `/api/*` calls to the backend, and only the backend talks to the database.

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
apps/
  api/          backend (NestJS) on port 4000
    prisma/     database tables (schema.prisma) and demo data (seed.ts)
    src/        one folder per feature: projects, reports, users, summaries, notifications…
  web/          website (Next.js) on port 3000
    src/app/    pages: /admin, /portal, /platform, and login/sign-up in (auth)
    src/features/  data calls and components for each feature
.local-postgres/  optional local database for running without Docker
docker-compose.yml  runs everything with one command
```
