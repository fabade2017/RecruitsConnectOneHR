'use client';
import { useEffect, useState } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Wallet, Download, Plus } from 'lucide-react';

export default function PayrollPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ employeeId:'', month:8, year:2026, basicSalary:500000 });
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const load = () => {
    const t = localStorage.getItem('onehr_token');
    fetch(`${api}/payroll`, { headers:{Authorization:`Bearer ${t}`} }).then(r=>r.json()).then(d=> setRows(Array.isArray(d)?d:[]));
  };
  useEffect(load, [api]);
  const create = async () => {
    const t = localStorage.getItem('onehr_token');
    const emps = await fetch(`${api}/employees?limit=1`, { headers:{Authorization:`Bearer ${t}`} }).then(r=>r.json());
    const eid = form.employeeId || emps[0]?.id;
    if (!eid) return alert('No employee');
    await fetch(`${api}/payroll`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${t}`}, body: JSON.stringify({ employeeId: eid, month: form.month, year: form.year, basicSalary: Number(form.basicSalary) }) });
    load();
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet/> Payroll <span className="text-slate-500 font-normal">— OneHRCon merged (§31 simulator)</span></h1>
          <p className="text-sm text-slate-500">Basic + Allowances − Deductions − Tax = Net • Simulator: salary +10% → ₦12.5M/mo §31</p>
        </div>
        <div className="flex gap-2">
          <button onClick={create} className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Plus size={16}/> Run Payroll</button>
          <button className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Download size={16}/> Payslip PDF</button>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold">Payroll Runs</h3><Pill tone="blue">{rows.length} records</Pill></div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Employee</th><th className="p-2">Period</th><th className="p-2">Basic</th><th className="p-2">Allow</th><th className="p-2">Deduct</th><th className="p-2">Tax</th><th className="p-2">Net</th><th className="p-2">Status</th></tr></thead>
            <tbody className="divide-y">
              {rows.map(r=> (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="p-2 font-mono text-xs">{r.employee?.employeeCode || r.employeeId.slice(0,8)}</td>
                  <td className="p-2 text-xs">{r.month}/{r.year}</td>
                  <td className="p-2 text-xs">{Number(r.basicSalary).toLocaleString()}</td>
                  <td className="p-2 text-xs">{Number(r.allowances).toLocaleString()}</td>
                  <td className="p-2 text-xs">{Number(r.deductions).toLocaleString()}</td>
                  <td className="p-2 text-xs">{Number(r.tax).toLocaleString()}</td>
                  <td className="p-2 font-bold text-emerald-600">{Number(r.netPay).toLocaleString()}</td>
                  <td className="p-2"><Pill tone={r.status==='PAID'?'emerald':r.status==='DRAFT'?'amber':'slate'}>{r.status}</Pill></td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">No payrolls — run one (HR only)</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 text-xs text-slate-500">Payslip PDF via <code>PayslipPDF.tsx</code> (jsPDF) — OneHRCon merged • Bank details: GET /v1/payroll/bank/details</div>
      </GlassCard>
    </div>
  );
}
