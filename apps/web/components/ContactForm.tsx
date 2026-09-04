'use client';
export default function ContactForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value || '';
    alert('Thanks — we will contact you at ' + email);
    form.reset();
  };
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <input name="name" placeholder="Full name" required className="border rounded-xl px-3 py-2.5" />
        <input name="email" type="email" placeholder="Work email" required className="border rounded-xl px-3 py-2.5" />
      </div>
      <input name="company" placeholder="Company • e.g., Sterling Bank" className="w-full border rounded-xl px-3 py-2.5" />
      <select className="w-full border rounded-xl px-3 py-2.5"><option>50–200 employees</option><option>200–1000</option><option>1000+</option></select>
      <textarea name="message" placeholder="Tell us about your workforce..." rows={4} className="w-full border rounded-xl px-3 py-2.5" />
      <button type="submit" className="w-full bg-slate-900 text-white rounded-full py-3 font-semibold hover:bg-slate-800">Send message →</button>
      <p className="text-xs text-slate-500 text-center">By submitting, you agree to our Privacy & Terms. We reply within 1 business day.</p>
    </form>
  );
}
