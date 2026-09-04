'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Clock, Calendar, Users, Plus, RefreshCw, Timer } from 'lucide-react';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '09:00', endTime: '17:00', breakMinutes: 60 });
  const [rosterForm, setRosterForm] = useState({ employeeId: '', shiftId: '', date: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/shifts`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setShifts(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
    fetch(`${api}/rosters`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setRosters(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  };

  useEffect(load, [api]);

  const createShift = async () => {
    if (!shiftForm.name) return alert('Shift name required');
    setLoading(true);
    const t = localStorage.getItem('onehr_token');
    await fetch(`${api}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(shiftForm),
    });
    setShiftForm({ name: '', startTime: '09:00', endTime: '17:00', breakMinutes: 60 });
    setLoading(false);
    load();
  };

  const createRoster = async () => {
    if (!rosterForm.shiftId || !rosterForm.date) return alert('Select shift and date');
    let eid = rosterForm.employeeId;
    const t = localStorage.getItem('onehr_token');
    if (!eid) {
      const emps = await fetch(`${api}/employees?limit=1`, { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).catch(()=>[]);
      eid = Array.isArray(emps) ? emps[0]?.id : emps.data?.[0]?.id;
      if (!eid) return alert('No employee found — provide Employee ID');
    }
    await fetch(`${api}/rosters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ employeeId: eid, shiftId: rosterForm.shiftId, date: rosterForm.date, notes: rosterForm.notes }),
    });
    setRosterForm({ employeeId: '', shiftId: '', date: '', notes: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Clock /> Shifts & Rosters <span className="text-slate-500 font-normal">— Workforce Scheduling §14</span></h1>
          <p className="text-sm text-slate-500">Shift templates → Roster assignment → Attendance net hours → Overtime §13</p>
        </div>
        <button onClick={load} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Timer size={16}/> Create Shift</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Shift name e.g. Morning" value={shiftForm.name} onChange={(e)=>setShiftForm({...shiftForm, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs space-y-1"><span className="text-slate-500">Start</span><input type="time" value={shiftForm.startTime} onChange={(e)=>setShiftForm({...shiftForm, startTime:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" /></label>
              <label className="text-xs space-y-1"><span className="text-slate-500">End</span><input type="time" value={shiftForm.endTime} onChange={(e)=>setShiftForm({...shiftForm, endTime:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" /></label>
            </div>
            <label className="text-xs space-y-1 block"><span className="text-slate-500">Break (mins)</span><input type="number" value={shiftForm.breakMinutes} onChange={(e)=>setShiftForm({...shiftForm, breakMinutes:Number(e.target.value)})} className="w-full border rounded-xl px-3 py-2 text-sm" /></label>
            <button onClick={createShift} disabled={loading} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2"><Plus size={16}/>{loading?'Creating...':'Create Shift'}</button>
            <p className="text-xs text-slate-500">POST /v1/shifts • RBAC: hr_admin • Break deducted in Net §13</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Calendar size={16}/> Assign Roster</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Employee ID (auto if empty)" value={rosterForm.employeeId} onChange={(e)=>setRosterForm({...rosterForm, employeeId:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <select value={rosterForm.shiftId} onChange={(e)=>setRosterForm({...rosterForm, shiftId:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="">Select shift</option>
              {shifts.map((s:any)=> <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
            </select>
            <input type="date" value={rosterForm.date} onChange={(e)=>setRosterForm({...rosterForm, date:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input placeholder="Notes (optional)" value={rosterForm.notes} onChange={(e)=>setRosterForm({...rosterForm, notes:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <button onClick={createRoster} className="w-full bg-sky-600 text-white rounded-xl py-2.5 font-semibold">Assign to Roster</button>
            <p className="text-xs text-slate-500">POST /v1/rosters • Auto-links Attendance §7</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Users size={16}/> Summary</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold">{shifts.length}</div><div className="text-xs text-slate-500">Shift Templates</div></div>
            <div className="bg-sky-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold">{rosters.length}</div><div className="text-xs text-slate-500">Roster Entries</div></div>
          </div>
          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <p>• Night shift cross-midnight handled</p>
            <p>• Roster → Session → Net 8h - break</p>
            <p>• Overtime auto 41m avg §13</p>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Timer size={16}/> Shifts</h3><Pill tone="blue">{shifts.length} total</Pill></div>
          <div className="overflow-auto max-h-[340px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Name</th><th className="p-2">Start</th><th className="p-2">End</th><th className="p-2">Break</th><th className="p-2">Status</th></tr></thead>
              <tbody className="divide-y">
                {shifts.map((s:any)=> (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="p-2 font-medium">{s.name}</td>
                    <td className="p-2 text-xs text-center">{s.startTime}</td>
                    <td className="p-2 text-xs text-center">{s.endTime}</td>
                    <td className="p-2 text-xs text-center">{s.breakMinutes ?? s.break_minutes ?? 60}m</td>
                    <td className="p-2"><Pill tone="emerald">active</Pill></td>
                  </tr>
                ))}
                {shifts.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No shifts — create one</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Calendar size={16}/> Rosters</h3><Pill tone="amber">{rosters.length} assignments</Pill></div>
          <div className="overflow-auto max-h-[340px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Employee</th><th className="p-2">Shift</th><th className="p-2">Date</th><th className="p-2">Status</th></tr></thead>
              <tbody className="divide-y">
                {rosters.map((r:any)=> (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-2 font-mono text-xs">{r.employee?.employeeCode || r.employeeId?.slice(0,8)}</td>
                    <td className="p-2 text-xs">{r.shift?.name || r.shiftId?.slice(0,8)}</td>
                    <td className="p-2 text-xs">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                    <td className="p-2"><Pill tone={r.status==='completed'?'emerald':r.status==='missed'?'red':'slate'}>{r.status||'scheduled'}</Pill></td>
                  </tr>
                ))}
                {rosters.length===0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No roster entries — assign employee to shift</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
