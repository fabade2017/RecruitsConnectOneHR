# RecruitConnect OneHR™ - System Architecture
**Version:** 1.0 | **Date:** 2026-08-31 | **Pattern:** Modular Monolith → Microservices (when >10k DAU)

---

## 1. Overview

OneHR is multi-tenant SaaS. Start as modular monolith (NestJS + PostgreSQL + Redis) for speed/cost, extract services (Attendance, AI) when scale demands. Event-driven via BullMQ + Postgres LISTEN/NOTIFY for Automation Engine.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  Web (Next.js) | Mobile (React Native) | Biometric Devices (API) │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────▼──────────────────────────────────────┐
│                     API GATEWAY (NestJS)                         │
│  Auth (JWT) | RBAC | RateLimit | Idempotency | Audit Middleware │
│  Validation (Zod/class-validator) | Tenant Resolver              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   CORE DOMAIN MODULES                            │
│  People | Attendance | Shifts | Leave | Payroll | Projects       │
│  Performance | Documents | Assets | Talent | Policies            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Events (BullMQ)
┌──────────────────────────▼──────────────────────────────────────┐
│                 PLATFORM SERVICES                                │
│  Workflow/Automation Engine | Notification Engine | Analytics    │
│  Workforce Intelligence Engine | AI Copilot (RAG) | Scheduler  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   INFRASTRUCTURE                                 │
│  PostgreSQL (RLS, PostGIS, pgvector, partitioning)              │
│  Redis (cache, sessions, queues) | S3 (snapshots/docs)          │
│  Meilisearch (employee search) | Cron (pg_cron)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Tenancy & Data Isolation

- **Strategy:** Shared DB, shared schema, `organization_id` column + Row Level Security.
- **RLS Example:**
```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON employees
  USING (organization_id = current_setting('app.org_id')::uuid);
```
- **Middleware:** On each request, `SET LOCAL app.org_id = '<jwt.org_id>'` after JWT verify.
- **Subdomain Routing:** `acme.onehr.ng` → resolves to `organization_id` via lookup cache (Redis).
- **Super Admin:** Bypasses RLS via `BYPASSRLS` role for cross-org analytics (Executive Command Center aggregated if permitted).

---

## 3. Module Boundaries (NestJS)

```
src/
├── modules/
│   ├── auth/           (JWT, MFA, device registration)
│   ├── organizations/  (config engine, health score)
│   ├── employees/      (CRUD, passport, timeline)
│   ├── attendance/     (clock, sessions, events, exceptions, fraud detection)
│   ├── shifts/         (shifts, rosters)
│   ├── leave/          (types, requests, balances, workflow integration — full CRUD: list/getOne/create/update/cancel/delete/approve, RBAC isOwner/isManagerOf, include:leaveType — patched 2026-09-06)
│   ├── projects/       (projects, tasks, workload)
│   ├── performance/    (reviews, kpis)
│   ├── documents/      (upload, signed URLs)
│   ├── workflows/      (builder, instances, approvals)
│   ├── notifications/  (multi-channel)
│   ├── talent/         (vacancies, marketplace)
│   ├── policies/       (upload, embeddings, RAG)
│   ├── ai/             (copilot, simulator, digital twin)
│   └── analytics/      (scores, risks, activity)
├── common/
│   ├── guards/ (JwtAuthGuard, RbacGuard)
│   ├── interceptors/ (AuditLogInterceptor, TenantInterceptor)
│   ├── pipes/ (ValidationPipe)
│   └── decorators/ (@CurrentUser, @OrgId)
├── queues/ (BullMQ processors)
└── prisma/schema.prisma
```

Each module owns its tables, exposes service interface, communicates via events, not direct DB joins across modules where possible.

---

## 4. Event-Driven Automation Engine

**Core Loop:** Event → Condition → Action → Notification → Escalation

```typescript
// Event emitted on domain action
eventBus.emit('employee.probation_due', { employeeId, orgId, date });

// Workflow engine evaluates
// workflow.condition = { field: 'tenure_days', op: '>=', value: 90 }
// workflow.steps = [
//   { type: 'create_task', assignee: 'manager', title: 'Probation Review' },
//   { type: 'notify', channel: 'email', to: 'manager' },
//   { type: 'schedule', after: '7d', action: 'escalate_if_overdue' }
// ]
```

**Implementation:** BullMQ jobs with delayed execution, retry, DLQ. `pg_cron` for nightly scans (probation, cert expiry).

**Workflow Builder Storage:** `workflows` table with JSONB `trigger, condition, steps, escalation`. UI is drag-drop: Trigger→Condition→Approver→Action→Notification→Escalation.

---

## 5. Attendance Pipeline (Critical Path)

