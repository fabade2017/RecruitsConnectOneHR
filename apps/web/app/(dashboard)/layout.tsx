'use client';
import Sidebar from '../../components/Sidebar';
import Watermark from '../../components/Watermark';
import ChatProvider from '../../components/ChatProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const u = localStorage.getItem('onehr_user');
    if (u) try { setUser(JSON.parse(u)); } catch {}
  }, []);
  const logout = () => { localStorage.clear(); document.cookie='onehr_auth=; Max-Age=0; path=/'; document.cookie='onehr_token=; Max-Age=0; path=/'; window.location.href='/login'; };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,#e0f2fe_0%,transparent_60%),radial-gradient(1000px_500px_at_90%_0%,#f0f9ff_0%,transparent_60%),linear-gradient(to_bottom,#f8fafc,#f1f5f9)] flex relative">
      <Watermark />
      <ChatProvider />
      <Sidebar />
      <div className="flex-1 min-w-0 relative z-10">
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/60 border-b border-white/60">
          <div className="max-w-[1600px] mx-auto px-6 h-[64px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Workforce Intelligence • Live
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 glass rounded-full px-3 py-1.5">
                <span className="text-xs text-slate-600">Today</span>
                <span className="text-sm font-semibold">{new Date().toLocaleDateString('en-NG', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
              </div>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden md:inline text-xs bg-slate-900 text-white rounded-full px-3 py-1.5">{user.email} • {user.role}</span>
                  <button onClick={logout} className="text-sm px-4 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800">Logout</button>
                </div>
              ) : (
                <Link href="/login" className="text-sm px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800">Sign in</Link>
              )}
            </div>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto p-6">{children}</main>
      </div>
    </div>
  );
}
