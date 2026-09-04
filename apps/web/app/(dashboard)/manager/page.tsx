'use client';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { Users, Clock, CalendarCheck, Timer, AlertTriangle, Briefcase, TrendingUp, GraduationCap, Gift, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ManagerDashboard() {
  const [live, setLive] = useState<any>(null);
  const [scores, setScores] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leavePending, setLeavePending] = useState<number>(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  useEffect(() => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    const h = { Authorization: `Bearer ${t}` };
    fetch(`${api}/attendance/command-center`, { headers: h }).then(r => r.json()).then(setLive).catch(() => {});
    fetch(`${api}/analytics/workforce-scores`, { headers: h }).then(r => r.json()).then(setScores).catch(() => {});
    fetch(`${api}/tasks`, { headers: h }).then(r => r.json()).then(d => {
      const arr = Array.isArray(d) ? d : d.data || [];
      setTasks(arr);
    }).catch(() => {});
    fetch(`${api}/leave/requests?status=pending`, { headers: h }).then(r => r.json()).then(d => {
      const arr = Array.isArray(d) ? d : d.data || [];
      setLeavePending(arr.length);
    }).catch(() => {});
    fetch(`${api}/employees?limit=50`, { headers: h }).then(r => r.json()).then(d => {
      const arr = Array.isArray(d) ? d : d.data || [];
      setEmployees(arr);
    }).catch(() => {});
  }, [api]);

  // Derive stats from live (manager-scoped via backend RBAC)
  const present = live?.clocked_in ?? null;
  const absent = live?.absent ?? null;
  const late = live?.late ?? null;
  const onLeave = live?.on_leave ?? null;
  const onBreak = live?.on_break ?? null;
  const remote = live?.remote ?? null;
  const overtime = live?.overtime ?? null;
  const exceptions = live?.exceptions ?? null;
  // Clocked Out + Missing approximated from sessions: total - present - on_break - absent? Use live if available
  const teamSize = live?.employees ?? employees.length ?? null;

  const attendanceRate = scores?.attendance ?? null;
  const tasksCompleted = tasks.filter(t => t.status === 'done').length;
  const tasksTotal = tasks.length;
  const performance = scores?.performance ?? null;
  const workload = (() => {
    if (!tasks.length) return null;
    const pending = tasks.filter(t => t.status !== 'done').length;
    if (pending > 12) return '🔴 Critical';
    if (pending > 6) return '🟠 High';
    return '🟢 Balanced';
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Team <span className="text-slate-500 font-normal">— Manager (§16) • Live from /attendance/command-center</span></h1>
          <p className="text-sm text-slate-500">Team pulse — scoped to your direct reports via RBAC • {teamSize !== null ? `${teamSize} members` : 'Loading...'}</p>
        </div>
        <Pill tone="blue">{teamSize !== null ? `${teamSize} members` : 'Loading...'} • {live?.today ? live.today : ''}</Pill>
      </div>

      <div>
        <h3 className="text-xs tracking-widest font-semibold text-slate-500 mb-2">MY TEAM TODAY {live ? `• ${live.today}` : ''}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Present" value={present !== null ? String(present) : '—'} sub={teamSize ? `${Math.round((present||0)/teamSize*100)}%` : 'Live'} icon={Users} accent="from-emerald-500 to-teal-600" />
          <StatCard title="Absent" value={absent !== null ? String(absent) : '—'} sub={teamSize ? `${absent} absent` : 'Live'} icon={Users} accent="from-red-500 to-orange-600" />
          <StatCard title="Late" value={late !== null ? String(late) : '—'} sub={late ? `${late} late` : 'Live'} icon={Clock} accent="from-amber-500 to-orange-600" />
          <StatCard title="On Leave" value={onLeave !== null ? String(onLeave) : '—'} sub={onLeave ? `${onLeave} on leave` : 'Live'} icon={CalendarCheck} accent="from-sky-500 to-blue-600" />
          <StatCard title="On Break" value={onBreak !== null ? String(onBreak) : '—'} sub={onBreak ? `${onBreak} break` : 'Live'} icon={Timer} accent="from-amber-500 to-yellow-600" />
          <StatCard title="Remote" value={remote !== null ? String(remote) : '—'} sub={remote ? `${remote} remote` : 'Live'} icon={Users} accent="from-violet-500 to-purple-600" />
          <StatCard title="Clocked Out" value={live ? String(Math.max(0, (teamSize||0) - (present||0) - (onBreak||0))) : '—'} sub="Derived" icon={Clock} accent="from-slate-500 to-slate-600" />
          <StatCard title="Missing Out" value={exceptions !== null ? String(exceptions) : '—'} sub="Exceptions" icon={AlertTriangle} accent="from-red-500 to-red-600" />
          <StatCard title="Overtime" value={overtime !== null ? String(overtime) : '—'} sub={overtime ? `${overtime} OT` : 'Live'} icon={Briefcase} accent="from-sky-500 to-cyan-600" />
          <StatCard title="Pending" value={leavePending !== null ? String(leavePending) : '—'} sub="Leave/approvals" icon={CalendarCheck} accent="from-slate-900 to-slate-700" />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">API: /attendance/command-center (manager-scoped) • /leave/requests?status=pending • /tasks</p>
      </div>

      <div>
        <h3 className="text-xs tracking-widest font-semibold text-slate-500 mb-2">MY TEAM THIS MONTH</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard>
            <h4 className="font-semibold flex items-center gap-2"><TrendingUp size={16}/> Performance</h4>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between bg-slate-50 rounded-xl px-3 py-2"><span>Attendance rate</span><span className="font-bold">{attendanceRate !== null ? `${attendanceRate}%` : '—'}</span></div>
              <div className="flex justify-between bg-slate-50 rounded-xl px-3 py-2"><span>Tasks completed</span><span className="font-bold">{tasksTotal ? `${tasksCompleted}/${tasksTotal}` : '—'}</span></div>
              <div className="flex justify-between bg-slate-50 rounded-xl px-3 py-2"><span>Performance</span><span className="font-bold text-emerald-600">{performance !== null ? `${performance}%` : '—'}</span></div>
              <div className="flex justify-between bg-amber-50 rounded-xl px-3 py-2"><span>Workload</span><span className="font-bold">{workload || '—'} {tasksTotal ? `• ${tasksTotal - tasksCompleted} pending` : ''}</span></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">From /analytics/workforce-scores • /tasks</p>
          </GlassCard>
          <GlassCard>
            <h4 className="font-semibold flex items-center gap-2"><GraduationCap size={16}/> Growth</h4>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between bg-slate-50 rounded-xl px-3 py-2"><span>Training</span><span>{scores?.learning ? `${scores.learning}%` : '—'}</span></div>
              <div className="flex justify-between bg-slate-50 rounded-xl px-3 py-2"><span>Leave pending</span><span>{leavePending}</span></div>
              <div className="flex justify-between bg-slate-50 rounded-xl px-3 py-2"><span>Probation</span><span>{employees.filter(e => e.status === 'probation').length} due</span></div>
              <div className="flex justify-between bg-slate-50 rounded-xl px-3 py-2"><span>Issues</span><span>{exceptions !== null ? `${exceptions} exceptions` : '—'}</span></div>
            </div>
          </GlassCard>
          <GlassCard>
            <h4 className="font-semibold flex items-center gap-2"><Gift size={16}/> People</h4>
            <div className="mt-3 space-y-2 text-sm">
              <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 border">
                {employees.filter(e => {
                  const d = e.hireDate || e.createdAt;
                  if (!d) return false;
                  const hire = new Date(d);
                  const now = new Date();
                  return hire.getMonth() === now.getMonth();
                }).length} birthdays/anniversaries this month • {employees.length} team
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border">Team size {teamSize ?? '—'} • Live from /employees</div>
              <div className="p-3 rounded-xl bg-slate-50 border flex justify-between"><span>Workload</span><span className="font-bold">{workload || '—'}</span></div>
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="glass rounded-full px-3 py-1">Workload Monitor (§26) {workload || 'Live'}</span>
        <span className="glass rounded-full px-3 py-1">Live from APIs • {teamSize !== null ? `${teamSize} team` : 'Loading...'}</span>
      </div>
    </div>
  );
}
