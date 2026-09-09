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
exports.WorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workflows_service_1 = require("./workflows.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const module_guard_1 = require("../../common/guards/module.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let WorkflowsController = class WorkflowsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    instances(req, q) { return this.svc.listInstances(req.orgId, q); }
    createInstance(req, dto) { return this.svc.createInstance(req.orgId, dto.workflowId, dto.entityType, dto.entityId); }
    approve(req, id, dto) { return this.svc.approveInstance(req.orgId, id, dto, req.user); }
    trigger(req, trigger, payload) {
        const orgId = req.orgId || payload.organizationId || req.headers['x-organization-id'];
        if (!orgId)
            return { error: 'orgId required' };
        return this.svc.trigger(orgId, trigger, payload);
    }
    list(req) { return this.svc.list(req.orgId); }
    get(req, id) { return this.svc.get(req.orgId, id); }
    create(req, dto) { return this.svc.create(req.orgId, dto, req.user); }
    update(req, id, dto) { return this.svc.update(req.orgId, id, dto); }
    remove(req, id) { return this.svc.remove(req.orgId, id); }
    toggle(req, id) { return this.svc.toggle(req.orgId, id); }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, common_1.Get)('instances/list'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "instances", null);
__decorate([
    (0, common_1.Post)('instances'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "createInstance", null);
__decorate([
    (0, common_1.Patch)('instances/:id/approve'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('trigger/:trigger'),
    (0, jwt_auth_guard_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('trigger')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "trigger", null);
__decorate([
    (0, common_1.Get)(),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('workflow:*'),
    (0, swagger_1.ApiOperation)({ summary: 'Create workflow (no-code builder)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/toggle'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "toggle", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, swagger_1.ApiTags)('workflows'),
    (0, module_guard_1.RequireModule)('workflow'),
    (0, common_1.Controller)('workflows'),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], WorkflowsController);
