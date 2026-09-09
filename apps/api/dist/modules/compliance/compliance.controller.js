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
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const compliance_service_1 = require("./compliance.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const module_guard_1 = require("../../common/guards/module.guard");
let ComplianceController = class ComplianceController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    policies(req, q) { return this.svc.policies(req.orgId, q); }
    create(req, dto) { return this.svc.create(req.orgId, dto); }
    get(req, id) { return this.svc.get(req.orgId, id); }
    update(req, id, dto) { return this.svc.update(req.orgId, id, dto); }
    remove(req, id) { return this.svc.remove(req.orgId, id); }
    audits(req, id) { return this.svc.audits(req.orgId, id); }
    createAudit(req, id, dto) { return this.svc.createAudit(req.orgId, id, dto); }
    updateAudit(req, id, dto) { return this.svc.updateAudit(req.orgId, id, dto); }
};
exports.ComplianceController = ComplianceController;
__decorate([
    (0, common_1.Get)('policies'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'auditor', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('compliance:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "policies", null);
__decorate([
    (0, common_1.Post)('policies'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('compliance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('policies/:id'),
    (0, rbac_guard_1.RequirePermissions)('compliance:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)('policies/:id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('compliance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('policies/:id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('compliance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('policies/:id/audits'),
    (0, rbac_guard_1.RequirePermissions)('compliance:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "audits", null);
__decorate([
    (0, common_1.Post)('policies/:id/audits'),
    (0, rbac_guard_1.Roles)('auditor', 'hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('compliance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "createAudit", null);
__decorate([
    (0, common_1.Patch)('audits/:id'),
    (0, rbac_guard_1.Roles)('auditor', 'hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('compliance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "updateAudit", null);
exports.ComplianceController = ComplianceController = __decorate([
    (0, swagger_1.ApiTags)('compliance'),
    (0, module_guard_1.RequireModule)('compliance'),
    (0, common_1.Controller)('compliance'),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService])
], ComplianceController);
