"use strict";
/**
 * Central secret resolution — fails fast in production when secrets are
 * missing or still set to well-known placeholders. Dev-only fallbacks are
 * allowed when NODE_ENV is not production.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = getJwtSecret;
exports.getJwtRefreshSecret = getJwtRefreshSecret;
exports.__resetSecretCaches = __resetSecretCaches;
const DEV_FALLBACK_JWT = 'dev-only-insecure-jwt-secret-do-not-use-in-prod-0001';
const DEV_FALLBACK_REFRESH = 'dev-only-insecure-refresh-secret-do-not-use-0002';
const PLACEHOLDERS = new Set([
    'CHANGE_ME_32_chars_min_jwt_secret_production',
    'CHANGE_ME_32_chars_min_refresh_secret_production',
    'change-me-32-chars-minimum-secret-for-dev',
    'change-me-refresh-32-chars-minimum',
    'change-me-refresh-32-chars',
    'changeme',
    'secret',
]);
function isProduction() {
    return process.env.NODE_ENV === 'production';
}
function resolveSecret(envName, devFallback) {
    const raw = (process.env[envName] || '').trim();
    if (raw && !PLACEHOLDERS.has(raw) && raw.length >= 16)
        return raw;
    if (isProduction()) {
        throw new Error(`[config] ${envName} is missing, too short (<16), or still a placeholder. ` +
            `Set a strong random value in the Render environment (e.g. openssl rand -hex 32). ` +
            `Refusing to start in production with an insecure secret.`);
    }
    if (raw && PLACEHOLDERS.has(raw)) {
        console.warn(`[config] ${envName} is a known placeholder — using DEV fallback (never do this in production).`);
    }
    return devFallback;
}
let cachedJwt = null;
let cachedRefresh = null;
function getJwtSecret() {
    if (!cachedJwt)
        cachedJwt = resolveSecret('JWT_SECRET', DEV_FALLBACK_JWT);
    return cachedJwt;
}
function getJwtRefreshSecret() {
    if (!cachedRefresh)
        cachedRefresh = resolveSecret('JWT_REFRESH_SECRET', DEV_FALLBACK_REFRESH);
    return cachedRefresh;
}
/** Clear caches — for tests only. */
function __resetSecretCaches() {
    cachedJwt = null;
    cachedRefresh = null;
}
