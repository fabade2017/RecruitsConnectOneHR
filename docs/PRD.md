# RecruitConnect OneHR™ - Product Requirements Document (PRD)
**Version:** 1.0 | **Date:** 2026-08-31 | **Status:** Draft for Stakeholder Review
**Owner:** RecruitConnect Nigeria Ltd | **Category:** HRIS / HCM / Workforce Intelligence

---

## 1. Executive Summary

OneHR is an **Intelligent Workforce Operating System**, not a traditional HRIS. While HRIS answers "Who are your employees?", OneHR answers "What is happening across your workforce right now?" (`docs/PRD.md:15`).

**Four Pillars:**
1. **Manage People** - Full employee lifecycle (hire → alumni)
2. **Manage Work** - Attendance, shifts, tasks, work arrangements
3. **Measure Workforce** - Activity, performance, engagement, analytics (supporting info, not click-surveillance)
4. **Predict What's Next** - AI, risk, planning, forecasting

**Target Markets:** SMEs, Corporates, Government, NGOs, Schools, Hospitals, Financial Institutions, Retail, Manufacturing, Professional Services, Recruitment Agencies, Remote Organisations.

---

## 2. Product Principles

| Principle | Detail |
|-----------|--------|
| **Activity != Productivity** | System clicks never auto-generate a productivity score. Activity (87%) + Tasks (94%) + KPI (102%) + Attendance (96%) + Manager Assessment → Overall Indicator (`section 39`). |
| **Optional & Configurable** | Face snapshot, GPS, biometrics are OPT-IN per organisation with consent, retention, and access controls (`section 9`). |
| **Flag, Don't Accuse** | Fraud/exceptions are "Requires Review", not auto-accusations (`section 10, 37`). |
| **Industry Neutral** | Organisation Templates + Configuration Engine, no hard-coded rules (`section 41, 42`). |
| **Permission-Scoped AI** | Copilot respects RBAC; answers from approved policies only (`section 21, 23`). |

---

## 3. User Personas & Roles

| Persona | Goals | Key Dashboards |
|---------|-------|---------------|
| **Employee** | Clock in/out, leave, payslip, docs, training, tasks | Employee Home (`section 17`) |
| **Line Manager** | Team today/this month, approvals, workload | Manager Dashboard (`section 16`) |
| **HR Admin/Manager** | Exceptions, compliance, recruitment, docs, workflows | Workforce Command Center (`section 14`), Exception Center |
| **Executive (CEO/MD)** | Health score, attrition, cost, risks, forecasts | Executive Command Center (`section 40`) |
| **Recruiter** | Internal/external vacancies, marketplace | Talent Marketplace (`section 27`) |
| **System Admin** | Org config, templates, integrations, retention | Administration |

RBAC matrix detailed in `docs/RBAC.md`.

---

## 4. Workforce Model (6 Layers)

1. **PEOPLE** - Who works? Digital Identity, org structure, skills.
2. **WORK** - What is expected? Tasks, projects, shifts, arrangements.
3. **TIME** - When/where working? Sessions, attendance, breaks, overtime.
4. **PERFORMANCE** - What achieved? KPI, appraisals, check-ins.
5. **ENGAGEMENT** - How experiencing org? Surveys, life events, recognition.
6. **INTELLIGENCE** - What should mgmt do next? Scores, risks, forecasts, simulator.

---

## 5. Functional Requirements

### 5.1 People Management & Digital Identity (Section 3, 11)

**OneHR Employee ID:** Format `{ORG_ACRONYM}-{6-digit-seq}` e.g., `RC-000245`. Immutable, unique per org. Includes QR Code generation.

**Employee Profile (Digital Identity):** 25+ fields: ID, QR, photo, optional biometric/face profile, department, branch, job title, grade, manager, employment type (permanent/contract/intern/volunteer/consultant), work mode (office/remote/hybrid/field/mobile/shift/flexible/project/seasonal/part-time/full-time), skills, certifications, attendance, leave, performance, training, assets, documents, compensation, disciplinary, career/exit history.

