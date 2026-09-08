'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { CreditCard, Package, Check, X, DollarSign, Shield, AlertTriangle, Lock } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '../../../lib/api';

export default function SubscriptionsPage() {
  const api = getApiUrl();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    const token = localStorage.getItem('onehr_token');
    const user = JSON.parse(localStorage.getItem('onehr_user')||'{}');
    const orgId = user.org_id || user.organizationId;
    if (!orgId) { setError('Missing organization context'); setLoading(false); return; }
    fetch(`${api}/organizations/${orgId}/subscription`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r=> r.json().then(j=> ({ok:r.ok, j})))
      .then(({ok,j})=>{
        if (!ok) throw new Error(j.message || 'Failed to load');
        setData(j);
      }).catch((e:any)=> setError(e.message)).finally(()=> setLoading(false));
  },[]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading subscription…</div>;
  if (error) return <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-red-700">{error} <a href="/admin" className="underline">Super Admin → Organizations</a> to assign plan</div>;
  if (!data?.hasSubscription) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard/> Subscription</h1>
      <GlassCard className="border-amber-200 bg-amber-50/50">
        <div className="flex items-center gap-2 font-bold text-amber-800"><AlertTriangle size={16}/> No active subscription</div>
        <p className="text-sm text-slate-600 mt-1">Your organization is pending Super Admin approval. Once a plan is assigned, modules and pricing will appear here.</p>
      </GlassCard>
    </div>
  );

  const plan = data.plan;
  const enabled = plan.modules || [];
  const disabled = data.disabledModules || [];
  const totalModule = data.totalModulePrice || 0;
  const total = data.totalPrice || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="text-slate-900"/> Subscription <span className="text-slate-500 font-normal">— {data.subscription.organization?.name}</span></h1>
          <p className="text-sm text-slate-500">Modules with individual pricing. Disabled modules are blocked (403).</p>
        </div>
        <Pill tone="emerald">Active • {plan.name}</Pill>
      </div>

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
          <p className="text-xs text-slate-400 mt-3">Prices editable by Super Admin in <a href="/admin" className="underline">Admin → Modules & Pricing</a>.</p>
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
