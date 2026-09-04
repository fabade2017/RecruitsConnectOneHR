const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const out = path.resolve(__dirname, '../public/manual.pdf');
const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'RecruitConnect OneHR Manual', Author: 'RecruitConnect', Subject: 'Workforce Intelligence' } });
doc.pipe(fs.createWriteStream(out));

// Colors
const primary = '#0F172A';
const accent = '#7C3AED';
const muted = '#64748B';

// Cover
doc.rect(0,0,595,842).fill(primary);
doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('RecruitConnect', 50, 140);
doc.fillColor('#38BDF8').fontSize(34).text('OneHR™', 50, 175);
doc.fillColor('white').fontSize(14).font('Helvetica').text('One Platform. Complete Workforce Intelligence.', 50, 220);
doc.fillColor('white').fontSize(10).text('Intelligent Workforce Operating System — not just HRIS', 50, 245);
doc.fillColor('#94A3B8').fontSize(9).text('Version 1.0 • 2026-09-02 • MSSQL onehr_v2 • RBAC hardened • 44 modules', 50, 280);
doc.fillColor('white').fontSize(8).text('Docs: PRD • ERD • API_SPEC • ARCHITECTURE • RBAC • ROADMAP • MANUAL', 50, 780);
doc.fillColor('#38BDF8').fontSize(8).text('RecruitConnect Nigeria Ltd • Victoria Island, Lagos • hello@recruitconnect.ng', 50, 795);

// TOC
doc.addPage();
doc.fillColor(primary).fontSize(18).font('Helvetica-Bold').text('Table of Contents', 50, 50);
const toc = [
  '1. Executive Summary & Four Pillars',
  '2. Product Principles (Activity, Privacy, Fraud)',
  '3. User Roles & RBAC Matrix',
  '4. Workforce Model (6 Layers)',
  '5. Core Modules & Features (44 modules)',
  '6. Smart Attendance & Face Verification',
  '7. Shifts, Leave, Payroll, Recruitment',
  '8. Command Centers (HR, Manager, Employee, Executive)',
  '9. Workforce Intelligence & AI Copilot',
  '10. Architecture (MSSQL, NestJS, Next.js)',
  '11. API Quick Start & Demo Accounts',
  '12. Operations Manual (Login → Clock-in, Add Employee, Bulk, Face Enroll)',
  '13. Super Admin — Companies & Onboarding',
  '14. Security, Privacy & Compliance',
  '15. Roadmap & Support',
];
doc.fontSize(10).font('Helvetica');
toc.forEach((t,i)=> doc.fillColor(muted).text(t, 50, 85 + i*22, { continued: false }));
doc.fillColor(accent).fontSize(9).text('Tip: All pages linked in left Sidebar → Manual. PDF also at /manual and /public/manual.pdf', 50, 430);

// Helper
function heading(text, y) {
  doc.fillColor(primary).fontSize(13).font('Helvetica-Bold').text(text, 50, y);
  doc.moveTo(50, y+18).lineTo(545, y+18).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
  return y+28;
}
function body(text, y, opts={}) {
  doc.fillColor('#334155').fontSize(9).font('Helvetica').text(text, 50, y, { width: 495, align: 'justify', ...opts });
  return doc.y + 4;
}
function bullet(title, desc, y) {
  doc.fillColor(primary).fontSize(9).font('Helvetica-Bold').text('• ' + title + ': ', 60, y, { continued: true });
  doc.fillColor(muted).font('Helvetica').text(desc, { width: 455 });
  return doc.y + 3;
}

