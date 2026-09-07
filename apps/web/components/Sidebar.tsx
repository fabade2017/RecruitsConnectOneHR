'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, UserPlus, Clock, CalendarCheck, Timer, Briefcase, Wallet, TrendingUp, GraduationCap, Heart, ShieldCheck, FileText, Boxes, ArrowUpCircle, UserMinus, Users2, Scale, Headset, BarChart3, Brain, Workflow, Plug, Settings,
  MapPin, AlertTriangle, Building2, ChevronLeft, ChevronRight, LogOut, Sparkles, Layers, MessageCircle
} from 'lucide-react';

type NavSection = { title: string; items: { href: string; label: string; icon: any; badge?: string; roles?: string[] }[] };

const NAV: NavSection[] = [
  { title: 'OVERVIEW', items: [
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/hr', label: 'Command Center', icon: LayoutDashboard, roles: ['hr_admin','org_admin','hr_manager'] },
    { href: '/executive', label: 'Executive', icon: Building2, roles: ['executive','org_admin'] },
    { href: '/manager', label: 'My Team', icon: Users2, roles: ['manager','hr_admin','org_admin'] },
    { href: '/employee', label: 'Home', icon: LayoutDashboard, roles: ['employee','manager','hr_admin'] },
  ]},
  { title: 'MANAGE PEOPLE', items: [
    { href: '/employees', label: 'People', icon: Users, badge: 'ID' },
    { href: '/recruitment', label: 'Recruitment / ATS', icon: UserPlus },
    { href: '/onboarding', label: 'Onboarding', icon: ArrowUpCircle },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/assets', label: 'Assets', icon: Boxes },
  ]},
  // Chat now in OVERVIEW (most prominent) — keep COMMUNICATE for quick access duplicate removed to avoid double link
  { title: 'MANAGE WORK', items: [
    { href: '/attendance', label: 'Attendance', icon: Clock },
    { href: '/attendance', label: 'Smart Clocking', icon: Timer },
    { href: '/shifts', label: 'Shifts & Rosters', icon: CalendarCheck },
    { href: '/leave', label: 'Leave', icon: CalendarCheck },
    { href: '/projects', label: 'Tasks & Projects', icon: Briefcase },
  ]},
  { title: 'MEASURE', items: [
    { href: '/performance', label: 'Performance', icon: TrendingUp },
    { href: '/learning', label: 'Learning', icon: GraduationCap },
    { href: '/engagement', label: 'Engagement', icon: Heart },
    { href: '/payroll', label: 'Payroll', icon: Wallet },
    { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/hr', label: 'Live Map', icon: MapPin },
    { href: '/hr', label: 'Exceptions', icon: AlertTriangle, badge: '17' },
  ]},
  { title: 'PREDICT', items: [
    { href: '/analytics', label: 'People Analytics', icon: BarChart3 },
    { href: '/ai-copilot', label: 'AI Copilot', icon: Sparkles },
    { href: '/intelligence', label: 'Intelligence', icon: Brain },
  ]},
  { title: 'SYSTEM', items: [
      { href: '/audit', label: 'Audit Trail', icon: ShieldCheck },
      { href: '/workflows', label: 'Automation', icon: Workflow },
      { href: '/integrations', label: 'Integrations', icon: Plug },
      { href: '/settings', label: 'Administration', icon: Settings },
      { href: '/settings/dropdowns', label: 'Dropdowns', icon: Layers },
    ]},
  { title: 'SUPER ADMIN', items: [
    { href: '/admin', label: 'Super Admin', icon: ShieldCheck, roles: ['super_admin'] },
  ]},
  { title: 'HELP', items: [
    { href: '/manual', label: 'Manual • PDF', icon: FileText },
    { href: '/about', label: 'About', icon: Building2 },
    { href: '/contact', label: 'Contact', icon: Headset },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const [chatUnread, setChatUnread] = useState<number>(0);
  const role = user?.role || null;

  // Chat unread badge — poll + socket via storage event from ChatProvider
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const t = localStorage.getItem('onehr_token');
        if (!t) return;
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
        const r = await fetch(`${api}/chat/unread/count`, { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); setChatUnread(d.total || 0); }
      } catch {}
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    const onStorage = (e: StorageEvent) => { if (e.key === 'onehr_chat_unread') setChatUnread(parseInt(e.newValue || '0', 10)); };
    window.addEventListener('storage', onStorage);
    // also listen to custom event from ChatProvider
    const onCustom = (e: any) => setChatUnread(e.detail ?? 0);
    window.addEventListener('chat:unread' as any, onCustom);
    return () => { clearInterval(id); window.removeEventListener('storage', onStorage); window.removeEventListener('chat:unread' as any, onCustom); };
  }, [pathname]);

  useEffect(() => {
    const u = localStorage.getItem('onehr_user');
    if (u) try { setUser(JSON.parse(u)); } catch {}
    else setUser(null);
    // Load branding for logo
    try {
      const b = localStorage.getItem('onehr_branding');
      if (b) setBranding(JSON.parse(b));
      else {
        const t = localStorage.getItem('onehr_token');
        const userObj = u ? JSON.parse(u) : null;
        const orgId = userObj?.org_id || userObj?.organizationId;
        if (t && orgId) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'}/organizations/${orgId}/branding`, { headers: { Authorization: `Bearer ${t}` } })
            .then(r => r.json()).then(b => { if (b && !b.error) { setBranding(b); localStorage.setItem('onehr_branding', JSON.stringify(b)); } }).catch(()=>{});
        }
      }
    } catch {}
  }, [pathname]);

  const visible = (roles?: string[]) => !roles || !role || roles.includes(role) || ['org_admin','super_admin'].includes(role);

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-[280px]'} shrink-0 sticky top-0 h-[100dvh] flex flex-col transition-all duration-300 z-20`}>
      <div className="h-[100dvh] m-3 rounded-[20px] glass-dark text-white flex flex-col overflow-hidden shadow-[0_16px_48px_rgba(2,6,23,0.22)]">
        <div className="h-[64px] flex items-center px-4 shrink-0 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-lg">
            {branding?.logoUrl ? <img src={branding.logoUrl} alt="logo" className="w-full h-full object-contain p-1" /> : <img src="/logo.svg" alt="OneHR" className="w-full h-full object-contain p-1" />}
          </div>
          {!collapsed && <div className="ml-3 leading-tight"><div className="font-bold tracking-tight">{branding?.watermarkText || 'OneHR'}</div><div className="text-[11px] text-white/60 -mt-1">RecruitConnect</div></div>}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto w-7 h-7 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center">
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6 scrollbar-thin">
          {NAV.map(sec => (
            <div key={sec.title}>
              {!collapsed && <div className="px-3 mb-2 text-[10px] tracking-[0.14em] font-semibold text-white/50">{sec.title}</div>}
              <div className="space-y-1">
                {sec.items.filter(i => visible(i.roles)).map(item => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  const isChat = item.href === '/chat';
                  const chatBadge = isChat && chatUnread > 0 ? String(chatUnread > 99 ? '99+' : chatUnread) : null;
                  const badge = chatBadge || item.badge;
                  const badgeClass = isChat && chatBadge ? 'bg-emerald-500 text-white' : 'bg-white/15';
                  return (
                    <Link key={item.href+item.label} href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-white text-slate-900 shadow-[0_4px_16px_rgba(255,255,255,0.15)]' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                      title={collapsed ? `${item.label}${chatBadge ? ` (${chatBadge})` : ''}` : undefined}
                    >
                      <span className="relative">
                        <Icon size={18} className={active ? 'text-slate-900' : 'text-white/80'} />
                        {collapsed && chatBadge && <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 text-[10px] leading-none rounded-full bg-red-500 text-white flex items-center justify-center font-bold">{chatBadge}</span>}
                      </span>
                      {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                      {!collapsed && badge && <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${badgeClass} ${active && !isChat ? 'bg-slate-900 text-white' : ''}`}>{badge}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/10">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'HR'}`} className="w-8 h-8 rounded-full bg-white" alt="" />
            {!collapsed && <div className="min-w-0"><div className="text-sm font-medium truncate">{user?.role || 'HR Admin'}</div><div className="text-xs text-white/60 truncate">{user?.email || 'hr@recruitconnect.ng'}</div></div>}
          </div>
          <button onClick={() => { localStorage.clear(); document.cookie='onehr_auth=; Max-Age=0; path=/'; document.cookie='onehr_token=; Max-Age=0; path=/'; window.location.href='/login'; }} className="mt-2 flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/10">
            <LogOut size={18} />{!collapsed && 'Logout'}
          </button>
        </div>
      </div>
    </aside>
  );
}
