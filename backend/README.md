# AcadMatrix — Backend API

Node.js + TypeScript + Express + Prisma on Neon PostgreSQL. REST/JSON only — no UI code.

## Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) project (free tier is fine)

## Setup
```bash
cd backend
cp .env.example .env          # then fill in the values below
npm install                   # also runs `prisma generate`
npm run db:migrate -- --name init   # creates + applies the first migration (uses DIRECT_URL)
npm run db:seed
npm run dev                   # http://localhost:4000
```

### Neon Connection Strings
In the Neon console → **Connect**:
- `DATABASE_URL` → the **pooled** string (host contains `-pooler`). Keep `sslmode=require&pgbouncer=true`.
- `DIRECT_URL` → the **direct** string (toggle "Pooled connection" off). Used only by `prisma migrate`.

Generate JWT secrets (two different ones):
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Start API server with hot reload |
| `npm run build` / `npm start` | Compile TypeScript to `dist/` / run compiled build |
| `npm test` | Vitest test runner (unit + Supertest integration tests) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm run db:migrate` | Create + apply a dev migration |
| `npm run db:deploy` | Apply existing migrations (production) |
| `npm run db:seed` | Seed admin, faculty, students, courses, timetable, fees |
| `npm run db:reset` | Drop, re-migrate and re-seed (dev only) |
| `npm run db:studio` | Prisma Studio browser GUI |

## Seeded Default Accounts
| Role | Email | Password |
|---|---|---|
| Admin | `admin@AcadMatrix.local` | `ChangeMe@123` |
| Faculty | `faculty1@AcadMatrix.local` … `faculty3@…` | `Welcome@123` |
| Student | `student01@AcadMatrix.local` … `student10@…` | `Welcome@123` |

All seeded users must change their password on first login. The seed script is idempotent.

## Health Probes
```bash
curl localhost:4000/health          # liveness
curl localhost:4000/health/ready    # readiness (checks database latency)
```
Interactive API docs (Swagger UI): `http://localhost:4000/api/docs` (source: `docs/openapi.yaml`).

## Architecture & Layering
```
src/
  app.ts, server.ts
  common/   config (Zod env, fail-fast), db, errors, middleware, services (email, storage, audit), utils
  modules/
    auth/           2-step login, OTP verification, token rotation, password reset
    users/          faculty & student management, RFC CSV bulk import
    academics/      departments, courses, semesters, sections, subjects, allocations
    timetable/      slot scheduling with room/faculty/section conflict detection
    attendance/     marking, roster lookup, % computation, low-attendance threshold
    notifications/  targeted & broadcast notices, inbox, unread counts
    assignments/    coursework publishing, student submissions, grading
    exams/          scheduling, results recording, report cards
    fees/           structures, student ledgers, receipt generation
    support/        ticket numbering, threaded conversations, resolution
    dashboard/      role-tailored KPI aggregates and daily schedules
prisma/
  schema.prisma, seed.ts, migrations/
docs/
  openapi.yaml
tests/
  15 test suites with 67 tests
```

## API Conventions
- Success response envelope: `{ "success": true, "data": …, "meta"?: { "page", "limit", "total", "totalPages" } }`
- Error response envelope: `{ "success": false, "error": { "code", "message", "details"? }, "requestId" }`
- Version prefix: `/api/v1`

## Production Deployment (Render / Railway / Fly.io)
- **Build command:** `npm ci && npm run build`
- **Start command:** `npm run db:deploy && npm start`
- Set all variables from `.env.example`; set `NODE_ENV=production`.
- `FRONTEND_URL`: Your deployed frontend origin (exact origin, no trailing slash).
- Health probe path: `/health`.
