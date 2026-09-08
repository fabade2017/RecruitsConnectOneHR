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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const attendance_service_1 = require("./attendance.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
let AttendanceController = class AttendanceController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    clockIn(req, dto) { return this.svc.clockIn(req.orgId, req.user.sub, dto); }
    clockOut(req, dto) { return this.svc.clockOut(req.orgId, req.user.sub, dto); }
    breakStart(req, dto) { return this.svc.breakStart(req.orgId, req.user.sub, dto); }
    breakEnd(req, dto) { return this.svc.breakEnd(req.orgId, req.user.sub, dto); }
    sessions(req, q) { return this.svc.sessions(req.orgId, q, req.user); }
    map(req, q) { return this.svc.mapData(req.orgId, q, req.user); }
    commandCenter(req) { return this.svc.commandCenter(req.orgId, req.user); }
    exceptions(req, q) { return this.svc.exceptionsList(req.orgId, q); }
    resolve(req, id, dto) { return this.svc.resolveException(req.orgId, id, dto); }
    adminClockOut(req, id, dto) { return this.svc.adminClockOut(req.orgId, id, dto.clockOutAt, dto.reason, req.user); }
    autoClose(req, dto) { return this.svc.autoCloseMissing(req.orgId, dto.date, dto.clockOutAt, req.user); }
    missing(req, q) { return this.svc.missingSessions(req.orgId, q); }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('clock-in'),
    (0, rbac_guard_1.RequirePermissions)('attendance:clock'),
    (0, swagger_1.ApiOperation)({ summary: 'Smart clock-in (7 methods)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "clockIn", null);
__decorate([
    (0, common_1.Post)('clock-out'),
    (0, rbac_guard_1.RequirePermissions)('attendance:clock'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "clockOut", null);
__decorate([
    (0, common_1.Post)('break/start'),
    (0, rbac_guard_1.RequirePermissions)('attendance:clock'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "breakStart", null);
__decorate([
    (0, common_1.Post)('break/end'),
    (0, rbac_guard_1.RequirePermissions)('attendance:clock'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "breakEnd", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, rbac_guard_1.RequirePermissions)('attendance:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "sessions", null);
__decorate([
    (0, common_1.Get)('map'),
    (0, rbac_guard_1.RequirePermissions)('attendance:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "map", null);
__decorate([
    (0, common_1.Get)('command-center'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'hr_manager', 'manager', 'executive', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('attendance:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "commandCenter", null);
__decorate([
    (0, common_1.Get)('exceptions'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('attendance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "exceptions", null);
__decorate([
    (0, common_1.Patch)('exceptions/:id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('attendance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "resolve", null);
__decorate([
    (0, common_1.Patch)('admin/sessions/:id/clock-out'),
    (0, rbac_guard_1.Roles)('super_admin', 'org_admin', 'hr_admin'),
    (0, rbac_guard_1.RequirePermissions)('attendance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "adminClockOut", null);
__decorate([
    (0, common_1.Post)('admin/auto-close'),
    (0, rbac_guard_1.Roles)('super_admin', 'org_admin'),
    (0, rbac_guard_1.RequirePermissions)('attendance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "autoClose", null);
__decorate([
    (0, common_1.Get)('admin/missing'),
    (0, rbac_guard_1.Roles)('super_admin', 'org_admin', 'hr_admin'),
    (0, rbac_guard_1.RequirePermissions)('attendance:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "missing", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('attendance'),
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
