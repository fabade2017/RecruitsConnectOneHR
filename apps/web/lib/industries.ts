export type Industry = {
  slug: string;
  name: string;
  icon: 'banking' | 'schools' | 'hospitals' | 'manufacturing' | 'retail' | 'ngo';
  short: string;
  headline: string;
  subheadline: string;
  challenges: { title: string; desc: string }[];
  outcomes: { k: string; v: string; sub: string }[];
  solutions: { title: string; desc: string }[];
  proof: { quote: string; name: string; role: string; org: string } | null;
};

export const industries: Industry[] = [
  {
    slug: 'hospitals',
    name: 'Hospitals & Clinics',
    icon: 'hospitals',
    short: '24h rosters, shift handovers, staff credentials',
    headline: 'OneHR for Hospitals',
    subheadline:
      'Run 24-hour rosters, cut ghost workers from night shift, and keep every staff credential, shift and payslip audit-ready.',
    challenges: [
      { title: 'Night shift ghost workers', desc: 'Manual rosters let staff clock in for colleagues on night duty. Facial + GPS verification flags it.' },
      { title: 'Shift handover chaos', desc: 'Paper rosters mean nobody knows who is on duty. Live rosters show every shift, every ward, in real time.' },
      { title: 'Credential expiry', desc: 'Nursing and medical certifications lapse silently. OneHR tracks licences, expiry dates and renewal alerts.' },
      { title: 'Payroll across 3 shifts', desc: 'Day, evening and night allowances calculated manually. OneHR runs one payroll with shift rules applied.' },
    ],
    outcomes: [
      { k: 'Time-theft exposure', v: 'Cut', sub: 'buddy-punching on night shift' },
      { k: 'Roster build', v: 'From days', sub: 'to under an hour' },
      { k: 'Payroll accuracy', v: '99.9%', sub: 'shift-rule audited' },
      { k: 'Audit readiness', v: 'Always', sub: 'every shift logged' },
    ],
    solutions: [
      { title: '24-hour roster builder', desc: 'Ward-by-ward shift templates, handover notes and cover requests in one screen.' },
      { title: 'Face + GPS clocking', desc: 'Staff verify on the ward floor. Location is optional, consented and retention-controlled.' },
      { title: 'Credential & compliance tracking', desc: 'Licences, CPR and immunisation records with renewal alerts and audit export.' },
      { title: 'Shift-aware payroll', desc: 'Night and weekend allowances, overtime thresholds and deduction rules calculated once.' },
    ],
    proof: {
      quote:
        '24h rosters, facial clocking and exception flags stopped buddy-punching overnight. Audit-ready.',
      name: 'Dr. Emeka Okafor',
      role: 'Medical Director',
      org: 'Lagoon Hospitals',
    },
  },
  {
    slug: 'banking',
    name: 'Banking & Financial Services',
    icon: 'banking',
    short: 'Branch control, KYC, shift compliance',
    headline: 'OneHR for Banking',
    subheadline:
      'Control every branch, every teller and every shift with verified attendance, KYC-linked staff records and audit-grade reporting.',
    challenges: [
      { title: 'Branch attendance gaps', desc: 'Tellers clock in for each other during peak hours. Verified clocking plus exception flags stops it.' },
      { title: 'Scattered staff records', desc: 'Staff KYC and contracts live in a separate drive. OneHR links identity, documents and access.' },
      { title: 'Control-function reporting', desc: 'Audit wants evidence of who was present and who approved. Every action is logged.' },
      { title: 'Contractor churn', desc: 'Fixed-term staff and seasonal hires get lost in spreadsheets. One roster, one leave calendar.' },
    ],
    outcomes: [
      { k: 'Branch coverage', v: '48 live', sub: 'real-time presence' },
      { k: 'Payroll errors', v: '-92%', sub: 'after go-live' },
      { k: 'Audit prep', v: 'Days', sub: 'not weeks' },
      { k: 'Exception review', v: 'Same day', sub: 'not month-end' },
    ],
    solutions: [
      { title: 'Multi-branch attendance control', desc: 'Every branch, teller and field officer on one live roster with verified clock-ins.' },
      { title: 'Document and KYC vault', desc: 'Staff identity, contracts and certifications attached to the employee record.' },
      { title: 'Segregation-of-duty logging', desc: 'Who approved what, when — captured automatically for control testing.' },
      { title: 'Absence and leave control', desc: 'Leave requests route to the right approver per branch and grade.' },
    ],
    proof: {
      quote:
        'OneHR cut our payroll errors by 92% and gave us real-time visibility across 48 branches. HR Health is our new board metric.',
      name: 'Aisha Bello',
      role: 'CHRO',
      org: 'Sterling Bank',
    },
  },
  {
    slug: 'schools',
    name: 'Schools & Academies',
    icon: 'schools',
    short: 'Academic calendar, staff terms, exams',
    headline: 'OneHR for Schools',
    subheadline:
      'Plan staff around the academic calendar, run termly payroll cleanly, and give teachers back their time.',
    challenges: [
      { title: 'Academic calendar payroll', desc: 'Term-based pay, mid-term adjustments and prorated salaries are painful to compute.' },
      { title: 'Staff leave around exams', desc: 'Leave requests collide with exam weeks and results days.' },
      { title: 'Contractor and support staff', desc: 'Drivers, cooks, cleaners and guards sit outside the HR system.' },
      { title: 'Parent and staff queries', desc: 'Staff ask HR for their own payslip and attendance record constantly.' },
    ],
    outcomes: [
      { k: 'Termly payroll', v: '1 day', sub: 'from a full week' },
      { k: 'Leave clashes', v: '0', sub: 'caught before approval' },
      { k: 'Self-service', v: '24/7', sub: 'payslips & attendance' },
      { k: 'Term onboarding', v: 'Automated', sub: 'offer to payroll' },
    ],
    solutions: [
      { title: 'Academic calendar leave', desc: 'Blackout windows around exams automatically flag clashing leave requests.' },
      { title: 'Term-based payroll', desc: 'Salary scales, prorating and mid-term adjustments handled by rules, not spreadsheets.' },
      { title: 'Multi-role staff records', desc: 'Teachers, admin, drivers and support staff on one roster with role-based access.' },
      { title: 'Staff self-service', desc: 'Every employee sees their own payslip, attendance and leave balance without asking HR.' },
    ],
    proof: {
      quote:
        'Onboarding to alumni in one place. Our managers finally answer “What is happening right now?”',
      name: 'Funmi Adeyemi',
      role: 'CEO',
      org: 'EduBridge Academy',
    },
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing & Factory',
    icon: 'manufacturing',
    short: 'Shift patterns, overtime, safety certs',
    headline: 'OneHR for Manufacturing',
    subheadline:
      'Stop overtime bleeding, track shift patterns across lines, and keep safety certifications current automatically.',
    challenges: [
      { title: 'Uncontrolled overtime', desc: 'Overtime is approved on paper, after the fact, and often paid twice.' },
      { title: 'Rotating shift patterns', desc: 'Six-day, twelve-hour and night rotations break most attendance tools.' },
      { title: 'Safety certification lapses', desc: 'Machinery and safety training certificates expire without anyone tracking them.' },
      { title: 'Line-level absence', desc: 'Absenteeism on one line halts the whole production target.' },
    ],
    outcomes: [
      { k: 'Overtime spend', v: '-18%', sub: 'typical after 2 quarters' },
      { k: 'Absenteeism', v: '-35%', sub: 'with verified clocking' },
      { k: 'Cert tracking', v: 'Auto', sub: 'expiry alerts' },
      { k: 'Payroll accuracy', v: '99.9%', sub: 'shift rules applied' },
    ],
    solutions: [
      { title: 'Rotation-aware scheduling', desc: 'Six-day and twelve-hour patterns modelled properly, including rest-period rules.' },
      { title: 'Overtime guardrails', desc: 'Approve overtime against budget before it happens, not after the payroll run.' },
      { title: 'Safety certificate tracking', desc: 'Every operator’s certifications and expiry dates tracked with renewal reminders.' },
      { title: 'Line attendance visibility', desc: 'See absence patterns per line and shift and act before production is hit.' },
    ],
    proof: null,
  },
  {
    slug: 'retail',
    name: 'Retail & Multi-Branch',
    icon: 'retail',
    short: 'Store rosters, field staff, peak hours',
    headline: 'OneHR for Retail',
    subheadline:
      'Run store rosters, field staff and peak-season hiring from one place — without WhatsApp groups and paper timesheets.',
    challenges: [
      { title: 'Store-level churn', desc: 'High-turnover staff disappear between spreadsheets, leaving managers blind.' },
      { title: 'Peak hiring surge', desc: 'Seasonal staff onboard in days and need clocking access on day one.' },
      { title: 'Field and mobile staff', desc: 'Sales reps outside a branch need attendance that works on a phone, offline.' },
      { title: 'Timesheet disputes', desc: 'Managers chase paper timesheets and argue about hours every payday.' },
    ],
    outcomes: [
      { k: 'Payroll disputes', v: '-70%', sub: 'fewer queries' },
      { k: 'Onboarding time', v: '1 day', sub: 'instead of 1 week' },
      { k: 'Store coverage', v: 'Live', sub: 'per branch' },
      { k: 'Timesheet admin', v: '0', sub: 'no more paper' },
    ],
    solutions: [
      { title: 'Store rosters', desc: 'Shift templates, cover requests and clock-in coverage for every branch.' },
      { title: 'Fast onboarding', desc: 'Send a mobile invite and staff clock in the same day they accept.' },
      { title: 'Field staff clocking', desc: 'GPS-optional mobile clocking for reps working outside a branch.' },
      { title: 'Payroll dispute trail', desc: 'Every clock-in, edit and approval is logged so queries resolve in minutes.' },
    ],
    proof: null,
  },
  {
    slug: 'ngo',
    name: 'NGO & Development Org',
    icon: 'ngo',
    short: 'Donor grants, volunteers, field teams',
    headline: 'OneHR for NGOs',
    subheadline:
      'Keep donor-funded payroll clean, manage volunteers and field teams, and produce grant reports without a week of spreadsheets.',
    challenges: [
      { title: 'Donor payroll compliance', desc: 'Every payslip must trace to a grant line and a timesheet. Manual tracing takes days.' },
      { title: 'Volunteer records', desc: 'Volunteers and seasonal field workers are usually invisible to the HR system.' },
      { title: 'Field team locations', desc: 'Staff work across states with unreliable connectivity.' },
      { title: 'Grant reporting', desc: 'Report periods are compiled by hand from multiple spreadsheets.' },
    ],
    outcomes: [
      { k: 'Grant reporting', v: 'Hours', sub: 'not days' },
      { k: 'Audit trail', v: 'Complete', sub: 'payroll to grant' },
      { k: 'Field data', v: 'Offline', sub: 'syncs when online' },
      { k: 'Volunteers', v: 'Tracked', sub: 'in one directory' },
    ],
    solutions: [
      { title: 'Grant-coded payroll', desc: 'Cost centres and grant codes travel with each payslip line for instant traceability.' },
      { title: 'Volunteer management', desc: 'Volunteers, stipends and end-of-engagement records in the same directory.' },
      { title: 'Offline-capable clocking', desc: 'Field staff record hours without data, synced when a connection returns.' },
      { title: 'One-click grant reports', desc: 'Headcount, cost and attendance reports export in the format donors ask for.' },
    ],
    proof: null,
  },
];

export const industryBySlug = (slug: string) => industries.find(i => i.slug === slug);

export const industryIconName = (slug: string) => industryBySlug(slug)?.icon ?? 'retail';
