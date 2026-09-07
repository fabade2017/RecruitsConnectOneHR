"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("../../prisma/prisma.service");
let ChatGateway = class ChatGateway {
    prisma;
    server;
    userSockets = new Map(); // userId -> socketIds
    socketUser = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers.authorization?.replace('Bearer ', '') || client.handshake.query.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me-32-chars-minimum-secret-for-dev');
            const userId = payload.sub;
            const orgId = payload.org_id || payload.orgId;
            if (!userId || !orgId) {
                client.disconnect();
                return;
            }
            this.socketUser.set(client.id, { userId, orgId, email: payload.email });
            if (!this.userSockets.has(userId))
                this.userSockets.set(userId, new Set());
            this.userSockets.get(userId).add(client.id);
            // Join all conversation rooms for this user
            const parts = await this.prisma.conversationParticipant.findMany({ where: { userId }, select: { conversationId: true } });
            for (const p of parts)
                client.join(`conv:${p.conversationId}`);
            // Also join org room
            client.join(`org:${orgId}`);
            client.join(`user:${userId}`);
            // Notify presence
            this.server.to(`org:${orgId}`).emit('user:online', { userId, orgId });
            // send initial unread?
            client.emit('connected', { userId, orgId });
        }
        catch (e) {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const info = this.socketUser.get(client.id);
        if (info) {
            const set = this.userSockets.get(info.userId);
            if (set) {
                set.delete(client.id);
                if (set.size === 0) {
                    this.userSockets.delete(info.userId);
                    this.server.to(`org:${info.orgId}`).emit('user:offline', { userId: info.userId });
                }
            }
        }
        this.socketUser.delete(client.id);
    }
    // Helper to broadcast to conversation
    async emitToConversation(conversationId, event, payload) {
        this.server.to(`conv:${conversationId}`).emit(event, payload);
    }
    // Client can request to join a conversation after creation
    async handleJoin(client, data) {
        const info = this.socketUser.get(client.id);
        if (!info)
            return;
        const part = await this.prisma.conversationParticipant.findFirst({ where: { conversationId: data.conversationId, userId: info.userId } });
        if (!part)
            return;
        client.join(`conv:${data.conversationId}`);
        return { joined: data.conversationId };
    }
    handleTypingStart(client, data) {
        const info = this.socketUser.get(client.id);
        if (!info)
            return;
        client.to(`conv:${data.conversationId}`).emit('typing', { conversationId: data.conversationId, userId: info.userId, email: info.email, typing: true });
    }
    handleTypingStop(client, data) {
        const info = this.socketUser.get(client.id);
        if (!info)
            return;
        client.to(`conv:${data.conversationId}`).emit('typing', { conversationId: data.conversationId, userId: info.userId, typing: false });
    }
    async handleMessageSend(client, data) {
        const info = this.socketUser.get(client.id);
        if (!info)
            return { error: 'Unauthorized' };
        // validate participant
        const part = await this.prisma.conversationParticipant.findFirst({ where: { conversationId: data.conversationId, userId: info.userId } });
        if (!part)
            return { error: 'Not a participant' };
        const conv = await this.prisma.conversation.findFirst({ where: { id: data.conversationId, organizationId: info.orgId } });
        if (!conv)
            return { error: 'Conversation not found' };
        const content = data.content?.trim();
        if (!content && !data.attachments)
            return { error: 'Empty message' };
        const msg = await this.prisma.message.create({
            data: {
                organizationId: info.orgId,
                conversationId: data.conversationId,
                senderId: info.userId,
                content: content?.slice(0, 5000) || '',
                messageType: data.messageType || 'text',
                attachments: data.attachments ? JSON.stringify(data.attachments) : null,
                replyToId: data.replyToId || null,
            },
            include: { sender: { select: { id: true, email: true } }, replyTo: true },
        });
        await this.prisma.conversation.update({ where: { id: data.conversationId }, data: { lastMessageAt: new Date(), lastMessagePreview: content?.slice(0, 120) || '[attachment]' } });
        await this.prisma.conversationParticipant.updateMany({ where: { conversationId: data.conversationId, userId: info.userId }, data: { lastReadAt: new Date(), lastReadMessageId: msg.id } });
        await this.prisma.messageRead.upsert({ where: { messageId_userId: { messageId: msg.id, userId: info.userId } }, create: { messageId: msg.id, userId: info.userId }, update: {} });
        // Ensure all participants are joined to room (in case offline then online)
        const participants = await this.prisma.conversationParticipant.findMany({ where: { conversationId: data.conversationId }, select: { userId: true } });
        // Emit to conversation room
        this.server.to(`conv:${data.conversationId}`).emit('message:new', msg);
        // Also emit as notification popup to each participant who is not currently in that conv? Broadcast unread
        for (const p of participants) {
            if (p.userId === info.userId)
                continue;
            // Send personal notification event
            this.server.to(`user:${p.userId}`).emit('message:notify', { conversationId: data.conversationId, message: msg, conversation: conv });
        }
        return msg;
    }
    async handleRead(client, data) {
        const info = this.socketUser.get(client.id);
        if (!info)
            return;
        let lastId = data.messageId;
        if (!lastId) {
            const last = await this.prisma.message.findFirst({ where: { conversationId: data.conversationId }, orderBy: { createdAt: 'desc' }, select: { id: true } });
            lastId = last?.id;
        }
        if (!lastId)
            return;
        await this.prisma.conversationParticipant.updateMany({ where: { conversationId: data.conversationId, userId: info.userId }, data: { lastReadAt: new Date(), lastReadMessageId: lastId } });
        // Mark reads
        const msgs = await this.prisma.message.findMany({ where: { conversationId: data.conversationId, senderId: { not: info.userId } }, select: { id: true } });
        for (const m of msgs) {
            await this.prisma.messageRead.upsert({ where: { messageId_userId: { messageId: m.id, userId: info.userId } }, create: { messageId: m.id, userId: info.userId }, update: {} });
        }
        this.server.to(`conv:${data.conversationId}`).emit('message:read', { conversationId: data.conversationId, userId: info.userId, messageId: lastId });
    }
    // Called by service to notify after REST creation
    async notifyNewMessage(conversationId, message) {
        this.server.to(`conv:${conversationId}`).emit('message:new', message);
        // Also notify per user for popup
        const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
        const parts = await this.prisma.conversationParticipant.findMany({ where: { conversationId }, select: { userId: true } });
        for (const p of parts) {
            if (p.userId === message.senderId)
                continue;
            this.server.to(`user:${p.userId}`).emit('message:notify', { conversationId, message, conversation: conv });
        }
    }
    async notifyConversationCreated(conversationId) {
        const parts = await this.prisma.conversationParticipant.findMany({ where: { conversationId }, select: { userId: true } });
        const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId }, include: { participants: true } });
        for (const p of parts) {
            // make online sockets join
            const sockets = this.userSockets.get(p.userId);
            if (sockets)
                for (const sid of sockets) {
                    const s = this.server.sockets.sockets.get(sid);
                    s?.join(`conv:${conversationId}`);
                }
            this.server.to(`user:${p.userId}`).emit('conversation:new', conv);
        }
    }
    async notifyConversationUpdated(conversationId, conv) {
        this.server.to(`conv:${conversationId}`).emit('conversation:updated', conv);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:send'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessageSend", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleRead", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*', credentials: true },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatGateway);