// Page 3: Executive Summary
doc.addPage();
let y = 50;
y = heading('1. Executive Summary', y);
y = body('OneHR answers “What is happening across your workforce right now?” — not just “Who are your employees?”. It merges People, Work, Time, Performance and Prediction into a single operating system. Four pillars guide the product:', y);
['Manage People — hire → alumni, digital identity RC-000245 + QR', 'Manage Work — attendance, shifts (14 arrangements), tasks, rosters', 'Measure — 6 health scores → HR Health 89/100, activity ≠ productivity', 'Predict — AI copilot (RAG), digital twin, simulator (what if salary +10%?)'].forEach(t=> { y = bullet(t.split(' — ')[0], t.split(' — ')[1] || '', y); });
y = body('Target: SMEs, corporates, government, schools, hospitals, banks, retail, manufacturing, NGOs. Industry templates (banking, school, hospital, manufacturing, retail, NGO, tech, generic) tune shifts, compliance and workflows.', y+4);
y = heading('2. Product Principles', y+6);
y = body('Activity ≠ Productivity — portal clicks never auto-score productivity. Supporting info only: login sessions, workflow actions, tasks completed, etc., plus KPI + manager assessment → Overall Indicator.', y);
y = bullet('Optional & Configurable', 'Face/GPS/biometric opt-in per org, consent, 90-day retention, access-controlled.', y);
y = bullet('Flag, Don’t Accuse', 'Fraud → “Requires Review” (device sharing, duplicate face, impossible travel) never auto-accused.', y);
y = bullet('Permission-Scoped AI', 'Copilot answers only from approved policies, RLS per organization_id.', y);

// Page: Roles
doc.addPage();
y = 50;
y = heading('3. User Roles & RBAC', y);
y = body('RBAC is dynamic. Super Admin creates custom roles (e.g., Finance Manager) and assigns permissions per module. Permissions are enforced in API (RbacGuard, RequirePermissions) and filtered in UI (Sidebar + page guards).', y);
y = body('System roles fallback matrix (custom roles override via DB RoleDefinition.permissions JSON):', y);
const roles = [
  ['super_admin', '* (all)'],
  ['org_admin', '* (all within org)'],
  ['hr_admin', 'employee:*, attendance:*, leave:*, shift:*, payroll:*, job:*, learning:*, compliance:*'],
  ['manager', 'employee:read:team, attendance:read:team, leave:approve:team, task:*'],
  ['employee', 'self: read/update self, attendance:clock, leave:request:self, payroll:read'],
  ['recruiter', 'job:*, vacancy:*, employee:read'],
  ['executive', 'report:read, analytics:read'],
];
doc.fontSize(8).fillColor(primary).font('Helvetica-Bold');
let ry = y;
roles.forEach(([r,p])=> {
  doc.fillColor(primary).font('Helvetica-Bold').text(r, 60, ry, { width: 90 });
  doc.fillColor(muted).font('Helvetica').text(p, 155, ry, { width: 390 });
  ry += 14;
});
y = ry + 6;
y = body('Login returns JWT with {sub, role, customRoleId, org_id, permissions}. Sidebar filters NAV by role + permissions (hasPermission). Super Admin → Admin → Roles tab to create/edit, checkbox matrix grouped by module (44 modules).', y);
y = heading('4. Workforce Model (6 Layers)', y+4);
y = body('1 People — Digital Identity, skills, org structure\n2 Work — tasks, projects\n3 Time — sessions (Net = Gross − Breaks), overtime, late\n4 Performance — KPI, appraisals\n5 Engagement — surveys, life events\n6 Intelligence — scores, risks, forecasts', y);

// Page: Modules
doc.addPage();
y = 50;
y = heading('5. Core Modules (44) — What’s Implemented Now', y);
y = body('All 24 dashboards are live (Settings, Projects, Workflows, Compliance, Engagement, Integrations, Documents, Performance, Assets, Shifts, AI Copilot, Onboarding, Leave, Analytics, Reports, Payroll, Recruitment, etc.). Each connects People→Work→Time→Performance.', y);
const mods = ['People (RC-000245, QR, 25+ fields)', 'Attendance (7 methods, face 98%, motion 0.8–12%)', 'Shifts (fixed/flex/rotational/split/24h)', 'Leave (types, balances, workflow)', 'Payroll (OneHRCon merged, simulator)', 'Recruitment (ATS)', 'Documents/Assets', 'Projects/Tasks', 'Performance/KPI', 'Learning', 'Engagement Surveys', 'Compliance Policies', 'Analytics (HealthRadar, BranchBar)', 'Reports (DataGrid slicing/dicing)', 'AI Copilot (RAG)', 'Workflows (Automation)', 'Integrations (webhooks)', 'Departments/Branches (API-driven dropdowns)'];
doc.fontSize(8);
mods.forEach(m=> { y = bullet(m.split(' (')[0], m.split(' (')[1]?.replace(')','') || '', y); if (y>750) { doc.addPage(); y=50; }});

