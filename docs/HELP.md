# OneHR — Help Center Source (Story & Process Flow)

> **For newbies who don’t know how to go about this application.** This is the source that powers `apps/web/app/(dashboard)/help/page.tsx` — reachable via **Sidebar → HELP → Help • Docs (/help)**. Sidebar is **collapsed by default (72px)**, click `›` to expand.

## Story — A Day in the Life of Acme Ltd

**Cast:** Amara (Founder) → Chidi (Super Admin, RecruitConnect) → Blessing (HR Admin) → Emeka (Manager, 8 staff) → Zainab (Employee) → Aisha (Executive).

### Chapter 1 — The Idea (Register)
Amara lands on `/` → **Get Started** → `/register`. She enters *Acme Ltd*, acronym **ACM** (tenant key, unique), industry **tech**, email `amara@acme.ng`. She clicks **Create workspace**. API `POST /v1/organizations` (public) creates: organization + *Head Office* branch + *HR* department + **org_admin** user + employee **ACM-000001** + leave types (Annual, Sick). She sees *Workspace pending approval*.

### Chapter 2 — The Gatekeeper (Super Admin)
Chidi logs in as `superadmin@recruitconnect.ng / Super@123` (acronym **RC**) → `/admin`. **Organizations** tab shows *ACM • pending • No plan* with amber **NEW** + **Onboarding Queue** top card. He picks **Growth · ₦150k** → **Onboard → Assign Plan** (`POST /admin/subscriptions/assign`). ACM becomes **active**, modules gated by `subscription.plan.modules`.

### Chapter 3 — Building the House (Setup)
Amara logs in via `/login` with **acronym ACM + email + password** → lands `/hr` (Command Center). She opens **Administration → Dropdowns** for grades, **Settings** for `grace_period 10m`, overtime after 8h, break 60m, **Shifts** for *Morning 08:00–17:00*, **Leave → Types** for Annual 21d. She toggles attendance policy: facial optional + GPS opt-in, 90d snapshot retention (consent).

### Chapter 4 — People Arrive
Blessing (hr@ / Test@123, RC) → **People → Add Employee** modal → Job Title, Grade, Department, Branch, Skills → `POST /employees` → row **RC-00000X** + QR appears, Super Admin **Employees count** ticks. She clicks pencil → **Edit** → `PATCH /employees/:id` (snake→camel, skills JSON). She bulk-imports 40 via CSV. Each gets *Digital Passport*.

### Chapter 5 — The First Clock
Zainab (employee@ / Test@123) logs in → modal *“Welcome, Zainab — Ready to clock in? Go to Attendance”* (`login/page.tsx:15`, `employee/page.tsx:8`). She taps **Go to Attendance → Clock In**. Camera: **FaceDetector + motion 0.8–12%** 25 frames → *liveness verified* → **Snap & clock-in**. Payload `face_snapshot_base64 + face_meta + device_fingerprint + GPS` → `POST /attendance/clock-in` → WorkSession **working** 98%. No face/motion out-of-range → flagged `suspicious_attendance` for Blessing (never auto-accused). She uses **Start Break / End Break** then **Clock Out** → Net = Gross − Breaks, overtime 23m.

### Chapter 6 — Life Happens (Leave)
Zainab → **Leave → Request Leave** (type, dates, reason) → `POST /leave/requests` pending. She fixes typo → **Edit (pencil)** → `PATCH /:id` (pending only, owner/hr/manager-of-owner). Wrong entry → **Delete (trash)** → `DELETE /:id` (hard delete pending only). Or cancel approved → **Cancel (ban)** → `PATCH /:id/cancel`. Emeka (manager) → **Leave → Requests** or **My Team** → **Approve (check) / Reject (X)** → `PATCH /:id/approve` (only pending, manager team, employee blocked). Balances `GET /leave/balances/:employeeId`.

### Chapter 7 — The Watchtower
Blessing → **Command Center** → Today 1245, 1067 clocked, 17 exceptions, 84 on leave. She checks **Exception Center** (device_sharing, duplicate_face, impossible travel → Requires Review) → bulk resolve. She opens **Live Map** (GPS consented) → Head Office 542, Branch A 83, geofence 200m. Emeka → **My Team** → present/absent/late/leave + workload **Balanced/High/Critical**.

