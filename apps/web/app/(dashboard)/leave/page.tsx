'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { CalendarCheck, Clock, Check, X, Pencil, Trash2, Ban, Save, AlertCircle } from 'lucide-react';

export default function LeavePage() {
  const [types, setTypes] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [form, setForm] = useState({ leave_type_id:'', start_date:'', end_date:'', reason:'' });
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ leave_type_id:'', start_date:'', end_date:'', reason:'' });
  const [msg, setMsg] = useState<{type:'error'|'success', text:string}|null>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const showMsg = (type:'error'|'success', text:string) => {
    setMsg({type, text});
    setTimeout(()=> setMsg(null), 4000);
  };

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/leave/types`, { headers:{Authorization:`Bearer ${t}`} }).then(r=>r.json()).then(d=> setTypes(Array.isArray(d)?d:[])).catch(()=>{});
    fetch(`${api}/leave/requests`, { headers:{Authorization:`Bearer ${t}`} }).then(r=>r.json()).then(d=> setReqs(Array.isArray(d)?d:[])).catch(()=>{});
  };
  useEffect(load, [api]);

  const submit = async () => {
    const t = localStorage.getItem('onehr_token');
    if (!form.leave_type_id) return showMsg('error','Select leave type');
    if (!form.start_date || !form.end_date) return showMsg('error','Select start and end dates');
    const res = await fetch(`${api}/leave/requests`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`}, body: JSON.stringify(form)});
    if (!res.ok) {
      const e = await res.json().catch(()=>({message:'Failed'}));
      return showMsg('error', e.message || 'Failed to submit');
    }
    setForm({ leave_type_id:'', start_date:'', end_date:'', reason:'' });
    showMsg('success','Leave request submitted');
    load();
  };

  const act = async (id:string, path:string) => {
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/leave/requests/${id}/${path}`, { method:'PATCH', headers:{Authorization:`Bearer ${t}`} });
    if (!res.ok) {
      const e = await res.json().catch(()=>({message:'Failed'}));
      showMsg('error', e.message || `Failed to ${path}`);
    } else {
      showMsg('success', path==='approve'?'Approved': path==='reject'?'Rejected': 'Done');
    }
    load();
  };

  const del = async (id:string) => {
    if (!confirm('Delete this leave request? This cannot be undone. Only pending requests can be deleted.')) return;
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/leave/requests/${id}`, { method:'DELETE', headers:{Authorization:`Bearer ${t}`} });
    if (!res.ok) {
      const e = await res.json().catch(()=>({message:'Failed'}));
      showMsg('error', e.message || 'Delete failed — only pending can be deleted. Try Cancel instead.');
    } else {
      showMsg('success','Request deleted');
    }
    load();
  };

  const cancel = async (id:string) => {
    if (!confirm('Cancel this leave request?')) return;
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/leave/requests/${id}/cancel`, { method:'PATCH', headers:{Authorization:`Bearer ${t}`} });
    if (!res.ok) {
      const e = await res.json().catch(()=>({message:'Failed'}));
      showMsg('error', e.message || 'Cancel failed');
    } else {
      showMsg('success','Request cancelled');
    }
    load();
  };

  const startEdit = (r:any) => {
    setEditing(r);
    setEditForm({
      leave_type_id: r.leaveTypeId || r.leaveType?.id || '',
      start_date: r.startDate ? new Date(r.startDate).toISOString().slice(0,10) : '',
      end_date: r.endDate ? new Date(r.endDate).toISOString().slice(0,10) : '',
      reason: r.reason || ''
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/leave/requests/${editing.id}`, { method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`}, body: JSON.stringify(editForm)});
    if (!res.ok) {
      const e = await res.json().catch(()=>({message:'Failed'}));
      return showMsg('error', e.message || 'Update failed — only pending can be edited');
    }
    showMsg('success','Request updated');
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarCheck/> Leave <span className="text-slate-500 font-normal">— Workflow §34</span></h1>
        <p className="text-sm text-slate-500">Balance → Manager approval → Calendar → Notification → Dashboard — Edit / Cancel / Delete pending anytime</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${msg.type==='error'?'bg-red-50 text-red-700 border border-red-200':'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <AlertCircle size={16}/> {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold">Request Leave</h3>
          <div className="mt-3 space-y-3">
            <select value={form.leave_type_id} onChange={e=>setForm({...form, leave_type_id:e.target.value})} className="w-full border rounded-xl px-3 py-2 bg-white">
              <option value="">Select type</option>
              {types.map(t=> <option key={t.id} value={t.id}>{t.name} ({t.maxDays} days)</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.start_date} onChange={e=>setForm({...form, start_date:e.target.value})} className="border rounded-xl px-3 py-2" />
              <input type="date" value={form.end_date} onChange={e=>setForm({...form, end_date:e.target.value})} className="border rounded-xl px-3 py-2" />
            </div>
            <input placeholder="Reason" value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} className="w-full border rounded-xl px-3 py-2" />
            <button onClick={submit} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold hover:bg-slate-800">Submit Request</button>
            <p className="text-xs text-slate-500">→ Manager inbox • HR command center • Auto calendar update §35 (Email/SMS/WhatsApp). Wrong entry? Delete / Cancel / Edit while pending.</p>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Clock size={16}/> Requests</h3><Pill tone="blue">{reqs.length} total</Pill></div>
          <div className="overflow-auto max-h-[520px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Type</th><th className="p-2">Dates</th><th className="p-2">Days</th><th className="p-2">Status</th><th className="text-right p-2">Actions</th></tr></thead>
              <tbody className="divide-y">
                {reqs.map((r:any)=> (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-2">{r.leaveType?.name || r.leaveTypeId?.slice(0,8)}</td>
                    <td className="p-2 text-xs">{new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}<div className="text-[11px] text-slate-500 truncate max-w-[160px]">{r.reason || ''}</div></td>
                    <td className="p-2 text-center">{Number(r.days).toString()}</td>
                    <td className="p-2"><Pill tone={r.status==='approved'?'emerald':r.status==='rejected'?'red':r.status==='cancelled'?'slate':r.status==='pending'?'amber':'slate'}>{r.status}</Pill></td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {/* Approve/Reject - shown for pending, backend enforces RBAC (manager/hr) */}
                        {r.status==='pending' && (
                          <>
                            <button onClick={()=>act(r.id,'approve')} title="Approve" className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"><Check size={12}/></button>
                            <button onClick={()=>act(r.id,'reject')} title="Reject" className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"><X size={12}/></button>
                          </>
                        )}
                        {/* Edit - only pending, owner/HR/manager */}
                        {r.status==='pending' && (
                          <button onClick={()=>startEdit(r)} title="Edit" className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center"><Pencil size={12}/></button>
                        )}
                        {/* Cancel - pending or approved */}
                        {(r.status==='pending' || r.status==='approved') && (
                          <button onClick={()=>cancel(r.id)} title="Cancel" className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center"><Ban size={12}/></button>
                        )}
                        {/* Delete - only pending (hard delete wrong entry) */}
                        {r.status==='pending' && (
                          <button onClick={()=>del(r.id)} title="Delete wrong entry" className="w-7 h-7 rounded-full bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-600 flex items-center justify-center border"><Trash2 size={12}/></button>
                        )}
                        {r.status!=='pending' && r.status!=='approved' && <span className="text-xs text-slate-400 px-1">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {reqs.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No requests — create one</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 text-[11px] text-slate-500 flex gap-3 flex-wrap">
            <span className="flex items-center gap-1"><Pencil size={10}/> Edit pending</span>
            <span className="flex items-center gap-1"><Trash2 size={10}/> Delete wrong pending</span>
            <span className="flex items-center gap-1"><Ban size={10}/> Cancel pending/approved</span>
            <span className="flex items-center gap-1"><Check size={10}/> Approve</span>
            <span className="flex items-center gap-1"><X size={10}/> Reject</span>
          </div>
        </GlassCard>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-lg flex items-center gap-2"><Pencil size={18}/> Edit Leave Request</h3>
            <p className="text-xs text-slate-500 mt-1">Only pending requests can be edited. {editing.status !== 'pending' && <span className="text-red-600 font-semibold">This request is {editing.status} and cannot be edited.</span>}</p>
            <div className="mt-4 space-y-3">
              <select value={editForm.leave_type_id} onChange={e=>setEditForm({...editForm, leave_type_id:e.target.value})} className="w-full border rounded-xl px-3 py-2 bg-white">
                <option value="">Select type</option>
                {types.map(t=> <option key={t.id} value={t.id}>{t.name} ({t.maxDays} days)</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-500">Start</label><input type="date" value={editForm.start_date} onChange={e=>setEditForm({...editForm, start_date:e.target.value})} className="w-full border rounded-xl px-3 py-2" /></div>
                <div><label className="text-xs text-slate-500">End</label><input type="date" value={editForm.end_date} onChange={e=>setEditForm({...editForm, end_date:e.target.value})} className="w-full border rounded-xl px-3 py-2" /></div>
              </div>
              <div><label className="text-xs text-slate-500">Reason</label><input placeholder="Reason" value={editForm.reason} onChange={e=>setEditForm({...editForm, reason:e.target.value})} className="w-full border rounded-xl px-3 py-2" /></div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={()=>setEditing(null)} className="px-4 py-2 rounded-xl border hover:bg-slate-50">Close</button>
              <button onClick={saveEdit} className="px-4 py-2 rounded-xl bg-slate-900 text-white flex items-center gap-2 hover:bg-slate-800"><Save size={14}/> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