**User Stories:**
- As HR, I can create employee with auto-generated OneHR ID and QR so identity follows lifecycle.
- As Employee, I can view/download Digital Passport (Career Passport™) controlling shareable fields.

**Acceptance Criteria:**
- ID uniqueness enforced at DB with index on `(organization_id, employee_code)`.
- Profile completeness score calculated for HR Risk Engine (incomplete docs flag).

### 5.2 Work Activity Engine & Work Sessions (Section 4,5,6,39)

**Workforce Activity Engine:** Configurable interaction events (17 types): clock_in, break_start/end, clock_out, leave_request, hr_request, document_submission, policy_ack, training_completion, performance_checkin, appraisal_submission, manager_approval, login, portal_interaction, task_completion, workflow_action, timesheet_submission.

**Work Session:** Daily entity: `clock_in, breaks[], clock_out, gross_duration, break_duration, net_working_time, scheduled_hours, overtime, late_minutes, early_departure`. Formula: `Net = Gross - Approved Breaks`. Feeds attendance, payroll, overtime, analytics.

**Activity Timeline:** Per employee per day chronological log (e.g., 8:02 Clock In → 17:08 Clock Out).

**Interaction Analytics (Supporting Info Only):** portal sessions, workflow actions, tasks completed, approvals, docs processed, training activities, hr requests, active session duration. **Must not** be used as auto productivity score.

**User Stories:**
- As HR, I can see John Doe timeline for 18 Aug with all 8 events so I understand work pattern.
- As Payroll, net working time auto-calculates overtime (23m example) without manual entry.

### 5.3 Smart Attendance (Section 7,8,9,36,37,38)

**Methods (7):** Mobile app, web browser, QR code, biometric device, facial verification, NFC/employee ID, API third-party device.

**Face Snapshot Log (Optional):** When enabled: date, time, employee, clock_event, verification_method, device, location (if enabled), snapshot_ref, verification_status, exception_status, IP/device info. Confidence % (e.g., 98% Verified). Snapshot retention configurable (e.g., 30/90/365 days), access-controlled.

**Privacy Controls:** Org-level `attendance_verification_policy` with options: standard, gps, qr, biometric, facial, combination. Toggles for: capture snapshot? when? retention? who accesses? consent required?

**Security:** Device Registration + Device Fingerprint + Optional Face + Optional GPS + Time Verification + Behaviour Detection → Attendance Verification Score (98% Verified).

**Exception Center:** Aggregated queue: missing_clock_out (23), late_arrival (41), unapproved_overtime (13), suspicious_attendance (4), break_exceeded (19), duplicate_clock (7). Bulk resolve.

**Fraud Detection (Flag Only):** proxy clocking (A uses B device), impossible travel (Lagos → distant location shortly after), repeated identical GPS, device sharing, duplicate facial identity, suspicious hours/locations → "Attendance Exception – Requires Review".

**Reporting:** Employee Report (clock times, gross/break/net, overtime, late, status), Department Report (present/absent/late/remote/leave/avg hours/overtime), Executive Report (attendance rate, trend, absenteeism, overtime cost, remote, branch comparison).

### 5.4 Multi-Work & Shift Engines (Section 11,12,13)

**Work Arrangement:** 14 options per employee: office, remote, hybrid, field, mobile, shift, flexible, project-based, contract, seasonal, part-time, full-time, volunteer, intern, consultant.

**Shift Engine:** Fixed (8-5), Flexible (8h between 7-19), Rotational (M→A→N), Split (8-12 & 16-20), 24h ops, Remote (timezone-aware), Field (no fixed office). Supports overlapping shifts.

**Flexible Work:** "Work by hours not location" - complete 8h without continuous presence. Net hours = Gross - Breaks.

### 5.5 Command Centers & Dashboards (Section 14,15,16,17,40)

**Workforce Command Center (HR):** Today snapshot: Employees 1245, Clocked In 1067, Remote 328, On Break 82, Absent 94, Late 63, On Leave 84, Overtime 41, Exceptions 17, Pending Approvals 126.

