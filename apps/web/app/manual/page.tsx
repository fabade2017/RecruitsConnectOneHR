import Link from 'next/link';
import { FileText, Download, BookOpen, ShieldCheck, Users, Clock, Sparkles } from 'lucide-react';

export const metadata = { title: 'OneHR Manual — RecruitConnect' };

export default function ManualPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/20">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span>›</span>
          <span className="font-semibold text-slate-900">Manual</span>
        </div>

        <div className="mt-6 bg-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs"><BookOpen size={14}/> RecruitConnect OneHR™ Manual</div>
            <h1 className="text-3xl font-black mt-3">About the Application</h1>
            <p className="text-white/70 mt-2 max-w-xl">One Platform. Complete Workforce Intelligence. 44 modules, MSSQL <code>onehr_v2</code>, RBAC, face liveness, bulk Excel, and superadmin onboarding — all in one PDF.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="bg-white text-slate-900 rounded-full px-3 py-1 font-semibold">10 pages • 18K • v1.0 2026-09-02</span>
              <span className="bg-white/10 border border-white/20 rounded-full px-3 py-1">MSSQL • NestJS • Next.js</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-slate-900 min-w-[260px]">
            <div className="font-bold flex items-center gap-2"><FileText size={18}/> OneHR_Manual.pdf</div>
            <div className="text-xs text-slate-500 mt-1">10 pages • Cover + TOC + 15 sections</div>
            <a href="/manual.pdf" download className="mt-3 w-full bg-slate-900 text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2 hover:bg-slate-800"><Download size={16}/> Download PDF</a>
            <a href="/manual.pdf" target="_blank" className="mt-2 w-full glass rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2">Open in new tab →</a>
            <p className="text-xs text-slate-400 mt-2 text-center">Also at <code>/public/manual.pdf</code> and <code>docs/MANUAL.md</code></p>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border p-5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Users size={18}/></div>
            <h3 className="font-bold mt-3">For HR & Managers</h3>
            <p className="text-sm text-slate-600 mt-1">People, attendance, shifts, leave, payroll, performance, recruitment — all live.</p>
            <Link href="/hr" className="text-xs font-semibold text-violet-600 mt-2 inline-block">Go to HR Command Center →</Link>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center"><Clock size={18}/></div>
            <h3 className="font-bold mt-3">For Employees</h3>
            <p className="text-sm text-slate-600 mt-1">Clock in/out with face + motion, leave, payslip, documents, training.</p>
            <Link href="/employee" className="text-xs font-semibold text-emerald-600 mt-2 inline-block">Go to Employee Home →</Link>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center"><ShieldCheck size={18}/></div>
            <h3 className="font-bold mt-3">For Super Admin</h3>
            <p className="text-sm text-slate-600 mt-1">Roles, permissions per module, companies, subscriptions, onboarding queue.</p>
            <Link href="/admin" className="text-xs font-semibold text-violet-600 mt-2 inline-block">Go to Super Admin →</Link>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><BookOpen size={18}/> Read Inline</h3>
            <a href="/manual.pdf" download className="text-xs glass rounded-full px-3 py-1">Download</a>
          </div>
          <div className="h-[800px] bg-slate-50">
            <iframe src="/manual.pdf" className="w-full h-full border-0" title="OneHR Manual PDF" />
          </div>
          <div className="p-3 bg-slate-50/50 text-xs text-slate-500 flex justify-between">
            <span>If PDF doesn’t load, <a href="/manual.pdf" className="underline">click here to download</a> or check <code>apps/web/public/manual.pdf</code>.</span>
            <span className="hidden md:inline">Docs: PRD • ERD • API_SPEC • ARCHITECTURE • RBAC • ROADMAP</span>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-br from-violet-600 to-sky-600 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="font-black text-lg flex items-center gap-2"><Sparkles size={18}/> Need help?</h3>
            <p className="text-sm text-white/80">Contact support or superadmin to assign your modules.</p>
          </div>
          <div className="flex gap-3 self-start">
            <Link href="/contact" className="bg-white text-slate-900 rounded-full px-5 py-2.5 text-sm font-semibold">Contact Us</Link>
            <Link href="/about" className="bg-white/10 border border-white/20 rounded-full px-5 py-2.5 text-sm font-semibold">About</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
