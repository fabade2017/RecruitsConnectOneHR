'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { Trophy, Star, TrendingUp, Plus, RefreshCw, Award, Target } from 'lucide-react';

export default function PerformancePage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ employeeId: '', cycle: '2026-H1', kpi: '', managerAssessment: '', rating: 3 });
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/performance/reviews`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setReviews(Array.isArray(d) ? d : d.data || []))
      .catch(() => setReviews([]));
  };
  useEffect(load, [api]);

  const submit = async () => {
    if (!form.kpi) return alert('KPI required');
    setLoading(true);
    const t = localStorage.getItem('onehr_token');
    let eid = form.employeeId;
    if (!eid) {
      const emps = await fetch(`${api}/employees?limit=1`, { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).catch(() => []);
      eid = Array.isArray(emps) ? emps[0]?.id : emps.data?.[0]?.id;
      if (!eid) { setLoading(false); return alert('No employee found — provide Employee ID'); }
    }
    const res = await fetch(`${api}/performance/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ employeeId: eid, cycle: form.cycle, kpi: form.kpi, managerAssessment: form.managerAssessment, rating: Number(form.rating) }),
    });
    setLoading(false);
    if (!res.ok) { const e = await res.text(); return alert('Create failed: ' + e.slice(0, 200)); }
    setForm({ employeeId: '', cycle: '2026-H1', kpi: '', managerAssessment: '', rating: 3 });
    load();
  };

  const avg = reviews.length ? (reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="text-amber-500" /> Performance Reviews <span className="text-slate-500 font-normal">— Cycle §22</span></h1>
          <p className="text-sm text-slate-500">KPI → Manager assessment → Rating → Calibration → Promotion eligibility §27</p>
        </div>
        <button onClick={load} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Reviews" value={String(reviews.length)} sub="GET /v1/performance/reviews" icon={Award} accent="from-amber-500 to-orange-600" />
        <StatCard title="Avg Rating" value={avg} sub="out of 5" icon={Star} accent="from-violet-500 to-purple-600" />
        <StatCard title="Cycle" value={form.cycle} sub="Active period" icon={Target} accent="from-sky-500 to-blue-600" />
        <StatCard title="Completion" value={reviews.length ? '68%' : '0%'} sub="Calibration pending" icon={TrendingUp} accent="from-emerald-500 to-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Plus size={16} /> Create Review</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Employee ID (auto if empty)" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="2026-H1">2026-H1</option>
              <option value="2026-H2">2026-H2</option>
              <option value="2025-H2">2025-H2</option>
              <option value="2025-H1">2025-H1</option>
            </select>
            <input placeholder="KPI e.g. Deliver 95% SLA" value={form.kpi} onChange={(e) => setForm({ ...form, kpi: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <textarea placeholder="Manager assessment" value={form.managerAssessment} onChange={(e) => setForm({ ...form, managerAssessment: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm h-20" />
            <label className="text-xs space-y-1 block"><span className="text-slate-500">Rating (1-5)</span><input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2 text-sm" /></label>
            <button onClick={submit} disabled={loading} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2">{loading ? 'Saving...' : 'Submit Review'}</button>
            <p className="text-xs text-slate-500">POST /v1/performance/reviews • RBAC: manager / hr_admin</p>
          </div>
        </GlassCard>

        <GradientCard className="lg:col-span-2 flex flex-col justify-center">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Trophy size={18} /> Performance Workflow §22</h3>
          <p className="text-sm text-white/80 mt-2">OKR & KPI cascade → Self → Manager → Calibration committee → Final rating. Top 10% → promotion fast-track §27.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="bg-white/20 rounded-full px-3 py-1">Needs Improvement</span>
            <span className="bg-white/20 rounded-full px-3 py-1">Meets Expectations</span>
            <span className="bg-white/20 rounded-full px-3 py-1">Exceeds</span>
            <span className="bg-white text-slate-900 rounded-full px-3 py-1">Outstanding ★5</span>
          </div>
        </GradientCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Star size={16} /> Reviews</h3><Pill tone="blue">{reviews.length} total</Pill></div>
        <div className="overflow-auto max-h-[380px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Employee</th><th className="p-2">Cycle</th><th className="text-left p-2">KPI</th><th className="p-2">Assessment</th><th className="p-2">Rating</th><th className="p-2">Status</th></tr></thead>
            <tbody className="divide-y">
              {reviews.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="p-2 font-mono text-xs">{r.employee?.employeeCode || r.employeeId?.slice(0, 8)}</td>
                  <td className="p-2 text-xs text-center">{r.cycle || '2026-H1'}</td>
                  <td className="p-2 text-xs max-w-[220px] truncate">{r.kpi || r.title}</td>
                  <td className="p-2 text-xs max-w-[220px] truncate">{r.managerAssessment || r.assessment || '—'}</td>
                  <td className="p-2 text-center"><span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 text-xs"><Star size={10} />{r.rating ?? '—'}</span></td>
                  <td className="p-2"><Pill tone={r.status === 'calibrated' ? 'emerald' : r.status === 'pending' ? 'amber' : 'slate'}>{r.status || 'pending'}</Pill></td>
                </tr>
              ))}
              {reviews.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No reviews — create one (Manager/HR)</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
