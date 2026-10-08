'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { CreditCard, Package, Check, X, DollarSign, Shield, AlertTriangle, Lock, Calendar, Clock, RefreshCw, Receipt, Bell } from 'lucide-react';
import { getApiUrl, getAuthHeaders, isPlatformSuperAdmin } from '../../../lib/api';

export default function SubscriptionsPage() {
  const api = getApiUrl();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renewals, setRenewals] = useState<any[]>([]);
  const [renewing, setRenewing] = useState(false);
  const [orgId, setOrgId] = useState<string>('');
  const [plans, setPlans] = useState<any[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [platform, setPlatform] = useState(false);

  const load = async () => {
    const token = localStorage.getItem('onehr_token');
    const user = JSON.parse(localStorage.getItem('onehr_user')||'{}');
    const oid = user.org_id || user.organizationId;
    setPlatform(isPlatformSuperAdmin());
    setOrgId(oid);
    if (!oid) { setError('Missing organization context'); setLoading(false); return; }
    try {
      const res = await fetch(`${api}/organizations/${oid}/subscription`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Failed to load');
      setData(j);
      // also load renewals
      const rRes = await fetch(`${api}/organizations/${oid}/renewals`, { headers: { Authorization: `Bearer ${token}` } });
      if (rRes.ok) { const rj = await rRes.json(); setRenewals(Array.isArray(rj)?rj:[]); }
      // no active subscription → load plan catalog so the org can request one
      if (!j.hasSubscription) {
        const pRes = await fetch(`${api}/organizations/plans`, { headers: { Authorization: `Bearer ${token}` } });
        if (pRes.ok) { const pj = await pRes.json(); setPlans(Array.isArray(pj)?pj:[]); }
      }
    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const requestRenewal = async () => {
    if (!orgId) return;
    if (!confirm('Request yearly renewal? Super Admin will approve and you will receive receipt + notification.')) return;
    setRenewing(true);
    try {
      const token = localStorage.getItem('onehr_token');
      const res = await fetch(`${api}/organizations/${orgId}/renew`, { method:'POST', headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Renewal failed');
      alert(`Renewal requested! Amount ₦${Number(j.amount).toLocaleString()} — pending Super Admin approval. New expiry: ${new Date(j.newEndDate).toLocaleString()}`);
      load();
    } catch (e:any) { alert(e.message); } finally { setRenewing(false); }
  };

  const requestPlan = async (planId: string) => {
    if (!orgId) return;
    if (!confirm('Request this plan? Super Admin will review and grant access to your organisation.')) return;
    setRequesting(planId);
    try {
      const token = localStorage.getItem('onehr_token');
      const res = await fetch(`${api}/organizations/${orgId}/subscription-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Request failed');
      alert('Subscription request sent — pending Super Admin approval. You will gain access once approved.');
      load();
    } catch (e:any) { alert(e.message); } finally { setRequesting(null); }
  };

  const downloadReceipt = (r:any) => {
    const content = `RECEIPT\n${r.receiptNumber}\nOrg: ${data?.subscription?.organization?.name || orgId}\nPlan: ${r.plan?.name || data?.plan?.name}\nAmount: ₦${Number(r.amount).toLocaleString()}\nPeriod: ${new Date(r.previousEndDate).toLocaleDateString()} → ${new Date(r.newEndDate).toLocaleDateString()}\nApproved: ${r.approvedAt ? new Date(r.approvedAt).toLocaleString(): ''}\nStatus: ${r.status}\n`;
    const blob = new Blob([content], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`${r.receiptNumber}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading subscription…</div>;
  if (error) return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-red-700">
      {error}{' '}
      {platform
        ? <a href="/admin" className="underline">Super Admin → Organizations</a>
        : <>— contact Super Admin to assign a plan.</>}
    </div>
  );
  if (!data?.hasSubscription) {
    const pendingReq = renewals.find((r:any) => r.status === 'pending');
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard/> Subscription</h1>
          {platform && <Link href="/admin" className="glass rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-slate-100"><Shield size={14}/> Super Admin → Grant &amp; approve</Link>}
        </div>
        <GlassCard className="border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 font-bold text-amber-800"><AlertTriangle size={16}/> No active subscription</div>
          <p className="text-sm text-slate-600 mt-1">
            {pendingReq
              ? 'Your request is pending Super Admin approval — access unlocks once approved.'
              : 'Request a plan below (or wait for Super Admin to assign one). Once active, modules and pricing appear here.'}
          </p>
        </GlassCard>

        {pendingReq ? (
          <GlassCard>
            <h3 className="font-bold flex items-center gap-2"><Bell size={16}/> Request pending Super Admin approval</h3>
            <div className="mt-2 text-sm space-y-1">
              <div>Plan: <b>{pendingReq.plan?.name || '—'}</b> {pendingReq.plan?.slug && <span className="font-mono text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full">{pendingReq.plan.slug}</span>}</div>
              <div>Requested: <b>{new Date(pendingReq.requestedAt || pendingReq.createdAt).toLocaleString()}</b></div>
              <div>Amount: <b>₦{Number(pendingReq.amount).toLocaleString()}</b> / year</div>
              <div className="text-slate-500">New expiry: {pendingReq.newEndDate ? new Date(pendingReq.newEndDate).toLocaleString() : 'set on approval'}</div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard>
            <h3 className="font-bold flex items-center gap-2"><Package size={16}/> Request a plan</h3>
            <p className="text-xs text-slate-500 mt-1">Pick a plan — Super Admin approves, then your modules unlock.</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {plans.map((p:any) => (
                <div key={p.id} className="border rounded-xl p-4 bg-white flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="font-bold">{p.name}</div>
                    <Pill tone="blue">{p.billingCycle || 'yearly'}</Pill>
                  </div>
                  <div className="mt-2 text-xl font-black">₦{Number(p.totalPrice ?? p.price).toLocaleString()}<span className="text-xs font-normal text-slate-500"> / yr</span></div>
                  <div className="mt-1 text-xs text-slate-500">{p.maxEmployees} employees • {p.maxBranches} branches • {p.moduleCount ?? p.modules?.length ?? 0} modules</div>
                  {p.description && <p className="text-xs text-slate-500 mt-1 flex-1">{p.description}</p>}
                  <button
                    onClick={() => requestPlan(p.id)}
                    disabled={requesting !== null}
                    className="mt-3 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {requesting === p.id ? 'Requesting…' : <><Check size={14}/> Request plan</>}
                  </button>
                </div>
              ))}
              {plans.length === 0 && <p className="text-sm text-slate-400 col-span-full p-4 text-center">No plans published yet — contact Super Admin.</p>}
            </div>
          </GlassCard>
        )}

        {renewals.length > 0 && (
          <GlassCard>
            <h4 className="text-sm font-semibold">Request history</h4>
            <div className="mt-2 space-y-2 max-h-[200px] overflow-auto">
              {renewals.map((r:any) => (
                <div key={r.id} className="flex items-center justify-between border rounded-xl px-3 py-2 text-xs bg-white">
                  <div>
                    <div className="font-mono font-semibold">{r.plan?.name || r.planId?.slice(0,8)} • {r.status} {r.status==='pending' && <Pill tone="amber">pending</Pill>} {r.status==='approved' && <Pill tone="emerald">approved</Pill>} {r.status==='rejected' && <Pill tone="red">rejected</Pill>}</div>
                    <div className="text-slate-500">Requested {new Date(r.requestedAt || r.createdAt).toLocaleString()} • ₦{Number(r.amount).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    );
  }

  const plan = data.plan;
  const enabled = plan.modules || [];
  const disabled = data.disabledModules || [];
  const totalModule = data.totalModulePrice || 0;
  const total = data.totalPrice || 0;

  const expiresAt = data.subscription?.endDate ? new Date(data.subscription.endDate) : null;
  const daysLeft = data.daysLeft ?? (expiresAt ? Math.ceil((expiresAt.getTime() - Date.now())/86400000) : null);
  const pendingRenewal = renewals.find((r:any)=> r.status==='pending');
  const lastApproved = renewals.find((r:any)=> r.status==='approved');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="text-slate-900"/> Subscription <span className="text-slate-500 font-normal">— {data.subscription.organization?.name}</span></h1>
          <p className="text-sm text-slate-500">Yearly billing • Modules with individual pricing. Disabled modules are blocked (403).</p>
        </div>
        <div className="flex items-center gap-2">
          {platform && <Link href="/admin" className="glass rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-slate-100"><Shield size={14}/> Grant &amp; approve</Link>}
          <Pill tone="emerald">Active • {plan.name}</Pill>
        </div>
      </div>

      {/* Expiry & Renewal */}
      <GlassCard className={daysLeft!=null && daysLeft<30 ? 'border-amber-300 bg-amber-50/30' : daysLeft!=null && daysLeft<0 ? 'border-red-300 bg-red-50/30' : ''}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold flex items-center gap-2"><Calendar size={16}/> Subscription Period • Yearly</h3>
            <div className="mt-1 text-sm flex flex-wrap gap-3">
              <span className="flex items-center gap-1"><Clock size={14}/> Started: <b>{new Date(data.subscription.startDate).toLocaleString()}</b></span>
              <span className="flex items-center gap-1"><Calendar size={14}/> Expires: <b className={daysLeft!=null && daysLeft<7 ? 'text-red-600' : daysLeft!=null && daysLeft<30 ? 'text-amber-600' : ''}>{expiresAt ? expiresAt.toLocaleString() : '—'}</b> {daysLeft!=null && <Pill tone={daysLeft<0?'red':daysLeft<30?'amber':'emerald'}>{daysLeft<0?`${Math.abs(daysLeft)} days overdue`: `${daysLeft} days left`}</Pill>}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Billing: {plan.billingCycle} • Next renewal extends 1 year to {expiresAt ? new Date(new Date(expiresAt).setFullYear(expiresAt.getFullYear()+1)).toLocaleDateString() : '—'}</p>
          </div>
          <div className="flex flex-col gap-2">
            {pendingRenewal ? (
              <div className="bg-amber-100 border border-amber-300 rounded-xl px-4 py-2 text-sm">
                <div className="font-semibold flex items-center gap-2"><Bell size={14}/> Renewal pending</div>
                <div className="text-xs">Requested {new Date(pendingRenewal.requestedAt).toLocaleString()} • Amount ₦{Number(pendingRenewal.amount).toLocaleString()} • Awaiting Super Admin</div>
                <div className="text-xs text-slate-600">New expiry: {pendingRenewal.newEndDate ? new Date(pendingRenewal.newEndDate).toLocaleString() : '—'}</div>
              </div>
            ) : (
              <button onClick={requestRenewal} disabled={renewing} className="bg-slate-900 text-white rounded-xl px-6 py-3 font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
                <RefreshCw size={16} className={renewing?'animate-spin':''}/>{renewing?'Requesting…':'Renew for 1 Year'} • ₦{Number(total).toLocaleString()}
              </button>
            )}
            {lastApproved && <button onClick={()=>downloadReceipt(lastApproved)} className="text-xs text-center underline flex items-center justify-center gap-1"><Receipt size={12}/> Download last receipt {lastApproved.receiptNumber}</button>}
          </div>
        </div>
        {renewals.length>0 && (
          <div className="mt-4 border-t pt-3">
            <h4 className="text-sm font-semibold">Renewal history</h4>
            <div className="mt-2 space-y-2 max-h-[200px] overflow-auto">
              {renewals.map((r:any)=> (
                <div key={r.id} className="flex items-center justify-between border rounded-xl px-3 py-2 text-xs bg-white">
                  <div>
                    <div className="font-mono font-semibold">{r.receiptNumber || r.id.slice(0,8)} • {r.status} {r.status==='pending' && <Pill tone="amber">pending</Pill>} {r.status==='approved' && <Pill tone="emerald">approved</Pill>}</div>
                    <div className="text-slate-500">Prev: {r.previousEndDate ? new Date(r.previousEndDate).toLocaleString() : '—'} → New: {r.newEndDate ? new Date(r.newEndDate).toLocaleString() : '—'} • ₦{Number(r.amount).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    {r.status==='approved' && r.receiptNumber && <button onClick={()=>downloadReceipt(r)} className="glass rounded-full px-3 py-1 text-xs flex items-center gap-1"><Receipt size={12}/> Receipt</button>}
                    {r.status==='approved' && <span className="text-emerald-600 text-xs flex items-center gap-1"><Bell size={12}/> Notified</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Package size={16}/> Plan: {plan.name} <span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-full">{plan.slug}</span></h3>
            <span className="text-lg font-black">₦{Number(plan.price).toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {plan.billingCycle}</span></span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-xl p-3"><div className="font-semibold">Base price</div><div className="text-lg font-bold">₦{Number(plan.price).toLocaleString()}</div></div>
            <div className="bg-violet-50 rounded-xl p-3"><div className="font-semibold">Modules add-on</div><div className="text-lg font-bold">₦{Number(totalModule).toLocaleString()}</div></div>
          </div>
          <div className="mt-3 bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between">
            <span className="font-semibold">Total payable</span>
            <span className="text-xl font-black">₦{Number(total).toLocaleString()} <span className="text-xs font-normal opacity-70">/ {plan.billingCycle}</span></span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Billed {plan.billingCycle} • {plan.maxEmployees} employees • {plan.maxBranches} branches</p>
        </GlassCard>
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><DollarSign size={16}/> Summary</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Plan base</span><span className="font-mono">₦{Number(plan.price).toLocaleString()}</span></div>
            {enabled.map((m:any)=> (
              <div key={m.moduleKey} className="flex justify-between text-xs"><span className="font-mono">{m.moduleKey}</span><span>₦{Number(m.effectivePrice).toLocaleString()}</span></div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>₦{Number(total).toLocaleString()}</span></div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Prices are set by Super Admin in{' '}
            {platform ? <a href="/admin" className="underline">Admin → Modules &amp; Pricing</a> : 'the Super Admin console'}.
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Check size={16} className="text-emerald-600"/> Enabled modules ({enabled.length}) — you have access</h3>
          <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
            {enabled.map((m:any)=> (
              <div key={m.moduleKey} className="flex items-center justify-between border rounded-xl px-3 py-2 bg-emerald-50/50">
                <div>
                  <div className="font-mono text-sm font-semibold">{m.moduleKey}</div>
                  <div className="text-xs text-slate-500">{m.catalog?.name || m.moduleKey} • {m.catalog?.category || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">₦{Number(m.effectivePrice).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">{m.price != null ? 'plan override' : 'catalog base'}</div>
                </div>
              </div>
            ))}
            {enabled.length===0 && <div className="text-sm text-slate-400 p-4 text-center">No modules enabled — contact Super Admin</div>}
          </div>
        </GlassCard>
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Lock size={16} className="text-slate-400"/> Disabled / Not purchased ({disabled.length}) — blocked (403)</h3>
          <p className="text-xs text-slate-500">Trying to use these will return <code>Module not included in your plan</code>.</p>
          <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
            {disabled.map((m:any)=> (
              <div key={m.key} className="flex items-center justify-between border rounded-xl px-3 py-2 bg-slate-50 opacity-70">
                <div>
                  <div className="font-mono text-sm">{m.key}</div>
                  <div className="text-xs text-slate-500">{m.name} • {m.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₦{Number(m.basePrice).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">base price</div>
                </div>
              </div>
            ))}
            {disabled.length===0 && <div className="text-sm text-emerald-600 p-4 text-center">All modules enabled 🎉</div>}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="bg-slate-50/50">
        <h3 className="font-semibold flex items-center gap-2"><Shield size={16}/> How it works</h3>
        <ul className="mt-2 text-sm text-slate-600 list-disc pl-5 space-y-1">
          <li>Super Admin edits module base prices in <code>Admin → Modules & Pricing</code> and assigns modules to your plan (with per-plan price overrides).</li>
          <li>Prices shown here = base + sum(enabled module prices). Disabled modules return <code>403 Module not included</code> via <code>ModuleGuard</code> (`common/guards/module.guard.ts:12`).</li>
          <li>Contact Super Admin to add a module — they’ll update the plan and you’ll see it here instantly.</li>
        </ul>
      </GlassCard>
    </div>
  );
}
