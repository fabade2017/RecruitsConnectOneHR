import Link from 'next/link';
import { ArrowRight, Clock, Database, ShieldCheck, Upload, Check } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Day 0 — Send your files',
    desc: 'A CSV or your existing payroll export. We accept Sage, Oracle, Excel, Zoho and CSV. Nothing to install on your side.',
  },
  {
    icon: Database,
    title: 'Day 1 — We map and clean',
    desc: 'Our team maps your fields to OneHR, cleans duplicates and reconciles against your last payroll run before a single record moves.',
  },
  {
    icon: Check,
    title: 'Day 2 — Parallel run, then go live',
    desc: 'You run OneHR alongside your old system for one cycle. When the numbers match, we flip the switch and your old system goes quiet.',
  },
];

export default function MigrationGuarantee() {
  return (
    <section id="migration" className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="inline-flex bg-white/10 text-emerald-300 rounded-full px-3 py-1 text-xs font-semibold">MIGRATION &amp; ONBOARDING GUARANTEE</div>
            <h2 className="text-3xl font-black mt-3 leading-tight">
              Switching from Excel, Sage or Oracle? We migrate your data in 48 hours with zero payroll downtime.
            </h2>
            <p className="text-white/70 mt-4 leading-7">
              The fear is real: new software, payday is on Friday, and nobody wants to explain a wrong payslip to staff.
              So we do the migration ourselves, we run it in parallel with your current system, and we do not let your payroll
              date move. If the numbers do not match on the parallel run, you stay on your old system and we keep working.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/#contact" className="bg-white text-slate-900 rounded-full px-6 py-3 font-semibold inline-flex items-center gap-2 hover:bg-slate-100">
                Start a migration plan <ArrowRight size={16} />
              </Link>
              <Link href="/register" className="bg-white/10 border border-white/20 rounded-full px-6 py-3 font-semibold inline-flex items-center gap-2 hover:bg-white/15">
                <Clock size={16} /> 48-hour migration
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { k: '48 hrs', v: 'Typical go-live' },
                { k: '0', v: 'Payroll downtimes' },
                { k: '100%', v: 'Data reconciled' },
              ].map(s => (
                <div key={s.k} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-2xl font-black">{s.k}</div>
                  <div className="text-[11px] text-white/60 mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <s.icon size={20} />
                </div>
                <div>
                  <div className="text-xs tracking-widest text-white/40">STEP {i + 1}</div>
                  <div className="font-bold mt-0.5">{s.title}</div>
                  <p className="text-sm text-white/65 mt-1.5 leading-6">{s.desc}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 flex gap-3">
              <ShieldCheck size={20} className="text-emerald-300 shrink-0 mt-0.5" />
              <p className="text-sm text-white/75 leading-6">
                <b className="text-white">Your data stays yours.</b> Full export at any time, encrypted in transit and at rest,
                scoped to your organisation only. We never reuse your workforce data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
