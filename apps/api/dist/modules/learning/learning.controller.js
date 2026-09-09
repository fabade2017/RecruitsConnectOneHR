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
exports.LearningController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const learning_service_1 = require("./learning.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const module_guard_1 = require("../../common/guards/module.guard");
let LearningController = class LearningController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    courses(req, q) { return this.svc.courses(req.orgId, q); }
    listAlias(req, q) { return this.svc.courses(req.orgId, q); }
    getCourse(req, id) { return this.svc.getCourse(req.orgId, id); }
    getCourseAlias(req, id) { return this.svc.getCourse(req.orgId, id); }
    create(req, dto) { return this.svc.createCourse(req.orgId, dto); }
    createAlias(req, dto) { return this.svc.createCourse(req.orgId, dto); }
    updateCourse(req, id, dto) { return this.svc.updateCourse(req.orgId, id, dto); }
    updateAlias(req, id, dto) { return this.svc.updateCourse(req.orgId, id, dto); }
    removeCourse(req, id) { return this.svc.removeCourse(req.orgId, id); }
    removeAlias(req, id) { return this.svc.removeCourse(req.orgId, id); }
    enroll(req, dto) { return this.svc.enroll(req.orgId, dto, req.user); }
    enrollments(req, id) { return this.svc.enrollments(req.orgId, id, req.user); }
    update(req, id, dto) { return this.svc.updateProgress(req.orgId, id, dto, req.user); }
};
exports.LearningController = LearningController;
__decorate([
    (0, common_1.Get)('courses'),
    (0, rbac_guard_1.RequirePermissions)('learning:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "courses", null);
__decorate([
    (0, common_1.Get)(),
    (0, rbac_guard_1.RequirePermissions)('learning:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "listAlias", null);
__decorate([
    (0, common_1.Get)('courses/:id'),
    (0, rbac_guard_1.RequirePermissions)('learning:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "getCourse", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_guard_1.RequirePermissions)('learning:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "getCourseAlias", null);
__decorate([
    (0, common_1.Post)('courses'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "createAlias", null);
__decorate([
    (0, common_1.Patch)('courses/:id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "updateCourse", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "updateAlias", null);
__decorate([
    (0, common_1.Delete)('courses/:id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "removeCourse", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "removeAlias", null);
__decorate([
    (0, common_1.Post)('enroll'),
    (0, rbac_guard_1.RequirePermissions)('learning:enroll'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "enroll", null);
__decorate([
    (0, common_1.Get)('enrollments/:employeeId'),
    (0, rbac_guard_1.RequirePermissions)('learning:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "enrollments", null);
__decorate([
    (0, common_1.Patch)('enrollments/:id'),
    (0, rbac_guard_1.RequirePermissions)('learning:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "update", null);
exports.LearningController = LearningController = __decorate([
    (0, swagger_1.ApiTags)('learning'),
    (0, module_guard_1.RequireModule)('learning'),
    (0, common_1.Controller)('learning'),
    __metadata("design:paramtypes", [learning_service_1.LearningService])
], LearningController);
