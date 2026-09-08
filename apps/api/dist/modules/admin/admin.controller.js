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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
let AdminController = class AdminController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    // ===== Roles =====
    roles(orgId) { return this.svc.listRoles(orgId); }
    createRole(dto, req) { return this.svc.createRole(dto, req.user); }
    updateRole(id, dto) { return this.svc.updateRole(id, dto); }
    deleteRole(id) { return this.svc.deleteRole(id); }
    assignRole(userId, dto) { return this.svc.assignRole(userId, dto.role, dto.customRoleId); }
    // ===== Permissions =====
    permissions() { return this.svc.listPermissions(); }
    permissionsGrouped() { return this.svc.listPermissionsGrouped(); }
    modules() { return this.svc.listModules(); }
    createPermission(dto) { return this.svc.createPermission(dto); }
    // ===== Module Catalog (pricing) =====
    moduleCatalog() { return this.svc.listModuleCatalog(); }
    upsertModuleCatalog(dto) { return this.svc.upsertModuleCatalog(dto); }
    updateModuleCatalog(key, dto) { return this.svc.updateModuleCatalog(key, dto); }
    deleteModuleCatalog(key) { return this.svc.deleteModuleCatalog(key); }
    plansWithPricing() { return this.svc.getPlansWithPricing(); }
    // ===== Company Groups (Group of Companies) =====
    groups() { return this.svc.listGroups(); }
    group(id) { return this.svc.getGroup(id); }
    hierarchy(id) { return this.svc.groupHierarchy(id); }
    createGroup(dto, req) { return this.svc.createGroup(dto, req.user); }
    updateGroup(id, dto) { return this.svc.updateGroup(id, dto); }
    assignOrg(groupId, orgId) { return this.svc.assignOrganizationToGroup(groupId, orgId); }
    removeOrg(orgId) { return this.svc.removeOrganizationFromGroup(orgId); }
    // ===== Subscriptions & Module Assignment =====
    plans() { return this.svc.listPlans(); }
    plan(id) { return this.svc.getPlan(id); }
    createPlan(dto) { return this.svc.createPlan(dto); }
    updatePlan(id, dto) { return this.svc.updatePlan(id, dto); }
    assignModules(planId, dto) { return this.svc.assignModulesToPlan(planId, dto.modules); }
    setModulePrice(planId, moduleKey, dto) { return this.svc.setModulePrice(planId, moduleKey, dto.price); }
    removeModule(planId, moduleKey) { return this.svc.removeModuleFromPlan(planId, moduleKey); }
    subscriptions(orgId, groupId) { return this.svc.listSubscriptions(orgId, groupId); }
    assignSubscription(dto) { return this.svc.assignSubscription(dto); }
    updateSubscription(id, dto) { return this.svc.updateSubscription(id, dto); }
    cancelSubscription(id) { return this.svc.cancelSubscription(id); }
    checkAccess(orgId, moduleKey) { return this.svc.checkModuleAccess(orgId, moduleKey); }
    organizations() { return this.svc.listOrganizations(); }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('roles'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'List all roles (super_admin can create/assign)' }),
    __param(0, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "roles", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createRole", null);
__decorate([
    (0, common_1.Patch)('roles/:id'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Post)('users/:userId/assign-role'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "permissions", null);
__decorate([
    (0, common_1.Get)('permissions/grouped'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'List permissions grouped by module' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "permissionsGrouped", null);
__decorate([
    (0, common_1.Get)('modules'),
    (0, rbac_guard_1.Roles)('super_admin', 'org_admin', 'hr_admin', 'hr_manager', 'manager', 'employee'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List distinct modules (44) grouped from permissions table + static fallback for dropdowns' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "modules", null);
__decorate([
    (0, common_1.Post)('permissions'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Get)('module-catalog'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "moduleCatalog", null);
__decorate([
    (0, common_1.Post)('module-catalog'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "upsertModuleCatalog", null);
__decorate([
    (0, common_1.Patch)('module-catalog/:key'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateModuleCatalog", null);
__decorate([
    (0, common_1.Delete)('module-catalog/:key'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteModuleCatalog", null);
__decorate([
    (0, common_1.Get)('plans/pricing'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "plansWithPricing", null);
__decorate([
    (0, common_1.Get)('groups'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "groups", null);
__decorate([
    (0, common_1.Get)('groups/:id'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "group", null);
__decorate([
    (0, common_1.Get)('groups/:id/hierarchy'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "hierarchy", null);
__decorate([
    (0, common_1.Post)('groups'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Patch)('groups/:id'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Post)('groups/:id/organizations/:orgId'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignOrg", null);
__decorate([
    (0, common_1.Delete)('groups/:id/organizations/:orgId'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "removeOrg", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "plans", null);
__decorate([
    (0, common_1.Get)('plans/:id'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "plan", null);
__decorate([
    (0, common_1.Post)('plans'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Patch)('plans/:id'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Post)('plans/:id/modules'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign modules to subscription plan (Super Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignModules", null);
__decorate([
    (0, common_1.Patch)('plans/:id/modules/:moduleKey/price'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('moduleKey')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setModulePrice", null);
__decorate([
    (0, common_1.Delete)('plans/:id/modules/:moduleKey'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('moduleKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "removeModule", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Query)('organizationId')),
    __param(1, (0, common_1.Query)('companyGroupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "subscriptions", null);
__decorate([
    (0, common_1.Post)('subscriptions/assign'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign subscription to org or entire group' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignSubscription", null);
__decorate([
    (0, common_1.Patch)('subscriptions/:id'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateSubscription", null);
__decorate([
    (0, common_1.Post)('subscriptions/:id/cancel'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Get)('organizations/:orgId/modules/:moduleKey/access'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __param(0, (0, common_1.Param)('orgId')),
    __param(1, (0, common_1.Param)('moduleKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "checkAccess", null);
__decorate([
    (0, common_1.Get)('organizations'),
    (0, rbac_guard_1.RequirePermissions)('admin:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "organizations", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, common_1.Controller)('admin'),
    (0, rbac_guard_1.Roles)('super_admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
