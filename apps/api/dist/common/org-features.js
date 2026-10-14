"use strict";
// Per-organization feature toggles controlled by the platform Super Admin.
// Stored inside Organization.config JSON under the `features` key.
// Missing flags default to enabled so existing orgs keep current behaviour.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ORG_FEATURES = void 0;
exports.parseOrgFeatures = parseOrgFeatures;
exports.mergeOrgFeatures = mergeOrgFeatures;
exports.DEFAULT_ORG_FEATURES = {
    faceEnrollment: true,
    clockIn: true,
    clockOut: true,
};
function parseOrgFeatures(config) {
    let cfg = config;
    if (typeof config === 'string') {
        try {
            cfg = config ? JSON.parse(config) : {};
        }
        catch {
            cfg = {};
        }
    }
    const f = (cfg && typeof cfg === 'object' ? cfg.features : null) || {};
    return {
        faceEnrollment: f.faceEnrollment !== false,
        clockIn: f.clockIn !== false,
        clockOut: f.clockOut !== false,
    };
}
function mergeOrgFeatures(config, patch) {
    let cfg = {};
    if (typeof config === 'string') {
        try {
            cfg = config ? JSON.parse(config) : {};
        }
        catch {
            cfg = {};
        }
    }
    else if (config && typeof config === 'object') {
        cfg = { ...config };
    }
    const features = { ...(cfg.features || {}) };
    if (patch.faceEnrollment !== undefined)
        features.faceEnrollment = !!patch.faceEnrollment;
    if (patch.clockIn !== undefined)
        features.clockIn = !!patch.clockIn;
    if (patch.clockOut !== undefined)
        features.clockOut = !!patch.clockOut;
    cfg.features = features;
    return JSON.stringify(cfg);
}
