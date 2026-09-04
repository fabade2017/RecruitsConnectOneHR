'use client';
import { useEffect, useState } from 'react';
import { getApiUrl, getAuthHeaders, parseApiList } from '../../lib/api';

type Option = { id: string; name?: string; label?: string; value?: string; key?: string; slug?: string };

export function ApiDropdown({
  endpoint,
  value,
  onChange,
  placeholder = '— Select —',
  query = {},
  displayKey = 'name',
  valueKey = 'id',
  label,
  required,
  dependsOn,
}: {
  endpoint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  query?: Record<string,string>;
  displayKey?: string;
  valueKey?: string;
  label?: string;
  required?: boolean;
  dependsOn?: string | null;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError('');
      try {
        const api = getApiUrl();
        const params = new URLSearchParams(query as any);
        // if dependsOn is null/undefined, we treat as parent cleared -> maybe show empty
        const url = `${api}${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
        const token = typeof window !== 'undefined' ? localStorage.getItem('onehr_token') : null;
        if (!token) { setOptions([]); setError('Not authenticated'); return; }
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) {
          const t = await res.text().catch(()=> '');
          throw new Error(t.slice(0,200) || `HTTP ${res.status}`);
        }
        const json = await res.json().catch(()=> []);
        const list = parseApiList(json);
        if (!cancelled) setOptions(list);
      } catch (e:any) {
        if (!cancelled) setError(e.message || 'Failed to load');
        if (!cancelled) setOptions([]);
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(query), dependsOn]);

  const getLabel = (o:any) => o[displayKey] || o.name || o.label || o.title || o.key || o.slug || o.id;
  const getValue = (o:any) => o[valueKey] || o.id || o.key || o.slug;

  return (
    <label className="text-sm font-medium">
      {label}{required && <span className="text-red-500"> *</span>}
      <div className="relative mt-1">
        <select
          value={value}
          onChange={e=>onChange(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
        >
          <option value="">{loading ? 'Loading…' : placeholder}</option>
          {!loading && options.length===0 && <option disabled>— No options —</option>}
          {options.map((o:any)=> (
            <option key={getValue(o)} value={getValue(o)}>{getLabel(o)}</option>
          ))}
        </select>
        {loading && <span className="absolute right-3 top-3 text-xs text-slate-400">Loading…</span>}
      </div>
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
      {!loading && !error && options.length===0 && <span className="text-xs text-slate-400">No items. Create in Settings → Dropdowns.</span>}
    </label>
  );
}

// Simple generic select without fetch, for linked filtering client-side
export function LinkedSelect({
  options,
  value,
  onChange,
  placeholder,
  loading,
  error,
  label,
}: {
  options: any[];
  value: string;
  onChange:(v:string)=>void;
  placeholder?: string;
  loading?: boolean;
  error?: string;
  label?: string;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={e=>onChange(e.target.value)}
        disabled={loading}
        className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
      >
        <option value="">{loading ? 'Loading…' : placeholder || '— Select —'}</option>
        {loading ? <option disabled>Loading…</option> : options.length===0 ? <option disabled>— No options —</option> : options.map((o:any)=> (
          <option key={o.id} value={o.id}>{o.name || o.label || o.title || o.key || o.slug}</option>
        ))}
      </select>
      {loading && <span className="text-xs text-slate-400">Loading…</span>}
      {error && <span className="text-xs text-red-600 block mt-1">{error}</span>}
      {!loading && !error && options.length===0 && <span className="text-xs text-slate-400">No items. Create in Settings → Dropdowns.</span>}
    </label>
  );
}
