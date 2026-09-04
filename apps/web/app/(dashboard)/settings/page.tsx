'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill, GradientCard } from '../../../components/ui/GlassCard';
import { Settings, Building2, Sliders, Clock, Save, RefreshCw, Shield, Timer, CalendarDays, Layers, AlertTriangle, Check, Image as ImageIcon, Palette, Eye, Upload } from 'lucide-react';

export default function SettingsPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const [org, setOrg] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', acronym: '', industryTemplate: '', workdays: 'mon,tue,wed,thu,fri', grace: 10, overtimeThreshold: 480, requiresApproval: true });
  const [branding, setBranding] = useState({ logoUrl: '', watermarkEnabled: false, watermarkText: '', watermarkOpacity: 0.08, watermarkPosition: 'center', primaryColor: '#0f172a' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [tab, setTab] = useState<'org'|'branding'|'attendance'|'compliance'>('org');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const getOrgId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('onehr_user') || '{}');
      if (u.org_id) return u.org_id;
      if (u.organizationId) return u.organizationId;
      const token = localStorage.getItem('onehr_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.org_id || payload.organizationId || payload.orgId;
      }
    } catch {}
    return null;
  };

  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('onehr_token')}` });

  const load = async () => {
    setLoading(true);
    const orgId = getOrgId();
    if (!orgId) { setLoading(false); return; }
    const h: any = auth();
    try {
      const orgRes = await fetch(`${api}/organizations/${orgId}`, { headers: h }).then(r => r.json()).catch(() => null);
      if (orgRes) {
        setOrg(orgRes);
        setForm(f => ({
          ...f,
          name: orgRes.name || '',
          acronym: orgRes.acronym || '',
          industryTemplate: orgRes.industryTemplate || '',
        }));
      }
      const cfgRes = await fetch(`${api}/organizations/${orgId}/config`, { headers: h }).then(r => r.json()).catch(() => null);
      if (cfgRes) {
        const c = cfgRes.config ? (typeof cfgRes.config === 'string' ? JSON.parse(cfgRes.config) : cfgRes.config) : cfgRes;
        setConfig(c);
        setForm(f => ({
          ...f,
          workdays: (c.workdays || ['mon','tue','wed','thu','fri']).join(','),
          grace: c.grace_period_minutes ?? c.gracePeriodMinutes ?? 10,
          overtimeThreshold: c.overtime_rules?.threshold_minutes ?? c.overtimeThreshold ?? 480,
          requiresApproval: c.overtime_rules?.requires_approval ?? true,
          industryTemplate: cfgRes.industryTemplate || f.industryTemplate,
        }));
      }
      // Branding
      const brandRes = await fetch(`${api}/organizations/${orgId}/branding`, { headers: h }).then(r => r.json()).catch(() => null);
      if (brandRes) {
        setBranding({
          logoUrl: brandRes.logoUrl || '',
          watermarkEnabled: !!brandRes.watermarkEnabled,
          watermarkText: brandRes.watermarkText || brandRes.acronym || '',
          watermarkOpacity: brandRes.watermarkOpacity ?? 0.08,
          watermarkPosition: brandRes.watermarkPosition || 'center',
          primaryColor: brandRes.primaryColor || '#0f172a',
        });
        if (brandRes.logoUrl) setLogoPreview(brandRes.logoUrl);
        // Cache for watermark overlay
        localStorage.setItem('onehr_branding', JSON.stringify(brandRes));
      }
      const pol = await fetch(`${api}/attendance/policies`, { headers: h }).then(r => r.json()).catch(() => null);
      if (Array.isArray(pol)) setPolicies(pol);
      else if (pol && Array.isArray(pol.data)) setPolicies(pol.data);
      else if (pol && pol.attendancePolicy) setPolicies([pol.attendancePolicy]);
      else setPolicies([]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveOrg = async () => {
    const orgId = getOrgId();
    if (!orgId) return setMsg('No org_id found in token');
    const payload: any = {
      name: form.name,
      acronym: form.acronym,
      industryTemplate: form.industryTemplate,
      config: JSON.stringify({
        workdays: form.workdays.split(',').map(s => s.trim()).filter(Boolean),
        grace_period_minutes: Number(form.grace),
        overtime_rules: { threshold_minutes: Number(form.overtimeThreshold), requires_approval: form.requiresApproval },
      }),
    };
    const res = await fetch(`${api}/organizations/${orgId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify(payload) });
    if (res.ok) { setMsg('Saved ✓'); load(); } else { const t = await res.text(); setMsg('Save failed: ' + t.slice(0,120)); }
    setTimeout(() => setMsg(''), 3000);
  };

  const uploadLogo = async () => {
    if (!logoFile) return setMsg('Select logo image first');
    const orgId = getOrgId();
    if (!orgId) return setMsg('No org_id');
    const fd = new FormData();
    fd.append('logo', logoFile);
    const res = await fetch(`${api}/organizations/${orgId}/logo`, { method: 'POST', headers: { ...auth() }, body: fd });
    if (res.ok) {
      const data = await res.json();
      setBranding(b => ({ ...b, logoUrl: data.logoUrl || data.logo_url || '' }));
      setLogoPreview(data.logoUrl || data.logo_url || '');
      localStorage.setItem('onehr_branding', JSON.stringify(data));
      setMsg('Logo uploaded ✓');
      load();
    } else {
      const t = await res.text();
      setMsg('Upload failed: ' + t.slice(0,120));
    }
    setTimeout(()=>setMsg(''),3000);
  };

  const saveBranding = async () => {
    const orgId = getOrgId();
    if (!orgId) return setMsg('No org_id');
    const res = await fetch(`${api}/organizations/${orgId}/branding`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({
        watermarkEnabled: branding.watermarkEnabled,
        watermarkText: branding.watermarkText,
        watermarkOpacity: Number(branding.watermarkOpacity),
        watermarkPosition: branding.watermarkPosition,
        primaryColor: branding.primaryColor,
        logoUrl: branding.logoUrl || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('onehr_branding', JSON.stringify(data));
      setMsg('Branding saved ✓ — logo & watermark live');
      load();
    } else {
      const t = await res.text();
      setMsg('Save failed: ' + t.slice(0,120));
    }
    setTimeout(()=>setMsg(''),3000);
  };

  return (
    <div className="space-y-6">
      <GradientCard gradient="from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Settings /> Organization Settings <span className="font-normal text-white/70">— Config §42</span></h1>
            <p className="text-sm text-white/70">Workdays • Grace period • Overtime rules • Industry template • Attendance policies §7 §13</p>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="blue">RBAC: org_admin / hr_admin</Pill>
            <button onClick={load} className="glass-dark rounded-xl px-3 py-2 text-sm flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
          </div>
        </div>
      </GradientCard>

      <div className="flex gap-2 flex-wrap">
        {[
          ['org','Organization',Building2],
          ['branding','Branding & Watermark',Palette],
          ['attendance','Attendance Policies',Clock],
          ['compliance','Compliance & Retention',Shield],
        ].map(([k,label,Icon]: any) => (
          <button key={k} onClick={() => setTab(k as any)} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${tab===k ? 'bg-slate-900 text-white' : 'glass'}`}>
            <Icon size={16}/>{label}
          </button>
        ))}
      </div>

      {tab==='org' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard className="lg:col-span-2">
            <h3 className="font-semibold flex items-center gap-2"><Building2 size={16}/> Organization Profile</h3>
            <p className="text-xs text-slate-500">PATCH /v1/organizations/:id — org_admin only</p>
            {loading ? <div className="mt-4 text-sm text-slate-500">Loading...</div> : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Organization Name</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="RecruitConnect Nigeria Ltd" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Acronym</label>
                  <input value={form.acronym} onChange={e=>setForm({...form,acronym:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1 font-mono" placeholder="RC" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Industry Template</label>
                  <select value={form.industryTemplate} onChange={e=>setForm({...form,industryTemplate:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1">
                    <option value="">Select</option>
                    <option value="banking">Banking</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold">Workdays (comma)</label>
                  <input value={form.workdays} onChange={e=>setForm({...form,workdays:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1 font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Grace Period (minutes) §7</label>
                  <input type="number" value={form.grace} onChange={e=>setForm({...form,grace:Number(e.target.value)})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Overtime Threshold (minutes) §5</label>
                  <input type="number" value={form.overtimeThreshold} onChange={e=>setForm({...form,overtimeThreshold:Number(e.target.value)})} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input type="checkbox" checked={form.requiresApproval} onChange={e=>setForm({...form,requiresApproval:e.target.checked})} />
                  <span className="text-sm">Overtime requires approval</span>
                  <Pill tone={form.requiresApproval?'amber':'slate'}>{form.requiresApproval?'approval required':'auto'}</Pill>
                </div>
                <div className="md:col-span-2 flex gap-2 mt-2">
                  <button onClick={saveOrg} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Save size={16}/> Save Configuration</button>
                  {msg && <span className="flex items-center gap-1 text-sm text-emerald-600"><Check size={14}/>{msg}</span>}
                </div>
              </div>
            )}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs font-mono overflow-auto">GET /v1/organizations/:id/config → {config ? JSON.stringify(config).slice(0,200) : '—'} {org ? `• ${org.acronym}` : ''}</div>
          </GlassCard>
          <div className="space-y-4">
            <GlassCard>
              <h3 className="font-semibold flex items-center gap-2"><Sliders size={16}/> Current Config Preview</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Workdays</span><span className="font-mono text-xs">{form.workdays}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Grace</span><span>{form.grace} min</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Overtime</span><span>{form.overtimeThreshold} min ({Math.round(form.overtimeThreshold/60)}h)</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Template</span><Pill tone="blue">{form.industryTemplate || '—'}</Pill></div>
              </div>
              <div className="mt-3 text-xs text-slate-500">§42 Configuration — net = gross − breaks §13</div>
            </GlassCard>
            <GlassCard>
              <h3 className="font-semibold flex items-center gap-2"><Layers size={16}/> Health Score</h3>
              <div className="text-3xl font-black mt-2">89<span className="text-slate-400 text-xl">/100</span></div>
              <div className="text-xs text-slate-500">GET /v1/organizations/:id/health-score</div>
              <div className="mt-2 flex gap-2"><Pill tone="emerald">97 healthy</Pill><Pill tone="amber">18 warnings</Pill><Pill tone="red">3 critical</Pill></div>
            </GlassCard>
          </div>
        </div>
      )}

      {tab==='branding' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard>
              <h3 className="font-semibold flex items-center gap-2"><ImageIcon size={16}/> Logo Upload — Application Branding</h3>
              <p className="text-xs text-slate-500">POST /v1/organizations/:id/logo (multipart) • 3MB max • PNG/JPG/SVG • Stored as data URL for instant preview</p>
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-white">
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" /> : <div className="text-center"><Building2 size={24} className="mx-auto text-slate-300"/><span className="text-xs text-slate-400">No logo</span></div>}
                </div>
                {branding.logoUrl && <div className="text-xs font-mono text-slate-500 truncate max-w-full">{branding.logoUrl.slice(0,60)}...</div>}
                <input type="file" accept="image/*" onChange={e=>{
                  const f = e.target.files?.[0] || null;
                  setLogoFile(f);
                  if (f) {
                    const reader = new FileReader();
                    reader.onload = ev => setLogoPreview(ev.target?.result as string);
                    reader.readAsDataURL(f);
                  } else setLogoPreview(branding.logoUrl || null);
                }} className="w-full border rounded-xl px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-full file:bg-slate-900 file:text-white file:text-xs" />
                <div className="flex gap-2 w-full">
                  <button onClick={uploadLogo} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Upload size={16}/> Upload Logo</button>
                  {branding.logoUrl && <button onClick={() => { setBranding(b=>({...b, logoUrl:''})); setLogoPreview(null); setLogoFile(null); }} className="glass rounded-xl px-4 py-2.5 text-sm">Clear</button>}
                </div>
                <p className="text-xs text-slate-500 text-center">Logo appears in Sidebar (1H), Header, Login, Reports, PDFs • Cached in localStorage <code>onehr_branding</code></p>
              </div>
            </GlassCard>
            <GlassCard>
              <h3 className="font-semibold flex items-center gap-2"><Eye size={16}/> Watermark Design — Live Preview</h3>
              <div className="mt-3 space-y-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={branding.watermarkEnabled} onChange={e=>setBranding(b=>({...b, watermarkEnabled:e.target.checked}))} /> Enable watermark (all pages + exports)</label>
                <div>
                  <label className="text-xs font-semibold">Watermark Text (if no logo)</label>
                  <input value={branding.watermarkText} onChange={e=>setBranding(b=>({...b, watermarkText:e.target.value}))} placeholder={form.acronym || 'OneHR'} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold">Opacity {branding.watermarkOpacity}</label>
                    <input type="range" min={0.03} max={0.25} step={0.01} value={branding.watermarkOpacity} onChange={e=>setBranding(b=>({...b, watermarkOpacity: parseFloat(e.target.value)}))} className="w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Position</label>
                    <select value={branding.watermarkPosition} onChange={e=>setBranding(b=>({...b, watermarkPosition:e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-sm mt-1">
                      <option value="center">Center</option>
                      <option value="diagonal">Diagonal (45°)</option>
                      <option value="tile">Tile (repeated)</option>
                      <option value="corner">Corner</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold">Primary Color</label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={branding.primaryColor} onChange={e=>setBranding(b=>({...b, primaryColor:e.target.value}))} className="w-12 h-9 rounded border" />
                    <input value={branding.primaryColor} onChange={e=>setBranding(b=>({...b, primaryColor:e.target.value}))} className="flex-1 border rounded-xl px-3 py-2 text-sm font-mono" placeholder="#0f172a" />
                  </div>
                </div>
                <div className="border rounded-xl p-3 bg-slate-50 relative overflow-hidden h-[140px] flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ opacity: branding.watermarkEnabled ? branding.watermarkOpacity : 0.06 }}>
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="watermark" className={`w-32 h-32 object-contain ${branding.watermarkPosition==='diagonal' ? 'rotate-[-30deg] scale-125' : branding.watermarkPosition==='tile' ? 'scale-75' : ''}`} style={{ opacity: branding.watermarkEnabled ? 1 : 0.3 }} />
                    ) : (
                      <span className={`font-black text-2xl text-slate-400 ${branding.watermarkPosition==='diagonal' ? 'rotate-[-30deg]' : ''} ${branding.watermarkPosition==='tile' ? 'text-3xl opacity-20' : ''}`}>{branding.watermarkText || form.acronym || 'OneHR'}</span>
                    )}
                  </div>
                  <span className="relative bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs">Preview • {branding.watermarkPosition} • {Math.round(branding.watermarkOpacity*100)}%</span>
                </div>
                <button onClick={saveBranding} className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Save size={16}/> Save Branding</button>
                <p className="text-xs text-slate-500">PATCH /v1/organizations/:id/branding • Stored in org.branding + localStorage • Applied via &lt;Watermark/&gt;</p>
              </div>
            </GlassCard>
          </div>
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Palette size={16}/> Application Preview</h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="border rounded-xl p-3 text-center bg-white">
                <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-white font-black" style={{ background: branding.primaryColor }}>{branding.logoUrl ? <img src={branding.logoUrl} alt="logo" className="w-full h-full object-contain p-1 rounded-xl" /> : '1H'}</div>
                <div className="text-xs mt-1">Sidebar</div>
              </div>
              <div className="border rounded-xl p-3 text-center bg-slate-900 text-white">
                <div className="w-10 h-10 rounded-xl bg-white mx-auto flex items-center justify-center overflow-hidden">{branding.logoUrl ? <img src={branding.logoUrl} alt="logo" className="w-full h-full object-contain p-1" /> : <img src="/logo.svg" alt="OneHR" className="w-6 h-6" />}</div>
                <div className="text-xs mt-1">Login / Header</div>
              </div>
              <div className="border rounded-xl p-3 text-center relative overflow-hidden bg-slate-50">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">{branding.logoUrl ? <img src={branding.logoUrl} alt="wm" className="w-16 h-16 object-contain" /> : <span className="font-black">{branding.watermarkText || 'OneHR'}</span>}</div>
                <span className="relative text-xs">Watermark</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {tab==='attendance' && (
        <div className="space-y-4">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Timer size={16}/> Attendance Policies §7</h3><Pill tone="blue">{policies.length} policies</Pill></div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Policy</th><th className="p-2">Methods</th><th className="p-2">Grace</th><th className="p-2">Face Snapshot</th><th className="p-2">Retention</th><th className="p-2">Status</th></tr></thead>
                <tbody className="divide-y">
                  {policies.map((p:any)=>(
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-2"><div className="font-semibold">{p.name}</div><div className="text-xs text-slate-500">{p.id.slice(0,8)}</div></td>
                      <td className="p-2"><div className="flex flex-wrap gap-1">{(Array.isArray(p.verificationMethods)? p.verificationMethods : JSON.parse(p.verificationMethods||'[]')).map((m:string)=><span key={m} className="bg-slate-900 text-white rounded-full px-2 py-0.5 text-[11px]">{m}</span>)}</div></td>
                      <td className="p-2 text-center">{p.gracePeriodMinutes ?? p.grace_period_minutes ?? 10}m</td>
                      <td className="p-2 text-center">{p.requireFaceSnapshot ? <Pill tone="amber">required</Pill> : <Pill tone="slate">optional</Pill>}</td>
                      <td className="p-2 text-center">{p.snapshotRetentionDays ?? 90}d</td>
                      <td className="p-2"><Pill tone="emerald">active</Pill></td>
                    </tr>
                  ))}
                  {policies.length===0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No policies — seed creates default §7</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50/50 text-xs text-slate-500">API: <code>GET /v1/attendance/policies</code> • Live from API • No mock • Verification 98% §36 • §9 privacy optional</div>
          </GlassCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard>
              <h4 className="font-semibold text-sm flex items-center gap-2"><CalendarDays size={14}/> Work Session §5</h4>
              <p className="text-xs text-slate-500 mt-1">Gross − Breaks = Net • Break 60m • Overtime after {form.overtimeThreshold} min</p>
              <div className="mt-2 text-xs bg-slate-50 rounded-xl p-2">Example: 08:00–17:00 (540m) − 60m break = 480m net → threshold {form.overtimeThreshold}m</div>
            </GlassCard>
            <GlassCard>
              <h4 className="font-semibold text-sm flex items-center gap-2"><Clock size={14}/> 7 Clock Methods §7</h4>
              <div className="mt-2 flex flex-wrap gap-1 text-xs">{['Mobile','Web','QR','Biometric','Facial','NFC','API'].map(m=><span key={m} className="glass rounded-full px-2 py-1">{m}</span>)}</div>
              <p className="text-xs text-slate-500 mt-2">Face/GPS optional + consent §9</p>
            </GlassCard>
            <GlassCard>
              <h4 className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500"/> Exceptions §37</h4>
              <p className="text-xs text-slate-500">Flagged Requires Review — not accused §10</p>
              <div className="mt-2 text-xs space-y-1"><div>Missing clock-out • Device sharing • Impossible travel</div><div className="text-slate-400">GET /v1/attendance/exceptions</div></div>
            </GlassCard>
          </div>
        </div>
      )}

      {tab==='compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard>
            <h3 className="font-semibold flex items-center gap-2"><Shield size={16}/> Data Retention §9</h3>
            <table className="w-full text-sm mt-3">
              <thead className="text-xs bg-slate-50"><tr><th className="text-left p-2">Data</th><th className="p-2">Retention</th><th className="p-2">Status</th></tr></thead>
              <tbody className="divide-y text-xs">
                <tr><td className="p-2">Face snapshots</td><td className="p-2 text-center">90 days</td><td className="p-2"><Pill tone="amber">consent</Pill></td></tr>
                <tr><td className="p-2">GPS logs</td><td className="p-2 text-center">90 days</td><td className="p-2"><Pill tone="amber">opt-in</Pill></td></tr>
                <tr><td className="p-2">Work sessions</td><td className="p-2 text-center">7 years</td><td className="p-2"><Pill tone="emerald">compliance</Pill></td></tr>
                <tr><td className="p-2">Audit logs</td><td className="p-2 text-center">7 years</td><td className="p-2"><Pill tone="emerald">immutable</Pill></td></tr>
              </tbody>
            </table>
          </GlassCard>
          <GlassCard>
            <h3 className="font-semibold">44 Modules Ecosystem §44</h3>
            <div className="mt-3 flex flex-wrap gap-1">
              {['people','attendance','leave','payroll','recruitment','performance','shifts','documents','assets','compliance','analytics','ai_copilot','workflow','integrations'].map(m=> <span key={m} className="text-xs bg-slate-50 border rounded-full px-2 py-1">{m}</span>)}
              <span className="text-xs text-slate-500">+30 more</span>
            </div>
            <p className="text-xs text-slate-500 mt-3">Super admin assigns modules per plan — GET /v1/admin/plans • Health §18</p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
