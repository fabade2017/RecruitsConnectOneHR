'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ContactForm from '../components/ContactForm';
import AvaWidget from '../components/AvaWidget';
import { Users, Clock, ShieldCheck, Sparkles, TrendingUp, GraduationCap, Wallet, Building2, Check, ArrowRight, Star, Quote, MapPin, Phone, Mail, Play, Zap, Fingerprint, BarChart3, Layers, HeartHandshake, Briefcase, Shield, Menu, X, LogOut } from 'lucide-react';

function AuthNav() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const t = localStorage.getItem('onehr_token');
    const u = localStorage.getItem('onehr_user');
    if (t && u) try { setUser(JSON.parse(u)); } catch {}
  }, []);
  const logout = () => { localStorage.clear(); document.cookie='onehr_auth=; Max-Age=0; path=/'; document.cookie='onehr_token=; Max-Age=0; path=/'; window.location.href='/login'; };
  if (user) {
    const dash = user.role==='super_admin'?'/admin': user.role==='employee'?'/employee': user.role==='manager'?'/manager': user.role==='executive'?'/executive':'/hr';
    return (
      <div className="flex items-center gap-3">
        <span className="hidden lg:inline text-xs bg-slate-100 rounded-full px-3 py-1.5">{user.email} • {user.role}</span>
        <Link href={dash} className="hidden md:inline text-sm font-medium text-slate-700 hover:text-slate-900">Dashboard</Link>
        <button onClick={logout} className="bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 flex items-center gap-2"><LogOut size={14}/> Logout</button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="hidden md:inline text-sm font-medium text-slate-700 hover:text-slate-900">Login</Link>
      <Link href="/register" className="bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 flex items-center gap-2">Get Started <ArrowRight size={16}/></Link>
    </div>
  );
}

const features = [
  { icon: Users, title: 'Manage People', desc: 'Hire → Onboard → Develop → Offboard → Alumni. 25+ fields, QR ID, lifecycle & skills passport.', color: 'from-slate-900 to-slate-700', href: '/employees' },
  { icon: Clock, title: 'Smart Clocking', desc: '7 methods: Mobile, Web, QR, Biometric, Facial (98%), NFC, API. GPS opt-in, fraud flags.', color: 'from-emerald-500 to-teal-600', href: '/attendance' },
  { icon: BarChart3, title: 'Measure Workforce', desc: '6 health indicators → HR Health 89/100. Activity ≠ productivity. Attendance, performance, learning.', color: 'from-violet-500 to-purple-600', href: '/analytics' },
  { icon: Sparkles, title: 'Predict What’s Next', desc: 'AI Copilot, attrition risk, digital twin & simulator. What if salary +10%? Open 5 branches?', color: 'from-amber-500 to-orange-600', href: '/ai-copilot' },
];

const modules = [
  'People', 'Attendance', 'Shifts', 'Leave', 'Payroll', 'Performance', 'Learning', 'Recruitment', 'Documents', 'Assets', 'Projects', 'Workflows', 'Analytics', 'Compliance', 'Engagement', 'AI Copilot'
];

const industries = [
  { name: 'Banking', icon: Building2, desc: 'KYC, shifts, compliance' },
  { name: 'Schools', icon: GraduationCap, desc: 'Academic calendar, leave' },
  { name: 'Hospitals', icon: HeartHandshake, desc: '24h shifts, rosters' },
  { name: 'Manufacturing', icon: Layers, desc: 'Overtime, safety certs' },
  { name: 'Retail', icon: Briefcase, desc: 'Multi-branch, field' },
  { name: 'NGO', icon: HeartHandshake, desc: 'Volunteers, grants' },
];

