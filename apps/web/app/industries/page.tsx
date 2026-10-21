import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '../../components/marketing/SiteHeader';
import SiteFooter from '../../components/marketing/SiteFooter';
import { industries } from '../../lib/industries';
import { ArrowRight, Building2, GraduationCap, HeartHandshake, Layers, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: 'OneHR for your industry | RecruitConnect OneHR',
  description: 'Payroll, attendance and HR built for banking, hospitals, schools, manufacturing, retail and NGOs.',
};

const ICONS: Record<string, any> = {
  banking: Building2,
  schools: GraduationCap,
  hospitals: HeartHandshake,
  manufacturing: Layers,
  retail: Briefcase,
  ngo: HeartHandshake,
};

export default function IndustriesIndexPage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50/60" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <div className="inline-flex bg-violet-50 text-violet-700 rounded-full px-3 py-1 text-xs font-semibold">INDUSTRY TEMPLATES</div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mt-4">OneHR, set up the way your sector actually works</h1>
            <p className="text-slate-600 mt-4 text-[17px] leading-7">
              A 24-hour hospital roster is not a school term roster. Each industry page shows the specific problems
              we solve and the numbers customers got after go-live.
            </p>
            <Link href="/register" className="mt-7 inline-flex bg-slate-900 text-white rounded-full px-7 py-4 font-semibold items-center gap-2">
              Start free — 14 days <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {industries.map(i => {
              const Icon = ICONS[i.icon];
              return (
                <Link key={i.slug} href={`/industries/${i.slug}`} className="bg-white rounded-2xl border p-6 hover:shadow-lg transition group">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Icon size={20} /></div>
                  <h2 className="font-bold mt-3">{i.name}</h2>
                  <p className="text-sm text-slate-600 mt-1.5 leading-6">{i.subheadline}</p>
                  <span className="text-xs font-semibold text-slate-900 mt-4 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    See the page <ArrowRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
