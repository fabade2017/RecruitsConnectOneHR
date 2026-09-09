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
const module_guard_1 = require("../../common/guards/module.guard");
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
    async verifyQr(token) { return this.svc.verifySecureQr(token); }
    async listIdCards(req, q) { return this.svc.listIdCards(req.orgId, q, req.user); }
    get(req, id) { return this.svc.findOne(req.orgId, id, req.user); }
    update(req, id, dto) { return this.svc.update(req.orgId, id, dto, req.user); }
    async uploadPhoto(req, id, file) { return this.svc.uploadPhoto(req.orgId, id, file, req.user); }
    async getIdCard(req, id) { return this.svc.getIdCardData(req.orgId, id, req.user); }
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
    (0, swagger_1.ApiBody)({ schema: { type: 'object', required: ['job_title'], properties: {
                job_title: { type: 'string', example: 'Sample Engineer' },
                grade: { type: 'string', example: 'L1' },
                department_id: { type: 'string', example: 'sample-dept-id' },
                branch_id: { type: 'string', example: 'sample-branch-id' },
                employment_type: { type: 'string', example: 'permanent', enum: ['permanent', 'contract', 'intern', 'part_time'] },
                work_arrangement: { type: 'string', example: 'office', enum: ['office', 'remote', 'hybrid', 'field', 'shift'] },
                hire_date: { type: 'string', format: 'date', example: '2024-01-15' },
                dob: { type: 'string', format: 'date', example: '1990-05-15' },
                date_of_birth: { type: 'string', format: 'date', example: '1990-05-15' },
                skills: { type: 'array', items: { type: 'string' }, example: ['SampleSkill1', 'SampleSkill2'] },
                email: { type: 'string', example: 'sample.employee@example.com' },
                phone: { type: 'string', example: '08000000000' },
                role: { type: 'string', example: 'employee' },
            } } }),
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
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: {
                employees: { type: 'array', items: { type: 'object', properties: { job_title: { type: 'string', example: 'Sample Engineer' }, grade: { type: 'string', example: 'L1' }, department: { type: 'string', example: 'Sample Dept' }, branch: { type: 'string', example: 'Sample Branch' }, employment_type: { type: 'string', example: 'permanent' }, work_arrangement: { type: 'string', example: 'office' }, hire_date: { type: 'string', example: '2024-01-15' }, dob: { type: 'string', example: '1990-05-15' }, skills: { type: 'string', example: 'SampleSkill1, SampleSkill2' }, phone: { type: 'string', example: '08000000000' }, email: { type: 'string', example: 'sample.bulk@example.com' } } } },
                csv: { type: 'string', example: 'job_title,grade,department,branch,employment_type,work_arrangement,hire_date,dob,skills,phone,email\nSample Engineer,L1,Sample Dept,Sample Branch,permanent,office,2024-01-15,1990-05-15,\"SampleSkill1,SampleSkill2\",08000000000,sample.bulk@example.com' },
            } } }),
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
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'Excel .xlsx file with job_title, grade, department, branch, employment_type, work_arrangement, hire_date, dob, skills, phone, email' } } } }),
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
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String, example: 'active' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, example: 'SAMPLE' }),
    (0, swagger_1.ApiQuery)({ name: 'department_id', required: false, type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('qr/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify secured QR token' }),
    (0, swagger_1.ApiQuery)({ name: 'token', type: String, description: 'JWT from QR secure token' }),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "verifyQr", null);
__decorate([
    (0, common_1.Get)('id-cards'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List ID cards (RBAC filtered, 8 per foolscap)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 50 }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "listIdCards", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, example: 'sample-employee-id' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: {
                jobTitle: { type: 'string', example: 'Sample Updated Title' },
                job_title: { type: 'string', example: 'Sample Updated Title' },
                grade: { type: 'string', example: 'L2' },
                departmentId: { type: 'string', example: 'sample-dept-id' },
                department_id: { type: 'string', example: 'sample-dept-id' },
                branchId: { type: 'string', example: 'sample-branch-id' },
                branch_id: { type: 'string', example: 'sample-branch-id' },
                employmentType: { type: 'string', example: 'contract' },
                employment_type: { type: 'string', example: 'contract' },
                workArrangement: { type: 'string', example: 'hybrid' },
                work_arrangement: { type: 'string', example: 'hybrid' },
                status: { type: 'string', example: 'active' },
                skills: { type: 'array', items: { type: 'string' }, example: ['SampleSkill1'] },
                email: { type: 'string', example: 'sample.updated@example.com' },
                phone: { type: 'string', example: '08000000001' },
                role: { type: 'string', example: 'employee' },
                dob: { type: 'string', example: '1990-05-15' },
                date_of_birth: { type: 'string', example: '1990-05-15' },
                hire_date: { type: 'string', example: '2024-01-15' },
                hireDate: { type: 'string', example: '2024-01-15' },
                photoUrl: { type: 'string', example: 'data:image/jpeg;base64,... or https://...' },
            } } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/photo'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload passport photo (employee self or hr/management, 5MB, visible to superadmin/management)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary', description: 'Passport photo jpeg/png/webp 5MB max' } } } }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Get)(':id/id-card'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get ID card front/back with secured QR' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getIdCard", null);
__decorate([
    (0, common_1.Post)(':id/face-profile'),
    (0, rbac_guard_1.RequirePermissions)('employee:*'),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', required: ['images'], properties: { images: { type: 'array', items: { type: 'string' }, example: ['data:image/jpeg;base64,...'] }, descriptors: { type: 'array', items: { type: 'array', items: { type: 'number' } }, description: '128-d face descriptors' }, consent: { type: 'boolean', example: true } } } }),
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
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getFace", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    (0, rbac_guard_1.RequirePermissions)('attendance:read'),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, type: String, example: '2024-01-15' }),
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
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiQuery)({ name: 'fields', required: false, type: String, example: 'employeeCode,jobTitle,grade' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('fields')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "passport", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('employees'),
    (0, module_guard_1.RequireModule)('people'),
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
