'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { Workflow, Plus, Play, Pause, Trash2, Edit2, Check, Clock, GitBranch, Layers, Sparkles, ArrowRight, Settings2, ChevronUp, ChevronDown, X } from 'lucide-react';

type Step = {
  id?: string; name: string; type: 'approval'|'notification'|'task'|'webhook'; assignee?: string; order?: number;
  approverMode?: 'role'|'user'|'role_user'; approverRole?: string; approverUserId?: string; approverLabel?: string;
};
type WorkflowItem = { id: string; name: string; trigger: string; steps: Step[]; status: 'active'|'draft'|'paused'; createdAt: string; runs?: number };

const TRIGGERS = ['employee.created','leave.requested','attendance.exception','payroll.completed','document.uploaded','performance.review_due','recruitment.applied','manual'];
const STEP_TYPES = ['approval','notification','task','webhook'];
const ASSIGNEES = ['manager','hr_admin','org_admin','super_admin','recruiter','employee'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const normSteps = (v: any): Step[] => {
  let arr: any[] = [];
  if (Array.isArray(v)) arr = v;
  else if (typeof v === 'string') { try { const p = JSON.parse(v); if (Array.isArray(p)) arr = p; } catch {} }
  return arr.map((s: any, i: number) => ({
    id: s?.id || `s${i+1}`, name: s?.name || s?.stepName || `Step ${i+1}`, type: s?.type || 'approval', assignee: s?.assignee,
    approverMode: s?.approverMode, approverRole: s?.approverRole, approverUserId: s?.approverUserId, approverLabel: s?.approverLabel,
  }));
};
// Legacy steps only have `assignee` (role slug or user id) — derive an explicit mode for editing/display
const toEditStep = (s: Step) => {
  if (s.type !== 'approval') return { id: s.id, name: s.name, type: s.type };
  const legacyUser = !s.approverUserId && UUID_RE.test(s.assignee || '');
  const mode = s.approverMode || (legacyUser ? 'user' : s.approverUserId ? 'role_user' : 'role');
  return {
    id: s.id, name: s.name, type: s.type,
    approverMode: mode,
    approverRole: s.approverRole || (!legacyUser && !s.approverUserId ? (s.assignee || 'manager') : 'manager'),
    approverUserId: s.approverUserId || (legacyUser ? s.assignee : ''),
    approverLabel: s.approverLabel,
  };
};
const userMatchesRole = (roles: any[], u: any, slug: string) => {
  const r = roles.find((x: any) => x.slug === slug);
  if (!r) return u.role === slug;
  if (r.system) return u.role === slug;
  return u.customRoleId === r.id;
};
const approverChip = (s: Step) => {
  if (s.type !== 'approval') return '';
  const legacyUser = !s.approverUserId && UUID_RE.test(s.assignee || '');
  const mode = s.approverMode || (legacyUser ? 'user' : s.approverUserId ? 'role_user' : 'role');
  if (mode === 'user') return ` → user: ${s.approverLabel || 'specific user'}`;
  if (mode === 'role_user') return ` → ${s.approverRole || s.assignee} → ${s.approverLabel || 'specific member'}`;
  return ` → ${s.approverRole || s.assignee || 'any role member'}`;
};
const EMPTY_FORM = { name: '', trigger: 'leave.requested', steps: [{ name: 'Manager Approval', type: 'approval' as string, approverMode: 'role' as string, approverRole: 'manager' }] };

export default function WorkflowsPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  type FormStep = { id?: string; name: string; type: string; assignee?: string; approverMode?: string; approverRole?: string; approverUserId?: string; approverLabel?: string };
  const [form, setForm] = useState<{ name: string; trigger: string; steps: FormStep[] }>({ ...EMPTY_FORM, steps: [...EMPTY_FORM.steps] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [approverOpts, setApproverOpts] = useState<{ roles: any[]; users: any[] }>({ roles: ASSIGNEES.map(slug => ({ slug, name: slug, system: true })), users: [] });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const [catalog, setCatalog] = useState<any[]>([]);
  const auth = () => ({ Authorization: `Bearer ${typeof localStorage !== 'undefined' ? localStorage.getItem('onehr_token') : ''}` });

  const load = async () => {
    setLoading(true);
    try {
      try {
        const c = await fetch(`${api}/workflows/catalog`, { headers: auth() as any });
        if (c.ok) setCatalog(await c.json());
      } catch {}
      try {
        const o = await fetch(`${api}/workflows/approver-options`, { headers: auth() as any });
        if (o.ok) { const d = await o.json(); setApproverOpts({ roles: d.roles?.length ? d.roles : approverOpts.roles, users: d.users || [] }); }
      } catch {}
      const res = await fetch(`${api}/workflows`, { headers: auth() as any });
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        if (arr.length) {
          // normalize
          const normalized: WorkflowItem[] = arr.map((w:any)=> ({
            id: w.id,
            name: w.name,
            trigger: w.trigger || w.triggerEvent || 'manual',
            status: w.status || (w.isActive === false ? 'paused' : 'active'),
            createdAt: w.createdAt ? String(w.createdAt).slice(0,10) : new Date().toISOString().slice(0,10),
            runs: w.runs ?? w.executionCount ?? w._count?.instances ?? 0,
            steps: normSteps(w.steps),
          }));
          setWorkflows(normalized);
        }
      } else {
        // try alternative path
        const alt = await fetch(`${api}/organizations/workflows`, { headers: auth() as any }).catch(()=>null);
        if (alt && alt.ok) {
          const d = await alt.json();
          if (Array.isArray(d) && d.length) setWorkflows(d);
        }
      }
    } catch {}
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const save = async () => {
    if (!form.name) return setMsg('Name required');
    if (!form.steps.length) return setMsg('Add at least one step');
    for (let i = 0; i < form.steps.length; i++) {
      const s = form.steps[i];
      if (s.type !== 'approval') continue;
      const mode = (s.approverMode as any) || 'role';
      if ((mode === 'role' || mode === 'role_user') && !s.approverRole) return setMsg(`Step ${i+1}: choose an approver role`);
      if ((mode === 'user' || mode === 'role_user') && !s.approverUserId) return setMsg(`Step ${i+1}: choose an approver user`);
    }
    const payload = {
      name: form.name,
      trigger: form.trigger,
      steps: form.steps.map((s, i) => {
        const base: any = { id: s.id || `s${i+1}`, name: s.name || `Step ${i+1}`, type: s.type, order: i + 1 };
        if (s.type === 'approval') {
          const mode = (s.approverMode as any) || 'role';
          const userId = mode !== 'role' ? (s.approverUserId || '') : '';
          const role = s.approverRole || 'manager';
          const label = approverOpts.users.find((u: any) => u.id === userId)?.email || s.approverLabel || '';
          base.approverMode = mode;
          base.approverRole = mode !== 'user' ? role : (s.approverRole || '');
          base.approverUserId = userId;
          base.approverLabel = label;
          base.assignee = mode === 'role' ? role : userId;
        }
        return base;
      }),
    };
    const isEdit = !!editingId;
    const res = await fetch(isEdit ? `${api}/workflows/${editingId}` : `${api}/workflows`, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() as any },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const e = await res.text();
      setMsg((isEdit ? 'Update failed: ' : 'Create failed: ') + e.slice(0, 100));
      setTimeout(()=>setMsg(''), 4000);
      return;
    }
    const saved = await res.json();
    if (isEdit) {
      setWorkflows(workflows.map(w => w.id === editingId ? {
        ...w, name: saved.name || payload.name, trigger: saved.trigger || payload.trigger,
        status: saved.isActive === false ? 'paused' : 'active',
        steps: normSteps(saved.steps ?? payload.steps),
      } : w));
      setMsg('Updated ✓');
      setEditingId(null);
    } else {
      setWorkflows([{ id: saved.id, name: form.name, trigger: form.trigger, status: saved.isActive === false ? 'paused' : 'active', createdAt: new Date().toISOString().slice(0,10), runs: 0, steps: normSteps(saved.steps ?? payload.steps) }, ...workflows]);
      setMsg('Created ✓');
    }
    setForm({ ...EMPTY_FORM, steps: [...EMPTY_FORM.steps] });
    setTimeout(()=>setMsg(''), 3000);
  };

  const startEdit = (w: WorkflowItem) => {
    setMsg('');
    setEditingId(w.id);
    setForm({
      name: w.name,
      trigger: w.trigger,
      steps: w.steps.length
        ? w.steps.map(s => toEditStep(s))
        : [{ name: '', type: 'approval', approverMode: 'role', approverRole: 'manager' }],
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditingId(null); setForm({ ...EMPTY_FORM, steps: [...EMPTY_FORM.steps] }); setMsg(''); };

  const addStep = () => setForm({...form, steps:[...form.steps, { name:'', type:'approval', approverMode:'role', approverRole:'manager'}]});
  const updateStep = (idx:number, patch:any) => setForm({...form, steps: form.steps.map((s,i)=> i===idx ? {...s, ...patch} : s) });
  const removeStep = (idx:number) => setForm({...form, steps: form.steps.filter((_,i)=>i!==idx)});
  const moveStep = (idx:number, dir:-1|1) => {
    const to = idx + dir;
    if (to < 0 || to >= form.steps.length) return;
    const steps = [...form.steps];
    [steps[idx], steps[to]] = [steps[to], steps[idx]];
    setForm({ ...form, steps });
  };

  const toggleStatus = async (id:string) => {
    try {
      const res = await fetch(`${api}/workflows/${id}/toggle`, { method: 'POST', headers: auth() as any });
      if (res.ok) {
        const upd = await res.json();
        setWorkflows(workflows.map(w => w.id === id ? { ...w, status: upd.isActive === false ? 'paused' : 'active' } : w));
        return;
      }
    } catch {}
    setWorkflows(workflows.map(w=> w.id===id ? {...w, status: w.status==='active'?'paused':'active'} : w));
  };
  const remove = (id:string) => {
    setWorkflows(workflows.filter(w=>w.id!==id));
    fetch(`${api}/workflows/${id}`, { method:'DELETE', headers: auth() as any }).catch(()=>{});
  };

  return (
    <div className="space-y-6">
      <GradientCard gradient="from-slate-900 via-indigo-900 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Workflow/> Workflows <span className="font-normal text-white/70">— Automation §34</span></h1>
            <p className="text-sm text-white/70">Trigger → Steps → Approvals → Notifications → Audit §34 • Builder + Execution log</p>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="blue">{workflows.length} workflows</Pill>
            <span className="glass-dark rounded-full px-3 py-1 text-xs flex items-center gap-1"><GitBranch size={12}/> RBAC: hr_admin / org_admin</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
          <span className="bg-white/15 rounded-full px-3 py-1">GET /v1/workflows</span>
          <span className="bg-white/15 rounded-full px-3 py-1">POST /v1/workflows {`{name, trigger, steps}`}</span>
          <span className="bg-white/15 rounded-full px-3 py-1">PATCH /v1/workflows/:id {`{name, trigger, steps}`}</span>
          <span className="bg-white/15 rounded-full px-3 py-1">§34: leave → manager → HR → notification</span>
        </div>
      </GradientCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2">{editingId ? <><Edit2 size={16}/> Edit Workflow</> : <><Plus size={16}/> Create Workflow</>}</h3>
          <p className="text-xs text-slate-500">{editingId ? 'Update name, trigger, step order, types and assignees — saved via PATCH' : 'Define trigger + steps — §34 engine'}</p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-semibold">Workflow Name</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g., Leave Approval Chain" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold">Trigger Event</label>
              <select value={form.trigger} onChange={e=>setForm({...form,trigger:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1">
                {TRIGGERS.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Steps ({form.steps.length})</label>
                <button onClick={addStep} className="text-xs bg-slate-900 text-white rounded-full px-3 py-1 flex items-center gap-1"><Plus size={12}/> Add step</button>
              </div>
              <div className="mt-2 space-y-2 max-h-[220px] overflow-auto">
                {form.steps.map((s, idx)=>(
                  <div key={idx} className="border rounded-xl p-2 bg-slate-50/50 space-y-1.5">
                    <div className="flex gap-2 items-center">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">{idx+1}</span>
                      <input value={s.name} onChange={e=>updateStep(idx,{name:e.target.value})} placeholder="Step name" className="flex-1 border rounded-lg px-2 py-1 text-sm min-w-0" />
                      <div className="flex flex-col gap-0.5">
                        <button onClick={()=>moveStep(idx,-1)} disabled={idx===0} className="w-6 h-4 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30 flex items-center justify-center" title="Move up"><ChevronUp size={11}/></button>
                        <button onClick={()=>moveStep(idx,1)} disabled={idx===form.steps.length-1} className="w-6 h-4 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30 flex items-center justify-center" title="Move down"><ChevronDown size={11}/></button>
                      </div>
                      <button onClick={()=>removeStep(idx)} className="w-7 h-7 shrink-0 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><Trash2 size={12}/></button>
                    </div>
                    <div className="flex gap-2 items-center pl-8">
                      <select value={s.type} onChange={e=>updateStep(idx,{type:e.target.value, assignee: e.target.value==='approval' ? (s.assignee||'manager') : s.assignee})} className="border rounded-lg px-2 py-1 text-xs">
                        {STEP_TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
                      </select>
                      {s.type === 'approval' && (
                        <>
                          <select value={s.approverMode || 'role'} onChange={e=>{
                            const mode = e.target.value;
                            updateStep(idx, {
                              approverMode: mode,
                              approverRole: mode === 'user' ? s.approverRole : (s.approverRole || 'manager'),
                              approverUserId: mode === 'role' ? '' : (s.approverUserId || ''),
                            });
                          }} className="border rounded-lg px-2 py-1 text-xs bg-white" title="Who can approve">
                            <option value="role">any role member</option>
                            <option value="role_user">role → specific member</option>
                            <option value="user">specific user</option>
                          </select>
                          {(s.approverMode || 'role') !== 'user' && (
                            <select value={s.approverRole || 'manager'} onChange={e=>updateStep(idx,{approverRole:e.target.value, assignee:e.target.value})} className="border rounded-lg px-2 py-1 text-xs bg-white" title="Approver role">
                              {approverOpts.roles.map((r:any)=> <option key={r.slug} value={r.slug}>{r.slug}{r.system?'':' *'}</option>)}
                            </select>
                          )}
                          {(s.approverMode || 'role') !== 'role' && (
                            <select value={s.approverUserId || ''} onChange={e=>updateStep(idx,{approverUserId:e.target.value, approverLabel: approverOpts.users.find((u:any)=>u.id===e.target.value)?.email})} className="border rounded-lg px-2 py-1 text-xs bg-white max-w-[170px]" title="Approver user">
                              <option value="">pick user…</option>
                              {approverOpts.users
                                .filter((u:any) => s.approverMode === 'role_user' ? userMatchesRole(approverOpts.roles, u, s.approverRole || 'manager') : true)
                                .map((u:any)=> <option key={u.id} value={u.id}>{u.label}</option>)}
                              {s.approverMode === 'role_user' && approverOpts.users.length > 0 && !approverOpts.users.some((u:any) => userMatchesRole(approverOpts.roles, u, s.approverRole || 'manager')) && (
                                <option value="" disabled>no users with this role</option>
                              )}
                            </select>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {form.steps.length===0 && <div className="text-xs text-slate-500 p-2">No steps — add approval/notification/task/webhook</div>}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-500"><ArrowRight size={12}/> Steps execute sequentially • Approval → notification • Audit logged</div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
                {editingId ? <><Check size={16}/> Save Changes</> : <><Sparkles size={16}/> Create Workflow</>}
              </button>
              {editingId && (
                <button onClick={cancelEdit} className="px-4 rounded-xl border text-sm font-semibold flex items-center gap-1 bg-white hover:bg-slate-50"><X size={14}/> Cancel</button>
              )}
            </div>
            {msg && <div className={`text-xs flex items-center gap-1 ${msg.includes('failed') || msg.includes('required') || msg.includes('Add ') ? 'text-red-600' : 'text-emerald-600'}`}><Check size={12}/>{msg}</div>}
            <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-2">Example: <code>{`{ name:"Onboarding", trigger:"employee.created", steps:[{type:"task"},{type:"notification"}]}`}</code></div>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Layers size={16}/> Workflows {loading ? '…' : `(${workflows.length})`}</h3>
            <Pill tone="blue">GET /v1/workflows</Pill>
          </div>
          <div className="overflow-auto max-h-[520px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Workflow</th><th className="p-2">Trigger</th><th className="p-2">Steps</th><th className="p-2">Runs</th><th className="p-2">Status</th><th className="text-right p-2">Actions</th></tr></thead>
              <tbody className="divide-y">
                {workflows.map(w=>(
                  <tr key={w.id} className={`hover:bg-slate-50/50 ${editingId===w.id ? 'bg-violet-50/70' : ''}`}>
                    <td className="p-2">
                      <div className="font-semibold flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center"><Workflow size={14}/></span>{w.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10}/>{w.createdAt} • {w.id.slice(0,8)}</div>
                      <div className="mt-1 flex flex-wrap gap-1">{w.steps.map(s=> <span key={s.id} className="text-[11px] bg-slate-50 border rounded-full px-2 py-0.5 flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${s.type==='approval'?'bg-amber-500':s.type==='notification'?'bg-sky-500':s.type==='task'?'bg-emerald-500':'bg-violet-500'}`} />{s.name} <span className="text-slate-400">({s.type}{approverChip(s)})</span></span> )}</div>
                    </td>
                    <td className="p-2"><span className="font-mono text-xs bg-slate-900 text-white rounded-full px-2 py-1">{w.trigger}</span></td>
                    <td className="p-2 text-center">{w.steps.length}</td>
                    <td className="p-2 text-center font-semibold">{w.runs}</td>
                    <td className="p-2"><Pill tone={w.status==='active'?'emerald':w.status==='paused'?'amber':'slate'}>{w.status}</Pill></td>
                    <td className="p-2">
                      <div className="flex justify-end gap-1">
                        <button onClick={()=>startEdit(w)} className={`w-7 h-7 rounded-full flex items-center justify-center ${editingId===w.id?'bg-violet-600 text-white':'bg-slate-200 text-slate-700 hover:bg-slate-300'}`} title="Edit workflow (name, trigger, steps, order, assignees)"><Edit2 size={12}/></button>
                        <button onClick={()=>toggleStatus(w.id)} className={`w-7 h-7 rounded-full flex items-center justify-center ${w.status==='active'?'bg-amber-500 text-white':'bg-emerald-500 text-white'}`} title={w.status==='active'?'Pause':'Resume'}>{w.status==='active'?<Pause size={12}/>:<Play size={12}/>}</button>
                        <button onClick={()=>remove(w.id)} className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center"><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {workflows.length===0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No workflows — create one (POST /v1/workflows)</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50/50 text-xs text-slate-500 flex items-center gap-2"><Settings2 size={12}/> Execution log: <code>GET /v1/workflows/:id/runs</code> • Audit: assignment → approval → notification → §34</div>
        </GlassCard>
      </div>

      {catalog.length > 0 && (
        <GlassCard>
          <h4 className="font-semibold flex items-center gap-2"><Layers size={16}/> Versioned Engines (parity with live v2.8–v3.3)</h4>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            {catalog.map((e:any)=> (
              <div key={e.trigger} className="border rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between"><span className="font-mono text-xs bg-slate-900 text-white rounded-full px-2 py-1">{e.trigger}</span><span className="text-xs bg-violet-600 text-white rounded-full px-2 py-0.5">{e.version}</span></div>
                <div className="font-semibold text-sm mt-2">{e.label}</div>
                <div className="text-xs text-slate-500">{e.active}/{e.total} active • default {e.defaultSteps.length} steps</div>
                <div className="mt-1 flex flex-wrap gap-1">{e.defaultSteps.map((s:any,i:number)=><span key={i} className="text-[11px] bg-white border rounded-full px-2 py-0.5">{s.type}:{s.assignee}</span>)}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">GET /v1/workflows/catalog — 6 engines mirroring Live enterprise-shell</p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <h4 className="font-semibold text-sm">§34 Leave Flow</h4>
          <div className="mt-2 flex items-center gap-1 text-xs flex-wrap">
            <span className="bg-slate-900 text-white rounded-full px-2 py-1">Request</span><ArrowRight size={12}/><span className="glass rounded-full px-2 py-1">Manager</span><ArrowRight size={12}/><span className="glass rounded-full px-2 py-1">HR</span><ArrowRight size={12}/><span className="bg-emerald-500 text-white rounded-full px-2 py-1">Approved</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Balance check → approval → calendar → notification (§35 email/SMS/WhatsApp)</p>
        </GlassCard>
        <GlassCard>
          <h4 className="font-semibold text-sm">Onboarding Flow</h4>
          <div className="mt-2 text-xs space-y-1">
            <div className="flex justify-between bg-slate-50 rounded-lg px-2 py-1"><span>employee.created</span><ArrowRight size={12}/><span>Tasks</span></div>
            <div className="flex justify-between bg-slate-50 rounded-lg px-2 py-1"><span>Tasks</span><ArrowRight size={12}/><span>Welcome email</span></div>
            <div className="flex justify-between bg-emerald-50 rounded-lg px-2 py-1"><span>Complete</span><Check size={12} className="text-emerald-600"/></div>
          </div>
        </GlassCard>
        <GlassCard>
          <h4 className="font-semibold text-sm">Compliance</h4>
          <p className="text-xs text-slate-500">Every step audit-logged • Tenant isolated • Retention 7y §9 • RBAC enforced</p>
          <div className="mt-2 flex gap-2"><Pill tone="emerald">audit</Pill><Pill tone="blue">tenant</Pill><Pill tone="slate">RBAC</Pill></div>
        </GlassCard>
      </div>
    </div>
  );
}
