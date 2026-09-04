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
exports.PerformanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const performance_service_1 = require("./performance.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
let PerformanceController = class PerformanceController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(req, q) { return this.svc.list(req.orgId, q, req.user); }
    create(req, dto) { return this.svc.create(req.orgId, dto, req.user); }
    update(req, id, dto) { return this.svc.update(req.orgId, id, dto); }
    remove(req, id) { return this.svc.remove(req.orgId, id); }
    health(req, q) { return this.svc.health(req.orgId, q); }
};
exports.PerformanceController = PerformanceController;
__decorate([
    (0, common_1.Get)('reviews'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('reviews'),
    (0, rbac_guard_1.RequirePermissions)('task:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('reviews/:id'),
    (0, rbac_guard_1.RequirePermissions)('task:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('reviews/:id'),
    (0, rbac_guard_1.RequirePermissions)('task:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "health", null);
exports.PerformanceController = PerformanceController = __decorate([
    (0, swagger_1.ApiTags)('performance'),
    (0, common_1.Controller)('performance'),
    __metadata("design:paramtypes", [performance_service_1.PerformanceService])
], PerformanceController);
