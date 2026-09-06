# RecruitConnect OneHR™ - API Specification
**Version:** 1.0 | **Base URL:** `https://api.onehr.recruitconnect.ng/v1` | **Date:** 2026-08-31
**Auth:** JWT (Access 15m, Refresh 7d) + Organization-scoped | **Format:** JSON | **Pagination:** Cursor-based

---

## 1. Conventions

- **Multi-tenancy:** `X-Organization-Id` header or subdomain `org.onehr.ng`. RLS enforced via `app.org_id` DB setting derived from JWT `org_id` claim.
- **Error Format:**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Late minutes cannot be negative", "details": [] } }
```
- **Pagination:** `?limit=20&cursor=ey...` → `{ "data": [], "meta": { "next_cursor": "...", "has_more": true } }`
- **Filtering:** `?status=active&work_arrangement=remote&search=adewale`
- **Sorting:** `?sort=-created_at` (prefix `-` for desc)
- **Idempotency:** `Idempotency-Key` header for POST (attendance clock, leave request).
- **Rate Limit:** 100 req/min per user, 1000/min per org (429 with Retry-After).
- **Versioning:** URL prefix `/v1`, breaking changes → `/v2`.

---

## 2. Authentication & Users

### POST /auth/login
Login with email/password (+ optional MFA).
- **Body:** `{ "email": "michael@rc.ng", "password": "...", "mfa_code": "123456" }`
- **200:** `{ "access_token": "ey...", "refresh_token": "...", "user": { "id", "role", "org_id" } }`
- **401:** Invalid credentials.

### POST /auth/refresh
- **Body:** `{ "refresh_token": "..." }` → new access_token.

### POST /auth/device/register
Register authorized device for mobile attendance (Section 36).
- **Body:** `{ "device_fingerprint": "abc", "device_type": "mobile", "device_name": "iPhone 14" }`
- **201:** `{ "device": { "id", "is_authorized": true } }`

### GET /auth/me
Current user + employee profile + permissions.

---

## 3. Organizations & Configuration

### POST /organizations
Public self-registration (MSSQL `onehr_v2`). Creates org + Head Office branch + HR dept + `org_admin` user + `TC-000001` employee + leave types.
- **Body:** `{ "name": "Acme Ltd", "acronym": "ACM", "industryTemplate": "tech", "adminEmail": "acme@demo.ng", "adminPassword": "Acme@123" }`
- **201:** `{ "organization": { "id", "acronym": "ACM" }, "user": { "email", "role": "org_admin" } }`
- **Public:** No auth, acronym unique.

### GET /organizations
List all orgs (super_admin/org_admin, RLS). Used by `Super Admin → Organizations` fallback.

### GET /organizations/:id
### PATCH /organizations/:id
Update config engine (Section 42). Only `org_admin`.
- **Body:** `{ "config": { "workdays": ["mon","tue"], "grace_period_minutes": 10, "overtime_rules": {...} }, "industry_template": "banking" }`

### GET /organizations/:id/config
Full configuration dump.

### GET /organizations/:id/health-score
HR Health Score (Section 18). Aggregated monthly.
- **Query:** `?month=2026-08&branch_id=...`
- **200:** `{ "attendance_health": 94, "performance_health": 87, "hr_health_overall": 89 }`

---

## 4. Employees (Digital Identity)

### POST /employees
Create employee + auto-generate OneHR ID & QR.
- **Body:**
```json
{
  "first_name": "Michael", "last_name": "Ade",
  "department_id": "uuid", "branch_id": "uuid",
  "job_title": "HR Manager", "grade": "M3",
  "manager_id": "uuid", "employment_type": "permanent",
  "work_arrangement": "hybrid", "hire_date": "2026-01-15",
  "skills": ["HRIS", "Compliance"]
}
```
- **201:** `{ "employee": { "id", "employee_code": "RC-000245", "qr_code": "data:image/png...", "photo_url": null } }`
- **409:** Duplicate code (retry with seq).

### GET /employees
List with filters: `status, department_id, branch_id, work_arrangement, search, grade`.
- **RBAC:** Employee sees self; Manager sees subordinates; HR sees all in org.

### GET /employees/:id
Full profile (25+ fields, section 3). Includes `completeness_score`.

### PATCH /employees/:id
Update profile. Audit logged.

### GET /employees/:id/timeline
Activity Timeline (Section 4).
- **Query:** `?date=2026-08-18`
- **200:**
```json
{
  "date": "2026-08-18",
  "events": [
    { "time": "08:02", "activity": "Clock In", "method": "mobile", "verification": "Face Match 98%" },
    { "time": "08:05", "activity": "Portal Login", "ip": "102.89.x.x" }
  ]
}
```

### GET /employees/:id/passport
Digital Employee Passport (Career Passport™).
- **Query:** `?fields=skills,certifications,training,achievements` (employee controls shareable).
- **200:** PDF/JSON.

### POST /employees/:id/photo
Upload photo. `multipart/form-data`.

### POST /employees/:id/face-profile
Register face profile (encrypted). Requires `consent_face=true` + org policy allows facial.

---

## 5. Attendance & Work Sessions

### POST /attendance/clock-in
Smart Attendance (Section 7). Idempotent per day.
- **Body:**
```json
{
  "method": "mobile",
  "timestamp": "2026-08-18T08:02:00Z",
  "location": { "lat": 6.5244, "lng": 3.3792 },
  "device_fingerprint": "abc",
  "face_snapshot_base64": "optional",
  "qr_token": "optional"
}
```
- **201:** `{ "work_session": { "id", "clock_in_at": "...", "status": "working", "verification_score": 98 } }`
- **403:** Device not registered / outside geofence / face mismatch.
- **409:** Already clocked in today.

### POST /attendance/clock-out
- **Body:** Same as clock-in. Computes `gross, net, overtime`.
- **201:** `{ "work_session": { "clock_out_at": "...", "gross_duration_minutes": 546, "break_duration": 43, "net_working_minutes": 503, "overtime_minutes": 23 } }`

### POST /attendance/break/start
### POST /attendance/break/end
- **Body:** `{ "timestamp": "..." }`

### GET /attendance/sessions
List work sessions. Filters: `employee_id, date_from, date_to, status, branch_id`.
- **Example:** `GET /attendance/sessions?date=2026-08-18&branch_id=...` for Command Center.

### GET /attendance/sessions/:id
Single session with breaks breakdown + verification log.

### GET /attendance/events
Raw event log with snapshot_ref, verification_status, location. Filter by `event_type, verification_method`.

### GET /attendance/command-center
Aggregated today (Section 14).
- **200:**
```json
{
  "today": "2026-08-18",
  "employees": 1245, "clocked_in": 1067, "remote": 328,
  "on_break": 82, "absent": 94, "late": 63,
  "on_leave": 84, "overtime": 41,
  "exceptions": 17, "pending_approvals": 126
}
```

### GET /attendance/live-map
Permission-controlled, only if GPS opt-in.
- **200:** `{ "head_office": 542, "branch_a": 83, "remote": 328, "field": 119, "branches": [{ "id", "name", "count", "lat", "lng" }] }`

### GET /attendance/exceptions
Exception Center (Section 37). Filters: `type, severity, status`.
- **200:** `{ "exceptions": [{ "id", "type": "missing_clockout", "count": 23, "severity": "critical" }] }`

### PATCH /attendance/exceptions/:id
Resolve/dismiss. Body: `{ "status": "resolved", "comment": "Approved overtime" }`. Bulk via `POST /attendance/exceptions/bulk-resolve`.

### GET /attendance/reports/employee | /department | /executive
Reports (Section 38). Query: `?from=2026-08-01&to=2026-08-31&format=json|csv`.

---

## 6. Shifts & Rosters

### GET /shifts
### POST /shifts
- **Body:** `{ "name": "Morning", "type": "fixed", "start_time": "08:00", "end_time": "17:00", "break_duration_minutes": 60 }`

### GET /shifts/:id
### PATCH /shifts/:id
### DELETE /shifts/:id

### POST /rosters
Assign shift to employees.
- **Body:** `{ "shift_id": "uuid", "employee_ids": ["uuid"], "dates": ["2026-08-18"] }`
- **201:** Bulk created.

### GET /rosters
Filter: `employee_id, date_from, date_to`.

---

## 7. Leave — Full Lifecycle (Updated 2026-09-06)

### GET /leave/types
List leave types for org. **RBAC:** `leave:read`. **Include:** `leaveType` relation.

### POST /leave/types (org_admin)
Create type. **RBAC:** `hr_admin,org_admin,super_admin` + `leave:*`. **Body:** `{ "name": "Annual", "max_days": 21 }`

### POST /leave/requests
- **Body:** `{ "leave_type_id": "uuid", "start_date": "2026-08-20", "end_date": "2026-08-22", "reason": "..." }`
- **RBAC:** `leave:request:self` (employee/manager/hr). Resolves `employeeId` from `user.sub`, calculates `days`.
- **201:** Creates `leaveRequest` `pending` with `include:{leaveType}`.

### GET /leave/requests
- **Query:** `?status=pending&employee_id=...` — employee sees own only, manager sees own+team, hr sees all. **Include:** `leaveType, employee{employeeCode,jobTitle}`.
- **RBAC:** `leave:read`.

### GET /leave/requests/:id
Get single request with `leaveType, employee`. **RBAC:** employee own, manager team, hr all. **Errors:** `404`, `403`.

### PATCH /leave/requests/:id
Edit **pending** request only. **Body (partial):** `{ "leave_type_id", "start_date", "end_date", "reason" }` (recalculates `days`). **RBAC:** owner or `hr_admin/org_admin/super_admin` or manager-of-owner; else `403 Only pending can be edited`.

### PATCH /leave/requests/:id/cancel
Cancel `pending|approved → cancelled`. **RBAC:** same as update (owner/privileged/manager-of-owner). Use for withdrawing approved leave.

### DELETE /leave/requests/:id
Hard delete **pending only** (wrong entry). **RBAC:** same as update. **Errors:** `403 Only pending can be deleted. Use cancel for approved/rejected.` Returns `{success:true,id}`.

### PATCH /leave/requests/:id/approve | /reject
- **Body:** `{ "comment": "..." }` → advances workflow, updates calendar, notifies. **RBAC:** `manager,hr_admin,org_admin,super_admin` + `leave:approve:team`, manager only team, employee blocked, only `pending` can be approved.
- **200:** Updated request `approved|rejected`.

### GET /leave/balances/:employee_id
- **RBAC:** employee can only view own. **Include:** `leaveType`. **200:** `{ "annual": { "entitled": 21, "used": 5, "remaining": 16 } }` (derived from `leaveRequest` list; future: aggregated balance).

**Frontend:** `apps/web/app/(dashboard)/leave/page.tsx` — Request form + Requests table with Edit (Pencil), Cancel (Ban), Delete (Trash2), Approve (Check), Reject (X) gated by `status`, plus Edit modal. See `docs/MANUAL.md § Leave`.

---

## 8. Tasks & Projects (Section 25)

### POST /projects
- **Body:** `{ "name": "Lagos Branch Expansion", "owner_id": "uuid", "start_date": "...", "end_date": "..." }`

### GET /projects/:id
Includes `tasks: { total: 18, completed: 14, outstanding: 4 }`.

### POST /projects/:id/tasks
- **Body:** `{ "title": "Site survey", "assignee_id": "uuid", "due_date": "...", "priority": "high" }`

### PATCH /tasks/:id
Update status `done` → increments activity analytics + triggers workload recalc.

### GET /tasks
Filter: `assignee_id, project_id, status, due_from`.

### GET /workload/:employee_id
Workload Monitor.
- **200:** `{ "workload": "balanced", "score": 62, "factors": { "tasks": 14, "overtime": 41, "deadlines": 2 } }`

---

## 9. Performance & KPI

### POST /performance/reviews
### GET /performance/reviews?employee_id=...&cycle=quarterly
### PATCH /performance/reviews/:id
- **Body:** `{ "kpi": [{ "metric": "Sales", "target": 100, "actual": 102 }], "manager_assessment": "strong" }`

### GET /performance/health?department_id=...
Overall Performance Indicator.

---

## 10. Documents & Assets

### POST /documents (multipart)
Upload employee document (policy ack, cert, etc).
- **Fields:** `employee_id, type, file, expiry_date`

### GET /documents?employee_id=...&type=...
### GET /documents/:id/download (signed URL, 5m expiry)

### GET /assets?employee_id=...
### POST /assets/assign
- **Body:** `{ "employee_id": "uuid", "name": "Laptop Dell", "serial": "..." }`

---

## 11. Workflows & Automation

### GET /workflows
### POST /workflows (no-code builder)
- **Body:**
```json
{
  "name": "Annual Leave Approval",
  "trigger": "leave_request_created",
  "condition": { "field": "days", "op": ">", "value": 3 },
  "steps": [
    { "type": "approval", "approver": "manager", "sla_hours": 24 },
    { "type": "action", "action": "update_calendar" },
    { "type": "notification", "channel": "email", "template": "leave_approved" }
  ],
  "escalation": { "after_hours": 48, "to": "hr_admin" }
}
```

### GET /workflows/instances?status=pending
### PATCH /workflows/instances/:id/approve | /reject

### GET /notifications
In-app notifications. Query `?unread=true`.

### POST /notifications/test
Test channel (email/sms/whatsapp).

---

## 12. Talent & Internal Jobs

### POST /vacancies
- **Body:** `{ "title": "Branch Ops Manager", "department_id": "uuid", "eligibility_rules": { "min_grade": "M2", "skills": ["Ops"] } }`

### GET /vacancies?eligible_for=employee_id
### POST /vacancies/:id/apply
Auto eligibility check.

### GET /talent/marketplace
Opportunities feed.

---

## 13. Policies & AI Copilot

### POST /policies/upload (multipart)
Upload handbook/policy PDF. Triggers embedding job.
- **Fields:** `title, file, category`

### GET /policies
### POST /policies/query (Policy Intelligence)
- **Body:** `{ "question": "How many days of annual leave do I have?", "mode": "employee" }`
- **200:** `{ "answer": "21 days per handbook section 4.2", "citations": [{ "policy_id", "page": 4 }], "confidence": 0.92 }` (RBAC filtered)

### POST /ai/copilot/query
Unified Copilot with mode.
- **Body:** `{ "mode": "manager", "query": "Who on my team has outstanding leave approvals?" }`
- **Modes:** hr, manager, executive, recruiter, employee. Returns permission-scoped results.

### GET /ai/copilot/history

---

## 14. Analytics & Intelligence

### GET /analytics/workforce-score
- **Query:** `?period=monthly&date=2026-08`
- **200:** `{ "attendance_health": 94, "performance_health": 87, "learning": 91, "engagement": 78, "compliance": 96, "stability": 89, "hr_health_overall": 89 }`

### GET /analytics/activity
Interaction analytics (Section 6). Never returns productivity score.
- **200:** `{ "employee_id": "...", "date": "2026-08-18", "login_sessions": 3, "active_system_minutes": 342, "workflow_actions": 28, "tasks_completed": 14 }`

### GET /analytics/risks
HR Risk Engine flags.
- **200:** `{ "critical": [{ "type": "expired_certifications", "count": 12, "employees": [...] }], "warnings": [...] }`

### GET /analytics/early-warnings?employee_id=...
Risk Indicator: Elevated + factors.

### POST /analytics/simulate
Decision Simulator (Section 31).
- **Body:** `{ "scenario": "salary_increase", "params": { "percentage": 10 } }`
- **200:** `{ "payroll_impact": 12500000, "annual_cost": 150000000, "details": {...} }`

### GET /analytics/digital-twin?scenario=open_5_branches
- **200:** `{ "required_employees": 45, "skills_gap": [...], "estimated_cost": 45000000 }`

---

## 15. Administration & Reports

### GET /admin/organizations
Super Admin list all tenants with `_count` (users/employees/branches) + `companyGroup` + `subscriptions` (plan). Powers `Super Admin → Organizations` tab and onboarding queue (pending = no subscription).

### GET /admin/audit-logs
Append-only, filter by `entity_type, user_id, date`.

### GET /reports/attendance?group_by=department&format=csv
### GET /reports/export/:report_id
Signed download.

### POST /admin/knowledge/transfer
Exit knowledge transfer prompt.

---

## 16. Webhooks & Integrations

### POST /webhooks
- **Body:** `{ "url": "https://hr.example.com/hook", "events": ["attendance.clock_in", "leave.request_approved"], "secret": "..." }`

### POST /integrations/biometric/sync
Sync from ZKTeco etc via API key. `X-API-Key` header.

### GET /integrations/status

---

## 17. Status Codes Summary

| Code | Use |
|------|-----|
| 200 | Success |
| 201 | Created (clock-in, employee, leave request) |
| 400 | Validation error |
| 401 | Unauthorized (JWT invalid) |
| 403 | Forbidden (RBAC, device not authorized, outside geofence) |
| 404 | Not found |
| 409 | Conflict (duplicate clock-in) |
| 429 | Rate limited |
| 500 | Internal error |

---

## 18. OpenAPI

Full `openapi.yaml` to be generated at `/docs/openapi.yaml` with `swagger-ui` at `/api/docs`. Auto-generated from NestJS decorators (`@ApiOperation`, `@ApiResponse`).

