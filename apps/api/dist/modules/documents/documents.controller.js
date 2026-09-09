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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const documents_service_1 = require("./documents.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const module_guard_1 = require("../../common/guards/module.guard");
let DocumentsController = class DocumentsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(req, q) { return this.svc.list(req.orgId, q, req.user); }
    get(req, id) { return this.svc.get(req.orgId, id); }
    download(req, id) { return this.svc.download(req.orgId, id); }
    create(req, dto, file) { return this.svc.create(req.orgId, dto, file, req.user); }
    verify(req, id, dto) { return this.svc.verify(req.orgId, id, dto); }
    update(req, id, dto) { return this.svc.update(req.orgId, id, dto); }
    remove(req, id) { return this.svc.remove(req.orgId, id); }
    // Assets endpoints (frontend /assets uses these)
    listAssets(req, q) { return this.svc.listAssets(req.orgId, q); }
    createAsset(req, dto) { return this.svc.assignAsset(req.orgId, dto); }
    assignAsset(req, dto) { return this.svc.assignAsset(req.orgId, dto); }
    returnAsset(req, id) { return this.svc.returnAsset(req.orgId, id); }
    assignAssetById(req, id, dto) {
        // if assigning existing asset to employee, update
        return this.svc.update(req.orgId, id, dto);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)('documents'),
    (0, rbac_guard_1.RequirePermissions)('document:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('documents/:id'),
    (0, rbac_guard_1.RequirePermissions)('document:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "get", null);
__decorate([
    (0, common_1.Get)('documents/:id/download'),
    (0, rbac_guard_1.RequirePermissions)('document:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "download", null);
__decorate([
    (0, common_1.Post)('documents'),
    (0, rbac_guard_1.RequirePermissions)('document:*'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('documents/:id/verify'),
    (0, rbac_guard_1.RequirePermissions)('document:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "verify", null);
__decorate([
    (0, common_1.Patch)('documents/:id'),
    (0, rbac_guard_1.RequirePermissions)('document:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('documents/:id'),
    (0, rbac_guard_1.RequirePermissions)('document:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('assets'),
    (0, rbac_guard_1.RequirePermissions)('document:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "listAssets", null);
__decorate([
    (0, common_1.Post)('assets'),
    (0, rbac_guard_1.RequirePermissions)('document:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "createAsset", null);
__decorate([
    (0, common_1.Post)('assets/assign'),
    (0, rbac_guard_1.RequirePermissions)('document:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "assignAsset", null);
__decorate([
    (0, common_1.Post)('assets/:id/return'),
    (0, rbac_guard_1.RequirePermissions)('document:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "returnAsset", null);
__decorate([
    (0, common_1.Post)('assets/:id/assign'),
    (0, rbac_guard_1.RequirePermissions)('document:*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "assignAssetById", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)('documents'),
    (0, module_guard_1.RequireModule)('documents'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
