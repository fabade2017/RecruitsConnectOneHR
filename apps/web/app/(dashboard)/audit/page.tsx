'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { StatCard } from '../../../components/ui/StatCard';
import { ShieldCheck, Clock, Activity, Users, Search, Download, RefreshCw, Eye, Filter, Timer, Globe, FileText } from 'lucide-react';

type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  user?: { email?: string; role?: string };
  organizationId: string;
  organization?: { acronym?: string; name?: string };
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Log | null>(null);
  const [loading, setLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

  const load = () => {
    const t = localStorage.getItem('onehr_token');
    if (!t) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (action) params.set('action', action);
    if (entityType) params.set('entityType', entityType);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', String(page));
    params.set('limit', '20');
    fetch(`${api}/audit-logs?${params.toString()}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setLogs(d);
        else if (d.data) {
          setLogs(d.data);
          setMeta(d.meta);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch(`${api}/audit-logs/stats`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(setStats).catch(() => {});
  };

  useEffect(load, [api, page, search, action, entityType, from, to]);

  const exportCsv = async () => {
    const t = localStorage.getItem('onehr_token');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (action) params.set('action', action);
    if (entityType) params.set('entityType', entityType);
    const res = await fetch(`${api}/audit-logs/export?${params.toString()}`, { headers: { Authorization: `Bearer ${t}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <GradientCard gradient="from-slate-900 via-slate-800 to-indigo-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs"><ShieldCheck size={12}/> AUDIT LOG • IMMUTABLE • APPEND-ONLY</div>
            <h1 className="text-2xl md:text-3xl font-bold mt-2 flex items-center gap-2"><FileText /> Audit Trail <span className="text-white/60 text-lg font-normal">— Full Transparency</span></h1>
            <p className="text-white/70 text-sm mt-1">Every POST/PATCH/PUT/DELETE + login • Who • What • When • Where (IP) • How long • Before/After • RBAC scoped • Retention 7y</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="glass-dark rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
            <button onClick={exportCsv} className="bg-white text-slate-900 rounded-xl px-3 py-2 text-sm font-semibold flex items-center gap-2"><Download size={14}/> Export CSV</button>
          </div>
        </div>
      </GradientCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={stats ? String(stats.total) : '—'} sub="All time" icon={Activity} accent="from-slate-900 to-slate-700" />
        <StatCard title="Last 24h" value={stats ? String(stats.last24h) : '—'} sub="Recent activity" icon={Clock} accent="from-emerald-500 to-teal-600" />
        <StatCard title="Last 7d" value={stats ? String(stats.last7d) : '—'} sub="Weekly" icon={Timer} accent="from-amber-500 to-orange-600" />
        <StatCard title="Coverage" value="100%" sub="POST/PATCH/PUT/DELETE" icon={ShieldCheck} accent="from-violet-500 to-purple-600" />
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Filter size={16}/> Filters • Timing • Auditing</h3>
          <Pill tone="blue">{meta?.total ?? logs.length} records</Pill>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-2">
          <div className="relative md:col-span-2">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input placeholder="Search action, entity, user, IP..." value={search} onChange={e=>{setSearch(e.target.value); setPage(1);}} className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm" />
          </div>
          <input placeholder="Action e.g. POST /documents" value={action} onChange={e=>{setAction(e.target.value); setPage(1);}} className="border rounded-xl px-3 py-2 text-sm" />
          <input placeholder="Entity e.g. documents" value={entityType} onChange={e=>{setEntityType(e.target.value); setPage(1);}} className="border rounded-xl px-3 py-2 text-sm" />
          <input type="date" value={from} onChange={e=>{setFrom(e.target.value); setPage(1);}} className="border rounded-xl px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={e=>{setTo(e.target.value); setPage(1);}} className="border rounded-xl px-3 py-2 text-sm" />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <button onClick={()=>{setSearch(''); setAction(''); setEntityType(''); setFrom(''); setTo(''); setPage(1);}} className="glass rounded-full px-3 py-1.5">Clear filters</button>
          <span className="glass rounded-full px-3 py-1.5 flex items-center gap-1"><Globe size={12}/> IP logged</span>
          <span className="glass rounded-full px-3 py-1.5 flex items-center gap-1"><Timer size={12}/> Duration ms</span>
          <span className="glass rounded-full px-3 py-1.5">Status code • User-Agent • Before/After</span>
          <span className="bg-slate-900 text-white rounded-full px-3 py-1.5">API: GET /v1/audit-logs?search=&action=&entityType=&from=&to= • RBAC: audit:read</span>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Clock size={16}/> Audit Trail — Transparent</h3>
          <div className="flex items-center gap-2">
            <Pill tone="blue">{logs.length} events</Pill>
            {meta && <span className="text-xs text-slate-500">Page {meta.page} / {meta.pages} • {meta.total} total</span>}
          </div>
        </div>
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs sticky top-0"><tr><th className="text-left p-2">When</th><th className="text-left p-2">Who</th><th className="text-left p-2">What (Action)</th><th className="p-2">Entity</th><th className="p-2">Timing</th><th className="p-2">Where (IP)</th><th className="text-right p-2">Details</th></tr></thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading audit logs...</td></tr> :
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-2 text-xs">
                      <div className="font-mono">{new Date(log.createdAt).toLocaleString('en-NG', { dateStyle: 'short', timeStyle: 'medium' })}</div>
                      <div className="text-[11px] text-slate-500">{Math.round((Date.now() - new Date(log.createdAt).getTime())/60000)}m ago</div>
                    </td>
                    <td className="p-2 text-xs">
                      <div className="font-medium flex items-center gap-1"><Users size={10}/>{log.user?.email || log.userId?.slice(0,8) || 'system'}</div>
                      <div className="text-[11px] text-slate-500">{log.user?.role || log.userId?.slice(0,8) || ''} • {log.organization?.acronym || log.organizationId.slice(0,8)}</div>
                    </td>
                    <td className="p-2">
                      <div className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-full inline-block">{log.action}</div>
                      <div className="text-[11px] text-slate-500 mt-1">status {log.statusCode || '—'}</div>
                    </td>
                    <td className="p-2 text-center">
                      <Pill tone="slate">{log.entityType}</Pill>
                      <div className="text-[11px] font-mono text-slate-500">{log.entityId?.slice(0,8) || '—'}</div>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${!log.duration ? 'bg-slate-100' : log.duration < 100 ? 'bg-emerald-50 text-emerald-700' : log.duration < 500 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{log.duration ?? '—'}ms</span>
                    </td>
                    <td className="p-2 text-xs font-mono text-center">{log.ip || '—'}<div className="text-[10px] text-slate-400 truncate max-w-[120px]">{log.userAgent?.slice(0,30) || ''}</div></td>
                    <td className="p-2 text-right">
                      <button onClick={()=>setSelected(log)} className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs flex items-center gap-1 ml-auto"><Eye size={12}/> View</button>
                    </td>
                  </tr>
                ))}
              {!loading && logs.length===0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No audit logs — perform a write action (POST/PATCH) to generate trail • Auditing is live</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 flex items-center justify-between text-xs">
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="glass rounded-full px-3 py-1.5 disabled:opacity-50">Prev</button>
            <span className="px-3 py-1.5">Page {page} {meta ? `of ${meta.pages}` : ''}</span>
            <button disabled={meta && page>=meta.pages} onClick={()=>setPage(p=>p+1)} className="glass rounded-full px-3 py-1.5 disabled:opacity-50">Next</button>
          </div>
          <span className="text-slate-500">Immutable • Append-only • Super admin sees all • Others scoped to org • Retention 7y • Timing ms</span>
        </div>
      </GlassCard>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard>
            <h3 className="font-semibold text-sm">Top Actions</h3>
            <div className="mt-2 space-y-1">
              {(stats.byAction || []).map((a:any)=> <div key={a.action} className="flex justify-between text-xs bg-slate-50 rounded-xl px-3 py-2"><span className="font-mono">{a.action}</span><span className="font-bold">{a._count}</span></div>)}
              {(!stats.byAction || stats.byAction.length===0) && <div className="text-xs text-slate-500">No data — perform actions to populate</div>}
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="font-semibold text-sm">Top Entities</h3>
            <div className="mt-2 space-y-1">
              {(stats.byEntity || []).map((e:any)=> <div key={e.entityType} className="flex justify-between text-xs bg-slate-50 rounded-xl px-3 py-2"><span>{e.entityType}</span><span className="font-bold">{e._count}</span></div>)}
            </div>
          </GlassCard>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur" onClick={()=>setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold flex items-center gap-2"><ShieldCheck size={16}/> Audit Detail • {new Date(selected.createdAt).toLocaleString()}</h3>
              <button onClick={()=>setSelected(null)} className="w-8 h-8 rounded-full glass flex items-center justify-center">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">Who</div><div className="font-medium">{selected.user?.email || selected.userId || 'system'} • {selected.user?.role || ''}</div><div className="text-xs text-slate-500">Org: {selected.organization?.name || selected.organizationId}</div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-500">When • Timing</div><div className="font-mono text-xs">{new Date(selected.createdAt).toLocaleString('en-NG')}</div><div className="text-xs">{selected.duration}ms • status {selected.statusCode} • IP {selected.ip || '—'}</div></div>
                <div className="bg-slate-50 rounded-xl p-3 col-span-2"><div className="text-xs text-slate-500">What</div><div className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded-full inline-block">{selected.action}</div><div className="text-xs mt-1">Entity: {selected.entityType} • ID: {selected.entityId || '—'}</div></div>
                <div className="bg-slate-50 rounded-xl p-3 col-span-2"><div className="text-xs text-slate-500">Where • User-Agent</div><div className="text-xs font-mono break-all">{selected.userAgent || '—'}</div><div className="text-xs">IP: {selected.ip || '—'}</div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border rounded-xl overflow-hidden">
                  <div className="p-2 bg-amber-50 border-b text-xs font-semibold">Before (oldValue)</div>
                  <pre className="p-3 text-xs overflow-auto max-h-[300px] bg-slate-50">{selected.oldValue ? JSON.stringify(JSON.parse(selected.oldValue), null, 2) : '— (create)'}</pre>
                </div>
                <div className="border rounded-xl overflow-hidden">
                  <div className="p-2 bg-emerald-50 border-b text-xs font-semibold">After (newValue) • Timing {selected.duration}ms</div>
                  <pre className="p-3 text-xs overflow-auto max-h-[300px] bg-white">{selected.newValue ? JSON.stringify(JSON.parse(selected.newValue), null, 2) : '—'}</pre>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setSelected(null)} className="flex-1 glass rounded-xl py-2.5 text-sm font-semibold">Close</button>
                <button onClick={()=>{ navigator.clipboard.writeText(JSON.stringify(selected, null, 2)); }} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold">Copy JSON</button>
              </div>
              <p className="text-[11px] text-slate-400 text-center">Immutable record • Append-only • Timing + IP + User-Agent • Super admin sees all orgs • Others scoped • GET /v1/audit-logs/:id</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
