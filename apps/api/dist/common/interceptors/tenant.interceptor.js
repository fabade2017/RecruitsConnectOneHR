"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantInterceptor = void 0;
const common_1 = require("@nestjs/common");
/**
 * Ensures every authenticated request has a tenant (orgId) resolved from the
 * verified JWT. Rejects non-super_admin requests that try to spoof
 * X-Organization-Id to a different org than the token claims.
 */
let TenantInterceptor = class TenantInterceptor {
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const url = req.url || '';
        if (url.includes('/health') || url.includes('/api/docs') || url.includes('/auth/login') || url.includes('/auth/refresh')) {
            return next.handle();
        }
        const user = req.user;
        if (!user)
            return next.handle();
        const tokenOrg = user.org_id || user.orgId || null;
        const headerOrg = req.headers?.['x-organization-id'] || null;
        // Non-super_admin: header must match JWT org if both present
        if (headerOrg && tokenOrg && user.role !== 'super_admin' && headerOrg !== tokenOrg) {
            throw new common_1.ForbiddenException('X-Organization-Id does not match authenticated organization');
        }
        // Prefer JWT org; super_admin may use header when JWT has none
        req.orgId = tokenOrg || (user.role === 'super_admin' ? headerOrg : null) || req.orgId;
        return next.handle();
    }
};
exports.TenantInterceptor = TenantInterceptor;
exports.TenantInterceptor = TenantInterceptor = __decorate([
    (0, common_1.Injectable)()
], TenantInterceptor);
