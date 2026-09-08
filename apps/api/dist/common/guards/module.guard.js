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
exports.ModuleGuard = exports.RequireModule = exports.MODULE_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
exports.MODULE_KEY = 'module';
const RequireModule = (moduleKey) => (0, common_1.SetMetadata)(exports.MODULE_KEY, moduleKey);
exports.RequireModule = RequireModule;
let ModuleGuard = class ModuleGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const moduleKey = this.reflector.getAllAndOverride(exports.MODULE_KEY, [context.getHandler(), context.getClass()]);
        if (!moduleKey)
            return true;
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        // super_admin bypass
        if (user?.role === 'super_admin')
            return true;
        const orgId = req.orgId || user?.org_id || user?.organizationId;
        if (!orgId)
            throw new common_1.ForbiddenException('Missing organization context');
        // Check active subscription includes module
        const sub = await this.prisma.organizationSubscription.findFirst({
            where: { organizationId: orgId, status: 'active' },
            include: { plan: { include: { modules: true } } },
            orderBy: { createdAt: 'desc' },
        });
        if (!sub)
            throw new common_1.ForbiddenException(`No active subscription — module '${moduleKey}' not available`);
        const has = sub.plan.modules.some(m => m.moduleKey === moduleKey && m.enabled);
        if (!has)
            throw new common_1.ForbiddenException(`Module '${moduleKey}' not included in your plan (${sub.plan.name}). Contact Super Admin to upgrade.`);
        return true;
    }
};
exports.ModuleGuard = ModuleGuard;
exports.ModuleGuard = ModuleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, prisma_service_1.PrismaService])
], ModuleGuard);
