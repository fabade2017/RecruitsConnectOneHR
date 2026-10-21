import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '../../components/marketing/SiteHeader';
import SiteFooter from '../../components/marketing/SiteFooter';
import { ArrowRight, Clock, FileText, MapPin, ShieldCheck, CalendarDays } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employee sign in | RecruitConnect OneHR',
  description: 'Sign in to clock in, check your attendance, request leave and download your payslip.',
};

export default function EmployeeLoginPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <SiteHeader />

      <section className="relative overflow-hidden flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60" />
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-600 text-white rounded-full px-3 py-1.5 text-xs font-semibold">
              <Clock size={14} /> Employee portal
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mt-5">Clock in, check your payslip, request leave</h1>
            <p className="text-slate-600 mt-4 text-[17px] leading-7">
              This page is for staff. Sign in with the work email and organisation code your HR team gave you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" className="bg-slate-900 text-white rounded-full px-8 py-4 font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-800">
                Sign in to clock in <ArrowRight size={18} />
              </Link>
              <Link href="/face-enroll" className="bg-white border rounded-full px-8 py-4 font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50">
                Set up face verification
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Need an account? Your HR team activates it for you — there is nothing to sign up for.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
            {[
              { icon: Clock, t: 'One-tap clock in', d: 'Face, QR, biometric or mobile. No paper register.' },
              { icon: CalendarDays, t: 'Request leave', d: 'See your balance and submit without waiting on WhatsApp.' },
              { icon: FileText, t: 'Download payslips', d: 'Every payslip you have ever earned, in one place.' },
              { icon: MapPin, t: 'GPS only if you want', d: 'Location is opt-in, consent-based and deleted after 90 days.' },
            ].map(x => (
              <div key={x.t} className="bg-white rounded-2xl border p-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><x.icon size={18} /></div>
                <div className="font-bold mt-3 text-sm">{x.t}</div>
                <div className="text-xs text-slate-600 mt-1 leading-5">{x.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border bg-white p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Your data is yours</div>
                <p className="text-xs text-slate-600 mt-1 leading-5 max-w-xl">
                  You can see exactly what was recorded, request corrections, and download your own record at any time.
                  OneHR never shares your biometric data with your employer beyond an attendance flag you can review.
                </p>
              </div>
            </div>
            <Link href="/login" className="bg-slate-900 text-white rounded-full px-6 py-3 font-semibold text-sm shrink-0 self-start sm:self-center">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Are you an employer setting up OneHR for your business?</span>
          <Link href="/register" className="font-semibold text-slate-900 inline-flex items-center gap-2 hover:gap-3 transition-all">
            Start a free trial <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
