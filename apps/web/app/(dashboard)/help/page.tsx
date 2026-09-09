'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Clock, ShieldCheck, Sparkles, TrendingUp, GraduationCap, Wallet, Building2, FileText, MapPin, AlertTriangle, Briefcase, Heart, BarChart3, Brain, Workflow, Plug, Settings, ChevronRight, ChevronDown, Search, Play, Check, ArrowRight, Layers, CreditCard, UserPlus, CalendarCheck, Boxes, Scale, Headset, MessageCircle, Timer, UserMinus, Users2, HelpCircle, Lightbulb, Compass, Route, Flag, Eye, Lock, Fingerprint } from 'lucide-react';

const TOC = [
  { id: 'story', label: 'The Story', icon: BookOpen, desc: 'Newbie narrative — follow Acme from zero to live' },
  { id: 'map', label: 'Process Map', icon: Route, desc: 'End-to-end flow in 10 steps' },
  { id: 'start', label: 'Quick Start', icon: Play, desc: '3 commands to run locally' },
  { id: 'roles', label: 'Roles & Journeys', icon: Users, desc: 'What each role sees & does' },
  { id: 'modules', label: 'Modules', icon: Layers, desc: '44 modules grouped by pillar' },
  { id: 'attendance', label: 'Attendance Deep Dive', icon: Clock, desc: '7 methods + fraud flags' },
  { id: 'leave', label: 'Leave Lifecycle', icon: CalendarCheck, desc: 'Request → approve → cancel/delete' },
  { id: 'hrflow', label: 'HR Daily Flow', icon: Compass, desc: 'Command Center to payroll' },
  { id: 'tech', label: 'Technical Docs', icon: FileText, desc: 'PRD • ERD • API • ARCH • RBAC' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, desc: 'Privacy, retention, acronym' },
];

const MODULES = [
  { pillar: 'OVERVIEW', items: [
    { icon: MessageCircle, label: 'Chat', href: '/chat', desc: 'Internal chat + unread 15s poll' },
    { icon: Building2, label: 'Command Center', href: '/hr', desc: 'HR Health 89/100, live today snapshot' },
    { icon: Building2, label: 'Executive', href: '/executive', desc: 'Attrition, cost, forecasts' },
    { icon: Users2, label: 'My Team', href: '/manager', desc: 'Team today + month' },
    { icon: Users, label: 'Home', href: '/employee', desc: 'Clock, leave, payslip quick actions' },
  ]},
  { pillar: 'MANAGE PEOPLE', items: [
    { icon: Users, label: 'People', href: '/employees', desc: 'RC-000245 ID, QR, 25+ fields, edit modal' },
    { icon: CreditCard, label: 'ID Cards', href: '/id-cards', desc: 'Printable ID + QR' },
    { icon: UserPlus, label: 'Recruitment / ATS', href: '/recruitment', desc: 'Vacancies, marketplace' },
    { icon: Users, label: 'Onboarding', href: '/onboarding', desc: 'Checklists, Day 1' },
    { icon: FileText, label: 'Documents', href: '/documents', desc: 'Signed URLs, 7yr audit' },
    { icon: Boxes, label: 'Assets', href: '/assets', desc: 'Laptop, serial, assign' },
  ]},
  { pillar: 'MANAGE WORK', items: [
    { icon: Clock, label: 'Attendance', href: '/attendance', desc: 'Face 98%, motion 0.8–12%, GPS opt-in' },
    { icon: CalendarCheck, label: 'Shifts & Rosters', href: '/shifts', desc: 'Fixed, flexible, rotational, 24h' },
    { icon: CalendarCheck, label: 'Leave', href: '/leave', desc: 'Types, balances, full lifecycle (edit/cancel/delete)' },
    { icon: Briefcase, label: 'Tasks & Projects', href: '/projects', desc: 'Workload Balanced/High/Critical' },
  ]},
  { pillar: 'MEASURE', items: [
    { icon: TrendingUp, label: 'Performance', href: '/performance', desc: 'KPI, appraisals, Overall Indicator' },
    { icon: GraduationCap, label: 'Learning', href: '/learning', desc: 'Training, completions' },
    { icon: Heart, label: 'Engagement', href: '/engagement', desc: 'Surveys, life events' },
    { icon: Wallet, label: 'Payroll', href: '/payroll', desc: 'Gross−Breaks=Overtime, simulator' },
    { icon: ShieldCheck, label: 'Compliance', href: '/compliance', desc: 'Expiries, audits' },
    { icon: BarChart3, label: 'Reports', href: '/reports', desc: 'CSV exports' },
    { icon: MapPin, label: 'Live Map', href: '/hr', desc: 'Branch geofence 200m' },
    { icon: AlertTriangle, label: 'Exceptions', href: '/hr', desc: '17 flagged → bulk resolve' },
  ]},
  { pillar: 'PREDICT', items: [
    { icon: BarChart3, label: 'People Analytics', href: '/analytics', desc: 'Workforce score 6 indicators' },
    { icon: Sparkles, label: 'AI Copilot', href: '/ai-copilot', desc: '5 modes, RAG from policies' },
    { icon: Brain, label: 'Intelligence', href: '/intelligence', desc: 'Digital Twin, simulator' },
  ]},
  { pillar: 'SYSTEM', items: [
    { icon: CreditCard, label: 'Subscription', href: '/subscriptions', desc: 'Starter/Growth/Enterprise gating' },
    { icon: ShieldCheck, label: 'Audit Trail', href: '/audit', desc: 'Immutable 7yr' },
    { icon: Workflow, label: 'Automation', href: '/workflows', desc: 'Trigger→Condition→Approver→Action' },
    { icon: Plug, label: 'Integrations', href: '/integrations', desc: 'Biometric, payroll, WhatsApp' },
    { icon: Settings, label: 'Administration', href: '/settings', desc: 'Org config engine' },
    { icon: Layers, label: 'Dropdowns', href: '/settings/dropdowns', desc: 'Grades, templates' },
  ]},
];

