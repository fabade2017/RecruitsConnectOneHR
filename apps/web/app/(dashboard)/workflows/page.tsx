'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { Workflow, Plus, Play, Pause, Trash2, Edit2, Check, Clock, GitBranch, Layers, Sparkles, ArrowRight, Settings2 } from 'lucide-react';

type Step = { id: string; name: string; type: 'approval'|'notification'|'task'|'webhook'; assignee?: string };
type WorkflowItem = { id: string; name: string; trigger: string; steps: Step[]; status: 'active'|'draft'|'paused'; createdAt: string; runs?: number };

const TRIGGERS = ['employee.created','leave.requested','attendance.exception','payroll.completed','document.uploaded','performance.review_due','recruitment.applied','manual'];
const STEP_TYPES = ['approval','notification','task','webhook'];

export default function WorkflowsPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [form, setForm] = useState({ name:'', trigger:'leave.requested', steps: [{ name:'Manager Approval', type:'approval' as string }] });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('onehr_token')}` });

  const load = async () => {
    setLoading(true);
    try {
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
            status: w.status || 'active',
            createdAt: w.createdAt ? String(w.createdAt).slice(0,10) : new Date().toISOString().slice(0,10),
            runs: w.runs ?? w.executionCount ?? 0,
            steps: Array.isArray(w.steps) ? w.steps.map((s:any, i:number)=> ({ id: s.id || `s${i}`, name: s.name || s.stepName || `Step ${i+1}`, type: s.type || 'approval', assignee: s.assignee })) : [],
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

  const create = async () => {
    if (!form.name) return setMsg('Name required');
    const payload = { name: form.name, trigger: form.trigger, steps: form.steps.map((s,i)=>({ name: s.name, type: s.type, order: i+1 })) };
    const res = await fetch(`${api}/workflows`, { method:'POST', headers:{'Content-Type':'application/json', ...auth() as any}, body: JSON.stringify(payload)});
    if (!res.ok) {
      const e = await res.text();
      setMsg('Create failed: ' + e.slice(0, 100));
      setTimeout(()=>setMsg(''), 3000);
      return;
    }
    const created = await res.json();
    setWorkflows([{ id: created.id, name: form.name, trigger: form.trigger, status:'active', createdAt: new Date().toISOString().slice(0,10), runs:0, steps: payload.steps.map((s,i)=>({ id:`s${i}`, name: s.name, type: s.type as any })) }, ...workflows]);
    setMsg('Created ✓');
    setForm({ name:'', trigger:'leave.requested', steps: [{ name:'Manager Approval', type:'approval'}]});
    setTimeout(()=>setMsg(''), 3000);
  };

  const addStep = () => setForm({...form, steps:[...form.steps, { name:'', type:'approval'}]});
  const updateStep = (idx:number, patch:any) => setForm({...form, steps: form.steps.map((s,i)=> i===idx ? {...s, ...patch} : s) });
  const removeStep = (idx:number) => setForm({...form, steps: form.steps.filter((_,i)=>i!==idx)});

  const toggleStatus = (id:string) => setWorkflows(workflows.map(w=> w.id===id ? {...w, status: w.status==='active'?'paused':'active'} : w));
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
          <span className="bg-white/15 rounded-full px-3 py-1">§34: leave → manager → HR → notification</span>
        </div>
      </GradientCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Plus size={16}/> Create Workflow</h3>
          <p className="text-xs text-slate-500">Define trigger + steps — §34 engine</p>
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
                  <div key={idx} className="border rounded-xl p-2 bg-slate-50/50 flex gap-2 items-center">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">{idx+1}</span>
                    <input value={s.name} onChange={e=>updateStep(idx,{name:e.target.value})} placeholder="Step name" className="flex-1 border rounded-lg px-2 py-1 text-sm" />
                    <select value={s.type} onChange={e=>updateStep(idx,{type:e.target.value})} className="border rounded-lg px-2 py-1 text-xs">
                      {STEP_TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={()=>removeStep(idx)} className="w-7 h-7 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><Trash2 size={12}/></button>
                  </div>
                ))}
                {form.steps.length===0 && <div className="text-xs text-slate-500 p-2">No steps — add approval/notification/task/webhook</div>}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-500"><ArrowRight size={12}/> Steps execute sequentially • Approval → notification • Audit logged</div>
            </div>
            <button onClick={create} className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Sparkles size={16}/> Create Workflow</button>
            {msg && <div className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12}/>{msg}</div>}
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
                  <tr key={w.id} className="hover:bg-slate-50/50">
                    <td className="p-2">
                      <div className="font-semibold flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center"><Workflow size={14}/></span>{w.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10}/>{w.createdAt} • {w.id.slice(0,8)}</div>
                      <div className="mt-1 flex flex-wrap gap-1">{w.steps.map(s=> <span key={s.id} className="text-[11px] bg-slate-50 border rounded-full px-2 py-0.5 flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${s.type==='approval'?'bg-amber-500':s.type==='notification'?'bg-sky-500':s.type==='task'?'bg-emerald-500':'bg-violet-500'}`} />{s.name} <span className="text-slate-400">({s.type})</span></span> )}</div>
                    </td>
                    <td className="p-2"><span className="font-mono text-xs bg-slate-900 text-white rounded-full px-2 py-1">{w.trigger}</span></td>
                    <td className="p-2 text-center">{w.steps.length}</td>
                    <td className="p-2 text-center font-semibold">{w.runs}</td>
                    <td className="p-2"><Pill tone={w.status==='active'?'emerald':w.status==='paused'?'amber':'slate'}>{w.status}</Pill></td>
                    <td className="p-2">
                      <div className="flex justify-end gap-1">
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
