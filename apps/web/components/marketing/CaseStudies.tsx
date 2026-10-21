'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Play, Quote, Star, X, Check } from 'lucide-react';

type CaseStudy = {
  slug: string;
  name: string;
  role: string;
  org: string;
  location: string;
  sector: string;
  headline: string;
  quote: string;
  metrics: { k: string; v: string }[];
  problem: string;
  solution: string[];
  result: string[];
  videoUrl?: string;
};

const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'sterling-bank',
    name: 'Aisha Bello',
    role: 'Chief Human Resources Officer',
    org: 'Sterling Bank',
    location: 'Lagos, Nigeria',
    sector: 'Banking',
    headline: '48 branches, one payroll, zero month-end panic',
    quote:
      'OneHR cut our payroll errors by 92% and gave us real-time visibility across 48 branches. HR Health is our new board metric.',
    metrics: [
      { k: 'Payroll errors', v: '−92%' },
      { k: 'Branches live', v: '48' },
      { k: 'Month-end close', v: '3 days → 4 hrs' },
    ],
    problem:
      'Staff records lived in one system, payroll in Excel, and branch attendance in paper registers. Every payday month was a fire drill, and no one could answer "who is in which branch right now" without a phone call.',
    solution: [
      'Historical payslips imported and reconciled against the old Excel payroll for three months before cutover.',
      'Facial + mobile clocking rolled out to all 48 branches with a two-week parallel run.',
      'Branch-level attendance and payroll accuracy published to the exec team every Monday.',
    ],
    result: [
      'Payroll errors down 92% in the first quarter after go-live.',
      'HR Health score adopted as the standing board-level people metric.',
      'Month-end payroll reconciliation reduced from three days to roughly four hours.',
    ],
    videoUrl: undefined,
  },
  {
    slug: 'lagoon-hospitals',
    name: 'Dr. Emeka Okafor',
    role: 'Medical Director',
    org: 'Lagoon Hospitals',
    location: 'Victoria Island, Lagos',
    sector: 'Healthcare',
    headline: 'Night shifts stopped paying for ghosts',
    quote:
      '24h rosters, facial clocking and exception flags stopped buddy-punching overnight. Audit-ready.',
    metrics: [
      { k: 'Night-shift fraud', v: 'Eliminated' },
      { k: 'Roster build time', v: 'Days → 1 hr' },
      { k: 'Audit requests', v: 'Same-day' },
    ],
    problem:
      'Twenty-four hour rosters across four facilities meant night staff were clocking in for colleagues. The ward managers knew, could not prove it, and payroll was paying for hours nobody worked.',
    solution: [
      'Face + motion liveness clocking enabled for clinical staff, with GPS left strictly opt-in.',
      'Duplicate-match and impossible-travel exceptions routed to a daily HR review queue.',
      'Shift allowances, night rates and overtime thresholds rebuilt as payroll rules instead of manual additions.',
    ],
    result: [
      'Buddy-punching on night duty stopped within the first month.',
      'Exception review now happens daily instead of surfacing at month-end.',
      'External audit requests answered same-day from the shift and payroll audit trail.',
    ],
    videoUrl: undefined,
  },
  {
    slug: 'edubridge',
    name: 'Funmi Adeyemi',
    role: 'Chief Executive Officer',
    org: 'EduBridge Academy',
    location: 'Ikeja, Lagos',
    sector: 'Education',
    headline: 'From hire to alumni in one place',
    quote:
      'Onboarding to alumni in one place. Our managers finally answer “What is happening right now?”',
    metrics: [
      { k: 'Onboarding time', v: '2 wks → 3 days' },
      { k: 'Payroll days', v: '1 → same day' },
      { k: 'HR queries', v: '−70%' },
    ],
    problem:
      'Teachers, support staff and drivers were tracked separately, so term-based payroll was rebuilt from scratch every term and staff had to ask HR for their own attendance record and payslip.',
    solution: [
      'Academic calendar loaded so leave requests are checked against exam weeks automatically.',
      'Term-based pay scales, prorating and mid-term adjustments converted into payroll rules.',
      'Self-service enabled for every staff member to see their own payslip, attendance and leave balance.',
    ],
    result: [
      'Onboarding a new member of staff cut from two weeks to three days.',
      'Termly payroll now runs on the same day every term.',
      'Routine HR queries down roughly 70% thanks to self-service.',
    ],
    videoUrl: undefined,
  },
];

