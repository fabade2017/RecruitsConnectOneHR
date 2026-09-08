'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Shield, Users, Building2, CreditCard, Plus, Trash2, Edit2, Check, X, Layers, Sparkles, Search, DollarSign, Package, Eye, EyeOff } from 'lucide-react';
import { getApiUrl, getAuthHeaders, parseApiList } from '../../../lib/api';

export default function SuperAdminPage() {
  const api = getApiUrl();
  const [active, setActive] = useState<'roles'|'groups'|'plans'|'orgs'|'modules'>('roles');
  const [roles, setRoles] = useState<any[]>([]);
  const [perms, setPerms] = useState<any[]>([]);
  const [groupedPerms, setGroupedPerms] = useState<Record<string,any[]>>({});
  const [modules, setModules] = useState<string[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsError, setPermsError] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [permSearch, setPermSearch] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansPricing, setPlansPricing] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [newRole, setNewRole] = useState({ name:'', slug:'', description:'', permissions:[] as string[] });
  const [newGroup, setNewGroup] = useState({ name:'', code:'', description:'' });
  const [newPlan, setNewPlan] = useState({ name:'', slug:'', price:0, modules:[] as string[] });
  const [newModule, setNewModule] = useState({ key:'', name:'', description:'', basePrice:5000, category:'add_on' });
  const [editingPrices, setEditingPrices] = useState<Record<string, Record<string, number>>>({}); // planId -> moduleKey -> price
  const [assigningPlan, setAssigningPlan] = useState<string|null>(null);

  const auth = () => getAuthHeaders() as any;

  const load = async () => {
    const h = auth();
    if (!h.Authorization) { setPermsError('Missing token — please re-login as superadmin@recruitconnect.ng'); return; }
    const safeJson = async (url: string, fallbackUrl?: string) => {
      const res = await fetch(url, { headers: h });
      if (res.ok) return res.json();
      if (res.status === 401) throw new Error(`401 Unauthorized — token expired or invalid (${url})`);
      if (res.status === 403) throw new Error(`403 Forbidden — requires super_admin (${url})`);
      if (fallbackUrl) {
        const fb = await fetch(fallbackUrl, { headers: h });
        if (fb.ok) return fb.json();
        throw new Error(`Failed ${res.status} on ${url} and ${fb.status} on fallback`);
      }
      throw new Error(`Failed ${res.status} on ${url}`);
    };
    try {
      const [r, g, pl, o, cat, pricing] = await Promise.all([
        safeJson(`${api}/admin/roles`),
        safeJson(`${api}/admin/groups`),
        safeJson(`${api}/admin/plans`),
        safeJson(`${api}/admin/organizations`, `${api}/organizations`),
        safeJson(`${api}/admin/module-catalog`).catch(()=>[]),
        safeJson(`${api}/admin/plans/pricing`).catch(()=>[]),
      ]);
      setRoles(Array.isArray(r)?r:parseApiList(r));
      setGroups(Array.isArray(g)?g:parseApiList(g));
      setPlans(Array.isArray(pl)?pl:parseApiList(pl));
      setOrgs(Array.isArray(o)?o:parseApiList(o));
      setCatalog(Array.isArray(cat)?cat:parseApiList(cat));
      setPlansPricing(Array.isArray(pricing)?pricing:pricing?.length?pricing:[]);
    } catch (e:any) {
      setPermsError(e.message || 'Failed to load admin data');
    }
  };

  const loadPermissionsGrouped = async () => {
    setPermsLoading(true); setPermsError('');
    try {
      const h = auth();
      let res = await fetch(`${api}/admin/permissions/grouped`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        if (json.grouped) {
          setGroupedPerms(json.grouped);
          setPerms(json.permissions || parseApiList(json));
          setModules(Object.keys(json.grouped));
        } else if (json.modules) {
          setGroupedPerms(json.grouped || {});
          setModules(json.modules || []);
          setPerms(json.permissions || []);
        } else {
          const list = parseApiList(json);
          setPerms(list);
          const g: Record<string,any[]> = {};
          for (const p of list) { if (!g[p.module]) g[p.module]=[]; g[p.module].push(p); }
          setGroupedPerms(g); setModules(Object.keys(g));
        }
        setPermsLoading(false); return;
      }
      res = await fetch(`${api}/admin/modules`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        if (json.modules) setModules(json.modules);
        if (json.grouped) { setGroupedPerms(json.grouped); setPerms(Object.values(json.grouped).flat() as any[]); }
        else if (Array.isArray(json)) { setPerms(json); const g: Record<string,any[]> = {}; for (const p of json) { if (!g[p.module]) g[p.module]=[]; g[p.module].push(p); } setGroupedPerms(g); setModules(Object.keys(g)); }
        setPermsLoading(false); return;
      }
      res = await fetch(`${api}/admin/permissions`, { headers: h });
      if (res.ok) {
        const json = await res.json(); const list = parseApiList(json); setPerms(list);
        const g: Record<string,any[]> = {}; for (const p of list) { if (!g[p.module]) g[p.module]=[]; g[p.module].push(p); }
        setGroupedPerms(g); setModules(Object.keys(g));
      } else throw new Error('Failed to load permissions');
    } catch (e:any) { setPermsError(e.message || 'Failed to load permissions'); } finally { setPermsLoading(false); }
  };

  useEffect(()=>{ load(); loadPermissionsGrouped(); }, []);

  const createRole = async () => {
    await fetch(`${api}/admin/roles`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify(newRole) });
    setNewRole({ name:'', slug:'', description:'', permissions:[] }); load();
  };
  const createGroup = async () => {
    await fetch(`${api}/admin/groups`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify(newGroup) });
    setNewGroup({ name:'', code:'', description:'' }); load();
  };
  const createPlan = async () => {
    await fetch(`${api}/admin/plans`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify({ ...newPlan, price: Number(newPlan.price) }) });
    setNewPlan({ name:'', slug:'', price:0, modules:[] }); load();
  };
  const createModule = async () => {
    if (!newModule.key.trim()) return alert('Module key required');
    const res = await fetch(`${api}/admin/module-catalog`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify({ ...newModule, key: newModule.key.toLowerCase(), basePrice: Number(newModule.basePrice) }) });
    if (!res.ok) { const t=await res.text(); alert(t); return; }
    setNewModule({ key:'', name:'', description:'', basePrice:5000, category:'add_on' }); load();
  };
  const updateModulePrice = async (key: string, price: number) => {
    await fetch(`${api}/admin/module-catalog/${key}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify({ basePrice: Number(price) }) });
    load();
  };
  const toggleModuleCatalogActive = async (key: string, isActive: boolean) => {
    await fetch(`${api}/admin/module-catalog/${key}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify({ isActive }) });
    load();
  };

  const savePlanModules = async (planId: string) => {
    const priceMap = editingPrices[planId] || {};
    // Build modules array with price overrides
    const plan = plans.find(p=>p.id===planId);
    const currentModules = plan?.modules?.map((m:any)=> m.moduleKey || m) || [];
    // Combine current + edited
    const allKeys = Array.from(new Set([...currentModules, ...Object.keys(priceMap)]));
    // Filter to only enabled ones (those in priceMap or still in plan) — for simplicity send all with price
    const modulesPayload = allKeys.map(k=> ({ key: k, price: priceMap[k] ?? (plan?.modules?.find((m:any)=>m.moduleKey===k)?.price) }));
    const res = await fetch(`${api}/admin/plans/${planId}/modules`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify({ modules: modulesPayload }) });
    if (res.ok) { setAssigningPlan(null); setEditingPrices(prev=> ({...prev, [planId]:{}})); load(); } else alert('Failed to save');
  };

  const filteredGrouped = useMemo(()=> {
    if (!selectedModule && !permSearch) return groupedPerms;
    const out: Record<string,any[]> = {};
    for (const [mod, list] of Object.entries(groupedPerms)) {
      if (selectedModule && mod !== selectedModule) continue;
      let filtered = list as any[];
      if (permSearch) filtered = filtered.filter((p:any)=> p.key?.toLowerCase().includes(permSearch.toLowerCase()) || p.name?.toLowerCase().includes(permSearch.toLowerCase()));
      if (filtered.length) out[mod]=filtered;
    }
    return out;
  }, [groupedPerms, selectedModule, permSearch]);

  const togglePerm = (key:string, checked:boolean) => {
    setNewRole({...newRole, permissions: checked ? [...newRole.permissions, key] : newRole.permissions.filter(x=>x!==key)});
  };
  const toggleModulePerms = (mod:string, checked:boolean) => {
    const permsInMod = groupedPerms[mod]?.map((p:any)=> p.key) || [];
    if (checked) setNewRole({...newRole, permissions: Array.from(new Set([...newRole.permissions, ...permsInMod]))});
    else setNewRole({...newRole, permissions: newRole.permissions.filter(k=> !permsInMod.includes(k))});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="text-slate-900"/> Super Admin <span className="text-slate-500 font-normal">— Roles • Modules • Pricing • Subscriptions</span></h1>
          <p className="text-sm text-slate-500">Only <code>super_admin</code> • Modules have editable prices • Plans bundle modules • Org blocked if module not in plan</p>
        </div>
        <Pill tone="blue">superadmin@recruitconnect.ng</Pill>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          ['roles','Roles',Shield],
          ['modules','Modules & Pricing',Package],
          ['plans','Subscriptions',CreditCard],
          ['groups','Company Groups',Building2],
          ['orgs','Organizations',Users],
        ].map(([k,label,Icon]: any) => (
          <button key={k} onClick={()=>setActive(k as any)} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${active===k ? 'bg-slate-900 text-white' : 'glass'}`}>
            <Icon size={16}/>{label} {k==='orgs' && `(${orgs.length})`} {k==='modules' && `(${catalog.length})`}
          </button>
        ))}
      </div>

      {active==='roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Plus size={16}/> Create Role</h3>
            <div className="mt-3 space-y-3">
              <input placeholder="Name (Finance Manager)" value={newRole.name} onChange={e=>setNewRole({...newRole, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Slug (finance_manager)" value={newRole.slug} onChange={e=>setNewRole({...newRole, slug:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm font-mono" />
              <input placeholder="Description" value={newRole.description} onChange={e=>setNewRole({...newRole, description:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <div className="border rounded-xl p-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">Permissions</span>
                  <Pill tone="blue">{newRole.permissions.length} selected</Pill>
                </div>
                {permsLoading && <div className="text-xs text-slate-500 py-4 text-center">Loading permissions…</div>}
                {permsError && <div className="text-xs text-red-600">{permsError} <button onClick={loadPermissionsGrouped} className="underline">Retry</button></div>}
                {!permsLoading && !permsError && (
                  <>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search size={12} className="absolute left-2 top-2.5 text-slate-400"/>
                        <input value={permSearch} onChange={e=>setPermSearch(e.target.value)} placeholder="Search key…" className="w-full pl-7 pr-2 py-1.5 rounded-lg border text-xs"/>
                      </div>
                      <select value={selectedModule} onChange={e=>setSelectedModule(e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs bg-white max-w-[140px]">
                        <option value="">All modules ({modules.length})</option>
                        {modules.map(m=> <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="max-h-[320px] overflow-auto space-y-3 pr-1">
                      {Object.keys(filteredGrouped).length===0 && <div className="text-xs text-slate-400 py-2">No permissions for filter.</div>}
                      {Object.entries(filteredGrouped).map(([mod, list]:any)=> {
                        const allChecked = list.every((p:any)=> newRole.permissions.includes(p.key));
                        const someChecked = list.some((p:any)=> newRole.permissions.includes(p.key));
                        return (
                          <div key={mod} className="border rounded-lg overflow-hidden">
                            <label className={`flex items-center gap-2 px-2 py-1.5 text-xs font-semibold cursor-pointer ${someChecked ? 'bg-violet-50' : 'bg-slate-50'}`}>
                              <input type="checkbox" checked={allChecked} onChange={e=> toggleModulePerms(mod, e.target.checked)} />
                              <span className="flex-1 capitalize">{mod}</span>
                              <span className="text-[11px] bg-white border rounded-full px-2 py-0.5">{list.length}</span>
                              {someChecked && <span className="text-[10px] bg-violet-600 text-white rounded-full px-1.5 py-0.5">{list.filter((p:any)=> newRole.permissions.includes(p.key)).length} ✓</span>}
                            </label>
                            <div className="divide-y">
                              {list.map((p:any)=> (
                                <label key={p.key} className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-slate-50 cursor-pointer">
                                  <input type="checkbox" checked={newRole.permissions.includes(p.key)} onChange={e=> togglePerm(p.key, e.target.checked)} />
                                  <span className="flex-1"><span className="font-mono">{p.key}</span>{p.name && p.name!==p.key && <span className="text-slate-500 ml-1">— {p.name}</span>}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <button onClick={createRole} className="w-full bg-slate-900 text-white rounded-xl py-2 text-sm">Create Role</button>
            </div>
          </GlassCard>
          <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-4"><h3 className="font-semibold flex items-center gap-2"><Users size={16}/> Roles ({roles.length})</h3></div>
            <div className="overflow-auto max-h-[640px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Role</th><th className="p-2">Slug</th><th className="p-2">Perms</th><th className="p-2">System</th></tr></thead>
                <tbody className="divide-y">
                  {roles.map((r:any)=> {
                    let permsArr:any[]=[]; try { permsArr = Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || '[]'); } catch { permsArr=[]; }
                    return (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="p-2"><div className="font-semibold">{r.name}</div><div className="text-xs text-slate-500">{r.description}</div></td>
                      <td className="p-2 font-mono text-xs">{r.slug}</td>
                      <td className="p-2 text-xs">{permsArr.length} • {permsArr.slice(0,2).join(', ')}</td>
                      <td className="p-2"><Pill tone={r.isSystem?'slate':'emerald'}>{r.isSystem?'system':'custom'}</Pill></td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {active==='modules' && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="font-bold flex items-center gap-2"><Package size={16}/> Module Catalog — Editable Prices</h3>
            <p className="text-xs text-slate-500">Each module has its own price (NGN). Shown on subscription pages. If not picked in plan, org blocked (403).</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
              <input placeholder="key (e.g. chat)" value={newModule.key} onChange={e=>setNewModule({...newModule, key:e.target.value.toLowerCase()})} className="border rounded-xl px-3 py-2 text-sm font-mono" />
              <input placeholder="Name" value={newModule.name} onChange={e=>setNewModule({...newModule, name:e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
              <input type="number" placeholder="Base Price NGN" value={newModule.basePrice} onChange={e=>setNewModule({...newModule, basePrice: Number(e.target.value)})} className="border rounded-xl px-3 py-2 text-sm" />
              <select value={newModule.category} onChange={e=>setNewModule({...newModule, category:e.target.value})} className="border rounded-xl px-3 py-2 text-sm bg-white">
                <option value="core">core (free/bundled)</option><option value="add_on">add_on</option><option value="premium">premium</option>
              </select>
              <button onClick={createModule} className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm">Add/Update</button>
            </div>
          </GlassCard>
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><DollarSign size={16}/> All Modules ({catalog.length}) — click price to edit</h3><Pill tone="blue">{catalog.filter((c:any)=>c.isActive).length} active</Pill></div>
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Key</th><th className="text-left p-2">Name</th><th className="p-2">Category</th><th className="p-2">Base Price</th><th className="p-2">Active</th><th className="p-2">Actions</th></tr></thead>
                <tbody className="divide-y">
                  {catalog.map((m:any)=> (
                    <tr key={m.key} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono text-xs">{m.key}</td>
                      <td className="p-2"><div className="font-semibold">{m.name}</div><div className="text-xs text-slate-500">{m.description || '—'}</div></td>
                      <td className="p-2 text-xs"><Pill tone={m.category==='core'?'emerald':m.category==='premium'?'violet':'slate'}>{m.category}</Pill></td>
                      <td className="p-2">
                        <span className="font-mono text-xs">₦{Number(m.basePrice).toLocaleString()}</span>
                        <input type="number" defaultValue={Number(m.basePrice)} onBlur={e=> { const v=Number(e.target.value); if(v!==Number(m.basePrice)) updateModulePrice(m.key, v); }} className="ml-2 w-24 border rounded-lg px-2 py-1 text-xs" />
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={()=>toggleModuleCatalogActive(m.key, !m.isActive)} className={`px-2 py-1 rounded-full text-xs ${m.isActive?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{m.isActive?'active':'disabled'}</button>
                      </td>
                      <td className="p-2 text-xs text-slate-400">{m.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50/50 text-xs text-slate-500">Prices shown on org subscription pages. <code>PATCH /v1/admin/module-catalog/:key</code> to edit.</div>
          </GlassCard>
        </div>
      )}

      {active==='groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Building2 size={16}/> Create Group</h3>
            <p className="text-xs text-slate-500">Group of companies under a holding (e.g., Dangote Holdings)</p>
            <div className="mt-3 space-y-2">
              <input placeholder="Group Name" value={newGroup.name} onChange={e=>setNewGroup({...newGroup, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Code (DANGOTE-GRP-001)" value={newGroup.code} onChange={e=>setNewGroup({...newGroup, code:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm font-mono" />
              <input placeholder="Description" value={newGroup.description} onChange={e=>setNewGroup({...newGroup, description:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <button onClick={createGroup} className="w-full bg-slate-900 text-white rounded-xl py-2 text-sm">Create Group</button>
            </div>
          </GlassCard>
          <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Layers size={16}/> Company Groups ({groups.length})</h3><Pill tone="blue">Holding structure</Pill></div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Group</th><th className="p-2">Code</th><th className="p-2">Orgs</th><th className="p-2">Status</th></tr></thead>
                <tbody className="divide-y">
                  {groups.map((g:any)=> (
                    <tr key={g.id} className="hover:bg-slate-50/50">
                      <td className="p-2"><div className="font-semibold">{g.name}</div><div className="text-xs text-slate-500">{g.description}</div></td>
                      <td className="p-2 font-mono text-xs">{g.code}</td>
                      <td className="p-2 text-center">{g._count?.organizations ?? g.organizations?.length ?? 0}</td>
                      <td className="p-2"><Pill tone={g.isActive?'emerald':'red'}>{g.isActive?'active':'inactive'}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {active==='plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {(plansPricing.length?plansPricing:plans).map((p:any)=> {
              const isPricing = !!plansPricing.length;
              const total = isPricing ? p.totalModulePrice : null;
              return (
              <GlassCard key={p.id} hover>
                <div className="flex items-center justify-between"><h3 className="font-bold">{p.name}</h3><Pill tone={p.slug==='enterprise'?'emerald':p.slug==='growth'?'blue':'slate'}>{p.slug}</Pill></div>
                <div className="text-xs text-slate-500">{p.description}</div>
                <div className="mt-2 flex items-center gap-2"><span className="text-lg font-black">₦{Number(p.price).toLocaleString()}</span><span className="text-xs text-slate-500">/ {p.billingCycle}</span>{isPricing && <span className="ml-auto text-xs bg-violet-50 text-violet-700 rounded-full px-2 py-1">Modules: ₦{Number(total).toLocaleString()}</span>}</div>
                <div className="mt-3 space-y-1 max-h-[220px] overflow-auto pr-1">
                  {(p.modules || []).map((m:any)=> {
                    const cat = isPricing ? m.catalog : catalog.find((c:any)=>c.key=== (m.moduleKey||m));
                    const eff = isPricing ? m.effectivePrice : (m.price ?? cat?.basePrice ?? 0);
                    return (
                    <div key={m.id||m.moduleKey||m} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2 py-1">
                      <span className="font-mono">{m.moduleKey || m}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-500">₦{Number(eff).toLocaleString()}</span>
                        {cat && <span className="text-[10px] bg-white border rounded-full px-1.5 py-0.5">{cat.category}</span>}
                      </span>
                    </div>
                  );})}
                  {(!p.modules || p.modules.length===0) && <span className="text-xs text-slate-400">No modules — add below</span>}
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={()=> setAssigningPlan(assigningPlan===p.id?null:p.id)} className="flex-1 text-xs border rounded-full px-3 py-1.5 bg-white hover:bg-slate-50">{assigningPlan===p.id?'Close':'Manage modules'}</button>
                  {isPricing && <span className="text-xs text-slate-500 self-center">Total {p.modules?.length||0} mods</span>}
                </div>
                {assigningPlan===p.id && (
                  <div className="mt-3 border rounded-xl p-3 space-y-2 bg-slate-50/50">
                    <div className="text-xs font-semibold">Toggle modules + set per-plan price (overrides catalog base)</div>
                    <div className="max-h-[240px] overflow-auto space-y-1 pr-1">
                      {catalog.map((c:any)=> {
                        const included = (p.modules || []).some((m:any)=> (m.moduleKey||m)===c.key);
                        const curPrice = editingPrices[p.id]?.[c.key] ?? (p.modules || []).find((m:any)=>m.moduleKey===c.key)?.price ?? c.basePrice;
                        return (
                          <label key={c.key} className="flex items-center gap-2 text-xs bg-white border rounded-lg px-2 py-1.5">
                            <input type="checkbox" defaultChecked={included} onChange={e=>{
                              const checked=e.target.checked;
                              // update plan modules via API on save
                              setEditingPrices(prev=>{
                                const cur=prev[p.id]||{};
                                // mark for inclusion/exclusion via a flag — we store a temp list in editingPrices
                                // Simpler: immediately call API to add/remove
                                return prev;
                              });
                              // Optimistic: call toggle API
                              fetch(`${api}/admin/plans/${p.id}/modules`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify({ modules: checked ? [...(p.modules||[]).map((m:any)=>m.moduleKey||m), c.key].map(k=> ({key:k, price: k===c.key ? curPrice : undefined})) : (p.modules||[]).filter((m:any)=> (m.moduleKey||m)!==c.key).map((m:any)=> ({key:m.moduleKey||m})) }) }).then(()=>load());
                            }} />
                            <span className="flex-1 font-mono">{c.key}</span>
                            <span className="text-slate-500 hidden md:inline">{c.name}</span>
                            <input type="number" defaultValue={Number(curPrice)} onBlur={e=>{
                              const v=Number(e.target.value);
                              setEditingPrices(prev=> ({...prev, [p.id]: {...(prev[p.id]||{}), [c.key]: v}}));
                              // also persist price if already included
                              if (included) fetch(`${api}/admin/plans/${p.id}/modules/${c.key}/price`, { method:'PATCH', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify({ price: v }) }).then(()=>load());
                            }} className="w-20 border rounded-lg px-1 py-1 text-xs" />
                            <span className="text-[10px] text-slate-400">₦</span>
                          </label>
                        );
                      })}
                    </div>
                    <button onClick={()=>savePlanModules(p.id)} className="w-full bg-slate-900 text-white rounded-xl py-2 text-xs">Save modules + prices</button>
                    <p className="text-xs text-slate-500">Unchecked modules = blocked (403 `Module not included`). Prices displayed on org subscription page.</p>
                  </div>
                )}
              </GlassCard>
            );})}
          </div>
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Sparkles size={16}/> Create Plan</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input placeholder="Name (Custom)" value={newPlan.name} onChange={e=>setNewPlan({...newPlan, name:e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Slug (custom)" value={newPlan.slug} onChange={e=>setNewPlan({...newPlan, slug:e.target.value})} className="border rounded-xl px-3 py-2 text-sm font-mono" />
              <input type="number" placeholder="Base Price" value={newPlan.price} onChange={e=>setNewPlan({...newPlan, price: Number(e.target.value)})} className="border rounded-xl px-3 py-2 text-sm" />
              <button onClick={createPlan} className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm">Create Plan</button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Plans bundle modules; org sees `₦ base + sum(module prices)` and blocked if module not picked. Check <code>GET /v1/admin/organizations/:orgId/modules/:key/access</code>.</p>
          </GlassCard>
        </div>
      )}

      {active==='orgs' && (
        <div className="space-y-4">
          {(() => {
            const pending = orgs.filter((o:any)=> !o.subscriptions?.length);
            if (pending.length===0) return null;
            return (
              <GlassCard className="border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2"><Building2 size={16} className="text-amber-600"/> Onboarding Queue — {pending.length} new {pending.length===1?'company':'companies'} need setup</h3>
                  <Pill tone="amber">Action required</Pill>
                </div>
                <p className="text-xs text-slate-600 mt-1">These companies registered via <code>/register</code> → <code>POST /v1/organizations</code> but have no subscription/plan yet. Assign a plan and group to onboard.</p>
                <div className="mt-3 space-y-2">
                  {pending.map((o:any)=> (
                    <div key={o.id} className="bg-white rounded-xl border p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{o.name || '—'} <span className="font-mono text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full">{o.acronym || '—'}</span> <span className="text-xs text-slate-500">• {o.industryTemplate || '—'}</span></div>
                        <div className="text-xs text-slate-500">Created {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'} • {o._count?.users || 0} users • {o._count?.employees || 0} employees • No plan</div>
                      </div>
                      <div className="flex gap-2">
                        <select id={`plan-${o.id}`} defaultValue="" className="border rounded-xl px-3 py-2 text-sm bg-white">
                          <option value="">Select plan…</option>
                          {plans.map((p:any)=> <option key={p.id} value={p.id}>{p.name} — ₦{Number(p.price).toLocaleString()}/mo (+modules)</option>)}
                        </select>
                        <button onClick={async ()=>{
                          const sel = (document.getElementById(`plan-${o.id}`) as HTMLSelectElement)?.value;
                          if (!sel) return alert('Select a plan');
                          const h = auth();
                          const res = await fetch(`${api}/admin/subscriptions/assign`, { method:'POST', headers:{'Content-Type':'application/json', ...h}, body: JSON.stringify({ organizationId: o.id, planId: sel }) });
                          if (res.ok) { alert(`Onboarded ${o.acronym} → plan assigned (now active)`); load(); } else alert('Failed to assign');
                        }} className="bg-emerald-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-emerald-700">Onboard → Assign Plan</button>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })()}

          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Building2 size={16}/> Organizations ({orgs.length}) <span className="text-xs font-normal text-slate-500">— pricing shown per plan</span></h3>
              <div className="flex gap-2"><Pill tone="blue">{orgs.length} total</Pill><button onClick={load} className="text-xs glass rounded-full px-3 py-1">Refresh</button></div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-3">Organization</th><th className="text-left p-3">Acronym</th><th className="p-2">Industry</th><th className="p-2">Users</th><th className="p-2">Employees</th><th className="p-2">Group</th><th className="p-2">Plan & Modules cost</th><th className="p-2">Status</th><th className="p-2">Created</th></tr></thead>
                <tbody className="divide-y">
                  {orgs.map((o:any)=> {
                    const needsOnboarding = !o.subscriptions?.length;
                    const plan = o.subscriptions?.[0]?.plan;
                    const planPricing = plansPricing.find((p:any)=> p.id===plan?.id);
                    return (
                      <tr key={o.id} className={`hover:bg-slate-50/50 ${needsOnboarding ? 'bg-amber-50/30' : ''}`}>
                        <td className="p-3"><div className="font-semibold flex items-center gap-2">{o.name || '—'} {needsOnboarding && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">NEW</span>}</div><div className="text-xs text-slate-500 font-mono">{o.id ? o.id.slice(0,8) : '—'}</div></td>
                        <td className="p-2"><span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-full">{o.acronym || '—'}</span></td>
                        <td className="p-2 text-xs"><Pill tone="slate">{o.industryTemplate || '—'}</Pill></td>
                        <td className="p-2 text-center text-xs">{o._count?.users ?? '—'}</td>
                        <td className="p-2 text-center text-xs">{o._count?.employees ?? '—'}</td>
                        <td className="p-2 text-xs">{o.companyGroup?.name || <span className="text-slate-400">—</span>}</td>
                        <td className="p-2 text-xs">
                          {plan ? (
                            <div>
                              <Pill tone="emerald">{plan.name}</Pill>
                              <div className="text-xs text-slate-500">₦{Number(plan.price).toLocaleString()} + {planPricing ? `₦${Number(planPricing.totalModulePrice||0).toLocaleString()} modules` : `${planPricing?.modules?.length||0} mods`}</div>
                              <div className="text-[11px] text-slate-400">{planPricing ? `${planPricing.modules?.length||0} modules enabled` : ''} {needsOnboarding? '' : '• access enforced'}</div>
                            </div>
                          ) : <Pill tone="amber">Needs onboarding</Pill>}
                        </td>
                        <td className="p-2"><Pill tone={needsOnboarding ? 'amber' : 'emerald'}>{needsOnboarding ? 'pending' : 'active'}</Pill></td>
                        <td className="p-2 text-xs text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