const testimonials = [
  { name: 'Aisha Bello', role: 'CHRO, Sterling Bank', text: 'OneHR cut our payroll errors by 92% and gave us real-time visibility across 48 branches. HR Health is our new board metric.', stars: 5 },
  { name: 'Dr. Emeka Okafor', role: 'Medical Director, Lagoon Hospitals', text: '24h rosters, facial clocking and exception flags stopped buddy-punching overnight. Audit-ready.', stars: 5 },
  { name: 'Funmi Adeyemi', role: 'CEO, EduBridge Academy', text: 'Onboarding to alumni in one place. Our managers finally answer “What is happening right now?”', stars: 5 },
];

const faqs = [
  { q: 'Is facial/GPS mandatory?', a: 'No. Both are optional, consent-based and retention-controlled (90 days). You choose per policy: standard, mobile, QR, etc.' },
  { q: 'How is fraud handled?', a: 'Never auto-accused. Flagged for review: device sharing, impossible travel, duplicate face → HR resolves.' },
  { q: 'Can we import existing payroll?', a: 'Yes. OneHRCon merged payroll (basic + allowances − deductions − tax) + simulator. Bank details via /payroll/bank/details.' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="OneHR Logo" className="w-9 h-9 rounded-xl shadow" />
            <div>
              <div className="font-bold leading-none">RecruitConnect OneHR™</div>
              <div className="text-[11px] tracking-widest text-slate-500">WORKFORCE INTELLIGENCE</div>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#solutions" className="hover:text-slate-900">Solutions</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#about" className="hover:text-slate-900">About</a>
            <a href="#contact" className="hover:text-slate-900">Contact</a>
          </nav>
          <AuthNav />
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50/60" />
        <div className="absolute -top-32 -right-32 w-[720px] h-[720px] bg-gradient-to-br from-violet-200 to-sky-200 rounded-full blur-3xl opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10 lg:pt-20 lg:pb-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-3 py-1.5 text-xs font-medium">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Trusted by 120+ teams • 4.9/5 rated
            </div>
            <h1 className="text-4xl lg:text-[52px] font-black leading-[0.95] tracking-tight mt-4">
              One Platform.<br />
              <span className="bg-gradient-to-r from-violet-600 to-sky-600 bg-clip-text text-transparent">Complete Workforce</span><br />
              Intelligence.
            </h1>
            <p className="text-slate-600 mt-4 text-[17px] leading-7 max-w-xl">
              Not just HRIS. An <b>Intelligent Workforce Operating System</b> that answers “<i>What is happening across your workforce right now?</i>” — people, work, time, performance & prediction.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href="/register" className="bg-slate-900 text-white rounded-full px-6 py-3.5 font-semibold inline-flex items-center gap-2 hover:bg-slate-800">Start free — 14 days <ArrowRight size={18}/></Link>
              <Link href="/login" className="bg-emerald-600 text-white rounded-full px-6 py-3.5 font-semibold inline-flex items-center gap-2 hover:bg-emerald-700"><Clock size={16}/> Employee Clock In</Link>
              <Link href="#contact" className="bg-white border rounded-full px-6 py-3.5 font-semibold inline-flex items-center gap-2 hover:bg-slate-50"><Play size={16}/> Book demo (15 min)</Link>
              <span className="text-xs text-slate-500 self-center">No card • NGN pricing • MSSQL ready</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Employee? <Link href="/login" className="underline font-semibold">Login here</Link> → popup guides you to Attendance • Face + motion liveness</p>
            <div className="flex items-center gap-6 mt-8 text-sm">
              <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600"/> ISO 27001-ready</div>
              <div className="flex items-center gap-2"><Zap size={18} className="text-amber-500"/> 99.9% uptime</div>
              <div className="flex items-center gap-2"><Fingerprint size={18} className="text-violet-600"/> Privacy-first</div>
            </div>
            <div className="mt-8 flex items-center gap-3 text-xs text-slate-500">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i=> <img key={i} src={`https://api.dicebear.com/7.x/initials/svg?seed=${i}HR`} alt="" className="w-8 h-8 rounded-full border-2 border-white bg-slate-100"/>)}
              </div>
              <span>Trusted by <b>120+</b> teams • <span className="flex inline-flex gap-1"><Star size={12} className="fill-amber-400 text-amber-400"/>{4.9}/5 (214 reviews)</span></span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative">
            <div className="bg-slate-900 rounded-[24px] p-3 shadow-2xl">
              <div className="bg-white rounded-[16px] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs tracking-widest text-slate-500">WORKFORCE COMMAND CENTER • TODAY</div>
                  <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-1">HR Health 89/100</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {[
                    {k:'Employees',v:'1,245', c:'bg-slate-900 text-white'},
                    {k:'Clocked In',v:'1,067 • 86%', c:'bg-emerald-500 text-white'},
                    {k:'Exceptions',v:'17', c:'bg-red-500 text-white'},
                    {k:'On Leave',v:'84', c:'bg-sky-500 text-white'},
                  ].map(s=> <div key={s.k} className={`rounded-2xl p-3 ${s.c}`}><div className="text-[11px] opacity-80">{s.k}</div><div className="font-bold">{s.v}</div></div>)}
                </div>
                <div className="mt-4 h-[160px] rounded-2xl bg-gradient-to-br from-slate-50 to-violet-50 border flex items-center justify-center text-slate-400 text-sm">
                  <span className="flex items-center gap-2"><BarChart3 size={16}/> Attendance Trend • Health Radar • Branch Bar</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-xl p-2 text-center">Face 98% ✓</div>
                  <div className="bg-slate-50 rounded-xl p-2 text-center">GPS opt-in</div>
                  <div className="bg-slate-50 rounded-xl p-2 text-center">7 methods</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center"><ShieldCheck/></div>
              <div><div className="font-semibold text-sm">Verified clock-in</div><div className="text-xs text-slate-500">RC-000245 • Mobile • 08:02</div></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-6 flex flex-wrap gap-6 items-center text-xs text-slate-500 border-t mt-2 pt-6">
          <span className="font-semibold tracking-widest">TRUSTED BY</span>
          {['Sterling Bank','Lagoon Hospitals','EduBridge','Dangote Sugar','Flutterwave','Andela'].map(b=> <span key={b} className="font-medium">{b}</span>)}
        </div>
      </section>

      {/* 4 PILLARS */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex bg-violet-50 text-violet-700 rounded-full px-3 py-1 text-xs font-semibold">FOUR PILLARS</div>
          <h2 className="text-3xl font-black mt-3">Four pillars. One truth.</h2>
          <p className="text-slate-600 mt-2">Manage People → Manage Work → Measure → Predict. From hire to alumni, clock to payslip, review to AI copilot.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {features.map(f=> (
            <Link key={f.title} href={f.href} className="group bg-white rounded-2xl border p-5 hover:shadow-lg transition">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center`}><f.icon size={20}/></div>
              <h3 className="font-bold mt-3">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-1 leading-6">{f.desc}</p>
              <span className="text-xs font-semibold text-slate-900 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Explore <ArrowRight size={12}/></span>
            </Link>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {modules.map(m=> <span key={m} className="bg-slate-50 border rounded-full px-3 py-1.5 text-xs font-medium">{m}</span>)}
          <Link href="/admin" className="bg-slate-900 text-white rounded-full px-3 py-1.5 text-xs">+ 28 more →</Link>
        </div>
      </section>

      {/* SOLUTIONS BY INDUSTRY */}
      <section id="solutions" className="bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="text-xs tracking-widest font-semibold text-violet-600">INDUSTRY TEMPLATES §41</div>
              <h2 className="text-3xl font-black mt-1">Built for how you work</h2>
              <p className="text-slate-600 mt-1">Banking, schools, hospitals, manufacturing, retail, NGO, tech — each with shifts, compliance & workflows tuned.</p>
            </div>
            <Link href="/hr" className="hidden lg:inline bg-white border rounded-full px-5 py-2.5 text-sm font-semibold">See HR Command Center →</Link>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            {industries.map(i=> <div key={i.name} className="bg-white rounded-2xl p-5 border text-center hover:shadow-md transition"><div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto"><i.icon size={18}/></div><div className="font-semibold mt-2">{i.name}</div><div className="text-xs text-slate-500">{i.desc}</div></div>)}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <h2 className="text-3xl font-black text-center">Go live in 3 steps</h2>
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {[
            {n:'01', t:'Import & verify', d:'CSV + OneHRCon payroll merge. QR IDs, RLS per organization.'},
            {n:'02', t:'Clock & approve', d:'Mobile/QR/Facial clock, manager approves leave, HR resolves exceptions.'},
            {n:'03', t:'Measure & predict', d:'Health 89/100, simulator & copilot answer “what if?”'},
          ].map(s=> <div key={s.n} className="bg-white rounded-2xl border p-6"><div className="text-3xl font-black text-slate-200">{s.n}</div><div className="font-bold mt-1">{s.t}</div><div className="text-sm text-slate-600 mt-1">{s.d}</div></div>)}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Loved by HR, trusted by execs</h2>
            <span className="hidden md:inline bg-white/10 rounded-full px-3 py-1 text-xs">4.9/5 • 214 reviews</span>
          </div>
          <div className="grid lg:grid-cols-3 gap-5 mt-8">
            {testimonials.map(t=> <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-6"><div className="flex gap-1 text-amber-400">{Array.from({length:t.stars}).map((_,i)=><Star key={i} size={14} className="fill-amber-400"/>)}</div><Quote className="text-white/20 mt-3"/><p className="mt-2 leading-7">“{t.text}”</p><div className="mt-4 font-semibold">{t.name}</div><div className="text-xs text-white/60">{t.role}</div></div>)}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="text-center">
          <div className="inline bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold">NGN PRICING • MONTHLY</div>
          <h2 className="text-3xl font-black mt-2">Simple pricing. No surprises.</h2>
          <p className="text-slate-600 mt-1">Start free, scale to enterprise. 43 modules gating by subscription.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {[
            {name:'Starter', price:'₦50,000', sub:'50 emp • 3 branches', features:['People','Attendance','Leave','Shifts','Documents'], cta:'Start free', dark:false},
            {name:'Growth', price:'₦150,000', sub:'200 emp • 10 branches', features:['Everything in Starter','+ Payroll','+ Recruitment','+ Performance','+ Learning','+ Tasks'], cta:'Most popular', dark:true, badge:'POPULAR'},
            {name:'Enterprise', price:'₦400,000', sub:'1000 emp • 50 branches', features:['Everything in Growth','+ 45 modules','+ AI Copilot','+ Digital Twin','+ Simulator'], cta:'Contact sales', dark:false},
          ].map(p=> <div key={p.name} className={`rounded-[20px] p-6 border ${p.dark?'bg-slate-900 text-white border-slate-900':'bg-white'}`}><div className="flex items-center justify-between"><h3 className="font-black text-lg">{p.name}</h3>{p.badge && <span className="bg-emerald-500 text-white text-[11px] rounded-full px-2 py-1 font-bold">{p.badge}</span>}</div><div className="text-3xl font-black mt-2">{p.price}<span className="text-sm font-normal opacity-70">/mo</span></div><div className="text-xs opacity-70">{p.sub}</div><ul className="mt-4 space-y-2 text-sm">{p.features.map(f=> <li key={f} className="flex items-center gap-2"><Check size={14} className={p.dark?'text-emerald-400':'text-emerald-600'}/>{f}</li>)}</ul><Link href="/register" className={`mt-5 w-full inline-flex justify-center rounded-full py-3 font-semibold ${p.dark?'bg-white text-slate-900 hover:bg-slate-100':'bg-slate-900 text-white hover:bg-slate-800'}`}>{p.cta} <ArrowRight size={16}/></Link></div>)}
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">All plans include audit logs, secure access & support. Custom pricing for group of companies.</p>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-black">Questions? Answers.</h2>
            <div className="mt-6 space-y-4">
              {faqs.map(f=> <div key={f.q} className="bg-white rounded-2xl p-5 border"><div className="font-semibold">{f.q}</div><div className="text-sm text-slate-600 mt-1">{f.a}</div></div>)}
            </div>
          </div>
          <div id="about" className="bg-white rounded-2xl p-6 border">
            <h3 className="font-black text-lg">About RecruitConnect OneHR™</h3>
            <p className="text-sm text-slate-600 mt-2 leading-6">We’re building the Intelligent Workforce Operating System for Africa and beyond — from Lagos to global. OneHR merges people, work, time and intelligence so HR, managers and execs finally see the same truth.</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 rounded-xl p-3"><div className="font-black">120+</div><div className="text-xs text-slate-500">Teams</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><div className="font-black">12k+</div><div className="text-xs text-slate-500">Employees</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><div className="font-black">44</div><div className="text-xs text-slate-500">Modules</div></div>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <Link href="/login" className="bg-slate-900 text-white rounded-full px-4 py-2">Try demo</Link>
              <a href="https://github.com" className="glass rounded-full px-4 py-2">Docs →</a>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-black">Contact us</h2>
            <p className="text-slate-600 mt-1">Book a 15-min demo, or ask about migration from your current HRIS/payroll.</p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3"><Mail size={16} className="text-slate-900"/> hello@recruitconnect.ng</div>
              <div className="flex items-center gap-3"><Phone size={16} className="text-slate-900"/> +234 800 123 4567 (Lagos)</div>
              <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-900"/> Victoria Island, Lagos • Remote worldwide</div>
            </div>
            <div className="mt-6 flex gap-3">
              <a href="https://wa.me/2348001234567" className="bg-emerald-500 text-white rounded-full px-5 py-2.5 text-sm font-semibold">WhatsApp us</a>
              <a href="mailto:hello@recruitconnect.ng" className="glass rounded-full px-5 py-2.5 text-sm font-semibold">Email sales</a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="OneHR" className="w-9 h-9 rounded-xl shadow bg-white p-1" />
              <div className="font-bold">RecruitConnect OneHR™</div>
            </div>
            <p className="text-sm text-white/60 mt-2 leading-6">One Platform. Complete Workforce Intelligence. Manage people, manage work, measure and predict — secure, compliant and audit-ready.</p>
            <div className="mt-4 flex gap-2">
              <a href="https://github.com" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">in</a>
              <a href="https://github.com" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">𝕏</a>
              <a href="mailto:hello@recruitconnect.ng" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Mail size={14}/></a>
            </div>
          </div>
          <div>
            <div className="font-semibold">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="/hr" className="hover:text-white">HR Command Center</a></li>
              <li><a href="/attendance" className="hover:text-white">Smart Clocking</a></li>
              <li><a href="/payroll" className="hover:text-white">Payroll</a></li>
              <li><a href="/ai-copilot" className="hover:text-white">AI Copilot</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="#about" className="hover:text-white">About Us</a></li>
              <li><a href="#contact" className="hover:text-white">Contact Us</a></li>
              <li><a href="/login" className="hover:text-white">Login</a></li>
              <li><a href="/register" className="hover:text-white">Register</a></li>
              <li><a href="/admin" className="hover:text-white">Super Admin</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Legal</div>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">Docs PRD</a></li>
              <li><a href="#" className="hover:text-white">API Spec</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between gap-2 text-xs text-white/50">
            <span>© 2026 RecruitConnect OneHR™ — Built for Africa, ready for global.</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> All systems operational • API docs at /api/docs</span>
          </div>
        </div>
      </footer>
      <AvaWidget />
    </main>
  );
}
