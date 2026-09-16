# OneHR — Run As User With Roles (Help Docs Story Flow + Report)

> **Goal:** Show how to run as each role using `docs/HELP.md` story, then land on **HELP → Reports** (`/reports` live from `GET /v1/analytics/reports`). Sidebar is collapsed by default (72px) → click `›` to expand, `HELP → Help • Docs (/help)` is always visible.

## 0) Pre-flight (Online DB = Supabase `aws-1-eu-west-1.pooler.supabase.com:6543`)

- API: `https://recruits-connect-one-hr-api.onrender.com/v1` (`NEXT_PUBLIC_API_URL` in `.env:9` and `apps/web/lib/api.ts:3`)
- DB has 120 permissions seeded (`prisma/schema.prisma:5`), roles fixed (`apps/api/src/common/guards/rbac.guard.ts:11` matrix, `apps/api/src/modules/auth/auth.service.ts:30` resolve). Re-login required after role fix (JWT 15m).
- Branches: `RC` now 1 (`Lagos Head Office` `fb3301eb`), duplicate removed. `GET /branches` 200 for all roles with token, 401 without.

## 1) Logins — 5 Characters from `docs/HELP.md:7` Cast

| Who | Email / Pw | Acronym | Lands on | Story Chapter | Sidebar |
|-----|------------|---------|----------|---------------|---------|
| Chidi Super Admin | `superadmin@recruitconnect.ng / Test@123` | `RC` | `/admin` | Ch.2 Gatekeeper — sees Organizations + Onboarding Queue, assigns plan | `SUPER ADMIN` only |
| Amara Org Admin | `admin@recruitconnect.ng / Test@123` | `RC` | `/hr` Command Center | Ch.3 Building House — sets shifts, leave types, grace 10m | `OVERVIEW` + `MEASURE` full |
| Blessing HR Admin | `hr@recruitconnect.ng / Test@123` | `RC` | `/hr` | Ch.4 People Arrive, Ch.7 Watchtower — adds People, resolves exceptions | `MANAGE PEOPLE` CRUD, `Reports` 200 |
| Emeka Manager | `manager@recruitconnect.ng / Test@123` | `RC` | `/manager` My Team | Ch.6 Leave approve team, Ch.7 workload | `My Team` team-scoped, **Reports 403** (no `report:read`) |
| Zainab Employee | `employee@recruitconnect.ng / Test@123` | `RC` | `/employee` → popup → `/attendance` | Ch.5 First Clock, Ch.6 Request Leave | `Home` self-only, **Reports 403** |

Login payload: `{email,password,acronym}` → `POST /v1/auth/login` (`apps/api/src/modules/auth/auth.controller.ts:27`) → JWT `{sub,role,org_id,permissions}`. Web stores `localStorage onehr_token + onehr_user` (`apps/web/app/api/auth/login/route.ts:24` + `apps/web/app/login/page.tsx:28`) → `apps/web/lib/api.ts:8 getAuthHeaders()` adds `Authorization Bearer`.

## 2) Flow — Follow Help Docs Chapters, End at Report

### Chapter 1 Register (Amara) → Chapter 2 Gatekeeper (Chidi) — reference `docs/HELP.md:9`

- Already done: `RC` and `JS1000` orgs active. To replay: `POST /v1/organizations` public creates pending, then `POST /admin/subscriptions/assign` activates.

### Chapter 3 Setup (org_admin) — `docs/HELP.md:15`

- Login as `admin` → `Settings → Dropdowns → Branches (1)` → `Shifts` → `Leave Types` (Annual 21d etc). All via `POST /branches`, `POST /shifts`, `PATCH /organizations/:id`.

### Chapter 4 People (hr_admin) — `docs/HELP.md:18`

- `People → Add Employee` → `POST /employees` → `RC-0000XX` + QR. Edit via `PATCH /employees/:id`. Bulk via `POST /employees/bulk`.

### Chapter 5 Clock (employee) — `docs/HELP.md:21`

- Login as `employee` → modal `Go to Attendance` → `POST /attendance/clock-in` with `face_snapshot_base64` or standard → `work_sessions working` → `POST /attendance/clock-out` → net = gross - breaks.

