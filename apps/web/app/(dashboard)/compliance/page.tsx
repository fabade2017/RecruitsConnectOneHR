'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Shield, Scale, ClipboardCheck, Plus, Search, Calendar, AlertTriangle } from 'lucide-react';

export default function CompliancePage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState({ title: '', category: 'HR', description: '', effectiveDate: '' });
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const loadPolicies = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/compliance/policies`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setPolicies(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  };
  useEffect(loadPolicies, [api]);

  const loadAudits = (id: string) => {
    setSelectedId(id);
    const t = localStorage.getItem('onehr_token');
    fetch(`${api}/compliance/policies/${id}/audits`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setAudits(Array.isArray(d) ? d : d.data || []))
      .catch(()=> setAudits([]));
  };

  const createPolicy = async () => {
    if (!form.title) return alert('Title required');
    const t = localStorage.getItem('onehr_token');
    await fetch(`${api}/compliance/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(form),
    });
    setForm({ title: '', category: 'HR', description: '', effectiveDate: '' });
    loadPolicies();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield/> Compliance <span className="text-slate-500 font-normal">— Policies & Audits §27</span></h1>
        <p className="text-sm text-slate-500">Policies → Versioning → Audits trail → Gap analysis • Retention §9</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Plus size={16}/> New Policy</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Title e.g. Data Privacy Policy" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <select value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="HR">HR</option>
              <option value="SECURITY">Security</option>
              <option value="FINANCE">Finance</option>
              <option value="LEGAL">Legal</option>
              <option value="OPERATIONS">Operations</option>
            </select>
            <textarea placeholder="Description" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} rows={3} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input type="date" value={form.effectiveDate} onChange={(e)=>setForm({...form, effectiveDate:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <button onClick={createPolicy} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold">Create Policy</button>
            <p className="text-xs text-slate-500">POST /v1/compliance/policies • Effective dating</p>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold flex items-center gap-2"><Scale size={16}/> Compliance Overview</h3>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold">{policies.length}</div><div className="text-xs text-slate-500">Policies</div></div>
            <div className="bg-sky-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold">{audits.length}</div><div className="text-xs text-slate-500">Audits (selected)</div></div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold">{policies.filter((p:any)=>p.status==='active' || !p.status).length}</div><div className="text-xs text-slate-500">Active</div></div>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="glass rounded-full px-3 py-1.5 flex items-center gap-1"><ClipboardCheck size={12}/> Audit trail §27</span>
            <span className="glass rounded-full px-3 py-1.5 flex items-center gap-1"><AlertTriangle size={12}/> Gap: {policies.length===0?'No data':'Checked'}</span>
            <span className="glass rounded-full px-3 py-1.5">Retention 90d §9</span>
          </div>
          {selectedId && <p className="text-xs text-slate-500 mt-2">Viewing audits for: <span className="font-mono">{selectedId.slice(0,8)}</span> <button onClick={()=>{setSelectedId(''); setAudits([])}} className="ml-2 underline">clear</button></p>}
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Search size={16}/> Policies</h3>
          <Pill tone="blue">{policies.length} policies</Pill>
        </div>
        <div className="overflow-auto max-h-[320px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Title</th><th className="p-2">Category</th><th className="p-2">Effective</th><th className="p-2">Status</th><th className="text-right p-2">Audits</th></tr></thead>
            <tbody className="divide-y">
              {policies.map((p:any)=> (
                <tr key={p.id} className={`hover:bg-slate-50/50 ${selectedId===p.id?'bg-sky-50/50':''}`}>
                  <td className="p-2 font-medium">{p.title || p.name}</td>
                  <td className="p-2 text-xs"><Pill tone="slate">{p.category}</Pill></td>
                  <td className="p-2 text-xs flex items-center gap-1 justify-center"><Calendar size={12}/>{p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : '—'}</td>
                  <td className="p-2"><Pill tone={p.status==='active'?'emerald':p.status==='draft'?'amber':'slate'}>{p.status||'active'}</Pill></td>
                  <td className="p-2 text-right"><button onClick={()=>loadAudits(p.id)} className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs">View Audits</button></td>
                </tr>
              ))}
              {policies.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No policies — create one</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><ClipboardCheck size={16}/> Audits {selectedId ? `— ${selectedId.slice(0,8)}` : '(select policy)'}</h3><Pill tone="amber">{audits.length} entries</Pill></div>
        <div className="overflow-auto max-h-[300px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Action</th><th className="p-2">Actor</th><th className="p-2">Timestamp</th><th className="p-2">Details</th></tr></thead>
            <tbody className="divide-y">
              {audits.map((a:any)=> (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="p-2 text-xs font-medium">{a.action || a.event}</td>
                  <td className="p-2 text-xs font-mono">{a.actor?.email || a.actorId?.slice(0,8) || 'system'}</td>
                  <td className="p-2 text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleString() : a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}</td>
                  <td className="p-2 text-xs max-w-[300px] truncate">{a.details || a.changes || JSON.stringify(a.metadata||'').slice(0,80)}</td>
                </tr>
              ))}
              {audits.length===0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">{selectedId ? 'No audits for this policy — audits append on create/update' : 'Select a policy to view GET /v1/compliance/policies/:id/audits'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 text-xs text-slate-500">GET /v1/compliance/policies • POST • GET /:id/audits • Immutable trail §27</div>
      </GlassCard>
    </div>
  );
}