### Chapter 8 — The Ledger
Month end: **Payroll** uses net minutes + overtime + leaves + shifts → basic + allowances − deductions − tax. Aisha (executive) → **Executive** → HR Health **89/100** (6 indicators), attrition 4.8%, alerts. She runs **Simulator**: “salary +10% → payroll +₦12.5m”.

### Chapter 9 — The Oracle
Blessing asks **AI Copilot**: “Who has probation ending?” → answers only from approved policies (RAG) with citations, permission-scoped. She uploads handbook PDF → chunk 500+50 overlap → embed → pgvector.

**Moral:** Activity is supporting info, never productivity score. Face/GPS opt-in + 90d retention + audit. Fraud flagged, not accused. Every PATCH/POST/DELETE logged to `audit_logs` 7yr.

---

## 10-Step Process Map

| # | Step | Who | Where | API | Action |
|---|------|-----|-------|-----|--------|
| 1 | Discover → Register | Founder | `/ • /register` | `POST /organizations` (public) | Create workspace pending |
| 2 | Approve → Onboard | Super Admin | `/admin` Organizations + Queue | `GET /admin/organizations`, `POST /admin/subscriptions/assign` | Select plan → Onboard |
| 3 | Configure Org | org_admin | `/settings`, `/settings/dropdowns`, `/shifts` | `PATCH /organizations/:id`, `POST /shifts`, `POST /leave/types` | Grace 10m, shifts, leave types, retention |
| 4 | Add People | hr_admin | `/employees` Add Employee | `POST /employees`, `PATCH /employees/:id` | Generate RC-000245 + QR, edit modal |
| 5 | Clock In/Out | employee | `/attendance`, `/employee` popup | `POST /attendance/clock-in|clock-out|break/*`, `GET /attendance/sessions` | Face motion snap 98% |
| 6 | Monitor Live | hr/manager/executive | `/hr` Command Center | `GET /attendance/command-center`, `/live-map`, `/exceptions`, `/analytics/workforce-scores` | Today snapshot + Health radar |
| 7 | Request Leave | employee | `/leave` | `POST/GET/PATCH/DELETE /leave/requests` | Type•Dates→Reason, Days auto |
| 8 | Approve & Workload | manager/hr | `/leave` Check/X, `/manager`, `/projects` | `PATCH /leave/requests/:id/approve|reject`, `GET /workload/:employee_id` | Approval SLA 24h, workload |
| 9 | Pay & Measure | hr/auditor/executive | `/payroll`, `/performance`, `/analytics` | `GET /payroll`, `/analytics/workforce-score` | Net time 100%, Risk Engine |
| 10 | Predict & Advise | all | `/ai-copilot`, `/intelligence` | `POST /policies/upload`, `POST /ai/copilot/query`, `POST /analytics/simulate` | RAG cites, Digital Twin |

---

## Roles Matrix

| Role | Lands on | Can do | Cannot |
|------|----------|--------|--------|
| super_admin | /admin | Cross-org, Organizations count, Queue Assign Plan, bypass | — |
| org_admin | /hr | Full org config, People CRUD, payroll | — |
| hr_admin | /hr | People, attendance, leave, exceptions, bulk, reports | Org config |
| manager | /manager | My Team Today/Month, team leave approve | All-org |
| employee | /employee → popup → /attendance | Self clock, leave (edit/cancel/delete pending), payslip, docs | Approve, view others |
| executive | /executive | Health 89/100, attrition, cost, forecasts (read-only) | Edit |

Middleware `middleware.ts:10,16` protects `/hr…` via cookie `onehr_auth`; unauth → `/login?next=`. Sidebar `visible()` filters by role+perms+module (subscription gating). Login needs **acronym + email + password** for tenant isolation (`organization_id` + `sp_set_session_context`).

---

## Modules (44) by Pillar