// Smart Attendance
doc.addPage();
y = 50;
y = heading('6. Smart Attendance & Face Verification', y);
y = body('Clock In/Out, Break Start/End → WorkSession (clockInAt, breaks[], clockOutAt, gross/net/overtime, scheduled 480m). VerificationScore 98% for facial liveness. Methods: mobile, web, QR, biometric, facial, NFC, API. Snapshot retention 90 days.', y);
y = bullet('Face Enrollment', 'Employee receives link /face-enroll/:id (or People → Camera icon → Copy link). Captures 3 angles via camera, FaceDetector + motion 0.8–12% → liveness verified. Stored as faceProfileRef JSON (8k truncated) + consentFace.', y);
y = bullet('Clock-in Fraud Checks', 'Device sharing (same fingerprint 7d), duplicate face (same snap 10m), liveness failed (motion out of range), no enrolled face, face mismatch (<60% → critical duplicate_face, <80% → suspicious), no face snapshot. All flagged “Requires Review” in Exception Center.', y);
y = bullet('Manual vs Auto', 'Clock in/out is manual (button + face snap). Clock-out if forgotten: Superadmin determines time via Attendance → Missing Clock-Outs (input time per session or Auto-close today at 17:00). Gross/Net recalculated, exception resolved.', y);

// Shifts etc
y = heading('7. People Bulk, Shifts, Leave, Payroll', y+6);
y = body('Bulk Upload (300+): People → Bulk Upload (Excel) → Download Excel Template with dropdowns (employment_type, work_arrangement, grade, department, branch linked). Hidden Dropdowns sheet + data validation for 300 rows, Instructions sheet. Upload .xlsx → POST /employees/bulk/excel (multipart) or CSV → POST /employees/bulk {csv}. Max 500/batch, 10mb. Auto-creates departments/branches if names not found, creates user Employee@123 if email provided.', y);
y = bullet('People Edit', 'Pencil → modal (jobTitle, grade, department/branch linked via ?branchId, workArrangement, employmentType, status, skills, role). PATCH /employees/:id (RBAC: hr_admin/org_admin or self limited).', y);
y = bullet('Shifts/Rosters', 'GET/POST /shifts, POST /rosters (employee_ids + dates).', y);
y = bullet('Leave', 'GET /leave/types → POST /leave/requests → PATCH /approve|/reject (manager/team). Balances, calendar, notifications.', y);

// Command Centers
doc.addPage();
y = 50;
y = heading('8. Command Centers', y);
y = body('HR Command Center (/hr): Live workforce (Employees 1245, Clocked In 1067, Exceptions 17, Live Map by branch, Attendance Trend). Manager (/manager): My Team Today/Month. Employee (/employee): Home + popup “Ready to clock in?” → Attendance. Executive (/executive): HR Health 89/100, People Mix Donut, Risk, Simulator.', y);
y = heading('9. Workforce Intelligence & AI', y+6);
y = body('Workforce Score: 6 indicators → HR Health. Risk Engine: expired certs, overdue reviews. Early Warning: lateness, absence. AI Copilot: 5 modes (HR/Manager/Executive/Recruiter/Employee), permission-scoped RAG over handbook Knowledge Vault. Digital Twin: simulate open 5 branches → employees/skills/cost. Simulator: salary +10% → payroll impact.', y);

// Architecture
doc.addPage();
y = 50;
y = heading('10. Architecture (MSSQL)', y);
y = body('Modular monolith NestJS 10 + Next.js 14 App Router + MSSQL onehr_v2 (migrated from PostgreSQL). 46 tables, 22 modules. Prisma provider sqlserver, Json → String @db.NVarChar(Max), String[] → Json, enums → String, NoAction cascades. Tenancy via organization_id + sp_set_session_context (was RLS).', y);
y = bullet('DB', 'MSSQL 2022 accountingappdb:1433, 46 tables, Prisma migrate dev, generate, seed (RC org, admin/superadmin, 3 plans, RBAC).', y);
y = bullet('API', 'NestJS, JWT 15m/7d, APP_GUARD JwtAuthGuard + RbacGuard (dynamic DB permissions), ValidationPipe, CORS, rate limit 100/min, Swagger /api/docs, body 10mb for face base64.', y);
y = bullet('Web', 'Next.js 14 App Router, Tailwind, GlassCard/Pill, DataGrid (pagination 10/25/50/100, sorting, per-col filter, group-by, slice, pivot, CSV export), lucide-react, charts (HealthRadar, BranchBar).', y);
y = bullet('Infra', 'Redis (queues), S3 (snapshots/docs), BullMQ Automation Engine (Event→Condition→Action→Notification→Escalation), Meilisearch (search), Cron.', y);

