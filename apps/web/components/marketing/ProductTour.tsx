'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Banknote, Check, Clock, Fingerprint, MapPin, Play, ShieldAlert,
  TrendingUp, Users, Wallet, CircleAlert, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react';

type Step = {
  id: string;
  tab: string;
  headline: string;
  blurb: string;
};

const STEPS: Step[] = [
  {
    id: 'payroll',
    tab: 'Run payroll',
    headline: 'Payroll for 240 staff, closed in minutes',
    blurb: 'Import last month\u2019s payslips, let OneHR merge payroll, then approve one run. Bank files export ready for your accountant.',
  },
  {
    id: 'attendance',
    tab: 'Check attendance',
    headline: 'See who is in, who is out, across every branch',
    blurb: 'Live attendance from mobile, QR, biometric and facial clocking. No more WhatsApp screenshots of paper registers.',
  },
  {
    id: 'fraud',
    tab: 'Catch fraud',
    headline: 'Exceptions queue themselves \u2014 you just review',
    blurb: 'Duplicate faces, impossible travel, device sharing and missed shifts are flagged for review. Never auto-accused, always resolved by HR.',
  },
  {
    id: 'numbers',
    tab: 'See the numbers',
    headline: 'One health score the whole company trusts',
    blurb: 'Attendance, exceptions, leave and payroll accuracy roll into a single HR Health number your board can read in ten seconds.',
  },
];

const PAYROLL_ROWS = [
  { name: 'Aisha Bello', dept: 'Finance', gross: '₦1,850,000', ded: '₦284,300', net: '₦1,565,700', ok: true },
  { name: 'Emeka Okafor', dept: 'Operations', gross: '₦1,420,000', ded: '₦196,400', net: '₦1,223,600', ok: true },
  { name: 'Funmi Adeyemi', dept: 'People', gross: '₦980,000', ded: '₦121,500', net: '₦858,500', ok: true },
  { name: 'Chinedu Okafor', dept: 'Field', gross: '₦640,000', ded: '₦92,000', net: '₦548,000', ok: true },
  { name: 'Amaka Eze', dept: 'Support', gross: '₦610,000', ded: '₦88,700', net: '₦521,300', ok: false },
];

const ATTENDANCE_ROWS = [
  { name: 'Aisha Bello', branch: 'Victoria Island', in: '07:58', method: 'Mobile + Face', ok: true },
  { name: 'Emeka Okafor', branch: 'Ikeja', in: '08:02', method: 'QR', ok: true },
  { name: 'Funmi Adeyemi', branch: 'Lekki', in: '08:04', method: 'Facial \u00b7 98%', ok: true },
  { name: 'Chinedu Okafor', branch: 'Abuja (field)', in: '08:41', method: 'GPS \u00b7 opt-in', ok: true },
  { name: 'Amaka Eze', branch: 'Apapa', in: '09:12', method: 'Late \u00b7 42m', ok: false },
];

const FRAUD_ROWS = [
  { title: 'Duplicate face match', detail: 'RC-000245 and RC-000311 clocked in 90 seconds apart, same device fingerprint.', amount: 'Flagged \u00b7 not charged', tone: 'red' },
  { title: 'Impossible travel', detail: 'Clock-in recorded in Lagos and Abuja within 25 minutes.', amount: 'Review \u00b7 2 devices', tone: 'amber' },
  { title: 'Missed shift, no leave', detail: '3 unrostered absences this month across 2 branches.', amount: 'Saved \u00b7 \u20a6120,000', tone: 'emerald' },
];

