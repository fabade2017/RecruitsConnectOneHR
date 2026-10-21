'use client';
import Link from 'next/link';
import { useState } from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { industries, industryBySlug } from '../../lib/industries';
import {
  ArrowRight, ArrowUpRight, Building2, Check, GraduationCap, HeartHandshake, Layers,
  Briefcase, Quote, Star, ShieldCheck, Zap, Fingerprint, Sparkles,
} from 'lucide-react';

const ICONS: Record<string, any> = {
  banking: Building2,
  schools: GraduationCap,
  hospitals: HeartHandshake,
  manufacturing: Layers,
  retail: Briefcase,
  ngo: HeartHandshake,
};

export default function IndustryPage({ slug }: { slug: string }) {
  const industry = industryBySlug(slug);
  const [open, setOpen] = useState<string | null>(null);

  if (!industry) {
    return (
      <main className="min-h-screen bg-white flex flex-col">
        <SiteHeader />
        <div className="flex-1 max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="text-3xl font-black">Industry not found</h1>
          <p className="text-slate-600 mt-2">Pick a sector below and we will show you how OneHR fits it.</p>
          <Link href="/industries" className="mt-6 inline-flex bg-slate-900 text-white rounded-full px-6 py-3 font-semibold">All industries</Link>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const Icon = ICONS[industry.icon];
  const others = industries.filter(i => i.slug !== industry.slug);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50/60" />
        <div className="absolute -top-32 -right-24 w-[600px] h-[600px] bg-gradient-to-br from-violet-200 to-sky-200 rounded-full blur-3xl opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link href="/industries" className="hover:text-slate-900">Industries</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{industry.name}</span>
          </div>

          <div className="mt-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-3 py-1.5 text-xs font-medium">
              <Icon size={14} /> {industry.name}
            </div>
            <h1 className="text-4xl lg:text-[52px] font-black leading-[1.05] tracking-tight mt-5">{industry.headline}</h1>
            <p className="text-slate-600 mt-4 text-[17px] leading-7 max-w-2xl">{industry.subheadline}</p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link href="/register" className="bg-slate-900 text-white rounded-full px-7 py-4 font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-800">
                Start free — 14 days <ArrowRight size={18} />
              </Link>
              <Link href="/#contact" className="bg-white border rounded-full px-7 py-4 font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50">
                Book a 15-min demo
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-3">No card required • Prices in naira • Migrate from Excel in 48 hours</p>
          </div>

          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {industry.outcomes.map(o => (
              <div key={o.k} className="bg-white rounded-2xl border p-5">
                <div className="text-xl lg:text-2xl font-black">{o.v}</div>
                <div className="text-sm font-semibold mt-1">{o.k}</div>
                <div className="text-xs text-slate-500 mt-0.5">{o.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHALLENGES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="max-w-2xl">
          <div className="text-xs tracking-widest font-semibold text-violet-600">THE PROBLEM</div>
          <h2 className="text-3xl font-black mt-1">What actually breaks in {industry.name.toLowerCase()}</h2>
          <p className="text-slate-600 mt-2">These are the four issues our customers in this sector told us about first.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {industry.challenges.map(c => (
            <div key={c.title} className="bg-white rounded-2xl border p-6">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-sm">!</div>
              <h3 className="font-bold mt-3">{c.title}</h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-6">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUTIONS */}
      <section className="bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <div className="max-w-2xl">
            <div className="text-xs tracking-widest font-semibold text-emerald-600">THE FIX</div>
            <h2 className="text-3xl font-black mt-1">OneHR, configured for {industry.name.toLowerCase()}</h2>
            <p className="text-slate-600 mt-2">Turn these on at go-live. Most teams start with payroll and attendance and add the rest after week one.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            {industry.solutions.map(s => (
              <div key={s.title} className="bg-white rounded-2xl border p-6">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Check size={18} /></div>
                <h3 className="font-bold mt-3">{s.title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-6">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600" /> ISO 27001-ready</div>
            <div className="flex items-center gap-2"><Zap size={18} className="text-amber-500" /> 99.9% uptime</div>
            <div className="flex items-center gap-2"><Fingerprint size={18} className="text-violet-600" /> Privacy-first</div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      {industry.proof && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <div className="bg-slate-900 text-white rounded-2xl p-8 grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <Quote className="text-white/20" />
              <p className="text-xl lg:text-2xl leading-relaxed mt-2 font-medium">“{industry.proof.quote}”</p>
              <div className="flex items-center gap-3 mt-5">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${industry.proof.name.replace(/\s/g, '')}`} alt="" className="w-11 h-11 rounded-full bg-white/10" />
                <div>
                  <div className="font-bold">{industry.proof.name}</div>
                  <div className="text-xs text-white/60">{industry.proof.role} · {industry.proof.org}</div>
                </div>
              </div>
            </div>
            <div className="lg:text-right">
              <div className="flex gap-1 text-amber-400 lg:justify-end">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} className="fill-amber-400" />)}
              </div>
              <Link href="/#contact" className="mt-4 inline-flex bg-white text-slate-900 rounded-full px-6 py-3 font-semibold items-center gap-2">
                Get the same result <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* OTHER INDUSTRIES */}
      <section className="bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <h2 className="text-xl font-black">OneHR for other sectors</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {others.map(o => {
              const OIcon = ICONS[o.icon];
              return (
                <Link key={o.slug} href={`/industries/${o.slug}`} className="bg-white rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition group">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><OIcon size={16} /></div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{o.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{o.short}</div>
                  </div>
                  <ArrowUpRight size={16} className="ml-auto text-slate-400 shrink-0 group-hover:text-slate-900" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="bg-gradient-to-br from-violet-600 to-sky-600 rounded-2xl p-8 lg:p-12 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold">
              <Sparkles size={13} /> Free for 14 days
            </div>
            <h3 className="text-3xl font-black mt-3">Ready to see OneHR for {industry.name.toLowerCase()}?</h3>
            <p className="text-white/80 mt-2">
              Bring your current payroll export and we will show you the switch, the timeline and the numbers — before you commit to anything.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/register" className="bg-white text-slate-900 rounded-full px-6 py-3.5 font-semibold text-center">Start free</Link>
            <Link href="/#contact" className="bg-white/15 border border-white/25 rounded-full px-6 py-3.5 font-semibold text-center">Talk to sales</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
