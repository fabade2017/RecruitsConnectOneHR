'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { FileText, Upload, ShieldCheck, Download, Eye, AlertCircle, Building2, Users, Filter } from 'lucide-react';

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({ type: 'ID_PROOF', title: '', scope: 'employee' as 'employee' | 'organization', employeeId: '' });
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'employee' | 'organization'>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    const params = new URLSearchParams();
    if (employeeFilter) params.set('employee_id', employeeFilter);
    if (departmentFilter) params.set('department_id', departmentFilter);
    if (branchFilter) params.set('branch_id', branchFilter);
    if (search) params.set('search', search);
    if (scopeFilter !== 'all') params.set('scope', scopeFilter);
    if (filter && ['ID_PROOF','CONTRACT','CERTIFICATE','PAYSLIP','POLICY','OTHER'].includes(filter)) params.set('type', filter);
    else if (filter && ['pending','verified','rejected'].includes(filter)) params.set('status', filter);
    const url = `${api}/documents${params.toString() ? `?${params.toString()}` : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setDocs(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  };

  const loadEmployees = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/employees?limit=50`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => setEmployees(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
    fetch(`${api}/departments`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => setDepartments(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
    fetch(`${api}/branches`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => setBranches(Array.isArray(d) ? d : d.data || d.branches || []))
      .catch(() => {});
  };

  useEffect(load, [api, employeeFilter, departmentFilter, branchFilter, search, scopeFilter, filter]);
  useEffect(loadEmployees, [api]);

  const upload = async () => {
    if (!form.title) return alert('Title required');
    if (!file) return alert('Select a file');
    if (form.scope === 'employee' && !form.employeeId) return alert('Select employee for employee document');
    const t = localStorage.getItem('onehr_token');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title);
    fd.append('type', form.type);
    if (form.scope === 'employee' && form.employeeId) fd.append('employeeId', form.employeeId);
    // organization docs have no employeeId -> attached to org
    const res = await fetch(`${api}/documents`, { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd });
    if (!res.ok) {
      const e = await res.text();
      return alert('Upload failed: ' + e.slice(0, 200));
    }
    setForm({ type: 'ID_PROOF', title: '', scope: 'employee', employeeId: '' });
    setFile(null);
    (document.getElementById('doc-file') as HTMLInputElement).value = '';
    load();
  };

  const verify = async (id:string) => {
    const t = localStorage.getItem('onehr_token');
    await fetch(`${api}/documents/${id}/verify`, { method: 'PATCH', headers:{Authorization:`Bearer ${t}`} });
    load();
  };

  const view = async (doc: any) => {
    const t = localStorage.getItem('onehr_token');
    try {
      const res = await fetch(`${api}/documents/${doc.id}/download`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      const url = data.url || data.fileUrl || data.s3Key || doc.s3Key || doc.fileUrl;
      setViewDoc(doc);
      setViewUrl(url);
    } catch {
      setViewDoc(doc);
      setViewUrl(doc.s3Key || doc.fileUrl || null);
    }
  };

  const download = async (doc: any) => {
    const t = localStorage.getItem('onehr_token');
    try {
      const res = await fetch(`${api}/documents/${doc.id}/download`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      const url = data.url || doc.fileUrl || doc.s3Key;
      if (url && url.startsWith('http')) window.open(url, '_blank');
      else window.open(`${api}/documents/${doc.id}/download`, '_blank');
    } catch {
      window.open(doc.fileUrl || doc.s3Key || '#', '_blank');
    }
  };

  const getAttachedLabel = (d: any) => {
    if (d.employeeId && d.employee) return `${d.employee.employeeCode || d.employeeId.slice(0,8)} • ${d.employee.jobTitle || ''}`.trim();
    if (d.employeeId) {
      const emp = employees.find(e => e.id === d.employeeId);
      return emp ? `${emp.employeeCode} • ${emp.jobTitle || ''}`.trim() : `Employee ${d.employeeId.slice(0,8)}`;
    }
    return 'Organization';
  };

  const getDepartmentLabel = (d: any) => {
    if (d.employee?.department?.name) return d.employee.department.name;
    if (d.employee?.departmentId) {
      const dept = departments.find(x => x.id === d.employee.departmentId);
      return dept?.name || d.employee.departmentId.slice(0,8);
    }
    if (d.employeeId) {
      const emp = employees.find(e => e.id === d.employeeId);
      if (emp?.department?.name) return emp.department.name;
      if (emp?.department) return emp.department;
    }
    return '—';
  };

  const getBranchLabel = (d: any) => {
    if (d.employee?.branch?.name) return d.employee.branch.name;
    if (d.employee?.branchId) {
      const b = branches.find(x => x.id === d.employee.branchId);
      return b?.name || d.employee.branchId.slice(0,8);
    }
    return '—';
  };

  // Server already filters by search/scope/department/branch/type, but keep client fallback for instant
  const filtered = docs.filter((d:any)=> {
    if (filter && d.type !== filter && d.verificationStatus !== filter) return false;
    if (scopeFilter === 'employee' && !d.employeeId) return false;
    if (scopeFilter === 'organization' && d.employeeId) return false;
    // Client-side search fallback (if API not yet filtered or offline)
    if (search) {
      const term = search.toLowerCase();
      const hay = `${d.title || ''} ${d.type || ''} ${d.s3Key || ''} ${getAttachedLabel(d)} ${getDepartmentLabel(d)} ${getBranchLabel(d)}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });

  const orgDocs = docs.filter(d => !d.employeeId).length;
  const empDocs = docs.filter(d => !!d.employeeId).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText/> Documents <span className="text-slate-500 font-normal">— S3 Vault §18</span></h1>
        <p className="text-sm text-slate-500">Organization vs Employee attached • Upload → S3 → Verification (pending/verified/rejected) • Auto drives Onboarding §24</p>
        <p className="text-xs text-slate-400 mt-1">Organization docs: policies/handbooks (visible to all) • Employee docs: ID, contract, certificate, payslip (per hire)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Upload size={16}/> Upload Document</h3>
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, scope: 'employee' })} className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 ${form.scope === 'employee' ? 'bg-slate-900 text-white' : 'glass'}`}><Users size={14}/> Employee</button>
              <button onClick={() => setForm({ ...form, scope: 'organization' })} className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 ${form.scope === 'organization' ? 'bg-slate-900 text-white' : 'glass'}`}><Building2 size={14}/> Organization</button>
            </div>
            <select value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
              {form.scope === 'organization' ? (
                <>
                  <option value="POLICY">Policy</option>
                  <option value="OTHER">Other</option>
                  <option value="CERTIFICATE">Certificate</option>
                </>
              ) : (
                <>
                  <option value="ID_PROOF">ID Proof</option>
                  <option value="CONTRACT">Contract (Offer & E-Sign)</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="PAYSLIP">Payslip</option>
                  <option value="POLICY">Policy</option>
                  <option value="OTHER">Other</option>
                </>
              )}
            </select>
            {form.scope === 'employee' && (
              <select value={form.employeeId} onChange={e=>setForm({...form, employeeId:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
                <option value="">Select employee *</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employeeCode} • {emp.jobTitle || ''} • {emp.department?.name || ''}</option>)}
              </select>
            )}
            {form.scope === 'organization' && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-2 text-xs text-sky-700">Organization doc — visible to all • e.g., handbook, policy, compliance</div>
            )}
            <input placeholder="Title e.g. Passport Copy" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input id="doc-file" type="file" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="w-full border rounded-xl px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-full file:bg-slate-900 file:text-white file:text-xs" />
            {file && <p className="text-xs text-slate-500">Selected: {file.name} ({(file.size/1024).toFixed(1)} KB) → {form.scope === 'employee' ? 'Employee' : 'Organization'}</p>}
            <button onClick={upload} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2"><Upload size={16}/>Upload to {form.scope === 'employee' ? 'Employee' : 'Organization'}</button>
            <p className="text-xs text-slate-500">POST /v1/documents (multipart) • {form.scope} • Triggers onboarding auto-verify for employee docs</p>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold flex items-center gap-2"><ShieldCheck size={16}/> Verification Overview</h3>
          <div className="mt-3 grid grid-cols-4 gap-3">
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100"><div className="text-xl font-bold text-amber-700">{docs.filter((d:any)=>d.verificationStatus==='pending' || d.status==='pending').length}</div><div className="text-xs text-amber-700">Pending</div></div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100"><div className="text-xl font-bold text-emerald-700">{docs.filter((d:any)=>d.verificationStatus==='verified' || d.status==='verified').length}</div><div className="text-xs text-emerald-700">Verified</div></div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border"><div className="text-xl font-bold">{orgDocs}</div><div className="text-xs text-slate-600">Org docs</div></div>
            <div className="bg-sky-50 rounded-xl p-3 text-center border border-sky-100"><div className="text-xl font-bold text-sky-700">{empDocs}</div><div className="text-xs text-sky-700">Employee</div></div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="relative">
              <input placeholder="Search by Employee (code/name), Organisation, Department, Title, Type..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm" />
              <Filter size={14} className="absolute left-3 top-2.5 text-slate-400" />
              {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-2 text-xs text-slate-500">Clear</button>}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <select value={scopeFilter} onChange={e=>setScopeFilter(e.target.value as any)} className="border rounded-full px-3 py-1.5 bg-white">
                <option value="all">All scopes (Org + Employee)</option>
                <option value="organization">🏢 Organization only</option>
                <option value="employee">👤 Employee only</option>
              </select>
              <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="border rounded-full px-3 py-1.5 bg-white">
                <option value="">All types/status</option>
                <option value="ID_PROOF">ID_PROOF</option>
                <option value="CONTRACT">CONTRACT</option>
                <option value="CERTIFICATE">CERTIFICATE</option>
                <option value="pending">pending</option>
                <option value="verified">verified</option>
              </select>
              <select value={employeeFilter} onChange={e=>setEmployeeFilter(e.target.value)} className="border rounded-full px-3 py-1.5 bg-white max-w-[140px]">
                <option value="">All employees</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employeeCode}</option>)}
              </select>
              <select value={departmentFilter} onChange={e=>setDepartmentFilter(e.target.value)} className="border rounded-full px-3 py-1.5 bg-white max-w-[160px]">
                <option value="">All departments</option>
                {departments.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={branchFilter} onChange={e=>setBranchFilter(e.target.value)} className="border rounded-full px-3 py-1.5 bg-white max-w-[160px]">
                <option value="">All branches</option>
                {branches.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button onClick={()=>{setSearch(''); setDepartmentFilter(''); setBranchFilter(''); setEmployeeFilter(''); setScopeFilter('all'); setFilter('');}} className="glass rounded-full px-3 py-1.5">Clear filters</button>
            </div>
            <p className="text-[11px] text-slate-500">Search: Employee code/name • Department • Branch • Title • Type • S3 key • Server-side via <code>?search=&department_id=&branch_id=&scope=&employee_id=</code></p>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><FileText size={16}/> Documents Vault</h3>
          <div className="flex items-center gap-2"><Pill tone="blue">{filtered.length} files</Pill><span className="text-xs text-slate-500">{orgDocs} org • {empDocs} emp</span></div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Title</th><th className="p-2">Type</th><th className="p-2">Attached To</th><th className="p-2">Department</th><th className="p-2">Branch</th><th className="p-2">File / S3 Key</th><th className="p-2">Uploaded</th><th className="p-2">Status</th><th className="text-right p-2">Actions</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map((d:any)=> (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="p-2 font-medium max-w-[150px] truncate">{d.title || d.name}</td>
                  <td className="p-2 text-xs"><Pill tone="slate">{d.type}</Pill></td>
                  <td className="p-2 text-xs">
                    {d.employeeId ? (
                      <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-100 px-2 py-1 rounded-full"><Users size={10}/>{getAttachedLabel(d)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-full"><Building2 size={10}/> Organization</span>
                    )}
                  </td>
                  <td className="p-2 text-xs text-center">
                    <span className="inline-flex items-center gap-1 bg-slate-50 border px-2 py-1 rounded-full text-[11px]">{getDepartmentLabel(d)}</span>
                  </td>
                  <td className="p-2 text-xs text-center"><span className="text-[11px] text-slate-600">{getBranchLabel(d)}</span></td>
                  <td className="p-2 text-xs font-mono truncate max-w-[120px]">{d.s3Key || d.fileUrl || d.key || '—'}</td>
                  <td className="p-2 text-xs">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="p-2"><Pill tone={d.verificationStatus==='verified'?'emerald':d.verificationStatus==='rejected'?'red':d.verificationStatus==='pending'?'amber':'slate'}>{d.verificationStatus || d.status || 'pending'}</Pill></td>
                  <td className="p-2 text-right">
                    <span className="flex justify-end gap-1">
                      <button onClick={() => view(d)} className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800" title="View"><Eye size={12}/></button>
                      <button onClick={() => download(d)} className="w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-white" title="Download"><Download size={12}/></button>
                      {(d.verificationStatus==='pending' || !d.verificationStatus) && <button onClick={()=>verify(d.id)} className="px-2 py-1 rounded-full bg-emerald-500 text-white text-xs">Verify</button>}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={9} className="p-8 text-center text-slate-500">No documents — try clearing filters or upload one (Organisation or Employee) • Search by Employee/Dept/Branch</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 text-xs text-slate-500">Searchable by Employee (code/name • {employees.length} hires), Organisation (single tenant), Department ({departments.length} depts), Branch ({branches.length} branches) • GET /v1/documents?search=&department_id=&branch_id=&scope=&employee_id= • Org docs: handbook/policy • Employee docs: per hire drives onboarding</div>
      </GlassCard>

      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur" onClick={() => { setViewDoc(null); setViewUrl(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Eye size={16}/> {viewDoc.title} <span className="text-xs text-slate-500">{viewDoc.employeeId ? '• Employee' : '• Organization'}</span></h3>
              <button onClick={() => { setViewDoc(null); setViewUrl(null); }} className="w-8 h-8 rounded-full glass flex items-center justify-center">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Type</div><div className="font-medium"><Pill tone="slate">{viewDoc.type}</Pill></div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Status</div><div className="font-medium"><Pill tone={viewDoc.verificationStatus==='verified'?'emerald':viewDoc.verificationStatus==='rejected'?'red':'amber'}>{viewDoc.verificationStatus || viewDoc.status}</Pill></div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Attached To</div><div className="font-medium text-xs">{viewDoc.employeeId ? <span className="bg-sky-50 text-sky-700 px-2 py-1 rounded-full">{getAttachedLabel(viewDoc)}</span> : <span className="bg-slate-900 text-white px-2 py-1 rounded-full">Organization</span>}</div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">S3 Key / File</div><div className="font-mono text-xs break-all">{viewDoc.s3Key || viewDoc.fileUrl || '—'}</div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Uploaded</div><div className="text-xs">{viewDoc.createdAt ? new Date(viewDoc.createdAt).toLocaleString() : '—'}</div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Onboarding</div><div className="text-xs">{viewDoc.employeeId ? (viewDoc.verificationStatus==='verified' ? '✓ Triggers Documents/Offer auto-verify' : 'Pending → verify to auto-complete onboarding') : 'Org doc — not linked to onboarding'}</div></div>
              </div>
              {viewUrl && (
                <div className="border rounded-xl overflow-hidden bg-slate-50">
                  <div className="p-2 bg-white border-b flex items-center justify-between">
                    <span className="text-xs font-semibold">Preview • S3 signed URL (5m expiry)</span>
                    <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-slate-900 text-white px-3 py-1 rounded-full flex items-center gap-1"><Download size={12}/> Open</a>
                  </div>
                  {viewUrl.startsWith('data:image') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={viewUrl} alt={viewDoc.title} className="w-full max-h-[400px] object-contain bg-white" />
                  ) : viewUrl.startsWith('data:application/pdf') ? (
                    <iframe src={viewUrl} title={viewDoc.title} className="w-full h-[400px] bg-white" />
                  ) : viewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={viewUrl} alt={viewDoc.title} className="w-full max-h-[400px] object-contain bg-white" />
                  ) : viewUrl.startsWith('http') && !viewUrl.includes('s3.mock') ? (
                    <iframe src={viewUrl} title={viewDoc.title} className="w-full h-[400px] bg-white" />
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-500">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3"><FileText size={20}/></div>
                      <div className="font-medium">{viewDoc.title} • {viewDoc.type} • {viewDoc.employeeId ? 'Employee' : 'Organization'}</div>
                      <div className="font-mono text-xs bg-white px-2 py-1 rounded border mt-2 break-all">{viewUrl || viewDoc.s3Key}</div>
                      <div className="text-xs mt-2">S3 key stored • Use Download for signed URL (5m expiry) • {viewDoc.verificationStatus === 'verified' ? '✓ Verified' : 'Pending verification'}</div>
                      <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex mt-3 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs">Open / Download</a>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => viewUrl && window.open(viewUrl, '_blank')} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Eye size={14}/> Open in new tab</button>
                <button onClick={() => { setViewDoc(null); setViewUrl(null); }} className="flex-1 glass rounded-xl py-2.5 text-sm font-semibold">Close</button>
              </div>
              <p className="text-[11px] text-slate-400 text-center">View via GET /v1/documents/:id/download • Attached to {viewDoc.employeeId ? 'Employee ' + (viewDoc.employee?.employeeCode || viewDoc.employeeId.slice(0,8)) : 'Organization'} • S3 SSE encrypted</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
