'use client';
import { useEffect, useState } from 'react';
import { BarChart3, Check, CircleAlert, Clock, ShieldCheck } from 'lucide-react';

function LiveStats() {
  const [stats, setStats] = useState<{ employees?: number; clockedIn?: number; exceptions?: number; onLeave?: number; loading: boolean }>({ loading: true });
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
    const headers: any = {};
    try {
      const t = localStorage.getItem('onehr_token');
      if (t) headers.Authorization = `Bearer ${t}`;
    } catch {}
    const fetchStats = async () => {
      try {
        const [ccRes, exRes] = await Promise.all([
          fetch(`${base}/attendance/command-center`, { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${base}/attendance/exceptions?limit=1`, { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (ccRes) {
          const emp = ccRes.totalEmployees ?? ccRes.employees ?? 0;
          const ci = ccRes.clockedIn ?? ccRes.present ?? 0;
          const ol = ccRes.onLeave ?? ccRes.leave ?? 0;
          const exCount = Array.isArray(exRes) ? exRes.length : exRes?.total ?? exRes?.count ?? 0;
          setStats({ employees: emp, clockedIn: ci, exceptions: exCount || ccRes.exceptions || 0, onLeave: ol, loading: false });
          return;
        }
        const orgs = await fetch(`${base}/admin/organizations`, { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
        if (orgs) {
          const list = Array.isArray(orgs) ? orgs : (orgs.data || []);
          setStats({ employees: list.reduce((s: number, o: any) => s + (o._count?.employees || 0), 0), clockedIn: undefined, exceptions: undefined, onLeave: undefined, loading: false });
          return;
        }
        setStats({ loading: false });
      } catch { setStats({ loading: false }); }
    };
    fetchStats();
  }, []);
  const tiles = [
    { k: 'Employees', v: stats.loading ? '—' : (stats.employees ?? '—'), c: 'bg-slate-900 text-white' },
    { k: 'Clocked In', v: stats.loading ? '—' : (stats.clockedIn != null ? `${stats.clockedIn}${stats.employees ? ` • ${Math.round((stats.clockedIn / Math.max(1, stats.employees)) * 100)}%` : ''}` : '—'), c: 'bg-emerald-500 text-white' },
    { k: 'Exceptions', v: stats.loading ? '—' : (stats.exceptions ?? '—'), c: 'bg-red-500 text-white' },
    { k: 'On Leave', v: stats.loading ? '—' : (stats.onLeave ?? '—'), c: 'bg-sky-500 text-white' },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 mt-4">
      {tiles.map(s => <div key={s.k} className={`rounded-2xl p-3 ${s.c}`}><div className="text-[11px] opacity-80">{s.k}</div><div className="font-bold">{s.v}</div></div>)}
    </div>
  );
}

const VIEWS = [
  {
    id: 'payroll',
    label: 'Payroll run',
    lines: [
      { left: 'March payroll · 240 staff', right: 'Ready for approval', tone: 'ok' },
      { left: 'Gross ₦96,420,000', right: 'Merged from last cycle', tone: 'ok' },
      { left: 'Deductions & tax', right: 'Applied automatically', tone: 'ok' },
      { left: 'Bank file', right: 'Export ready', tone: 'ok' },
    ],
  },
  {
    id: 'attendance',
    label: 'Live attendance',
    lines: [
      { left: 'Victoria Island', right: '184 / 192 present', tone: 'ok' },
      { left: 'Ikeja', right: '96 / 104 present', tone: 'ok' },
      { left: 'Lekki', right: '71 / 78 present', tone: 'warn' },
      { left: 'Field staff', right: 'GPS · opt-in', tone: 'ok' },
    ],
  },
  {
    id: 'exceptions',
    label: 'Exceptions',
    lines: [
      { left: 'Duplicate face match', right: 'Flagged for review', tone: 'bad' },
      { left: 'Impossible travel', right: 'Flagged for review', tone: 'bad' },
      { left: 'Unapproved overtime', right: '2 need approval', tone: 'warn' },
      { left: 'Missed shift', right: 'Resolved', tone: 'ok' },
    ],
  },
];

export default function HeroPreview() {
  const [view, setView] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setView(v => (v + 1) % VIEWS.length), 4500);
    return () => clearTimeout(t);
  }, [view]);

  const active = VIEWS[view];

  return (
    <div className="relative">
      <div className="bg-slate-900 rounded-[24px] p-3 shadow-2xl">
        <div className="bg-white rounded-[16px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] sm:text-xs tracking-widest text-slate-500">WORKFORCE COMMAND CENTER • TODAY</div>
            <span className="text-[10px] sm:text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-1 font-semibold whitespace-nowrap">HR Health 89/100</span>
          </div>

          <LiveStats />

          <div className="mt-4 rounded-2xl border overflow-hidden">
            <div className="flex gap-1 p-1 bg-slate-50">
              {VIEWS.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setView(i)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] sm:text-[11px] font-semibold transition ${
                    i === view ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="p-3 space-y-2">
              {active.lines.map(l => (
                <div key={l.left} className="flex items-center justify-between gap-3 text-[11px] sm:text-xs">
                  <span className="text-slate-600 truncate">{l.left}</span>
                  <span className={`font-semibold whitespace-nowrap ${
                    l.tone === 'ok' ? 'text-emerald-600' : l.tone === 'warn' ? 'text-amber-600' : 'text-red-500'
                  }`}>{l.right}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
            <div className="bg-slate-50 rounded-xl p-2 text-center">Face 98% ✓</div>
            <div className="bg-slate-50 rounded-xl p-2 text-center">GPS opt-in</div>
            <div className="bg-slate-50 rounded-xl p-2 text-center">7 methods</div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center"><ShieldCheck size={18} /></div>
        <div>
          <div className="font-semibold text-sm">Verified clock-in</div>
          <div className="text-xs text-slate-500">RC-000245 • Mobile • 08:02</div>
        </div>
      </div>

      <div className="absolute -top-3 -right-2 sm:right-4 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-slate-700">
        <Clock size={13} className="text-emerald-600" /> 6 exceptions to review
      </div>
    </div>
  );
}

export { LiveStats };
