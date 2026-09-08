'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Shield, Users, Building2, CreditCard, Plus, Trash2, Edit2, Check, X, Layers, Sparkles, Search } from 'lucide-react';
import { getApiUrl, getAuthHeaders, parseApiList } from '../../../lib/api';

export default function SuperAdminPage() {
  const api = getApiUrl();
  const [active, setActive] = useState<'roles'|'groups'|'plans'|'orgs'>('roles');
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
  const [orgs, setOrgs] = useState<any[]>([]);
  const [newRole, setNewRole] = useState({ name:'', slug:'', description:'', permissions:[] as string[] });
  const [newGroup, setNewGroup] = useState({ name:'', code:'', description:'' });
  const [newPlan, setNewPlan] = useState({ name:'', slug:'', price:0, modules:[] as string[] });

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
      const [r, g, pl, o] = await Promise.all([
        safeJson(`${api}/admin/roles`),
        safeJson(`${api}/admin/groups`),
        safeJson(`${api}/admin/plans`),
        safeJson(`${api}/admin/organizations`, `${api}/organizations`),
      ]);
      setRoles(Array.isArray(r)?r:parseApiList(r));
      setGroups(Array.isArray(g)?g:parseApiList(g));
      setPlans(Array.isArray(pl)?pl:parseApiList(pl));
      setOrgs(Array.isArray(o)?o:parseApiList(o));
    } catch (e:any) {
      setPermsError(e.message || 'Failed to load admin data');
    }
  };

  const loadPermissionsGrouped = async () => {
    setPermsLoading(true); setPermsError('');
    try {
      const h = auth();
      // try grouped first
      let res = await fetch(`${api}/admin/permissions/grouped`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        // json may be { permissions, grouped, totalPermissions, totalModules } or direct
        if (json.grouped) {
          setGroupedPerms(json.grouped);
          setPerms(json.permissions || parseApiList(json));
          if (json.grouped) {
            const mods = Object.keys(json.grouped);
            setModules(mods);
          }
        } else if (json.modules) {
          setGroupedPerms(json.grouped || {});
          setModules(json.modules || []);
          setPerms(json.permissions || []);
        } else {
          const list = parseApiList(json);
          setPerms(list);
          const g: Record<string,any[]> = {};
          for (const p of list) {
            if (!g[p.module]) g[p.module]=[];
            g[p.module].push(p);
          }
          setGroupedPerms(g);
          setModules(Object.keys(g));
        }
        setPermsLoading(false);
        return;
      }
      // fallback to /admin/modules
      res = await fetch(`${api}/admin/modules`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        // json = { modules: string[], grouped: Record<string, any[]>, totalModules, totalPermissions }
        if (json.modules) setModules(json.modules);
        if (json.grouped) {
          setGroupedPerms(json.grouped);
          const all = Object.values(json.grouped).flat() as any[];
          setPerms(all);
        } else if (Array.isArray(json)) {
          setPerms(json);
          const g: Record<string,any[]> = {};
          for (const p of json) { if (!g[p.module]) g[p.module]=[]; g[p.module].push(p); }
          setGroupedPerms(g);
          setModules(Object.keys(g));
        }
        setPermsLoading(false);
        return;
      }
      // fallback to plain permissions
      res = await fetch(`${api}/admin/permissions`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        const list = parseApiList(json);
        setPerms(list);
        const g: Record<string,any[]> = {};
        for (const p of list) { if (!g[p.module]) g[p.module]=[]; g[p.module].push(p); }
        setGroupedPerms(g);
        setModules(Object.keys(g));
      } else throw new Error('Failed to load permissions');
    } catch (e:any) {
      setPermsError(e.message || 'Failed to load permissions');
    } finally { setPermsLoading(false); }
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
  const toggleModule = (planId:string, mod:string, enabled:boolean) => {
    fetch(`${api}/admin/plans/${planId}/modules`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify({ modules: enabled ? [mod] : [] }) }).then(()=>load());
  };

  const filteredGrouped = useMemo(()=> {
    if (!selectedModule && !permSearch) return groupedPerms;
    const out: Record<string,any[]> = {};
    for (const [mod, list] of Object.entries(groupedPerms)) {
      if (selectedModule && mod !== selectedModule) continue;
      let filtered = list as any[];
      if (permSearch) {
        filtered = filtered.filter((p:any)=> p.key?.toLowerCase().includes(permSearch.toLowerCase()) || p.name?.toLowerCase().includes(permSearch.toLowerCase()));
      }
      if (filtered.length) out[mod]=filtered;
    }
    return out;
  }, [groupedPerms, selectedModule, permSearch]);

  const togglePerm = (key:string, checked:boolean) => {
    setNewRole({...newRole, permissions: checked ? [...newRole.permissions, key] : newRole.permissions.filter(x=>x!==key)});
  };
  const toggleModulePerms = (mod:string, checked:boolean) => {
    const permsInMod = groupedPerms[mod]?.map((p:any)=> p.key) || [];
    if (checked) {
      const merged = Array.from(new Set([...newRole.permissions, ...permsInMod]));
      setNewRole({...newRole, permissions: merged});
    } else {
      setNewRole({...newRole, permissions: newRole.permissions.filter(k=> !permsInMod.includes(k))});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="text-slate-900"/> Super Admin <span className="text-slate-500 font-normal">— Roles • Groups • Subscriptions</span></h1>
          <p className="text-sm text-slate-500">Only <code>super_admin</code> • Create roles/permissions • Manage group of companies • Assign modules to plans</p>
        </div>
        <Pill tone="blue">superadmin@recruitconnect.ng</Pill>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          ['roles','Roles',Shield],
          ['groups','Company Groups',Building2],
          ['plans','Subscriptions',CreditCard],
          ['orgs','Organizations',Users],
        ].map(([k,label,Icon]: any) => (
          <button key={k} onClick={()=>setActive(k as any)} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${active===k ? 'bg-slate-900 text-white' : 'glass'}`}>
            <Icon size={16}/>{label} {k==='orgs' && `(${orgs.length})`}
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
                    <div className="text-xs text-slate-500">When role&apos;s module filter changes, permissions filter instantly.</div>
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
                                  <span className="flex-1">
                                    <span className="font-mono">{p.key}</span>
                                    {p.name && p.name!==p.key && <span className="text-slate-500 ml-1">— {p.name}</span>}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-slate-500">{perms.length} total • {Object.keys(groupedPerms).length} modules</div>
                  </>
                )}
              </div>
              <button onClick={createRole} className="w-full bg-slate-900 text-white rounded-xl py-2 text-sm">Create Role</button>
              <a href="/settings/dropdowns" className="block text-xs text-center text-slate-500 underline">Manage dropdowns in Settings → Dropdowns</a>
            </div>
          </GlassCard>
          <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-4"><h3 className="font-semibold flex items-center gap-2"><Users size={16}/> Roles ({roles.length})</h3></div>
            <div className="overflow-auto max-h-[640px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Role</th><th className="p-2">Slug</th><th className="p-2">Perms</th><th className="p-2">System</th></tr></thead>
                <tbody className="divide-y">
                  {roles.map((r:any)=> {
                    let permsArr:any[]=[];
                    try { permsArr = Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || '[]'); } catch { permsArr = []; }
                    if (!Array.isArray(permsArr)) permsArr=[];
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
            <div className="p-3 bg-slate-50/50 text-xs text-slate-500">Assign org to group: <code>POST /v1/admin/groups/:id/organizations/:orgId</code> • Hierarchy: <code>GET /v1/admin/groups/:id/hierarchy</code></div>
          </GlassCard>
        </div>
      )}

      {active==='plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {plans.map((p:any)=> (
              <GlassCard key={p.id} hover>
                <div className="flex items-center justify-between"><h3 className="font-bold">{p.name}</h3><Pill tone={p.slug==='enterprise'?'emerald':p.slug==='growth'?'blue':'slate'}>{p.slug}</Pill></div>
                <div className="text-xs text-slate-500">{p.description}</div>
                <div className="mt-2 flex items-center gap-2"><span className="text-lg font-black">₦{Number(p.price).toLocaleString()}</span><span className="text-xs text-slate-500">/ {p.billingCycle}</span><span className="ml-auto text-xs bg-slate-50 rounded-full px-2 py-1">{p.maxEmployees} emp • {p.maxBranches} branches</span></div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(p.modules || []).slice(0,6).map((m:any)=> <span key={m.id || m.moduleKey} className="text-[11px] bg-slate-50 border rounded-full px-2 py-0.5">{m.moduleKey || m}</span>)}
                  {(p.modules?.length||0)>6 && <span className="text-xs text-slate-500">+{p.modules.length-6} more</span>}
                  {(!p.modules || p.modules.length===0) && <span className="text-xs text-slate-400">No modules assigned</span>}
                </div>
                <div className="mt-3 text-xs text-slate-500">API: <code>POST /v1/admin/plans/:id/modules</code> to assign modules</div>
              </GlassCard>
            ))}
          </div>
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Sparkles size={16}/> Create Plan / Assign Modules</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input placeholder="Name (Custom)" value={newPlan.name} onChange={e=>setNewPlan({...newPlan, name:e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Slug (custom)" value={newPlan.slug} onChange={e=>setNewPlan({...newPlan, slug:e.target.value})} className="border rounded-xl px-3 py-2 text-sm font-mono" />
              <input type="number" placeholder="Price" value={newPlan.price} onChange={e=>setNewPlan({...newPlan, price: Number(e.target.value)})} className="border rounded-xl px-3 py-2 text-sm" />
              <button onClick={createPlan} className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm">Create Plan</button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Super Admin assigns modules per client subscription — client only sees subscribed modules (check <code>GET /v1/admin/organizations/:orgId/modules/:key/access</code>).</p>
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
                          {plans.map((p:any)=> <option key={p.id} value={p.id}>{p.name} — ₦{Number(p.price).toLocaleString()}/mo</option>)}
                        </select>
                        <button onClick={async ()=>{
                          const sel = (document.getElementById(`plan-${o.id}`) as HTMLSelectElement)?.value;
                          if (!sel) return alert('Select a plan');
                          const h = auth();
                          const res = await fetch(`${api}/admin/subscriptions/assign`, { method:'POST', headers:{'Content-Type':'application/json', ...h}, body: JSON.stringify({ organizationId: o.id, planId: sel }) });
                          if (res.ok) { alert(`Onboarded ${o.acronym} → plan assigned`); load(); } else alert('Failed to assign');
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
              <h3 className="font-semibold flex items-center gap-2"><Building2 size={16}/> Organizations ({orgs.length}) <span className="text-xs font-normal text-slate-500">— All tenants • Super Admin view</span></h3>
              <div className="flex gap-2"><Pill tone="blue">{orgs.length} total</Pill><button onClick={load} className="text-xs glass rounded-full px-3 py-1">Refresh</button></div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-3">Organization</th><th className="text-left p-3">Acronym</th><th className="p-2">Industry</th><th className="p-2">Users</th><th className="p-2">Employees</th><th className="p-2">Group</th><th className="p-2">Plan</th><th className="p-2">Status</th><th className="p-2">Created</th></tr></thead>
                <tbody className="divide-y">
                  {orgs.map((o:any)=> {
                    const needsOnboarding = !o.subscriptions?.length;
                    return (
                      <tr key={o.id} className={`hover:bg-slate-50/50 ${needsOnboarding ? 'bg-amber-50/30' : ''}`}>
                        <td className="p-3"><div className="font-semibold flex items-center gap-2">{o.name || '—'} {needsOnboarding && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">NEW</span>}</div><div className="text-xs text-slate-500 font-mono">{o.id ? o.id.slice(0,8) : '—'}</div></td>
                        <td className="p-2"><span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-full">{o.acronym || '—'}</span></td>
                        <td className="p-2 text-xs"><Pill tone="slate">{o.industryTemplate || '—'}</Pill></td>
                        <td className="p-2 text-center text-xs">{o._count?.users ?? '—'}</td>
                        <td className="p-2 text-center text-xs">{o._count?.employees ?? '—'}</td>
                        <td className="p-2 text-xs">{o.companyGroup?.name || <span className="text-slate-400">—</span>}</td>
                        <td className="p-2 text-xs">{o.subscriptions?.[0]?.plan?.name ? <Pill tone="emerald">{o.subscriptions[0].plan.name}</Pill> : <Pill tone="amber">Needs onboarding</Pill>}</td>
                        <td className="p-2"><Pill tone={needsOnboarding ? 'amber' : 'emerald'}>{needsOnboarding ? 'pending' : 'active'}</Pill></td>
                        <td className="p-2 text-xs text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    );
                  })}
                  {orgs.length===0 && <tr><td colSpan={9} className="p-8 text-center text-slate-500">No organizations — register a new company via /register</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50/50 text-xs text-slate-500 flex justify-between">
              <span>New orgs appear here instantly after `POST /v1/organizations` (public register) — superadmin assigns plan/group to onboard.</span>
              <Link href="/register" className="text-blue-600 underline">Go to Register →</Link>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
