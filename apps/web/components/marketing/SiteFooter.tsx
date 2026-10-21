import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="OneHR" className="w-9 h-9 rounded-xl shadow bg-white p-1" />
            <div className="font-bold">RecruitConnect OneHR™</div>
          </div>
          <p className="text-sm text-white/60 mt-2 leading-6">
            Payroll you can trust. Attendance you can prove. HR in one place — built for African businesses.
          </p>
          <div className="mt-4 flex gap-2">
            <a href="https://wa.me/2348001234567" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20" aria-label="WhatsApp">W</a>
            <a href="https://github.com" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20" aria-label="LinkedIn">in</a>
            <a href="https://github.com" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20" aria-label="X">𝕏</a>
            <a href="mailto:hello@recruitconnect.ng" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20" aria-label="Email"><Mail size={14} /></a>
          </div>
        </div>
        <div>
          <div className="font-semibold">Product</div>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li><Link href="/#features" className="hover:text-white">Features</Link></li>
            <li><Link href="/#tour" className="hover:text-white">Product tour</Link></li>
            <li><Link href="/#roi" className="hover:text-white">ROI calculator</Link></li>
            <li><Link href="/#pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/#migration" className="hover:text-white">Switch to OneHR</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Industries</div>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li><Link href="/industries/banking" className="hover:text-white">Banking</Link></li>
            <li><Link href="/industries/hospitals" className="hover:text-white">Hospitals</Link></li>
            <li><Link href="/industries/schools" className="hover:text-white">Schools</Link></li>
            <li><Link href="/industries/manufacturing" className="hover:text-white">Manufacturing</Link></li>
            <li><Link href="/industries/retail" className="hover:text-white">Retail</Link></li>
            <li><Link href="/industries/ngo" className="hover:text-white">NGO</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Company</div>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/#contact" className="hover:text-white">Contact Us</Link></li>
            <li><Link href="/login" className="hover:text-white">HR Login</Link></li>
            <li><Link href="/employee-login" className="hover:text-white">Employee Login</Link></li>
            <li><Link href="/register" className="hover:text-white">Start free trial</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between gap-2 text-xs text-white/50">
          <span>© 2026 RecruitConnect OneHR™ — Built for Africa, ready for global.</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> All systems operational</span>
        </div>
      </div>
    </footer>
  );
}
