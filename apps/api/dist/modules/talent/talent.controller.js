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
exports.TalentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const talent_service_1 = require("./talent.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const module_guard_1 = require("../../common/guards/module.guard");
let TalentController = class TalentController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    listVacancies(req, q) { return this.svc.listVacancies(req.orgId, q, req.user); }
    createVacancy(req, dto) { return this.svc.createVacancy(req.orgId, dto); }
    getVacancy(req, id) { return this.svc.getVacancy(req.orgId, id); }
    apply(req, id, dto) { return this.svc.apply(req.orgId, id, dto, req.user); }
    apps(req, id) { return this.svc.listApplications(req.orgId, id); }
    opps(req, q) { return this.svc.listOpportunities(req.orgId, q); }
    createOpp(req, dto) { return this.svc.createOpportunity(req.orgId, dto); }
    marketplace(req, q) { return this.svc.marketplace(req.orgId, q); }
};
exports.TalentController = TalentController;
__decorate([
    (0, common_1.Get)('vacancies'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TalentController.prototype, "listVacancies", null);
__decorate([
    (0, common_1.Post)('vacancies'),
    (0, rbac_guard_1.RequirePermissions)('job:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TalentController.prototype, "createVacancy", null);
__decorate([
    (0, common_1.Get)('vacancies/:id'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TalentController.prototype, "getVacancy", null);
__decorate([
    (0, common_1.Post)('vacancies/:id/apply'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TalentController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)('vacancies/:id/applications'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TalentController.prototype, "apps", null);
__decorate([
    (0, common_1.Get)('talent/opportunities'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TalentController.prototype, "opps", null);
__decorate([
    (0, common_1.Post)('talent/opportunities'),
    (0, rbac_guard_1.RequirePermissions)('job:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TalentController.prototype, "createOpp", null);
__decorate([
    (0, common_1.Get)('talent/marketplace'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TalentController.prototype, "marketplace", null);
exports.TalentController = TalentController = __decorate([
    (0, swagger_1.ApiTags)('talent'),
    (0, module_guard_1.RequireModule)('talent_marketplace'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [talent_service_1.TalentService])
], TalentController);
