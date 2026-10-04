# OneHR — Production Deploy Guide (MVP)

**Stack:** NestJS API (3001) + Next.js Web (3000/3002) + MySQL 8 + Redis (optional) — all hardened for HR RBAC.

## 1. Quick Deploy (Docker)

```bash
# 1. Clone & configure
git clone <repo> && cd ProjectA
cp .env.production.example .env.production
# edit .env.production — set MYSQL_PASSWORD, JWT_SECRET (32+ chars)

# 2. Build & run
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 3. Migrate & seed (first time)
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy --schema=./prisma/schema.prisma
docker compose -f docker-compose.prod.yml exec api node apps/api/dist/prisma/seed.js
# Or via tsx: docker exec -e DATABASE_URL="..." onehr-api-prod npx tsx apps/api/src/prisma/seed.ts

# 4. Verify
curl https://api.recruitconnect.ng/v1/health
curl http://localhost:3001/v1/health # if local
```

## 2. Manual (local MySQL — current dev)

```bash
pnpm install --registry https://registry.npmmirror.com
DATABASE_URL="mysql://onehr:onehr@localhost:3306/onehr" pnpm --filter onehr-api exec prisma db push --schema=./prisma/schema.prisma
DATABASE_URL="..." pnpm --filter onehr-api exec tsx apps/api/src/prisma/seed.ts
pnpm --filter onehr-api exec tsc -p apps/api/tsconfig.json
DATABASE_URL="..." JWT_SECRET="..." node apps/api/dist/main.js &
cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:3001/v1 pnpm dev -p 3002
```

## 3. RBAC — MVP Roles for HR

| Role | Login | Can Do (MVP) |
|------|-------|--------------|
| `org_admin` | admin@recruitconnect.ng / Admin@123 (seed) | Full — create org config, all HR, payroll, jobs, compliance |
| `hr_admin` | create via POST /v1/employees + POST /v1/users | Manage people, attendance, leave, payroll, shifts, docs |
| `manager` | employee with managerId = their id | View team (attendance, leave approvals, payroll team), approve leave `PATCH /v1/leave/requests/:id/approve` |
| `employee` | self | Clock `POST /v1/attendance/clock-in`, request leave, view own payslip `GET /v1/payroll/:id/payslip`, enroll `POST /v1/learning/enroll` (only self) |
| `recruiter` | — | Manage `POST /v1/jobs`, view applications |
| `executive` / `auditor` | — | Read `GET /v1/organizations/:id/health-score`, `GET /v1/compliance/policies`, `GET /v1/attendance/command-center` |

**Guards:** `JwtAuthGuard` (`apps/api/src/common/guards/jwt-auth.guard.ts:1`) — 15m JWT + refresh 7d, tenant `org_id` taken **only from the signed token** (the `X-Organization-Id` header is ignored for tenant resolution); `RbacGuard` (`rbac.guard.ts:1`) — matrix `ROLE_PERMISSIONS`, `@Roles`/`@RequirePermissions` per controller. Service scoping: employee → `where.id = ownId`, manager → `where.id in [ownId, teamIds]`, payroll/leave/bank all scoped similarly.

**Tenant isolation (`TENANT_GUARD=on`, default):** as defence in depth on top of the per-service `where` filters, `PrismaService` installs a Prisma query extension (`apps/api/src/prisma/prisma.service.ts`) that forces `organizationId` into every `find*`/`count`/`aggregate`/`groupBy`/`update*`/`delete*`/`upsert`/`create*` call for the 40 tenant-scoped models. `TenantInterceptor` binds the authenticated org to the request via `AsyncLocalStorage`; `super_admin` and non-request callers (seeds, cron) are intentionally unscoped. Regression test: `apps/api/scripts/tenant-check.ts`.

**Not covered by the extension:** nested `include`/`select` relation reads and raw SQL (`$queryRaw`/`$executeRawUnsafe`). Keep explicit `organizationId` filters in services. MySQL has no row-level security, so tenant isolation here depends entirely on this application-level enforcement — there is no database-layer backstop as there was with Postgres RLS.

## 3.1 MySQL notes (port from Postgres)

- **Case-insensitive search:** Postgres needed `mode: 'insensitive'` for case-insensitive `contains`. MySQL's default `utf8mb4_unicode_ci` collation is already case-insensitive, so those filters were removed (19 call sites across 12 services). Do not reintroduce `mode` — Prisma rejects it on MySQL. If you ever set a `_bin`/`_cs` collation, search behaviour silently becomes case-sensitive.
- **String length:** plain `String` maps to `VARCHAR(191)` (utf8mb4 index-key limit), not unlimited text. Long-form fields that Postgres held as unbounded `TEXT` are `LONGTEXT` (e.g. `Message.content`).
- **Unique keys are case-insensitive** under this collation (e.g. `permissions.key`, `employees.employee_code`), where Postgres treated them as case-sensitive.
- **No `Json`/`Bytes`/native enums** are used, so nothing was lost in the port. Decimal money columns keep explicit `@db.Decimal(12,2)`.
- Prisma provider is `mysql`. The Postgres schema and migration are archived at `prisma/schema.prisma.postgres.bak` and `prisma/migrations_postgres_backup/`.

