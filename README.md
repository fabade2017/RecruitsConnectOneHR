# RecruitConnect OneHR™
**One Platform. Complete Workforce Intelligence.**

> Intelligent Workforce Operating System — not just HRIS. Answers "What is happening across your workforce right now?" — **PostgreSQL** (`onehr` / Supabase).

**Docs:** `docs/PRD.md` | `docs/ERD.md` | `docs/API_SPEC.md` | `docs/ARCHITECTURE.md` | `docs/RBAC.md` | `docs/ROADMAP.md` | `docs/MANUAL.md` | **`docs/HELP.md` (Help Center story)** → also in-app **Sidebar → HELP → Help • Docs (/help)** (collapsed by default)

## Quick Start (PostgreSQL)

```bash
# 1. PostgreSQL running locally (Docker) or Supabase
# docker run -d --name onehr-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=onehr -p 5432:5432 postgres:16

# 2. Env
cp .env.example .env
# Set DATABASE_URL (+ DIRECT_URL if using Supabase pgbouncer)
# Generate secrets (required in production — API fails fast if missing/placeholder):
#   export JWT_SECRET=$(openssl rand -hex 32)
#   export JWT_REFRESH_SECRET=$(openssl rand -hex 32)
cp apps/api/.env.example apps/api/.env 2>/dev/null || true

# 3. Migrate & seed
npx prisma migrate dev --schema=./prisma/schema.prisma
npx prisma generate --schema=./prisma/schema.prisma
./apps/api/node_modules/.bin/tsx apps/api/src/prisma/seed.ts        # RC org + admin
./apps/api/node_modules/.bin/tsx apps/api/src/prisma/enterprise_seed.ts # superadmin, plans, RBAC
./apps/api/node_modules/.bin/tsx apps/api/src/prisma/rbac_seed.ts   # hr/manager/employee users

# 4. Run
npm run build --workspace=apps/api && node apps/api/dist/main.js # API http://localhost:3001/v1/health
npm run dev --workspace=apps/web                                  # Web http://localhost:3000

# Or concurrently
npm run dev
```

Demo logins (local seed only — **change before any public deploy**): `admin@recruitconnect.ng/Admin@123` (org_admin, RC), `superadmin@recruitconnect.ng/Super@123` (super_admin), `hr@, manager@, employee@ / Test@123`.

## Production environment (Render + static web)

Set on the API host (Render):

| Var | Notes |
|-----|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Postgres connection (Supabase pooler OK) |
| `DIRECT_URL` | Direct Postgres URL (bypasses pgbouncer for migrations) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | `openssl rand -hex 32` each — **API refuses to start** if missing/placeholder |
| `CORS_ORIGIN` | e.g. `https://www.rconehr.com,https://rconehr.com` — required for browser clients |
| `ENABLE_SWAGGER` | leave `false` in production |

## Implementation Phases (Current)

- **Phase 1 (MVP, M1-4) DONE:** People, Attendance (face motion + liveness), Shifts, Leave, Command Centers
- **Phase 2 (M5-7) DONE:** Activity Engine, Exceptions, Fraud flags, Live Map, Workflows
- **Phase 3 (M8-10) DONE:** Projects, Performance, Talent Marketplace, Passport, Documents/Assets
- **Phase 4 (M11-14) DONE:** Workforce Intelligence, Copilot (RAG), Digital Twin, Face Verification
- **Hardening 2026-10-19 DONE:** JWT fail-fast secrets, refresh-token secret mismatch fix, RBAC permission matching tightened, server-side permission re-resolve, CORS fail-closed in prod, Swagger gated, tenant header spoof guard, HttpOnly cookie optional auth

See `docs/ROADMAP.md` for details.

## Key Design Principles

- Activity is supporting info, never auto productivity score.
- Face/GPS are **optional + consent + retention-controlled** with motion liveness.
- Fraud is **flagged for review**, never auto-accused.
- Multi-tenant via **PostgreSQL** `organization_id` scoping (JWT-derived; client header cannot override for non-super_admin).

## Tests

```bash
npm run test:unit --workspace=apps/api
```
