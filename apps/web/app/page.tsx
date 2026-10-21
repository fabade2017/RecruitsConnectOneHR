'use client';
import Link from 'next/link';
import { useState } from 'react';
import ContactForm from '../components/ContactForm';
import CsWidget from '../components/CsWidget';
import SiteHeader from '../components/marketing/SiteHeader';
import SiteFooter from '../components/marketing/SiteFooter';
import HeroPreview from '../components/marketing/HeroPreview';
import ProductTour from '../components/marketing/ProductTour';
import RoiCalculator from '../components/marketing/RoiCalculator';
import PricingTable from '../components/marketing/PricingTable';
import MigrationGuarantee from '../components/marketing/MigrationGuarantee';
import CaseStudies from '../components/marketing/CaseStudies';
import FaqAccordion from '../components/marketing/FaqAccordion';
import FeatureAccordion, { FeatureItem, FEATURE_ICONS } from '../components/marketing/FeatureAccordion';
import { industries } from '../lib/industries';
import {
  ArrowRight, Building2, Check, GraduationCap, HeartHandshake, Layers,
  Briefcase, ShieldCheck, Star, Zap, Fingerprint, MapPin, Phone, Mail, Play,
  PlayCircle, Laptop, Database, CreditCard, ChevronDown,
} from 'lucide-react';

const features: FeatureItem[] = [
  {
    icon: 'payroll',
    title: 'Payroll you can trust',
    desc: 'Stop month-end panic. OneHR merges last month’s payslips, applies tax, allowances and deductions automatically, and flags only what genuinely needs a human decision.',
    href: '/payroll',
    points: ['Automatic merge of previous payroll', 'Tax, pension and NHF rules built in', 'One-click bank file export', 'Every edit logged for audit'],
  },
  {
    icon: 'clock',
    title: 'Attendance you can prove',
    desc: 'Kill buddy-punching and ghost workers. Seven clocking methods including facial verification and opt-in GPS, so every shift is defensible — without accusing anyone.',
    href: '/attendance',
    points: ['Mobile, web, QR, biometric, facial, NFC, API', 'Facial match with motion liveness', 'GPS strictly opt-in and consent-based', 'Exceptions flagged, never auto-charged'],
  },
  {
    icon: 'people',
    title: 'Every person, one record',
    desc: 'Hire to retirement in one place. Contracts, documents, leave, shifts, training and performance live on the employee — not across six spreadsheets.',
    href: '/employees',
    points: ['Hire → onboard → develop → offboard → alumni', 'Documents, certificates and contracts attached', 'Leave and shift planning built in', 'Recruitment pipeline for every open role'],
  },
  {
    icon: 'insight',
    title: 'See the problem before payroll',
    desc: 'Absenteeism, exceptions and cost creep show up on one health score weeks before they reach the payslip — so you can fix them while it is still cheap.',
    href: '/analytics',
    points: ['One HR Health score, six indicators', 'Attendance, cost and compliance trends', 'What-if simulator for headcount and pay', 'Board-ready exports'],
  },
];

const industryIcons: Record<string, any> = {
  banking: Building2,
  schools: GraduationCap,
  hospitals: HeartHandshake,
  manufacturing: Layers,
  retail: Briefcase,
  ngo: HeartHandshake,
};

const steps = [
  { n: '01', t: 'Import & verify', d: 'Send us a CSV or your existing payroll export. We map, clean and reconcile it against your last run before anything moves.' },
  { n: '02', t: 'Clock & approve', d: 'Staff clock in from mobile with facial verification. Managers approve leave, HR resolves exceptions — from their phone.' },
  { n: '03', t: 'Run payroll & measure', d: 'Payroll runs off clean attendance. One health score shows you what is drifting, and what to fix next.' },
];

const faqs = [
  { q: 'How long does it take to switch from Excel or Sage?', a: 'Most teams are live in 48 hours. We migrate your data ourselves, run one parallel payroll cycle beside your current system, and only cut over when the numbers match. If they do not match, you stay where you are and we keep working.' },
  { q: 'Is facial or GPS clocking mandatory?', a: 'No. Both are optional, consent-based and retention-controlled (90 days). You choose the policy per role: standard mobile, QR, biometric, or facial. GPS is always opt-in for field staff.' },
  { q: 'How is attendance fraud handled?', a: 'We never auto-accuse anyone. Device sharing, impossible travel and duplicate faces are flagged for a human to review, with the evidence attached to the exception.' },
  { q: 'What does it cost to get started?', a: 'Starter and Growth have a ₦0 implementation fee — self-serve setup with guided data import. Enterprise includes a named onboarding manager. There is no per-employee or per-clock-in charge.' },
  { q: 'Do you support multiple branches and currencies?', a: 'Yes. Multi-branch rosters, branch-level approval chains and group-of-companies roll-ups are built in. Pricing and payroll run in naira today, with multi-currency on the Enterprise roadmap.' },
  { q: 'Can we import our existing payroll?', a: 'Yes. OneHR merges payroll (basic pay + allowances − deductions − tax) and runs a simulator so you can see the impact before you commit.' },
];

