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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ChatService = class ChatService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureParticipant(orgId, conversationId, userId) {
        const p = await this.prisma.conversationParticipant.findFirst({
            where: { conversationId, userId },
        });
        if (!p)
            throw new common_1.ForbiddenException('Not a participant');
        // also verify org
        const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, organizationId: orgId } });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        return p;
    }
    async listConversations(orgId, userId, q) {
        const take = Math.min(parseInt(q.limit || '50', 10), 100);
        const participants = await this.prisma.conversationParticipant.findMany({
            where: { userId },
            select: { conversationId: true },
        });
        const ids = participants.map(p => p.conversationId);
        if (!ids.length)
            return [];
        const search = q.search?.trim();
        const where = { id: { in: ids }, organizationId: orgId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { lastMessagePreview: { contains: search, mode: 'insensitive' } },
            ];
        }
        const convs = await this.prisma.conversation.findMany({
            where,
            include: {
                participants: { include: { user: { select: { id: true, email: true, role: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { id: true, email: true } } } },
            },
            orderBy: { lastMessageAt: 'desc' },
            take,
        });
        // enrich with unread count and other participant for direct
        const enriched = await Promise.all(convs.map(async (c) => {
            const unread = await this.prisma.message.count({
                where: {
                    conversationId: c.id,
                    senderId: { not: userId },
                    createdAt: { gt: participants.find(p => p.conversationId === c.id)?.lastReadAt || new Date(0) },
                },
            });
            // compute accurate unread via lastReadAt
            const me = c.participants.find((p) => p.userId === userId);
            let unread2 = 0;
            if (me?.lastReadAt) {
                unread2 = await this.prisma.message.count({
                    where: { conversationId: c.id, createdAt: { gt: me.lastReadAt }, senderId: { not: userId } },
                });
            }
            else {
                unread2 = await this.prisma.message.count({ where: { conversationId: c.id, senderId: { not: userId } } });
            }
            // Fetch employee info for participants to show names
            const userIds = c.participants.map((p) => p.userId);
            const employees = await this.prisma.employee.findMany({
                where: { userId: { in: userIds } },
                select: { userId: true, id: true, jobTitle: true, photoUrl: true },
            });
            const empMap = new Map(employees.map(e => [e.userId, e]));
            const partsEnriched = c.participants.map((p) => ({
                ...p,
                employee: empMap.get(p.userId) || null,
            }));
            return { ...c, participants: partsEnriched, unreadCount: unread2 };
        }));
        return enriched;
    }
    async getConversation(orgId, conversationId, userId) {
        await this.ensureParticipant(orgId, conversationId, userId);
        const conv = await this.prisma.conversation.findFirst({
            where: { id: conversationId, organizationId: orgId },
            include: {
                participants: { include: { user: { select: { id: true, email: true, role: true } } } },
            },
        });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        const userIds = conv.participants.map((p) => p.userId);
        const employees = await this.prisma.employee.findMany({ where: { userId: { in: userIds } }, select: { userId: true, id: true, jobTitle: true, photoUrl: true } });
        const empMap = new Map(employees.map(e => [e.userId, e]));
        return {
            ...conv,
            participants: conv.participants.map((p) => ({ ...p, employee: empMap.get(p.userId) || null })),
        };
    }
    async createConversation(orgId, creatorId, dto) {
        const type = dto.type || 'direct';
        let participantIds = [...(dto.participantIds || [])];
        // dedupe and ensure creator included
        participantIds = [...new Set(participantIds.filter((id) => id !== creatorId))];
        if (!participantIds.length)
            throw new common_1.BadRequestException('At least one participant required');
        // verify all users belong to same org
        const users = await this.prisma.user.findMany({ where: { id: { in: participantIds }, organizationId: orgId } });
        if (users.length !== participantIds.length)
            throw new common_1.BadRequestException('One or more participants not found in organization');
        if (type === 'direct') {
            if (participantIds.length !== 1)
                throw new common_1.BadRequestException('Direct chat requires exactly 1 other participant');
            const otherId = participantIds[0];
            // Check existing direct conversation between these two
            const existing = await this.prisma.conversation.findFirst({
                where: {
                    organizationId: orgId,
                    type: 'direct',
                    AND: [
                        { participants: { some: { userId: creatorId } } },
                        { participants: { some: { userId: otherId } } },
                    ],
                },
                include: { participants: true },
            });
            // Ensure exactly 2 participants
            if (existing && existing.participants.length === 2) {
                return existing;
            }
            const conv = await this.prisma.conversation.create({
                data: {
                    organizationId: orgId,
                    type: 'direct',
                    createdById: creatorId,
                    participants: {
                        create: [
                            { userId: creatorId, role: 'admin' },
                            { userId: otherId, role: 'member' },
                        ],
                    },
                },
                include: { participants: true },
            });
            return conv;
        }
        // group
        if (!dto.name?.trim())
            throw new common_1.BadRequestException('Group name required');
        if (participantIds.length < 1)
            throw new common_1.BadRequestException('Group requires at least 2 participants total (you + others)');
        if (participantIds.length > 99)
            throw new common_1.BadRequestException('Too many participants (max 100)');
        const conv = await this.prisma.conversation.create({
            data: {
                organizationId: orgId,
                type: 'group',
                name: dto.name.trim(),
                avatarUrl: dto.avatarUrl || null,
                createdById: creatorId,
                participants: {
                    create: [
                        { userId: creatorId, role: 'admin' },
                        ...participantIds.map((uid) => ({ userId: uid, role: 'member' })),
                    ],
                },
            },
            include: { participants: true },
        });
        return conv;
    }
    async updateConversation(orgId, conversationId, userId, dto) {
        await this.ensureParticipant(orgId, conversationId, userId);
        const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, organizationId: orgId } });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        if (conv.type === 'direct' && dto.name)
            throw new common_1.BadRequestException('Cannot rename direct conversation');
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                name: dto.name !== undefined ? dto.name : conv.name,
                avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : conv.avatarUrl,
            },
        });
        return updated;
    }
    async addParticipants(orgId, conversationId, userId, userIds) {
        await this.ensureParticipant(orgId, conversationId, userId);
        const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, organizationId: orgId } });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        if (conv.type === 'direct')
            throw new common_1.BadRequestException('Cannot add participants to direct chat — create a group');
        const users = await this.prisma.user.findMany({ where: { id: { in: userIds }, organizationId: orgId } });
        if (users.length !== userIds.length)
            throw new common_1.BadRequestException('Some users not found in org');
        for (const uid of userIds) {
            await this.prisma.conversationParticipant.upsert({
                where: { conversationId_userId: { conversationId, userId: uid } },
                create: { conversationId, userId: uid, role: 'member' },
                update: {},
            });
        }
        return this.getConversation(orgId, conversationId, userId);
    }
    async removeParticipant(orgId, conversationId, requesterId, targetUserId) {
        await this.ensureParticipant(orgId, conversationId, requesterId);
        const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, organizationId: orgId } });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        // Allow self-leave or admin removes
        const requesterPart = await this.prisma.conversationParticipant.findFirst({ where: { conversationId, userId: requesterId } });
        if (targetUserId !== requesterId && requesterPart?.role !== 'admin')
            throw new common_1.ForbiddenException('Only admins can remove others');
        await this.prisma.conversationParticipant.deleteMany({ where: { conversationId, userId: targetUserId } });
        const remaining = await this.prisma.conversationParticipant.count({ where: { conversationId } });
        if (remaining === 0) {
            await this.prisma.conversation.delete({ where: { id: conversationId } });
            return { deleted: true };
        }
        return { success: true };
    }
    async leaveConversation(orgId, conversationId, userId) {
        return this.removeParticipant(orgId, conversationId, userId, userId);
    }
    async listMessages(orgId, conversationId, userId, q) {
        await this.ensureParticipant(orgId, conversationId, userId);
        const take = Math.min(parseInt(q.limit || '50', 10), 100);
        const cursor = q.cursor; // message id
        const order = q.order === 'asc' ? 'asc' : 'desc';
        const where = { conversationId, organizationId: orgId };
        if (q.search)
            where.content = { contains: q.search, mode: 'insensitive' };
        let query = {
            where,
            orderBy: { createdAt: order },
            take: take + 1,
            include: {
                sender: { select: { id: true, email: true, role: true } },
                replyTo: { select: { id: true, content: true, senderId: true } },
                reads: true,
            },
        };
        if (cursor) {
            const curMsg = await this.prisma.message.findFirst({ where: { id: cursor, conversationId } });
            if (curMsg)
                query.cursor = { id: cursor };
            query.skip = 1;
        }
        const msgs = await this.prisma.message.findMany(query);
        const hasMore = msgs.length > take;
        const items = hasMore ? msgs.slice(0, take) : msgs;
        // enrich with sender employee
        const senderIds = [...new Set(items.map((m) => m.senderId))];
        const emps = await this.prisma.employee.findMany({ where: { userId: { in: senderIds } }, select: { userId: true, photoUrl: true, jobTitle: true } });
        const empMap = new Map(emps.map(e => [e.userId, e]));
        const enriched = items.map((m) => ({ ...m, senderEmployee: empMap.get(m.senderId) || null }));
        return {
            items: order === 'desc' ? enriched : enriched.reverse(),
            nextCursor: hasMore ? items[items.length - 1].id : null,
            hasMore,
        };
    }
    async sendMessage(orgId, conversationId, senderId, dto) {
        await this.ensureParticipant(orgId, conversationId, senderId);
        if (!dto.content?.trim() && !dto.attachments)
            throw new common_1.BadRequestException('Message content required');
        if (dto.replyToId) {
            const reply = await this.prisma.message.findFirst({ where: { id: dto.replyToId, conversationId } });
            if (!reply)
                throw new common_1.BadRequestException('Reply message not found in this conversation');
        }
        const content = dto.content.trim().slice(0, 5000);
        const msg = await this.prisma.message.create({
            data: {
                organizationId: orgId,
                conversationId,
                senderId,
                content,
                messageType: dto.messageType || 'text',
                attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
                replyToId: dto.replyToId || null,
            },
            include: {
                sender: { select: { id: true, email: true, role: true } },
                replyTo: true,
            },
        });
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date(), lastMessagePreview: content.slice(0, 120) },
        });
        // auto mark read for sender
        await this.prisma.conversationParticipant.updateMany({
            where: { conversationId, userId: senderId },
            data: { lastReadAt: new Date(), lastReadMessageId: msg.id },
        });
        await this.prisma.messageRead.upsert({
            where: { messageId_userId: { messageId: msg.id, userId: senderId } },
            create: { messageId: msg.id, userId: senderId },
            update: {},
        });
        return msg;
    }
    async editMessage(orgId, conversationId, messageId, userId, content) {
        const msg = await this.prisma.message.findFirst({ where: { id: messageId, conversationId, organizationId: orgId } });
        if (!msg)
            throw new common_1.NotFoundException('Message not found');
        if (msg.senderId !== userId)
            throw new common_1.ForbiddenException('Can only edit own messages');
        if (msg.isDeleted)
            throw new common_1.BadRequestException('Cannot edit deleted message');
        const updated = await this.prisma.message.update({
            where: { id: messageId },
            data: { content: content.trim().slice(0, 5000), isEdited: true },
        });
        return updated;
    }
    async deleteMessage(orgId, conversationId, messageId, userId) {
        const msg = await this.prisma.message.findFirst({ where: { id: messageId, conversationId, organizationId: orgId } });
        if (!msg)
            throw new common_1.NotFoundException('Message not found');
        if (msg.senderId !== userId) {
            // allow admin to delete?
            const part = await this.prisma.conversationParticipant.findFirst({ where: { conversationId, userId } });
            if (part?.role !== 'admin')
                throw new common_1.ForbiddenException('Can only delete own messages');
        }
        const updated = await this.prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true, content: 'This message was deleted' },
        });
        return updated;
    }
    async markRead(orgId, conversationId, userId, messageId) {
        await this.ensureParticipant(orgId, conversationId, userId);
        let lastMsgId = messageId;
        if (!lastMsgId) {
            const last = await this.prisma.message.findFirst({ where: { conversationId }, orderBy: { createdAt: 'desc' }, select: { id: true } });
            lastMsgId = last?.id;
        }
        if (!lastMsgId)
            return { success: true };
        await this.prisma.conversationParticipant.updateMany({
            where: { conversationId, userId },
            data: { lastReadAt: new Date(), lastReadMessageId: lastMsgId },
        });
        // mark all unread messages as read
        const unread = await this.prisma.message.findMany({
            where: { conversationId, senderId: { not: userId } },
            select: { id: true, createdAt: true },
        });
        // only those after not yet read? For simplicity create reads for all that not exists
        for (const m of unread) {
            await this.prisma.messageRead.upsert({
                where: { messageId_userId: { messageId: m.id, userId } },
                create: { messageId: m.id, userId },
                update: {},
            });
        }
        return { success: true, lastReadMessageId: lastMsgId };
    }
    async getUnreadCount(orgId, userId) {
        const parts = await this.prisma.conversationParticipant.findMany({ where: { userId }, select: { conversationId: true, lastReadAt: true } });
        let total = 0;
        for (const p of parts) {
            const cnt = await this.prisma.message.count({
                where: {
                    conversationId: p.conversationId,
                    organizationId: orgId,
                    senderId: { not: userId },
                    ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
                },
            });
            total += cnt;
        }
        return { total };
    }
    async searchUsers(orgId, userId, q) {
        const search = q?.trim();
        if (!search || search.length < 1) {
            return this.prisma.user.findMany({ where: { organizationId: orgId, id: { not: userId } }, take: 20, select: { id: true, email: true, role: true } });
        }
        const users = await this.prisma.user.findMany({
            where: {
                organizationId: orgId,
                id: { not: userId },
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            },
            take: 20,
            select: { id: true, email: true, role: true },
        });
        // enrich with employee
        const ids = users.map(u => u.id);
        const emps = await this.prisma.employee.findMany({ where: { userId: { in: ids } }, select: { userId: true, photoUrl: true, jobTitle: true, employeeCode: true } });
        const empMap = new Map(emps.map(e => [e.userId, e]));
        return users.map(u => ({ ...u, employee: empMap.get(u.id) || null }));
    }
    async getReadReceipts(orgId, conversationId, messageId, userId) {
        await this.ensureParticipant(orgId, conversationId, userId);
        const msg = await this.prisma.message.findFirst({ where: { id: messageId, conversationId } });
        if (!msg)
            throw new common_1.NotFoundException('Message not found');
        const reads = await this.prisma.messageRead.findMany({ where: { messageId }, include: { user: { select: { id: true, email: true } } } });
        return reads;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
