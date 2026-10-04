# RecruitConnect OneHR™
**One Platform. Complete Workforce Intelligence.**

> Intelligent Workforce Operating System — not just HRIS. Answers "What is happening across your workforce right now?" — running on **MySQL 8**.

**Docs:** `docs/PRD.md` | `docs/ERD.md` | `docs/API_SPEC.md` | `docs/ARCHITECTURE.md` | `docs/RBAC.md` | `docs/ROADMAP.md` | `docs/MANUAL.md` | **`docs/HELP.md` (Help Center story)** → also in-app **Sidebar → HELP → Help • Docs (/help)** (collapsed by default)

## Quick Start (MySQL)

```bash
# 1. MySQL via docker (port 3306)
docker compose up -d mysql

# 2. Env (MySQL) — copy as-is, defaults already match docker-compose.yml
cp .env.example .env

# 3. Migrate & seed
npx prisma migrate deploy --schema=./prisma/schema.prisma
npx prisma generate --schema=./prisma/schema.prisma
./apps/api/node_modules/.bin/tsx apps/api/src/prisma/seed.ts        # RC org + admin@recruitconnect.ng/Admin@123
./apps/api/node_modules/.bin/tsx apps/api/src/prisma/enterprise_seed.ts # superadmin, 3 plans, RBAC
./apps/api/node_modules/.bin/tsx apps/api/src/prisma/rbac_seed.ts   # hr/manager/employee users

# 4. Run
npm run build --workspace=apps/api && node apps/api/dist/main.js # API http://localhost:3001/v1/health -> db:up, docs /api/docs
npm run dev --workspace=apps/web                                  # Web http://localhost:3000  (landing + 24 dashboards)

# Or concurrently (fixed: tsc+nodemon, no tsx EADDRINUSE)
npm run dev # API 3001 (tsc --watch + nodemon --delay 1500ms) + Web 3000
```

Demo logins: `admin@recruitconnect.ng/Admin@123` (org_admin, RC), `superadmin@recruitconnect.ng/Super@123` (super_admin), `hr@, manager@, employee@ / Test@123`.

## Implementation Phases (Current)

- **Phase 1 (MVP, M1-4) DONE:** People (edit modal + Add Employee), Attendance (face motion + liveness), Shifts, **Leave (full lifecycle: create/list/getOne/update/cancel/delete/approve with RBAC + edit modal)**, Command Centers (HR/Manager/Employee/Executive)
- **Phase 2 (M5-7) DONE:** Activity Engine, Exceptions, Fraud (device_sharing/duplicate_face/suspicious), Live Map, Workflows
- **Phase 3 (M8-10) DONE:** Projects, Performance, Talent Marketplace, Passport, Documents/Assets
- **Phase 4 (M11-14) DONE:** Workforce Intelligence (HR Health 89), Copilot (RAG), Digital Twin, Face Verification (motion 0.8–12%, FaceDetector, 90d retention), MySQL 8
- **Patch 2026-09-06 DONE:** **Leave** hard delete wrong pending + cancel + edit (`apps/api/src/modules/leave/*`, `leave/page.tsx`), **ChatBot** contrast fix `CsWidget.tsx:131-305` (`white/#1e293b !important`, remote CSS disabled) — all modules audited, docs updated `API_SPEC.md §7`, `MANUAL.md §5/5a`
- **Patch 2026-09-09 DONE:** **Help Center (`/help`) + Sidebar collapsed by default** — story for newbies (Amara/Chidi/Blessing/Emeka/Zainab/Aisha), 10-step process map, roles matrix, 44 modules searchable, attendance/leave deep dives, FAQ. Sidebar `Sidebar.tsx:67` `useState(true)` + `localStorage onehr_sidebar_collapsed`, `HELP → Help • Docs` protected, `Manual • PDF` remains public. Docs: `docs/HELP.md` + `MANUAL.md §0` updated.

See `docs/ROADMAP.md` for details. New: **Landing** (`/`, `/register`, `/about`, `/contact`) with `AuthNav` (Login vs Dashboard/Logout). **In-app Help:** Sidebar HELP → **Help • Docs (/help)** (collapsed by default → click `›` to expand).

## Key Design Principles

- Activity is supporting info, never auto productivity score.
- Face/GPS are **optional + consent + retention-controlled** — now enforced with motion liveness (face + motion snap, 90d, flagged for review).
- Fraud is **flagged for review**, never auto-accused (device_sharing, duplicate_face, suspicious_attendance).
- Multi-tenant via **MySQL** `organization_id` scoping: explicit filters per service **+** a Prisma query extension that force-injects `organizationId` on every request (`TENANT_GUARD`, see `DEPLOY.md §3`). `super_admin` is intentionally global.

## Operations Verified

- **Landing → Login → Employee popup → Attendance:** Employee logs in via `/` → `Login` → if `role=employee` popup “Go to Attendance” → `/attendance` face modal → clock-in 98% → WorkSession `working`.
- **Add Employee:** `HR → People → Add Employee` (modal jobTitle/grade/dept/branch/skills) → `POST /v1/employees` → appears in People and `Super Admin → Organizations → Employees count` instantly.
- **Register → Super Admin onboarding:** `POST /v1/organizations` public (company, acronym, industry, adminEmail) → creates org + branch + HR dept + org_admin user + leave types → appears in `Super Admin → Organizations (pending)` → `Onboarding Queue` assign plan (`POST /admin/subscriptions/assign`).

See `docs/MANUAL.md` for step-by-step.

