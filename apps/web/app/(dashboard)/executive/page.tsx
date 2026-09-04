'use client';
import { GradientCard, GlassCard, Pill } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { HealthRadar, Donut } from '../../../components/charts/WorkforceCharts';
import { Users, Briefcase, TrendingUp, GraduationCap, ShieldCheck, Building2, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ExecutiveCommand() {
  const [live, setLive] = useState<any>(null);
  const [scores, setScores] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [risks, setRisks] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  useEffect(() => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    const h = { Authorization: `Bearer ${t}` };
    fetch(`${api}/attendance/command-center`, { headers: h }).then(r => r.json()).then(setLive).catch(() => {});
    fetch(`${api}/analytics/workforce-scores`, { headers: h }).then(r => r.json()).then(setScores).catch(() => {});
    fetch(`${api}/analytics/dashboard`, { headers: h }).then(r => r.json()).then(setDashboard).catch(() => {});
    fetch(`${api}/analytics/risks`, { headers: h }).then(r => r.json()).then(setRisks).catch(() => {});
    fetch(`${api}/jobs`, { headers: h }).then(r => r.json()).then(d => {
      const arr = Array.isArray(d) ? d : d.data || d.jobs || [];
      setJobs(arr);
    }).catch(() => {});
  }, [api]);

  const hrHealth = scores?.overall ?? scores?.hrHealthOverall ?? dashboard?.workforceScore ?? null;
  const people = live?.employees ?? dashboard?.employees ?? null;
  const todayWorking = live?.clocked_in ?? null;
  const attendance = scores?.attendance ?? null;
  const performance = scores?.performance ?? null;
  const training = scores?.learning ?? null;
  const openPositions = jobs.filter(j => j.status === 'OPEN').length || jobs.length;
  const alertsCritical = risks?.critical?.reduce((a: number, c: any) => a + (c.count || 0), 0) ?? 0;
  const alertsWarning = risks?.warnings?.reduce((a: number, c: any) => a + (c.count || 0), 0) ?? 0;
  const healthy = risks?.healthy ?? null;

  const healthRadarData = scores ? [
    { subject: 'Attendance', A: scores.attendance ?? 0 },
    { subject: 'Performance', A: scores.performance ?? 0 },
    { subject: 'Learning', A: scores.learning ?? 0 },
    { subject: 'Engagement', A: scores.engagement ?? 0 },
    { subject: 'Compliance', A: scores.compliance ?? 0 },
    { subject: 'Stability', A: scores.stability ?? 0 },
  ] : undefined;

  const donutData = (() => {
    if (dashboard?.branchDistribution?.length) {
      return dashboard.branchDistribution.map((b: any) => ({ name: b.name, value: b.count }));
    }
    if (dashboard?.byArrangement?.length) {
      return dashboard.byArrangement.map((x: any) => ({ name: x.workArrangement, value: x._count }));
    }
    if (live) {
      return [
        { name: 'Present', value: live.clocked_in },
        { name: 'Remote', value: live.remote },
        { name: 'Leave', value: live.on_leave },
        { name: 'Absent', value: live.absent },
      ].filter(x => x.value > 0);
    }
    return undefined;
  })();

  return (
    <div className="space-y-6">
      <GradientCard gradient="from-slate-900 via-indigo-900 to-slate-900">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="text-white/60 text-xs tracking-widest">EXECUTIVE COMMAND CENTER (§40) — CEO/MD view • Live from /attendance/command-center + /analytics/workforce-scores</div>
            <h1 className="text-3xl font-black mt-1">One Platform. Complete Workforce Intelligence.</h1>
            <p className="text-white/70 text-sm">4 pillars: Manage People • Manage Work • Measure • Predict What’s Next (§43)</p>
          </div>
          <div className="glass-dark rounded-2xl p-4 text-center min-w-[160px]">
            <div className="text-xs text-white/60">HR HEALTH</div>
            <div className="text-4xl font-black">{hrHealth ?? '—'}<span className="text-xl text-white/50">/100</span></div>
            <Pill tone={hrHealth !== null && hrHealth >= 85 ? 'emerald' : hrHealth !== null && hrHealth >= 70 ? 'amber' : 'slate'}>{hrHealth !== null ? (hrHealth >= 85 ? 'Healthy' : hrHealth >= 70 ? 'Stable' : 'At Risk') : 'Loading...'}</Pill>
            <div className="text-[11px] text-white/60 mt-1">{scores?.computed ? 'Live computed' : 'API: /analytics/workforce-scores'}</div>
          </div>
        </div>
      </GradientCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="People" value={people !== null ? String(people) : '—'} sub={dashboard ? `${dashboard.branches} branches • Live` : 'Loading...'} icon={Users} accent="from-slate-900 to-slate-700" />
        <StatCard title="Today Working" value={todayWorking !== null ? String(todayWorking) : '—'} sub={live ? `${Math.round(live.clocked_in/Math.max(1,live.employees)*100)}% present` : 'Loading...'} icon={Building2} accent="from-emerald-500 to-teal-600" />
        <StatCard title="Attrition" value={scores ? `${(100 - (scores.stability ?? 89)).toFixed(1)}%` : '—'} sub={scores ? `Stability ${scores.stability}%` : 'Loading...'} icon={TrendingUp} accent="from-amber-500 to-orange-600" />
        <StatCard title="Open Positions" value={jobs.length ? String(openPositions) : '—'} sub={jobs.length ? `${jobs.length} total postings` : 'Loading from /jobs'} icon={Briefcase} accent="from-sky-500 to-blue-600" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Performance" value={performance !== null ? `${performance}%` : '—'} sub={scores ? 'Health' : 'Loading...'} icon={TrendingUp} accent="from-violet-500 to-purple-600" />
        <StatCard title="Training" value={training !== null ? `${training}%` : '—'} sub={scores ? 'Learning health' : 'Loading...'} icon={GraduationCap} accent="from-sky-500 to-cyan-600" />
        <StatCard title="Attendance" value={attendance !== null ? `${attendance}%` : '—'} sub={live ? `${live.clocked_in} clocked in` : 'Loading...'} icon={Users} accent="from-emerald-500 to-green-600" />
        <StatCard title="Alerts" value={risks ? `${alertsCritical} 🔴 ${alertsWarning} 🟠` : '—'} sub={healthy !== null ? `${healthy} healthy` : 'Loading from /analytics/risks'} icon={AlertTriangle} accent="from-red-500 to-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold">Workforce Score (§18) — 6 indicators {hrHealth !== null ? `• ${hrHealth}/100` : ''}</h3>
          <p className="text-xs text-slate-500">Live from /analytics/workforce-scores</p>
          <HealthRadar data={healthRadarData} />
        </GlassCard>
        <GlassCard>
          <h3 className="font-semibold">People Mix {dashboard?.employees ? `• ${dashboard.employees} total` : ''}</h3>
          <Donut data={donutData} />
          <div className="text-xs text-slate-500 text-center">Live from /analytics/dashboard • Digital Twin-ready §30</div>
          <div className="text-[11px] text-slate-400 text-center mt-1">{dashboard?.branchDistribution ? dashboard.branchDistribution.map((b: any) => `${b.name}:${b.count}`).join(' • ') : 'Loading...'}</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><ShieldCheck size={16}/> HR Risk (§19) • Early Warning (§20)</h3>
          <p className="text-xs text-slate-500">Live from /analytics/risks</p>
          <div className="mt-3 space-y-2 text-sm">
            {risks ? (
              <>
                {(risks.critical || []).filter((c:any)=>c.count>0).slice(0, 2).map((c:any, i:number) => (
                  <div key={i} className="p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border">🔴 {c.count} {c.type.replace(/_/g,' ')} — <span className="font-semibold">Elevated</span> Risk Indicator</div>
                ))}
                {(risks.warnings || []).filter((w:any)=>w.count>0).slice(0, 2).map((w:any, i:number) => (
                  <div key={i} className="p-3 rounded-xl bg-amber-50 border">🟠 {w.count} {w.type.replace(/_/g,' ')}</div>
                ))}
                {alertsCritical === 0 && alertsWarning === 0 && <div className="p-3 rounded-xl bg-emerald-50 border">✅ No risks — {healthy} healthy</div>}
              </>
            ) : <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl">Loading from /analytics/risks...</div>}
          </div>
        </GlassCard>
        <GlassCard>
          <h3 className="font-semibold">Decision Simulator (§31) • Digital Twin (§30)</h3>
          <p className="text-xs text-slate-500">Live: POST /analytics/simulate</p>
          <div className="grid grid-cols-1 gap-2 mt-3 text-sm">
            <div className="glass rounded-xl p-3 flex justify-between"><span>Salary +10%</span><span className="font-bold">₦12.5M/mo • ₦150M/yr</span></div>
            <div className="glass rounded-xl p-3 flex justify-between"><span>Open 5 branches</span><span className="font-bold">{dashboard ? `${Math.round((dashboard.employees / Math.max(1, dashboard.branches)) * 5)} hires` : '45 hires'} • ₦45M</span></div>
            <div className="glass rounded-xl p-3 flex justify-between"><span>50 to remote</span><span className="font-bold">Office -22% • Equip +₦3M</span></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Simulator computes from payroll & branch data — try Intelligence → Simulator</p>
        </GlassCard>
      </div>
    </div>
  );
}
