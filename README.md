# AcadMatrix — College Student Management System

A production-quality college student management system built as a strict monorepo with two fully separated applications connected solely via a REST/JSON contract documented in OpenAPI 3.0.

| App | Path | Tech Stack | Deploy Target |
|---|---|---|---|
| **API** | `/backend` | Node.js, TypeScript, Express, Prisma ORM, Neon PostgreSQL, Zod, Argon2, JWT, Resend | Render / Railway / Fly.io |
| **SPA** | `/frontend` | React, TypeScript, Vite, React Router 6, TanStack Query, Tailwind CSS, React Hook Form, Zod | Vercel / Netlify |

---

## Architectural Rules & Guarantees
1. **Strict Monorepo Separation:** Zero shared runtime code between `/backend` and `/frontend`. Only HTTP (REST + JSON) connects them.
2. **Layered Feature Architecture (Backend):**
   `routes → controller (HTTP only) → service (business logic) → repository (Prisma only) → schema/types`
3. **CORS Security:** Configured via `FRONTEND_URL` environment variable; wildcards are strictly prohibited.
4. **Resilience & Security:**
   - 2-Step Authentication (Email + Argon2 Password, followed by 6-digit Resend OTP).
   - In-memory access tokens with rotation-safe HTTP-only refresh tokens.
   - Centralized error handler with typed `AppError` and structured envelopes (`{ success, data | error, requestId }`).
   - Rate limiting, Helmet security headers, and structured Pino logging.
   - Audit logging for all critical operations (auth, grades, attendance, fees).
5. **Clean Code & Modularity:** All files decomposed to stay under ~250 lines with reusable UI components and typed API clients.

---

## Feature Modules

| Module | Roles | Highlights |
|---|---|---|
| **Auth & RBAC** | All | 2-step OTP, refresh rotation, account lockout (5 attempts), forced password change on first login. |
| **Users** | Admin | Faculty & Student CRUD, RFC-compliant CSV bulk import with error reports, account unlocking. |
| **Academics** | Admin | Departments, courses, semesters, sections, subjects, faculty subject allocations. |
| **Timetable** | All | Weekly schedule builder with room, faculty & section conflict detection. |
| **Attendance** | All | Daily attendance marking, roster lookup, overall & subject-wise %, `< 75%` warning alert. |
| **Notifications**| All | Broadcast notices (All, Role, Section), unread counts, header notification bell. |
| **Assignments** | Faculty, Student | Coursework publishing, file uploads, late tagging, grading & instructor feedback. |
| **Exams** | Admin, Faculty, Student | Scheduling (mid-terms, finals, quizzes, practicals) and student marks recording. |
| **Fees** | Admin, Student | Fee structures, student ledger, manual payment entry with auto-generated receipt numbers. |
| **Support** | All | Helpdesk tickets (`#101`), multi-turn message threads, priority & status management. |
| **Dashboards** | All | Role-tailored dashboards: KPI metrics, today's schedule, attendance gauges, fee balances. |

---

## Quick Start (Local Development)

### 1. Database Setup (Neon PostgreSQL)
Create a project on [Neon](https://neon.tech) and get the **pooled** connection string (for app) and **direct** connection string (for migrations).

### 2. Backend API
```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, and generate JWT secrets:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

npm install
npm run db:migrate -- --name init
npm run db:seed
npm run dev                  # API starts on http://localhost:4000
```

### 3. Frontend SPA
```bash
cd frontend
cp .env.example .env         # VITE_API_URL=http://localhost:4000
npm install
npm run dev                  # SPA starts on http://localhost:5173
```

---

## Testing & Verification

Run the comprehensive test suite across both applications:
```bash
# Backend unit & Supertest integration tests (15 suites, 67 tests)
npm --prefix backend test

# Production builds
npm --prefix backend run build
npm --prefix frontend run build
```

---

## API Documentation
Interactive OpenAPI (Swagger UI) is available during development at:
**`http://localhost:4000/api/docs`** (specification source: [`backend/docs/openapi.yaml`](file:///home/mohit/AcadMatrix/backend/docs/openapi.yaml)).
