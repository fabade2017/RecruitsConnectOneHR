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
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const learning_service_1 = require("./learning.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const module_guard_1 = require("../../common/guards/module.guard");
let LearningController = class LearningController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    listCourses(req) { return this.svc.listCourses(req.orgId); }
    getCourse(req, id) { return this.svc.getCourse(req.orgId, id); }
    getCourseAlias(req, id) { return this.svc.getCourse(req.orgId, id); }
    create(req, dto) { return this.svc.createCourse(req.orgId, dto); }
    createAlias(req, dto) { return this.svc.createCourse(req.orgId, dto); }
    updateCourse(req, id, dto) { return this.svc.updateCourse(req.orgId, id, dto); }
    updateAlias(req, id, dto) { return this.svc.updateCourse(req.orgId, id, dto); }
    removeCourse(req, id) { return this.svc.removeCourse(req.orgId, id); }
    removeAlias(req, id) { return this.svc.removeCourse(req.orgId, id); }
    enroll(req, dto) { return this.svc.enroll(req.orgId, dto, req.user); }
    listEnrollments(req, employeeId) { return this.svc.listEnrollments(req.orgId, employeeId, req.user); }
    uploadMaterial(req, id, file) { return this.svc.uploadMaterial(req.orgId, id, file); }
    generateQuiz(req, id) { return this.svc.generateQuiz(req.orgId, id); }
    getQuiz(req, enrollmentId) { return this.svc.getQuizForEnrollment(req.orgId, enrollmentId, req.user); }
    submitQuiz(req, enrollmentId, dto) { return this.svc.submitQuiz(req.orgId, enrollmentId, dto, req.user); }
};
exports.LearningController = LearningController;
__decorate([
    (0, common_1.Get)('courses'),
    (0, rbac_guard_1.RequirePermissions)('learning:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "listCourses", null);
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
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
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
], LearningController.prototype, "listEnrollments", null);
__decorate([
    (0, common_1.Post)('courses/:id/materials'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "uploadMaterial", null);
__decorate([
    (0, common_1.Post)('courses/:id/quiz/generate'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "generateQuiz", null);
__decorate([
    (0, common_1.Get)('enrollments/:enrollmentId/quiz'),
    (0, rbac_guard_1.RequirePermissions)('learning:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('enrollmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "getQuiz", null);
__decorate([
    (0, common_1.Post)('enrollments/:enrollmentId/quiz/submit'),
    (0, rbac_guard_1.RequirePermissions)('learning:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('enrollmentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], LearningController.prototype, "submitQuiz", null);
exports.LearningController = LearningController = __decorate([
    (0, swagger_1.ApiTags)('learning'),
    (0, module_guard_1.RequireModule)('learning'),
    (0, common_1.Controller)('learning'),
    __metadata("design:paramtypes", [learning_service_1.LearningService])
], LearningController);
