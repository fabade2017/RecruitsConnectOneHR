'use client';
import { useState, useRef, useEffect } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { Bot, Send, Sparkles, User, Trash2, Lightbulb, MessageSquare, Settings2, Cpu } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string; provider?: string; citations?: any[]; confidence?: number };

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi! I am OneHR AI Copilot — ask about leave balance, payroll, attendance, or policies. Powered by POST /v1/ai/chat §33. Auto-detects Ollama/Groq/OpenAI.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('employee');
  const [provider, setProvider] = useState<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  useEffect(() => { listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [messages]);

  useEffect(() => {
    const t = localStorage.getItem('onehr_token');
    fetch(`${api}/ai/provider`, { headers: { ...(t ? { Authorization: `Bearer ${t}` } : {}) } })
      .then(r => r.json()).then(setProvider).catch(() => setProvider({ provider: 'mock' }));
  }, [api]);

  const send = async () => {
    if (!input.trim()) return;
    const q = input;
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);
    const t = localStorage.getItem('onehr_token');
    const u = localStorage.getItem('onehr_user');
    let effectiveMode = mode;
    try {
      if (u) {
        const role = JSON.parse(u).role;
        if (!mode || mode === 'employee') effectiveMode = role === 'hr_admin' ? 'hr' : role === 'manager' ? 'manager' : role === 'executive' ? 'executive' : 'employee';
      }
    } catch {}
    try {
      let res = await fetch(`${api}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify({ message: q, prompt: q, query: q, mode: effectiveMode }),
      });
      if (!res.ok) {
        res = await fetch(`${api}/ai/copilot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
          body: JSON.stringify({ message: q, prompt: q, mode: effectiveMode }),
        });
      }
      if (res.ok) {
        const d = await res.json();
        const answer = d.answer || d.response || d.message || d.content || d.data || JSON.stringify(d).slice(0, 800);
        const citations = d.citations || [];
        const prov = d.provider || d.model || provider?.provider || 'mock';
        const conf = d.confidence;
        let content = String(answer);
        if (citations.length) content += `\n\nSources: ${citations.map((c:any)=>c.title).join(', ')}`;
        setMessages((m) => [...m, { role: 'assistant', content, provider: prov, citations, confidence: conf }]);
        // refresh provider info if backend switched
        if (d.provider) setProvider((p:any) => ({ ...p, provider: d.provider }));
      } else {
        throw new Error(await res.text());
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `API offline — no mock data. Please check connection and try again. Error: ${e?.message?.slice(0, 200) || 'network'} • Live from POST /v1/ai/chat only.`, provider: 'error' }]);
    }
    setLoading(false);
  };

  const quick = ['What is my leave balance?', 'Explain payroll calculation §31', 'Show attendance exceptions §37', 'Draft a performance review for KPI'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="text-violet-600" /> AI Copilot <span className="text-slate-500 font-normal">— OneHR Intelligence §33</span></h1>
          <p className="text-sm text-slate-500">POST /v1/ai/chat • /v1/ai/copilot • RAG over policies • Provider: {provider?.provider || 'loading...'} {provider?.models?.[provider?.provider] ? `• ${provider.models[provider.provider]}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-xl px-3 py-2 text-xs bg-white">
            <Settings2 size={12}/> <select value={mode} onChange={e=>setMode(e.target.value)} className="bg-transparent outline-none">
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="executive">Executive</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>
          <button onClick={() => setMessages(messages.slice(0, 1))} className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2"><Trash2 size={14} /> Clear</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <GlassCard className="lg:col-span-3 p-0 overflow-hidden flex flex-col h-[540px]">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><MessageSquare size={16} /> Chat</h3>
            <div className="flex items-center gap-2">
              <Pill tone={provider?.provider==='groq'?'emerald':provider?.provider==='ollama'?'violet':provider?.provider==='openai'?'blue':'slate'}>
                <span className="flex items-center gap-1"><Cpu size={12}/>{provider?.provider || 'mock'}</span>
              </Pill>
              <Pill tone="blue">{messages.length} turns</Pill>
            </div>
          </div>
          <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shrink-0"><Bot size={14} /></div>}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-white border shadow-sm rounded-bl-sm'}`}>
                  {m.content}
                  {m.provider && m.role==='assistant' && <div className="text-[11px] text-slate-400 mt-1">via {m.provider}{m.confidence ? ` • conf ${(m.confidence*100).toFixed(0)}%` : ''}{m.citations?.length ? ` • ${m.citations.length} sources` : ''}</div>}
                </div>
                {m.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0"><User size={14} /></div>}
              </div>
            ))}
            {loading && <div className="text-xs text-slate-500 flex items-center gap-2"><span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" /> Copilot is thinking… ({provider?.provider || 'mock'})</div>}
          </div>
          <div className="p-3 border-t bg-white flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={`Ask anything as ${mode} e.g. How to request leave?`} className="flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
            <button onClick={send} disabled={loading} className="bg-violet-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-violet-700"><Send size={14} /> Send</button>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GradientCard gradient="from-violet-600 via-indigo-600 to-violet-700">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles size={16} /> Capabilities</h3>
            <ul className="text-sm text-white/90 mt-2 space-y-1 list-disc list-inside">
              <li>Answer HR policy Qs §34 (RAG)</li>
              <li>Draft reviews & goals</li>
              <li>Summarize reports §32</li>
              <li>Nudge managers (engagement)</li>
            </ul>
            <div className="mt-3 bg-white/10 rounded-xl p-2 text-xs">
              <div className="font-semibold">Active Provider</div>
              <div className="text-white/80">{provider?.provider || 'mock'} • {provider?.models?.[provider?.provider] || 'rule-based fallback'}</div>
              <div className="text-white/60 text-[11px] mt-1">Env: AI_PROVIDER={provider?.env?.AI_PROVIDER || 'auto'} • Groq:{provider?.available?.groq ? '✓' : '—'} Ollama:{provider?.available?.ollama ? '✓' : '—'} OpenAI:{provider?.available?.openai ? '✓' : '—'}</div>
            </div>
          </GradientCard>
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Cpu size={14}/> Providers</h3>
            <div className="mt-2 space-y-2 text-xs">
              <div className={`p-2 rounded-xl border ${provider?.provider==='groq'?'bg-emerald-50 border-emerald-200':'bg-slate-50'}`}><div className="font-bold">Groq</div><div className="text-slate-600">llama-3.1-70b • fast • set GROQ_API_KEY</div></div>
              <div className={`p-2 rounded-xl border ${provider?.provider==='ollama'?'bg-violet-50 border-violet-200':'bg-slate-50'}`}><div className="font-bold">Ollama</div><div className="text-slate-600">llama3.1 local • OLLAMA_URL=http://localhost:11434 • OLLAMA_MODEL</div></div>
              <div className={`p-2 rounded-xl border ${provider?.provider==='opencode'?'bg-sky-50 border-sky-200':'bg-slate-50'}`}><div className="font-bold">OpenCode</div><div className="text-slate-600">muse-spark-1.2 • OPENCODE_API_URL</div></div>
              <div className={`p-2 rounded-xl border ${provider?.provider==='mock'?'bg-amber-50 border-amber-200':'bg-slate-50'}`}><div className="font-bold">Mock</div><div className="text-slate-600">Rule-based RAG fallback • no key needed</div></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Auto fallback: groq → ollama → opencode → openai → mock. Set <code>AI_PROVIDER</code> to force.</p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Lightbulb size={16} /> Quick Prompts</h3>
            <div className="mt-3 space-y-2">
              {quick.map((q) => (
                <button key={q} onClick={() => setInput(q)} className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2">{q}</button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">RBAC: {mode} • audit logged §10 • RAG citations • conf%</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