### Chapter 6-7 Leave & Watchtower — `docs/HELP.md:24`

- Employee `POST /leave/requests` pending → Manager `PATCH /leave/requests/:id/approve` (team only) → HR sees `GET /attendance/command-center` (1245/1067/17/84).

### Chapter 8 Ledger + Report (All → Help → Reports)

This is the **Report under Help link** flow:

1. While logged as any role, open **Sidebar → HELP → Help • Docs (/help)** → new section `Reports • Exports — Live Demo` (`apps/web/app/(dashboard)/help/page.tsx:TOC reports`).
2. Read `Story Chapter 7-8` tie-in box, then click `Go to Reports` or `Sidebar → MEASURE → Reports (/reports)` (`apps/web/components/Sidebar.tsx:51` gated to `report:read`).
3. `GET /v1/analytics/reports`:
   - `super_admin` 200: `{"reports":[{"id":"live","hrHealthOverall":89}],"employees":[...]}`
   - `hr_admin` 200: same (now fixed to `report:*`)
   - `manager` 403: `Missing permission: report:read for role manager`
   - `employee` 403: same — expected per `docs/RBAC.md:22` (only org_admin/hr_admin/super_admin/auditor/executive have `R` for Reports).
4. On `/reports` (`apps/web/app/(dashboard)/reports/page.tsx:37`): DataGrid with `slice/dice/group/pivot` (type, status, period) — live from API, no mock. Click `Download` → JSON export. Also `GET /analytics/dashboard` → workforceScore 74, branches 1, employees 4 (see `apps/api/src/modules/analytics/analytics.service.ts:86` computeLiveScore).
5. Slice example: Group by `type`, Slice `status=ready` → filtered view. HR Health computed 89/100 (attendance 94, performance 87, learning 91, engagement 78, compliance 96, stability 89).

**Live verification 2026-09-16 (we ran):**

```
super_admin 200 reports 1, dashboard workforceScore 74
hr_admin 200 reports 1, command-center 200
manager 403 reports, 403 dashboard, 200 command-center
employee 403 reports, 200 attendance/sessions (self), branches 200
```

## 3) Help Link Placement

- `Sidebar HELP` (`apps/web/components/Sidebar.tsx:71`): `Help • Docs (/help)`, `Manual • PDF (/manual)`, `About`, `Contact` — always visible (`visible()` no perms check for Help).
- Inside `/help`: TOC now includes `Reports • Exports` (`apps/web/app/(dashboard)/help/page.tsx:6`), section `id=reports` with role badges, login snippet, and `Go to Reports` CTA.
- Also `Sidebar → MEASURE → Reports` is gated, but Help → Reports docs is not — so even employee can read how reports work before being blocked.

## 4) Branch Fix Context

- `GET /branches` 401 fixed by restoring `onehr_token` (`apps/web/app/api/auth/login/route.ts:24` + `login/page.tsx:28`). After cleanup, `RC` has 1 branch (was duplicate). `DELETE /v1/branches/:id` 409 if departments/employees linked (`apps/api/src/modules/branches/branches.service.ts:68`) — correct, PATCH edits name/address/gpsRadius. Frontend `dropdowns/page.tsx:119` shows alert with count.

## 5) Re-run Yourself (30s per role)

```bash
# login as hr_admin
curl -s https://recruits-connect-one-hr-api.onrender.com/v1/auth/login -H "Content-Type: application/json" -d '{"email":"hr@recruitconnect.ng","password":"Test@123","acronym":"RC"}' | jq .user.permissions
# fetch report
TOKEN=$(curl -s https://.../auth/login -H "Content-Type: application/json" -d '{"email":"hr@recruitconnect.ng","password":"Test@123","acronym":"RC"}' | jq -r .access_token)
curl -s https://recruits-connect-one-hr-api.onrender.com/v1/analytics/reports -H "Authorization: Bearer $TOKEN" | jq .
```

Swap email to `manager@`, `employee@` to see 403.

---
*Source: docs/HELP.md, docs/RBAC.md, apps/web/app/(dashboard)/help/page.tsx, apps/web/app/(dashboard)/reports/page.tsx, apps/api/src/modules/analytics/analytics.service.ts, rbac.guard.ts*
