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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("./audit.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
let AuditController = class AuditController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(req, q) {
        return this.svc.list(req.orgId, q, req.user);
    }
    adminList(req, q) {
        return this.svc.list(req.orgId, q, req.user);
    }
    stats(req) {
        return this.svc.stats(req.orgId, req.user);
    }
    adminStats(req) {
        return this.svc.stats(req.orgId, req.user);
    }
    async exportCsv(req, q, res) {
        const { csv, count } = await this.svc.exportCsv(req.orgId, q, req.user);
        res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="audit-${new Date().toISOString().slice(0, 10)}.csv"`, 'X-Total-Count': String(count) });
        res.send(csv);
    }
    getOne(req, id) {
        return this.svc.getOne(req.orgId, id, req.user);
    }
    adminGetOne(req, id) {
        return this.svc.getOne(req.orgId, id, req.user);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, rbac_guard_1.RequirePermissions)('audit:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List audit logs with full transparency — timing, IP, before/after' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('admin/audit-logs'),
    (0, rbac_guard_1.RequirePermissions)('audit:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin alias for audit logs (super_admin sees all)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "adminList", null);
__decorate([
    (0, common_1.Get)('audit-logs/stats'),
    (0, rbac_guard_1.RequirePermissions)('audit:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('admin/audit-logs/stats'),
    (0, rbac_guard_1.RequirePermissions)('audit:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "adminStats", null);
__decorate([
    (0, common_1.Get)('audit-logs/export'),
    (0, rbac_guard_1.RequirePermissions)('audit:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)('audit-logs/:id'),
    (0, rbac_guard_1.RequirePermissions)('audit:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)('admin/audit-logs/:id'),
    (0, rbac_guard_1.RequirePermissions)('audit:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "adminGetOne", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('audit'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
