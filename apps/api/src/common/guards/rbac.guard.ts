import { Injectable, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const RequirePermissions = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);

// RBAC matrix per docs/RBAC.md — system roles fallback (custom roles override via DB)
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  org_admin: ['*'],
  hr_admin: ['employee:*', 'attendance:*', 'leave:*', 'shift:*', 'document:*', 'workflow:*', 'report:*', 'payroll:*', 'job:*', 'learning:*', 'compliance:*', 'engagement:*', 'audit:read'],
  hr_manager: ['employee:read', 'attendance:read', 'leave:read', 'report:read', 'payroll:read', 'audit:read'],
  manager: ['employee:read', 'employee:read:team', 'attendance:read', 'attendance:read:team', 'attendance:clock', 'leave:read', 'leave:read:team', 'leave:approve:team', 'leave:request:self', 'payroll:read', 'task:*', 'learning:read', 'document:read', 'audit:read'],
  employee: ['employee:read', 'employee:read:self', 'employee:update:self', 'attendance:clock', 'attendance:read', 'attendance:read:self', 'leave:request:self', 'leave:read', 'leave:read:self', 'payroll:read', 'task:read', 'learning:read', 'learning:enroll', 'engagement:respond', 'document:read:self', 'job:read'],
  recruiter: ['job:*', 'vacancy:*', 'employee:read'],
  executive: ['report:read', 'analytics:read', 'employee:read', 'attendance:read', 'audit:read'],
  auditor: ['audit:read', 'report:read', 'compliance:read', 'employee:read'],
};

export function hasPermission(perms: string[], required: string): boolean {
  if (perms.includes('*')) return true;
  return perms.some((p) => {
    if (p === required) return true;
    if (p.endsWith(':*')) return required.startsWith(p.replace(':*', ':'));
    if (required.endsWith(':*')) return p.startsWith(required.replace(':*', ':'));
    const pBase = p.split(':').slice(0, 2).join(':');
    const rBase = required.split(':').slice(0, 2).join(':');
    if (pBase === rBase) return true;
    return false;
  });
}

export function getSystemPermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

@Injectable()
export class RbacGuard {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const url: string = req.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/health') || url.includes('/api/docs')) return true;

    const isPublic = this.reflector?.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const requiredRoles = this.reflector?.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    const requiredPerms = this.reflector?.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles && !requiredPerms) return true;

    const user = req.user;
    if (!user) throw new ForbiddenException('No user context');
    const role = user.role as string;
    if (!role) throw new ForbiddenException('No role');

    // Resolve dynamic permissions: if user has customRole, use DB, else system map, else JWT perms
    let userPerms: string[] = [];
    if (user.permissions && Array.isArray(user.permissions)) {
      userPerms = user.permissions;
    } else if (user.customRoleId) {
      try {
        const cr = await this.prisma.roleDefinition.findUnique({ where: { id: user.customRoleId } });
        if (cr) {
          try { userPerms = typeof cr.permissions === 'string' ? JSON.parse(cr.permissions as any) : (cr.permissions as any) || []; } catch { userPerms = []; }
          if (!userPerms.length && (cr as any).permissionLinks) userPerms = (cr as any).permissionLinks.map((p:any)=>p.key);
        }
      } catch {}
    }
    if (!userPerms.length) {
      // Try by role slug custom
      try {
        const bySlug = await this.prisma.roleDefinition.findFirst({ where: { slug: role } });
        if (bySlug) {
          try { userPerms = typeof bySlug.permissions === 'string' ? JSON.parse(bySlug.permissions as any) : (bySlug.permissions as any) || []; } catch { userPerms = []; }
        }
      } catch {}
    }
    if (!userPerms.length) userPerms = getSystemPermissions(role);

    // Role check — allow if user has one of required roles OR has wildcard
    if (requiredRoles && !requiredRoles.includes(role) && !userPerms.includes('*') && role !== 'org_admin' && role !== 'super_admin') {
      // Also check if any required role's perms are subset of user perms — for custom roles that map to system roles
      const hasRolePerm = requiredRoles.some(r => getSystemPermissions(r).some(p => userPerms.some(up => hasPermission([up], p))));
      if (!hasRolePerm) throw new ForbiddenException(`Requires role: ${requiredRoles.join(', ')}`);
    }

    // Permission check — super_admin/org_admin with * bypass
    if (requiredPerms) {
      const ok = requiredPerms.every((perm) => hasPermission(userPerms, perm));
      if (!ok && !userPerms.includes('*') && role !== 'org_admin' && role !== 'super_admin') {
        throw new ForbiddenException(`Missing permission: ${requiredPerms.join(', ')} for role ${role}`);
      }
    }

    // Attach resolved perms for downstream use
    req.user.permissions = userPerms;
    return true;
  }
}