function StoryModal({ cs, onClose }: { cs: CaseStudy; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center z-10" aria-label="Close">
          <X size={18} />
        </button>

        {cs.videoUrl ? (
          <div className="aspect-video bg-slate-900">
            <video className="w-full h-full" controls src={cs.videoUrl} />
          </div>
        ) : (
          <div className="aspect-video bg-slate-900 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Play size={26} />
            </div>
            <div className="text-white font-bold mt-4">Video testimonial</div>
            <div className="text-white/60 text-sm mt-1">
              {cs.name} · {cs.role}, {cs.org}
            </div>
            <div className="text-white/40 text-xs mt-3 max-w-sm">
              Recorded story — video available on request. The full written case study is below.
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="text-xs tracking-widest text-violet-600 font-semibold">CASE STUDY · {cs.sector.toUpperCase()}</div>
          <h3 className="text-2xl font-black mt-1">{cs.headline}</h3>
          <div className="flex items-center gap-3 mt-4">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${cs.name.replace(/\s/g, '')}`} alt="" className="w-11 h-11 rounded-full bg-slate-100" />
            <div>
              <div className="font-bold text-sm">{cs.name}</div>
              <div className="text-xs text-slate-500">{cs.role} · {cs.org} · {cs.location}</div>
            </div>
          </div>

          <blockquote className="mt-5 border-l-4 border-violet-500 pl-4 italic text-slate-700 leading-7">“{cs.quote}”</blockquote>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            {cs.metrics.map(m => (
              <div key={m.k} className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-lg font-black">{m.v}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{m.k}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-5 text-sm leading-6">
            <div>
              <div className="font-bold">The problem</div>
              <p className="text-slate-600 mt-1">{cs.problem}</p>
            </div>
            <div>
              <div className="font-bold">What we did</div>
              <ul className="mt-1 space-y-1.5 text-slate-600">
                {cs.solution.map(s => (
                  <li key={s} className="flex gap-2"><Check size={14} className="text-emerald-600 mt-1 shrink-0" /> {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-bold">The result</div>
              <ul className="mt-1 space-y-1.5 text-slate-600">
                {cs.result.map(s => (
                  <li key={s} className="flex gap-2"><Check size={14} className="text-emerald-600 mt-1 shrink-0" /> {s}</li>
                ))}
              </ul>
            </div>
          </div>

          <Link href="/#contact" onClick={onClose} className="mt-7 inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-6 py-3 font-semibold hover:bg-slate-800">
            Book your demo <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CaseStudies() {
  const [open, setOpen] = useState<string | null>(null);
  const [modal, setModal] = useState<CaseStudy | null>(null);

  return (
    <section className="bg-slate-50 border-y">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex bg-white text-violet-700 rounded-full px-3 py-1 text-xs font-semibold border">CUSTOMER STORIES</div>
            <h2 className="text-3xl font-black mt-3">Real people. Real numbers.</h2>
            <p className="text-slate-600 mt-2">
              Named customers, the problem they had, and what changed after go-live. No anonymous logos.
            </p>
          </div>
          <Link href="/#contact" className="hidden lg:inline bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 self-start">
            Ask for a reference call <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-5">
          {CASE_STUDIES.map(cs => {
            const isOpen = open === cs.slug;
            return (
              <div key={cs.slug} className="bg-white rounded-2xl border p-6 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${cs.name.replace(/\s/g, '')}`} alt="" className="w-12 h-12 rounded-full bg-slate-100" />
                    <div>
                      <div className="font-bold leading-tight">{cs.name}</div>
                      <div className="text-xs text-slate-500 leading-tight mt-0.5">{cs.role}</div>
                      <div className="text-xs text-violet-600 font-semibold mt-0.5">{cs.org}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-amber-400 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className="fill-amber-400" />)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-1 font-semibold">{cs.sector}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-1 font-semibold">{cs.location}</span>
                </div>

                <Quote className="text-slate-200 mt-4" size={22} />
                <p className="text-slate-700 leading-7 mt-1 flex-1">“{cs.quote}”</p>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  {cs.metrics.map(m => (
                    <div key={m.k} className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <div className="text-[13px] font-black leading-tight">{m.v}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{m.k}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => setModal(cs)} className="flex-1 bg-slate-900 text-white rounded-full py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-800">
                    <Play size={13} /> Watch the story
                  </button>
                  <button
                    onClick={() => setOpen(isOpen ? null : cs.slug)}
                    className="w-10 h-10 rounded-full border bg-white flex items-center justify-center hover:bg-slate-50"
                    aria-expanded={isOpen}
                    aria-label="Read the case study"
                  >
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t text-sm space-y-4">
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wide text-slate-400">The problem</div>
                      <p className="text-slate-600 mt-1 leading-6">{cs.problem}</p>
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wide text-slate-400">The result</div>
                      <ul className="mt-1 space-y-1.5 text-slate-600">
                        {cs.result.map(s => (
                          <li key={s} className="flex gap-2"><Check size={13} className="text-emerald-600 mt-1 shrink-0" /> {s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modal && <StoryModal cs={modal} onClose={() => setModal(null)} />}
    </section>
  );
}
