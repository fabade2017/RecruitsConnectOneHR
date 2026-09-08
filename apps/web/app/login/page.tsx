'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@recruitconnect.ng');
  const [password, setPassword] = useState('Admin@123');
  const [acronym, setAcronym] = useState('RC');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClockPopup, setShowClockPopup] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acronym.trim()) return setError('Organization acronym is required');
    setLoading(true); setError('');
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, org_acronym: acronym.trim().toUpperCase(), acronym: acronym.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      document.cookie = `onehr_auth=${data.access_token}; path=/; max-age=${7*86400}; SameSite=Lax`;
      localStorage.setItem('onehr_token', data.access_token);
      localStorage.setItem('onehr_user', JSON.stringify(data.user));
      const role = data.user.role;
      // Employee gets immediate clock-in popup
      if (role === 'employee') {
        setPendingUser(data.user);
        setShowClockPopup(true);
        return;
      }
      const target = role === 'super_admin' ? '/admin' : role === 'manager' ? '/manager' : role === 'executive' ? '/executive' : role === 'recruiter' ? '/jobs' : '/hr';
      router.push(target);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  const goAttendance = () => {
    if (pendingUser) router.push('/attendance');
    else router.push('/employee');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-8 w-full max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="OneHR" className="w-10 h-10 rounded-xl shadow" />
          <div>
            <h1 className="text-2xl font-bold leading-none">RecruitConnect OneHR™</h1>
            <p className="text-[11px] tracking-widest text-slate-500">WORKFORCE INTELLIGENCE</p>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold">Sign in</h2>
          <p className="text-sm text-slate-500">HR Management — Sign in</p>
          <p className="text-xs text-slate-400 mt-1">Try: RC / admin@recruitconnect.ng / Admin@123 — Acronym + email + password</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{error}</div>}
        <input className="w-full border rounded px-3 py-2 font-mono" placeholder="Organization Acronym (e.g. RC)" value={acronym} onChange={e=>setAcronym(e.target.value.toUpperCase())} required />
        <p className="text-xs text-slate-400 -mt-2">Acronym is required for tenant isolation. Check your welcome email.</p>
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button disabled={loading} className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="text-xs text-slate-500 space-y-1">
          <p><b>HR:</b> hr_admin → Full HR, payroll, attendance exceptions</p>
          <p><b>Manager:</b> manager → Team only, leave approvals</p>
          <p><b>Employee:</b> employee → Self only, clock-in, leave request, payslip</p>
        </div>
        <p className="text-xs text-center text-slate-400">RBAC enforced by API <code>JwtAuthGuard</code> + <code>RbacGuard</code> — UI is role-aware, API is source of truth.</p>
      </form>

      {showClockPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur" onClick={()=> setShowClockPopup(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mx-auto">✓</div>
            <h3 className="text-xl font-black mt-3">Welcome, {pendingUser?.email?.split('@')[0]} 👋</h3>
            <p className="text-sm text-slate-600 mt-1">You’re signed in as <b>Employee</b>. Ready to start your work session?</p>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-left">
              <div className="font-semibold flex items-center gap-2">⏰ Clock in required</div>
              <div className="text-xs text-slate-600 mt-1">Face motion + liveness verification will open. Your snap is encrypted, 90-day retention, flagged only for review.</div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={()=> setShowClockPopup(false)} className="flex-1 glass rounded-xl py-2.5 font-semibold">Later, go to Home</button>
              <button onClick={goAttendance} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 font-semibold hover:bg-slate-800">Go to Attendance →</button>
            </div>
            <p className="text-xs text-slate-400 mt-3">Employee Home → Quick Actions → Clock In also available</p>
          </div>
        </div>
      )}
    </main>
  );
}
