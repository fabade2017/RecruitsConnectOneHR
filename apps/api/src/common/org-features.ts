// Per-organization feature toggles controlled by the platform Super Admin.
// Stored inside Organization.config JSON under the `features` key.
// Missing flags default to enabled so existing orgs keep current behaviour.

export interface OrgFeatures {
  faceEnrollment: boolean;
  clockIn: boolean;
  clockOut: boolean;
}

export const DEFAULT_ORG_FEATURES: OrgFeatures = {
  faceEnrollment: true,
  clockIn: true,
  clockOut: true,
};

export function parseOrgFeatures(config: unknown): OrgFeatures {
  let cfg: any = config;
  if (typeof config === 'string') {
    try { cfg = config ? JSON.parse(config) : {}; } catch { cfg = {}; }
  }
  const f = (cfg && typeof cfg === 'object' ? (cfg as any).features : null) || {};
  return {
    faceEnrollment: f.faceEnrollment !== false,
    clockIn: f.clockIn !== false,
    clockOut: f.clockOut !== false,
  };
}

export function mergeOrgFeatures(config: unknown, patch: Partial<OrgFeatures>): string {
  let cfg: any = {};
  if (typeof config === 'string') {
    try { cfg = config ? JSON.parse(config) : {}; } catch { cfg = {}; }
  } else if (config && typeof config === 'object') {
    cfg = { ...(config as any) };
  }
  const features: any = { ...(cfg.features || {}) };
  if (patch.faceEnrollment !== undefined) features.faceEnrollment = !!patch.faceEnrollment;
  if (patch.clockIn !== undefined) features.clockIn = !!patch.clockIn;
  if (patch.clockOut !== undefined) features.clockOut = !!patch.clockOut;
  cfg.features = features;
  return JSON.stringify(cfg);
}
