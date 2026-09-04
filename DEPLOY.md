# OneHR — Production Deploy Guide (MVP)

**Stack:** NestJS API (3001) + Next.js Web (3000/3002) + Postgres 15 + Redis (optional) — all hardened for HR RBAC.

## 1. Quick Deploy (Docker)

```bash
# 1. Clone & configure
git clone <repo> && cd ProjectA
cp .env.production.example .env.production
# edit .env.production — set POSTGRES_PASSWORD, JWT_SECRET (32+ chars)

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

## 2. Manual (Homebrew Postgres — current dev)

```bash
pnpm install --registry https://registry.npmmirror.com
DATABASE_URL="postgresql://onehr:onehr@localhost:5432/onehr" pnpm --filter onehr-api exec prisma db push --schema=./prisma/schema.prisma
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

**Guards:** `JwtAuthGuard` (`apps/api/src/common/guards/jwt-auth.guard.ts:1`) — 15m JWT + refresh 7d, tenant `org_id` from token; `RbacGuard` (`rbac.guard.ts:1`) — matrix `ROLE_PERMISSIONS`, `@Roles`/`@RequirePermissions` per controller. Service scoping: employee → `where.id = ownId`, manager → `where.id in [ownId, teamIds]`, payroll/leave/bank all scoped similarly.

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
- **DB:** `prisma db push` (use `migrate deploy` in prod), `pg` RLS via `organizationId`, 1054-line schema (Postgres, uuid), merged OneHRCon models (Payroll, Jobs, Learning, Engagement, Compliance, BankDetail)
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
- Backups: `pg_dump` via cron, S3 snapshots
- Secrets: never commit `.env.production`, rotate `JWT_SECRET` via `pnpm --filter onehr-api exec tsx apps/api/src/scripts/rotate-jwt.ts` (to be added)

See `docs/RBAC.md`, `docs/ARCHITECTURE.md`, `docs/PRD.md:8` for open decisions (payroll native vs SeamlessHR, biometric vendor).
