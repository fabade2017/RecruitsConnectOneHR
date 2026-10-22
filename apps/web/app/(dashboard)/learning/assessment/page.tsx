'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, CheckCircle, XCircle, ArrowLeft, RefreshCw, Award } from 'lucide-react';
import { GlassCard, Pill } from '../../../../components/ui/GlassCard';

export default function AssessmentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setAnswers({});
    const t = localStorage.getItem('onehr_token');
    if (!t) { window.location.href = '/login'; return; }
    const enrollmentId = new URLSearchParams(window.location.search).get('enrollment') || '';
    if (!enrollmentId) { setError('No enrollment specified. Open this page from Learning → My Enrollments.'); setLoading(false); return; }
    try {
      const res = await fetch(`${api}/learning/enrollments/${enrollmentId}/quiz`, { headers: { Authorization: `Bearer ${t}` } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.message || 'Assessment not available'); setLoading(false); return; }
      setData(body);
    } catch (e: any) {
      setError(e.message || 'Failed to load assessment');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const submit = async () => {
    if (!data) return;
    const questions = data.quiz?.questions || [];
    const unanswered = questions.filter((q: any) => !answers[q.id]);
    if (unanswered.length) {
      if (!confirm(`${unanswered.length} question(s) unanswered. Submit anyway?`)) return;
    }
    const t = localStorage.getItem('onehr_token');
    setSubmitting(true);
    try {
      const res = await fetch(`${api}/learning/enrollments/${data.enrollmentId}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ answers: questions.map((q: any) => ({ questionId: q.id, answer: answers[q.id] || '' })) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { alert('Submit failed: ' + (body.message || JSON.stringify(body)).slice(0, 200)); setSubmitting(false); return; }
      setResult(body);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      alert(e.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading assessment…</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard>
          <h1 className="text-lg font-bold flex items-center gap-2"><GraduationCap className="text-violet-600" /> Assessment</h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <Link href="/learning" className="mt-4 inline-flex items-center gap-2 text-sm bg-slate-900 text-white rounded-xl px-4 py-2"><ArrowLeft size={14} /> Back to Learning</Link>
        </GlassCard>
      </div>
    );
  }

  const quiz = data?.quiz;
  const questions = quiz?.questions || [];
  const answeredCount = questions.filter((q: any) => answers[q.id]).length;

  if (result) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <GlassCard className={result.passed ? 'border-emerald-200' : 'border-amber-200'}>
          <div className="flex items-center gap-3">
            {result.passed ? <CheckCircle className="text-emerald-600" size={34} /> : <XCircle className="text-amber-500" size={34} />}
            <div>
              <h1 className="text-xl font-bold">{result.passed ? 'Assessment passed' : 'Assessment not passed'}</h1>
              <p className="text-sm text-slate-500">{data?.course?.title}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-900 text-white p-4">
              <div className="text-xs opacity-70">Score</div>
              <div className="text-2xl font-bold">{result.score}%</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">Correct</div>
              <div className="text-2xl font-bold">{result.correct} / {result.total}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">Pass mark</div>
              <div className="text-2xl font-bold">{result.passingCount} / {result.total}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {result.passed
              ? 'You met the pass mark. This course is now marked COMPLETED and your certificate is recorded.'
              : `You need at least ${result.passingCount} of ${result.total} correct to pass. Review the manual and try again.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/learning" className="inline-flex items-center gap-2 text-sm bg-slate-900 text-white rounded-xl px-4 py-2"><ArrowLeft size={14} /> Back to Learning</Link>
            {!result.passed && <button onClick={load} className="inline-flex items-center gap-2 text-sm bg-violet-600 text-white rounded-xl px-4 py-2"><RefreshCw size={14} /> Try again</button>}
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 flex items-center gap-2 font-semibold"><Award size={16} /> Answer review</div>
          <div className="divide-y">
            {(result.review || []).map((r: any, i: number) => (
              <div key={r.questionId} className="p-4 text-sm">
                <div className="flex items-start gap-2">
                  {r.isCorrect ? <CheckCircle size={16} className="text-emerald-600 mt-0.5" /> : <XCircle size={16} className="text-red-500 mt-0.5" />}
                  <div className="flex-1">
                    <div className="font-medium">{i + 1}. {r.question}</div>
                    <div className="mt-1 text-xs text-slate-600">Your answer: <b>{r.selected || '—'}</b></div>
                    {!r.isCorrect && <div className="text-xs text-emerald-700">Correct answer: <b>{r.correctAnswer}</b></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="text-violet-600" /> Assessment</h1>
          <p className="text-sm text-slate-500">{data?.course?.title}</p>
        </div>
        <Link href="/learning" className="text-sm glass rounded-xl px-3 py-2 inline-flex items-center gap-2"><ArrowLeft size={14} /> Back</Link>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600">
            <b>{questions.length}</b> objective questions • answer all, then submit.
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="violet">Pass mark {quiz.passingCount}/{quiz.total}</Pill>
            <Pill tone="blue">{answeredCount}/{questions.length} answered</Pill>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {questions.map((q: any, idx: number) => (
          <GlassCard key={q.id}>
            <div className="font-medium text-sm">{idx + 1}. {q.question}</div>
            <div className="mt-3 space-y-2">
              {(q.options || []).map((opt: string, oi: number) => {
                const selected = answers[q.id] === opt;
                return (
                  <label key={oi} className={`flex items-center gap-3 text-sm rounded-xl border px-3 py-2 cursor-pointer transition ${selected ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name={q.id} checked={selected} onChange={() => setAnswers({ ...answers, [q.id]: opt })} />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pb-6">
        <Link href="/learning" className="text-sm glass rounded-xl px-4 py-2">Cancel</Link>
        <button onClick={submit} disabled={submitting} className="text-sm bg-violet-600 text-white rounded-xl px-5 py-2.5 font-semibold disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit answers'}
        </button>
      </div>
    </div>
  );
}
