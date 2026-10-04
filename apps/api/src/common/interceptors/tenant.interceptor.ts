import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { runWithTenant } from '../../prisma/tenant-context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  /**
   * Binds the authenticated organization to the async context so every Prisma
   * call made while handling this request is tenant-scoped by PrismaService.
   *
   * `next.handle()` is cold, so the subscription (and therefore the controller
   * invocation) is started inside `runWithTenant` — the store is inherited by
   * every promise continuation spawned from there.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const orgId = req?.orgId ?? null;
    const role = req?.user?.role ?? null;

    // Public routes, and global super admins, have no tenant to confine.
    if (!orgId || role === 'super_admin') return next.handle();

    return new Observable((subscriber) => {
      const subscription = runWithTenant({ orgId, role }, () =>
        next.handle().subscribe(subscriber),
      );
      return () => subscription.unsubscribe();
    });
  }
}