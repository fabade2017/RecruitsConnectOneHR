'use client';
import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '../../../lib/api';
import { GlassCard } from '../../../components/ui/GlassCard';
import { CreditCard, Printer, Search, User, Building2, Eye, FlipHorizontal, Palette, Settings, Save, Sparkles } from 'lucide-react';

type Card = {
  id: string;
  employeeCode: string;
  jobTitle: string;
  grade: string;
  department: string;
  branch: string;
  photoUrl: string;
  qrSecure: string;
  secureToken: string;
  organization: { name: string; acronym: string; logoUrl?: string; watermarkEnabled?: boolean; watermarkOpacity?: number; watermarkText?: string; watermarkPosition?: string; primaryColor?: string; config?: any };
};

const TEMPLATES = [
  { id:'classic', name:'Classic', desc:'Navy header • white body • logo top', color:'#0f172a' },
  { id:'modern', name:'Modern', desc:'Gradient header • rounded • accent', color:'#4f46e5' },
  { id:'minimal', name:'Minimal', desc:'Clean border • subtle • print-friendly', color:'#64748b' },
  { id:'corporate', name:'Corporate', desc:'Bold brand color • watermark prominent', color:'#dc2626' },
] as const;

export default function IdCardsPage() {
  const api = getApiUrl();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Card | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [template, setTemplate] = useState<'classic'|'modern'|'minimal'|'corporate'>('classic');
  const [branding, setBranding] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api}/employees/id-cards?limit=50`, { headers: getAuthHeaders() as any });
      const json = await res.json().catch(() => ({}));
      const list = Array.isArray(json.cards) ? json.cards : Array.isArray(json) ? json : [];
      setCards(list);
      // try to infer branding from first card
      if (list[0]?.organization) setBranding((prev:any)=> prev || list[0].organization);
    } catch {}
    setLoading(false);
  };
  const fetchBranding = async () => {
    try {
      const t = localStorage.getItem('onehr_token');
      const u = localStorage.getItem('onehr_user');
      let orgId = null;
      try { const parsed = u ? JSON.parse(u) : null; orgId = parsed?.org_id || parsed?.organizationId; } catch {}
      if (!orgId && cards[0]?.organization) orgId = null;
      // fallback: try first card org via detail? use stored branding
      const cached = localStorage.getItem('onehr_branding');
      if (cached) try { setBranding(JSON.parse(cached)); } catch {}
      if (orgId) {
        const res = await fetch(`${api}/organizations/${orgId}/branding`, { headers: { Authorization:`Bearer ${t}` } as any });
        if (res.ok) { const b = await res.json(); setBranding(b); }
      }
      // also check card org for template
      const savedTemplate = (()=>{ try{ const c = localStorage.getItem('onehr_idcard_template'); return c as any } catch { return null }})();
      if (savedTemplate && TEMPLATES.some(t=>t.id===savedTemplate)) setTemplate(savedTemplate);
      else if (branding?.config?.idCardTemplate && TEMPLATES.some(t=>t.id===branding.config.idCardTemplate)) setTemplate(branding.config.idCardTemplate);
    } catch {}
  };
  useEffect(() => { fetchCards(); }, []);
  useEffect(() => { if (cards.length) fetchBranding(); }, [cards.length]);

  const filtered = cards.filter(c => !q || c.employeeCode.toLowerCase().includes(q.toLowerCase()) || c.jobTitle?.toLowerCase().includes(q.toLowerCase()));

  const fetchDetail = async (id: string) => {
    try {
      const res = await fetch(`${api}/employees/${id}/id-card`, { headers: getAuthHeaders() as any });
      const json = await res.json().catch(() => null);
      setDetail(json);
    } catch {}
  };
  useEffect(() => { if (selected) fetchDetail(selected.id); }, [selected]);

  const saveTemplate = async () => {
    setSavingConfig(true);
    try {
      const u = localStorage.getItem('onehr_user');
      let orgId = null; try { const parsed = u ? JSON.parse(u) : null; orgId = parsed?.org_id; } catch {}
      if (!orgId) throw new Error('No org');
      const t = localStorage.getItem('onehr_token');
      // Save to org config via branding endpoint (merges)
      const res = await fetch(`${api}/organizations/${orgId}/branding`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${t}` } as any, body: JSON.stringify({ config: { idCardTemplate: template } }) });
      if (!res.ok) throw new Error('Save failed');
      localStorage.setItem('onehr_idcard_template', template);
      alert(`Template ${template} saved for organization — all cards will use it`);
    } catch(e:any){ alert(e.message); } finally { setSavingConfig(false); }
  };

  const printAll = () => window.print();
  const printOne = () => {
    const el = document.getElementById('single-card-print');
    if (!el) return window.print();
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>ID Card ${selected?.employeeCode}</title><style>
      @media print { body{margin:0} .no-print{display:none} }
      body{font-family:system-ui; display:flex; justify-content:center; padding:20px}
      .card{width:340px; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1)}
      .front{padding:16px} .back{padding:16px; background:#f8fafc; border-top:1px dashed #cbd5e1}
      img.photo{width:80px; height:80px; border-radius:12px; object-fit:cover; border:2px solid #0f172a}
      img.qr{width:90px; height:90px}
    </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  const getWatermarkStyle = (org: any) => {
    const enabled = org?.watermarkEnabled ?? branding?.watermarkEnabled ?? false;
    const opacity = org?.watermarkOpacity ?? branding?.watermarkOpacity ?? 0.08;
    const pos = org?.watermarkPosition ?? branding?.watermarkPosition ?? 'center';
    return { enabled, opacity, pos };
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-grid { display: block !important; }
          .card-print { break-inside: avoid; }
          .page-break { break-after: page; }
          @page { size: 8.5in 13in; margin: 10mm; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard size={22}/> ID Cards <span className="text-slate-500 font-normal text-sm">— Secured QR • Foolscap 8-up</span></h1>
          <p className="text-sm text-slate-500">Superadmin/Admin view 8 per foolscap page • Employee sees own • Front/Back print • QR embeds JWT signed payload • Logo + faint watermark</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setShowConfig(!showConfig)} className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Palette size={16}/> Templates</button>
          <button onClick={printAll} className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-800"><Printer size={16}/> Print All (8/page)</button>
        </div>
      </div>

      {showConfig && (
        <GlassCard className="no-print">
          <h3 className="font-bold flex items-center gap-2"><Sparkles size={16}/> Configure ID Cards to Your Taste</h3>
          <p className="text-xs text-slate-500">Logo from Settings → Branding • Watermark faintly behind photo • 4 templates • Saved per organization</p>
          <div className="grid md:grid-cols-4 gap-3 mt-3">
            {TEMPLATES.map(t=> (
              <button key={t.id} onClick={()=>{ setTemplate(t.id as any); localStorage.setItem('onehr_idcard_template', t.id); }} className={`border rounded-2xl p-3 text-left hover:shadow ${template===t.id ? 'border-slate-900 bg-slate-50' : 'bg-white'}`}>
                <div className="h-20 rounded-xl border flex items-center justify-center relative overflow-hidden" style={{ background: t.id==='classic' ? '#0f172a' : t.id==='modern' ? 'linear-gradient(135deg,#4f46e5,#06b6d4)' : t.id==='corporate' ? (branding?.primaryColor || t.color) : '#f8fafc', color: t.id==='minimal' ? '#0f172a' : 'white' }}>
                  {branding?.logoUrl ? <img src={branding.logoUrl} className="w-10 h-10 object-contain bg-white rounded p-1" alt="logo"/> : <Building2 size={20}/>}
                  <span className="absolute bottom-1 right-2 text-[10px] opacity-70">{t.name}</span>
                  { (branding?.watermarkEnabled || t.id==='corporate') && branding?.logoUrl && <img src={branding.logoUrl} className="absolute inset-0 m-auto w-16 h-16 object-contain" style={{ opacity: (branding?.watermarkOpacity || 0.08) }} alt="wm"/>}
                </div>
                <div className="font-semibold text-sm mt-2">{t.name} {template===t.id && '✓'}</div>
                <div className="text-xs text-slate-500">{t.desc}</div>
                <div className="text-[11px] mt-1" style={{ color: t.color }}>● {t.color}</div>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            <span className="text-xs">Current: <b>{template}</b> • Logo: {branding?.logoUrl ? '✓ ' + branding.logoUrl.slice(0,30)+'...' : '— set in Settings → Branding'} • Watermark: {branding?.watermarkEnabled ? `on ${(branding.watermarkOpacity*100).toFixed(0)}% ${branding.watermarkPosition}` : 'off (enable in Settings)'}</span>
            <button onClick={saveTemplate} disabled={savingConfig} className="ml-auto bg-slate-900 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"><Save size={14}/>{savingConfig ? 'Saving…' : 'Save Template for Org'}</button>
            <a href="/settings" className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-1"><Settings size={14}/> Branding Settings</a>
          </div>
        </GlassCard>
      )}

      <GlassCard className="no-print">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search code, job title..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white" />
          </div>
          <span className="bg-sky-100 text-sky-700 rounded-full px-3 py-2 text-sm">{filtered.length} cards</span>
          <span className="hidden md:inline-flex bg-white border rounded-full px-3 py-2 text-xs">Template: <b className="ml-1">{template}</b></span>
        </div>
      </GlassCard>

      {loading ? <div className="text-center p-8 text-slate-500">Loading ID cards…</div> : (
        <div className="print-grid grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((c, idx) => {
            const wm = getWatermarkStyle(c.organization);
            const tpl = template;
            const headerBg = tpl==='classic' ? 'bg-slate-900 text-white' : tpl==='modern' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : tpl==='corporate' ? 'text-white' : 'bg-slate-50 border-b';
            const headerStyle = tpl==='corporate' ? { background: branding?.primaryColor || c.organization.primaryColor || '#0f172a' } : {};
            return (
            <div key={c.id} className={`card-print bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition relative ${idx>0 && idx%8===0 ? 'page-break' : ''}`}>
              {/* Watermark faint logo */}
              {wm.enabled && (c.organization.logoUrl || branding?.logoUrl) && (
                <img src={c.organization.logoUrl || branding.logoUrl} alt="watermark" className="absolute inset-0 m-auto w-28 h-28 object-contain pointer-events-none select-none" style={{ opacity: wm.opacity, transform: wm.pos==='diagonal' ? 'rotate(-25deg)' : undefined }} />
              )}
              {/* Front */}
              <div className="p-4 relative">
                <div className={`flex justify-between items-start -m-4 mb-3 p-3 ${headerBg}`} style={headerStyle}>
                  <div className="flex items-center gap-2">
                    {c.organization.logoUrl || branding?.logoUrl ? <img src={c.organization.logoUrl || branding.logoUrl} className="w-8 h-8 rounded bg-white object-contain border" alt=""/> : <Building2 size={16} className={tpl==='minimal' ? 'text-slate-400' : 'text-white/80'}/>}
                    <div><div className="text-xs font-bold">{c.organization.name}</div><div className={`text-[10px] ${tpl==='minimal' ? 'text-slate-500' : 'opacity-80'}`}>{c.organization.acronym} • {tpl}</div></div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${tpl==='minimal' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>{c.employeeCode}</span>
                </div>
                <div className="flex gap-3 mt-3">
                  <img src={c.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${c.employeeCode}`} className="w-16 h-20 rounded-xl object-cover border bg-slate-100" alt="passport"/>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{c.jobTitle || '—'}</div>
                    <div className="text-xs text-slate-500">{c.department || '—'} {c.branch && `• ${c.branch}`}</div>
                    <div className="text-xs mt-1"><span className="bg-slate-100 px-2 py-0.5 rounded">{c.grade || '—'}</span></div>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-3">
                  <div className="text-[10px] text-slate-500">Secured QR • Scan to verify<br/>Issued {new Date().toLocaleDateString()}</div>
                  <img src={c.qrSecure} className="w-14 h-14 border rounded bg-white" alt="QR"/>
                </div>
                <button onClick={()=>{setSelected(c); setShowBack(false);}} className="mt-3 w-full glass rounded-xl py-1.5 text-xs flex items-center justify-center gap-1 no-print"><Eye size={12}/> View Front/Back</button>
              </div>
              {/* Back (mini for grid) */}
              <div className="bg-slate-50 px-4 py-2 border-t text-[10px] text-slate-600 relative">
                <div>If found return to HR • {c.organization.name} • {c.employeeCode}</div>
                <div className="truncate">Token: {c.secureToken.slice(0,24)}…</div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Individual front/back modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur" onClick={()=>setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><CreditCard size={18}/> {selected.employeeCode} — {showBack ? 'Back' : 'Front'}</h3>
              <div className="flex gap-2">
                <button onClick={()=>setShowBack(!showBack)} className="glass rounded-xl px-3 py-1.5 text-sm flex items-center gap-1"><FlipHorizontal size={14}/>{showBack ? 'Show Front' : 'Show Back'}</button>
                <button onClick={printOne} className="bg-slate-900 text-white rounded-xl px-3 py-1.5 text-sm flex items-center gap-1"><Printer size={14}/>Print</button>
                <button onClick={()=>setSelected(null)} className="glass rounded-xl px-3 py-1.5">✕</button>
              </div>
            </div>
            <div id="single-card-print" className="p-6">
              {(() => {
                const org = detail?.organization || selected.organization;
                const wmEnabled = org?.watermarkEnabled ?? branding?.watermarkEnabled ?? false;
                const wmOpacity = org?.watermarkOpacity ?? branding?.watermarkOpacity ?? 0.08;
                const logo = org?.logoUrl || branding?.logoUrl;
                const headerStyle = template==='corporate' ? { background: branding?.primaryColor || org?.primaryColor || '#0f172a' } : {};
                const headerClass = template==='classic' ? 'bg-slate-900 text-white' : template==='modern' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : template==='corporate' ? 'text-white' : 'bg-slate-100 text-slate-900 border-b';
                return !showBack ? (
                <div className="border rounded-2xl overflow-hidden relative">
                  {wmEnabled && logo && <img src={logo} alt="watermark" className="absolute inset-0 m-auto w-40 h-40 object-contain pointer-events-none" style={{ opacity: wmOpacity }} />}
                  <div className={`p-4 flex justify-between items-center ${headerClass}`} style={headerStyle}>
                    <div className="flex items-center gap-2">
                      {logo ? <img src={logo} className="w-8 h-8 rounded bg-white object-contain" alt=""/> : <Building2 size={16}/>}
                      <div><div className="font-bold text-sm">{detail?.organization.name || selected.organization.name}</div><div className="text-xs opacity-80">{detail?.organization.acronym || selected.organization.acronym} • Staff ID • {template}</div></div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono ${template==='minimal' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>{selected.employeeCode}</span>
                  </div>
                  <div className="p-5 flex gap-4 relative">
                    <img src={detail?.employee.photoUrl || selected.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selected.employeeCode}`} className="w-24 h-28 rounded-xl object-cover border" alt="passport"/>
                    <div className="flex-1">
                      <div className="font-bold">{detail?.employee.jobTitle || selected.jobTitle}</div>
                      <div className="text-sm text-slate-500">{detail?.employee.department || selected.department} {detail?.employee.branch && `• ${detail?.employee.branch}`}</div>
                      <div className="text-xs mt-2 flex gap-2"><span className="bg-slate-100 px-2 py-1 rounded">Grade {selected.grade}</span><span className="bg-sky-100 text-sky-700 px-2 py-1 rounded">{selected.employeeCode}</span></div>
                      <div className="text-xs text-slate-500 mt-2">Hire: {detail?.employee.hireDate ? new Date(detail.employee.hireDate).toLocaleDateString() : '—'} • Status {detail?.employee.status || 'active'}</div>
                    </div>
                    <img src={detail?.qr.secureQr || selected.qrSecure} className="w-24 h-24 border rounded-lg bg-white p-1" alt="QR"/>
                  </div>
                  <div className="bg-slate-50 px-5 py-3 text-xs text-slate-600 flex justify-between">
                    <span>Secured JWT QR • Verify at /v1/employees/qr/verify</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div className="border rounded-2xl overflow-hidden bg-slate-50 relative">
                  {wmEnabled && logo && <img src={logo} alt="watermark" className="absolute inset-0 m-auto w-32 h-32 object-contain pointer-events-none" style={{ opacity: wmOpacity*0.6 }} />}
                  <div className="p-5 text-center relative">
                    <div className="font-bold text-sm">{detail?.organization.name || selected.organization.name}</div>
                    <div className="text-xs text-slate-500">{detail?.organization.acronym} • If found return to HR Dept</div>
                    <div className="mt-4 p-3 bg-white rounded-xl border text-left">
                      <div className="text-xs font-mono break-all">Token: {detail?.qr.secureToken || selected.secureToken}</div>
                      <div className="text-xs mt-2">Employee: {selected.employeeCode} • {selected.jobTitle}</div>
                      <div className="text-xs">Department: {selected.department} • Branch: {selected.branch}</div>
                    </div>
                    <div className="mt-4 flex justify-center"><img src={detail?.qr.secureQr || selected.qrSecure} className="w-24 h-24 border rounded bg-white p-1" alt="QR"/></div>
                    <div className="text-[10px] text-slate-500 mt-2">This card is property of {detail?.organization.name || selected.organization.name}. Secured QR verifies authenticity.</div>
                    <div className="text-[10px] text-slate-400">Issued {detail?.card?.back?.issuedAt ? new Date(detail.card.back.issuedAt).toLocaleString() : new Date().toLocaleString()}</div>
                  </div>
                </div>
              ); })()}
            </div>
            <div className="p-3 bg-slate-50 text-xs text-slate-500 text-center">Print Front & Back separately for double-sided printing • 8 cards per Foolscap (2×4) in Print All</div>
          </div>
        </div>
      )}
    </div>
  );
}
