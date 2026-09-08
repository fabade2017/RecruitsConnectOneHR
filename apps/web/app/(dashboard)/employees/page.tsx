'use client';
import { useEffect, useMemo, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Users, QrCode, Search, Plus, Filter, Download, Eye, Edit2, X, Save, Building2, Camera, AlertTriangle, Check } from 'lucide-react';
import { getApiUrl, getAuthHeaders, parseApiList } from '../../../lib/api';

type DropdownState = { loading: boolean; error: string };

export default function PeoplePage() {
  const api = getApiUrl();
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const [branchState, setBranchState] = useState<DropdownState>({ loading: false, error: '' });
  const [deptState, setDeptState] = useState<DropdownState>({ loading: false, error: '' });
  const [roleState, setRoleState] = useState<DropdownState>({ loading: false, error: '' });

  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ jobTitle:'', grade:'L1', workArrangement:'office', employmentType:'permanent', status:'active', departmentId:'', branchId:'', skills:'', role:'', email:'', phone:'', dob:'', hireDate: new Date().toISOString().slice(0,10) });
  const [showBulk, setShowBulk] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const authHeader = () => getAuthHeaders() as any;

  const normalizeList = (json:any) => parseApiList(json);

  const fetchBranches = async () => {
    setBranchState({ loading: true, error: '' });
    try {
      const res = await fetch(`${api}/branches`, { headers: authHeader() });
      if (!res.ok) throw new Error(`Branches ${res.status}`);
      const json = await res.json().catch(()=>[]);
      const list = normalizeList(json);
      setBranches(list);
      if (list.length===0) setBranchState({ loading: false, error: '' });
      else setBranchState({ loading: false, error: '' });
    } catch (e:any) {
      setBranchState({ loading: false, error: e.message || 'Failed to load branches' });
      setBranches([]);
    }
  };

  const fetchDepartments = async (branchId?: string) => {
    setDeptState({ loading: true, error: '' });
    try {
      const url = branchId ? `${api}/departments?branchId=${encodeURIComponent(branchId)}` : `${api}/departments`;
      const res = await fetch(url, { headers: authHeader() });
      if (!res.ok) throw new Error(`Departments ${res.status}`);
      const json = await res.json().catch(()=>[]);
      const list = normalizeList(json);
      // client-side filter as fallback if API didn't filter
      const filtered = branchId ? list.filter((d:any)=> !d.branchId || d.branchId===branchId) : list;
      // if API returned empty but we had allDepartments cached and branchId filtered, try client filter from cache
      if (branchId && filtered.length===0 && allDepartments.length>0) {
        const clientFiltered = allDepartments.filter((d:any)=> d.branchId===branchId || !d.branchId);
        // if still empty, show empty (linked behavior)
        setDepartments(clientFiltered);
      } else {
        setDepartments(filtered);
        if (!branchId) setAllDepartments(filtered);
      }
      setDeptState({ loading: false, error: '' });
    } catch (e:any) {
      setDeptState({ loading: false, error: e.message || 'Failed to load departments' });
      // fallback to client filter if possible
      if (branchId && allDepartments.length) {
        setDepartments(allDepartments.filter((d:any)=> d.branchId===branchId));
      } else {
        setDepartments([]);
      }
    }
  };

  const fetchRoles = async () => {
    setRoleState({ loading: true, error: '' });
    try {
      const res = await fetch(`${api}/admin/roles`, { headers: authHeader() });
      if (!res.ok) throw new Error(`Roles ${res.status}`);
      const json = await res.json().catch(()=>[]);
      const list = normalizeList(json);
      setRoles(list);
      setRoleState({ loading: false, error: '' });
    } catch (e:any) {
      setRoleState({ loading: false, error: e.message || 'Failed to load roles' });
      setRoles([]);
    }
  };

  const fetchEmployees = async () => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('onehr_token') : null;
    if (!t) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${api}/employees?limit=50`, { headers: authHeader() });
      const json = await res.json().catch(()=>[]);
      const list = normalizeList(json);
      setEmployees(list);
      // fallback branches/depts extraction if APIs empty
      if (list.length && branches.length===0 && departments.length===0 && allDepartments.length===0) {
        const uniqDepts = Array.from(new Map(list.map((e:any)=> e.department).filter(Boolean).map((d:any)=> [d.id,d])).values());
        if (uniqDepts.length) { setDepartments(uniqDepts as any); setAllDepartments(uniqDepts as any); }
        const uniqBranches = Array.from(new Map(list.map((e:any)=> e.branch).filter(Boolean).map((b:any)=> [b.id,b])).values());
        if (uniqBranches.length) setBranches(uniqBranches as any);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadAll = async () => {
    await Promise.all([fetchBranches(), fetchDepartments(), fetchRoles(), fetchEmployees()]);
  };

  useEffect(()=>{ loadAll(); }, []);
  // reload depts when employees loaded if needed
  useEffect(()=> {
    if (employees.length && allDepartments.length===0 && departments.length===0 && !deptState.loading) {
      const uniqDepts = employees.map((e:any)=> e.department).filter(Boolean);
      const uniqMap = new Map(uniqDepts.map((d:any)=> [d.id, d]));
      if (uniqMap.size) { const vals = Array.from(uniqMap.values()); setDepartments(vals); setAllDepartments(vals); }
      const uniqBranches = employees.map((e:any)=> e.branch).filter(Boolean);
      const uniqBMap = new Map(uniqBranches.map((b:any)=> [b.id, b]));
      if (uniqBMap.size) setBranches(Array.from(uniqBMap.values()));
    }
  }, [employees]);

  // Linked: when editing branch changes, refetch departments filtered
  useEffect(()=> {
    if (editing) {
      if (form.branchId) fetchDepartments(form.branchId);
      else if (allDepartments.length===0) fetchDepartments();
      else setDepartments(allDepartments);
    }
  }, [form.branchId]);
  useEffect(()=> {
    if (showAdd) {
      if (addForm.branchId) fetchDepartments(addForm.branchId);
      else if (allDepartments.length===0) fetchDepartments();
      else setDepartments(allDepartments);
    }
  }, [addForm.branchId]);

  // When modals open, ensure latest linked fetch
  useEffect(()=> { if (showAdd && !allDepartments.length && !deptState.loading) fetchDepartments(addForm.branchId || undefined); }, [showAdd]);
  useEffect(()=> { if (editing && !allDepartments.length && !deptState.loading) fetchDepartments(form.branchId || undefined); }, [editing]);

  const filtered = employees.filter(e => !q || e.employeeCode?.toLowerCase().includes(q.toLowerCase()) || e.jobTitle?.toLowerCase().includes(q.toLowerCase()));

  const branchOptionsForForm = useMemo(()=> branches, [branches]);
  const deptOptionsForForm = useMemo(()=> {
    // show linked filtered list if branch selected, otherwise all
    const branchId = editing ? form.branchId : showAdd ? addForm.branchId : null;
    if (branchId && allDepartments.length) {
      const filtered = allDepartments.filter((d:any)=> !d.branchId || d.branchId===branchId);
      // if API filtered already departed, use departments else use client filter
      return deptState.loading ? [] : (departments.length ? departments : filtered);
    }
    return departments.length ? departments : allDepartments;
  }, [departments, allDepartments, form.branchId, addForm.branchId, editing, showAdd, deptState.loading]);

  const openEdit = (emp:any) => {
    setEditing(emp);
    setForm({
      jobTitle: emp.jobTitle || '',
      grade: emp.grade || '',
      departmentId: emp.departmentId || '',
      branchId: emp.branchId || '',
      workArrangement: emp.workArrangement || 'office',
      employmentType: emp.employmentType || 'permanent',
      status: emp.status || 'active',
      role: emp.user?.role || emp.role || '',
      email: emp.user?.email || emp.email || '',
      phone: emp.user?.phone || emp.phone || '',
      dob: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().slice(0,10) : '',
      hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().slice(0,10) : '',
      skills: (()=>{ try{ const s=typeof emp.skills==='string'? JSON.parse(emp.skills): emp.skills; return Array.isArray(s)? s.join(', '): '' } catch{ return '' }})(),
    });
    // trigger linked fetch
    if (emp.branchId) fetchDepartments(emp.branchId);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload:any = {
        jobTitle: form.jobTitle,
        grade: form.grade,
        departmentId: form.departmentId || null,
        branchId: form.branchId || null,
        workArrangement: form.workArrangement,
        employmentType: form.employmentType,
        status: form.status,
        skills: form.skills ? form.skills.split(',').map((s:string)=>s.trim()).filter(Boolean) : [],
        email: form.email || undefined,
        phone: form.phone || undefined,
        dob: form.dob || undefined,
        date_of_birth: form.dob || undefined,
        hire_date: form.hireDate || undefined,
      };
      if (form.role) payload.role = form.role;
      const res = await fetch(`${api}/employees/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', ...authHeader() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({message:'Update failed'}));
        throw new Error(err.message || 'Update failed');
      }
      setEditing(null);
      loadAll();
    } catch (e:any) {
      alert(e.message);
    } finally { setSaving(false); }
  };

  const handleAdd = async () => {
    if (!addForm.jobTitle) return alert('Job title required');
    if (addForm.email && !addForm.email.includes('@')) return alert('Invalid email');
    setSaving(true);
    try {
      const payload:any = {
        job_title: addForm.jobTitle,
        grade: addForm.grade,
        department_id: addForm.departmentId || undefined,
        branch_id: addForm.branchId || undefined,
        work_arrangement: addForm.workArrangement,
        employment_type: addForm.employmentType,
        hire_date: addForm.hireDate || new Date().toISOString(),
        date_of_birth: addForm.dob || undefined,
        dob: addForm.dob || undefined,
        skills: addForm.skills ? addForm.skills.split(',').map((s:string)=>s.trim()).filter(Boolean) : [],
        email: addForm.email || undefined,
        phone: addForm.phone || undefined,
      };
      if (addForm.role) payload.role = addForm.role;
      const res = await fetch(`${api}/employees`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...authHeader() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({message:'Create failed'}));
        throw new Error(err.message || 'Create failed');
      }
      const data = await res.json().catch(()=>({}));
      // If email was provided, backend may have created user with default password - show it
      if (addForm.email && data?.employee) {
        // Fetch org acronym for password hint - we can compute client-side as Acad+MMYYYY+DD
        const acronym = data.employee.employeeCode?.split('-')[0] || 'ORG';
        const dobDay = addForm.dob ? String(new Date(addForm.dob).getDate()).padStart(2,'0') : '00';
        const now = new Date();
        const pwd = `${acronym}${String(now.getMonth()+1).padStart(2,'0')}${now.getFullYear()}${dobDay}`;
        alert(`Employee ${data.employee.employeeCode} created.\nLogin: ${addForm.email}\nDefault password: ${pwd}\n(Must change on first login)`);
      }
      setShowAdd(false);
      setAddForm({ jobTitle:'', grade:'L1', workArrangement:'office', employmentType:'permanent', status:'active', departmentId:'', branchId:'', skills:'', role:'', email:'', phone:'', dob:'', hireDate: new Date().toISOString().slice(0,10) });
      loadAll();
    } catch (e:any) { alert(e.message); } finally { setSaving(false); }
  };

  const downloadTemplate = async () => {
    try {
      // Try Excel template with dropdowns first
      const res = await fetch(`${api}/employees/bulk/template/xlsx`, { headers: authHeader() });
      if (res.ok && res.headers.get('content-type')?.includes('spreadsheet')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'OneHR_Employees_Template.xlsx'; a.click(); URL.revokeObjectURL(url);
        return;
      }
    } catch {}
    try {
      const res = await fetch(`${api}/employees/bulk/template`, { headers: authHeader() });
      const data = await res.json();
      const csv = data.csv || 'job_title,grade,department,branch,employment_type,work_arrangement,hire_date,skills,phone,email\nSoftware Engineer,L2,Engineering,Lagos Head Office,permanent,office,2024-01-15,"React,Node",08012345678,eng1@company.com';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'employees_template.csv'; a.click(); URL.revokeObjectURL(url);
    } catch {
      const csv = 'job_title,grade,department,branch,employment_type,work_arrangement,hire_date,skills,phone,email\nSoftware Engineer,L2,Engineering,Lagos Head Office,permanent,office,2024-01-15,"React,Node",08012345678,eng1@company.com';
      const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='employees_template.csv'; a.click(); URL.revokeObjectURL(url);
    }
  };

  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBulkFile(file); setBulkResult(null);
    if (!file) { setBulkPreview([]); return; }
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcel) {
      // For Excel, show placeholder preview (will be parsed server-side)
      setBulkPreview([{ job_title: 'Excel file selected', grade: '—', department: '—', branch: '—', note: `${file.name} • ${(file.size/1024).toFixed(1)} KB • 300 rows max` }]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const lines = text.trim().split('\n');
      if (lines.length < 2) { setBulkPreview([]); return; }
      const header = lines[0].split(',').map(h=>h.trim().toLowerCase());
      const preview:any[] = [];
      for (let i=1; i<Math.min(lines.length, 6); i++) {
        const line = lines[i];
        const cols:string[]=[]; let cur='', inQ=false;
        for (const ch of line) { if (ch==='"') inQ=!inQ; else if (ch===',' && !inQ) { cols.push(cur.trim().replace(/^"|"$/g,'')); cur=''; } else cur+=ch; }
        cols.push(cur.trim().replace(/^"|"$/g,''));
        const obj:any={}; header.forEach((h,idx)=> obj[h]=cols[idx]||''); preview.push(obj);
      }
      setBulkPreview(preview);
    };
    reader.readAsText(file);
  };

  const uploadBulk = async () => {
    if (!bulkFile) return alert('Select Excel or CSV file');
    setBulkLoading(true);
    try {
      const isExcel = bulkFile.name.endsWith('.xlsx') || bulkFile.name.endsWith('.xls');
      let res: Response;
      if (isExcel) {
        const fd = new FormData();
        fd.append('file', bulkFile);
        res = await fetch(`${api}/employees/bulk/excel`, { method: 'POST', headers: { ...authHeader() }, body: fd });
      } else {
        const text = await bulkFile.text();
        res = await fetch(`${api}/employees/bulk`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', ...authHeader() },
          body: JSON.stringify({ csv: text })
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bulk failed');
      setBulkResult(data);
      loadAll();
    } catch (e:any) { alert(e.message); } finally { setBulkLoading(false); }
  };

  const renderBranchSelect = (value:string, onChange:(v:string)=>void) => (
    <label className="text-sm font-medium">Branch
      <select value={value} onChange={e=>onChange(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50" disabled={branchState.loading}>
        <option value="">{branchState.loading ? 'Loading branches…' : branches.length ? '— No branch —' : '— No branches available —'}</option>
        {branchState.loading && <option disabled>Loading…</option>}
        {!branchState.loading && branches.length===0 && <option disabled>No branches — create in Settings → Dropdowns</option>}
        {branches.map((b:any)=> <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      {branchState.loading && <span className="text-xs text-slate-400">Loading branches…</span>}
      {branchState.error && <span className="text-xs text-red-600 block">{branchState.error}</span>}
      {!branchState.loading && !branchState.error && branches.length===0 && <span className="text-xs text-slate-400">No branches. Create in Settings → Dropdowns.</span>}
    </label>
  );

  const renderDeptSelect = (value:string, onChange:(v:string)=>void, branchId:string) => {
    const opts = branchId ? deptOptionsForForm.filter((d:any)=> !d.branchId || d.branchId===branchId || departments.some(x=>x.id===d.id)) : deptOptionsForForm;
    // if branch selected and filtered empty, show empty state linked
    const isLinkedEmpty = branchId && !deptState.loading && opts.length===0;
    return (
      <label className="text-sm font-medium">Department
        <select value={value} onChange={e=>onChange(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50" disabled={deptState.loading}>
          <option value="">{deptState.loading ? 'Loading departments…' : isLinkedEmpty ? '— No departments for this branch —' : '— No department —'}</option>
          {deptState.loading && <option disabled>Loading…</option>}
          {!deptState.loading && opts.map((d:any)=> <option key={d.id} value={d.id}>{d.name}{d.branch?.name ? ` • ${d.branch.name}` : ''}</option>)}
          {!deptState.loading && isLinkedEmpty && <option disabled>Create department for this branch in Settings → Dropdowns</option>}
        </select>
        {deptState.loading && <span className="text-xs text-slate-400">Loading departments…</span>}
        {deptState.error && <span className="text-xs text-red-600 block">{deptState.error}</span>}
        {!deptState.loading && !deptState.error && branches.length===0 && departments.length===0 && <span className="text-xs text-slate-400">No departments. Create in Settings → Dropdowns.</span>}
        {isLinkedEmpty && <span className="text-xs text-amber-600 block">No departments linked to selected branch. Change branch or create one.</span>}
      </label>
    );
  };

  const renderRoleSelect = (value:string, onChange:(v:string)=>void) => {
    if (roles.length===0 && !roleState.loading && roleState.error) return null; // hide if no permission
    const SYSTEM_ROLES = [
      { slug:'super_admin', name:'Super Admin' },
      { slug:'org_admin', name:'Org Admin' },
      { slug:'hr_admin', name:'HR Admin' },
      { slug:'hr_manager', name:'HR Manager' },
      { slug:'manager', name:'Manager' },
      { slug:'employee', name:'Employee' },
      { slug:'executive', name:'Executive' },
      { slug:'auditor', name:'Auditor' },
    ];
    const mergedRoles = (() => {
      const map = new Map(roles.map((r:any)=> [r.slug, r]));
      for (const s of SYSTEM_ROLES) if (!map.has(s.slug)) map.set(s.slug, { id:`sys-${s.slug}`, slug:s.slug, name:s.name });
      // ensure current value is present even if custom
      if (value && !map.has(value)) map.set(value, { id:`cur-${value}`, slug:value, name:value });
      return Array.from(map.values());
    })();
    return (
      <label className="text-sm font-medium">Role
        <select value={value} onChange={e=>onChange(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50" disabled={roleState.loading}>
          <option value="">{roleState.loading ? 'Loading roles…' : '— No role change —'}</option>
          {roleState.loading && <option disabled>Loading…</option>}
          {mergedRoles.map((r:any)=> <option key={r.id} value={r.slug}>{r.name} ({r.slug})</option>)}
        </select>
        {roleState.loading && <span className="text-xs text-slate-400">Loading roles…</span>}
        {roleState.error && <span className="text-xs text-slate-400 block">Roles unavailable ({roleState.error.slice(0,60)})</span>}
        {!roleState.loading && roles.length===0 && !roleState.error && <span className="text-xs text-slate-400">No roles — create in Settings → Dropdowns or Admin.</span>}
      </label>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users size={22}/> People <span className="text-slate-500 font-normal">— Digital Identity §3</span></h1>
          <p className="text-sm text-slate-500">OneHR ID <span className="font-mono bg-slate-900 text-white px-2 py-0.5 rounded-full text-xs">RC-000245</span> + QR • Lifecycle: Hire → Alumni</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/seed" className="hidden" />
          <button onClick={downloadTemplate} className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Download size={16}/> Template</button>
          <button onClick={() => setShowBulk(true)} className="bg-emerald-600 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-emerald-700"><Download size={16}/> Bulk Upload (300+)</button>
          <button onClick={() => setShowAdd(true)} className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-800"><Plus size={16}/> Add Employee</button>
        </div>
      </div>

      <GlassCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search ID, name, job title, skills..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <button className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Filter size={16}/> Filters</button>
          <Pill tone="blue">{filtered.length} people</Pill>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 text-xs tracking-widest text-slate-500">
              <tr><th className="text-left p-3">EMPLOYEE</th><th className="text-left p-3">ID / QR</th><th className="text-left p-3">DEPT / BRANCH</th><th className="text-left p-3">JOB TITLE / GRADE</th><th className="text-left p-3">WORK MODE</th><th className="text-left p-3">STATUS</th><th className="text-right p-3">ACTIONS</th></tr>
            </thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading…</td></tr> :
                filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={e.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${e.employeeCode}`} className="w-9 h-9 rounded-full bg-slate-100" alt="" />
                      <div><div className="font-semibold">{e.employeeCode}</div><div className="text-xs text-slate-500">{e.jobTitle || '—'}</div></div>
                    </div>
                  </td>
                  <td className="p-3"><span className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-full">{e.employeeCode}</span><div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><QrCode size={12}/> QR</div></td>
                  <td className="p-3"><div className="text-xs">{e.department?.name || '—'} {e.branch?.name && <span className="text-slate-500">• {e.branch.name}</span>}</div><div className="text-xs text-slate-500">{e.managerId ? 'Has manager' : 'No manager'}</div></td>
                  <td className="p-3"><div>{e.jobTitle || '—'}</div><div className="text-xs"><span className="bg-slate-100 rounded px-2 py-0.5">{e.grade || '—'}</span></div></td>
                  <td className="p-3"><Pill tone={e.workArrangement==='remote'?'blue':e.workArrangement==='hybrid'?'amber':'slate'}>{e.workArrangement || 'office'}</Pill><div className="text-xs text-slate-500 mt-1">{e.employmentType}</div></td>
                  <td className="p-3"><Pill tone={e.status==='active'?'emerald':e.status==='probation'?'amber':'slate'}>{e.status}</Pill></td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={()=>{
                          const link = `${window.location.origin}/face-enroll/${e.id}`;
                          navigator.clipboard.writeText(link);
                          alert(`Face enroll link copied for ${e.employeeCode}:\n${link}\n\nSend this link to the employee to capture 3 face images. Clock-in will compare live snap with enrolled faces for fraud detection.`);
                        }}
                        title="Copy face enroll link"
                        className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600"
                      >
                        <Camera size={14}/>
                      </button>
                      <a href={`/face-enroll/${e.id}`} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white" title="Open face enroll"><Eye size={14}/></a>
                      <a href={`/employee`} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white"><Eye size={14}/></a>
                      <button onClick={()=>openEdit(e)} className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800"><Edit2 size={14}/></button>
                    </div>
                    <div className="text-[11px] text-center mt-1">
                      {(()=>{ try{
                        const parsed = e.faceProfileRef ? JSON.parse(e.faceProfileRef) : null;
                        let count = 0; let hasDesc = false;
                        if (Array.isArray(parsed)) { count = parsed.length; }
                        else if (parsed && Array.isArray(parsed.images)) { count = parsed.images.length; hasDesc = Array.isArray(parsed.descriptors) && parsed.descriptors.length>0; }
                        if (count) return <span className="text-emerald-600">● Face {count}/3 {hasDesc ? '✓' : ''}</span>;
                        return <span className="text-amber-600">○ No face</span>;
                      } catch{ return <span className="text-slate-400">—</span> }})()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 text-xs text-slate-500 flex justify-between">
          <span>Digital Identity follows lifecycle (§3) • 25+ fields: skills, certs, attendance, leave, performance, assets (§44)</span>
          <span>14 work arrangements §11 • 6 shift types §12</span>
        </div>
      </GlassCard>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur" onClick={()=>setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold flex items-center gap-2"><Edit2 size={18}/> Edit {editing.employeeCode}</h3>
                <p className="text-xs text-slate-500">Update at least one field • RBAC: hr_admin / org_admin • Employee can only edit self (phone/skills)</p>
              </div>
              <button onClick={()=>setEditing(null)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm font-medium">Job Title
                  <input value={form.jobTitle} onChange={e=>setForm({...form, jobTitle:e.target.value})} placeholder="HR Administrator" className="w-full mt-1 px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500"/>
                </label>
                <label className="text-sm font-medium">Grade
                  <input value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})} placeholder="M3 / L1" className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
                <label className="text-sm font-medium">Work Email
                  <input type="email" value={form.email || ''} onChange={e=>setForm({...form, email:e.target.value})} placeholder="you@company.com" className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
                <label className="text-sm font-medium">Phone
                  <input value={form.phone || ''} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="08012345678" className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
                <label className="text-sm font-medium">Date of Birth
                  <input type="date" value={form.dob || ''} onChange={e=>setForm({...form, dob:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
                <label className="text-sm font-medium">Hire Date
                  <input type="date" value={form.hireDate || ''} onChange={e=>setForm({...form, hireDate:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
                <label className="text-sm font-medium">Work Arrangement
                  <select value={form.workArrangement} onChange={e=>setForm({...form, workArrangement:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white">
                    <option value="office">office</option><option value="remote">remote</option><option value="hybrid">hybrid</option><option value="field">field</option><option value="shift">shift</option>
                  </select>
                </label>
                <label className="text-sm font-medium">Employment Type
                  <select value={form.employmentType} onChange={e=>setForm({...form, employmentType:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white">
                    <option value="permanent">permanent</option><option value="contract">contract</option><option value="intern">intern</option><option value="part_time">part_time</option>
                  </select>
                </label>
                <label className="text-sm font-medium">Status
                  <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white">
                    <option value="active">active</option><option value="probation">probation</option><option value="suspended">suspended</option><option value="exited">exited</option>
                  </select>
                </label>
                {renderRoleSelect(form.role || '', (v)=> setForm({...form, role:v}))}
                {renderBranchSelect(form.branchId, (v)=> { setForm({...form, branchId: v, departmentId: ''}); })}
                {renderDeptSelect(form.departmentId, (v)=> setForm({...form, departmentId: v}), form.branchId)}
                <label className="text-sm font-medium md:col-span-2">Skills (comma separated)
                  <input value={form.skills} onChange={e=>setForm({...form, skills:e.target.value})} placeholder="HRIS, Compliance, Payroll" className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setEditing(null)} className="flex-1 glass rounded-xl py-2.5 font-semibold">Cancel</button>
                <button onClick={saveEdit} disabled={saving} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"><Save size={16}/>{saving ? 'Saving…' : 'Save changes'}</button>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 size={12}/> Changes are audited • QR and OneHR ID remain unchanged</p>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur" onClick={()=>setShowAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold flex items-center gap-2"><Plus size={18}/> Add Employee</h3>
                <p className="text-xs text-slate-500">Auto-generates OneHR ID (e.g., RC-000006) + QR • Visible to Super Admin in Organizations</p>
              </div>
              <button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm font-medium">Job Title *
                  <input value={addForm.jobTitle} onChange={e=>setAddForm({...addForm, jobTitle:e.target.value})} placeholder="Software Engineer" className="w-full mt-1 px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500"/>
                </label>
                <label className="text-sm font-medium">Grade
                  <input value={addForm.grade} onChange={e=>setAddForm({...addForm, grade:e.target.value})} placeholder="L2" className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
                <label className="text-sm font-medium">Work Email *
                  <input type="email" value={addForm.email} onChange={e=>setAddForm({...addForm, email:e.target.value})} placeholder="eng1@company.com" className="w-full mt-1 px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500"/>
                </label>
                <label className="text-sm font-medium">Phone
                  <input value={addForm.phone} onChange={e=>setAddForm({...addForm, phone:e.target.value})} placeholder="08012345678" className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
                <label className="text-sm font-medium">Date of Birth *
                  <input type="date" value={addForm.dob} onChange={e=>setAddForm({...addForm, dob:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
                <label className="text-sm font-medium">Hire Date
                  <input type="date" value={addForm.hireDate} onChange={e=>setAddForm({...addForm, hireDate:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
                <label className="text-sm font-medium">Work Arrangement
                  <select value={addForm.workArrangement} onChange={e=>setAddForm({...addForm, workArrangement:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white">
                    <option value="office">office</option><option value="remote">remote</option><option value="hybrid">hybrid</option><option value="field">field</option><option value="shift">shift</option>
                  </select>
                </label>
                <label className="text-sm font-medium">Employment Type
                  <select value={addForm.employmentType} onChange={e=>setAddForm({...addForm, employmentType:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white">
                    <option value="permanent">permanent</option><option value="contract">contract</option><option value="intern">intern</option>
                  </select>
                </label>
                {renderRoleSelect(addForm.role || '', (v)=> setAddForm({...addForm, role:v}))}
                {renderBranchSelect(addForm.branchId, (v)=> { setAddForm({...addForm, branchId: v, departmentId: ''}); })}
                {renderDeptSelect(addForm.departmentId, (v)=> setAddForm({...addForm, departmentId: v}), addForm.branchId)}
                <label className="text-sm font-medium md:col-span-2">Skills (comma separated)
                  <input value={addForm.skills} onChange={e=>setAddForm({...addForm, skills:e.target.value})} placeholder="React, Node, HRIS" className="w-full mt-1 px-3 py-2.5 rounded-xl border"/>
                </label>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                <div className="font-semibold">Default password: Acronym + MM + YYYY + DD (DOB day)</div>
                <div className="text-slate-600">e.g., JSO12202602 for JSO, Dec 2026, DOB 02 — must change on first login. Email will be used for login with acronym.</div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowAdd(false)} className="flex-1 glass rounded-xl py-2.5 font-semibold">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><Plus size={16}/>{saving ? 'Creating…' : 'Create Employee'}</button>
              </div>
              <p className="text-xs text-slate-500">Created employee appears instantly in People list and Super Admin → Organizations → Employees count.</p>
            </div>
          </div>
        </div>
      )}

      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur" onClick={()=>setShowBulk(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold flex items-center gap-2"><Download size={18}/> Bulk Upload — 300+ Employees (Excel)</h3>
                <p className="text-xs text-slate-500">Excel <b>.xlsx</b> with dropdowns: <b>employment_type</b> (permanent, contract…), <b>department</b> (from API), <b>grade</b> (L1-M3), <b>branch</b>, <b>work_arrangement</b> — or CSV. Max 500/batch, 10mb. Linked: branch → department.</p>
              </div>
              <button onClick={()=>setShowBulk(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={downloadTemplate} className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Download size={16}/> Download Excel Template (with dropdowns)</button>
                <label className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-slate-800">
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleBulkFile} className="hidden" />
                  <Download size={16}/> Choose Excel/CSV
                </label>
                {bulkFile && <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 self-center">{bulkFile.name} • {(bulkFile.size/1024).toFixed(1)} KB • {bulkFile.name.endsWith('.xlsx') ? 'Excel with dropdowns' : 'CSV'}</span>}
              </div>
              {bulkPreview.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">Preview (first 5 of {bulkPreview.length}+ rows)</span>
                    <span className="text-xs bg-white border rounded-full px-2 py-1">{bulkPreview.length} preview</span>
                  </div>
                  <div className="overflow-auto max-h-[200px]">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50"><tr>{Object.keys(bulkPreview[0]||{}).map(k=> <th key={k} className="text-left p-2 font-mono">{k}</th>)}</tr></thead>
                      <tbody className="divide-y">{bulkPreview.map((r,i)=> <tr key={i} className="hover:bg-slate-50">{Object.values(r).map((v:any,j)=> <td key={j} className="p-2 truncate max-w-[120px]">{String(v).slice(0,30)}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}
              {bulkResult && (
                <div className={`rounded-xl p-4 ${bulkResult.failed ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <div className="font-bold flex items-center gap-2">{bulkResult.failed ? <AlertTriangle size={16} className="text-amber-600"/> : <Check size={16} className="text-emerald-600"/>} Bulk Result — {bulkResult.success}/{bulkResult.total} succeeded</div>
                  <div className="text-sm mt-1">Success: {bulkResult.success} • Failed: {bulkResult.failed} • See Super Admin → Organizations for updated count</div>
                  {bulkResult.errors?.length > 0 && <div className="mt-2 max-h-[120px] overflow-auto bg-white rounded border p-2 text-xs">{bulkResult.errors.slice(0,5).map((e:any)=> <div key={e.index} className="text-red-600">Row {e.index+1}: {e.error}</div>)}{bulkResult.errors.length>5 && <div className="text-slate-500">+{bulkResult.errors.length-5} more</div>}</div>}
                  <div className="mt-2 text-xs">{bulkResult.results?.slice(0,3).map((r:any)=> <span key={r.id} className="bg-white border rounded-full px-2 py-1 mr-1">{r.employeeCode}</span>)}</div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={()=>setShowBulk(false)} className="flex-1 glass rounded-xl py-2.5 font-semibold">Close</button>
                <button onClick={uploadBulk} disabled={!bulkFile || bulkLoading} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">{bulkLoading ? 'Uploading…' : `Upload ${bulkFile ? 'CSV' : ''} → Create`}</button>
              </div>
              <p className="text-xs text-slate-500">Department/branch by name auto-creates if not found • Skills in quotes "React,Node" • Phone/email optional creates login (Employee@123) • Generic slicing: filter by work_arrangement/grade in People grid</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
