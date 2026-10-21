'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, ShieldAlert, TrendingUp, Wallet, Calculator } from 'lucide-react';

const naira = (n: number) =>
  '₦' + Math.round(n).toLocaleString('en-NG', { maximumFractionDigits: 0 });

function Slider({
  label, hint, value, min, max, step, onChange, format,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-slate-800">{label}</label>
        <span className="text-sm font-black tabular-nums text-slate-900">{format ? format(value) : value}</span>
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-slate-900 h-2"
        aria-label={label}
      />
    </div>
  );
}

export default function RoiCalculator() {
  const [employees, setEmployees] = useState(100);
  const [avgSalary, setAvgSalary] = useState(120_000);
  const [adminRate, setAdminRate] = useState(2_500);
  const [fraudRate, setFraudRate] = useState(2.5);
  const [recoveryRate, setRecoveryRate] = useState(60);

  const r = useMemo(() => {
    // Time recovered: manual payroll reconciliation + attendance chasing per employee
    const hoursPerEmployee = 1.0; // hours saved per employee per month on reconciliation + queries
    const hoursSaved = employees * hoursPerEmployee;
    const payrollSavings = hoursSaved * adminRate;

    // Time-theft / ghost worker exposure recovered
    const fraudExposure = employees * avgSalary * (fraudRate / 100);
    const fraudRecovered = fraudExposure * (recoveryRate / 100);

    const monthly = payrollSavings + fraudRecovered;
    const annual = monthly * 12;

    // Cost of the plan that fits this headcount
    const planCost = employees <= 50 ? 50_000 : employees <= 200 ? 150_000 : 400_000;
    const netAnnual = annual - planCost * 12;

    return {
      hoursSaved,
      payrollSavings,
      fraudExposure,
      fraudRecovered,
      monthly,
      annual,
      planCost,
      netAnnual,
      multiple: planCost > 0 ? monthly / planCost : 0,
      paybackDays: monthly > 0 ? Math.max(1, Math.round((planCost / monthly) * 30)) : 0,
    };
  }, [employees, avgSalary, adminRate, fraudRate, recoveryRate]);

  return (
    <section id="roi" className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold">PAYROLL SAVINGS CALCULATOR</div>
        <h2 className="text-3xl font-black mt-3">What is payroll costing you?</h2>
        <p className="text-slate-600 mt-2">
          Slide the numbers. We estimate the hours you get back and the ghost-worker pay you stop leaking.
        </p>
      </div>

      <div className="mt-8 grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 bg-white rounded-2xl border p-6 space-y-6">
          <Slider
            label="How many people do you employ?"
            hint="Include full-time, part-time and field staff"
            value={employees}
            min={5}
            max={1000}
            step={5}
            onChange={setEmployees}
            format={v => `${v} ${v === 1 ? 'employee' : 'employees'}`}
          />
          <Slider
            label="Average monthly salary per employee"
            hint="Gross salary, in naira"
            value={avgSalary}
            min={30_000}
            max={500_000}
            step={5_000}
            onChange={setAvgSalary}
            format={naira}
          />
          <Slider
            label="Hourly cost of your HR / payroll admin time"
            hint="Salary plus overhead per hour of admin work"
            value={adminRate}
            min={500}
            max={10_000}
            step={250}
            onChange={setAdminRate}
            format={v => `${naira(v)}/hr`}
          />
          <Slider
            label="Payroll you estimate is lost to time theft"
            hint="Buddy punching, ghost workers, unapproved overtime"
            value={fraudRate}
            min={0}
            max={10}
            step={0.5}
            onChange={setFraudRate}
            format={v => `${v}%`}
          />
          <Slider
            label="Share of that loss OneHR catches"
            hint="Verified clocking plus exception review"
            value={recoveryRate}
            min={0}
            max={100}
            step={5}
            onChange={setRecoveryRate}
            format={v => `${v}%`}
          />
        </div>

        <div className="lg:col-span-2 bg-slate-900 text-white rounded-2xl p-6">
          <div className="flex items-center gap-2 text-xs tracking-widest text-white/60">
            <Calculator size={14} /> YOUR ESTIMATED ANNUAL SAVING
          </div>
          <div className="text-4xl lg:text-5xl font-black mt-2 tabular-nums">{naira(r.annual)}</div>
          <div className="text-sm text-white/60 mt-1">≈ {naira(r.monthly)} per month</div>

          <div className="mt-6 space-y-3">
            {[
              { icon: Clock, label: 'Admin hours back every month', value: `${Math.round(r.hoursSaved)} hrs` },
              { icon: Wallet, label: 'Payroll admin cost recovered', value: naira(r.payrollSavings) },
              { icon: ShieldAlert, label: 'Time-theft pay stopped', value: naira(r.fraudRecovered) },
              { icon: TrendingUp, label: 'Return on the plan you need', value: `${r.multiple.toFixed(1)}x` },
            ].map(x => (
              <div key={x.label} className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs text-white/70"><x.icon size={14} /> {x.label}</span>
                <span className="text-sm font-bold tabular-nums whitespace-nowrap">{x.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 p-3">
            <div className="text-xs text-emerald-200">Payback period on the {naira(r.planCost)}/month plan</div>
            <div className="text-lg font-black mt-0.5">Under {r.paybackDays} days</div>
          </div>

          <Link href="/register" className="mt-5 w-full bg-white text-slate-900 rounded-full py-3.5 font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-100">
            Start free — 14 days <ArrowRight size={16} />
          </Link>
          <p className="text-[11px] text-white/50 mt-3 leading-5">
            Estimates use typical mid-market benchmarks, not a promise. Your own numbers may differ — we will show you ours in the demo.
          </p>
        </div>
      </div>
    </section>
  );
}
