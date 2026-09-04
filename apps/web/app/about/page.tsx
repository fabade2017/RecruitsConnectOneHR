import Link from 'next/link';
import { Users, Target, HeartHandshake, Building2, Award, Globe, ShieldCheck, Sparkles, TrendingUp, GraduationCap, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="OneHR" className="w-9 h-9 rounded-xl shadow" />
            <span className="font-bold">RecruitConnect OneHR™</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/#features" className="hover:text-slate-900">Features</Link>
            <Link href="/#solutions" className="hover:text-slate-900">Solutions</Link>
            <Link href="/about" className="text-slate-900 font-semibold">About</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium">Login</Link>
            <Link href="/register" className="bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-violet-50/40" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <div className="inline-flex bg-violet-50 text-violet-700 rounded-full px-3 py-1 text-xs font-semibold">OUR STORY</div>
            <h1 className="text-4xl font-black leading-tight mt-3">We’re building the <span className="bg-gradient-to-r from-violet-600 to-sky-600 bg-clip-text text-transparent">Workforce Operating System</span> for Africa.</h1>
            <p className="text-slate-600 mt-4 leading-7">RecruitConnect started as a recruitment agency in Lagos. We saw the same pain everywhere: spreadsheets for people, WhatsApp for leave, Excel for payroll, and no single truth for “what is happening right now?”. OneHR is our answer — an Intelligent Workforce OS that merges people, work, time and prediction, secure and audit-ready by design.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/register" className="bg-slate-900 text-white rounded-full px-6 py-3 font-semibold inline-flex items-center gap-2">Join 120+ teams <ArrowRight size={16}/></Link>
              <Link href="/contact" className="bg-white border rounded-full px-6 py-3 font-semibold">Talk to founders</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-6">
        {[
          { icon: Target, title: 'Mission', desc: 'Make workforce intelligence as accessible as payroll — for every team from 50 to 10,000.' },
          { icon: HeartHandshake, title: 'Values', desc: 'Privacy-first, consent-based, no auto-accusations. Flag for review, not punish.' },
          { icon: Globe, title: 'Vision', desc: 'From Lagos to global: industry templates, group-of-companies, NGN + multi-currency.' },
        ].map(c=> <div key={c.title} className="bg-white rounded-2xl border p-6"><div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><c.icon size={18}/></div><h3 className="font-bold mt-3">{c.title}</h3><p className="text-sm text-slate-600 mt-1 leading-6">{c.desc}</p></div>)}
      </section>

      <section className="bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-black text-center">By the numbers</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {[
              {k:'Teams', v:'120+', sub:'Across 6 industries'},
              {k:'Employees', v:'12k+', sub:'Under management'},
              {k:'Modules', v:'20+', sub:'From hire to alumni'},
              {k:'Uptime', v:'99.9%', sub:'Enterprise-grade'},
            ].map(s=> <div key={s.k} className="bg-white rounded-2xl border p-6 text-center"><div className="text-3xl font-black">{s.v}</div><div className="font-semibold">{s.k}</div><div className="text-xs text-slate-500">{s.sub}</div></div>)}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-black">Leadership</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {[
            {n:'Femi Adeyemi', r:'Founder & CEO', b:'Ex-Andela, Sterling Bank CHRO advisor'},
            {n:'Dr. Sarah Okonkwo', r:'CPO', b:'IO Psychology, University of Lagos'},
            {n:'Tunde Martins', r:'CTO', b:'Ex-Flutterwave, Platform Engineering'},
          ].map(p=> <div key={p.n} className="bg-white rounded-2xl border p-6 flex gap-4"><img src={`https://api.dicebear.com/7.x/initials/svg?seed=${p.n}`} alt="" className="w-12 h-12 rounded-full bg-slate-100"/><div><div className="font-bold">{p.n}</div><div className="text-xs text-violet-600 font-semibold">{p.r}</div><div className="text-xs text-slate-500 mt-1">{p.b}</div></div></div>)}
        </div>
        <div className="mt-8 bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="font-bold">Work at RecruitConnect?</h3>
            <p className="text-sm text-white/60">We’re hiring for engineering, HR success and partnerships.</p>
          </div>
          <Link href="/recruitment" className="bg-white text-slate-900 rounded-full px-6 py-3 font-semibold self-start">View openings →</Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-br from-violet-600 to-sky-600 rounded-2xl p-8 text-white flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black">Ready to see OneHR live?</h3>
            <p className="text-white/80 text-sm mt-1">14-day free trial • No card • NGN pricing</p>
          </div>
          <div className="flex gap-3 self-start">
            <Link href="/register" className="bg-white text-slate-900 rounded-full px-6 py-3 font-semibold">Get started</Link>
            <Link href="/contact" className="bg-white/15 border border-white/20 rounded-full px-6 py-3 font-semibold">Contact sales</Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex justify-between text-xs text-white/50">
          <span>© 2026 RecruitConnect • Lagos • hello@recruitconnect.ng</span>
          <span className="flex gap-4"><Link href="/" className="hover:text-white">Home</Link><Link href="/contact" className="hover:text-white">Contact</Link><Link href="/login" className="hover:text-white">Login</Link></span>
        </div>
      </footer>
    </main>
  );
}