**Live Workforce Map (Permission-controlled, location opt-in):** Head Office 542, Branch A 83, Branch B 74, Remote 328, Field 119.

**Manager Dashboard:** My Team Today (present/absent/late/leave/remote/break/clocked_out/missing_clockout/overtime/pending) + My Team This Month (attendance rate, leave, overtime, performance, training, tasks, issues, probation, birthdays, anniversaries).

**Employee Home:** Greeting, Today's Schedule (8-5), Attendance status 🟢 Working 08:02, Break control, Quick Actions (Clock In/Out, Start Break, Leave, Payslip, HR Request, Docs, Performance, Training, Policies).

**Executive Command Center:** People 12450, Today 10982 Working, Attrition 4.8%, Recruitment 127 Open, Performance 91%, Training 86%, Attendance 94%, HR Health 89/100, Alerts (3 critical/18 warnings/97 healthy). Radically different from HR dashboard.

### 5.6 Workforce Intelligence (Section 18,19,20,45)

**Workforce Score (Not single productivity):** Attendance Health 94%, Performance 87%, Learning 91%, Engagement 78%, Compliance 96%, Stability 89% → Organisation HR Health Score 89/100 (executive feature).

**HR Risk Engine:** Flags: 12 expired certifications (🔴), 23 overdue reviews (🟠), 8 overtime thresholds (🔴), 15 probation due in 14d (🟠), 34 incomplete docs (🔴), turnover +12% QoQ (🟠).

**Early Warning System:** Patterns: repeated lateness, increasing absence, falling performance, expired quals, declining engagement, missed training, grievances, excessive overtime, probation concerns → "Workforce Risk Indicator: Elevated" + factors (never auto "will resign").

**Workforce Intelligence Engine™:** Cross-module analysis: People+Time+Work+Performance+Skills+Engagement+Cost+Compliance → Insights/ Risks/ Recommendations/ Forecasts.

### 5.7 AI HR Copilot & Policy Intelligence (Section 21,23)

**Modes (permission-scoped):** HR Mode, Manager Mode, Executive Mode, Recruiter Mode, Employee Mode. Examples: "Show probation ending this month" (HR), "Who has outstanding leave?" (Manager), "Highest turnover dept?" (Executive), "Leave balance?" (Employee). Uses RAG over uploaded handbook/policies (leave, attendance, disciplinary, remote, code of conduct) + Knowledge Vault (SOPs, forms, manuals, FAQs).

**Policy Intelligence:** Upload handbook → employees ask natural language → AI answers from approved policies only, with citations.

### 5.8 Automation & Workflows (Section 33,34,35)

**Automation Engine:** Event → Condition → Action → Notification → Escalation. Example: Employee reaches 3 months → create probation review → notify manager/employee → create HR task → deadline → escalate if overdue. Powers hundreds of HR processes.

**Universal Workflow Builder (No-code):** Trigger → Condition → Approver → Action → Notification → Escalation. Example: Leave request → check balance → manager approval → calendar update → notify → dashboard update.

**Smart Notifications:** Email, SMS, Push, In-app, WhatsApp (where configured). Examples: leave approved, probation due in 7d, not clocked out, cert expires in 30d.

### 5.9 Projects, Workload, Talent (Section 25,26,27,28,29)

**Project & Task Module:** Projects (e.g., Lagos Branch Expansion - 18 tasks, 14 completed) connects People→Time→Tasks→Performance. Includes role, deadlines.

**Workload Monitor:** 🟢 Balanced / 🟠 High / 🔴 Critical based on tasks, deadlines, overtime, leave, project allocation, manager assessment.

**Talent Marketplace:** Internal jobs, projects, volunteering, skills offering, mentors, communities.

**Internal Job Market:** Eligibility auto-check: grade, experience, performance, training, skills, disciplinary restrictions.

**Digital Employee Passport (Career Passport™):** Downloadable: ID, position, dept, employment date, skills, certs, training, achievements. Employee controls shareable fields.

### 5.10 Org Simulation & Knowledge (Section 24,30,31,32)