1. **Clock Request** → Validate: device registered? geofence? face required? grace?
2. **Fraud Checks (Sync):** Duplicate clock? Device sharing? (Redis lookup last 5 events)
3. **Async Fraud (BullMQ):** Impossible travel: `distance(prev_location, curr)/time_delta > 500km/h` → flag exception. Duplicate face: compare embeddings if facial enabled.
4. **Write:** Insert `attendance_events`, upsert `work_sessions` (compute gross/net/overtime).
5. **Side Effects:** Emit `attendance.clock_in` → update Command Center cache (Redis), push via WebSocket to dashboards, queue notification "You have not clocked out" if missing at 18:00.

**Performance:** Clock endpoint <500ms p95. Use Redis for session cache, DB write async where possible but return verification_score synchronously for mandatory methods.

---

## 6. Security & Privacy

| Concern | Solution |
|---------|----------|
| **Auth** | JWT access 15m + refresh 7d via httpOnly cookie, Argon2, MFA TOTP |
| **RBAC** | Guard checks `user.role` + `employee.manager_id` for team scoping |
| **Audit** | Every PATCH/POST/DELETE logs to `audit_logs` (immutable, 7yr retention) |
| **Encryption** | TLS 1.3, AES-256 at rest (RDS), S3 SSE, face_profile_ref encrypted with KMS |
| **NDPA** | Consent table (`consent_face, consent_gps, version, timestamp, ip`), snapshot retention job deletes S3 + DB ref, right to erasure → soft delete + anonymize |
| **Device Fingerprint** | Hashed with org salt, not raw ID |
| **Location** | Only stored if org policy `require_gps=true` AND employee `consent_gps=true`; Live Map only shows aggregated counts unless `view_live_location` permission |

---

## 7. AI & RAG Architecture

```
Policy PDF → S3 → Text Extraction (pdf-parse) → Chunk (500 tokens, overlap 50)
→ Embed (text-embedding-3-small) → pgvector (policies.embeddings)
→ Query: User question → Embed → Cosine similarity >0.78 → Top 5 chunks
→ LLM (GPT-4o / local) with system prompt: "Answer only from provided policy chunks, cite page"
→ RBAC filter: only policies for user's org
```

**Copilot Modes:** System prompt varies per `mode` (hr/manager/etc) + row-level filters (manager sees team only via SQL `WHERE manager_id = :user.employee_id`).

**Simulator/Digital Twin:** Deterministic calculators (not LLM): salary +10% = sum(compensation)*0.1; capacity planning uses ratio `employees_per_branch` from org config.

---

## 8. Scalability & Performance

- **DB:** Partition `attendance_events` monthly, BRIN index on timestamp, read replica for reports.
- **Cache:** Redis for Command Center aggregates (TTL 30s), employee profile (5m), org config (1h).
- **CDN:** CloudFront for Next.js static, S3 snapshots via signed URLs.
- **WebSockets:** Socket.io for live Command Center (publish on attendance event).
- **Horizontal:** Stateless API (JWT), scale via ECS/K8s, BullMQ workers separate.
- **Mobile Offline:** SQLite queue, sync on reconnect with `Idempotency-Key`.

---

## 9. Integrations

| System | Protocol | Auth |
|--------|----------|------|
| Biometric (ZKTeco, Suprema) | REST / Push | API Key + IP allowlist |
| Payroll (SeamlessHR) | REST webhook | OAuth2 |
| WhatsApp (Twilio / Termii) | REST | API Key |
| Email (SES) | SMTP/REST | IAM |
| SMS (Termii) | REST | API Key |
| SSO (Azure AD) | SAML/OIDC | OIDC |

---

## 10. Observability

- **Logging:** Pino JSON → CloudWatch
- **Metrics:** Prometheus + Grafana (request latency, queue depth, fraud flag rate)
- **Tracing:** OpenTelemetry
- **Alerting:** PagerDuty on exception queue >100 or clock latency >1s
- **Audit Dashboard:** For HR to see who changed what.

---

## 11. Deployment

- **Environments:** dev, staging, prod (Nigeria region: AWS `eu-west-1` or local provider for data residency).
- **CI/CD:** GitHub Actions → Docker build → ECR → ECS Fargate + RDS + ElastiCache + S3.
- **Migrations:** Prisma Migrate, zero-downtime with `ALTER TYPE ... ADD VALUE` (no enum removal in prod).
- **Backup:** RDS daily snapshot, S3 versioning, PITR 7 days.

---

## 12. Tech Decisions (ADR)

1. **Modular Monolith first** - Faster MVP, lower ops cost; extract Attendance service at 20k concurrent clocks.
2. **PostgreSQL over Mongo** - Strong relational + PostGIS + pgvector + RLS + partitioning covers 95% needs.
3. **BullMQ over SQS** - Delayed jobs needed for escalation; easier local dev.
4. **Next.js App Router** - SSR for dashboards, SEO for marketing, same TS stack.

