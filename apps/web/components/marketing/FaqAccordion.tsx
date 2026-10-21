'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type FaqItem = { q: string; a: string };

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.q ?? null);
  return (
    <div className="mt-6 space-y-3">
      {faqs.map(f => {
        const isOpen = open === f.q;
        return (
          <div key={f.q} className="bg-white rounded-2xl border overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : f.q)}
              className="w-full flex items-center justify-between gap-4 text-left p-5"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-sm sm:text-base">{f.q}</span>
              <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="px-5 pb-5 text-sm text-slate-600 leading-6">{f.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
