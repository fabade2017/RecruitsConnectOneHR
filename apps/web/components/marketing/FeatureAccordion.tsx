'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight, Wallet, Clock, Users, BarChart3 } from 'lucide-react';

export type FeatureItem = {
  icon: 'payroll' | 'clock' | 'people' | 'insight';
  title: string;
  desc: string;
  href: string;
  points: string[];
};

export const FEATURE_ICONS = {
  payroll: Wallet,
  clock: Clock,
  people: Users,
  insight: BarChart3,
};

export default function FeatureAccordion({ features }: { features: FeatureItem[] }) {
  const [open, setOpen] = useState<string | null>(features[0]?.title ?? null);

  return (
    <div className="lg:hidden space-y-3 mt-8">
      {features.map(f => {
        const isOpen = open === f.title;
        const Icon = FEATURE_ICONS[f.icon];
        return (
          <div key={f.title} className="bg-white rounded-2xl border overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : f.title)}
              className="w-full flex items-center gap-3 text-left p-4"
              aria-expanded={isOpen}
            >
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center shrink-0"><Icon size={18} /></span>
              <span className="flex-1 font-bold text-sm">{f.title}</span>
              <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4">
                <p className="text-sm text-slate-600 leading-6">{f.desc}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {f.points.map(p => <li key={p} className="flex gap-2"><span className="text-emerald-600">✓</span>{p}</li>)}
                </ul>
                <Link href={f.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  Explore <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
