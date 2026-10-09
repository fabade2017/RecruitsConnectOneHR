'use client';
import { useEffect, useState, useCallback } from 'react';
import { GlassCard, Pill } from '../../../components/ui/GlassCard';
import { Wallet, Download, Plus, Settings2, Play, X, Save, FileText, UserCog } from 'lucide-react';
import { getApiUrl, getAuthHeaders, parseApiList } from '../../../lib/api';
import { generatePayslipPDF } from '../../../components/merged/PayslipPDF';

const EMPTY_PROFILE = {
  employeeId: '', tin: '', pfa: '', rsaPin: '', stateOfResidence: '',
  basicSalary: 0, housingAllowance: 0, transportAllowance: 0, otherTaxable: 0, nonTaxable: 0,
  annualRentPaid: 0, nhisEnrolled: false, nhfEnrolled: true, otherDeductions: 0, loanRepayment: 0,
};

const num = (v: any) => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function PayrollPage() {
  const api = getApiUrl();
  const now = new Date();
  const [tab, setTab] = useState<'runs' | 'nigeria'>('nigeria');
  const [rows, setRows] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [form, setForm] = useState({ employeeId: '', month: now.getMonth() + 1, year: now.getFullYear(), basicSalary: 500000 });
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState<any>({});
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({ ...EMPTY_PROFILE });

  const headers = () => ({ 'Content-Type': 'application/json', ...getAuthHeaders() });

  const load = useCallback(async () => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('onehr_token') : null;
    if (!t) return;
    try {
      const [runsRes, empRes, profRes, cfgRes] = await Promise.all([
        fetch(`${api}/payroll`, { headers: getAuthHeaders() as any }).then(r => r.json()).catch(() => []),
        fetch(`${api}/employees?limit=200`, { headers: getAuthHeaders() as any }).then(r => r.json()).catch(() => []),
        fetch(`${api}/payroll/profiles`, { headers: getAuthHeaders() as any }).then(r => r.json()).catch(() => []),
        fetch(`${api}/payroll/config`, { headers: getAuthHeaders() as any }).then(r => r.json()).catch(() => null),
      ]);
      setRows(parseApiList(runsRes));
      setEmployees(parseApiList(empRes));
      setProfiles(parseApiList(profRes));
      if (cfgRes && !cfgRes.message) setConfig(cfgRes);
    } catch { /* ignore */ }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`${api}/payroll/statutory-summary?month=${month}&year=${year}`, { headers: getAuthHeaders() as any });
      const data = await res.json().catch(() => null);
      if (data && !data.message) setSummary(data.summary);
    } catch { /* ignore */ }
  }, [api, month, year]);

  useEffect(() => { if (tab === 'nigeria') loadSummary(); }, [tab, loadSummary]);

  const create = async () => {
    const eid = form.employeeId || employees[0]?.id;
    if (!eid) return alert('No employee');
    await fetch(`${api}/payroll`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ employeeId: eid, month: form.month, year: form.year, basicSalary: Number(form.basicSalary) }),
    });
    load();
  };

  const runNigeria = async () => {
    if (!profiles.length) return alert('No employee statutory profiles yet. Click "Staff payroll profile" to set them up.');
    setBusy(true);
    try {
      const res = await fetch(`${api}/payroll/run`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ month, year }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Run failed');
      setSummary(data.summary);
      await load();
      await loadSummary();
      alert(`Payroll run complete: ${data.count} employee(s) processed for ${month}/${year}.`);
    } catch (e: any) { alert(e.message); } finally { setBusy(false); }
  };

  const openConfig = () => {
    setConfigForm({
      employeePensionRate: config?.employeePensionRate ?? 0.08,
      employerPensionRate: config?.employerPensionRate ?? 0.1,
      nhfRate: config?.nhfRate ?? 0.025,
      nhisEmployeeRate: config?.nhisEmployeeRate ?? 0.05,
      nhisEmployerRate: config?.nhisEmployerRate ?? 0.1,
      nsitfRate: config?.nsitfRate ?? 0.01,
      itfRate: config?.itfRate ?? 0.01,
      rentReliefRate: config?.rentReliefRate ?? 0.2,
      rentReliefCap: config?.rentReliefCap ?? 500000,
      employerItfLiable: config?.employerItfLiable ?? true,
      currency: config?.currency ?? 'NGN',
    });
    setShowConfig(true);
  };

  const saveConfig = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${api}/payroll/config`, { method: 'PATCH', headers: headers(), body: JSON.stringify(configForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setConfig(data);
      setShowConfig(false);
    } catch (e: any) { alert(e.message); } finally { setBusy(false); }
  };

  const openProfile = (employeeId?: string) => {
    const p = employeeId ? profiles.find(x => x.employeeId === employeeId) : null;
    if (p) {
      setProfileForm({
        employeeId: p.employeeId, tin: p.tin || '', pfa: p.pfa || '', rsaPin: p.rsaPin || '',
        stateOfResidence: p.stateOfResidence || '',
        basicSalary: num(p.basicSalary), housingAllowance: num(p.housingAllowance), transportAllowance: num(p.transportAllowance),
        otherTaxable: num(p.otherTaxable), nonTaxable: num(p.nonTaxable), annualRentPaid: num(p.annualRentPaid),
        nhisEnrolled: !!p.nhisEnrolled, nhfEnrolled: p.nhfEnrolled !== false,
        otherDeductions: num(p.otherDeductions), loanRepayment: num(p.loanRepayment),
      });
    } else {
      setProfileForm({ ...EMPTY_PROFILE, employeeId: employeeId || employees[0]?.id || '' });
    }
    setShowProfile(true);
  };

  const saveProfile = async () => {
    if (!profileForm.employeeId) return alert('Select an employee');
    setBusy(true);
    try {
      const res = await fetch(`${api}/payroll/profiles/${profileForm.employeeId}`, { method: 'PUT', headers: headers(), body: JSON.stringify(profileForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setShowProfile(false);
      await load();
    } catch (e: any) { alert(e.message); } finally { setBusy(false); }
  };

  const payslip = async (id: string) => {
    try {
      const res = await fetch(`${api}/payroll/${id}/payslip`, { headers: getAuthHeaders() as any });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load payslip');
      generatePayslipPDF(data);
    } catch (e: any) { alert(e.message); }
  };

  const fmt = (v: any) => `₦${num(v).toLocaleString()}`;
  const pct = (v: any) => `${(num(v) * 100).toFixed(2)}%`;
  const periodRows = rows.filter(r => Number(r.month) === month && Number(r.year) === year && num(r.grossPay) > 0);
  const card = (label: string, value: any, tone: string) => (
    <GlassCard className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold ${tone}`}>{fmt(value)}</div>
    </GlassCard>
  );

  const cfgField = (key: string, label: string) => (
    <label className="text-sm font-medium">{label}
      <input type="number" step="0.0001" value={configForm[key] ?? ''} onChange={e => setConfigForm({ ...configForm, [key]: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border" />
    </label>
  );
  const profField = (key: string, label: string, step = '0.01') => (
    <label className="text-sm font-medium">{label}
      <input type="number" step={step} value={profileForm[key] ?? ''} onChange={e => setProfileForm({ ...profileForm, [key]: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border" />
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet /> Payroll <span className="text-slate-500 font-normal">— Nigeria Statutory</span></h1>
          <p className="text-sm text-slate-500">PAYE 2026 bands • Pension 8%/10% • NHF 2.5% • NHIS • NSITF • ITF • Rent relief</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openProfile()} className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><UserCog size={16} /> Staff payroll profile</button>
          <button onClick={openConfig} className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Settings2 size={16} /> Statutory rates</button>
          {tab === 'runs'
            ? <button onClick={create} className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Plus size={16} /> Run Payroll</button>
            : <button onClick={runNigeria} disabled={busy} className="bg-emerald-600 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"><Play size={16} /> {busy ? 'Running…' : 'Run Nigeria Payroll'}</button>}
        </div>
      </div>

      <div className="flex gap-2">
        {(['nigeria', 'runs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm ${tab === t ? 'bg-slate-900 text-white' : 'glass'}`}>
            {t === 'nigeria' ? 'Nigeria Statutory' : 'Payroll Runs'}
          </button>
        ))}
      </div>

      {config && (
        <GlassCard className="p-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
          <span>Employee Pension <b>{pct(config.employeePensionRate)}</b></span>
          <span>Employer Pension <b>{pct(config.employerPensionRate)}</b></span>
          <span>NHF <b>{pct(config.nhfRate)}</b></span>
          <span>NHIS (EE/ER) <b>{pct(config.nhisEmployeeRate)}/{pct(config.nhisEmployerRate)}</b></span>
          <span>NSITF <b>{pct(config.nsitfRate)}</b></span>
          <span>ITF <b>{pct(config.itfRate)}</b></span>
          <span>Rent relief <b>{pct(config.rentReliefRate)} (cap ₦{num(config.rentReliefCap).toLocaleString()})</b></span>
          <span>Currency <b>{config.currency}</b></span>
        </GlassCard>
      )}

      {tab === 'nigeria' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {card('Total Gross', summary?.grossPay, 'text-slate-900')}
            {card('Net Payroll', summary?.netPay, 'text-emerald-600')}
            {card('Total Employer Cost', summary?.employerCost, 'text-slate-900')}
            {card('Total Statutory Cost', summary?.totalStatutoryCost, 'text-rose-600')}
          </div>

          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">Statutory Breakdown — {periodRows.length} record(s)</h3>
              <div className="flex items-center gap-2 text-sm">
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="rounded-xl border px-3 py-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2026, m - 1).toLocaleString('en', { month: 'short' })}</option>)}
                </select>
                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="rounded-xl border px-3 py-2 w-24" />
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs">
                  <tr>
                    <th className="text-left p-2">Employee</th><th className="p-2">Gross</th><th className="p-2">Pension (EE)</th>
                    <th className="p-2">NHF</th><th className="p-2">NHIS</th><th className="p-2">PAYE</th>
                    <th className="p-2">Loan/Other</th><th className="p-2">Net Pay</th><th className="p-2">Employer Cost</th><th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {periodRows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <div className="font-semibold text-xs">{r.employee?.employeeCode || r.employee?.firstName || r.employeeId.slice(0, 8)}</div>
                        <div className="text-[11px] text-slate-500">{[r.employee?.firstName, r.employee?.lastName].filter(Boolean).join(' ') || r.employee?.jobTitle || ''}</div>
                      </td>
                      <td className="p-2 text-xs text-right">{fmt(r.grossPay)}</td>
                      <td className="p-2 text-xs text-right">{fmt(r.employeePension)}</td>
                      <td className="p-2 text-xs text-right">{fmt(r.nhf)}</td>
                      <td className="p-2 text-xs text-right">{fmt(r.nhisEmployee)}</td>
                      <td className="p-2 text-xs text-right">{fmt(r.tax)}</td>
                      <td className="p-2 text-xs text-right">{fmt(num(r.loanRepayment) + num(r.deductions) - num(r.employeePension) - num(r.nhf) - num(r.nhisEmployee))}</td>
                      <td className="p-2 text-xs text-right font-bold text-emerald-600">{fmt(r.netPay)}</td>
                      <td className="p-2 text-xs text-right">{fmt(r.employerCost)}</td>
                      <td className="p-2">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => payslip(r.id)} title="Payslip PDF" className="w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-white"><Download size={13} /></button>
                          <button onClick={() => openProfile(r.employeeId)} title="Edit profile" className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800"><FileText size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {periodRows.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-slate-500">No statutory payroll for {month}/{year}. Set up profiles and click “Run Nigeria Payroll”.</td></tr>}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {tab === 'runs' && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between"><h3 className="font-semibold">Payroll Runs</h3><Pill tone="blue">{rows.length} records</Pill></div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="text-left p-2">Employee</th><th className="p-2">Period</th><th className="p-2">Basic</th><th className="p-2">Allow</th><th className="p-2">Deduct</th><th className="p-2">Tax</th><th className="p-2">Net</th><th className="p-2">Status</th><th className="p-2">Payslip</th></tr></thead>
              <tbody className="divide-y">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-2 font-mono text-xs">{r.employee?.employeeCode || r.employeeId.slice(0, 8)}</td>
                    <td className="p-2 text-xs">{r.month}/{r.year}</td>
                    <td className="p-2 text-xs text-right">{num(r.basicSalary).toLocaleString()}</td>
                    <td className="p-2 text-xs text-right">{num(r.allowances).toLocaleString()}</td>
                    <td className="p-2 text-xs text-right">{num(r.deductions).toLocaleString()}</td>
                    <td className="p-2 text-xs text-right">{num(r.tax).toLocaleString()}</td>
                    <td className="p-2 text-xs text-right font-bold text-emerald-600">{num(r.netPay).toLocaleString()}</td>
                    <td className="p-2"><Pill tone={r.status === 'PAID' ? 'emerald' : r.status === 'DRAFT' ? 'amber' : 'slate'}>{r.status}</Pill></td>
                    <td className="p-2 text-center"><button onClick={() => payslip(r.id)} className="w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-white mx-auto"><Download size={13} /></button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-slate-500">No payrolls — run one (HR only)</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur" onClick={() => setShowConfig(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Settings2 size={18} /> Statutory Rates</h3>
              <button onClick={() => setShowConfig(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {cfgField('employeePensionRate', 'Employee Pension (e.g. 0.08)')}
                {cfgField('employerPensionRate', 'Employer Pension (e.g. 0.10)')}
                {cfgField('nhfRate', 'NHF (e.g. 0.025)')}
                {cfgField('nhisEmployeeRate', 'NHIS Employee (e.g. 0.05)')}
                {cfgField('nhisEmployerRate', 'NHIS Employer (e.g. 0.10)')}
                {cfgField('nsitfRate', 'NSITF (e.g. 0.01)')}
                {cfgField('itfRate', 'ITF (e.g. 0.01)')}
                {cfgField('rentReliefRate', 'Rent Relief Rate (e.g. 0.20)')}
                {cfgField('rentReliefCap', 'Rent Relief Annual Cap')}
                <label className="text-sm font-medium">Currency
                  <input value={configForm.currency || ''} onChange={e => setConfigForm({ ...configForm, currency: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border" />
                </label>
                <label className="text-sm font-medium flex items-center gap-2 mt-6">
                  <input type="checkbox" checked={!!configForm.employerItfLiable} onChange={e => setConfigForm({ ...configForm, employerItfLiable: e.target.checked })} /> Employer ITF liable
                </label>
              </div>
              <p className="text-xs text-slate-500">PAYE 2026 progressive bands are applied automatically: 0–800k 0%, then 15/18/21/23/25%.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowConfig(false)} className="flex-1 glass rounded-xl py-2.5 font-semibold">Cancel</button>
                <button onClick={saveConfig} disabled={busy} className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"><Save size={16} /> {busy ? 'Saving…' : 'Save rates'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur" onClick={() => setShowProfile(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold flex items-center gap-2"><UserCog size={18} /> Employee Payroll Profile</h3>
                <p className="text-xs text-slate-500">Monthly amounts • Pension base = Basic + Housing + Transport • NHF/NHIS on Basic</p>
              </div>
              <button onClick={() => setShowProfile(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm font-medium md:col-span-2">Employee
                  <select value={profileForm.employeeId} onChange={e => openProfile(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white">
                    <option value="">— Select employee —</option>
                    {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.employeeCode} • {[emp.firstName, emp.lastName].filter(Boolean).join(' ') || emp.jobTitle || ''}</option>)}
                  </select>
                </label>
                {profField('basicSalary', 'Basic Salary')}
                {profField('housingAllowance', 'Housing Allowance')}
                {profField('transportAllowance', 'Transport Allowance')}
                {profField('otherTaxable', 'Other Taxable Allowances')}
                {profField('nonTaxable', 'Non-Taxable Allowances')}
                {profField('annualRentPaid', 'Annual Rent Paid')}
                {profField('otherDeductions', 'Other Monthly Deductions')}
                {profField('loanRepayment', 'Loan Repayment')}
                <label className="text-sm font-medium">TIN
                  <input value={profileForm.tin || ''} onChange={e => setProfileForm({ ...profileForm, tin: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border" />
                </label>
                <label className="text-sm font-medium">PFA
                  <input value={profileForm.pfa || ''} onChange={e => setProfileForm({ ...profileForm, pfa: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border" />
                </label>
                <label className="text-sm font-medium">RSA PIN
                  <input value={profileForm.rsaPin || ''} onChange={e => setProfileForm({ ...profileForm, rsaPin: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border" />
                </label>
                <label className="text-sm font-medium">State of Residence
                  <input value={profileForm.stateOfResidence || ''} onChange={e => setProfileForm({ ...profileForm, stateOfResidence: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border" />
                </label>
                <label className="text-sm font-medium flex items-center gap-2 mt-6"><input type="checkbox" checked={!!profileForm.nhfEnrolled} onChange={e => setProfileForm({ ...profileForm, nhfEnrolled: e.target.checked })} /> NHF enrolled (2.5% of basic)</label>
                <label className="text-sm font-medium flex items-center gap-2 mt-6"><input type="checkbox" checked={!!profileForm.nhisEnrolled} onChange={e => setProfileForm({ ...profileForm, nhisEnrolled: e.target.checked })} /> NHIS enrolled</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowProfile(false)} className="flex-1 glass rounded-xl py-2.5 font-semibold">Cancel</button>
                <button onClick={saveProfile} disabled={busy} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"><Save size={16} /> {busy ? 'Saving…' : 'Save profile'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
