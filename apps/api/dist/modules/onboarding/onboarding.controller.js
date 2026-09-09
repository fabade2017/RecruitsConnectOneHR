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
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const onboarding_service_1 = require("./onboarding.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const module_guard_1 = require("../../common/guards/module.guard");
let OnboardingController = class OnboardingController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(req) { return this.svc.getChecklists(req.orgId); }
    listProgress(req) { return this.svc.listProgress(req.orgId); }
    getByEmployee(req, id) { return this.svc.getByEmployee(req.orgId, id); }
    getByEmployeeAlias(req, id) { return this.svc.getByEmployee(req.orgId, id); }
    toggle(req, empId, stepId) { return this.svc.toggleStep(req.orgId, empId, stepId); }
    toggleAlias(req, empId, stepId) { return this.svc.toggleStep(req.orgId, empId, stepId); }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Get)(),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('progress'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "listProgress", null);
__decorate([
    (0, common_1.Get)('employee/:employeeId'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "getByEmployee", null);
__decorate([
    (0, common_1.Get)(':employeeId'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "getByEmployeeAlias", null);
__decorate([
    (0, common_1.Patch)('employee/:employeeId/step/:stepId'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, common_1.Param)('stepId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "toggle", null);
__decorate([
    (0, common_1.Patch)(':employeeId/step/:stepId'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, common_1.Param)('stepId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "toggleAlias", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, swagger_1.ApiTags)('onboarding'),
    (0, module_guard_1.RequireModule)('onboarding'),
    (0, common_1.Controller)('onboarding'),
    __metadata("design:paramtypes", [onboarding_service_1.OnboardingService])
], OnboardingController);
