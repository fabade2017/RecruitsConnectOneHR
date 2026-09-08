'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, UserPlus, Clock, CalendarCheck, Timer, Briefcase, Wallet, TrendingUp, GraduationCap, Heart, ShieldCheck, FileText, Boxes, ArrowUpCircle, UserMinus, Users2, Scale, Headset, BarChart3, Brain, Workflow, Plug, Settings,
  MapPin, AlertTriangle, Building2, ChevronLeft, ChevronRight, LogOut, Sparkles, Layers, MessageCircle, CreditCard
} from 'lucide-react';

type NavSection = { title: string; items: { href: string; label: string; icon: any; badge?: string; roles?: string[]; perms?: string[]; module?: string }[] };

const NAV: NavSection[] = [
  { title: 'OVERVIEW', items: [
    { href: '/chat', label: 'Chat', icon: MessageCircle, perms:['employee:read'], module:'chat' },
    { href: '/hr', label: 'Command Center', icon: LayoutDashboard, roles: ['hr_admin','org_admin','hr_manager','super_admin'], perms:['attendance:read'], module:'attendance' },
    { href: '/executive', label: 'Executive', icon: Building2, roles: ['executive','org_admin','super_admin'], perms:['analytics:read'] },
    { href: '/manager', label: 'My Team', icon: Users2, roles: ['manager','hr_admin','org_admin','super_admin'], perms:['employee:read'] },
    { href: '/employee', label: 'Home', icon: LayoutDashboard, roles: ['employee','manager','hr_admin','org_admin','super_admin'], perms:['employee:read:self'] },
  ]},
  { title: 'MANAGE PEOPLE', items: [
    { href: '/employees', label: 'People', icon: Users, badge: 'ID', roles:['hr_admin','org_admin','hr_manager','manager','super_admin'], perms:['employee:read'], module:'people' },
    { href: '/id-cards', label: 'ID Cards', icon: CreditCard, badge: 'QR', roles:['hr_admin','org_admin','hr_manager','manager','super_admin','employee'], perms:['employee:read'], module:'people' },
    { href: '/recruitment', label: 'Recruitment / ATS', icon: UserPlus, roles:['hr_admin','org_admin','recruiter','super_admin'], perms:['job:*'], module:'recruitment' },
    { href: '/onboarding', label: 'Onboarding', icon: ArrowUpCircle, roles:['hr_admin','org_admin','super_admin'], perms:['employee:*'], module:'onboarding' },
    { href: '/documents', label: 'Documents', icon: FileText, perms:['document:read'], module:'documents' },
    { href: '/assets', label: 'Assets', icon: Boxes, roles:['hr_admin','org_admin','super_admin'], perms:['employee:read'], module:'assets' },
  ]},
  { title: 'MANAGE WORK', items: [
    { href: '/attendance', label: 'Attendance', icon: Clock, perms:['attendance:read'], module:'attendance' },
    { href: '/shifts', label: 'Shifts & Rosters', icon: CalendarCheck, roles:['hr_admin','org_admin','hr_manager','manager','super_admin'], perms:['shift:*'], module:'shifts' },
    { href: '/leave', label: 'Leave', icon: CalendarCheck, perms:['leave:read'], module:'leave' },
    { href: '/projects', label: 'Tasks & Projects', icon: Briefcase, perms:['task:read'], module:'tasks' },
  ]},
  { title: 'MEASURE', items: [
    { href: '/performance', label: 'Performance', icon: TrendingUp, roles:['hr_admin','org_admin','manager','super_admin'], perms:['employee:read'], module:'performance' },
    { href: '/learning', label: 'Learning', icon: GraduationCap, perms:['learning:read'], module:'learning' },
    { href: '/engagement', label: 'Engagement', icon: Heart, roles:['hr_admin','org_admin','super_admin'], perms:['engagement:respond'], module:'engagement' },
    { href: '/payroll', label: 'Payroll', icon: Wallet, roles:['hr_admin','org_admin','super_admin'], perms:['payroll:read'], module:'payroll' },
    { href: '/compliance', label: 'Compliance', icon: ShieldCheck, roles:['hr_admin','org_admin','auditor','super_admin'], perms:['compliance:read'], module:'compliance' },
    { href: '/reports', label: 'Reports', icon: BarChart3, roles:['executive','hr_admin','org_admin','auditor','super_admin'], perms:['report:read'], module:'reporting' },
    { href: '/hr', label: 'Live Map', icon: MapPin, roles:['hr_admin','org_admin','super_admin'], perms:['attendance:read'], module:'attendance' },
    { href: '/hr', label: 'Exceptions', icon: AlertTriangle, badge: '17', roles:['hr_admin','org_admin','super_admin'], perms:['attendance:*'], module:'attendance' },
  ]},
  { title: 'PREDICT', items: [
    { href: '/analytics', label: 'People Analytics', icon: BarChart3, roles:['executive','hr_admin','org_admin','super_admin'], perms:['analytics:read'], module:'analytics' },
    { href: '/ai-copilot', label: 'AI Copilot', icon: Sparkles, perms:['employee:read'], module:'ai_copilot' },
    { href: '/intelligence', label: 'Intelligence', icon: Brain, roles:['executive','hr_admin','org_admin','super_admin'], perms:['analytics:read'], module:'workforce_intelligence' },
  ]},
  { title: 'SYSTEM', items: [
      { href: '/subscriptions', label: 'Subscription', icon: CreditCard, roles:['org_admin','super_admin'], perms:['employee:read'], module:'administration' },
      { href: '/audit', label: 'Audit Trail', icon: ShieldCheck, roles:['auditor','hr_admin','org_admin','super_admin'], perms:['audit:read'], module:'administration' },
      { href: '/workflows', label: 'Automation', icon: Workflow, roles:['hr_admin','org_admin','super_admin'], perms:['workflow:*'], module:'workflow' },
      { href: '/integrations', label: 'Integrations', icon: Plug, roles:['org_admin','super_admin'], perms:['employee:read'], module:'integrations' },
      { href: '/settings', label: 'Administration', icon: Settings, roles:['org_admin','super_admin','hr_admin'], perms:['employee:*'], module:'administration' },
      { href: '/settings/dropdowns', label: 'Dropdowns', icon: Layers, roles:['org_admin','super_admin','hr_admin'], perms:['employee:*'], module:'administration' },
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
  const [allowedModules, setAllowedModules] = useState<Set<string> | null>(null);
  const role = user?.role || null;
  const userPerms: string[] = (user as any)?.permissions || [];

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
    // Load allowed modules from subscription (module guard)
    try {
      const t = localStorage.getItem('onehr_token');
      const userObj = u ? JSON.parse(u) : null;
      const orgId = userObj?.org_id || userObj?.organizationId;
      if (t && orgId) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'}/organizations/${orgId}/subscription`, { headers: { Authorization: `Bearer ${t}` } as any })
          .then(r => r.json()).then(s => {
            const mods = s?.plan?.modules || s?.modules || [];
            if (Array.isArray(mods) && mods.length) setAllowedModules(new Set(mods.filter((m:any)=>m.enabled).map((m:any)=>m.moduleKey)));
            else setAllowedModules(null);
          }).catch(()=> setAllowedModules(null));
      }
    } catch {}
  }, [pathname]);

  const hasPerm = (required?: string[]) => {
    if (!required || !required.length) return true;
    if (!userPerms.length) return true; // if no perms in JWT, fallback to role check
    if (userPerms.includes('*')) return true;
    return required.every(perm => {
      if (userPerms.includes(perm)) return true;
      return userPerms.some(p => {
        if (p.endsWith(':*')) return perm.startsWith(p.replace(':*', ':'));
        if (perm.endsWith(':*')) return p.startsWith(perm.replace(':*', ':'));
        return p.split(':').slice(0,2).join(':') === perm.split(':').slice(0,2).join(':');
      });
    });
  };
  const visible = (roles?: string[], perms?: string[], module?: string) => {
    // super_admin/org_admin bypass all
    if (role === 'super_admin' || role === 'org_admin') return true;
    if (roles && roles.length && role && !roles.includes(role)) return false;
    if (roles && roles.length && !role) return false;
    if (perms && !hasPerm(perms)) return false;
    if (module && allowedModules && !allowedModules.has(module)) return false;
    // if no roles/perms/module specified, hide from employee (core RBAC)
    if (!roles && !perms && !module) return false;
    if (!roles && role === 'employee' && perms) return hasPerm(perms);
    return true;
  };

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
                {sec.items.filter(i => visible(i.roles, i.perms, i.module)).map(item => {
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
