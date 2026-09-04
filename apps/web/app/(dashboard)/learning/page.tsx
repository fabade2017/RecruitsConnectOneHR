'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { GraduationCap, BookOpen, Award, Users, Plus, RefreshCw, Play, Clock, Search, CheckCircle } from 'lucide-react';

export default function LearningPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', category: 'Compliance', description: '', duration: 2 });
  const [enrollForm, setEnrollForm] = useState({ courseId: '', employeeId: '' });
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/learning/courses`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setCourses(Array.isArray(d) ? d : d.data || []))
      .catch(() => setCourses([]));
  };
  useEffect(load, [api]);

  const createCourse = async () => {
    if (!form.title) return alert('Title required');
    if (!form.category) return alert('Category required');
    setLoading(true);
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/learning/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ title: form.title, category: form.category, description: form.description, duration: Number(form.duration) }),
    });
    if (!res.ok) {
      const e = await res.text();
      setLoading(false);
      return alert('Create failed: ' + e.slice(0, 200));
    }
    setForm({ title: '', category: 'Compliance', description: '', duration: 2 });
    setLoading(false);
    load();
  };

  const enroll = async () => {
    if (!enrollForm.courseId) return alert('Select course');
    let eid = enrollForm.employeeId;
    const t = localStorage.getItem('onehr_token');
    if (!eid) {
      // auto-resolve own employeeId via /employees?limit=1 or /auth/me
      try {
        const me = await fetch(`${api}/auth/me`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json());
        eid = me.employee?.id || me.employeeId || '';
      } catch {}
      if (!eid) {
        const emps = await fetch(`${api}/employees?limit=1`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).catch(() => []);
        eid = Array.isArray(emps) ? emps[0]?.id : emps.data?.[0]?.id || '';
      }
      if (!eid) return alert('No employee found — provide Employee ID');
    }
    const res = await fetch(`${api}/learning/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ courseId: enrollForm.courseId, employeeId: eid }),
    });
    if (!res.ok) return alert('Enroll failed: ' + (await res.text()).slice(0, 200));
    setEnrollForm({ courseId: '', employeeId: '' });
    alert('Enrolled ✓');
    // load enrollments for that employee
    fetch(`${api}/learning/enrollments/${eid}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => setEnrollments(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  };

  const viewEnrollments = async (courseId?: string) => {
    const t = localStorage.getItem('onehr_token');
    // if employeeId provided in form, show that; else try own
    let eid = enrollForm.employeeId;
    if (!eid) {
      try {
        const me = await fetch(`${api}/auth/me`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json());
        eid = me.employee?.id || '';
      } catch {}
    }
    if (!eid) return alert('Provide Employee ID to view enrollments');
    const res = await fetch(`${api}/learning/enrollments/${eid}`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return alert('Fetch failed');
    const d = await res.json();
    setEnrollments(Array.isArray(d) ? d : d.data || []);
  };

  const filtered = courses.filter((c: any) => !filter || c.title.toLowerCase().includes(filter.toLowerCase()) || c.category.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="text-violet-600" /> Learning <span className="text-slate-500 font-normal">— LMS §22</span></h1>
          <p className="text-sm text-slate-500">Courses → Enroll → Progress → Certification → Compliance</p>
        </div>
        <button onClick={load} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Courses" value={String(courses.length)} sub="GET /v1/learning/courses" icon={BookOpen} accent="from-violet-500 to-purple-600" />
        <StatCard title="Enrollments" value={String(enrollments.length || courses.reduce((a, c) => a + (c.enrollments?.length || 0), 0))} sub="Active learners" icon={Users} accent="from-sky-500 to-blue-600" />
        <StatCard title="Completion" value={enrollments.length ? Math.round(enrollments.filter((e: any) => e.progress === 100).length / Math.max(1, enrollments.length) * 100) + '%' : '—'} sub="Target 85%" icon={Award} accent="from-emerald-500 to-teal-600" />
        <StatCard title="Hours" value={String(courses.reduce((a, c) => a + (Number(c.duration) || 0), 0))} sub="Total content" icon={Clock} accent="from-amber-500 to-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Plus size={16} /> Create Course</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Title e.g. NDPA Compliance 101" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="Compliance">Compliance</option>
              <option value="Leadership">Leadership</option>
              <option value="Technical">Technical</option>
              <option value="Soft Skills">Soft Skills</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Safety">Safety</option>
            </select>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm h-20" />
            <label className="text-xs space-y-1 block"><span className="text-slate-500">Duration (hours)</span><input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2 text-sm" /></label>
            <button onClick={createCourse} disabled={loading} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2">{loading ? 'Creating...' : 'Create Course'}</button>
            <p className="text-xs text-slate-500">POST /v1/learning/courses • RBAC: hr_admin / org_admin</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Play size={16} /> Enroll</h3>
          <div className="mt-3 space-y-3">
            <select value={enrollForm.courseId} onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="">Select course</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title} — {c.category}</option>)}
            </select>
            <input placeholder="Employee ID (auto if empty)" value={enrollForm.employeeId} onChange={(e) => setEnrollForm({ ...enrollForm, employeeId: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <button onClick={enroll} className="w-full bg-violet-600 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2"><Play size={16} /> Enroll</button>
            <button onClick={() => viewEnrollments()} className="w-full glass rounded-xl py-2 text-sm flex items-center justify-center gap-2"><Search size={14} /> View My Enrollments</button>
            <p className="text-xs text-slate-500">POST /v1/learning/enroll • GET /v1/learning/enrollments/:employeeId</p>
          </div>
        </GlassCard>

        <GradientCard gradient="from-violet-600 via-indigo-600 to-violet-700">
          <h3 className="font-semibold flex items-center gap-2"><Award size={16} /> Learning Journey</h3>
          <p className="text-sm text-white/90 mt-2">Mandatory → Enrolled → In Progress → Completed → Certified. Overdue → flagged in HR Risk Engine.</p>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between bg-white/20 rounded-xl px-3 py-2"><span>ENROLLED</span><span className="bg-white text-violet-700 rounded-full px-2 py-0.5">Start</span></div>
            <div className="flex items-center justify-between bg-white/20 rounded-xl px-3 py-2"><span>IN_PROGRESS 60%</span><Play size={12} /></div>
            <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 text-violet-700"><span>COMPLETED 100%</span><CheckCircle size={14} className="text-emerald-600" /></div>
          </div>
        </GradientCard>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Search size={16} /> Filter Courses</h3>
          <Pill tone="blue">{filtered.length} courses</Pill>
        </div>
        <input placeholder="Search title or category" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm mt-3" />
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><BookOpen size={16} /> Courses Registry</h3><Pill tone="blue">{filtered.length} total</Pill></div>
        <div className="overflow-auto max-h-[380px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Title</th><th className="p-2">Category</th><th className="p-2">Duration</th><th className="p-2">Enrolled</th><th className="p-2">Status</th><th className="text-right p-2">Action</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="p-2 font-medium">{c.title}</td>
                  <td className="p-2 text-xs"><Pill tone="slate">{c.category}</Pill></td>
                  <td className="p-2 text-center text-xs">{c.duration}h</td>
                  <td className="p-2 text-center text-xs">{c.enrollments?.length ?? 0}</td>
                  <td className="p-2"><Pill tone={c.status === 'ACTIVE' ? 'emerald' : 'amber'}>{c.status || 'ACTIVE'}</Pill></td>
                  <td className="p-2 text-right"><button onClick={() => setEnrollForm({ ...enrollForm, courseId: c.id })} className="text-xs bg-slate-900 text-white rounded-full px-3 py-1">Enroll</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No courses — create one (HR Admin)</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {enrollments.length > 0 && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Users size={16} /> My Enrollments</h3><Pill tone="emerald">{enrollments.length} courses</Pill></div>
          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Course</th><th className="p-2">Progress</th><th className="p-2">Status</th><th className="p-2">Completed</th></tr></thead>
              <tbody className="divide-y">
                {enrollments.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="p-2 font-medium">{e.course?.title || e.courseId.slice(0, 8)}</td>
                    <td className="p-2"><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-violet-600 h-2 rounded-full" style={{ width: `${e.progress || 0}%` }} /></div><span className="text-xs">{e.progress || 0}%</span></td>
                    <td className="p-2"><Pill tone={e.status === 'COMPLETED' ? 'emerald' : e.status === 'ENROLLED' ? 'blue' : 'amber'}>{e.status}</Pill></td>
                    <td className="p-2 text-xs">{e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
