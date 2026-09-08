import { Injectable, ExecutionContext, ForbiddenException, SetMetadata, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const MODULE_KEY = 'module';
export const RequireModule = (moduleKey: string) => SetMetadata(MODULE_KEY, moduleKey);

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleKey = this.reflector.getAllAndOverride<string>(MODULE_KEY, [context.getHandler(), context.getClass()]);
    if (!moduleKey) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    // super_admin bypass
    if (user?.role === 'super_admin') return true;
    const orgId = req.orgId || user?.org_id || user?.organizationId;
    if (!orgId) throw new ForbiddenException('Missing organization context');
    // Check active subscription includes module
    const sub = await this.prisma.organizationSubscription.findFirst({
      where: { organizationId: orgId, status: 'active' },
      include: { plan: { include: { modules: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) throw new ForbiddenException(`No active subscription — module '${moduleKey}' not available`);
    const has = sub.plan.modules.some(m => m.moduleKey === moduleKey && m.enabled);
    if (!has) throw new ForbiddenException(`Module '${moduleKey}' not included in your plan (${sub.plan.name}). Contact Super Admin to upgrade.`);
    return true;
  }
}
