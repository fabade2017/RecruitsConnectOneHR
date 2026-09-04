'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { Heart, MessageCircle, Send, Plus, RefreshCw, Vote, BarChart3 } from 'lucide-react';

export default function EngagementPage() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', questions: '' });
  const [respondForm, setRespondForm] = useState({ surveyId: '', answer: '', score: 5 });
  const [loading, setLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    fetch(`${api}/engagement/surveys`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setSurveys(Array.isArray(d) ? d : d.data || []))
      .catch(() => setSurveys([]));
  };
  useEffect(load, [api]);

  const createSurvey = async () => {
    if (!form.title) return alert('Title required');
    setLoading(true);
    const t = localStorage.getItem('onehr_token');
    const qs = form.questions ? form.questions.split('\n').filter(Boolean) : ['How engaged do you feel?'];
    await fetch(`${api}/engagement/surveys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ title: form.title, description: form.description, questions: qs }),
    });
    setForm({ title: '', description: '', questions: '' });
    setLoading(false);
    load();
  };

  const respond = async () => {
    if (!respondForm.surveyId) return alert('Select survey');
    const t = localStorage.getItem('onehr_token');
    const res = await fetch(`${api}/engagement/surveys/${respondForm.surveyId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ answer: respondForm.answer, score: Number(respondForm.score), response: respondForm.answer }),
    });
    if (!res.ok) return alert('Respond failed');
    setRespondForm({ surveyId: '', answer: '', score: 5 });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="text-pink-500" /> Engagement <span className="text-slate-500 font-normal">— Pulse §23</span></h1>
          <p className="text-sm text-slate-500">Surveys → Anonymous response → eNPS → Action plans → Retention</p>
        </div>
        <button onClick={load} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Surveys" value={String(surveys.length)} sub="GET /v1/engagement/surveys" icon={BarChart3} accent="from-pink-500 to-rose-600" />
        <StatCard title="Response Rate" value={surveys.length ? '74%' : '—'} sub="Target 80%" icon={Vote} accent="from-sky-500 to-blue-600" />
        <StatCard title="eNPS" value={surveys.length ? '+32' : '—'} sub="Health ≥ +30" icon={Heart} accent="from-emerald-500 to-teal-600" />
        <StatCard title="Anonymous" value="ON" sub="Privacy §9" icon={MessageCircle} accent="from-violet-500 to-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Plus size={16} /> Create Survey</h3>
          <div className="mt-3 space-y-3">
            <input placeholder="Title e.g. Q3 Pulse" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <textarea placeholder="Questions (one per line)" value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm h-20" />
            <button onClick={createSurvey} disabled={loading} className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold">{loading ? 'Creating...' : 'Publish Survey'}</button>
            <p className="text-xs text-slate-500">POST /v1/engagement/surveys • RBAC: hr_admin</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Send size={16} /> Respond to Survey</h3>
          <div className="mt-3 space-y-3">
            <select value={respondForm.surveyId} onChange={(e) => setRespondForm({ ...respondForm, surveyId: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm">
              <option value="">Select survey</option>
              {surveys.map((s: any) => <option key={s.id} value={s.id}>{s.title} ({s.status || 'open'})</option>)}
            </select>
            <label className="text-xs space-y-1 block"><span className="text-slate-500">Score (1-10)</span><input type="number" min={1} max={10} value={respondForm.score} onChange={(e) => setRespondForm({ ...respondForm, score: Number(e.target.value) })} className="w-full border rounded-xl px-3 py-2 text-sm" /></label>
            <textarea placeholder="Your feedback (anonymous)" value={respondForm.answer} onChange={(e) => setRespondForm({ ...respondForm, answer: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm h-20" />
            <button onClick={respond} className="w-full bg-pink-600 text-white rounded-xl py-2.5 font-semibold">Submit Response</button>
            <p className="text-xs text-slate-500">POST /v1/engagement/surveys/:id/respond</p>
          </div>
        </GlassCard>

        <GradientCard gradient="from-pink-600 via-rose-600 to-pink-700">
          <h3 className="font-semibold flex items-center gap-2"><Heart size={16} /> Why Engagement Matters</h3>
          <p className="text-sm text-white/90 mt-2">High engagement = -41% absenteeism, +21% productivity. Pulse → AI sentiment → manager nudge.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/20 rounded-xl p-2"><div className="font-bold text-lg">78</div>Engagement</div>
            <div className="bg-white/20 rounded-xl p-2"><div className="font-bold text-lg">+32</div>eNPS</div>
            <div className="bg-white rounded-xl p-2 text-pink-600"><div className="font-bold text-lg">74%</div>Response</div>
          </div>
        </GradientCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><MessageCircle size={16} /> Surveys</h3><Pill tone="blue">{surveys.length} total</Pill></div>
        <div className="overflow-auto max-h-[360px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Title</th><th className="text-left p-2">Description</th><th className="p-2">Questions</th><th className="p-2">Responses</th><th className="p-2">Status</th><th className="text-right p-2">Action</th></tr></thead>
            <tbody className="divide-y">
              {surveys.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-2 font-medium">{s.title}</td>
                  <td className="p-2 text-xs max-w-[200px] truncate">{s.description || '—'}</td>
                  <td className="p-2 text-center text-xs">{Array.isArray(s.questions) ? s.questions.length : s.questions || 1}</td>
                  <td className="p-2 text-center text-xs">{s.responses?.length ?? s.responseCount ?? 0}</td>
                  <td className="p-2"><Pill tone={s.status === 'closed' ? 'slate' : s.status === 'active' ? 'emerald' : 'amber'}>{s.status || 'open'}</Pill></td>
                  <td className="p-2 text-right"><button onClick={() => setRespondForm({ ...respondForm, surveyId: s.id })} className="text-xs bg-slate-900 text-white rounded-full px-3 py-1">Respond</button></td>
                </tr>
              ))}
              {surveys.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No surveys — create one to pulse team</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
