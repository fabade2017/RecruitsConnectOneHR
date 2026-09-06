# RecruitConnect OneHR™ - Phased Roadmap
**Version:** 1.0 | **Date:** 2026-08-31 | **Total Estimate:** 12-14 months to Full Intelligence

---

## Phase 1: Foundation (MVP) - Months 1-4
**Goal:** Sellable HRIS for 1-2 industries, NDPA compliant.

| Module | Deliverables | Acceptance |
|--------|--------------|------------|
| People + Digital ID | Employee CRUD, ID `RC-000245`, QR, photo, hierarchy, bulk import CSV | ID unique per org, QR scannable |
| Auth & RBAC | JWT, roles (org_admin/hr_admin/manager/employee), RLS | RLS tested cross-org |
| Org Config Engine | Workdays, grace, overtime rules, industry template selector (Banking + Tech starter) | Config drives attendance calc |
| Attendance Core | Clock In/Out, Break, Work Session calc (Net=Gross-Break), Standard/QR/Web/Mobile | Net calc 100% accurate |
| Shifts | Fixed/Flexible, Rosters, Overnight | Roster assignment bulk |
| Leave | Types, balances, request → manager approval → calendar, workflow | Balance auto-deduct |
| Documents/Assets | Upload, expiry tracking, completeness score | Signed URL expiry |
| Dashboards v1 | Employee Home, Manager Today, HR Command Center (counts only) | Loads <2s @1k employees |
| Reporting v1 | Employee/Department attendance CSV | Export with filters |
| Mobile v1 | React Native clock-in (device fingerprint, offline queue) | Offline sync works |

**Exit Criteria:** Pilot with 1 real org (100-500 employees), payroll net hours validated.

---

## Phase 2: Operations & Visibility - Months 5-7
**Goal:** Differentiator: Activity & Exceptions.

| Module | Deliverables |
|--------|--------------|
| Workforce Activity Engine | 17 event types, Activity Timeline per day |
| Interaction Analytics (supporting) | Login sessions, workflow actions, tasks, no auto score |
| Exception Center | 7 exception types, bulk resolve, audit |
| Fraud Detection (Flag) | Proxy, impossible travel, device sharing → Requires Review |
| Flexible/Split/Rotational/Field Shifts | All 7 shift types, timezone-aware |
| Multi-Work Model | 14 arrangements per employee |
| Live Map | Permission-controlled, geofence validation |
| Workload: Enhanced Command Centers | Workforce Map, Executive snapshot, attendance verification score |
| Workflow Builder v1 | Trigger→Condition→Approver→Action→Notification (no-code UI) |
| Smart Notifications | Email, Push, In-app, SMS |

**Exit Criteria:** Exception resolution <24h, fraud flag accuracy >95% (manual review sample).

---

## Phase 3: Performance & Talent - Months 8-10
**Goal:** Connect People→Work→Performance.

| Module | Deliverables |
|--------|--------------|
| Projects/Tasks | Projects, tasks, Kanban, People→Time→Tasks link |
| Workload Monitor | Balanced/High/Critical + factors |
| Performance/KPI | Cycles, check-ins, appraisals, Overall Indicator |
| Learning | Training modules, completion tracking, compliance |
| Disciplinary | Warnings, queries, history |
| HR Document Generator | 14 letter templates, configurable, e-sign |
| Talent Marketplace | Internal jobs, projects, mentor, eligibility auto-check |
| Internal Job Market | Vacancy → apply → eligibility |
| Digital Passport | Career Passport™ PDF, share controls |
| Knowledge Vault + Life Events | SOPs, FAQs, auto birthday/anniversary tasks |
| Industry Templates (expand) | School, Hospital, Manufacturing, Retail, NGO |

---

## Phase 4: Intelligence & AI - Months 11-14
**Goal:** Workforce Intelligence moat.

| Module | Deliverables |
|--------|--------------|
| Workforce Score | 6 health scores + HR Health 89/100 |
| HR Risk Engine + Early Warning | Expired certs, overdue reviews, Elevated indicator |
| Face Snapshot Attendance | Optional snapshot, confidence, Evidence Log, retention 30/90/365, consent, access audit |
| Mobile Security++ | Face verification, GPS, behavior detection → Verification Score |
| Policy Intelligence + Knowledge RAG | Upload handbook → ask natural language → cited answers |
| AI HR Copilot | 5 modes (HR/Manager/Executive/Recruiter/Employee), permission-scoped |
| Org Digital Twin | Simulate branches: employees, skills, cost |
| HR Decision Simulator | Salary +10%, 20 leave, 50 remote scenarios |
| Workforce Intelligence Engine™ | Cross-module Insights/Risks/Recommendations/Forecasts dashboard |
| Integrations | Biometric API (ZKTeco), Payroll, WhatsApp, SSO |

**Exit Criteria:** Copilot answers from policies only (no hallucination), Twin estimates within 15% of actuals (validated retro).

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Facial vendor lock-in | Abstract `FaceVerificationProvider` interface, support AWS Rekognition + on-device |
| GPS battery/privacy pushback | Opt-in only, fallback standard clock, clear consent UX |
| Payroll complexity | Phase 1 integrate (SeamlessHR) vs build; decide at stakeholder review |
| Data residency (NDPA) | Host in Nigeria or EU-West-1 with DPA; document in PRD Q7 |

---

## Team Estimate (MVP)

- 1 PM, 1 Design, 2 Backend, 2 Frontend, 1 Mobile, 1 QA, 0.5 DevOps.
- After MVP, add 1 AI/ML + 1 Data for Phase 4.

---

## Patch Log 2026-09-06 — Leave Complete & ChatBot Fix (Audited)

**Leave full lifecycle** `apps/api/src/modules/leave/leave.service.ts:13-116`, `leave.controller.ts:13-16`, `apps/web/app/(dashboard)/leave/page.tsx:30-156`: Added `GET :id`, `PATCH :id` (edit pending, owner/hr/manager-of-owner, recalculates days), `PATCH :id/cancel` (pending|approved→cancelled), `DELETE :id` (hard delete pending only, wrong entry), `include:{leaveType,employee}`. UI: Edit modal (Pencil), Cancel (Ban), Delete (Trash2), Approve/Check, Reject/X gated by status, toasts. See `docs/API_SPEC.md §7`, `docs/MANUAL.md §5`.

**ChatBot contrast** `apps/web/components/CsWidget.tsx:131-305,554-555`: Fixed white-on-white invisible bot text (local light vs remote dark CSS clash). Forced `!important` light pairs, disabled remote `cssHref` injection, purge stale `link[data-cs-widget-css]`. See `docs/MANUAL.md §5a`.

**Module audit 2026-09-06** — all `apps/api/src/modules/*` checked vs Leave gold standard: complete: departments/branches/documents/engagement/learning/jobs/notifications. Gaps: payroll missing DELETE/GET :id/cancel, shifts missing roster PATCH/DELETE, employees missing DELETE, performance/projects/talent/workflows/compliance/integrations missing edit/delete/RBAC hardening (see audit). No regressions.

## Immediate Decisions Needed (Blocking Phase 1)

1. Industry template to build first (Banking vs Tech vs School)?
2. Payroll native vs integration?
3. Biometric device models in scope?
4. Face provider?
5. Hosting region?
6. Snapshot retention default?

Proceed to scaffold after sign-off.

