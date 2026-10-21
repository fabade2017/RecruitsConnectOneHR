'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, LogOut, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#tour', label: 'Product tour' },
  { href: '/#roi', label: 'ROI calculator' },
  { href: '/#industries', label: 'Industries' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#contact', label: 'Contact' },
];

function AuthNav() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const u = localStorage.getItem('onehr_user');
    if (u) try { setUser(JSON.parse(u)); } catch {}
  }, []);
  const base2 = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const logout = () => {
    localStorage.removeItem('onehr_user');
    document.cookie = 'onehr_auth=; Max-Age=0; path=/';
    document.cookie = 'onehr_token=; Max-Age=0; path=/';
    fetch(`${base2}/auth/logout`, { method: 'POST' }).finally(() => { window.location.href = '/login'; });
  };
  if (user) {
    const dash = user.role === 'super_admin' ? '/admin' : user.role === 'employee' ? '/employee' : user.role === 'manager' ? '/manager' : user.role === 'executive' ? '/executive' : '/hr';
    return (
      <div className="flex items-center gap-3">
        <span className="hidden lg:inline text-xs bg-slate-100 rounded-full px-3 py-1.5">{user.email} • {user.role}</span>
        <Link href={dash} className="hidden md:inline text-sm font-medium text-slate-700 hover:text-slate-900">Dashboard</Link>
        <button onClick={logout} className="bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 flex items-center gap-2"><LogOut size={14} /> Logout</button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="hidden md:inline text-sm font-medium text-slate-700 hover:text-slate-900">Login</Link>
      <Link href="/register" className="bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 flex items-center gap-2">Get Started <ArrowRight size={16} /></Link>
    </div>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[64px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="OneHR Logo" className="w-9 h-9 rounded-xl shadow" />
          <div>
            <div className="font-bold leading-none">RecruitConnect OneHR™</div>
            <div className="text-[11px] tracking-widest text-slate-500">PAYROLL · ATTENDANCE · HR</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {NAV_LINKS.map(l => <a key={l.href} href={l.href} className="hover:text-slate-900">{l.label}</a>)}
        </nav>

        <div className="hidden lg:block"><AuthNav /></div>

        <button
          className="lg:hidden p-2 -mr-2"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t bg-white px-6 py-4">
          <nav className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 border-b border-slate-100">{l.label}</a>
            ))}
            <Link href="/employee-login" onClick={() => setOpen(false)} className="py-3 border-b border-slate-100 text-slate-500">Employee login</Link>
          </nav>
          <div className="mt-4"><AuthNav /></div>
        </div>
      )}
    </header>
  );
}
