'use client';
import { useState } from 'react';
import { ArrowRight, Check, Loader2, MessageCircle } from 'lucide-react';

const SALES_EMAIL = 'hello@recruitconnect.ng';
const SALES_WHATSAPP = '2348001234567';

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [handoff, setHandoff] = useState<null | { wa: string; mail: string }>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const lines = [
      `Name: ${data.name || ''}`,
      `Email: ${data.email || ''}`,
      `Company: ${data.company || ''}`,
      `Employees: ${data.size || ''}`,
      '',
      data.message || '',
    ].join('\n');

    setBusy(true);
    setError('');

    // Primary: hand the enquiry to sales over WhatsApp (works on the static
    // export where there is no server route to proxy).
    const wa = `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(lines)}`;
    const mail = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`OneHR enquiry — ${data.company || data.name || ''}`)}&body=${encodeURIComponent(lines)}`;

    setHandoff({ wa, mail });
    setBusy(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center"><Check size={22} /></div>
        <h3 className="text-xl font-black mt-4">Almost there — send it to us</h3>
        <p className="text-sm text-slate-600 mt-1.5 leading-6">
          We reply within one business day. Pick whichever you use most — your message is already written.
        </p>
        <div className="mt-5 space-y-3">
          <a href={handoff?.wa} target="_blank" rel="noopener noreferrer" className="w-full bg-emerald-500 text-white rounded-full py-3.5 font-semibold inline-flex items-center justify-center gap-2 hover:bg-emerald-600">
            <MessageCircle size={17} /> Send on WhatsApp
          </a>
          <a href={handoff?.mail} className="w-full bg-white border rounded-full py-3.5 font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50">
            Send by email <ArrowRight size={16} />
          </a>
        </div>
        <button onClick={() => { setSent(false); setHandoff(null); }} className="mt-4 w-full text-xs text-slate-500 hover:text-slate-900">
          Edit my details
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-3">
      <div>
        <h3 className="font-black text-lg">Book your demo</h3>
        <p className="text-xs text-slate-500 mt-0.5">Tell us a little about your workforce and we will come prepared.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input name="name" placeholder="Full name" required className="border rounded-xl px-3 py-2.5" />
        <input name="email" type="email" placeholder="Work email" required className="border rounded-xl px-3 py-2.5" />
      </div>
      <input name="company" placeholder="Company • e.g., Sterling Bank" className="w-full border rounded-xl px-3 py-2.5" />
      <select name="size" className="w-full border rounded-xl px-3 py-2.5">
        <option value="50–200 employees">50–200 employees</option>
        <option value="200–1000 employees">200–1,000 employees</option>
        <option value="1000+ employees">1,000+ employees</option>
        <option value="Under 50 employees">Under 50 employees</option>
      </select>
      <textarea name="message" placeholder="What is hurting most — payroll, attendance, or getting everyone onto one system?" rows={4} className="w-full border rounded-xl px-3 py-2.5" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button disabled={busy} type="submit" className="w-full bg-slate-900 text-white rounded-full py-3 font-semibold hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2">
        {busy ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <>Send message <ArrowRight size={16} /></>}
      </button>
      <p className="text-xs text-slate-500 text-center">By submitting, you agree to our Privacy &amp; Terms. We reply within 1 business day.</p>
    </form>
  );
}
