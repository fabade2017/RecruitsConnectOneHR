'use client';
import React from 'react';
export function GlassCard({ children, className = '', hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 ${hover ? 'hover:shadow-glow hover:-translate-y-[1px] transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  );
}
export function GradientCard({ children, className = '', gradient = 'from-slate-900 via-slate-800 to-slate-900' }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${gradient} shadow-[0_12px_40px_rgba(2,6,23,0.18)] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.07] via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      {children}
    </div>
  );
}
export function Pill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'emerald' | 'amber' | 'red' | 'slate' | 'blue' | 'violet' }) {
  const map: any = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${map[tone]}`}>{children}</span>;
}