**Organisation Digital Twin:** People→Depts→Positions→Skills→Costs→Performance→Risks. Simulate: "Open 5 new branches?" → estimates required employees, skills, salary, recruitment, training, mgmt capacity.

**HR Decision Simulator:** Scenario A (salary +10% → payroll/benefits/dept/annual impact), B (20 leave → gap/recruitment/knowledge/replacement cost), C (50 to remote → capacity/attendance/cost/equipment).

**Knowledge Vault:** Policies, SOPs, forms, manuals, dept procedures, FAQs. On exit: prompt Knowledge Transfer (responsibilities, contacts, processes, projects, access handover, outstanding matters, replacement guidance).

**Life Event Engine:** Birthday, anniversary, promotion, marriage, new baby, certification, graduation, retirement → Notification → Recognition → HR Task → Gift Reminder.

### 5.11 Document Generator & Offboarding (Section 22)

**HR Document Generator:** 14 templates: employment, confirmation, promotion, transfer, warning, query, suspension, termination, resignation ack, reference, training, salary review, probation, exit. Configurable templates with e-signature.

### 5.12 Industry Templates & Config Engine (Section 41,42,44)

**Organisation Templates:** Banking (branches, targets, compliance), School (teachers, academic calendar, terms), Hospital (doctors, nurses, shifts, on-call), Manufacturing (factory shifts, safety, operators), Retail (stores, shift workers), NGO (projects, grants, field), Tech (remote, agile, flexible).

**Configuration Engine:** Workdays, hours, shifts, break duration, grace period, overtime rules, leave types, approval levels, remote rules, attendance methods, GPS, face verification, doc requirements, performance cycles, payroll, notifications, employment types.

**Product Ecosystem (44 modules):** CORE → People, Recruitment/ATS, Onboarding, Attendance, Smart Clocking, Face Verification, GPS/Location, Shifts/Rosters, Leave, Remote Work, Tasks/Projects, Performance, KPI, Payroll, Benefits, Learning, Engagement, Employee Relations, Disciplinary, Documents, Assets, Promotion/Transfer, Succession, Offboarding, Alumni, Compliance, HR Service Desk, Reporting, People Analytics, AI Copilot, Workforce Intelligence, Workflow Automation, Integrations, Administration.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Command Center loads <2s for 10k employees; attendance clock <500ms |
| **Scalability** | 50k employees/org, multi-org tenancy, horizontal API scaling |
| **Security** | Encryption at rest/in transit, RBAC, audit log for all HR actions, NDPA/GDPR compliance, snapshot access audit |
| **Availability** | 99.9% uptime, offline clock queue + sync (mobile) |
| **Privacy** | Consent management, data retention policies, right to erasure, IP/device minimization |
| **Integrations** | Biometric devices (ZKTeco etc) via API, payroll, WhatsApp, email/SMS gateways, SSO/SAML |
| **Mobile** | iOS/Android, device registration, offline mode, GPS opt-in |
| **Compliance** | Nigerian Labour Act, NDPA 2023, CBN HR compliance (banking template) |

---

## 7. Phased Roadmap Summary

Detailed in `docs/ROADMAP.md`. Phases: MVP (Core People+Attendance+Leave+Shifts) → Operations & Visibility → Performance & Talent → Intelligence & AI. Each phase 2-4 months.

---

## 8. Open Questions for Stakeholders

1. Phase 1 industry template priority? (Banking vs Manufacturing vs School)
2. Facial verification vendor preference? (in-house vs AWS Rekognition vs on-device)
3. Payroll: build native or integrate (e.g., SeamlessHR, Bamboo)?
4. WhatsApp provider (Twilio vs local)?
5. Biometric device models in scope for API integration?
6. Data residency requirement (Nigeria-only)?
7. Snapshot retention default: 30/90/365 days?

---

## 9. Success Metrics

- HR Health Score adoption by execs
- Exception resolution time <24h
- Attendance fraud flag accuracy >95% (manual review)
- Manager dashboard DAU
- Time-to-hire reduction via internal marketplace
- Payroll overtime calculation accuracy 100%