**Test RBAC:**
```bash
# HR creates employee (hr_admin token)
curl -X POST http://localhost:3001/v1/employees -H "Authorization: Bearer $HR_TOKEN" -d '{"job_title":"Manager","grade":"M2"}'

# Employee tries to list all employees → only self
curl http://localhost:3001/v1/employees -H "Authorization: Bearer $EMP_TOKEN" # → [self]

# Manager tries to approve non-team leave → 403
curl -X PATCH http://localhost:3001/v1/leave/requests/:id/approve -H "Authorization: Bearer $MGR_TOKEN" # → 403 if not team

# Employee tries to create payroll → 403
curl -X POST http://localhost:3001/v1/payroll -H "Authorization: Bearer $EMP_TOKEN" -d '{...}' # → 403 Missing permission payroll:*
```

## 4. Production Hardening Done

- **Auth:** bcryptjs, JWT 15m/7d, `employeeId` in token, `GET /v1/auth/me`, device fingerprint `POST /v1/auth/device/register`
- **RBAC:** 9 roles, permission matrix, method-level decorators, service row-level scoping (employee self, manager team)
- **API:** `helmet`-like headers, `trust proxy`, CORS allowlist, rate-limit 100/min (429), `ValidationPipe` whitelist, `health`/`ready` probes, graceful shutdown, Swagger disabled in prod (enable `ENABLE_SWAGGER=true`)
- **DB:** `prisma db push` (use `migrate deploy` in prod), tenant scoping via `organizationId` (Prisma query extension — see §3), 1054-line schema (MySQL 8, varchar/uuid text PKs, utf8mb4), merged OneHRCon models (Payroll, Jobs, Learning, Engagement, Compliance, BankDetail)
- **Frontend:** `apps/web` RBAC middleware todo — add `middleware.ts` to check `onehr_auth` cookie (see OneHRCon `src/lib/auth.ts`), role-based nav (HR sees Command Center, Employee sees clock-in)
- **Docker:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `docker-compose.prod.yml` with healthchecks, restart unless-stopped, `.env.production.example`

## 5. HR MVP Checklist (Day 1 usable)

- [x] Create org + branch + dept
- [x] Create employees with auto `RC-000001` + QR (`apps/api/src/modules/employees/employees.service.ts:13`)
- [x] Attendance: clock-in/out/break, `WorkSession` net calc, `command-center`, `exceptions`
- [x] Shifts/rosters, Leave (request/approve/balances)
- [x] Payroll + BankDetail + Payslip `GET /v1/payroll/:id/payslip` (jsPDF `apps/web/components/merged/PayslipPDF.tsx`)
- [x] Recruitment: Jobs + Applications
- [x] Learning + Engagement + Compliance
- [ ] Frontend RBAC nav (next step) + HR policy upload + email/SMS templates

## 6. Operational

- Logs: `docker logs onehr-api-prod`, Metrics: `GET /v1/health`
- Backups: `mysqldump` via cron, S3 snapshots
- Secrets: never commit `.env.production`, rotate `JWT_SECRET` via `pnpm --filter onehr-api exec tsx apps/api/src/scripts/rotate-jwt.ts` (to be added)

See `docs/RBAC.md`, `docs/ARCHITECTURE.md`, `docs/PRD.md:8` for open decisions (payroll native vs SeamlessHR, biometric vendor).

## 7. Hosting Requirements

This app needs **two long-running Node 20 processes** (NestJS API on 3001, Next.js on 3000) plus MySQL and Redis. That rules out most shared cPanel hosting, where FTP + cPanel are the only interfaces and there is no shell to keep processes alive.

**Does not work:** classic shared cPanel/FTP hosts. Uploading the source to `public_html` does nothing — Apache serves those files as static content, it does not run them. The Next.js frontend also cannot be statically exported as configured: `apps/web/next.config.js` defines `rewrites()`, which `output: 'export'` does not support, and the `/api/*` + `/cs/*` proxying depends on a live Next server.

**Works:** a VPS with SSH + Docker (`docker compose -f docker-compose.prod.yml up -d`), or a cPanel plan that includes **Setup Node.js App** (CloudLinux + Passenger), which can host the API and web app as two separate Node apps. Check for that feature before buying a shared plan.

Any of these needs MySQL 8 (or MariaDB 10.6+) — the schema is now MySQL-native.
