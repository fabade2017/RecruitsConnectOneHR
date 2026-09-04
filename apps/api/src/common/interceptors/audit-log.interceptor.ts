import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const method = req.method;
    const url: string = req.url || '';
    const start = Date.now();
    const isWrite = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
    // Skip health and docs and audit-logs itself to avoid recursion
    const skip = url.includes('/health') || url.includes('/api/docs') || url.includes('/audit-logs');

    return next.handle().pipe(
      tap({
        next: async () => {
          if (skip) return;
          // Log all writes + also auth login for transparency (POST /auth/login)
          const shouldLog = isWrite || url.includes('/auth/login') || url.includes('/auth/refresh');
          if (shouldLog && req.orgId) {
            try {
              const duration = Date.now() - start;
              const statusCode = res?.statusCode;
              const entityType = url.split('?')[0].split('/').filter(Boolean).pop() || 'unknown';
              // Try to get entityId from params or body
              const entityId = req.params?.id || req.body?.id || req.body?.employeeId || req.params?.employeeId || null;
              // Truncate large bodies for audit
              const bodyStr = req.body ? JSON.stringify(req.body).slice(0, 8000) : null;
              const userAgent = req.headers?.['user-agent']?.slice(0, 500) || null;
              await this.prisma.auditLog.create({
                data: {
                  organizationId: req.orgId,
                  userId: req.user?.sub || req.user?.id || null,
                  action: `${method} ${url}`,
                  entityType,
                  entityId: entityId ? String(entityId).slice(0, 100) : null,
                  newValue: bodyStr,
                  ip: req.ip || req.headers?.['x-forwarded-for'] || null,
                  userAgent,
                  duration,
                  statusCode,
                } as any,
              });
            } catch {}
          }
        },
        error: async (err: any) => {
          if (skip || !req.orgId) return;
          try {
            const duration = Date.now() - start;
            await this.prisma.auditLog.create({
              data: {
                organizationId: req.orgId,
                userId: req.user?.sub || null,
                action: `${method} ${url} [ERROR]`,
                entityType: 'error',
                newValue: JSON.stringify({ message: err?.message, stack: err?.stack?.slice(0, 2000) }).slice(0, 8000),
                ip: req.ip,
                duration,
                statusCode: err?.status || 500,
              } as any,
            });
          } catch {}
        },
      }),
    );
  }
}
