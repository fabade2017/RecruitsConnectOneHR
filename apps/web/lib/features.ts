'use client';
import { useEffect, useState } from 'react';

export type OrgFeatures = {
  faceEnrollment: boolean;
  clockIn: boolean;
  clockOut: boolean;
};

export const DEFAULT_ORG_FEATURES: OrgFeatures = {
  faceEnrollment: true,
  clockIn: true,
  clockOut: true,
};

export function getStoredOrgId(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem('onehr_user') || 'null');
    return u?.org_id || u?.organizationId || null;
  } catch {
    return null;
  }
}

export function parseOrgFeatures(config: any): OrgFeatures {
  let cfg: any = config;
  if (typeof config === 'string') {
    try { cfg = config ? JSON.parse(config) : {}; } catch { cfg = {}; }
  }
  const f = (cfg && typeof cfg === 'object' ? cfg.features : null) || {};
  return {
    faceEnrollment: f.faceEnrollment !== false,
    clockIn: f.clockIn !== false,
    clockOut: f.clockOut !== false,
  };
}

export async function fetchOrgFeatures(orgId?: string): Promise<OrgFeatures> {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const t = typeof window !== 'undefined' ? localStorage.getItem('onehr_token') : null;
  const id = orgId || getStoredOrgId();
  if (!t || !id) return DEFAULT_ORG_FEATURES;
  try {
    const res = await fetch(`${api}/organizations/${id}/config`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return DEFAULT_ORG_FEATURES;
    const data = await res.json();
    return data?.features || parseOrgFeatures(data?.config);
  } catch {
    return DEFAULT_ORG_FEATURES;
  }
}

export function useOrgFeatures() {
  const [features, setFeatures] = useState<OrgFeatures>(DEFAULT_ORG_FEATURES);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    fetchOrgFeatures()
      .then(f => { if (mounted) { setFeatures(f); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  return { features, loading };
}