function Section({ id, title, subtitle, icon: Icon, children }: any) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Icon size={18} /></div>
        <div>
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border p-5 md:p-6 shadow-sm">{children}</div>
    </section>
  );
}

export default function HelpPage() {
  const [active, setActive] = useState('story');
  const [q, setQ] = useState('');
  const [openStep, setOpenStep] = useState<number | null>(0);

  const filteredModules = MODULES.map(g => ({
    ...g,
    items: g.items.filter(i => !q || i.label.toLowerCase().includes(q.toLowerCase()) || i.desc.toLowerCase().includes(q.toLowerCase()))
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 rounded-[24px] p-6 md:p-8 text-white overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs"><BookOpen size={14} /> HELP CENTER • Docs v2026-09-09 • Sidebar collapsed by default → click chevron to expand</div>
          <h1 className="text-3xl md:text-4xl font-black mt-3 leading-tight">New to OneHR? Start here.</h1>
          <p className="text-white/70 mt-2 max-w-2xl">One Platform. Complete Workforce Intelligence. This guide tells the <b className="text-white">story</b> of how work flows — from registering your company to closing payroll — so you know what to click, in what order, and why.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#story" onClick={() => setActive('story')} className="bg-white text-slate-900 rounded-full px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-slate-100">Read the Story <ArrowRight size={16} /></a>
            <Link href="/manual" className="bg-white/10 border border-white/20 rounded-full px-5 py-2.5 text-sm font-semibold">Manual PDF →</Link>
            <Link href="/hr" className="bg-emerald-500 rounded-full px-5 py-2.5 text-sm font-semibold">Open Command Center</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="bg-white/10 rounded-full px-3 py-1">Sidebar: collapsed by default — click <span className="font-mono">›</span> to expand, <span className="font-mono">‹</span> to collapse. Preference saved.</span>
            <span className="bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-1">Multi-tenant MSSQL onehr_v2</span>
            <span className="bg-white/10 rounded-full px-3 py-1">RBAC: super_admin • org_admin • hr_admin • manager • employee</span>
          </div>
        </div>
      </div>

      {/* TOC + Search */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="lg:sticky lg:top-[80px] self-start space-y-4">
          <div className="bg-white rounded-2xl border p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search modules (e.g. leave, payroll)" className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div className="mt-3 space-y-1">
              {TOC.map(t => (
                <button key={t.id} onClick={() => { setActive(t.id); document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${active === t.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                  <t.icon size={16} className={active === t.id ? 'text-white' : 'text-slate-500'} />
                  <span className="flex-1">
                    <div className="font-semibold leading-none">{t.label}</div>
                    <div className={`text-[11px] leading-none mt-1 ${active === t.id ? 'text-white/60' : 'text-slate-400'}`}>{t.desc}</div>
                  </span>
                  <ChevronRight size={14} className={active === t.id ? 'text-white/60' : 'text-slate-300'} />
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-violet-50 border border-violet-100 rounded-xl">
              <div className="text-xs font-bold flex items-center gap-2"><Lightbulb size={14} className="text-violet-600" /> Tip for newbies</div>
              <p className="text-xs text-slate-600 mt-1">Start at <b>Story → Process Map → Quick Start</b>. Then pick your role. All docs also live in <code>docs/</code>: PRD, ERD, API_SPEC, ARCHITECTURE, RBAC, ROADMAP, MANUAL.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-4">
            <h4 className="font-bold text-sm flex items-center gap-2"><FileText size={14} /> Documentation</h4>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li><a href="/manual.pdf" target="_blank" className="flex items-center gap-2 hover:underline"><FileText size={14} className="text-slate-500" /> Manual PDF (10 pages)</a></li>
              <li><Link href="/about" className="flex items-center gap-2 hover:underline"><Building2 size={14} className="text-slate-500" /> About</Link></li>
              <li><Link href="/contact" className="flex items-center gap-2 hover:underline"><Headset size={14} className="text-slate-500" /> Contact</Link></li>
              <li><span className="flex items-center gap-2 text-slate-500"><FileText size={14} /> PRD • ERD • API_SPEC</span><span className="text-xs text-slate-400 ml-6">in docs/ folder</span></li>
              <li><span className="flex items-center gap-2 text-slate-500"><Layers size={14} /> ARCHITECTURE • RBAC • ROADMAP</span></li>
            </ul>
          </div>
        </div>

        <div className="space-y-8 min-w-0">
          {/* STORY */}
          <Section id="story" title="The Story — A Day in the Life of Acme Ltd" subtitle="Follow characters, not features. You’ll understand why each click matters." icon={BookOpen}>
            <div className="prose max-w-none text-sm leading-7 text-slate-700">
              <div className="bg-slate-50 border rounded-xl p-4 mb-4">
                <div className="font-bold flex items-center gap-2"><Users size={16} /> Cast</div>
                <p className="text-xs text-slate-600 mt-1"><b>Amara</b> (Founder) registers Acme. <b>Chidi</b> (Super Admin, RecruitConnect) approves. <b>Blessing</b> (HR Admin) sets up people & policies. <b>Emeka</b> (Manager) leads 8 staff. <b>Zainab</b> (Employee) clocks in, takes leave. <b>Aisha</b> (Executive) watches HR Health.</p>
              </div>
              <h3 className="font-black text-slate-900">Chapter 1 — The Idea (Register)</h3>
              <p>Amara hears about OneHR: “not HRIS, but an Intelligent Workforce Operating System that answers <i>What is happening right now?</i>” She goes to the landing <code>/</code> → <b>Get Started</b> → <code>/register</code>. She types <i>Acme Ltd</i>, acronym <b>ACM</b> (unique tenant key), industry <b>tech</b>, her email <b>amara@acme.ng</b>. She clicks <b>Create workspace</b>. Behind the scenes: API <code>POST /v1/organizations</code> (public, no auth) creates: organization row + <i>Head Office</i> branch + <i>HR</i> department + <b>org_admin</b> user + employee <b>ACM-000001</b> + leave types (Annual, Sick). She sees “Workspace pending approval” — she’ll login once Chidi approves.</p>

              <h3 className="font-black text-slate-900 mt-4">Chapter 2 — The Gatekeeper (Super Admin)</h3>
              <p>Chidi logs in as <b>superadmin@recruitconnect.ng / Super@123</b> (acronym <b>RC</b>) → <code>/admin</code>. In <b>Organizations</b> tab he sees ACM • pending • No plan — amber <b>NEW</b> badge and an <b>Onboarding Queue</b> card at top. He picks <b>Growth · ₦150k (200 emp)</b> → <b>Onboard → Assign Plan</b> (<code>POST /admin/subscriptions/assign</code>). Now ACM is <b>active</b>, modules gated, and Amara can login as org_admin.</p>

              <h3 className="font-black text-slate-900 mt-4">Chapter 3 — Building the House (Setup)</h3>
              <p>Amara logs in via <code>/login</code> with <b>acronym ACM + email + password</b> → lands on <code>/hr</code> (Command Center). She goes to <b>Administration → Dropdowns</b> to add grades, then <b>Settings</b> to tune <i>grace_period 10m, overtime after 8h, break 60m</i>, <b>Shifts</b> to create <i>Morning 08:00–17:00</i>, <b>Leave → Types</b> to confirm Annual 21d. She toggles attendance policy: <b>facial optional + GPS opt-in</b> with 90-day snapshot retention (consent required).</p>

              <h3 className="font-black text-slate-900 mt-4">Chapter 4 — People Arrive (Blessing adds staff)</h3>
              <p>Blessing (hr_admin) logs in (RC: <b>hr@ / Test@123</b>) → <b>People → Add Employee</b> modal. She fills Job Title, Grade, Department, Branch, Skills → <code>POST /employees</code> → Blessing sees new row <b>RC-00000X</b> + QR instantly, and Super Admin’s <b>Employees count</b> ticks. She clicks pencil to <b>Edit</b> → <code>PATCH /employees/:id</code> (snake→camel). She bulk-imports 40 via CSV (OneHRCon). Each gets <i>Digital Passport</i> (Career Passport™).</p>

              <h3 className="font-black text-slate-900 mt-4">Chapter 5 — The First Clock (Zainab)</h3>
              <p>Zainab (employee) logs in (employee@ / Test@123, RC). Immediately a modal: <i>“Welcome, Zainab — Ready to clock in? Go to Attendance”</i> (from <code>login/page.tsx</code> + <code>employee/page.tsx</code>). She taps <b>Go to Attendance → Clock In</b>. Camera opens: <b>FaceDetector + motion 0.8–12%</b> → <i>liveness verified</i> → <b>Snap & clock-in</b>. Payload: <code>face_snapshot_base64 + face_meta + device_fingerprint + GPS</code> → <code>POST /attendance/clock-in</code> → WorkSession <b>working</b> 98% verified. If no face/motion out-of-range → flagged <code>suspicious_attendance</code> for Blessing to review, never auto-accused. She takes <b>Start Break / End Break</b>, then <b>Clock Out</b> → Net = Gross − Breaks, overtime 23m auto.</p>

              <h3 className="font-black text-slate-900 mt-4">Chapter 6 — Life Happens (Leave)</h3>
              <p>Zainab needs 3 days off → <b>Leave → Request Leave</b> (type, dates, reason) → <code>POST /leave/requests</code> pending. She notices a typo → <b>Edit (pencil)</b> → <code>PATCH /leave/requests/:id</code> (pending only, owner/hr/manager-of-owner). She realizes it’s a wrong entry → <b>Delete (trash)</b> → <code>DELETE /:id</code> (hard delete pending only). Or she cancels approved leave → <b>Cancel (ban)</b> → <code>PATCH /:id/cancel</code>. Emeka (manager) sees it in <b>Leave → Requests</b> or <b>My Team</b> → <b>Approve (check) / Reject (X)</b> → <code>PATCH /:id/approve</code> (only pending, manager-team, employee blocked). Balances at <code>GET /leave/balances/:employeeId</code>.</p>

              <h3 className="font-black text-slate-900 mt-4">Chapter 7 — The Watchtower (Blessing & Emeka)</h3>
              <p>Blessing opens <b>Command Center</b> → Today: 1245 employees, 1067 clocked, 17 exceptions, 84 on leave. She checks <b>Exception Center</b>: device_sharing, duplicate_face, impossible travel — all <i>Requires Review</i>. She bulk resolves. She opens <b>Live Map</b> (only if GPS consented) → Head Office 542, Branch A 83, geofence 200m, out-of-geofence flagged. Emeka opens <b>My Team</b> → present/absent/late/leave + workload <b>Balanced/High/Critical</b>.</p>

              <h3 className="font-black text-slate-900 mt-4">Chapter 8 — The Ledger (Payroll)</h3>
              <p>Month end: <b>Payroll</b> pulls net working minutes + overtime + leaves + shifts → calculates basic + allowances − deductions − tax. Aisha (executive) opens <b>Executive</b> → HR Health <b>89/100</b> (6 indicators: Attendance 94, Performance 87, etc.), attrition 4.8%, alerts critical. She runs <b>Simulator</b>: “salary +10% → payroll +₦12.5m”.</p>

              <h3 className="font-black text-slate-900 mt-4">Chapter 9 — The Oracle (Copilot)</h3>
              <p>Blessing asks AI Copilot: “Who has probation ending this month?” — answers only from approved policies (RAG) with citations, permission-scoped (HR sees all, manager sees team, employee sees self). She uploads handbook PDF → chunk 500 tokens → embed → pgvector.</p>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4">
                <div className="font-bold text-emerald-800 flex items-center gap-2"><Flag size={16} /> Moral</div>
                <p className="text-emerald-700 text-sm">Activity is supporting info, never a productivity score. Face/GPS are opt-in + 90d retention + audit. Fraud is flagged, not accused. Every PATCH/POST/DELETE is logged to <b>audit_logs</b> for 7 years.</p>
              </div>
            </div>
          </Section>

          {/* PROCESS MAP */}
          <Section id="map" title="Process Map — 10 Steps End-to-End" subtitle="What happens, who does it, where to click, which API fires." icon={Route}>
            <div className="space-y-3">
              {[
                { n: 1, title: 'Discover → Register', who: 'Founder', where: '/ • /register', api: 'POST /organizations (public)', cta: 'Create workspace pending', detail: 'Creates org + Head Office branch + HR dept + org_admin + ACM-000001 + leave types. Acronym unique; duplicate → 409.' },
                { n: 2, title: 'Approve → Onboard', who: 'Super Admin', where: '/admin • Organizations + Onboarding Queue', api: 'GET /admin/organizations, POST /admin/subscriptions/assign', cta: 'Select plan → Onboard', detail: 'Pending = no subscription. Assign Starter/Growth/Enterprise → status active, modules gated by subscription.plan.modules.' },
                { n: 3, title: 'Configure Org', who: 'org_admin', where: '/settings • /settings/dropdowns • /shifts', api: 'PATCH /organizations/:id, POST /shifts, POST /leave/types', cta: 'Grace 10m, overtime, branches', detail: 'Workdays, shifts (fixed/flex/rotational/24h), break duration, leave types, attendance policy (standard/gps/qr/facial), retention 30/90/365.' },
                { n: 4, title: 'Add People', who: 'hr_admin / org_admin', where: '/employees → Add Employee', api: 'POST /employees, PATCH /employees/:id, GET /employees/:id/timeline', cta: 'Job Title • Grade • Dept/Branch • Skills', detail: 'Generates RC-000245 + QR, hierarchy, 25+ fields, completes_in_score, passport ?fields. Edit modal maps snake→camel, skills JSON.stringify. Audit logged.' },
                { n: 5, title: 'Clock In/Out', who: 'employee (hr can on behalf)', where: '/attendance • /employee (popup)', api: 'POST /attendance/clock-in, /clock-out, /break/start|end, GET /attendance/sessions', cta: 'Face motion snap → 98% verified', detail: 'FaceDetector + motion 0.8–12% for 25 frames → verified; else failed → flagged suspicious_attendance. Device fingerprint + GPS + face_meta stored. WorkSession: gross, break, net= gross−break, overtime, late. Missing clock-out → superadmin determines manually (PATCH admin/sessions/:id/clock-out or POST admin/auto-close).' },
                { n: 6, title: 'Monitor Live', who: 'hr_admin • manager • executive', where: '/hr (Command Center)', api: 'GET /attendance/command-center, /live-map, /exceptions, /analytics/workforce-scores', cta: 'Today snapshot + Health radar + Map', detail: 'Employees 1245, clocked 1067, exceptions 17, on leave 84. Health 89/100 (6 scores). Map only if consent_gps. Exceptions: device_sharing/duplicate_face/impossible_travel → Requires Review.' },
                { n: 7, title: 'Request Leave', who: 'employee', where: '/leave → Request Leave', api: 'POST /leave/requests, GET /leave/requests, GET /:id, PATCH /:id, PATCH /:id/cancel, DELETE /:id', cta: 'Type • Dates → Reason • Days auto', detail: 'Pending only editable/deletable (owner/hr/manager-of-owner). Cancel: pending|approved→cancelled. Approve/reject: only pending, manager team, employee blocked. Balances GET /leave/balances/:id.' },
                { n: 8, title: 'Approve & Workload', who: 'manager • hr', where: '/leave (Check/X) • /manager • /projects', api: 'PATCH /leave/requests/:id/approve|reject, GET /workload/:employee_id, POST /projects', cta: 'Approve → calendar + notify', detail: 'Workflow: leave_request_created → condition days>3 → approval (manager SLA 24h) → escalate 48h → hr. Workload Balanced/High/Critical from tasks+overtime+deadlines.' },
                { n: 9, title: 'Pay & Measure', who: 'hr_admin • auditor • executive', where: '/payroll • /performance • /analytics • /reports', api: 'GET /payroll, /performance/reviews, /analytics/workforce-score, /reports/attendance?format=csv', cta: 'Payroll 100% net time accuracy', detail: 'Payroll merges basic+allowances−deductions−tax. Risk Engine flags expired certs 12, overdue reviews 23. Activity ≠ Productivity (§39).' },
                { n: 10, title: 'Predict & Advise', who: 'executive • hr • manager • employee', where: '/ai-copilot • /intelligence • /analytics/simulate', api: 'POST /policies/upload, POST /ai/copilot/query, POST /analytics/simulate', cta: 'Ask policy, simulate +10% salary', detail: 'Upload handbook → chunk 500+50 overlap → embed → pgvector → cosine >0.78 → LLM cites page. Modes: hr/manager/executive/recruiter/employee (row filters). Digital Twin simulates open 5 branches → 45 employees, cost.' },
              ].map(s => (
                <div key={s.n} className={`border rounded-xl overflow-hidden ${openStep === s.n ? 'bg-slate-50 border-slate-300' : 'bg-white'}`}>
                  <button onClick={() => setOpenStep(openStep === s.n ? null : s.n)} className="w-full flex items-center gap-3 p-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shrink-0">{s.n}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold flex items-center gap-2">{s.title} <span className="hidden md:inline text-xs font-normal bg-slate-100 rounded-full px-2 py-0.5">{s.who}</span></div>
                      <div className="text-xs text-slate-500 truncate">{s.where} • <code className="bg-white border rounded px-1">{s.api}</code></div>
                    </div>
                    <span className={`hidden md:inline text-xs rounded-full px-3 py-1 font-semibold ${s.n <= 4 ? 'bg-violet-100 text-violet-700' : s.n <= 6 ? 'bg-emerald-100 text-emerald-700' : s.n <= 8 ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{s.cta}</span>
                    {openStep === s.n ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {openStep === s.n && <div className="px-4 pb-4 text-sm text-slate-600 leading-6 border-t bg-white/60 pt-3">{s.detail} <Link href={s.where.split('•')[0].trim().split(' ')[0]} className="text-violet-600 underline ml-1">Open →</Link></div>}
                </div>
              ))}
            </div>
            <div className="mt-4 grid md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 text-white rounded-xl p-3"><div className="font-bold">IDs</div><div className="text-white/70">OneHR ID <b>{'{ORG}-000245'}</b> + QR per org, DB unique (org_id, employee_code). Immutable.</div></div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><div className="font-bold text-emerald-800">Net Working Time</div><div className="text-emerald-700">Net = Gross − Approved Breaks. Feeds attendance, payroll, overtime, analytics. Overtime 23m avg.</div></div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><div className="font-bold text-amber-800">No Auto-Accuse</div><div className="text-amber-700">All fraud → “Requires Review” + audit. HR resolves, not algorithm.</div></div>
            </div>
          </Section>

          {/* QUICK START */}
          <Section id="start" title="Quick Start — 3 Minutes to Live" subtitle="For engineers or HR testers. Sidebar is collapsed by default — expand to navigate." icon={Play}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-sm">1) MSSQL + Env</h4>
                <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs overflow-auto mt-2">docker exec accountingappdb /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'SQLserver@ta2' -C -Q "CREATE DATABASE onehr_v2"
DATABASE_URL="sqlserver://localhost:1433;database=onehr_v2;user=sa;password=SQLserver@ta2;encrypt=true;trustServerCertificate=true"
cp .env.example .env
cp apps/api/.env.example apps/api/.env</pre>
                <h4 className="font-bold text-sm mt-4">2) Migrate & Seed</h4>
                <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs overflow-auto mt-2">npx prisma migrate dev --schema=./prisma/schema.prisma
npx prisma generate --schema=./prisma/schema.prisma
./apps/api/node_modules/.bin/tsx apps/api/src/prisma/seed.ts
./apps/api/node_modules/.bin/tsx apps/api/src/prisma/enterprise_seed.ts
./apps/api/node_modules/.bin/tsx apps/api/src/prisma/rbac_seed.ts</pre>
                <h4 className="font-bold text-sm mt-4">3) Run</h4>
                <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs overflow-auto mt-2">npm run dev  # API 3001 + Web 3000 concurrently (tsc watch + nodemon delay 1500ms)
# or
npm run build --workspace=apps/api && node apps/api/dist/main.js
npm run dev --workspace=apps/web
# Web: http://localhost:3000  API: http://localhost:3001/v1/health → {'{"db":"up"}'}  Docs: /api/docs</pre>
              </div>
              <div className="space-y-3">
                <div className="bg-white border rounded-xl p-4">
                  <div className="font-bold text-sm">Demo Logins (acronym required)</div>
                  <div className="mt-2 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between"><span>RC / admin@recruitconnect.ng / Admin@123</span><span className="bg-slate-900 text-white rounded-full px-2">org_admin</span></div>
                    <div className="flex justify-between"><span>RC / superadmin@... / Super@123</span><span className="bg-violet-600 text-white rounded-full px-2">super_admin</span></div>
                    <div className="flex justify-between"><span>RC / hr@ / Test@123</span><span className="bg-emerald-600 text-white rounded-full px-2">hr_admin</span></div>
                    <div className="flex justify-between"><span>RC / manager@ / Test@123</span><span className="bg-sky-600 text-white rounded-full px-2">manager</span></div>
                    <div className="flex justify-between"><span>RC / employee@ / Test@123</span><span className="bg-amber-600 text-white rounded-full px-2">employee</span></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Login payload: <code>{'{email, password, org_acronym/acronym}'}</code> → JWT → stored <code>onehr_token + onehr_user + cookie onehr_auth</code>.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="font-bold text-sm text-emerald-800">Verify (2 min)</div>
                  <ul className="text-xs text-emerald-700 mt-1 space-y-1">
                    <li>• curl http://localhost:3001/v1/health → db:up</li>
                    <li>• Open / → hero → Login as employee → popup “Go to Attendance” → Clock In 98%</li>
                    <li>• As admin: People → Add Employee (modal) → appears in /admin Organizations count</li>
                    <li>• As anyone: Help → this guide (sidebar collapsed by default, click › to expand)</li>
                  </ul>
                </div>
                <div className="bg-slate-50 border rounded-xl p-4">
                  <div className="font-bold text-sm flex items-center gap-2"><Eye size={14} /> Sidebar tip</div>
                  <p className="text-xs text-slate-600 mt-1">Collapsed shows icons only (72px). Hover shows label via <code>title</code>. Expanded 280px shows sections & badges. Preference persists in <code>onehr_sidebar_collapsed</code>.</p>
                </div>
              </div>
            </div>
          </Section>

          {/* ROLES */}
          <Section id="roles" title="Roles & Journeys — Who Sees What" subtitle="UI is role-aware, API is source of truth (RbacGuard). super_admin/org_admin bypass all." icon={Users}>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Role</th><th className="p-2">Lands on</th><th className="text-left p-2">Can do</th><th className="p-2">Cannot</th></tr></thead>
                <tbody className="divide-y">
                  <tr><td className="p-2 font-mono text-xs bg-violet-600 text-white rounded">super_admin</td><td className="p-2 text-xs">/admin</td><td className="p-2 text-xs">Cross-org Organizations (+ Employees count), Onboarding Queue Assign Plan, all bypass</td><td className="p-2 text-xs">—</td></tr>
                  <tr><td className="p-2 font-mono">org_admin</td><td className="p-2 text-xs">/hr</td><td className="p-2 text-xs">Full org config, People CRUD, payroll, all HR</td><td className="p-2 text-xs">—</td></tr>
                  <tr><td className="p-2 font-mono">hr_admin</td><td className="p-2 text-xs">/hr</td><td className="p-2 text-xs">People, attendance, leave, exceptions, bulk, reports (no org config)</td><td className="p-2 text-xs">Org config</td></tr>
                  <tr><td className="p-2 font-mono">manager</td><td className="p-2 text-xs">/manager</td><td className="p-2 text-xs">My Team Today/Month, team leave approve (team only), workload</td><td className="p-2 text-xs">All-org views</td></tr>
                  <tr><td className="p-2 font-mono bg-amber-500 text-white rounded">employee</td><td className="p-2 text-xs">/employee → popup → /attendance</td><td className="p-2 text-xs">Self clock, leave request (edit/cancel/delete pending), payslip, docs, tasks</td><td className="p-2 text-xs">Approve, view others</td></tr>
                  <tr><td className="p-2 font-mono">executive</td><td className="p-2 text-xs">/executive</td><td className="p-2 text-xs">Health 89/100, attrition, cost, forecasts (read-only)</td><td className="p-2 text-xs">Edit</td></tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 rounded-xl p-3"><b>Middleware</b> (<code>middleware.ts</code>) protects <code>/hr, /employee, …</code> via <code>onehr_auth</code> cookie; unauth → /login?next=… . <b>Sidebar visible()</b> filters: super_admin/org_admin bypass; else role+perms+module gating (subscription.modules).</div>
              <div className="bg-violet-50 rounded-xl p-3"><b>Acronym is mandatory</b> at login for tenant isolation (<code>organization_id</code> + <code>sp_set_session_context</code>). Missing acronym → error “Organization acronym is required”. <b>Login</b> stores JWT, <b>Logout</b> clears localStorage + cookies.</div>
            </div>
          </Section>

          {/* MODULES */}
          <Section id="modules" title="Modules at a Glance — 44 Modules" subtitle="Search above to filter. Click to open. Badges = ID/QR or counts. Roles & perms gate visibility." icon={Layers}>
            <div className="space-y-6">
              {filteredModules.map(sec => (
                <div key={sec.pillar}>
                  <div className="text-[10px] tracking-[0.14em] font-bold text-slate-500 mb-2">{sec.pillar}</div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {sec.items.map(it => (
                      <Link key={it.label} href={it.href} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-slate-50 group">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-violet-600 transition"><it.icon size={16} /></div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm">{it.label}</div>
                          <div className="text-xs text-slate-500 truncate">{it.desc}</div>
                        </div>
                        <ChevronRight size={14} className="ml-auto text-slate-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {filteredModules.length === 0 && <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-xl">No modules match “{q}”.</div>}
            </div>
          </Section>

          {/* ATTENDANCE DEEP DIVE */}
          <Section id="attendance" title="Attendance — 7 Methods, One Truth" subtitle="Facial 98% + motion 0.8–12%, 90d retention, device sharing flagged. Net = Gross − Breaks." icon={Clock}>
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center"><Fingerprint size={20} className="mx-auto text-emerald-600" /><div className="font-bold text-sm mt-1">98% Verified</div><div className="text-xs text-emerald-700">FaceDetector + descriptor</div></div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"><Timer size={20} className="mx-auto text-amber-600" /><div className="font-bold text-sm mt-1">Net Working</div><div className="text-xs text-amber-700">Gross − Breaks → overtime</div></div>
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center"><ShieldCheck size={20} className="mx-auto text-violet-600" /><div className="font-bold text-sm mt-1">Flag, Don’t Accuse</div><div className="text-xs text-violet-700">Requires Review</div></div>
            </div>
            <ul className="text-sm text-slate-700 space-y-2">
              <li>• <b>Methods:</b> Mobile, Web, QR, Biometric device, Facial (98%), NFC/ID, API third-party.</li>
              <li>• <b>Capture:</b> <code>FaceCaptureModal</code> draws 160×120 canvas, frame diff motion %, counts 25 frames, needs motion 0.8–12% + FaceDetector → <code>liveness verified</code> → Snap base64 + face_meta.</li>
              <li>• <b>POST:</b> <code>/attendance/clock-in</code> with <code>face_snapshot_base64, face_meta, device_fingerprint, location {'{lat,lng,accuracy}'}, ip</code> → <code>work_sessions working</code>, 98%, event <code>facial verified</code>. Fail liveness → exception <code>suspicious_attendance</code>.</li>
              <li>• <b>Fraud flags:</b> device_sharing (same fingerprint 7d), duplicate_face (same hash 10m), suspicious_attendance (no face/motion), impossible travel, out_of_geofence — visible in Attendance → Exception Center & HR Command Center.</li>
              <li>• <b>GPS:</b> <code>navigator.geolocation</code> highAccuracy, timeout 8s, stored per clock; Live Map shows branches as 200m circles, points as markers; only if <code>consent_gps + org require_gps</code>.</li>
              <li>• <b>Missing clock-out:</b> session stays <code>working</code>, superadmin <code>PATCH admin/sessions/:id/clock-out {'{clockOutAt, reason}'}</code> or <code>POST admin/auto-close {'{date, clockOutAt}'}</code> (default 17:00).</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Link href="/attendance" className="bg-slate-900 text-white rounded-full px-4 py-2">Open Attendance →</Link>
              <Link href="/employee" className="glass rounded-full px-4 py-2">Employee Home (clock popup) →</Link>
            </div>
          </Section>

          {/* LEAVE */}
          <Section id="leave" title="Leave — Full Lifecycle (Patched 2026-09-06)" subtitle="Edit pending, cancel, hard-delete wrong entry, approve team only. UI Pencil/Ban/Trash/Check/X gated by status." icon={CalendarCheck}>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Endpoint</th><th className="p-2">Who</th><th className="text-left p-2">Rule</th></tr></thead>
                <tbody className="divide-y text-xs">
                  <tr><td className="p-2 font-mono">POST /leave/requests</td><td className="p-2">employee/manager/hr</td><td className="p-2">Resolves employeeId from JWT sub, calculates days, include leaveType</td></tr>
                  <tr><td className="p-2 font-mono">GET /leave/requests</td><td className="p-2">scoped</td><td className="p-2">employee own, manager team, hr all; include leaveType+employee</td></tr>
                  <tr><td className="p-2 font-mono">GET /leave/requests/:id</td><td className="p-2">scoped</td><td className="p-2">404/403 if not allowed</td></tr>
                  <tr><td className="p-2 font-mono">PATCH /leave/requests/:id</td><td className="p-2">owner/hr/manager-of-owner</td><td className="p-2">Only pending editable, partial leave_type_id/start/end/reason → recalcs days</td></tr>
                  <tr><td className="p-2 font-mono">PATCH /:id/cancel</td><td className="p-2">same</td><td className="p-2">pending|approved→cancelled (withdraw)</td></tr>
                  <tr><td className="p-2 font-mono">DELETE /:id</td><td className="p-2">same</td><td className="p-2">Hard delete pending only, else 403 Use cancel; {`{success:true,id}`}</td></tr>
                  <tr><td className="p-2 font-mono">PATCH /:id/approve|reject</td><td className="p-2">manager team, hr</td><td className="p-2">Only pending, employee blocked</td></tr>
                  <tr><td className="p-2 font-mono">GET /leave/balances/:employeeId</td><td className="p-2">self or hr</td><td className="p-2">With leaveType</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3">UI: <b>Leave page</b> left Request form → right Requests table: Type | Dates→Reason | Days | Status Pill | Actions. Pending shows Edit/Cancel/Delete/Approve/Reject; approved shows Cancel only; rejected/cancelled shows — . Modal prefilled → PATCH. Delete confirm: “This cannot be undone.”</p>
          </Section>

          {/* HR DAILY FLOW */}
          <Section id="hrflow" title="HR Daily Flow — From Morning to Payroll" subtitle="What Blessing clicks before lunch." icon={Compass}>
            <ol className="text-sm text-slate-700 space-y-2 list-decimal pl-5">
              <li><Link href="/hr" className="font-semibold underline">Command Center</Link> → scan Today: present/absent/late/on leave/exceptions 17. Note HR Health radar.</li>
              <li><Link href="/attendance" className="font-semibold underline">Attendance</Link> → Live Map Show Map? → exceptions table → bulk resolve? Snapshot retention 90d badge.</li>
              <li><Link href="/leave" className="font-semibold underline">Leave</Link> → pending approvals → approve team leaves, check balances.</li>
              <li><Link href="/employees" className="font-semibold underline">People</Link> → Add Employee if new hire; edit if grade/dept change.</li>
              <li><Link href="/payroll" className="font-semibold underline">Payroll</Link> → verify net minutes → run merge (basic+allowances−deductions−tax) → export.</li>
              <li><Link href="/reports" className="font-semibold underline">Reports</Link> → attendance CSV, department bar, workforce mix donut.</li>
              <li><Link href="/ai-copilot" className="font-semibold underline">Copilot</Link> → ask “pending probation” → cites policy.</li>
            </ol>
          </Section>

          {/* TECH DOCS */}
          <Section id="tech" title="Technical Documentation — Updated" subtitle="Source of truth lives in docs/. This panel summarizes and links to them. Sidebar Help sits under HELP link." icon={FileText}>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="border rounded-xl p-4">
                <h4 className="font-bold flex items-center gap-2"><FileText size={14} /> PRD (Product Requirements)</h4>
                <p className="text-slate-600 text-xs mt-1">Intelligent Workforce OS, 4 pillars (Manage People/Work/Measure/Predict), 6 layers (PEOPLE→INTELLIGENCE), 44 modules, personas (employee/manager/hr/executive/recruiter), principles: Activity≠Productivity, Opt-in, Flag don’t accuse.</p>
                <code className="text-xs bg-slate-50 border rounded px-2 py-1 mt-2 inline-block">docs/PRD.md</code>
              </div>
              <div className="border rounded-xl p-4">
                <h4 className="font-bold flex items-center gap-2"><Layers size={14} /> ERD & Schema</h4>
                <p className="text-slate-600 text-xs mt-1">MSSQL onehr_v2, 46 tables, sqlserver provider, NVarChar(Max) JSON, organization_id scoping, sp_set_session_context, indexes on (org_id, employee_code), partitioning attendance_events monthly.</p>
                <code className="text-xs bg-slate-50 border rounded px-2 py-1 mt-2 inline-block">docs/ERD.md + prisma/schema.prisma</code>
              </div>
              <div className="border rounded-xl p-4">
                <h4 className="font-bold flex items-center gap-2"><Plug size={14} /> API Spec</h4>
                <p className="text-slate-600 text-xs mt-1">Base /v1, JWT, X-Organization-Id, pagination cursor, Idempotency-Key, RLS. Endpoints: auth, organizations, employees, attendance (clock/break/sessions/live-map/exceptions), shifts, leave (full lifecycle §7), projects, performance, documents/assets, workflows, talent, policies, ai, analytics, admin.</p>
                <code className="text-xs bg-slate-50 border rounded px-2 py-1 mt-2 inline-block">docs/API_SPEC.md • swagger /api/docs</code>
              </div>
              <div className="border rounded-xl p-4">
                <h4 className="font-bold flex items-center gap-2"><Building2 size={14} /> Architecture</h4>
                <p className="text-slate-600 text-xs mt-1">Modular monolith → microservices. NestJS API Gateway (Auth/RBAC/RateLimit/Audit/Tenant), Core Domains, Platform Services (Workflow/BullMQ, Notification, Intelligence, RAG). Redis, S3, Meilisearch, pgvector, CloudFront, Socket.io, ECS/K8s. Clock &lt;500ms p95.</p>
                <code className="text-xs bg-slate-50 border rounded px-2 py-1 mt-2 inline-block">docs/ARCHITECTURE.md</code>
              </div>
              <div className="border rounded-xl p-4">
                <h4 className="font-bold flex items-center gap-2"><Lock size={14} /> RBAC</h4>
                <p className="text-slate-600 text-xs mt-1">9 roles, permission matrix (org_admin/hr_admin/manager/employee/executive), consent_face/gps, view_live_location, view_face_snapshot (audit), export_reports. RbacGuard: role+perms+manager_id filter; tenant RLS defense-in-depth.</p>
                <code className="text-xs bg-slate-50 border rounded px-2 py-1 mt-2 inline-block">docs/RBAC.md</code>
              </div>
              <div className="border rounded-xl p-4">
                <h4 className="font-bold flex items-center gap-2"><Route size={14} /> Roadmap</h4>
                <p className="text-slate-600 text-xs mt-1">Phase1 Foundation (MVP), Phase2 Operations (Activity, Exceptions, Fraud, Live Map), Phase3 Performance (Projects, Passport), Phase4 Intelligence (Health 89, Copilot RAG, Digital Twin). Patch 2026-09-06: Leave + ChatBot contrast.</p>
                <code className="text-xs bg-slate-50 border rounded px-2 py-1 mt-2 inline-block">docs/ROADMAP.md • docs/MANUAL.md</code>
              </div>
            </div>
            <div className="mt-4 bg-slate-900 text-white rounded-xl p-4 text-xs">
              <div className="font-bold">How docs sit under Help</div>
              <p className="text-white/70 mt-1">Sidebar → HELP → <b>Help • Docs (/help)</b> opens this Help Center (story + map + modules). Secondary items <b>Manual • PDF (/manual)</b>, About, Contact remain for quick jumps. All docs are also reachable as files in <code>docs/</code> and via <code>/public/manual.pdf</code>. For PDF inline, open <Link href="/manual" className="underline text-white">Manual page → iframe</Link>.</p>
            </div>
          </Section>

          {/* FAQ */}
          <Section id="faq" title="FAQ — Newbie Pitfalls" subtitle="90% of support tickets are answered here." icon={HelpCircle}>
            <div className="space-y-3 text-sm">
              {[
                { q: 'I can’t login — “Invalid credentials”', a: 'Three fields required: acronym + email + password. Acronym is tenant key (e.g. RC). Check caps. New orgs must be onboarded by super_admin first (pending → active). Demo: RC / admin@recruitconnect.ng / Admin@123' },
                { q: 'Why is the menu collapsed?', a: 'Sidebar is collapsed by default (72px icons-only) per 2026-09-09 requirement. Click the chevron › in the top bar to expand to 280px. Your preference is saved in localStorage onehr_sidebar_collapsed. On mobile, tap to expand.' },
                { q: 'Employee doesn’t see People or Payroll?', a: 'Expected — RBAC. Employee sees /employee + /attendance + /leave (own) + /id-cards + /documents (own). Manager sees team. hr_admin/org_admin see all. API enforces, not just UI — verified via RbacGuard + visible() filter + subscription gating.' },
                { q: 'Is facial/GPS mandatory? Privacy?', a: 'No. Both optional, consent-based, retention-controlled (90 days default, 30/90/365 configurable). Org policy sets required method (standard/gps/qr/facial). Without consent, fallback to standard clock. Snapshots audit-logged on view. NDPA/GDPR compliant.' },
                { q: 'Delete vs Cancel leave?', a: 'Delete = hard delete pending only (wrong entry, cannot undo). Else 403 “Only pending can be deleted. Use cancel”. Cancel = pending|approved → cancelled (withdraw). Edit = pending only, owner/hr/manager-of-owner, recalcs days.' },
                { q: 'Forgot to clock out — what now?', a: 'Session stays working with clockOutAt null. Superadmin/HR goes to Attendance → Missing Clock-Outs (amber card) → pick time per session → Set Clock-Out or Auto-close today at 17:00. Net recalculated, event api+adminSet, exception resolved.' },
                { q: 'Where is the Help link?', a: 'Sidebar → HELP section → Help • Docs (/help). This page replaces scattered docs. Also: Manual PDF (/manual) for printable 10-page guide, About and Contact in same section.' },
                { q: 'How are fraud flags handled?', a: 'Never auto-accused. Flags: device_sharing, duplicate_face, suspicious_attendance, impossible_travel, out_of_geofence → “Requires Review” in Exception Center + Command Center. HR bulk resolves after manual review.' },
              ].map(f => (
                <div key={f.q} className="border rounded-xl p-4">
                  <div className="font-bold">{f.q}</div>
                  <div className="text-slate-600 mt-1 leading-6">{f.a}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/contact" className="bg-slate-900 text-white rounded-full px-5 py-2 text-sm">Still stuck? Contact Us →</Link>
              <a href="mailto:hello@recruitconnect.ng" className="glass rounded-full px-5 py-2 text-sm">hello@recruitconnect.ng</a>
            </div>
          </Section>

          <div className="bg-gradient-to-br from-violet-600 to-sky-600 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h3 className="font-black text-lg">You’re ready.</h3>
              <p className="text-sm text-white/80">Pick your role and go: Employee → Attendance, HR → People, Super Admin → Organizations.</p>
              <p className="text-xs text-white/60 mt-1">Help center updated 2026-09-09 • Docs PRD/ERD/API_SPEC/ARCH/RBAC/ROADMAP/MANUAL in docs/ • Sidebar collapsed by default.</p>
            </div>
            <div className="flex gap-2 self-start">
              <Link href="/hr" className="bg-white text-slate-900 rounded-full px-5 py-2.5 text-sm font-semibold">HR Command Center</Link>
              <Link href="/attendance" className="bg-white/10 border border-white/20 rounded-full px-5 py-2.5 text-sm font-semibold">Attendance</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
