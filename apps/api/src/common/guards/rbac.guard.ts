import { Injectable, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const PLATFORM_ONLY_KEY = 'platformOnly';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const RequirePermissions = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);
// Platform-only: super_admin belonging to the platform organisation (acronym) — other orgs' admins are not allowed
export const PlatformOnly = () => SetMetadata(PLATFORM_ONLY_KEY, true);

export function getPlatformOrgAcronym(): string {
  return (process.env.SUPER_ADMIN_ORG_ACRONYM || 'RC').trim().toUpperCase();
}

export function isPlatformSuperAdmin(user: any): boolean {
  if (!user || user.role !== 'super_admin') return false;
  const ac = String(user.org_acronym || '').trim().toUpperCase();
  return !!ac && ac === getPlatformOrgAcronym();
}

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

function permBase(p: string): string {
  return p.split(':').slice(0, 2).join(':');
}
function permScope(p: string): string | null {
  const parts = p.split(':');
  return parts.length > 2 ? parts.slice(2).join(':') : null;
}

export function hasPermission(perms: string[], required: string): boolean {
  if (!Array.isArray(perms) || !perms.length) return false;
  if (perms.includes('*')) return true;
  if (typeof required !== 'string' || !required) return false;
  return perms.some((p) => {
    if (typeof p !== 'string') return false;
    if (p === required) return true;
    // User wildcard: 'employee:*' grants 'employee:read', 'employee:update', etc.
    if (p.endsWith(':*')) return required.startsWith(p.slice(0, -1)); // 'employee:' prefix
    // Required wildcard: endpoint requires 'shift:*' → any 'shift:...' user perm satisfies it
    if (required.endsWith(':*')) return p.startsWith(required.slice(0, -1));
    // Same module:action — unscoped user perm covers any scope (leave:request → leave:request:self),
    // scoped user perm covers unscoped required (employee:read:self → employee:read),
    // but differing explicit scopes never cross (leave:read:self must NOT grant leave:read:team).
    if (permBase(p) === permBase(required)) {
      const sp = permScope(p);
      const sr = permScope(required);
      if (sp === sr) return true;
      if (sp === null || sr === null) return true;
      return false;
    }
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
    const platformOnly = this.reflector?.getAllAndOverride<boolean>(PLATFORM_ONLY_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles && !requiredPerms && !platformOnly) return true;

    const user = req.user;
    if (!user) throw new ForbiddenException('No user context');
    const role = user.role as string;
    if (!role) throw new ForbiddenException('No role');

    // Platform-only gate — runs before the role/permission bypasses below so org_admin
    // cannot slip past @Roles('super_admin') on subscription/plan/renewal endpoints
    if (platformOnly) {
      let ok = isPlatformSuperAdmin(user);
      // Older tokens may not carry org_acronym — resolve it once from DB
      if (!ok && role === 'super_admin' && !user.org_acronym && (user.org_id || user.orgId)) {
        try {
          const org = await this.prisma.organization.findUnique({ where: { id: user.org_id || user.orgId }, select: { acronym: true } });
          if (org?.acronym && org.acronym.trim().toUpperCase() === getPlatformOrgAcronym()) {
            user.org_acronym = org.acronym;
            ok = true;
          }
        } catch {}
      }
      if (!ok) throw new ForbiddenException(`Platform Super Admin only — managed by organisation ${getPlatformOrgAcronym()}`);
    }

    // Resolve dynamic permissions from DB (never trust stale JWT perms).
    // Order: customRoleId → role slug in custom roles → system matrix → JWT fallback.
    let userPerms: string[] = [];
    if (user.customRoleId) {
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
    // Last-resort: JWT-cached perms only if system matrix is empty for unknown roles
    if (!userPerms.length && Array.isArray(user.permissions)) userPerms = user.permissions;

    // Role check — allow if user has one of required roles OR fully covers one
    // required role's permission set (custom roles that duplicate a system role).
    // Never "any single overlap" — that let employees pass @Roles('hr_admin') gates.
    if (requiredRoles && !requiredRoles.includes(role) && !userPerms.includes('*') && role !== 'org_admin' && role !== 'super_admin') {
      const hasRolePerm = requiredRoles.some((r) => {
        const rolePerms = getSystemPermissions(r);
        if (!rolePerms.length) return false;
        return rolePerms.every((rp) => hasPermission(userPerms, rp));
      });
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
