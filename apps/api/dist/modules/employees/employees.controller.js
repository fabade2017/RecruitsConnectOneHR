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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
let EmployeesController = class EmployeesController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    create(req, dto) { return this.svc.create(req.orgId, dto, req.user); }
    bulk(req, dto) { return this.svc.createBulk(req.orgId, dto, req.user); }
    async bulkExcel(req, file) { return this.svc.createBulkExcel(req.orgId, file, req.user); }
    template(req) { return this.svc.bulkTemplate(req.orgId); }
    async templateXlsx(req, res) {
        const { buffer, filename } = await this.svc.bulkTemplateExcel(req.orgId);
        res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
        res.send(Buffer.from(buffer));
    }
    list(req, q) { return this.svc.list(req.orgId, q, req.user); }
    get(req, id) { return this.svc.findOne(req.orgId, id, req.user); }
    update(req, id, dto) { return this.svc.update(req.orgId, id, dto, req.user); }
    async enrollFace(req, id, dto) { return this.svc.enrollFace(req.orgId, id, dto, req.user); }
    getFace(req, id) { return this.svc.getFaceProfile(req.orgId, id, req.user); }
    timeline(req, id, date) { return this.svc.timeline(req.orgId, id, date, req.user); }
    passport(req, id, fields) { return this.svc.passport(req.orgId, id, fields, req.user); }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Post)(),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    (0, swagger_1.ApiOperation)({ summary: 'Create employee with auto OneHR ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk create employees (300+ via JSON or CSV)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "bulk", null);
__decorate([
    (0, common_1.Post)('bulk/excel'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk create via Excel .xlsx with dropdowns' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "bulkExcel", null);
__decorate([
    (0, common_1.Get)('bulk/template'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Download CSV template for bulk upload' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "template", null);
__decorate([
    (0, common_1.Get)('bulk/template/xlsx'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Download Excel template with dropdowns (employment_type, department, grade, branch)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "templateXlsx", null);
__decorate([
    (0, common_1.Get)(),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/face-profile'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "enrollFace", null);
__decorate([
    (0, common_1.Get)(':id/face-profile'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getFace", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    (0, rbac_guard_1.RequirePermissions)('attendance:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "timeline", null);
__decorate([
    (0, common_1.Get)(':id/passport'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('fields')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "passport", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('employees'),
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
