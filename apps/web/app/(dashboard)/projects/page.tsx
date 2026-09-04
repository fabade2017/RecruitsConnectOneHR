'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { FolderKanban, Plus, RefreshCw, Layers, ListTodo, Search, Building2, Calendar } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/projects`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setProjects(d);
        else if (Array.isArray(d.data)) setProjects(d.data);
        else if (d.projects) setProjects(d.projects);
        else setProjects([]);
      })
      .catch(() => {
        setProjects((prev) => (prev.length ? prev : []));
      });
  };
  useEffect(load, [api]);

  const create = async () => {
    if (!form.name) return alert('Name required');
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ name: form.name, description: form.description, status: form.status }),
    });
    if (!res.ok) {
      const e = await res.text();
      return alert('Create failed: ' + e.slice(0, 200));
    }
    load();
    setForm({ name: '', description: '', status: 'active' });
  };

  const loadTasks = async (id: string) => {
    setSelected(id);
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/projects/${id}/tasks`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) {
      const e = await res.text();
      setTasks([]);
      return alert('Load tasks failed: ' + e.slice(0, 200));
    }
    const d = await res.json();
    if (Array.isArray(d)) setTasks(d);
    else if (Array.isArray(d.data)) setTasks(d.data);
    else if (Array.isArray(d.tasks)) setTasks(d.tasks);
    else setTasks([]);
  };

  const display = projects;
  const filtered = display.filter((p: any) => !filter || p.name.toLowerCase().includes(filter.toLowerCase()) || p.status.toLowerCase().includes(filter.toLowerCase()));

  const selectedProject = display.find((p: any) => p.id === selected);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderKanban /> Projects <span className="text-slate-500 font-normal">— Tasks §34 • Config §42</span></h1>
          <p className="text-sm text-slate-500">Projects → Tasks → Workflow §34 — 44-module ecosystem §44 • API: /v1/projects • RBAC: hr_admin / org_admin</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
          <span className="flex items-center gap-1 glass rounded-xl px-3 py-2 text-xs"><Layers size={12} /> {display.length} projects</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Plus size={16} /> Create Project</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Name e.g. HR Digitization" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" rows={3} />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="active">active</option>
              <option value="planning">planning</option>
              <option value="completed">completed</option>
              <option value="archived">archived</option>
              <option value="on_hold">on_hold</option>
            </select>
            <button onClick={create} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2"><Plus size={16} />Create Project</button>
            <p className="text-xs text-slate-500">POST /v1/projects • name/description/status • Live API</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Search size={16} /> Filter & Stats</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Search name or status" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100"><div className="text-xl font-bold text-emerald-700">{display.filter((p: any) => p.status === 'active').length}</div><div className="text-xs text-emerald-700">Active</div></div>
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100"><div className="text-xl font-bold text-amber-700">{display.filter((p: any) => p.status === 'planning').length}</div><div className="text-xs text-amber-700">Planning</div></div>
              <div className="bg-slate-50 rounded-xl p-3 text-center"><div className="text-xl font-bold">{display.filter((p: any) => p.status === 'completed').length}</div><div className="text-xs text-slate-500">Completed</div></div>
              <div className="bg-slate-900 text-white rounded-xl p-3 text-center"><div className="text-xl font-bold">{display.length}</div><div className="text-xs text-slate-300">Total</div></div>
            </div>
            <p className="text-xs text-slate-500">Workflow §34 • Config §42 • Docs: docs/PRD.md</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Building2 size={16} /> Project Tasks</h3>
          {!selected ? (
            <div className="mt-3 text-sm text-slate-500 p-4 bg-slate-50 rounded-xl text-center">Select a project to view tasks<br /><span className="text-xs">GET /v1/projects/:id/tasks</span></div>
          ) : (
            <div className="mt-3 space-y-2 max-h-[280px] overflow-auto">
              <div className="flex items-center justify-between"><span className="text-sm font-medium">{selectedProject?.name}</span><Pill tone="blue">{tasks.length} tasks</Pill></div>
              {tasks.length === 0 ? (
                <div className="text-sm text-slate-500 p-3 bg-slate-50 rounded-xl text-center">No tasks yet</div>
              ) : (
                tasks.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-sm">
                    <div><div className="font-medium">{t.title}</div><div className="text-xs text-slate-500">{t.assignee?.employeeCode || t.assigneeId?.slice(0, 8) || 'Unassigned'} • {t.priority || 'medium'}</div></div>
                    <Pill tone={t.status === 'done' ? 'emerald' : t.status === 'in_progress' ? 'amber' : t.status === 'todo' ? 'blue' : 'slate'}>{t.status}</Pill>
                  </div>
                ))
              )}
              <button onClick={() => selected && loadTasks(selected)} className="w-full glass rounded-xl py-2 text-xs flex items-center justify-center gap-1"><RefreshCw size={12} /> Reload tasks</button>
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><FolderKanban size={16} /> Projects Registry</h3><Pill tone="blue">{filtered.length} items</Pill></div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Name</th><th className="text-left p-2">Description</th><th className="p-2">Status</th><th className="p-2">Created</th><th className="text-right p-2">Actions</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map((p: any) => (
                <tr key={p.id} className={`hover:bg-slate-50/50 ${selected === p.id ? 'bg-sky-50/50' : ''}`}>
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2 text-xs text-slate-600 max-w-[320px] truncate">{p.description || '—'}</td>
                  <td className="p-2 text-center"><Pill tone={p.status === 'active' ? 'emerald' : p.status === 'planning' ? 'amber' : p.status === 'completed' ? 'blue' : 'slate'}>{p.status}</Pill></td>
                  <td className="p-2 text-xs flex items-center gap-1 justify-center"><Calendar size={12} />{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => loadTasks(p.id)} className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ml-auto ${selected === p.id ? 'bg-sky-600 text-white' : 'bg-slate-900 text-white'}`}><ListTodo size={12} />Tasks</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No projects — create one</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 text-xs text-slate-500">GET /v1/projects • POST /v1/projects (name/description/status) • GET /v1/projects/:id/tasks • RBAC: hr_admin / org_admin • Workflow §34</div>
      </GlassCard>
    </div>
  );
}
