'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { CalendarCheck, Clock, Check, X } from 'lucide-react';

export default function LeavePage() {
  const [types, setTypes] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [form, setForm] = useState({ leave_type_id:'', start_date:'', end_date:'', reason:'' });
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/leave/types`, { headers:{Authorization:`Bearer ${t}`} }).then(r=>r.json()).then(d=> setTypes(Array.isArray(d)?d:[]));
    fetch(`${api}/leave/requests`, { headers:{Authorization:`Bearer ${t}`} }).then(r=>r.json()).then(d=> setReqs(Array.isArray(d)?d:[]));
  };
  useEffect(load, [api]);

  const submit = async () => {
    const t = localStorage.getItem('onehr_token');
    if (!form.leave_type_id) return alert('Select leave type');
    await fetch(`${api}/leave/requests`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`}, body: JSON.stringify(form)});
    setForm({ leave_type_id:'', start_date:'', end_date:'', reason:'' }); load();
  };
  const act = async (id:string, path:string) => {
    const t = localStorage.getItem('onehr_token');
    await fetch(`${api}/leave/requests/${id}/${path}`, { method:'PATCH', headers:{Authorization:`Bearer ${t}`} });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarCheck/> Leave <span className="text-slate-500 font-normal">— Workflow §34</span></h1>
        <p className="text-sm text-slate-500">Balance → Manager approval → Calendar → Notification → Dashboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold">Request Leave</h3>
          <div className="mt-3 space-y-3">
            <select value={form.leave_type_id} onChange={e=>setForm({...form, leave_type_id:e.target.value})} className="w-full border rounded-xl px-3 py-2">
              <option value="">Select type</option>
              {types.map(t=> <option key={t.id} value={t.id}>{t.name} ({t.maxDays} days)</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.start_date} onChange={e=>setForm({...form, start_date:e.target.value})} className="border rounded-xl px-3 py-2" />
              <input type="date" value={form.end_date} onChange={e=>setForm({...form, end_date:e.target.value})} className="border rounded-xl px-3 py-2" />
            </div>
            <input placeholder="Reason" value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} className="w-full border rounded-xl px-3 py-2" />
            <button onClick={submit} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold">Submit Request</button>
            <p className="text-xs text-slate-500">→ Manager inbox • HR command center • Auto calendar update §35 (Email/SMS/WhatsApp)</p>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Clock size={16}/> Requests</h3><Pill tone="blue">{reqs.length} total</Pill></div>
          <div className="overflow-auto max-h-[380px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Type</th><th className="p-2">Dates</th><th className="p-2">Days</th><th className="p-2">Status</th><th className="text-right p-2">Actions</th></tr></thead>
              <tbody className="divide-y">
                {reqs.map((r:any)=> (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-2">{r.leaveType?.name || r.leaveTypeId?.slice(0,8)}</td>
                    <td className="p-2 text-xs">{new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}</td>
                    <td className="p-2 text-center">{r.days}</td>
                    <td className="p-2"><Pill tone={r.status==='approved'?'emerald':r.status==='rejected'?'red':r.status==='pending'?'amber':'slate'}>{r.status}</Pill></td>
                    <td className="p-2 text-right">
                      {r.status==='pending' ? <span className="flex justify-end gap-1"><button onClick={()=>act(r.id,'approve')} className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check size={12}/></button><button onClick={()=>act(r.id,'reject')} className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center"><X size={12}/></button></span> : <span className="text-xs text-slate-500">—</span>}
                    </td>
                  </tr>
                ))}
                {reqs.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No requests — create one</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
