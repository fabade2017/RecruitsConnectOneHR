'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Package, Laptop, Plus, RefreshCw, UserPlus, Undo2, Search } from 'lucide-react';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', serialNumber: '', category: 'LAPTOP', status: 'available' });
  const [assign, setAssign] = useState({ assetId: '', employeeId: '' });
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/assets`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setAssets(d);
        else if (Array.isArray(d.data)) setAssets(d.data);
        else if (d.assets) setAssets(d.assets);
        else setAssets([]);
      })
      .catch(()=> setAssets([]));
  };
  useEffect(load, [api]);

  const createAsset = async () => {
    if (!form.name || !form.serialNumber) return alert('Name and serial required');
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const e = await res.text();
      return alert('Create failed: ' + e.slice(0, 200));
    }
    load();
    setForm({ name: '', serialNumber: '', category: 'LAPTOP', status: 'available' });
  };

  const assignAsset = async () => {
    let aid = assign.assetId;
    let eid = assign.employeeId;
    if (!aid) return alert('Select/enter Asset ID');
    const t = localStorage.getItem('onehr_token');
    if (!eid) {
      const emps = await fetch(`${api}/employees?limit=1`, { headers: { Authorization: `Bearer ${t}` } }).then((r)=>r.json()).catch(()=>[]);
      eid = Array.isArray(emps) ? emps[0]?.id : emps.data?.[0]?.id;
      if (!eid) return alert('No employee found — enter Employee ID');
    }
    const res = await fetch(`${api}/assets/${aid}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ employeeId: eid }),
    });
    if (!res.ok) {
      const e = await res.text();
      return alert('Assign failed: ' + e.slice(0, 200));
    }
    load();
    setAssign({ assetId: '', employeeId: '' });
  };

  const returnAsset = async (id:string) => {
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/assets/${id}/return`, { method: 'POST', headers:{Authorization:`Bearer ${t}`} });
    if (!res.ok) {
      const e = await res.text();
      return alert('Return failed: ' + e.slice(0, 200));
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package/> Assets <span className="text-slate-500 font-normal">— Inventory §22</span></h1>
          <p className="text-sm text-slate-500">Register → Assign → Return → Lifecycle (available / assigned / maintenance / retired)</p>
        </div>
        <button onClick={load} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Laptop size={16}/> Register Asset</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Name e.g. MacBook Pro" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input placeholder="Serial e.g. SN-12345" value={form.serialNumber} onChange={(e)=>setForm({...form, serialNumber:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <select value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="LAPTOP">Laptop</option>
              <option value="MONITOR">Monitor</option>
              <option value="PHONE">Phone</option>
              <option value="TABLET">Tablet</option>
              <option value="FURNITURE">Furniture</option>
              <option value="OTHER">Other</option>
            </select>
            <select value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="available">available</option>
              <option value="assigned">assigned</option>
              <option value="maintenance">maintenance</option>
              <option value="retired">retired</option>
            </select>
            <button onClick={createAsset} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2"><Plus size={16}/>Add Asset</button>
            <p className="text-xs text-slate-500">POST /v1/assets • RBAC hr_admin • Live API</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><UserPlus size={16}/> Assign Asset</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Asset ID (or pick from table)" value={assign.assetId} onChange={(e)=>setAssign({...assign, assetId:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <select value={assign.assetId} onChange={(e)=>setAssign({...assign, assetId:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="">— or select —</option>
              {assets.map((a:any)=> <option key={a.id} value={a.id}>{a.name} — {a.serialNumber || a.serial}</option>)}
            </select>
            <input placeholder="Employee ID (auto if empty)" value={assign.employeeId} onChange={(e)=>setAssign({...assign, employeeId:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <button onClick={assignAsset} className="w-full bg-sky-600 text-white rounded-xl py-2.5 font-semibold">Assign to Employee</button>
            <p className="text-xs text-slate-500">POST /v1/assets/:id/assign • Links employee • Live</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Search size={16}/> Inventory Stats</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100"><div className="text-xl font-bold text-emerald-700">{assets.filter((a:any)=>a.status==='available').length}</div><div className="text-xs text-emerald-700">Available</div></div>
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100"><div className="text-xl font-bold text-amber-700">{assets.filter((a:any)=>a.status==='assigned').length}</div><div className="text-xs text-amber-700">Assigned</div></div>
            <div className="bg-slate-50 rounded-xl p-3 text-center"><div className="text-xl font-bold">{assets.filter((a:any)=>a.status==='maintenance').length}</div><div className="text-xs text-slate-500">Maintenance</div></div>
            <div className="bg-slate-900 text-white rounded-xl p-3 text-center"><div className="text-xl font-bold">{assets.length}</div><div className="text-xs text-slate-300">Total</div></div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Lifecycle tracked • GET /v1/assets • POST /:id/return • Live</p>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Package size={16}/> Assets Registry</h3><Pill tone="blue">{assets.length} items</Pill></div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Name</th><th className="p-2">Serial</th><th className="p-2">Category</th><th className="p-2">Employee</th><th className="p-2">Status</th><th className="text-right p-2">Actions</th></tr></thead>
            <tbody className="divide-y">
              {assets.map((a:any)=> (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="p-2 font-medium">{a.name}</td>
                  <td className="p-2 font-mono text-xs">{a.serialNumber || a.serial}</td>
                  <td className="p-2 text-xs"><Pill tone="slate">{a.category}</Pill></td>
                  <td className="p-2 text-xs font-mono">{a.employee?.employeeCode || a.employeeId?.slice(0,8) || '—'}</td>
                  <td className="p-2"><Pill tone={a.status==='available'?'emerald':a.status==='assigned'?'amber':a.status==='maintenance'?'red':'slate'}>{a.status}</Pill></td>
                  <td className="p-2 text-right">
                    {a.status==='assigned' ? (
                      <button onClick={()=>returnAsset(a.id)} className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs flex items-center gap-1 ml-auto"><Undo2 size={12}/> Return</button>
                    ) : (
                      <button onClick={()=>setAssign({...assign, assetId:a.id})} className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs">Assign</button>
                    )}
                  </td>
                </tr>
              ))}
              {assets.length===0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No assets — register one (hr_admin)</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 text-xs text-slate-500">Live from GET /v1/assets • No mock • RBAC: hr_admin / org_admin</div>
      </GlassCard>
    </div>
  );
}
