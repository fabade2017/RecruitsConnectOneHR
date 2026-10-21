'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Info, Sparkles } from 'lucide-react';

type Plan = {
  name: string;
  monthly: number;
  annualMonthly: number;
  sub: string;
  features: string[];
  cta: string;
  href: string;
  dark?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: 'Starter',
    monthly: 50_000,
    annualMonthly: 42_500,
    sub: 'Up to 50 employees \u00b7 3 branches',
    features: [
      'People records & lifecycle',
      'Attendance with facial / GPS',
      'Leave & shift management',
      'Document vault',
      'Audit log & role-based access',
    ],
    cta: 'Start free',
    href: '/register',
  },
  {
    name: 'Growth',
    monthly: 150_000,
    annualMonthly: 127_500,
    sub: 'Up to 200 employees \u00b7 10 branches',
    features: [
      'Everything in Starter',
      'Payroll with automatic merge',
      'Recruitment & onboarding',
      'Performance & learning',
      'Advanced analytics & reports',
    ],
    cta: 'Start free',
    href: '/register',
    dark: true,
    badge: 'MOST POPULAR',
  },
  {
    name: 'Enterprise',
    monthly: 400_000,
    annualMonthly: 340_000,
    sub: 'Up to 1,000 employees \u00b7 50 branches',
    features: [
      'Everything in Growth',
      'Unlimited modules & AI assistant',
      'Scenario simulator & digital twin',
      'API access & SSO',
      'Named onboarding manager',
    ],
    cta: 'Talk to sales',
    href: '/#contact',
  },
];

export default function PricingTable() {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div>
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex bg-slate-100 rounded-full p-1 text-sm font-semibold">
          <button
            onClick={() => setCycle('monthly')}
            className={`rounded-full px-5 py-2 transition ${cycle === 'monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle('annual')}
            className={`rounded-full px-5 py-2 transition ${cycle === 'annual' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
          >
            Annual <span className="text-emerald-600">−15%</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {cycle === 'monthly'
            ? 'Billed monthly in naira. Cancel any time before the next invoice.'
            : 'Billed once per year in naira. Price shown is the effective monthly rate.'}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        {PLANS.map(p => {
          const price = cycle === 'monthly' ? p.monthly : p.annualMonthly;
          return (
            <div
              key={p.name}
              className={`rounded-[20px] p-6 border flex flex-col ${p.dark ? 'bg-slate-900 text-white border-slate-900' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg">{p.name}</h3>
                {p.badge && <span className="bg-emerald-500 text-white text-[11px] rounded-full px-2 py-1 font-bold">{p.badge}</span>}
              </div>
              <div className="text-3xl font-black mt-2 tabular-nums">
                ₦{price.toLocaleString('en-NG')}
                <span className="text-sm font-normal opacity-70">/mo</span>
              </div>
              <div className="text-xs opacity-70">{p.sub}</div>
              {cycle === 'annual' && (
                <div className="text-[11px] text-emerald-500 mt-1 font-semibold">
                  Billed ₦{(price * 12).toLocaleString('en-NG')} once a year
                </div>
              )}
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={14} className={`mt-0.5 shrink-0 ${p.dark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`mt-5 w-full inline-flex justify-center items-center gap-2 rounded-full py-3 font-semibold ${
                  p.dark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {p.cta} <ArrowRight size={16} />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 font-bold"><Info size={16} className="text-sky-600" /> Implementation fee</div>
          <p className="text-slate-600 mt-1.5 leading-6">
            <b className="text-slate-900">₦0 on Starter and Growth</b> — self-serve setup with guided data import.
            Enterprise includes a named onboarding manager at no extra cost.
          </p>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 font-bold"><Info size={16} className="text-sky-600" /> What is not billed</div>
          <p className="text-slate-600 mt-1.5 leading-6">
            No charge per employee, no charge per clock-in, no charge for SMS or email notifications, and no setup fee on your first invoice.
          </p>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 font-bold"><Sparkles size={16} className="text-emerald-600" /> 14-day free trial</div>
          <p className="text-slate-600 mt-1.5 leading-6">
            Full access to every module you pick, no card required. If it is not saving you time in two weeks, walk away with your data.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-4">
        All plans include audit logs, secure access and support. Group-of-companies pricing available on request.
      </p>
    </div>
  );
}
