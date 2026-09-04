# RecruitConnect OneHR™ - RBAC & Permissions
**Version:** 1.0 | **Date:** 2026-08-31

---

## 1. Roles

| Role | Scope | Description |
|------|-------|-------------|
| `super_admin` | Global | RecruitConnect platform admin, cross-org (no org data unless assigned) |
| `org_admin` | Organization | Full org config, user management, retention, integrations |
| `hr_admin` | Organization | People, attendance, leave, docs, workflows, reports (no org config) |
| `hr_manager` | Org / Branch | Same as hr_admin but scoped to branch/department if assigned |
| `manager` | Team | Team dashboards, approvals, workload, performance for subordinates only |
| `employee` | Self | Own profile, clock, leave, docs, tasks, payslip |
| `recruiter` | Org | Vacancies, marketplace, candidate search |
| `executive` | Org | Read-only Executive Command Center + health scores (no edit) |
| `auditor` | Org | Read-only audit logs, reports |

---

## 2. Permission Matrix (Key)

| Resource | org_admin | hr_admin | manager | employee | executive |
|----------|-----------|----------|---------|----------|-----------|
| Org config | RW | R | R | R | R |
| Employee CRUD | RW | RW | R (team) | R (self) | R |
| Employee Passport | RW | RW | R (team) | RW (self+share control) | R |
| Clock In/Out | - | RW (on behalf) | RW | RW (self) | - |
| Attendance Events | RW | RW | R (team) | R (self) | R (aggregated) |
| Exception Center | RW | RW | R (team) | - | R |
| Live Map | RW | RW | R (team) | - | R (if permitted) |
| Shifts/Rosters | RW | RW | R | R | - |
| Leave (approve) | RW | RW | RW (team) | R (own) | - |
| Tasks/Projects | RW | RW | RW (team) | RW (assigned) | R |
| Performance Reviews | RW | RW | RW (team) | R (own) | R |
| Documents (sensitive) | RW | RW | R (team) | R (own) | - |
| Policy Upload | RW | RW | - | - | - |
| AI Copilot HR Mode | RW | RW | - | - | - |
| AI Copilot Manager Mode | - | - | RW | - | - |
| Workflows Builder | RW | RW | - | - | - |
| Audit Logs | RW | R | - | - | R |
| Reports (exec) | RW | RW | R (team) | - | RW |

`R`=Read, `W`=Write, `-`=No access. All enforced via `RbacGuard` + row-level `WHERE organization_id = :org AND (manager_id = :user OR role IN ('hr_admin','org_admin'))`.

---

## 3. Location & Snapshot Permissions

- `view_live_location` - Separate permission, only `hr_admin`/`org_admin` + `manager` if explicitly granted + employee `consent_gps=true`.
- `view_face_snapshot` - Only `hr_admin`/`org_admin`, audit-logged on every view, retention enforced.
- `export_reports` - Only `hr_admin`/`org_admin`/`executive`.

---

## 4. Implementation

```typescript
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('attendance:read', 'attendance:exception:resolve')
@Get('attendance/exceptions')
getExceptions(@CurrentUser() user: JwtPayload) { ... }

// RbacGuard checks:
// 1. user.role has permission via matrix
// 2. If manager, auto-injects filter: WHERE manager_id = user.employee_id
// 3. If employee, auto-injects WHERE employee_id = user.employee_id
```

Tenant isolation via RLS is defense-in-depth; RBAC is application-level.

---

## 5. Consent

| Consent | Captured At | Stored In | Affects |
|---------|-------------|-----------|---------|
| `consent_face` | Onboarding + re-consent on policy change | `employees.consent_face`, `consent_logs` | Face profile, snapshot capture |
| `consent_gps` | Mobile app permission + org policy ack | `employees.consent_gps` | Location storage, Live Map |
| `policy_ack` | Handbook upload | `policy_acknowledgements` | AI answers |

Without consent, fallback to `standard` clocking (no face/GPS).

