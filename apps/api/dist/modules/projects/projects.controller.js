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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const projects_service_1 = require("./projects.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const module_guard_1 = require("../../common/guards/module.guard");
let ProjectsController = class ProjectsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(req, q) { return this.svc.list(req.orgId, q, req.user); }
    get(req, id) { return this.svc.get(req.orgId, id); }
    create(req, dto) { return this.svc.create(req.orgId, dto, req.user); }
    update(req, id, dto) { return this.svc.update(req.orgId, id, dto); }
    remove(req, id) { return this.svc.remove(req.orgId, id); }
    tasks(req, id, q) { return this.svc.listTasks(req.orgId, id, q); }
    createTask(req, id, dto) { return this.svc.createTask(req.orgId, id, dto); }
    allTasks(req, q) { return this.svc.listAllTasks(req.orgId, q, req.user); }
    updateTask(req, id, dto) { return this.svc.updateTask(req.orgId, id, dto, req.user); }
    workload(req, id) { return this.svc.workload(req.orgId, id); }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Get)('projects'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List projects' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)('projects'),
    (0, rbac_guard_1.RequirePermissions)('task:*'),
    (0, swagger_1.ApiOperation)({ summary: 'Create project' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('projects/:id'),
    (0, rbac_guard_1.RequirePermissions)('task:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('projects/:id'),
    (0, rbac_guard_1.Roles)('hr_admin', 'org_admin', 'super_admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('projects/:id/tasks'),
    (0, rbac_guard_1.RequirePermissions)('task:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "tasks", null);
__decorate([
    (0, common_1.Post)('projects/:id/tasks'),
    (0, rbac_guard_1.RequirePermissions)('task:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "createTask", null);
__decorate([
    (0, common_1.Get)('tasks'),
    (0, rbac_guard_1.RequirePermissions)('task:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "allTasks", null);
__decorate([
    (0, common_1.Patch)('tasks/:id'),
    (0, rbac_guard_1.RequirePermissions)('task:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Get)('workload/:employeeId'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "workload", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiTags)('projects'),
    (0, module_guard_1.RequireModule)('tasks'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
