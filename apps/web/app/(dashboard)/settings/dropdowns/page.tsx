'use client';
import { useEffect, useMemo, useState } from 'react';
import { GlassCard, Pill } from '../../../../components/ui/GlassCard';
import { Building2, Layers, Shield, Boxes, Plus, Edit2, Trash2, Save, X, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import { getApiUrl, getAuthHeaders, parseApiList } from '../../../../lib/api';

type Tab = 'branches' | 'departments' | 'roles' | 'modules';

export default function DropdownsPage() {
  const api = getApiUrl();
  const [tab, setTab] = useState<Tab>('branches');
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [groupedPerms, setGroupedPerms] = useState<Record<string,any[]>>({});
  const [modules, setModules] = useState<string[]>([]);
  const [perms, setPerms] = useState<any[]>([]);
  const [loading, setLoading] = useState({ branches:false, departments:false, roles:false, modules:false });
  const [error, setError] = useState({ branches:'', departments:'', roles:'', modules:'' });
  const [search, setSearch] = useState('');

  // forms
  const [newBranch, setNewBranch] = useState({ name:'', address:'', location:'', isHeadOffice:false });
  const [newDept, setNewDept] = useState({ name:'', branchId:'', parentId:'', costCenter:'' });
  const [newRole, setNewRole] = useState({ name:'', slug:'', description:'', permissions:[] as string[] });
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [permFilterModule, setPermFilterModule] = useState<string>('');

  const auth = ()=> getAuthHeaders() as any;
  const getRole = () => {
    try {
      const u = JSON.parse(localStorage.getItem('onehr_user')||'{}');
      if (u.role) return u.role;
      const t = localStorage.getItem('onehr_token');
      if (t) return JSON.parse(atob(t.split('.')[1]))?.role;
    } catch {}
    return null;
  };
  const isSuperAdmin = getRole()==='super_admin' || getRole()==='org_admin' || getRole()==='hr_admin';

  const fetchBranches = async () => {
    setLoading(s=>({...s, branches:true})); setError(s=>({...s, branches:''}));
    try {
      const res = await fetch(`${api}/branches`, { headers: auth()});
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().then(t=>t.slice(0,120))}`);
      const json = await res.json(); const list = parseApiList(json);
      setBranches(list);
    } catch(e:any){ setError(s=>({...s, branches:e.message})); } finally { setLoading(s=>({...s, branches:false})); }
  };
  const fetchDepartments = async (branchId?:string) => {
    setLoading(s=>({...s, departments:true})); setError(s=>({...s, departments:''}));
    try {
      const url = branchId ? `${api}/departments?branchId=${encodeURIComponent(branchId)}` : `${api}/departments`;
      const res = await fetch(url, { headers: auth()});
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().then(t=>t.slice(0,120))}`);
      const json = await res.json(); const list = parseApiList(json);
      setDepartments(list);
    } catch(e:any){ setError(s=>({...s, departments:e.message})); } finally { setLoading(s=>({...s, departments:false})); }
  };
  const fetchRoles = async () => {
    setLoading(s=>({...s, roles:true})); setError(s=>({...s, roles:''}));
    try {
      const res = await fetch(`${api}/admin/roles`, { headers: auth()});
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().then(t=>t.slice(0,120))}`);
      const json = await res.json(); const list = parseApiList(json);
      setRoles(list);
    } catch(e:any){ setError(s=>({...s, roles:e.message})); } finally { setLoading(s=>({...s, roles:false})); }
  };
  const fetchModules = async () => {
    setLoading(s=>({...s, modules:true})); setError(s=>({...s, modules:''}));
    try {
      let res = await fetch(`${api}/admin/permissions/grouped`, { headers: auth()});
      if (res.ok) {
        const j = await res.json();
        if (j.grouped) { setGroupedPerms(j.grouped); setPerms(j.permissions || []); setModules(Object.keys(j.grouped)); }
        else { const list=parseApiList(j); setPerms(list); const g:Record<string,any[]>={}; for(const p of list){ if(!g[p.module]) g[p.module]=[]; g[p.module].push(p);} setGroupedPerms(g); setModules(Object.keys(g)); }
      } else {
        res = await fetch(`${api}/admin/modules`, { headers: auth()});
        if (res.ok) {
          const j = await res.json();
          if (j.modules) setModules(j.modules);
          if (j.grouped) { setGroupedPerms(j.grouped); const all=Object.values(j.grouped).flat() as any[]; setPerms(all); }
        } else {
          // fallback to perms
          res = await fetch(`${api}/admin/permissions`, { headers: auth()});
          if (res.ok) {
            const j = await res.json(); const list=parseApiList(j); setPerms(list);
            const g:Record<string,any[]>={}; for(const p of list){ if(!g[p.module]) g[p.module]=[]; g[p.module].push(p);} setGroupedPerms(g); setModules(Object.keys(g));
          }
        }
      }
    } catch(e:any){ setError(s=>({...s, modules:e.message})); } finally { setLoading(s=>({...s, modules:false})); }
  };

  const loadAll = ()=> { fetchBranches(); fetchDepartments(); fetchRoles(); fetchModules(); };
  useEffect(()=>{ loadAll(); },[]);

  // linked: when department branch filter changes refetch
  const [deptBranchFilter, setDeptBranchFilter] = useState<string>('');
  useEffect(()=> {
    if (tab==='departments') {
      fetchDepartments(deptBranchFilter || undefined);
    }
  }, [deptBranchFilter]);

  const createBranch = async()=> {
    if (!newBranch.name) return alert('Name required');
    const res = await fetch(`${api}/branches`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify(newBranch)});
    if (!res.ok) return alert('Failed: '+(await res.text()).slice(0,200));
    setNewBranch({ name:'', address:'', location:'', isHeadOffice:false }); fetchBranches();
  };
  const updateBranch = async()=> {
    const res = await fetch(`${api}/branches/${editingBranch.id}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify(editingBranch)});
    if (!res.ok) return alert('Update failed: '+(await res.text()).slice(0,200));
    setEditingBranch(null); fetchBranches();
  };
  const deleteBranch = async(id:string)=> {
    if (!confirm('Delete branch? Fails if departments/employees linked.')) return;
    const res = await fetch(`${api}/branches/${id}`, { method:'DELETE', headers: auth()});
    if (!res.ok) return alert('Delete failed: '+(await res.text()).slice(0,200));
    fetchBranches();
  };

  const createDept = async()=> {
    if (!newDept.name) return alert('Name required');
    const payload:any = { name: newDept.name, branchId: newDept.branchId || null, parentId: newDept.parentId || null, costCenter: newDept.costCenter || null };
    const res = await fetch(`${api}/departments`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify(payload)});
    if (!res.ok) return alert('Failed: '+(await res.text()).slice(0,200));
    setNewDept({ name:'', branchId:'', parentId:'', costCenter:'' }); fetchDepartments(deptBranchFilter || undefined);
  };
  const updateDept = async()=> {
    const payload:any = { name: editingDept.name, branchId: editingDept.branchId || null, parentId: editingDept.parentId || null, costCenter: editingDept.costCenter || null };
    const res = await fetch(`${api}/departments/${editingDept.id}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify(payload)});
    if (!res.ok) return alert('Update failed: '+(await res.text()).slice(0,200));
    setEditingDept(null); fetchDepartments(deptBranchFilter || undefined);
  };
  const deleteDept = async(id:string)=> {
    if (!confirm('Delete department? Fails if child departments or employees linked.')) return;
    const res = await fetch(`${api}/departments/${id}`, { method:'DELETE', headers: auth()});
    if (!res.ok) return alert('Delete failed: '+(await res.text()).slice(0,200));
    fetchDepartments(deptBranchFilter || undefined);
  };

  const createRole = async()=> {
    if (!newRole.name || !newRole.slug) return alert('Name and slug required');
    const res = await fetch(`${api}/admin/roles`, { method:'POST', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify(newRole)});
    if (!res.ok) return alert('Failed: '+(await res.text()).slice(0,200));
    setNewRole({ name:'', slug:'', description:'', permissions:[] }); fetchRoles();
  };
  const updateRole = async()=> {
    const res = await fetch(`${api}/admin/roles/${editingRole.id}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...auth()}, body: JSON.stringify(editingRole)});
    if (!res.ok) return alert('Update failed: '+(await res.text()).slice(0,200));
    setEditingRole(null); fetchRoles();
  };
  const deleteRole = async(id:string)=> {
    if (!confirm('Delete role? Fails if system role or users assigned.')) return;
    const res = await fetch(`${api}/admin/roles/${id}`, { method:'DELETE', headers: auth()});
    if (!res.ok) return alert('Delete failed: '+(await res.text()).slice(0,200));
    fetchRoles();
  };

  const filteredBranches = useMemo(()=> branches.filter(b=> !search || b.name?.toLowerCase().includes(search.toLowerCase())), [branches, search]);
  const filteredDepts = useMemo(()=> departments.filter(d=> !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.branch?.name?.toLowerCase().includes(search.toLowerCase())), [departments, search]);
  const filteredRoles = useMemo(()=> roles.filter(r=> !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.slug?.toLowerCase().includes(search.toLowerCase())), [roles, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers size={22}/> Dropdowns <span className="text-slate-500 font-normal">— Branches • Departments • Roles • Modules</span></h1>
          <p className="text-sm text-slate-500">Super Admin CRUD for dropdown values • Linked: Branch → Department via <code>?branchId=</code> • All dropdowns API-driven with JWT org.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
          <a href="/settings" className="text-sm glass rounded-xl px-3 py-2">← Settings</a>
        </div>
      </div>

      {!isSuperAdmin && (
        <GlassCard className="border-amber-200 bg-amber-50/50 flex items-center gap-2 text-sm text-amber-800"><AlertTriangle size={16}/> Only super_admin / org_admin / hr_admin can edit. You have read-only view.</GlassCard>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          ['branches','Branches',Building2],
          ['departments','Departments',Layers],
          ['roles','Roles',Shield],
          ['modules','Modules',Boxes],
        ].map(([k,label,Icon]:any)=> (
          <button key={k} onClick={()=>setTab(k as Tab)} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${tab===k?'bg-slate-900 text-white':'glass'}`}>
            <Icon size={16}/>{label}
            {k==='branches' && ` (${branches.length})`}
            {k==='departments' && ` (${departments.length})`}
            {k==='roles' && ` (${roles.length})`}
            {k==='modules' && ` (${modules.length})`}
          </button>
        ))}
        <div className="ml-auto relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="pl-9 pr-3 py-2 rounded-xl border text-sm bg-white"/>
        </div>
      </div>

      {tab==='branches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Plus size={16}/> Create Branch</h3>
            <div className="mt-3 space-y-2">
              <input placeholder="Branch name *" value={newBranch.name} onChange={e=>setNewBranch({...newBranch, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
              <input placeholder="Address" value={newBranch.address} onChange={e=>setNewBranch({...newBranch, address:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
              <input placeholder="Location (lat,lng or city)" value={newBranch.location} onChange={e=>setNewBranch({...newBranch, location:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newBranch.isHeadOffice} onChange={e=>setNewBranch({...newBranch, isHeadOffice:e.target.checked})}/> Head Office</label>
              <button onClick={createBranch} disabled={!isSuperAdmin} className="w-full bg-slate-900 text-white rounded-xl py-2 text-sm disabled:opacity-50">Create</button>
              <p className="text-xs text-slate-500">POST /v1/branches — JWT org scoped • GET /v1/branches</p>
            </div>
          </GlassCard>
          <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Building2 size={16}/> Branches</h3><Pill tone="blue">{filteredBranches.length} shown</Pill></div>
            {loading.branches ? <div className="p-8 text-center text-sm text-slate-500">Loading branches…</div> :
             error.branches ? <div className="p-4 text-sm text-red-600">{error.branches} <button onClick={fetchBranches} className="underline">Retry</button></div> :
             filteredBranches.length===0 ? <div className="p-8 text-center text-sm text-slate-500">No branches — create one.</div> :
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Name</th><th className="p-2">Address</th><th className="p-2">Head</th><th className="p-2">Depts</th><th className="p-2">Emps</th><th className="text-right p-2">Actions</th></tr></thead>
                <tbody className="divide-y">
                  {filteredBranches.map((b:any)=> (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-2"><div className="font-semibold">{b.name}</div><div className="text-xs font-mono text-slate-500">{b.id.slice(0,8)}</div></td>
                      <td className="p-2 text-xs">{b.address || '—'}</td>
                      <td className="p-2 text-center">{b.isHeadOffice ? <Pill tone="emerald">HQ</Pill> : '—'}</td>
                      <td className="p-2 text-center">{b._count?.departments ?? b.departments?.length ?? '—'}</td>
                      <td className="p-2 text-center">{b._count?.employees ?? '—'}</td>
                      <td className="p-2">
                        <div className="flex justify-end gap-1">
                          <button onClick={()=>setEditingBranch({...b})} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white"><Edit2 size={14}/></button>
                          <button onClick={()=>deleteBranch(b.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
            <div className="p-2 bg-slate-50/50 text-xs text-slate-500">DELETE /v1/branches/:id fails if departments/employees linked • PATCH to edit</div>
          </GlassCard>
          {editingBranch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur" onClick={()=>setEditingBranch(null)}/>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-3">
                <div className="flex items-center justify-between"><h3 className="font-bold">Edit Branch</h3><button onClick={()=>setEditingBranch(null)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><X size={16}/></button></div>
                <input value={editingBranch.name} onChange={e=>setEditingBranch({...editingBranch, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
                <input value={editingBranch.address||''} onChange={e=>setEditingBranch({...editingBranch, address:e.target.value})} placeholder="Address" className="w-full border rounded-xl px-3 py-2 text-sm"/>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editingBranch.isHeadOffice} onChange={e=>setEditingBranch({...editingBranch, isHeadOffice:e.target.checked})}/> Head Office</label>
                <div className="flex gap-2"><button onClick={()=>setEditingBranch(null)} className="flex-1 glass rounded-xl py-2">Cancel</button><button onClick={updateBranch} className="flex-1 bg-slate-900 text-white rounded-xl py-2 flex items-center justify-center gap-2"><Save size={14}/> Save</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Plus size={16}/> Create Department</h3>
            <p className="text-xs text-slate-500">Linked to Branch via <code>branchId</code> • parentId for hierarchy</p>
            <div className="mt-3 space-y-2">
              <input placeholder="Department name *" value={newDept.name} onChange={e=>setNewDept({...newDept, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
              <label className="text-sm font-medium">Branch (linked)
                <select value={newDept.branchId} onChange={e=>setNewDept({...newDept, branchId:e.target.value})} className="w-full mt-1 border rounded-xl px-3 py-2 text-sm bg-white">
                  <option value="">{loading.branches ? 'Loading…' : '— No branch (org-level) —'}</option>
                  {branches.map((b:any)=> <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {loading.branches && <span className="text-xs text-slate-400">Loading branches…</span>}
                {!loading.branches && branches.length===0 && <span className="text-xs text-slate-400">No branches — create one first.</span>}
              </label>
              <label className="text-sm font-medium">Parent Department (optional)
                <select value={newDept.parentId} onChange={e=>setNewDept({...newDept, parentId:e.target.value})} className="w-full mt-1 border rounded-xl px-3 py-2 text-sm bg-white">
                  <option value="">— No parent —</option>
                  {departments.map((d:any)=> <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {loading.departments && <span className="text-xs text-slate-400">Loading departments…</span>}
              </label>
              <input placeholder="Cost Center" value={newDept.costCenter} onChange={e=>setNewDept({...newDept, costCenter:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
              <button onClick={createDept} disabled={!isSuperAdmin} className="w-full bg-slate-900 text-white rounded-xl py-2 text-sm disabled:opacity-50">Create</button>
              <p className="text-xs text-slate-500">POST /v1/departments • GET /v1/departments?branchId=</p>
            </div>
          </GlassCard>
          <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <h3 className="font-semibold flex items-center gap-2"><Layers size={16}/> Departments</h3>
              <div className="flex items-center gap-2">
                <select value={deptBranchFilter} onChange={e=>setDeptBranchFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white">
                  <option value="">All branches</option>
                  {branches.map((b:any)=> <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <Pill tone="blue">{filteredDepts.length} shown</Pill>
              </div>
            </div>
            {deptBranchFilter && <div className="px-4 pb-2 text-xs text-slate-500">Linked filter: showing departments where <code>branchId={deptBranchFilter.slice(0,8)}</code> via <code>GET /v1/departments?branchId=</code></div>}
            {loading.departments ? <div className="p-8 text-center text-sm text-slate-500">Loading departments…</div> :
             error.departments ? <div className="p-4 text-sm text-red-600">{error.departments} <button onClick={()=>fetchDepartments(deptBranchFilter || undefined)} className="underline">Retry</button></div> :
             filteredDepts.length===0 ? <div className="p-8 text-center text-sm text-slate-500">{deptBranchFilter ? 'No departments for this branch — create one.' : 'No departments — create one.'}</div> :
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs sticky top-0"><tr><th className="text-left p-2">Department</th><th className="p-2">Branch</th><th className="p-2">Parent</th><th className="p-2">Cost Center</th><th className="text-right p-2">Actions</th></tr></thead>
                <tbody className="divide-y">
                  {filteredDepts.map((d:any)=> (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="p-2"><div className="font-semibold">{d.name}</div><div className="text-xs font-mono text-slate-500">{d.id.slice(0,8)}</div></td>
                      <td className="p-2 text-xs">{d.branch?.name || branches.find((b:any)=>b.id===d.branchId)?.name || '—'}</td>
                      <td className="p-2 text-xs">{d.parent?.name || departments.find((x:any)=>x.id===d.parentId)?.name || '—'}</td>
                      <td className="p-2 text-xs">{d.costCenter || '—'}</td>
                      <td className="p-2">
                        <div className="flex justify-end gap-1">
                          <button onClick={()=>setEditingDept({...d})} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white"><Edit2 size={14}/></button>
                          <button onClick={()=>deleteDept(d.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </GlassCard>
          {editingDept && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur" onClick={()=>setEditingDept(null)}/>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-3">
                <div className="flex items-center justify-between"><h3 className="font-bold">Edit Department</h3><button onClick={()=>setEditingDept(null)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><X size={16}/></button></div>
                <input value={editingDept.name} onChange={e=>setEditingDept({...editingDept, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
                <label className="text-sm">Branch
                  <select value={editingDept.branchId||''} onChange={e=>setEditingDept({...editingDept, branchId:e.target.value})} className="w-full mt-1 border rounded-xl px-3 py-2 text-sm bg-white">
                    <option value="">— No branch —</option>
                    {branches.map((b:any)=> <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </label>
                <label className="text-sm">Parent
                  <select value={editingDept.parentId||''} onChange={e=>setEditingDept({...editingDept, parentId:e.target.value})} className="w-full mt-1 border rounded-xl px-3 py-2 text-sm bg-white">
                    <option value="">— No parent —</option>
                    {departments.filter((x:any)=> x.id!==editingDept.id).map((d:any)=> <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <input value={editingDept.costCenter||''} onChange={e=>setEditingDept({...editingDept, costCenter:e.target.value})} placeholder="Cost Center" className="w-full border rounded-xl px-3 py-2 text-sm"/>
                <div className="flex gap-2"><button onClick={()=>setEditingDept(null)} className="flex-1 glass rounded-xl py-2">Cancel</button><button onClick={updateDept} className="flex-1 bg-slate-900 text-white rounded-xl py-2 flex items-center justify-center gap-2"><Save size={14}/> Save</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Plus size={16}/> Create Role</h3>
            <div className="mt-3 space-y-2">
              <input placeholder="Name *" value={newRole.name} onChange={e=>setNewRole({...newRole, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
              <input placeholder="Slug * (e.g., finance_lead)" value={newRole.slug} onChange={e=>setNewRole({...newRole, slug:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm font-mono"/>
              <input placeholder="Description" value={newRole.description} onChange={e=>setNewRole({...newRole, description:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
              <div className="border rounded-xl p-2 max-h-[300px] overflow-auto space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Permissions grouped by module</span>
                  <select value={permFilterModule} onChange={e=>setPermFilterModule(e.target.value)} className="border rounded-lg px-2 py-1 text-xs bg-white">
                    <option value="">All modules</option>
                    {modules.map(m=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {loading.modules && <div className="text-xs text-slate-500">Loading modules…</div>}
                {error.modules && <div className="text-xs text-red-600">{error.modules}</div>}
                {!loading.modules && !error.modules && Object.keys(groupedPerms).length===0 && <div className="text-xs text-slate-400">No permissions — seed required.</div>}
                {Object.entries(groupedPerms).filter(([m])=> !permFilterModule || m===permFilterModule).map(([mod, list]:any)=> (
                  <div key={mod} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 text-xs font-semibold">
                      <input type="checkbox" checked={list.every((p:any)=> newRole.permissions.includes(p.key))} onChange={e=> {
                        const keys = list.map((p:any)=>p.key);
                        if (e.target.checked) setNewRole({...newRole, permissions: Array.from(new Set([...newRole.permissions, ...keys]))});
                        else setNewRole({...newRole, permissions: newRole.permissions.filter(k=> !keys.includes(k))});
                      }}/>
                      <span className="capitalize flex-1">{mod}</span>
                      <span className="text-[11px] bg-white border rounded-full px-1.5">{list.length}</span>
                    </div>
                    <div className="divide-y">
                      {(list as any[]).map((p:any)=> (
                        <label key={p.key} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-slate-50">
                          <input type="checkbox" checked={newRole.permissions.includes(p.key)} onChange={e=> setNewRole({...newRole, permissions: e.target.checked ? [...newRole.permissions, p.key] : newRole.permissions.filter(x=>x!==p.key)})}/>
                          <span className="font-mono">{p.key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="text-xs text-slate-500">{perms.length} perms • {modules.length} modules • {newRole.permissions.length} selected</div>
              </div>
              <button onClick={createRole} disabled={!isSuperAdmin} className="w-full bg-slate-900 text-white rounded-xl py-2 text-sm disabled:opacity-50">Create Role</button>
              <p className="text-xs text-slate-500">POST /v1/admin/roles • GET /v1/admin/permissions/grouped</p>
            </div>
          </GlassCard>
          <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-4"><h3 className="font-semibold flex items-center gap-2"><Shield size={16}/> Roles</h3></div>
            {loading.roles ? <div className="p-8 text-center text-sm text-slate-500">Loading roles…</div> :
             error.roles ? <div className="p-4 text-sm text-red-600">{error.roles} <button onClick={fetchRoles} className="underline">Retry</button></div> :
             <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Role</th><th className="p-2">Slug</th><th className="p-2">Perms</th><th className="p-2">System</th><th className="text-right p-2">Actions</th></tr></thead>
                <tbody className="divide-y">
                  {filteredRoles.map((r:any)=> (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="p-2"><div className="font-semibold">{r.name}</div><div className="text-xs text-slate-500">{r.description}</div></td>
                      <td className="p-2 font-mono text-xs">{r.slug}</td>
                      <td className="p-2 text-xs">{r.permissions?.length ?? 0}</td>
                      <td className="p-2"><Pill tone={r.isSystem?'slate':'emerald'}>{r.isSystem?'system':'custom'}</Pill></td>
                      <td className="p-2"><div className="flex justify-end gap-1">
                        <button onClick={()=>setEditingRole({...r, permissions: r.permissions || []})} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white"><Edit2 size={14}/></button>
                        <button onClick={()=>deleteRole(r.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"><Trash2 size={14}/></button>
                      </div></td>
                    </tr>
                  ))}
                  {filteredRoles.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No roles.</td></tr>}
                </tbody>
              </table>
            </div>}
          </GlassCard>
          {editingRole && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur" onClick={()=>setEditingRole(null)}/>
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><h3 className="font-bold">Edit Role — {editingRole.slug}</h3><button onClick={()=>setEditingRole(null)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><X size={16}/></button></div>
                <div className="p-4 space-y-3">
                  <input value={editingRole.name} onChange={e=>setEditingRole({...editingRole, name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
                  <input value={editingRole.slug} onChange={e=>setEditingRole({...editingRole, slug:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm font-mono"/>
                  <input value={editingRole.description||''} onChange={e=>setEditingRole({...editingRole, description:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
                  <div className="border rounded-xl p-2 max-h-[300px] overflow-auto space-y-2">
                    {Object.entries(groupedPerms).map(([mod, list]:any)=> (
                      <div key={mod} className="border rounded-lg overflow-hidden">
                        <div className="px-2 py-1 bg-slate-50 text-xs font-semibold capitalize">{mod}</div>
                        <div className="divide-y">
                          {(list as any[]).map((p:any)=> (
                            <label key={p.key} className="flex items-center gap-2 px-2 py-1 text-xs">
                              <input type="checkbox" checked={Array.isArray(editingRole.permissions) ? editingRole.permissions.includes(p.key) : false} onChange={e=>{
                                const cur = Array.isArray(editingRole.permissions) ? editingRole.permissions : [];
                                const next = e.target.checked ? [...cur, p.key] : cur.filter((x:string)=> x!==p.key);
                                setEditingRole({...editingRole, permissions: next});
                              }}/>
                              <span className="font-mono">{p.key}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2"><button onClick={()=>setEditingRole(null)} className="flex-1 glass rounded-xl py-2">Cancel</button><button onClick={updateRole} className="flex-1 bg-slate-900 text-white rounded-xl py-2 flex items-center justify-center gap-2"><Save size={14}/> Save</button></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='modules' && (
        <div className="space-y-4">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Boxes size={16}/> Modules • Permissions grouped</h3><Pill tone="blue">{modules.length} modules • {perms.length} permissions</Pill></div>
            {loading.modules ? <div className="p-8 text-center text-sm text-slate-500">Loading modules…</div> :
             error.modules ? <div className="p-4 text-sm text-red-600">{error.modules} <button onClick={fetchModules} className="underline">Retry</button></div> :
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-1">
                {modules.map(m=> <span key={m} className={`text-xs border rounded-full px-2 py-1 ${permFilterModule===m?'bg-slate-900 text-white':'bg-slate-50'}`} onClick={()=>setPermFilterModule(m===permFilterModule?'':m)} style={{cursor:'pointer'}}>{m} ({groupedPerms[m]?.length||0})</span>)}
              </div>
              {permFilterModule && <div className="text-xs text-slate-500">Filtered to module <code>{permFilterModule}</code> — click again to clear. Permissions filter when module changes (linked).</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(permFilterModule ? [permFilterModule] : modules).map(mod=> (
                  <div key={mod} className="border rounded-xl overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 font-semibold text-sm capitalize flex items-center justify-between">{mod}<span className="text-xs bg-white border rounded-full px-2 py-0.5">{groupedPerms[mod]?.length||0}</span></div>
                    <div className="divide-y max-h-[260px] overflow-auto">
                      {(groupedPerms[mod]||[]).map((p:any)=> (
                        <div key={p.key} className="px-3 py-2 text-xs flex items-center justify-between">
                          <span className="font-mono">{p.key}</span>
                          <span className="text-slate-500">{p.name !== p.key ? p.name : ''}</span>
                        </div>
                      ))}
                      {(groupedPerms[mod]?.length||0)===0 && <div className="p-3 text-xs text-slate-400">No permissions in this module (static).</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-500">GET /v1/admin/permissions/grouped • GET /v1/admin/modules • Linked: selecting module filters permissions. Create permissions via <code>POST /v1/admin/permissions</code> (super_admin).</div>
            </div>}
          </GlassCard>
          <GlassCard>
            <h3 className="font-semibold text-sm">How linking works</h3>
            <div className="mt-2 text-xs text-slate-600 space-y-1">
              <div><code>Branch → Department</code>: Departments filtered by <code>?branchId=&lt;id&gt;</code>. In People Add/Edit, changing Branch refetches Departments. Empty shows “No departments for this branch”.</div>
              <div><code>Module → Permissions</code>: Selecting a module filters permission checkboxes (Roles tab). Grouped view via <code>GET /v1/admin/permissions/grouped</code> or <code>GET /v1/admin/modules</code>.</div>
              <div>All fetches use <code>NEXT_PUBLIC_API_URL</code> + <code>localStorage.getItem(&apos;onehr_token&apos;)</code> JWT with org scope. Loading/error/empty states handled generically.</div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
