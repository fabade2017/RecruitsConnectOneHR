'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { ClipboardCheck, CheckCircle2, Circle, Clock, RefreshCw, Users, GraduationCap, FileCheck, UserCheck } from 'lucide-react';

type Step = { id: string; title: string; desc: string; done: boolean; autoVerified?: boolean; autoKey?: string };

export default function OnboardingPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const loadEmployees = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/employees?limit=20`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : d.data || [];
        setEmployees(arr);
        if (arr.length && !selectedId) setSelectedId(arr[0].id);
      })
      .catch(() => {});
  };

  const loadProgressMap = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/onboarding/progress`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then((d: any[]) => {
        if (Array.isArray(d)) {
          const map: Record<string, number> = {};
          for (const p of d) map[p.employeeId] = p.progress;
          setProgressMap(map);
        }
      })
      .catch(() => {});
  };

  const loadStepsFor = (empId: string) => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    setLoading(true);
    fetch(`${api}/onboarding/${empId}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then((d) => {
        if (d.steps) {
          setSteps(d.steps);
        } else if (Array.isArray(d) && d[0]?.steps) {
          setSteps(d[0].steps);
        }
        if (d.progress !== undefined) setProgressMap(m => ({ ...m, [empId]: d.progress }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadTemplate = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/onboarding`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : d.data || [];
        if (arr.length && arr[0].steps) {
          const s = arr[0].steps.map((x: any, i: number) => ({ id: String(i+1), title: x.title || x.name, desc: x.desc || x.description || '', done: !!x.done }));
          if (!selectedId) setSteps(s);
        }
      })
      .catch(() => {});
  };

  const reloadAll = () => {
    loadEmployees();
    loadProgressMap();
    loadTemplate();
    if (selectedId) loadStepsFor(selectedId);
  };

  useEffect(() => {
    loadEmployees();
    loadProgressMap();
    loadTemplate();
  }, [api]);

  useEffect(() => {
    if (selectedId) loadStepsFor(selectedId);
  }, [selectedId]);

  const toggle = async (id: string) => {
    if (!selectedId) return;
    // optimistic
    const prev = steps;
    setSteps(s => s.map(x => x.id === id ? { ...x, done: !x.done } : x));
    const t = localStorage.getItem('onehr_token');
    try {
      const res = await fetch(`${api}/onboarding/${selectedId}/step/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const d = await res.json();
        setSteps(d.steps);
        setProgressMap(m => ({ ...m, [selectedId]: d.progress }));
      } else {
        setSteps(prev);
      }
    } catch {
      setSteps(prev);
    }
  };

  const progress = steps.length ? Math.round((steps.filter((s) => s.done).length / steps.length) * 100) : 0;
  const selectedEmployee = employees.find(e => e.id === selectedId);
  const filtered = employees.filter((e) => !filter || e.employeeCode?.toLowerCase().includes(filter.toLowerCase()) || e.email?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="text-emerald-600" /> Onboarding <span className="text-slate-500 font-normal">— Per-Employee Journey §24</span></h1>
          <p className="text-sm text-slate-500">Each employee has a separate checklist — progress tracked per hire • API: /onboarding/:employeeId</p>
          {selectedEmployee && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><UserCheck size={12}/> Viewing: {selectedEmployee.employeeCode} • {selectedEmployee.jobTitle || ''}</p>}
        </div>
        <button onClick={reloadAll} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Progress" value={`${progress}%`} sub={selectedEmployee ? `${selectedEmployee.employeeCode}` : `${steps.filter((s) => s.done).length}/${steps.length} steps`} icon={GraduationCap} accent="from-emerald-500 to-teal-600" />
        <StatCard title="Team" value={String(employees.length)} sub="All hires" icon={Users} accent="from-sky-500 to-blue-600" />
        <StatCard title="Avg Progress" value={employees.length ? `${Math.round(Object.values(progressMap).reduce((a,b)=>a+b,0)/Math.max(1, Object.values(progressMap).length))}%` : '—'} sub="Across team" icon={Clock} accent="from-amber-500 to-orange-600" />
        <StatCard title="Completed" value={String(Object.values(progressMap).filter(p=>p===100).length)} sub="100% done" icon={FileCheck} accent="from-violet-500 to-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><ClipboardCheck size={16} /> Checklist {selectedEmployee ? `— ${selectedEmployee.employeeCode}` : ''}</h3>
            <Pill tone={progress === 100 ? 'emerald' : progress > 50 ? 'blue' : 'amber'}>{progress}% complete</Pill>
          </div>
          {!selectedId ? (
            <div className="mt-4 p-8 text-center text-slate-500 bg-slate-50 rounded-xl">Select an employee from table below to view their checklist</div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all" style={{ width: `${progress}%` }} /></div>
              <div className="flex gap-2 text-[11px] text-slate-500"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"/> Auto-verified</span><span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-300 rounded-full"/> Manual</span></div>
              {loading ? <div className="p-4 text-center text-slate-500">Loading checklist...</div> : steps.map((s: any) => (
                <div key={s.id} className={`flex items-start gap-3 p-3 rounded-xl border ${s.done ? (s.autoVerified ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-50 border-emerald-200') : 'bg-white border-slate-200'}`}>
                  <button onClick={() => !s.autoVerified && toggle(s.id)} disabled={!!s.autoVerified} className={`mt-0.5 ${s.autoVerified ? 'cursor-default opacity-60' : ''}`}>{s.done ? <CheckCircle2 size={20} className={s.autoVerified ? 'text-emerald-700' : 'text-emerald-600'} /> : <Circle size={20} className="text-slate-400" />}</button>
                  <div className="flex-1">
                    <div className={`font-medium text-sm flex items-center gap-2 ${s.done ? 'line-through text-slate-500' : ''}`}>{s.title} {s.autoVerified && <span className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">Auto ✓ {s.autoKey === 'offer_verified' ? 'CONTRACT verified' : s.autoKey === 'docs_verified' ? 'Doc verified' : s.autoKey === 'asset_assigned' ? 'Asset assigned' : s.autoKey === 'orientation_done' ? 'Clock-in' : s.autoKey === 'training_done' ? 'Training done' : s.autoKey === 'probation_goals' ? 'Review exists' : 'System'}</span>}</div>
                    <div className="text-xs text-slate-500">{s.desc} {s.autoVerified && <span className="text-emerald-600">• verified from live system</span>}</div>
                  </div>
                  <Pill tone={s.done ? (s.autoVerified ? 'emerald' : 'emerald') : 'slate'}>{s.done ? (s.autoVerified ? 'Auto Done' : 'Done') : 'Pending'}</Pill>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">GET /v1/onboarding/:employeeId • PATCH toggle (manual) • Auto: CONTRACT verified → Offer, Doc verified → Documents, Asset → IT, Clock-in → Orientation, Training completed → Buddy, Review exists → Probation • Per-employee persisted</p>
        </GlassCard>

        <GradientCard gradient="from-emerald-600 via-teal-600 to-emerald-700">
          <h3 className="font-semibold flex items-center gap-2"><Users size={18} /> Buddy System</h3>
          <p className="text-sm text-white/90 mt-2">Every new hire gets a buddy + 30-60-90 plan. Completion unlocks payroll & shift assignment §14.</p>
          <div className="mt-4 bg-white/20 rounded-xl p-3 text-sm">
            <div className="font-semibold">Selected employee</div>
            <div className="text-white/80 text-xs">{selectedEmployee ? `${selectedEmployee.employeeCode} • ${selectedEmployee.jobTitle || ''} • ${progress}%` : 'No selection'}</div>
          </div>
          <div className="mt-3 flex gap-2 text-xs"><span className="bg-white text-emerald-700 rounded-full px-3 py-1 font-medium">Day 1 ✓</span><span className="bg-white/20 rounded-full px-3 py-1">Day 30</span><span className="bg-white/20 rounded-full px-3 py-1">Day 90</span></div>
        </GradientCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Users size={16} /> Recent Hires — Select to view checklist</h3><input placeholder="Filter by code/email" value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-full px-3 py-1.5 text-xs w-48" /></div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Employee</th><th className="p-2">Department</th><th className="p-2">Join Date</th><th className="p-2">Onboarding</th><th className="p-2">Action</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map((e: any) => {
                const p = progressMap[e.id] ?? 0;
                return (
                  <tr key={e.id} className={`hover:bg-slate-50/50 ${selectedId===e.id?'bg-emerald-50/50':''}`}>
                    <td className="p-2 font-mono text-xs">{e.employeeCode || e.id.slice(0, 8)} <span className="text-slate-500 font-sans ml-1">{e.jobTitle || ''}</span></td>
                    <td className="p-2 text-xs text-center">{e.department?.name || e.department || '—'}</td>
                    <td className="p-2 text-xs text-center">{e.hireDate ? new Date(e.hireDate).toLocaleDateString() : e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="p-2 text-center"><Pill tone={p === 100 ? 'emerald' : p > 0 ? 'blue' : 'amber'}>{p}%</Pill></td>
                    <td className="p-2 text-center"><button onClick={() => setSelectedId(e.id)} className={`px-3 py-1 rounded-full text-xs ${selectedId===e.id?'bg-emerald-600 text-white':'bg-slate-900 text-white'}`}>View</button></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hires — add via People → Add Employee</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 text-xs text-slate-500">Each row is separate • Click View to load per-employee checklist • PATCH persists per hire</div>
      </GlassCard>
    </div>
  );
}
