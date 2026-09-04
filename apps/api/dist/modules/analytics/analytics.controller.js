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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
let AnalyticsController = class AnalyticsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    scores(req, q) { return this.svc.workforceScores(req.orgId, q); }
    score(req, q) { return this.svc.workforceScores(req.orgId, q); }
    dashboard(req, q) { return this.svc.dashboard(req.orgId, q); }
    reports(req, q) { return this.svc.reports(req.orgId, q); }
    activity(req, q) { return this.svc.activity(req.orgId, q); }
    risks(req) { return this.svc.risks(req.orgId); }
    warnings(req, q) { return this.svc.earlyWarnings(req.orgId, q); }
    simulate(req, dto) { return this.svc.simulate(req.orgId, dto); }
    twin(req, q) { return this.svc.digitalTwin(req.orgId, q); }
    detail(req, q) { return this.svc.workforceScores(req.orgId, q); }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('workforce-scores'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "scores", null);
__decorate([
    (0, common_1.Get)('workforce-score'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "score", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('reports'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "reports", null);
__decorate([
    (0, common_1.Get)('activity'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "activity", null);
__decorate([
    (0, common_1.Get)('risks'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "risks", null);
__decorate([
    (0, common_1.Get)('early-warnings'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "warnings", null);
__decorate([
    (0, common_1.Post)('simulate'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "simulate", null);
__decorate([
    (0, common_1.Get)('digital-twin'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "twin", null);
__decorate([
    (0, common_1.Get)('workforce-score/detail'),
    (0, rbac_guard_1.RequirePermissions)('report:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "detail", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
