'use client';
import { useEffect, useState } from 'react';

export default function Watermark() {
  const [branding, setBranding] = useState<any>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('onehr_branding');
        if (raw) {
          const b = JSON.parse(raw);
          setBranding(b);
          return;
        }
      } catch {}
      // Fallback fetch from API if no cache
      const u = localStorage.getItem('onehr_user');
      const t = localStorage.getItem('onehr_token');
      if (!u || !t) return;
      try {
        const user = JSON.parse(u);
        const orgId = user.org_id || user.organizationId;
        if (!orgId) return;
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
        fetch(`${api}/organizations/${orgId}/branding`, { headers: { Authorization: `Bearer ${t}` } })
          .then(r => r.json())
          .then(b => {
            if (b && !b.error) {
              setBranding(b);
              localStorage.setItem('onehr_branding', JSON.stringify(b));
            }
          })
          .catch(() => {});
      } catch {}
    };
    load();
    const id = setInterval(load, 10000);
    // Listen for storage changes (when settings saves)
    const onStorage = () => load();
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(id); window.removeEventListener('storage', onStorage); };
  }, []);

  if (!branding?.watermarkEnabled) return null;

  const opacity = typeof branding.watermarkOpacity === 'number' ? branding.watermarkOpacity : 0.08;
  const text = branding.watermarkText || branding.acronym || 'OneHR';
  const logo = branding.logoUrl;
  const position = branding.watermarkPosition || 'center';

  if (position === 'tile') {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <div className="absolute inset-0 grid grid-cols-3 gap-8 p-12 opacity-20" style={{ opacity }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              {logo ? <img src={logo} alt="wm" className="w-24 h-24 object-contain opacity-60" /> : <span className="font-black text-2xl text-slate-400">{text}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (position === 'diagonal') {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center select-none overflow-hidden">
        <div className="rotate-[-30deg] opacity-20 flex flex-col items-center gap-4" style={{ opacity }}>
          {logo ? <img src={logo} alt="wm" className="w-48 h-48 object-contain" /> : null}
          <span className="font-black text-5xl text-slate-400 tracking-widest">{text}</span>
          <span className="text-sm text-slate-400">OneHR • {new Date().getFullYear()}</span>
        </div>
      </div>
    );
  }

  if (position === 'corner') {
    return (
      <div className="pointer-events-none fixed bottom-6 right-6 z-0 select-none" style={{ opacity: opacity + 0.05 }}>
        {logo ? <img src={logo} alt="wm" className="w-20 h-20 object-contain" /> : <span className="font-black text-xl text-slate-300">{text}</span>}
      </div>
    );
  }

  // center (default)
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center select-none">
      <div className="flex flex-col items-center gap-3" style={{ opacity }}>
        {logo ? <img src={logo} alt="watermark" className="w-40 h-40 object-contain" /> : null}
        <span className="font-black text-4xl text-slate-300 tracking-widest">{text}</span>
      </div>
    </div>
  );
}
