# OneHR — Operations Manual (MSSQL `onehr_v2`)

> Updated 2026-09-01 — covers MSSQL migration, landing, auth, People edit, face clock, register → superadmin onboarding.

## 1. Quick Verify (2 min)

```bash
# API health (MSSQL)
curl http://localhost:3001/v1/health # {"db":"up"}

# Web landing
open http://localhost:3000 # hero One Platform... -> Login / Register / Employee Clock In

# Logins
# admin@recruitconnect.ng / Admin@123 -> HR Command Center
# superadmin@recruitconnect.ng / Super@123 -> Super Admin
# hr@ / manager@ / employee@ / Test@123
# testco@demo.ng / Test@123 (if you registered TC)
```

## 2. Employee Login → Clock-In Popup

**Flow:** Landing `/` → `Login` (or `Employee Clock In` button in hero) → `POST /v1/auth/login` → role-based redirect. If `role=employee`, `apps/web/app/login/page.tsx:15` shows modal:

> “Welcome, <name> — Ready to clock in? Face + motion liveness will open.”

Buttons: `Later → /employee` or `Go to Attendance → /attendance`. Also `apps/web/app/(dashboard)/employee/page.tsx:8` shows same popup on first visit if not yet `GET /attendance/sessions?today` clocked.

**Verify:**
1. Login as `employee@recruitconnect.ng / Test@123` (or any employee)
2. Popup appears → click `Go to Attendance`
3. `Attendance → Clock In` → Face modal opens (camera preview, `FaceDetector` + motion 0.8–12% check, `liveness verified` → `Snap & clock-in`)
4. `POST /attendance/clock-in` with `face_snapshot_base64` + `face_meta` + `device_fingerprint` → `work_sessions` `working`, `verificationScore 98%`, `attendance_events` `facial` `verified`. Fail liveness → `exceptions` `suspicious_attendance` flagged.

**Fraud:** `apps/api/src/modules/attendance/attendance.service.ts:18` flags `device_sharing` (same fingerprint 7d), `duplicate_face` (same hash 10min), `suspicious_attendance` (no face or motion out of range). Visible in `Attendance → Exception Center` and `HR Command Center`.

## 3. Add New Employee (People)

**UI:** `HR → People` (`apps/web/app/(dashboard)/employees/page.tsx:6`) — `Add Employee` (was disabled/hard-coded New Hire, now modal). Enabled for `org_admin|hr_admin|super_admin` (RBAC `POST /employees` requires `hr_admin|org_admin|super_admin`). `super_admin` adds to RC org (its `org_id`), but new orgs’ own `org_admin` adds to their org.

**Steps:**
1. Login as `admin@recruitconnect.ng / Admin@123` → `People`
2. Click `Add Employee` → fill `Job Title*` (e.g. Software Engineer), `Grade`, `Work Arrangement`, `Employment Type`, `Department`/`Branch` (from `GET /departments`/`branches` or fallback), `Skills` comma separated
3. `Create Employee` → `POST /v1/employees {job_title, grade, department_id, branch_id, work_arrangement, employment_type, skills:[]}` → `201` `RC-00000X` + `qr_code`
4. Appears instantly in `People` table and `Super Admin → Organizations → _count.employees` increments.

**Edit:** Click `Edit` (pencil) on row → modal pre-filled from `GET /employees/:id` (jobTitle, grade, workArrangement, employmentType, status, departmentId, branchId, skills JSON parsed) → `PATCH /v1/employees/:id` (maps `snake→camel`, `skills JSON.stringify`) → audit.

**Verify:** `curl -X POST /v1/employees -H "Authorization: Bearer $TOKEN" -d '{"job_title":"QA Engineer","grade":"L2"}'` → 201. `curl GET /v1/employees` shows new row.

## 4. Register New Company → Super Admin Onboarding

**Public register:** `POST /v1/organizations` `apps/api/src/modules/organizations/organizations.controller.ts:10` `@Public()` — creates org + `attendancePolicy` (standard/gps/qr) + `Head Office` branch + `HR` department + `org_admin` user (bcrypt) + `employee TC-000001` + `leaveTypes` (Annual/Sick). Acronym unique (`ConflictException` if exists). No auth required.

