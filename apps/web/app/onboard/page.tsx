'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Public self-onboarding page. The invite link is `${WEB_APP_URL}/onboard/?token=<token>`
// (query route keeps this exportable as a static out/onboard/index.html).
export default function OnboardPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const [token, setToken] = useState('');
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<any>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || '';
    setToken(t);
    if (!t) { setError('Missing invitation token. Use the link from your invitation email.'); setLoading(false); return; }
    fetch(`${api}/staff-invites/${encodeURIComponent(t)}`)
      .then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || 'Invalid invitation'); return d; })
      .then(d => { setInvite(d); setForm(f => ({ ...f, first_name: d.firstName || '', last_name: d.lastName || '', phone: d.phone || '' })); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${api}/staff-invites/${encodeURIComponent(token)}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email: invite?.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not create your profile');
      setDone(data);
    } catch (err: any) { setError(err.message || 'Could not create your profile'); }
    finally { setSubmitting(false); }
  }

  const orgName = invite?.organization?.name || 'your organization';

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo.svg" alt="OneHR" className="w-10 h-10 rounded-xl shadow" />
          <div>
            <h1 className="text-xl font-bold leading-none">RecruitConnect OneHR™</h1>
            <p className="text-[11px] tracking-widest text-slate-500">CREATE YOUR PROFILE</p>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-500">Checking your invitation…</p>}

        {!loading && done && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl">✓</div>
            <h2 className="text-lg font-bold">Profile created</h2>
            <p className="text-sm text-slate-600">Welcome to <b>{orgName}</b>! Your employee ID is <b>{done.employeeCode}</b>.</p>
            <p className="text-sm text-slate-600">You can now sign in with <b>{done.email}</b> and the password you just set.</p>
            <button onClick={() => router.push('/login')} className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800">Go to sign in</button>
          </div>
        )}

        {!loading && !done && error && !invite && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{error}</div>
        )}

        {!loading && !done && invite && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">Welcome to {orgName}</h2>
              <p className="text-sm text-slate-500">You've been invited as <b>{invite.role}</b>. Set your details to activate your account.</p>
            </div>
            {invite.jobTitle && <p className="text-xs text-slate-400">Role: {invite.jobTitle}</p>}
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{error}</div>}
            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input className="w-full border rounded px-3 py-2 bg-slate-50 text-slate-500" value={invite.email} readOnly />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2" placeholder="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
              <input className="border rounded px-3 py-2" placeholder="Last name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <input className="w-full border rounded px-3 py-2" placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input className="w-full border rounded px-3 py-2" type="password" placeholder="Choose a password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <input className="w-full border rounded px-3 py-2" type="password" placeholder="Confirm password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            <button disabled={submitting} className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 disabled:opacity-50">
              {submitting ? 'Creating your profile…' : 'Create my profile'}
            </button>
            <p className="text-xs text-center text-slate-400">Your password is stored securely (bcrypt). You can change it later from your profile.</p>
          </form>
        )}
      </div>
    </main>
  );
}
