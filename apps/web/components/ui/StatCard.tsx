'use client';
import { GlassCard } from './GlassCard';
import { LucideIcon } from 'lucide-react';

export function StatCard({ title, value, sub, icon: Icon, trend, accent = 'from-sky-500 to-blue-600' }: { title: string; value: string | number; sub?: string; icon: LucideIcon; trend?: string; accent?: string }) {
  return (
    <GlassCard hover className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accent} opacity-60`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] tracking-widest font-semibold text-slate-500 uppercase">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          {trend && <p className="text-xs font-medium mt-2 text-emerald-600">{trend}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-lg`}>
          <Icon size={18} />
        </div>
      </div>
    </GlassCard>
  );
}