// Quick Start
y = heading('11. API Quick Start & Demo Accounts', y+6);
y = body('Base: http://localhost:3001/v1, Web: http://localhost:3000\n\n# Health\ncurl http://localhost:3001/v1/health\n\n# Login\ncurl -X POST http://localhost:3001/v1/auth/login -H "Content-Type: application/json" -d \'{"email":"admin@recruitconnect.ng","password":"Admin@123"}\'\n\n# Create org (public)\ncurl -X POST http://localhost:3001/v1/organizations -d \'{"name":"Acme Ltd","acronym":"ACM","industryTemplate":"tech","adminEmail":"acme@demo.ng","adminPassword":"Acme@123"}\'\n\n# Bulk template Excel\ncurl -H "Authorization: Bearer $TOKEN" http://localhost:3001/v1/employees/bulk/template/xlsx -o template.xlsx', y);
doc.fontSize(8).fillColor(muted).text('Demo: admin@recruitconnect.ng/Admin@123 (org_admin), superadmin@recruitconnect.ng/Super@123, hr@/manager@/employee@ / Test@123, testco@demo.ng/Test@123', 50, y, { width: 495 });

// Operations Manual
doc.addPage();
y = 50;
y = heading('12. Operations Manual', y);
y = body('Landing → Login (AuthNav shows Dashboard/Logout when authed) → Role-based redirect. Employee sees popup “Go to Attendance” if not clocked today (sessionStorage). Attendance requires face + motion snap (98% if verified). HR/Admin resolves exceptions. Super Admin → Admin → Organizations tab shows all orgs (TC, RC) with Onboarding Queue (pending = no plan) → Assign plan (POST /admin/subscriptions/assign). People → Add/Bulk (Excel dropdowns) → instantly visible in Organizations _count.', y);
y = bullet('Dropdowns', 'All selects API-driven: GET /departments?branchId=, GET /branches, GET /admin/roles, GET /admin/permissions/grouped, GET /admin/modules. Linked: branch → department. CRUD at Settings → Dropdowns (Branches/Departments/Roles/Modules) via POST/PATCH/DELETE.', y);
y = bullet('Reports', 'DataGrid generic: pagination, sorting, per-col filter, global search, Group-by (count/sum), Slice (column+value), Pivot (row × col), Export CSV. Used in /reports and /analytics.', y);
y = bullet('Face Enroll', 'HR: People → Camera icon → Copy link /face-enroll/:id → employee captures 3 snaps → POST /employees/:id/face-profile. Clock-in compares live vs enrolled (<60% → duplicate_face critical).', y);
y = heading('13. Super Admin — Companies & Onboarding', y+6);
y = body('Register via /register → POST /v1/organizations → appears in Admin → Organizations (pending, NEW badge, no plan). Superadmin assigns Starter/Growth/Enterprise (price, maxEmployees, modules) and optionally Company Group. Auto-creates Head Office branch + HR dept + leave types. Onboarding Queue shows action “Onboard → Assign Plan”. User sees only modules from assigned plan (checkModuleAccess).', y);
y = heading('14. Security & Privacy', y+6);
y = body('JWT 15m/7d httpOnly, argon2, RBAC, audit_logs, TLS, AES at rest, S3 SSE, consentLog (face/gps), retention job deletes S3 + DB ref, right to erasure soft delete, device fingerprint hashed, location only if require_gps && consent_gps.', y);
y = heading('15. Roadmap & Support', y+6);
y = body('Phase 1-4 DONE (MVP → Intelligence). Next: Extract Attendance service at 20k concurrent, Mobile offline queue, SSO (Azure AD), Biometric ZKTeco push. Support: hello@recruitconnect.ng, +234 800 123 4567, Victoria Island, Lagos. Docs: PRD, ERD, API_SPEC, ARCHITECTURE, RBAC, ROADMAP in /docs.', y);

doc.end();
console.log('PDF written to', out);