**Web:** `/register` (`apps/web/app/register/page.tsx:15`) form `company, acronym, industry, email, password, confirm` → `POST /v1/organizations` → on `200` shows `Request received!` with demo logins → redirect `/login`. On `401/403` also shows success (fallback demo).

**Super Admin view:** Login `superadmin@recruitconnect.ng / Super@123` → `/admin` → `Organizations (N)` tab (`apps/web/app/(dashboard)/admin/page.tsx:8` fetches `GET /v1/admin/organizations` with fallback `GET /v1/organizations`, both `super_admin` only). Shows table: `Organization | Acronym | Industry | Users | Employees | Group | Plan | Status | Created`. New orgs with `!subscriptions.length` are highlighted `NEW` + `Needs onboarding` and appear in **Onboarding Queue** amber card at top with `Select plan → Onboard → Assign Plan` (`POST /v1/admin/subscriptions/assign {organizationId, planId}`).

**Steps to onboard:**
1. Register via `/register` (e.g. `Acme Ltd / ACM / tech / acme@demo.ng / Acme@123`)
2. As superadmin, `/admin → Organizations` → see `ACM` `pending` `No plan`
3. In Onboarding Queue, select plan (Starter/Growth/Enterprise from `GET /v1/admin/plans`) → `Onboard → Assign Plan` → `subscriptions` created `active`, org status becomes `active`.

**Verify via API:**
```bash
curl -X POST http://localhost:3001/v1/organizations -H "Content-Type: application/json" -d '{"name":"Acme Ltd","acronym":"ACM","industryTemplate":"tech","adminEmail":"acme@demo.ng","adminPassword":"Acme@123"}'
curl -H "Authorization: Bearer $SUPER_TOKEN" http://localhost:3001/v1/admin/organizations | jq '.[].acronym'
curl -X POST http://localhost:3001/v1/auth/login -d '{"email":"acme@demo.ng","password":"Acme@123"}' # new org_admin can now add employees to ACM
```

## 5. Header Auth Toggle

- **Landing `app/page.tsx:1` `AuthNav`**: `useState` `onehr_user` from `localStorage`. If `user` exists → shows `user.email • role` + `Dashboard` (role-based) + `Logout` (clears `localStorage` + `onehr_auth` cookie → `/login`), else `Login` + `Get Started`.
- **Dashboard `app/(dashboard)/layout.tsx:1` `DashboardLayout`**: `'use client'` checks `onehr_user`, shows `user.email • role` + `Logout` when logged in, else `Sign in`. `Sidebar.tsx:59` also shows `user.email/role` instead of hardcoded `HR Admin`.

**Verify:** Login as `employee` → landing header changes from `Login` to `employee@... • employee` `Logout`; dashboard header same. Logout → back to `Sign in`.

## 6. Full Stack Health

- **DB:** `mcr.microsoft.com/mssql/server:2022` `accountingappdb:1433` `onehr_v2` 46 tables, `sqlserver` provider, `NVarChar(Max)` for JSON, `NoAction` cascades.
- **API:** `apps/api/src/main.ts:1` `process.loadEnvFile` + `dotenv`, `tsc --watch` + `nodemon --delay 1500ms` (was `tsx watch` EADDRINUSE). `GET /v1/health` `db:up`, `POST /auth/login`, `GET /employees`, `PATCH /employees/:id`, `POST /attendance/clock-in` with face, `POST /organizations` public, `GET /admin/organizations` super_admin.
- **Web:** `npm run dev` `concurrently` `api 3001` + `web 3000` (after `sudo chown -R mac:staff apps/web/.next apps/api/dist`), `next build` 29→32 routes `✓ Compiled 29/29`.

## 7. Demo Accounts (seeded)

| Email | Password | Role | Org |
|-------|----------|------|-----|
| admin@recruitconnect.ng | Admin@123 | org_admin | RC |
| superadmin@recruitconnect.ng | Super@123 | super_admin | RC |
| hr@recruitconnect.ng | Test@123 | hr_admin | RC |
| manager@recruitconnect.ng | Test@123 | manager | RC |
| employee@recruitconnect.ng | Test@123 | employee | RC |
| testco@demo.ng | Test@123 | org_admin | TC (registered) |

All operations above are live and verified via `curl` + UI.
