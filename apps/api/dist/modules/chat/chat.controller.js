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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
const chat_gateway_1 = require("./chat.gateway");
const dto_1 = require("./dto");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
let ChatController = class ChatController {
    svc;
    gateway;
    constructor(svc, gateway) {
        this.svc = svc;
        this.gateway = gateway;
    }
    listConversations(req, q) {
        return this.svc.listConversations(req.orgId, req.user.sub, q);
    }
    getConversation(req, id) {
        return this.svc.getConversation(req.orgId, id, req.user.sub);
    }
    async createConversation(req, dto) {
        const conv = await this.svc.createConversation(req.orgId, req.user.sub, dto);
        // Notify participants via socket
        this.gateway.notifyConversationCreated(conv.id).catch(() => { });
        return conv;
    }
    async updateConversation(req, id, dto) {
        const conv = await this.svc.updateConversation(req.orgId, id, req.user.sub, dto);
        this.gateway.notifyConversationUpdated(id, conv).catch(() => { });
        return conv;
    }
    addParticipants(req, id, dto) {
        return this.svc.addParticipants(req.orgId, id, req.user.sub, dto.userIds);
    }
    removeParticipant(req, id, userId) {
        return this.svc.removeParticipant(req.orgId, id, req.user.sub, userId);
    }
    leave(req, id) {
        return this.svc.leaveConversation(req.orgId, id, req.user.sub);
    }
    listMessages(req, id, q) {
        return this.svc.listMessages(req.orgId, id, req.user.sub, q);
    }
    async sendMessage(req, id, dto) {
        const msg = await this.svc.sendMessage(req.orgId, id, req.user.sub, dto);
        this.gateway.notifyNewMessage(id, msg).catch(() => { });
        return msg;
    }
    async uploadFile(req, id, file, body) {
        const msg = await this.svc.uploadFile(req.orgId, id, req.user.sub, file, body?.content || body?.caption);
        this.gateway.notifyNewMessage(id, msg).catch(() => { });
        return msg;
    }
    async cleanupFiles(req) {
        // Triggered by cron (or manually) — cleans files older than 7 days
        return this.svc.cleanupExpiredFiles();
    }
    async editMessage(req, id, messageId, dto) {
        const msg = await this.svc.editMessage(req.orgId, id, messageId, req.user.sub, dto.content);
        this.gateway.emitToConversation(id, 'message:edited', msg);
        return msg;
    }
    async deleteMessage(req, id, messageId) {
        const msg = await this.svc.deleteMessage(req.orgId, id, messageId, req.user.sub);
        this.gateway.emitToConversation(id, 'message:deleted', msg);
        return msg;
    }
    markRead(req, id, dto) {
        return this.svc.markRead(req.orgId, id, req.user.sub, dto?.messageId);
    }
    unreadCount(req) {
        return this.svc.getUnreadCount(req.orgId, req.user.sub);
    }
    searchUsers(req, q) {
        return this.svc.searchUsers(req.orgId, req.user.sub, q || '');
    }
    reads(req, id, messageId) {
        return this.svc.getReadReceipts(req.orgId, id, messageId, req.user.sub);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('conversations'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Post)('conversations'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateConversationDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Patch)('conversations/:id'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateConversationDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updateConversation", null);
__decorate([
    (0, common_1.Post)('conversations/:id/participants'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.AddParticipantsDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "addParticipants", null);
__decorate([
    (0, common_1.Delete)('conversations/:id/participants/:userId'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "removeParticipant", null);
__decorate([
    (0, common_1.Post)('conversations/:id/leave'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "leave", null);
__decorate([
    (0, common_1.Get)('conversations/:id/messages'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Post)('conversations/:id/messages'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('conversations/:id/files'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('cleanup/files'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "cleanupFiles", null);
__decorate([
    (0, common_1.Patch)('conversations/:id/messages/:messageId'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('messageId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "editMessage", null);
__decorate([
    (0, common_1.Delete)('conversations/:id/messages/:messageId'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Post)('conversations/:id/read'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "markRead", null);
__decorate([
    (0, common_1.Get)('unread/count'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "unreadCount", null);
__decorate([
    (0, common_1.Get)('users/search'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('conversations/:id/messages/:messageId/reads'),
    (0, rbac_guard_1.RequirePermissions)('employee:read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "reads", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('chat'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService, chat_gateway_1.ChatGateway])
], ChatController);
