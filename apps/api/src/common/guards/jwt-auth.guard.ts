import { Injectable, ExecutionContext, UnauthorizedException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

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

    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me-32-chars-minimum-secret-for-dev') as any;
      req.user = payload;
      // Tenant resolution: prefer JWT org_id, fallback to header
      req.orgId = payload.org_id || payload.orgId || (req.headers['x-organization-id'] as string);
      if (!req.orgId) throw new UnauthorizedException('Missing organization context');
      return true;
    } catch (e: any) {
      if (e.name === 'TokenExpiredError') throw new UnauthorizedException('Token expired');
      throw new UnauthorizedException('Invalid token');
    }
  }
}
