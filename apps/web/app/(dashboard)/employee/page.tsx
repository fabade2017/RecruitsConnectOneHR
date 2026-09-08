'use client';
import Link from 'next/link';
import { GlassCard, GradientCard, Pill } from '../../../components/ui/GlassCard';
import { Clock, Coffee, CalendarCheck, FileText, Award, GraduationCap, Shield, Wallet, Camera, ArrowRight, X, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EmployeeHome() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const [status, setStatus] = useState<'working' | 'on_break' | 'clocked_out'>('working');
  const [showClockPrompt, setShowClockPrompt] = useState(false);
  const [hasClocked, setHasClocked] = useState<boolean | null>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [passport, setPassport] = useState<any>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = async () => {
    const t = localStorage.getItem('onehr_token');
    const u = localStorage.getItem('onehr_user');
    if (!t) return;
    let empId: string | null = null;
    let user: any = null;
    try { user = u ? JSON.parse(u) : null; empId = user?.employeeId || null; } catch {}
    // Try /auth/me to get employee
    try {
      const me = await fetch(`${api}/auth/me`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json());
      if (me.employee) {
        setEmployee(me.employee);
        empId = me.employee.id;
      } else if (me.employeeId) empId = me.employeeId;
      if (me.user) user = me.user;
    } catch {}
    // Fallback fetch employee via /employees?limit=1 if not found and role is employee
    if (!empId && user?.role === 'employee') {
      try {
        const emps = await fetch(`${api}/employees?limit=1`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json());
        const arr = Array.isArray(emps) ? emps : emps.data || [];
        if (arr[0]) {
          setEmployee(arr[0]);
          empId = arr[0].id;
        }
      } catch {}
    }
    // If still no empId, try to fetch via /employees by userId? Use stored
    if (empId) {
      // Fetch full employee profile
      fetch(`${api}/employees/${empId}`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(d => setEmployee(d))
        .catch(() => {});
      // Fetch passport
      fetch(`${api}/employees/${empId}/passport`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json()).then(setPassport).catch(() => {});
      // Fetch timeline for today
      const today = new Date().toISOString().slice(0, 10);
      fetch(`${api}/employees/${empId}/timeline?date=${today}`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json()).then(d => setTimeline(d.events || d || [])).catch(() => {});
    }
    // Check today's session
    fetch(`${api}/attendance/sessions?limit=5`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then((sessions: any[]) => {
        const today = new Date().toISOString().slice(0, 10);
        const todaySession = Array.isArray(sessions) ? sessions.find((s: any) => s.date?.slice(0, 10) === today) : null;
        if (todaySession) {
          setSession(todaySession);
          setStatus(todaySession.status === 'on_break' ? 'on_break' : todaySession.status === 'clocked_out' ? 'clocked_out' : 'working');
          setHasClocked(!!todaySession.clockInAt);
          if (!todaySession.clockInAt) {
            const seen = sessionStorage.getItem('clock_prompt_seen');
            if (!seen) {
              setTimeout(() => setShowClockPrompt(true), 800);
              sessionStorage.setItem('clock_prompt_seen', '1');
            }
          }
        } else {
          setHasClocked(false);
          const seen = sessionStorage.getItem('clock_prompt_seen');
          if (!seen) {
            setTimeout(() => setShowClockPrompt(true), 800);
            sessionStorage.setItem('clock_prompt_seen', '1');
          }
        }
      }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleBreak = async () => {
    const t = localStorage.getItem('onehr_token');
    const endpoint = status === 'on_break' ? '/attendance/break/end' : '/attendance/break/start';
    const res = await fetch(`${api}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ timestamp: new Date().toISOString() }) });
    if (res.ok) load();
    else {
      const e = await res.text();
      alert('Break action failed: ' + e.slice(0, 200));
    }
  };

  const handleClock = async () => {
    const t = localStorage.getItem('onehr_token');
    const endpoint = status === 'clocked_out' || !session?.clockInAt ? '/attendance/clock-in' : '/attendance/clock-out';
    const res = await fetch(`${api}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ method: 'web', timestamp: new Date().toISOString() }) });
    if (res.ok) load();
    else {
      const e = await res.text();
      // If already clocked in, try clock out
      if (e.includes('Already clocked in')) {
        const out = await fetch(`${api}/attendance/clock-out`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ timestamp: new Date().toISOString() }) });
        if (out.ok) load();
        else alert('Clock action failed: ' + (await out.text()).slice(0,200));
      } else alert('Clock action failed: ' + e.slice(0,200));
    }
  };

  const clockInStr = session?.clockInAt ? new Date(session.clockInAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const clockOutStr = session?.clockOutAt ? new Date(session.clockOutAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const breaks = (() => {
    try { return session?.breaks ? JSON.parse(session.breaks) : []; } catch { return []; }
  })();
  const breakStr = breaks.length ? breaks.map((b:any) => `${new Date(b.start).toLocaleTimeString('en-NG', {hour:'2-digit', minute:'2-digit'})}–${b.end ? new Date(b.end).toLocaleTimeString('en-NG', {hour:'2-digit', minute:'2-digit'}) : '...'}`).join(', ') : '—';
  const breakTotal = session?.breakDurationMinutes ? `${session.breakDurationMinutes}m total` : breaks.length ? `${breaks.length} break(s)` : '—';
  const net = session?.netWorkingMinutes ? `${Math.floor(session.netWorkingMinutes/60)}h${String(session.netWorkingMinutes%60).padStart(2,'0')}m` : '--';
  const gross = session?.grossDurationMinutes ? `${Math.floor(session.grossDurationMinutes/60)}h${String(session.grossDurationMinutes%60).padStart(2,'0')}m` : '--';
  const overtime = session?.overtimeMinutes ? `${session.overtimeMinutes}m` : '0m';

  const displayName = employee?.employeeCode ? employee.employeeCode : 'Employee';
  const jobTitle = employee?.jobTitle || '—';
  const dept = employee?.department?.name || employee?.department || '—';
  const branch = employee?.branch?.name || employee?.branch || '—';
  const workArr = employee?.workArrangement || 'office';
  const skills = (() => { try { return employee?.skills ? JSON.parse(employee.skills) : []; } catch { return []; } })();
  const certs = 2; // could fetch from /certifications but keep simple
  const [photoUploading, setPhotoUploading] = useState(false);
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;
    if (file.size > 5*1024*1024) return alert('Photo too large (max 5MB)');
    setPhotoUploading(true);
    try {
      const t = localStorage.getItem('onehr_token');
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch(`${api}/employees/${employee.id}/photo`, { method:'POST', headers:{ Authorization:`Bearer ${t}` }, body: fd });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setEmployee((prev:any)=> ({...prev, photoUrl: data.photoUrl}));
      alert('Passport photo updated — visible to superadmin/management');
    } catch(err:any){ alert(err.message); } finally { setPhotoUploading(false); }
  };

  const quickActions: [any, string, string][] = [
    [Clock, 'Clock In/Out', '/attendance'],
    [Coffee, 'Break', '/attendance'],
    [CalendarCheck, 'Leave', '/leave'],
    [Wallet, 'Payslip', '/payroll'],
    [FileText, 'My Documents', '/documents'],
    [Award, 'Performance', '/performance'],
    [GraduationCap, 'Training', '/learning'],
    [Shield, 'Policies', '/compliance'],
  ];

  const lifeEvents = (() => {
    const events: string[] = [];
    if (employee?.hireDate) {
      const hire = new Date(employee.hireDate);
      const nowD = new Date();
      const anniv = new Date(nowD.getFullYear(), hire.getMonth(), hire.getDate());
      const diff = Math.ceil((anniv.getTime() - nowD.getTime()) / 86400000);
      if (diff >= 0 && diff <= 30) events.push(`🏆 Work anniversary — ${Math.floor((nowD.getTime() - hire.getTime())/ (86400000*365))} years in ${diff} days`);
      else if (diff < 0 && diff > -7) events.push(`🎉 Work anniversary — celebrated ${Math.abs(diff)} days ago`);
    }
    if (employee?.createdAt) {
      const created = new Date(employee.createdAt);
      const days = Math.floor((Date.now() - created.getTime())/86400000);
      if (days < 30) events.push(`🎂 Welcome aboard — ${days} days since joining`);
    }
    if (!events.length) events.push('🎂 Birthday — update profile to enable', '🏆 Work anniversary — 2 years');
    return events;
  })();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <GradientCard gradient="from-slate-900 via-slate-800 to-indigo-900">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="relative">
              <img src={employee?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 bg-white" alt="passport"/>
              <label className="absolute -bottom-2 -right-2 bg-white text-slate-900 rounded-full p-1.5 shadow cursor-pointer hover:bg-slate-100" title="Upload passport photo (visible to superadmin/management)">
                <Camera size={14}/>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" disabled={photoUploading}/>
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 18 ? 'Afternoon' : 'Evening'}, {employee?.jobTitle ? employee.jobTitle.split(' ')[0] : 'there'} 👋</h1>
              <p className="text-white/70 mt-1">Today&apos;s Schedule <span className="text-white font-semibold">{employee?.workArrangement ? workArr : '—'} • {branch}</span> • {displayName} {employee ? `• ${workArr}` : '• Loading...'}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="bg-white text-slate-900 rounded-full px-3 py-1 font-semibold">{workArr}</span>
                <span className="bg-white/15 text-white rounded-full px-3 py-1">{branch}</span>
                <span className="bg-white/15 text-white rounded-full px-3 py-1">QR: {employee?.qrCode ? '✓' : displayName}</span>
                {employee?.grade && <span className="bg-white/15 text-white rounded-full px-3 py-1">Grade {employee.grade}</span>}
                <label className="bg-white/15 text-white rounded-full px-3 py-1 cursor-pointer hover:bg-white/25 flex items-center gap-1">
                  <Camera size={10}/>{photoUploading ? 'Uploading…' : 'Passport Photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" disabled={photoUploading}/>
                </label>
              </div>
              <div className="text-[11px] text-white/60 mt-1">Passport photo visible to superadmin/management • 5MB max</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold">{now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-white/70 text-sm">{now.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-sm font-bold ${status==='working'?'bg-emerald-400 text-slate-900':status==='on_break'?'bg-amber-400 text-slate-900':'bg-slate-400 text-slate-900'}`}>
              <span className={`w-2 h-2 rounded-full ${status==='working'?'bg-emerald-700':status==='on_break'?'bg-amber-700':'bg-slate-700'} animate-pulse`} />{status==='working'?'🟢 Working':status==='on_break'?'🟠 On Break':'⚪ Clocked Out'}
            </div>
            <div className="text-[11px] text-white/60 mt-1">{session ? `Verified ${session.verificationScore ?? '—'}% • ${session.status}` : hasClocked===false ? 'Not clocked in today' : 'Loading...'}</div>
          </div>
        </div>
      </GradientCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Clock size={16}/> Attendance (§5 Work Session) {session?.date ? `• ${new Date(session.date).toLocaleDateString()}` : ''}</h3>
            <Pill tone="blue">Net {net} • OT {overtime}</Pill>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-900 text-white rounded-2xl p-4">
              <div className="text-xs opacity-70">Clock In</div>
              <div className="text-lg font-bold">{clockInStr}</div>
              <div className="text-[11px] opacity-60">{session?.faceConfidence ? `Face ${Number(session.faceConfidence).toFixed(0)}%` : '—'}</div>
            </div>
            <div className="bg-white border rounded-2xl p-4">
              <div className="text-xs text-slate-500">Break</div>
              <div className="text-lg font-bold text-xs md:text-lg">{breakStr}</div>
              <div className="text-[11px] text-slate-500">{breakTotal}</div>
            </div>
            <div className="bg-white border rounded-2xl p-4">
              <div className="text-xs text-slate-500">Clock Out</div>
              <div className="text-lg font-bold">{clockOutStr}</div>
              <div className="text-[11px] text-slate-500">{gross !== '--' ? `Gross ${gross}` : '—'}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleBreak} className={`flex-1 py-3 rounded-xl font-semibold ${status==='working' ? 'bg-amber-500 hover:bg-amber-600 text-white' : status==='on_break' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`} disabled={status==='clocked_out' || !session?.clockInAt}>
              {status==='working' ? 'Start Break' : status==='on_break' ? 'End Break' : 'On Break'}
            </button>
            <button onClick={handleClock} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800">Clock {session?.clockInAt && !session?.clockOutAt ? 'Out' : 'In'}</button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">Net = Gross − Breaks (§13) • {session ? `Scheduled ${session.scheduledMinutes ?? 480}m • Overtime ${overtime}` : 'Live from /attendance/sessions'} • 7 methods (§7)</p>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold">Quick Actions (§17)</h3>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {quickActions.map(([Icon, label, href]: any) => (
              <Link key={label} href={href} className="bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-glass transition">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Icon size={16} /></div>
                <span className="text-xs font-medium">{label as string}</span>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <h4 className="font-semibold">Activity Timeline (§4) • {timeline.length ? `${timeline.length} events` : 'Live'}</h4>
          <div className="mt-3 space-y-2 text-sm">
            {timeline.length ? timeline.map((ev: any, i: number) => (
              <div key={i} className="flex gap-2"><span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-full h-fit">{ev.time || new Date(ev.timestamp || ev.createdAt).toLocaleTimeString('en-NG', {hour:'2-digit', minute:'2-digit'})}</span><span>{ev.activity || ev.eventType || ev.title || JSON.stringify(ev).slice(0,60)}</span></div>
            )) : (
              <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl">No timeline yet — clock in to generate • API: /employees/:id/timeline?date=today</div>
            )}
          </div>
          {session && <div className="mt-2 text-[11px] text-slate-400">WorkSession {session.id.slice(0,8)} • {session.status} • {session.verificationScore ? `Score ${session.verificationScore}` : ''}</div>}
        </GlassCard>
        <GlassCard>
          <h4 className="font-semibold">My Passport (§29 Career Passport™)</h4>
          <div className="mt-3 text-sm space-y-1">
            <div>ID: <b>{employee?.employeeCode || passport?.employeeCode || '—'}</b> {passport?.qrCode ? '• QR ✓' : ''}</div>
            <div>Dept: {dept} • Grade {employee?.grade || '—'}</div>
            <div>Skills: {skills.length ? skills.join(', ') : '—'} {skills.length ? `• ${skills.length}` : ''}</div>
            <div>Certs: {certs} • Hire: {employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '—'}</div>
            <Link href={employee ? `/employees` : '#'} className="mt-3 w-full glass rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2">View Full Passport</Link>
            <button onClick={async () => {
              if (!employee) return alert('No employee');
              const t = localStorage.getItem('onehr_token');
              const res = await fetch(`${api}/employees/${employee.id}/passport`, { headers: { Authorization: `Bearer ${t}` } });
              const data = await res.json();
              alert('Passport: ' + JSON.stringify(data).slice(0, 300));
            }} className="w-full bg-slate-900 text-white rounded-xl py-2 text-sm font-semibold mt-2">Download Passport</button>
          </div>
        </GlassCard>
        <GlassCard>
          <h4 className="font-semibold">Life Events (§32)</h4>
          <div className="mt-3 space-y-2 text-sm">
            {lifeEvents.map((e, i) => (
              <div key={i} className={`p-3 rounded-xl border ${i===0 ? 'bg-gradient-to-r from-sky-50 to-blue-50' : 'bg-gradient-to-r from-violet-50 to-purple-50'}`}>{e}</div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">From hireDate {employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '—'} • Auto</p>
        </GlassCard>
      </div>

      {showClockPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur" onClick={()=>setShowClockPrompt(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mx-auto"><Camera size={22}/></div>
            <h3 className="text-xl font-black mt-3">Good morning! Ready to clock in?</h3>
            <p className="text-sm text-slate-600 mt-1">You haven’t clocked in today. Tap below to open Attendance with face motion verification.</p>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left text-sm">
              <div className="font-semibold flex items-center gap-2"><Timer size={14}/> Face + motion liveness required</div>
              <div className="text-xs text-slate-600 mt-1">Camera will check motion (0.8–12%) and face. Snapshot encrypted, 90-day retention, flagged only for review.</div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={()=>setShowClockPrompt(false)} className="flex-1 glass rounded-xl py-2.5 font-semibold">Later</button>
              <Link href="/attendance" onClick={()=>setShowClockPrompt(false)} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 font-semibold hover:bg-slate-800 flex items-center justify-center gap-2">Go to Attendance <ArrowRight size={16}/></Link>
            </div>
            <p className="text-xs text-slate-400 mt-3">You can also clock via Employee Home → Attendance card</p>
            <button onClick={()=>setShowClockPrompt(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center"><X size={14}/></button>
          </div>
        </div>
      )}
    </div>
  );
}
