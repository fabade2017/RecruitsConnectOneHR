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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payroll_service_1 = require("./payroll.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const module_guard_1 = require("../../common/guards/module.guard");
let PayrollController = class PayrollController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(req, q) { return this.svc.list(req.orgId, q, req.user); }
    create(req, dto) { return this.svc.create(req.orgId, dto); }
    update(id, dto) { return this.svc.update(id, dto); }
    payslip(req, id) { return this.svc.payslip(id, req.user); }
    bankList(req, eid) { return this.svc.bankDetails(req.orgId, eid, req.user); }
    upsertBank(req, dto) { return this.svc.upsertBankDetail(req.orgId, dto, req.user); }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)(),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'hr_manager', 'manager', 'executive', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('payroll:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List payrolls (OneHRCon merged)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('payroll:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('payroll:*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/payslip'),
    (0, rbac_guard_1.RequirePermissions)('payroll:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "payslip", null);
__decorate([
    (0, common_1.Get)('bank/details'),
    (0, rbac_guard_1.RequirePermissions)('payroll:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "bankList", null);
__decorate([
    (0, common_1.Post)('bank/details'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin', 'employee'),
    (0, rbac_guard_1.RequirePermissions)('payroll:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "upsertBank", null);
exports.PayrollController = PayrollController = __decorate([
    (0, swagger_1.ApiTags)('payroll'),
    (0, module_guard_1.RequireModule)('payroll'),
    (0, common_1.Controller)('payroll'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
