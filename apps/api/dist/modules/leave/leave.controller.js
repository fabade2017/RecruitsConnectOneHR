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
exports.LeaveController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leave_service_1 = require("./leave.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
let LeaveController = class LeaveController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    types(req) { return this.svc.types(req.orgId); }
    createType(req, dto) { return this.svc.createType(req.orgId, dto); }
    request(req, dto) { return this.svc.request(req.orgId, req.user.sub, dto); }
    list(req, q) { return this.svc.list(req.orgId, q, req.user); }
    getOne(req, id) { return this.svc.getOne(req.orgId, id, req.user); }
    update(req, id, dto) { return this.svc.update(req.orgId, id, req.user, dto); }
    cancel(req, id) { return this.svc.cancel(req.orgId, id, req.user); }
    remove(req, id) { return this.svc.remove(req.orgId, id, req.user); }
    approve(id, req) { return this.svc.approve(id, req.user.sub, 'approved', req.user); }
    reject(id, req) { return this.svc.approve(id, req.user.sub, 'rejected', req.user); }
    bal(req, eid) { return this.svc.balances(req.orgId, eid, req.user); }
};
exports.LeaveController = LeaveController;
__decorate([
    (0, common_1.Get)('types'),
    (0, rbac_guard_1.RequirePermissions)('leave:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "types", null);
__decorate([
    (0, common_1.Post)('types'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('leave:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "createType", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, rbac_guard_1.RequirePermissions)('leave:request:self'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "request", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, rbac_guard_1.RequirePermissions)('leave:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('requests/:id'),
    (0, rbac_guard_1.RequirePermissions)('leave:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)('requests/:id'),
    (0, rbac_guard_1.RequirePermissions)('leave:request:self'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('requests/:id/cancel'),
    (0, rbac_guard_1.RequirePermissions)('leave:request:self'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "cancel", null);
__decorate([
    (0, common_1.Delete)('requests/:id'),
    (0, rbac_guard_1.RequirePermissions)('leave:request:self'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)('requests/:id/approve'),
    (0, rbac_guard_1.Roles)('manager', 'hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('leave:approve:team'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)('requests/:id/reject'),
    (0, rbac_guard_1.Roles)('manager', 'hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('leave:approve:team'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('balances/:employeeId'),
    (0, rbac_guard_1.RequirePermissions)('leave:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "bal", null);
exports.LeaveController = LeaveController = __decorate([
    (0, swagger_1.ApiTags)('leave'),
    (0, common_1.Controller)('leave'),
    __metadata("design:paramtypes", [leave_service_1.LeaveService])
], LeaveController);
