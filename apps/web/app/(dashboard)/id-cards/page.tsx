'use client';
import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders } from '../../../lib/api';
import { GlassCard } from '../../../components/ui/GlassCard';
import { CreditCard, Printer, Search, User, Building2, Eye, FlipHorizontal } from 'lucide-react';

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
  organization: { name: string; acronym: string; logoUrl?: string };
};

export default function IdCardsPage() {
  const api = getApiUrl();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Card | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api}/employees/id-cards?limit=50`, { headers: getAuthHeaders() as any });
      const json = await res.json().catch(() => ({}));
      const list = Array.isArray(json.cards) ? json.cards : Array.isArray(json) ? json : [];
      setCards(list);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { fetchCards(); }, []);

  const filtered = cards.filter(c => !q || c.employeeCode.toLowerCase().includes(q.toLowerCase()) || c.jobTitle?.toLowerCase().includes(q.toLowerCase()));

  const fetchDetail = async (id: string) => {
    try {
      const res = await fetch(`${api}/employees/${id}/id-card`, { headers: getAuthHeaders() as any });
      const json = await res.json().catch(() => null);
      setDetail(json);
    } catch {}
  };
  useEffect(() => { if (selected) fetchDetail(selected.id); }, [selected]);

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
          <p className="text-sm text-slate-500">Superadmin/Admin view 8 per foolscap page • Employee sees own • Front/Back print • QR embeds JWT signed payload</p>
        </div>
        <div className="flex gap-2">
          <button onClick={printAll} className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-800"><Printer size={16}/> Print All (8/page)</button>
        </div>
      </div>

      <GlassCard className="no-print">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search code, job title..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white" />
          </div>
          <span className="bg-sky-100 text-sky-700 rounded-full px-3 py-2 text-sm">{filtered.length} cards</span>
        </div>
      </GlassCard>

      {loading ? <div className="text-center p-8 text-slate-500">Loading ID cards…</div> : (
        <div className="print-grid grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((c, idx) => (
            <div key={c.id} className={`card-print bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition ${idx>0 && idx%8===0 ? 'page-break' : ''}`}>
              {/* Front */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {c.organization.logoUrl ? <img src={c.organization.logoUrl} className="w-8 h-8 rounded bg-white object-contain border" alt=""/> : <Building2 size={16} className="text-slate-400"/>}
                    <div><div className="text-xs font-bold">{c.organization.name}</div><div className="text-[10px] text-slate-500">{c.organization.acronym}</div></div>
                  </div>
                  <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full">{c.employeeCode}</span>
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
              <div className="bg-slate-50 px-4 py-2 border-t text-[10px] text-slate-600">
                <div>If found return to HR • {c.organization.name} • {c.employeeCode}</div>
                <div className="truncate">Token: {c.secureToken.slice(0,24)}…</div>
              </div>
            </div>
          ))}
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
              {!showBack ? (
                <div className="border rounded-2xl overflow-hidden">
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {detail?.organization.logoUrl ? <img src={detail.organization.logoUrl} className="w-8 h-8 rounded bg-white object-contain" alt=""/> : <Building2 size={16}/>}
                      <div><div className="font-bold text-sm">{detail?.organization.name || selected.organization.name}</div><div className="text-xs opacity-80">{detail?.organization.acronym || selected.organization.acronym} • Staff ID</div></div>
                    </div>
                    <span className="bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-mono">{selected.employeeCode}</span>
                  </div>
                  <div className="p-5 flex gap-4">
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
                <div className="border rounded-2xl overflow-hidden bg-slate-50">
                  <div className="p-5 text-center">
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
              )}
            </div>
            <div className="p-3 bg-slate-50 text-xs text-slate-500 text-center">Print Front & Back separately for double-sided printing • 8 cards per Foolscap (2×4) in Print All</div>
          </div>
        </div>
      )}
    </div>
  );
}
