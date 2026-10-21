import Link from 'next/link';
import { ArrowRight, Home, LifeBuoy } from 'lucide-react';

export const metadata = {
  title: 'Page not found — OneHR',
  description: 'That page does not exist. Get back to RecruitConnect OneHR.',
};

export default function NotFound() {
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
            <Link href="/industries" className="hover:text-slate-900">Industries</Link>
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/#contact" className="hover:text-slate-900">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium">Login</Link>
            <Link href="/register" className="bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-violet-50/40" />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8 py-24 text-center">
          <div className="text-7xl font-black bg-gradient-to-r from-violet-600 to-sky-600 bg-clip-text text-transparent">404</div>
          <h1 className="text-3xl lg:text-4xl font-black mt-4">This page has gone off payroll</h1>
          <p className="text-slate-600 mt-4 leading-7">
            The page you asked for does not exist — it may have been moved, renamed, or the link was
            copied with a typo. Payroll would have flagged it by now.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/" className="bg-slate-900 text-white rounded-full px-6 py-3 font-semibold inline-flex items-center gap-2">
              <Home size={16} /> Back to home
            </Link>
            <Link href="/industries" className="bg-white border rounded-full px-6 py-3 font-semibold inline-flex items-center gap-2">
              Browse industries <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="bg-white border rounded-full px-6 py-3 font-semibold inline-flex items-center gap-2">
              <LifeBuoy size={16} /> Talk to us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