export default function LandingPage() {
  const [openIndustry, setOpenIndustry] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50/60" />
        <div className="absolute -top-32 -right-32 w-[720px] h-[720px] bg-gradient-to-br from-violet-200 to-sky-200 rounded-full blur-3xl opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-10 lg:pt-20 lg:pb-16 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-3 py-1.5 text-xs font-medium">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Trusted by 120+ teams • 4.9/5 rated
            </div>

            <h1 className="text-[34px] sm:text-5xl lg:text-[54px] font-black leading-[1.02] tracking-tight mt-5">
              Stop Payroll Errors.<br className="hidden sm:block" />
              Eliminate Attendance Fraud.<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-violet-600 to-sky-600 bg-clip-text text-transparent">Run HR in One Place.</span>
            </h1>

            <p className="text-slate-600 mt-5 text-[17px] leading-7 max-w-xl">
              The all-in-one workforce platform built for African businesses. Automate payroll, track multi-branch
              attendance with facial/GPS verification, and get real-time visibility from hire to retirement.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link href="/register" className="bg-slate-900 text-white rounded-full px-7 py-4 font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-800">
                Start free — 14 days <ArrowRight size={18} />
              </Link>
              <Link href="#contact" className="bg-white border rounded-full px-7 py-4 font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50">
                <Play size={16} /> Book a 15-min demo
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              No card required • Prices in naira • Migrate from Excel in 48 hours
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm">
              <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600" /> ISO 27001-ready</div>
              <div className="flex items-center gap-2"><Zap size={18} className="text-amber-500" /> 99.9% uptime</div>
              <div className="flex items-center gap-2"><Fingerprint size={18} className="text-violet-600" /> Privacy-first</div>
            </div>

            <div className="mt-8 flex items-center gap-3 text-xs text-slate-500">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => <img key={i} src={`https://api.dicebear.com/7.x/initials/svg?seed=${i}HR`} alt="" className="w-8 h-8 rounded-full border-2 border-white bg-slate-100" />)}
              </div>
              <span>Trusted by <b>120+</b> teams • <span className="flex inline-flex gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />4.9/5 (214 reviews)</span></span>
            </div>
          </div>

          <HeroPreview />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-6 flex flex-wrap gap-x-6 gap-y-2 items-center text-xs text-slate-500 border-t mt-2 pt-6">
          <span className="font-semibold tracking-widest">TRUSTED BY</span>
          {['Sterling Bank', 'Lagoon Hospitals', 'EduBridge', 'Dangote Sugar', 'Flutterwave', 'Andela'].map(b => <span key={b} className="font-medium">{b}</span>)}
        </div>
      </section>

      {/* PROBLEM-SOLVING FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex bg-violet-50 text-violet-700 rounded-full px-3 py-1 text-xs font-semibold">WHAT YOU GET</div>
          <h2 className="text-3xl font-black mt-3">Everything you need. Nothing you have to count.</h2>
          <p className="text-slate-600 mt-2">
            Payroll, attendance, people records and reporting — working together on one login, one database, one source of truth.
          </p>
        </div>

        <div className="hidden lg:grid grid-cols-4 gap-5 mt-8">
          {features.map(f => {
            const Icon = FEATURE_ICONS[f.icon];
            return (
            <Link key={f.title} href={f.href} className="group bg-white rounded-2xl border p-5 hover:shadow-lg transition">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center">
                <Icon size={20} />
              </div>
              <h3 className="font-bold mt-3">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-1 leading-6">{f.desc}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                {f.points.map(p => <li key={p} className="flex gap-1.5"><Check size={12} className="text-emerald-600 mt-0.5 shrink-0" /> {p}</li>)}
              </ul>
              <span className="text-xs font-semibold text-slate-900 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Explore <ArrowRight size={12} /></span>
            </Link>
            );
          })}
        </div>

        <FeatureAccordion features={features} />
      </section>

      {/* PRODUCT TOUR */}
      <ProductTour />

      {/* INDUSTRIES */}
      <section id="industries" className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs tracking-widest font-semibold text-violet-600">BUILT FOR YOUR SECTOR</div>
            <h2 className="text-3xl font-black mt-1">Your industry’s headaches, already solved</h2>
            <p className="text-slate-600 mt-1">
              A 24-hour hospital roster is not a school term roster. Each sector gets the shifts, rules and workflows it actually needs.
            </p>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {industries.map(i => {
            const Icon = industryIcons[i.icon];
            return (
              <Link key={i.slug} href={`/industries/${i.slug}`} className="bg-white rounded-2xl border p-6 hover:shadow-lg transition group">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Icon size={20} /></div>
                  <div>
                    <div className="font-bold">{i.name}</div>
                    <div className="text-xs text-slate-500">{i.short}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3 leading-6">{i.subheadline}</p>
                <span className="text-xs font-semibold text-slate-900 mt-4 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  See OneHR for {i.name.split(' ')[0]} <ArrowRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="md:hidden mt-8 space-y-3">
          {industries.map(i => {
            const Icon = industryIcons[i.icon];
            const isOpen = openIndustry === i.slug;
            return (
              <div key={i.slug} className="bg-white rounded-2xl border overflow-hidden">
                <button
                  onClick={() => setOpenIndustry(isOpen ? null : i.slug)}
                  className="w-full flex items-center gap-3 text-left p-4"
                  aria-expanded={isOpen}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Icon size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{i.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{i.short}</div>
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-slate-600 leading-6">{i.subheadline}</p>
                    <Link href={`/industries/${i.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      See the full page <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <h2 className="text-3xl font-black text-center">Live in three steps</h2>
          <p className="text-slate-600 text-center mt-2 max-w-xl mx-auto">No consultants, no 12-month implementation. A working payroll in under a week.</p>
          <div className="grid lg:grid-cols-3 gap-6 mt-8">
            {steps.map(s => (
              <div key={s.n} className="bg-white rounded-2xl border p-6">
                <div className="text-3xl font-black text-slate-200">{s.n}</div>
                <div className="font-bold mt-1">{s.t}</div>
                <p className="text-sm text-slate-600 mt-1 leading-6">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI CALCULATOR */}
      <RoiCalculator />

      {/* CASE STUDIES */}
      <CaseStudies />

      {/* MIGRATION GUARANTEE */}
      <MigrationGuarantee />

      {/* PRICING */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="text-center">
          <div className="inline bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold">PRICING IN NAIRA</div>
          <h2 className="text-3xl font-black mt-2">Simple pricing. No surprises.</h2>
          <p className="text-slate-600 mt-1">Start free, scale to enterprise. Every plan includes onboarding, migration and support.</p>
        </div>
        <div className="mt-8"><PricingTable /></div>
      </section>

      {/* FAQ + ABOUT */}
      <section className="bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-black">Questions? Answers.</h2>
            <FaqAccordion faqs={faqs} />
          </div>
          <div id="about" className="bg-white rounded-2xl p-6 border">
            <h3 className="font-black text-lg">About RecruitConnect OneHR™</h3>
            <p className="text-sm text-slate-600 mt-2 leading-6">
              We started as a recruitment agency in Lagos and kept meeting the same wall: payroll in Excel, leave in
              WhatsApp, and no single truth about what was happening. OneHR is the answer — people, work, time and
              insight in one place, secure and audit-ready by design.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 rounded-xl p-3"><div className="font-black">120+</div><div className="text-xs text-slate-500">Teams</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><div className="font-black">12k+</div><div className="text-xs text-slate-500">Employees</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><div className="font-black">48 hrs</div><div className="text-xs text-slate-500">Migration</div></div>
            </div>
            <div className="mt-5 rounded-xl border p-4">
              <div className="text-xs font-bold tracking-widest text-slate-400">WHAT’S INCLUDED</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Payroll', 'Attendance', 'Leave', 'Shifts', 'People', 'Recruitment', 'Performance', 'Learning', 'Documents', 'Assets', 'Projects', 'Workflows', 'Analytics', 'Compliance', 'Engagement', 'AI assistant'].map(m => (
                  <span key={m} className="bg-slate-50 border rounded-full px-2.5 py-1 text-[11px] font-medium">{m}</span>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <Link href="/login" className="bg-slate-900 text-white rounded-full px-4 py-2">Try demo</Link>
              <Link href="/about" className="glass rounded-full px-4 py-2">About us →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-black">Talk to us</h2>
            <p className="text-slate-600 mt-1">Book a 15-minute demo, or ask about migrating from your current payroll system.</p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3"><Mail size={16} className="text-slate-900" /> hello@recruitconnect.ng</div>
              <div className="flex items-center gap-3"><Phone size={16} className="text-slate-900" /> +234 800 123 4567 (Lagos)</div>
              <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-900" /> Victoria Island, Lagos • Remote worldwide</div>
            </div>
            <div className="mt-6 flex gap-3">
              <a href="https://wa.me/2348001234567" className="bg-emerald-500 text-white rounded-full px-5 py-2.5 text-sm font-semibold">WhatsApp us</a>
              <a href="mailto:hello@recruitconnect.ng" className="glass rounded-full px-5 py-2.5 text-sm font-semibold">Email sales</a>
            </div>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: CreditCard, t: '₦0 setup fee' },
                { icon: Database, t: '48-hour migration' },
                { icon: Laptop, t: 'Works on any device' },
                { icon: PlayCircle, t: 'Guided onboarding' },
              ].map(x => (
                <div key={x.t} className="bg-white border rounded-xl p-3 text-center text-[11px] font-semibold text-slate-700">
                  <x.icon size={16} className="mx-auto mb-1.5 text-slate-900" /> {x.t}
                </div>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      <SiteFooter />
      <CsWidget />
    </main>
  );
}