- **OVERVIEW:** Chat (/chat), Command Center (/hr), Executive (/executive), My Team (/manager), Home (/employee)
- **MANAGE PEOPLE:** People (/employees), ID Cards (/id-cards), Recruitment (/recruitment), Onboarding (/onboarding), Documents (/documents), Assets (/assets)
- **MANAGE WORK:** Attendance (/attendance), Shifts (/shifts), Leave (/leave), Tasks & Projects (/projects)
- **MEASURE:** Performance (/performance), Learning (/learning), Engagement (/engagement), Payroll (/payroll), Compliance (/compliance), Reports (/reports), Live Map (/hr), Exceptions (/hr)
- **PREDICT:** People Analytics (/analytics), AI Copilot (/ai-copilot), Intelligence (/intelligence)
- **SYSTEM:** Subscription (/subscriptions), Audit Trail (/audit), Automation (/workflows), Integrations (/integrations), Administration (/settings), Dropdowns (/settings/dropdowns)
- **SUPER ADMIN:** Super Admin (/admin)
- **HELP:** Help • Docs (/help), Manual • PDF (/manual), About (/about), Contact (/contact)

Search in `/help` filters modules client-side.

---

## Attendance Deep Dive

- **7 methods:** Mobile, Web, QR, Biometric, Facial (98%), NFC/ID, API.
- **Capture:** `FaceCaptureModal` 160×120 canvas, frame diff motion %, 25 frames, 0.8–12% → verified; FaceDetector API if available.
- **POST** `face_snapshot_base64, face_meta, device_fingerprint, location {lat,lng,accuracy}, ip` → `work_sessions working`, 98%, event `facial verified`. Fail → `suspicious_attendance`.
- **Fraud:** device_sharing 7d, duplicate_face 10m, impossible_travel, out_of_geofence → flagged `Requires Review`.
- **GPS:** `navigator.geolocation` highAccuracy 8s timeout, stored per clock; Live Map 200m circles.
- **Missing clock-out:** stays `working`, superadmin `PATCH admin/sessions/:id/clock-out {clockOutAt, reason}` or `POST admin/auto-close {date, clockOutAt}` default 17:00.

---

## Leave Lifecycle (patched 2026-09-06)

`apps/api/src/modules/leave/*` + `apps/web/app/(dashboard)/leave/page.tsx`

| Endpoint | Who | Rule |
|----------|-----|------|
| POST /leave/requests | employee/manager/hr | Resolve employeeId from JWT, calculate days, include leaveType |
| GET /leave/requests | scoped | employee own, manager team, hr all |
| GET /:id | scoped | 404/403 |
| PATCH /:id | owner/hr/manager-of-owner | Only pending, partial leave_type_id/start/end/reason → recalcs days |
| PATCH /:id/cancel | same | pending|approved→cancelled |
| DELETE /:id | same | Hard delete pending only, else 403 |
| PATCH /:id/approve|reject | manager team, hr | Only pending, employee blocked |
| GET /leave/balances/:employeeId | self or hr | With leaveType |

UI: Request form left, Requests table right, Actions gated by status, Edit modal, Delete confirm, toasts.

---

## Sidebar Collapsed Behavior

`components/Sidebar.tsx:67` `useState(true)` → collapsed by default. `useEffect` reads `onehr_sidebar_collapsed` from localStorage, `toggleCollapsed` persists. Button `ml-auto` `›/‹` toggles with `aria-label`. Aside `w-[72px]` vs `w-[280px]` `transition-all 300ms`. Icons only when collapsed, `title` shows label hover, badges move to overlay. Preference survives reload.

---

## FAQ (highlights)

- **Login needs acronym** — tenant isolation, else error.
- **Menu collapsed** — click chevron, saved.
- **Employee can’t see People** — RBAC expected.
- **Facial optional** — consent + 90d retention.
- **Delete vs Cancel** — pending only hard delete.
- **Forgot clock-out** — Missing card → Set Clock-Out or Auto-close.
- **Help link** — Sidebar HELP → Help • Docs (/help).

---

*Updated 2026-09-09. Source for `/help` page. Also update `docs/MANUAL.md §0`, `README.md`, `apps/web/middleware.ts`, `apps/web/components/Sidebar.tsx`.* 
