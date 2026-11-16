# AcadMatrix — Frontend SPA

React + TypeScript + Vite Single-Page Application (SPA). Communicates with the backend exclusively over HTTP (REST/JSON); zero direct database access.

## Prerequisites
- Node.js 20+

## Setup
```bash
cd frontend
cp .env.example .env      # set VITE_API_URL (default http://localhost:4000)
npm install
npm run dev               # http://localhost:5173
```
*Note: The backend's `FRONTEND_URL` environment variable must list `http://localhost:5173` (or your deployed domain) to permit CORS requests.*

## Application Features & Navigation
- **Authentication Flows:**
  - `/login` → `/verify-otp` (2-step OTP flow)
  - `/forgot-password` → `/reset-password`
  - `/change-password` (enforced on first login with `mcp: true`)
- **Admin Portal (`/admin`):**
  - KPI Dashboard overview
  - Faculty & Student CRUD with CSV bulk import & row-level error reporting
  - Academic Setup (Departments, Courses, Semesters, Sections, Subjects, Faculty Allocations)
  - Timetable Builder with conflict detection
  - Attendance session audits
  - Examination scheduling & results entry
  - Fee structures, student ledgers & payment entry with receipts
  - Support helpdesk & broadcast announcements
- **Faculty Portal (`/faculty`):**
  - Personal daily lecture schedule
  - Weekly Timetable grid
  - Daily class attendance entry & student rosters
  - Course assignment creation, submission review & grading
  - Examination marks entry
  - Section announcements
- **Student Portal (`/student`):**
  - Dashboard with attendance gauge (<75% warning alert) & next class countdown
  - Section timetable (daily & weekly)
  - Coursework submissions & instructor feedback
  - Exam timetable, room halls & grades
  - Fee dues, payment receipts ledger & pending balance
  - Support ticket grievance tracker & conversation threads

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | TypeScript compile + Vite production bundle (`dist/`) |
| `npm run preview` | Serve the production bundle locally |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc -b` |

## Project Architecture
```
src/
  components/ui/    Table, Modal, FormField, Badge, EmptyState, Skeleton
  features/
    auth/           login, OTP, reset, session manager, role guards
    users/          faculty & student lists, form modals, CSV import
    academics/      department, course, semester, section, subject modals & allocations
    timetable/      timetable grid, slot modal, conflict alerts
    attendance/     daily marking roster, student statistics card
    notifications/  notification bell, unread badge, broadcast modal
    assignments/    assignment creation, student file submission, grading modal
    exams/          exam scheduling, student marks entry modal
    fees/           fee structure modal, payment entry modal, receipt view
    support/        ticket submission, threaded reply modal
    dashboard/      role-specific live widgets (Admin, Faculty, Student)
  layouts/          AppLayout with header, navigation, and notification bell
  lib/              apiClient (Axios/fetch with token refresh & retry interceptors)
  routes/           React Router configuration with role-based access guards
```

## Production Deployment (Vercel / Netlify)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** `VITE_API_URL` = your deployed backend API URL.
- **SPA Fallback Routing:**
  - **Netlify:** `public/_redirects` contains `/*  /index.html  200`
  - **Vercel:** `vercel.json` rewrites `/(.*)` to `/index.html`
