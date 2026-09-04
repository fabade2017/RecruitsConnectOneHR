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
exports.OrganizationsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const organizations_service_1 = require("./organizations.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let OrganizationsController = class OrganizationsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    create(dto) { return this.svc.create(dto); }
    list() { return this.svc.listAll(); }
    get(id) { return this.svc.findOne(id); }
    update(id, dto) { return this.svc.update(id, dto); }
    config(id) { return this.svc.getConfig(id); }
    branding(id) { return this.svc.getBranding(id); }
    updateBranding(id, dto) { return this.svc.updateBranding(id, dto); }
    uploadLogo(id, file) { return this.svc.uploadLogo(id, file); }
    uploadLogoFile(id, file) { return this.svc.uploadLogo(id, file); }
    health(id, date) { return this.svc.healthScore(id, date); }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, rbac_guard_1.Roles)('super_admin', 'org_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_guard_1.Roles)('org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/config'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "config", null);
__decorate([
    (0, common_1.Get)(':id/branding'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "branding", null);
__decorate([
    (0, common_1.Patch)(':id/branding'),
    (0, rbac_guard_1.Roles)('org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "updateBranding", null);
__decorate([
    (0, common_1.Post)(':id/logo'),
    (0, rbac_guard_1.Roles)('org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Post)(':id/logo/file'),
    (0, rbac_guard_1.Roles)('org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "uploadLogoFile", null);
__decorate([
    (0, common_1.Get)(':id/health-score'),
    (0, rbac_guard_1.Roles)('executive', 'org_admin', 'hr_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('analytics:read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "health", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, swagger_1.ApiTags)('organizations'),
    (0, common_1.Controller)('organizations'),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