function PayrollPanel() {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
        <div>
          <div className="text-xs tracking-widest text-slate-500">PAYROLL RUN \u00b7 MARCH</div>
          <div className="font-bold text-sm">240 employees \u00b7 Ready for approval</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs bg-amber-50 text-amber-700 rounded-full px-2.5 py-1 font-semibold">1 needs review</span>
          <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 font-semibold">Merged</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-[10px] sm:text-[11px] tracking-widest text-slate-400 border-b">
              <th className="px-4 py-2 font-semibold">EMPLOYEE</th>
              <th className="px-3 py-2 font-semibold">GROSS</th>
              <th className="px-3 py-2 font-semibold">DEDUCTIONS</th>
              <th className="px-3 py-2 font-semibold">NET</th>
              <th className="px-3 py-2 font-semibold">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {PAYROLL_ROWS.map(r => (
              <tr key={r.name} className="border-b last:border-0">
                <td className="px-4 py-2.5">
                  <div className="font-semibold whitespace-nowrap">{r.name}</div>
                  <div className="text-[11px] text-slate-500">{r.dept}</div>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{r.gross}</td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{r.ded}</td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums font-semibold">{r.net}</td>
                <td className="px-3 py-2.5">
                  {r.ok
                    ? <span className="inline-flex items-center gap-1 text-emerald-700"><Check size={13} /> Ready</span>
                    : <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert size={13} /> Check</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500">Bank file ready \u00b7 PAE-ready \u00b7 Audit log written</span>
        <span className="bg-slate-900 text-white text-xs font-semibold rounded-full px-4 py-2">Approve &amp; pay</span>
      </div>
    </div>
  );
}

function AttendancePanel() {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
        <div>
          <div className="text-xs tracking-widest text-slate-500">LIVE ATTENDANCE \u00b7 TODAY</div>
          <div className="font-bold text-sm">4 branches \u00b7 218 of 240 present</div>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 font-semibold">91% present</span>
      </div>
      <div className="divide-y">
        {ATTENDANCE_ROWS.map(r => (
          <div key={r.name} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{r.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{r.branch}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold tabular-nums">{r.in}</div>
              <div className={`text-[11px] ${r.ok ? 'text-slate-500' : 'text-amber-600 font-semibold'}`}>{r.method}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t bg-slate-50 grid grid-cols-3 gap-2 text-center">
        <div><div className="text-sm font-black">7</div><div className="text-[10px] text-slate-500">clocking methods</div></div>
        <div><div className="text-sm font-black">98%</div><div className="text-[10px] text-slate-500">face match rate</div></div>
        <div><div className="text-sm font-black">GPS</div><div className="text-[10px] text-slate-500">opt-in only</div></div>
      </div>
    </div>
  );
}

function FraudPanel() {
  const toneMap: Record<string, string> = {
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
        <div>
          <div className="text-xs tracking-widest text-slate-500">EXCEPTION QUEUE</div>
          <div className="font-bold text-sm">3 items for HR review today</div>
        </div>
        <span className="text-xs bg-red-50 text-red-700 rounded-full px-2.5 py-1 font-semibold">Auto-flagged</span>
      </div>
      <div className="p-4 space-y-3">
        {FRAUD_ROWS.map(f => (
          <div key={f.title} className={`rounded-xl border p-3 ${toneMap[f.tone]}`}>
            <div className="flex items-start gap-2">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-bold">{f.title}</div>
                <div className="text-xs opacity-90 mt-0.5 leading-5">{f.detail}</div>
                <div className="text-[11px] font-semibold mt-1.5 uppercase tracking-wide">{f.amount}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t bg-slate-50 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">Fraud is flagged, never auto-charged</span>
        <span className="bg-slate-900 text-white text-xs font-semibold rounded-full px-4 py-2">Open queue</span>
      </div>
    </div>
  );
}

function NumbersPanel() {
  const bars = [
    { k: 'Attendance accuracy', v: 96 },
    { k: 'Payroll accuracy', v: 99 },
    { k: 'Exceptions resolved', v: 91 },
    { k: 'On-time payroll', v: 100 },
    { k: 'Policy compliance', v: 88 },
  ];
  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
        <div>
          <div className="text-xs tracking-widest text-slate-500">WORKFORCE COMMAND CENTER</div>
          <div className="font-bold text-sm">Last 30 days</div>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 font-semibold">HR Health 89/100</span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-slate-900 text-white rounded-xl p-4">
          <div className="text-[10px] tracking-widest text-white/60">PAYROLL SAVED THIS MONTH</div>
          <div className="text-2xl font-black mt-1 tabular-nums">₦1,284,000</div>
          <div className="text-[11px] text-emerald-300 mt-1">92% fewer payroll errors</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-[10px] tracking-widest text-slate-500">GHOST WORKERS BLOCKED</div>
          <div className="text-2xl font-black mt-1 tabular-nums">14</div>
          <div className="text-[11px] text-slate-500 mt-1">₦420,000 not paid out</div>
        </div>
        {bars.map(b => (
          <div key={b.k} className="col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">{b.k}</span>
              <span className="font-bold tabular-nums">{b.v}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-sky-500" style={{ width: `${b.v}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PANELS: Record<string, () => JSX.Element> = {
  payroll: PayrollPanel,
  attendance: AttendancePanel,
  fraud: FraudPanel,
  numbers: NumbersPanel,
};

export default function ProductTour() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => setActive(a => (a + 1) % STEPS.length), 7000);
    return () => clearTimeout(timer.current);
  }, [active, playing]);

  const step = STEPS[active];
  const Panel = PANELS[step.id];

  return (
    <section id="tour" className="bg-slate-50 border-y">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex bg-violet-50 text-violet-700 rounded-full px-3 py-1 text-xs font-semibold">60-SECOND PRODUCT TOUR</div>
          <h2 className="text-3xl font-black mt-3">See it working. Not a screenshot.</h2>
          <p className="text-slate-600 mt-2">
            Click through the four screens a CFO, an HR lead and a branch manager actually use every week.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setActive(i); setPlaying(false); }}
              className={`rounded-full px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 border transition ${
                i === active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {i === active && <Play size={13} />}
              {s.tab}
            </button>
          ))}
        </div>

        <div className="mt-8 grid lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border p-6 h-full flex flex-col justify-between">
              <div>
                <div className="text-xs tracking-widest text-slate-400">STEP {String(active + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}</div>
                <h3 className="text-xl font-black mt-2 leading-snug">{step.headline}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-6">{step.blurb}</p>
              </div>
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setActive(a => (a - 1 + STEPS.length) % STEPS.length); setPlaying(false); }}
                    className="w-9 h-9 rounded-full border bg-white flex items-center justify-center hover:bg-slate-50"
                    aria-label="Previous step"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setActive(a => (a + 1) % STEPS.length)}
                    className="w-9 h-9 rounded-full border bg-white flex items-center justify-center hover:bg-slate-50"
                    aria-label="Next step"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => setPlaying(p => !p)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    {playing ? 'Pause autoplay' : 'Autoplay'}
                  </button>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  {STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setActive(i); setPlaying(false); }}
                      aria-label={`Go to ${s.tab}`}
                      className={`h-1.5 rounded-full transition-all ${i === active ? 'w-8 bg-slate-900' : 'w-3 bg-slate-300'}`}
                    />
                  ))}
                </div>
                <Link href="/register" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:gap-3 transition-all">
                  Try it free for 14 days <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div key={step.id} className="animate-[fadeUp_.35s_ease-out]">
              <Panel />
            </div>
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-3">
          {[
            { icon: Wallet, t: 'Payroll that reconciles itself', d: 'Merge last month\u2019s payslips and let the rules do the maths.' },
            { icon: Fingerprint, t: 'Attendance you can prove', d: 'Seven clocking methods, every shift and edit logged.' },
            { icon: TrendingUp, t: 'Numbers your board trusts', d: 'One health score instead of six disconnected reports.' },
          ].map(x => (
            <div key={x.t} className="bg-white rounded-2xl border p-5 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><x.icon size={18} /></div>
              <div>
                <div className="font-bold text-sm">{x.t}</div>
                <div className="text-xs text-slate-600 mt-1 leading-5">{x.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
