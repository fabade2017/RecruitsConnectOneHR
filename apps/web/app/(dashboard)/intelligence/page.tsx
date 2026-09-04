'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { Brain, TrendingUp, AlertTriangle, Activity, RefreshCw, Sparkles, ShieldCheck, Users } from 'lucide-react';

export default function IntelligencePage() {
  const [scores, setScores] = useState<any>(null);
  const [risks, setRisks] = useState<any>(null);
  const [simulate, setSimulate] = useState<any>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/analytics/workforce-scores`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setScores).catch(() => {});
    fetch(`${api}/analytics/risks`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setRisks).catch(() => {});
  };
  useEffect(load, [api]);

  const runSim = async (scenario: string) => {
    const t = localStorage.getItem('onehr_token');
    const body = scenario === 'salary_increase' ? { scenario, percentage: 10 } : { scenario };
    const res = await fetch(`${api}/analytics/simulate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(body) });
    const d = await res.json();
    setSimulate(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="text-violet-600" /> Workforce Intelligence <span className="text-slate-500 font-normal">— HR Health §32</span></h1>
          <p className="text-sm text-slate-500">6 health scores → Risk engine → Early warnings → Simulator → Digital Twin</p>
        </div>
        <button onClick={load} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="HR Health" value={String(scores?.overall ?? scores?.hrHealthOverall ?? 89)} sub="Overall §32" icon={Activity} accent="from-violet-500 to-purple-600" />
        <StatCard title="Attendance" value={String(scores?.attendance ?? 94)} sub="Health" icon={Users} accent="from-emerald-500 to-teal-600" />
        <StatCard title="Risks" value={String(risks?.critical?.reduce((a: number, c: any) => a + (c.count || 0), 0) ?? 3)} sub="Critical" icon={AlertTriangle} accent="from-amber-500 to-orange-600" />
        <StatCard title="Simulator" value="Live" sub="POST /analytics/simulate" icon={TrendingUp} accent="from-sky-500 to-blue-600" />
      </div>

      {scores && (
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Activity size={16} /> Live Scores</h3>
          <pre className="mt-2 bg-slate-50 rounded-xl p-3 text-xs overflow-auto max-h-[160px]">{JSON.stringify(scores, null, 2)}</pre>
        </GlassCard>
      )}

      {risks && (
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><ShieldCheck size={16} /> Risk Engine</h3>
          <pre className="mt-2 bg-amber-50 rounded-xl p-3 text-xs overflow-auto max-h-[200px]">{JSON.stringify(risks, null, 2)}</pre>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <h4 className="font-semibold text-sm flex items-center gap-2"><TrendingUp size={14} /> Simulate Salary +10%</h4>
          <button onClick={() => runSim('salary_increase')} className="mt-3 w-full bg-slate-900 text-white rounded-xl py-2 text-sm">Run Simulator</button>
          <p className="text-xs text-slate-500 mt-2">POST /v1/analytics/simulate {'{scenario:"salary_increase",percentage:10}'}</p>
        </GlassCard>
        <GlassCard>
          <h4 className="font-semibold text-sm flex items-center gap-2"><Users size={14} /> Digital Twin — 5 Branches</h4>
          <button onClick={() => runSim('open_5_branches')} className="mt-3 w-full bg-violet-600 text-white rounded-xl py-2 text-sm">Estimate</button>
          <p className="text-xs text-slate-500 mt-2">GET /v1/analytics/digital-twin?scenario=open_5_branches</p>
        </GlassCard>
        <GradientCard gradient="from-violet-600 via-indigo-600 to-violet-700">
          <h4 className="font-semibold flex items-center gap-2"><Sparkles size={14} /> AI Copilot</h4>
          <p className="text-sm text-white/90 mt-2">Ask “Who is at risk?” → scoped to RBAC. Try AI Copilot → HR Mode.</p>
          <a href="/ai-copilot" className="mt-3 inline-flex bg-white text-violet-700 rounded-xl px-4 py-2 text-sm font-semibold">Open Copilot</a>
        </GradientCard>
      </div>

      {simulate && (
        <GlassCard>
          <h3 className="font-semibold">Simulator Result</h3>
          <pre className="mt-2 bg-slate-50 rounded-xl p-3 text-xs overflow-auto max-h-[200px]">{JSON.stringify(simulate, null, 2)}</pre>
        </GlassCard>
      )}
    </div>
  );
}
