'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Briefcase, Users, Plus, RefreshCw, Send, Building2, MapPin, Search, FileText, Eye, Calendar } from 'lucide-react';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ title: '', department: 'HR', location: 'Lagos', type: 'FULL_TIME', description: '', salaryRange: '', requirements: '' });
  const [applyForm, setApplyForm] = useState({ firstName: '', lastName: '', email: '', phone: '', resumeUrl: '', coverLetter: '' });
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/jobs`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setJobs(d);
        else if (Array.isArray(d.data)) setJobs(d.data);
        else if (d.jobs) setJobs(d.jobs);
        else setJobs([]);
      })
      .catch(() => setJobs((prev) => (prev.length ? prev : [])));
  };
  useEffect(load, [api]);

  const create = async () => {
    if (!form.title) return alert('Title required');
    const t = localStorage.getItem('onehr_token');
    const payload = { title: form.title, department: form.department, location: form.location, type: form.type, description: form.description || 'OneHR recruitment §28 — auto eligibility check by grade/skills', salaryRange: form.salaryRange, requirements: form.requirements };
    const res = await fetch(`${api}/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const e = await res.text();
      return alert('Create failed: ' + e.slice(0, 200));
    }
    load();
    setForm({ title: '', department: 'HR', location: 'Lagos', type: 'FULL_TIME', description: '', salaryRange: '', requirements: '' });
  };

  const loadApps = async (id: string) => {
    setSelected(id);
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/jobs/${id}/applications`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) {
      const e = await res.text();
      setApps([]);
      return alert('Load applications failed: ' + e.slice(0, 200));
    }
    const d = await res.json();
    if (Array.isArray(d)) setApps(d);
    else if (Array.isArray(d.data)) setApps(d.data);
    else if (Array.isArray(d.applications)) setApps(d.applications);
    else setApps([]);
  };

  const apply = async () => {
    if (!selected) return alert('Select a job first');
    if (!applyForm.firstName || !applyForm.email) return alert('First name and email required');
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/jobs/${selected}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(applyForm),
    });
    if (!res.ok) {
      const e = await res.text();
      return alert('Apply failed: ' + e.slice(0, 200));
    }
    loadApps(selected);
    load();
    setApplyForm({ firstName: '', lastName: '', email: '', phone: '', resumeUrl: '', coverLetter: '' });
  };

  const display = jobs;
  const filtered = display.filter((j: any) => !filter || j.title.toLowerCase().includes(filter.toLowerCase()) || j.department.toLowerCase().includes(filter.toLowerCase()) || j.status.toLowerCase().includes(filter.toLowerCase()));
  const selectedJob = display.find((j: any) => j.id === selected);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase /> Recruitment <span className="text-slate-500 font-normal">— Internal Job Market §28</span></h1>
          <p className="text-sm text-slate-500">Talent Marketplace §27: internal jobs • projects • mentors — grade/skills auto-check • API: /v1/jobs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
          <span className="hidden md:flex items-center gap-1 glass rounded-xl px-3 py-2 text-xs"><Users size={12} /> {display.length} postings</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Plus size={16} /> Post Job</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Title e.g. Senior HR Manager" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border rounded-xl px-3 py-2 text-sm" />
            </div>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="FULL_TIME">FULL_TIME</option>
              <option value="PART_TIME">PART_TIME</option>
              <option value="CONTRACT">CONTRACT</option>
              <option value="INTERN">INTERN</option>
            </select>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" rows={2} />
            <input placeholder="Salary range e.g. ₦500k - ₦800k" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input placeholder="Requirements (comma separated)" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <button onClick={create} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2"><Plus size={16} />Post Job</button>
            <p className="text-xs text-slate-500">POST /v1/jobs • RBAC recruiter/hr_admin • Live API</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Send size={16} /> Apply to Job</h3>
          {!selected ? (
            <div className="mt-3 text-sm text-slate-500 p-4 bg-slate-50 rounded-xl text-center">Select a job from the list to apply<br /><span className="text-xs">POST /v1/jobs/:id/apply</span></div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="text-xs bg-sky-50 border border-sky-100 rounded-xl px-3 py-2">Applying to: <span className="font-semibold">{selectedJob?.title}</span> • {selectedJob?.department} • {selectedJob?.location}</div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="First name" value={applyForm.firstName} onChange={(e) => setApplyForm({ ...applyForm, firstName: e.target.value })} className="border rounded-xl px-3 py-2 text-sm" />
                <input placeholder="Last name" value={applyForm.lastName} onChange={(e) => setApplyForm({ ...applyForm, lastName: e.target.value })} className="border rounded-xl px-3 py-2 text-sm" />
              </div>
              <input placeholder="Email" value={applyForm.email} onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Phone" value={applyForm.phone} onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Resume URL (https://...)" value={applyForm.resumeUrl} onChange={(e) => setApplyForm({ ...applyForm, resumeUrl: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <textarea placeholder="Cover letter" value={applyForm.coverLetter} onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" rows={2} />
              <button onClick={apply} className="w-full bg-sky-600 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2"><Send size={16} />Submit Application</button>
              <p className="text-xs text-slate-500">POST /v1/jobs/:id/apply • Eligibility auto-checked §28</p>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Search size={16} /> Search & Stats</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Search title / dept / status" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100"><div className="text-xl font-bold text-emerald-700">{display.filter((j: any) => j.status === 'OPEN').length}</div><div className="text-xs text-emerald-700">Open</div></div>
              <div className="bg-slate-50 rounded-xl p-3 text-center"><div className="text-xl font-bold">{display.filter((j: any) => j.status === 'CLOSED').length}</div><div className="text-xs text-slate-500">Closed</div></div>
              <div className="bg-sky-50 rounded-xl p-3 text-center border border-sky-100"><div className="text-xl font-bold text-sky-700">{display.reduce((a: number, j: any) => a + (j.applications?.length || 0), 0)}</div><div className="text-xs text-sky-700">Applicants</div></div>
              <div className="bg-slate-900 text-white rounded-xl p-3 text-center"><div className="text-xl font-bold">{display.length}</div><div className="text-xs text-slate-300">Postings</div></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600"><div className="font-semibold flex items-center gap-1"><FileText size={12} />Talent Marketplace §27</div><p className="mt-1">Employees can apply for internal jobs, join projects, find mentors — eligibility auto-checked (grade, performance, skills, disciplinary)</p></div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Briefcase size={16} /> Job Postings</h3><Pill tone="blue">{filtered.length} jobs</Pill></div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Title</th><th className="p-2">Dept</th><th className="p-2">Location</th><th className="p-2">Type</th><th className="p-2">Salary</th><th className="p-2">Status</th><th className="p-2">Posted</th><th className="text-right p-2">Actions</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map((j: any) => (
                <tr key={j.id} className={`hover:bg-slate-50/50 ${selected === j.id ? 'bg-sky-50/50' : ''}`}>
                  <td className="p-2 font-medium">{j.title}</td>
                  <td className="p-2 text-xs"><span className="flex items-center gap-1"><Building2 size={12} />{j.department}</span></td>
                  <td className="p-2 text-xs"><span className="flex items-center gap-1"><MapPin size={12} />{j.location}</span></td>
                  <td className="p-2 text-xs"><Pill tone="slate">{j.type}</Pill></td>
                  <td className="p-2 text-xs">{j.salaryRange || '—'}</td>
                  <td className="p-2"><Pill tone={j.status === 'OPEN' ? 'emerald' : 'slate'}>{j.status}</Pill></td>
                  <td className="p-2 text-xs">{j.postedAt ? new Date(j.postedAt).toLocaleDateString() : '—'}</td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => loadApps(j.id)} className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${selected === j.id ? 'bg-sky-600 text-white' : 'bg-slate-900 text-white'}`}><Eye size={12} />{j.applications?.length || 0} Apps</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">No jobs — post one (Recruiter/HR)</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 text-xs text-slate-500">GET /v1/jobs • POST /v1/jobs • GET /v1/jobs/:id/applications • POST /v1/jobs/:id/apply • RBAC recruiter/hr_admin/org_admin</div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Users size={16} /> Applications {selectedJob ? `— ${selectedJob.title}` : ''}</h3>
          <Pill tone="blue">{apps.length} candidates</Pill>
        </div>
        {!selected ? (
          <div className="p-8 text-center text-slate-500 text-sm">Select a job to view applications<br /><span className="text-xs">GET /v1/jobs/:id/applications</span></div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Candidate</th><th className="p-2">Email</th><th className="p-2">Phone</th><th className="p-2">Resume</th><th className="p-2">Status</th><th className="p-2">Applied</th></tr></thead>
              <tbody className="divide-y">
                {apps.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="p-2 font-medium">{a.firstName} {a.lastName}</td>
                    <td className="p-2 text-xs">{a.email}</td>
                    <td className="p-2 text-xs">{a.phone || '—'}</td>
                    <td className="p-2 text-xs">{a.resumeUrl ? <a href={a.resumeUrl} target="_blank" className="text-sky-600 underline">Link</a> : '—'}</td>
                    <td className="p-2"><Pill tone={a.status === 'NEW' ? 'blue' : a.status === 'REVIEWING' ? 'amber' : a.status === 'HIRED' ? 'emerald' : 'slate'}>{a.status}</Pill></td>
                    <td className="p-2 text-xs flex items-center gap-1"><Calendar size={12} />{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
                {apps.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No applications yet — share the posting or apply above</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-3 bg-slate-50/50 text-xs text-slate-500">Internal mobility §27 — auto eligibility by grade/skills • POST /v1/jobs/:id/apply creates JobApplicationMerged</div>
      </GlassCard>
    </div>
  );
}
