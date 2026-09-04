'use client';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ContactPage() {
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
            <Link href="/#pricing" className="hover:text-slate-900">Pricing</Link>
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/contact" className="text-slate-900 font-semibold">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium">Login</Link>
            <Link href="/register" className="bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-50 to-violet-50/30 border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-black">Contact us</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">Talk to sales, book a 15-min demo, or ask about migrating from your current HRIS/payroll. We reply within 1 business day (Lagos WAT).</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-10 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <form onSubmit={e=>{e.preventDefault(); const fd=new FormData(e.target as HTMLFormElement); alert(`Thanks ${fd.get('name')} — we will contact you at ${fd.get('email')}`);}} className="bg-white rounded-2xl border p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm font-medium">Full name<input name="name" required placeholder="Aisha Bello" className="w-full mt-1 px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500"/></label>
              <label className="text-sm font-medium">Work email<input name="email" type="email" required placeholder="you@company.com" className="w-full mt-1 px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500"/></label>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm font-medium">Company<input name="company" placeholder="Sterling Bank" className="w-full mt-1 px-3 py-2.5 rounded-xl border"/></label>
              <label className="text-sm font-medium">Team size<select className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white"><option>50–200</option><option>200–1000</option><option>1000+</option></select></label>
            </div>
            <label className="text-sm font-medium">How can we help?<textarea name="message" rows={4} placeholder="Tell us about your workforce, current HRIS, and what you want to solve..." className="w-full mt-1 px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500"/></label>
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" required/> I agree to Privacy & Terms. Data hosted on MSSQL with retention controls.</label>
            <button className="w-full bg-slate-900 text-white rounded-full py-3 font-semibold hover:bg-slate-800 flex items-center justify-center gap-2">Send message <ArrowRight size={16}/></button>
            <p className="text-xs text-center text-slate-500">Or email directly: <a href="mailto:hello@recruitconnect.ng" className="underline">hello@recruitconnect.ng</a></p>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6">
            <h3 className="font-bold">Book a demo — 15 min</h3>
            <p className="text-sm text-white/60 mt-1">Live walkthrough of HR Command Center, smart clocking and payroll.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><Clock size={16}/> Mon–Fri 9am–5pm WAT</div>
              <div className="flex items-center gap-2"><Phone size={16}/> +234 800 123 4567</div>
              <div className="flex items-center gap-2"><Mail size={16}/> hello@recruitconnect.ng</div>
              <div className="flex items-center gap-2"><MapPin size={16}/> Victoria Island, Lagos • Remote</div>
            </div>
            <a href="https://calendly.com" target="_blank" className="mt-4 inline-flex bg-white text-slate-900 rounded-full px-5 py-2.5 text-sm font-semibold">Open Calendly →</a>
          </div>

          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-semibold flex items-center gap-2"><MessageSquare size={18}/> Other ways</h3>
            <div className="mt-3 space-y-3 text-sm">
              <a href="https://wa.me/2348001234567" className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"><span className="font-medium">WhatsApp</span><span className="text-emerald-700">+234 800 123 4567 →</span></a>
              <a href="mailto:support@recruitconnect.ng" className="flex items-center justify-between bg-slate-50 border rounded-xl px-4 py-3"><span>Support</span><span className="text-slate-600">support@ →</span></a>
              <div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} className="text-emerald-600"/> ISO-ready • RLS • Audit logs • 90-day retention</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-sky-50 rounded-2xl border p-6">
            <h3 className="font-semibold">Visit us</h3>
            <div className="mt-3 h-[160px] rounded-xl bg-white border flex items-center justify-center text-slate-400 text-sm">
              <span className="flex items-center gap-2"><MapPin size={16}/> Map — Victoria Island, Lagos (mock)</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">4th Floor, Mulliner Tower, Alfred Rewane Road, Ikoyi, Lagos.</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-10">
        <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="font-bold">Prefer to try yourself?</h3>
            <p className="text-sm text-white/60">Use demo logins — no setup.</p>
            <div className="mt-2 font-mono text-xs bg-white/10 rounded-xl p-3">
              <div>admin@recruitconnect.ng / Admin@123 (org_admin)</div>
              <div>superadmin@recruitconnect.ng / Super@123 (super_admin)</div>
            </div>
          </div>
          <div className="flex gap-3 self-start">
            <Link href="/login" className="bg-white text-slate-900 rounded-full px-6 py-3 font-semibold">Go to login</Link>
            <Link href="/register" className="bg-white/10 border border-white/20 rounded-full px-6 py-3 font-semibold">Create workspace</Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex justify-between text-xs text-white/50">
          <span>© 2026 RecruitConnect • <Link href="/" className="hover:text-white">Home</Link> • <Link href="/about" className="hover:text-white">About</Link></span>
          <span>hello@recruitconnect.ng • +234 800 123 4567</span>
        </div>
      </footer>
    </main>
  );
}
