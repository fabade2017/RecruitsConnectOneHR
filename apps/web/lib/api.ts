'use client';

export const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
export const getAuthHeaders = (): Record<string,string> => {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('onehr_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export function parseApiList(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.permissions && Array.isArray(res.permissions)) return res.permissions;
  if (res?.departments && Array.isArray(res.departments)) return res.departments;
  if (res?.branches && Array.isArray(res.branches)) return res.branches;
  if (res?.roles && Array.isArray(res.roles)) return res.roles;
  if (res?.items && Array.isArray(res.items)) return res.items;
  return [];
}

export async function fetchJson(endpoint: string, opts: RequestInit = {}) {
  const api = getApiUrl();
  const headers: Record<string,string> = { ...getAuthHeaders(), ...(opts.headers as any || {}) };
  if (!headers['Content-Type'] && opts.body) headers['Content-Type'] = 'application/json';
  const url = endpoint.startsWith('http') ? endpoint : `${api}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) throw new Error((json && (json.message || json.error)) || `Request failed ${res.status}`);
  return json;
}
