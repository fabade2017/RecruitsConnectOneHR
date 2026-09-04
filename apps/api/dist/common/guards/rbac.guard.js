"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacGuard = exports.ROLE_PERMISSIONS = exports.RequirePermissions = exports.Roles = exports.PERMISSIONS_KEY = exports.ROLES_KEY = void 0;
exports.hasPermission = hasPermission;
exports.getSystemPermissions = getSystemPermissions;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
exports.ROLES_KEY = 'roles';
exports.PERMISSIONS_KEY = 'permissions';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
const RequirePermissions = (...perms) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, perms);
exports.RequirePermissions = RequirePermissions;
// RBAC matrix per docs/RBAC.md — system roles fallback (custom roles override via DB)
exports.ROLE_PERMISSIONS = {
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
function hasPermission(perms, required) {
    if (perms.includes('*'))
        return true;
    return perms.some((p) => {
        if (p === required)
            return true;
        if (p.endsWith(':*'))
            return required.startsWith(p.replace(':*', ':'));
        if (required.endsWith(':*'))
            return p.startsWith(required.replace(':*', ':'));
        const pBase = p.split(':').slice(0, 2).join(':');
        const rBase = required.split(':').slice(0, 2).join(':');
        if (pBase === rBase)
            return true;
        return false;
    });
}
function getSystemPermissions(role) {
    return exports.ROLE_PERMISSIONS[role] || [];
}
let RbacGuard = class RbacGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const url = req.url || '';
        if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/health') || url.includes('/api/docs'))
            return true;
        const isPublic = this.reflector?.getAllAndOverride('isPublic', [context.getHandler(), context.getClass()]);
        if (isPublic)
            return true;
        const requiredRoles = this.reflector?.getAllAndOverride(exports.ROLES_KEY, [context.getHandler(), context.getClass()]);
        const requiredPerms = this.reflector?.getAllAndOverride(exports.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles && !requiredPerms)
            return true;
        const user = req.user;
        if (!user)
            throw new common_1.ForbiddenException('No user context');
        const role = user.role;
        if (!role)
            throw new common_1.ForbiddenException('No role');
        // Resolve dynamic permissions: if user has customRole, use DB, else system map, else JWT perms
        let userPerms = [];
        if (user.permissions && Array.isArray(user.permissions)) {
            userPerms = user.permissions;
        }
        else if (user.customRoleId) {
            try {
                const cr = await this.prisma.roleDefinition.findUnique({ where: { id: user.customRoleId } });
                if (cr) {
                    try {
                        userPerms = typeof cr.permissions === 'string' ? JSON.parse(cr.permissions) : cr.permissions || [];
                    }
                    catch {
                        userPerms = [];
                    }
                    if (!userPerms.length && cr.permissionLinks)
                        userPerms = cr.permissionLinks.map((p) => p.key);
                }
            }
            catch { }
        }
        if (!userPerms.length) {
            // Try by role slug custom
            try {
                const bySlug = await this.prisma.roleDefinition.findFirst({ where: { slug: role } });
                if (bySlug) {
                    try {
                        userPerms = typeof bySlug.permissions === 'string' ? JSON.parse(bySlug.permissions) : bySlug.permissions || [];
                    }
                    catch {
                        userPerms = [];
                    }
                }
            }
            catch { }
        }
        if (!userPerms.length)
            userPerms = getSystemPermissions(role);
        // Role check — allow if user has one of required roles OR has wildcard
        if (requiredRoles && !requiredRoles.includes(role) && !userPerms.includes('*') && role !== 'org_admin' && role !== 'super_admin') {
            // Also check if any required role's perms are subset of user perms — for custom roles that map to system roles
            const hasRolePerm = requiredRoles.some(r => getSystemPermissions(r).some(p => userPerms.some(up => hasPermission([up], p))));
            if (!hasRolePerm)
                throw new common_1.ForbiddenException(`Requires role: ${requiredRoles.join(', ')}`);
        }
        // Permission check — super_admin/org_admin with * bypass
        if (requiredPerms) {
            const ok = requiredPerms.every((perm) => hasPermission(userPerms, perm));
            if (!ok && !userPerms.includes('*') && role !== 'org_admin' && role !== 'super_admin') {
                throw new common_1.ForbiddenException(`Missing permission: ${requiredPerms.join(', ')} for role ${role}`);
            }
        }
        // Attach resolved perms for downstream use
        req.user.permissions = userPerms;
        return true;
    }
};
exports.RbacGuard = RbacGuard;
exports.RbacGuard = RbacGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, prisma_service_1.PrismaService])
], RbacGuard);
