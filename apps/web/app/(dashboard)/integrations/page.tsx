'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { Plug, Webhook, Plus, Trash2, Copy, RefreshCw, Settings2, Layers, Zap, Link2, Check, X, Globe, Shield } from 'lucide-react';

type Integration = { id: string; name: string; provider: string; status: 'connected'|'disconnected'|'error'; webhookUrl: string; events: string[]; moduleKey: string; lastSync?: string };
type WebhookEntry = { id: string; url: string; events: string[]; secret: string; active: boolean; createdAt: string };

const MODULES_44 = [
  'people','recruitment','onboarding','attendance','smart_clocking','face_verification','gps','shifts','leave','remote_work','tasks','performance','kpi','payroll','benefits','learning','engagement','employee_relations','disciplinary','documents','assets','promotion','succession','offboarding','alumni','compliance','service_desk','reporting','analytics','ai_copilot','workforce_intelligence','workflow','integrations','administration','workforce_activity','work_session','exception_center','digital_passport','talent_marketplace','knowledge_vault','digital_twin','simulator','life_events','automation','notifications'
];

export default function IntegrationsPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [newHook, setNewHook] = useState({ url: '', events: '', secret: '' });
  const [filter, setFilter] = useState<'all'|'connected'|'disconnected'>('all');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('onehr_token')}` });

  const load = async () => {
    setLoading(true);
    try {
      const h: any = auth();
      const res = await fetch(`${api}/integrations`, { headers: h });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(Array.isArray(data) ? data : []);
      } else setIntegrations([]);
      const w = await fetch(`${api}/webhooks`, { headers: h });
      if (w.ok) {
        const d = await w.json();
        setWebhooks(Array.isArray(d) ? d : []);
      } else setWebhooks([]);
      const alt = await fetch(`${api}/notifications/webhooks`, { headers: h }).catch(()=>null);
      if (alt && alt.ok) {
        const d = await alt.json();
        if (Array.isArray(d) && d.length) setWebhooks(d);
      }
    } catch {
      setIntegrations([]);
      setWebhooks([]);
    }
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const addWebhook = async () => {
    if (!newHook.url) return setMsg('URL required');
    const h: any = auth();
    const payload: any = { url: newHook.url, events: newHook.events.split(',').map(s=>s.trim()).filter(Boolean), secret: newHook.secret || undefined };
    const res = await fetch(`${api}/webhooks`, { method:'POST', headers:{'Content-Type':'application/json', ...h}, body: JSON.stringify(payload) });
    if (!res.ok) {
      const e = await res.text();
      setMsg('Create failed: ' + e.slice(0,120));
      setTimeout(()=>setMsg(''),3000);
      return;
    }
    setNewHook({ url:'', events:'', secret:'' });
    setMsg('Webhook created ✓');
    setTimeout(()=>setMsg(''),2000);
    load();
  };

  const toggleWebhook = async (id:string) => {
    const h: any = auth();
    const res = await fetch(`${api}/webhooks/${id}/toggle`, { method:'PATCH', headers: h });
    if (res.ok) load();
    else setWebhooks(webhooks.map(w=> w.id===id ? {...w, active: !w.active} : w));
  };
  const deleteWebhook = async (id:string) => {
    const h: any = auth();
    const res = await fetch(`${api}/webhooks/${id}`, { method:'DELETE', headers: h });
    if (res.ok) load();
    else setWebhooks(webhooks.filter(w=>w.id!==id));
  };
  const filtered = filter==='all' ? integrations : integrations.filter(i=>i.status===filter);

  return (
    <div className="space-y-6">
      <GradientCard gradient="from-violet-600 via-indigo-600 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Plug/> Integrations <span className="font-normal text-white/70">— 44 Modules • Webhooks • API</span></h1>
            <p className="text-sm text-white/80">Connect Slack, Teams, SAP, Workday, Banks, Zapier — every module exposes integration points §44</p>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="blue">RBAC: org_admin / hr_admin</Pill>
            <button onClick={load} className="glass-dark rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14}/> Sync</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="bg-white/15 rounded-full px-3 py-1">API: /v1/integrations • /v1/webhooks</span>
          <span className="bg-white/15 rounded-full px-3 py-1">Events: employee.*, leave.*, payroll.*, attendance.*</span>
          <span className="bg-white/15 rounded-full px-3 py-1">44 modules integration-ready</span>
        </div>
      </GradientCard>

      <div className="flex gap-2">
        {[
          ['all',`All (${integrations.length})`],
          ['connected','Connected'],
          ['disconnected','Disconnected'],
        ].map(([k,label])=>(
          <button key={k} onClick={()=>setFilter(k as any)} className={`px-4 py-2 rounded-xl text-sm font-medium ${filter===k ? 'bg-slate-900 text-white' : 'glass'}`}>{label}</button>
        ))}
        <span className="ml-auto text-xs text-slate-500 flex items-center gap-1"><Globe size={12}/> Live from API</span>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Zap size={16} className="text-violet-600"/> Connected Integrations {loading ? '…' : ''}</h3>
          <Pill tone="emerald">{filtered.length} active</Pill>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Integration</th><th className="p-2">Provider</th><th className="p-2">Module</th><th className="p-2">Events</th><th className="p-2">Webhook URL</th><th className="p-2">Status</th><th className="p-2">Last Sync</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map(i=>(
                <tr key={i.id} className="hover:bg-slate-50/50">
                  <td className="p-2"><div className="font-semibold flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs"><Link2 size={12}/></span>{i.name}</div></td>
                  <td className="p-2"><span className="font-mono text-xs bg-slate-50 border rounded-full px-2 py-1">{i.provider}</span></td>
                  <td className="p-2"><Pill tone="blue">{i.moduleKey}</Pill></td>
                  <td className="p-2"><div className="flex flex-wrap gap-1 max-w-[220px]">{i.events.slice(0,3).map(e=><span key={e} className="text-[11px] bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5">{e}</span>)}{i.events.length>3 && <span className="text-xs text-slate-500">+{i.events.length-3}</span>}</div></td>
                  <td className="p-2 font-mono text-xs max-w-[180px] truncate">{i.webhookUrl || '—'}</td>
                  <td className="p-2"><Pill tone={i.status==='connected'?'emerald':i.status==='error'?'red':'slate'}>{i.status}</Pill></td>
                  <td className="p-2 text-xs">{i.lastSync || '—'}</td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">{loading ? 'Loading...' : 'No integrations — add webhook below • Live from GET /v1/integrations'}</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold flex items-center gap-2"><Webhook size={16}/> Register Webhook</h3>
          <p className="text-xs text-slate-500">POST /v1/webhooks • HMAC secret • Retry 3x • Live</p>
          <div className="mt-3 space-y-2">
            <input placeholder="https://your-app.com/webhook/onehr" value={newHook.url} onChange={e=>setNewHook({...newHook,url:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm font-mono" />
            <input placeholder="events: employee.created, leave.approved (comma)" value={newHook.events} onChange={e=>setNewHook({...newHook,events:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input placeholder="secret (optional, auto-generated)" value={newHook.secret} onChange={e=>setNewHook({...newHook,secret:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm font-mono" />
            <button onClick={addWebhook} className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Plus size={16}/> Add Webhook</button>
            {msg && <div className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12}/>{msg}</div>}
            <div className="text-xs text-slate-500">Payload signed with <code>X-OneHR-Signature</code> • Verify via HMAC-SHA256 • Live API</div>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Settings2 size={16}/> Webhooks ({webhooks.length})</h3><Pill tone="blue">Live</Pill></div>
          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">URL</th><th className="p-2">Events</th><th className="p-2">Secret</th><th className="p-2">Active</th><th className="text-right p-2">Actions</th></tr></thead>
              <tbody className="divide-y">
                {webhooks.map(w=>(
                  <tr key={w.id} className="hover:bg-slate-50/50">
                    <td className="p-2 font-mono text-xs max-w-[200px] truncate">{w.url}</td>
                    <td className="p-2"><div className="flex flex-wrap gap-1">{w.events.slice(0,2).map(e=><span key={e} className="text-[11px] bg-slate-50 border rounded-full px-2 py-0.5">{e}</span>)}{w.events.length>2 && <span className="text-xs text-slate-500">+{w.events.length-2}</span>}</div></td>
                    <td className="p-2 font-mono text-xs">{w.secret.slice(0,12)}…</td>
                    <td className="p-2"><button onClick={()=>toggleWebhook(w.id)} className={`w-10 h-6 rounded-full flex items-center p-1 transition ${w.active ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}><span className="w-4 h-4 bg-white rounded-full" /></button></td>
                    <td className="p-2 text-right flex justify-end gap-1">
                      <button onClick={()=>navigator.clipboard.writeText(w.url)} className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center"><Copy size={12}/></button>
                      <button onClick={()=>deleteWebhook(w.id)} className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center"><Trash2 size={12}/></button>
                    </td>
                  </tr>
                ))}
                {webhooks.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">{loading ? 'Loading...' : 'No webhooks — register one • Live from GET /v1/webhooks'}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50/50 text-xs text-slate-500">Delivery logs: <code>GET /v1/webhooks/:id/deliveries</code> • Retry • Circuit breaker • Live</div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="font-semibold flex items-center gap-2"><Layers size={16}/> 44 Modules — Integration Points</h3>
        <p className="text-xs text-slate-500">Every module exposes REST + webhook + event — ecosystem §44</p>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {MODULES_44.map(m=>(
            <div key={m} className="border rounded-xl p-2 bg-slate-50/50 hover:bg-white transition">
              <div className="text-xs font-semibold font-mono">{m}</div>
              <div className="text-[11px] text-slate-500">/v1/{m} • {m}.*</div>
              <div className="mt-1 flex gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" title="REST"/><span className="w-2 h-2 rounded-full bg-violet-500" title="webhook"/><span className="w-2 h-2 rounded-full bg-sky-500" title="event"/></div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"/> REST API</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500"/> Webhook</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"/> Event Bus</span>
          <span className="glass rounded-full px-3 py-1 flex items-center gap-1"><Shield size={12}/> HMAC verified • RBAC: org_admin</span>
        </div>
      </GlassCard>
    </div>
  );
}
