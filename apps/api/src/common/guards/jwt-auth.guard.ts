import { Injectable, ExecutionContext, UnauthorizedException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/secrets';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Extract bearer token from Authorization header or (optional) cookies set by login. */
export function extractToken(req: any): string | null {
  const auth = req.headers?.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookieHeader = req.headers?.cookie || '';
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)onehr_access=([^;]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

@Injectable()
export class JwtAuthGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const url: string = req.url || '';
    // Public endpoints (no auth) — check before reflector to avoid DI issues
    if (
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/health') ||
      url.includes('/api/docs')
    )
      return true;

    const isPublic = this.reflector?.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const token = extractToken(req);
    if (!token) throw new UnauthorizedException('Missing token');
    try {
      const payload = jwt.verify(token, getJwtSecret()) as any;
      req.user = payload;
      // Tenant resolution: JWT org_id only for normal users.
      // super_admin may target an org via X-Organization-Id (platform admin ops).
      req.orgId = payload.org_id || payload.orgId;
      if (!req.orgId && payload.role === 'super_admin') {
        const headerOrg = req.headers['x-organization-id'] as string | undefined;
        if (headerOrg && /^[0-9a-f-]{36}$/i.test(headerOrg)) req.orgId = headerOrg;
      }
      if (!req.orgId && payload.role !== 'super_admin') throw new UnauthorizedException('Missing organization context');
      return true;
    } catch (e: any) {
      if (e instanceof UnauthorizedException) throw e;
      if (e.name === 'TokenExpiredError') throw new UnauthorizedException('Token expired');
      throw new UnauthorizedException(e.message || 'Invalid token');
    }
  }
}
