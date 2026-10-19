import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Ensures every authenticated request has a tenant (orgId) resolved from the
 * verified JWT. Rejects non-super_admin requests that try to spoof
 * X-Organization-Id to a different org than the token claims.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const url: string = req.url || '';
    if (url.includes('/health') || url.includes('/api/docs') || url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return next.handle();
    }
    const user = req.user;
    if (!user) return next.handle();
    const tokenOrg = user.org_id || user.orgId || null;
    const headerOrg = (req.headers?.['x-organization-id'] as string) || null;
    // Non-super_admin: header must match JWT org if both present
    if (headerOrg && tokenOrg && user.role !== 'super_admin' && headerOrg !== tokenOrg) {
      throw new ForbiddenException('X-Organization-Id does not match authenticated organization');
    }
    // Prefer JWT org; super_admin may use header when JWT has none
    req.orgId = tokenOrg || (user.role === 'super_admin' ? headerOrg : null) || req.orgId;
    return next.handle();
  }
}
