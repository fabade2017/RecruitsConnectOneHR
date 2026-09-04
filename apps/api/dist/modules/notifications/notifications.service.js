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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(orgId, q, user) {
        const where = { organizationId: orgId };
        if (q.user_id)
            where.userId = q.user_id;
        if (q.userId)
            where.userId = q.userId;
        if (q.unread === 'true' || q.unread === true)
            where.status = 'pending';
        if (q.status)
            where.status = q.status;
        if (q.channel)
            where.channel = q.channel;
        // Scope: if user is employee, only show own or org-wide where userId null? Show both
        // For simplicity, show all org notifications + own
        return this.prisma.notification.findMany({ where, take: 100, orderBy: { createdAt: 'desc' } });
    }
    async get(orgId, id) {
        const n = await this.prisma.notification.findFirst({ where: { id, organizationId: orgId } });
        if (!n)
            throw new common_1.NotFoundException('Notification not found');
        return n;
    }
    async create(orgId, dto, user) {
        if (!dto.channel && !dto.template)
            throw new common_1.NotFoundException('channel or template required');
        return this.prisma.notification.create({
            data: {
                organizationId: orgId,
                userId: dto.userId || dto.user_id || user?.sub || null,
                channel: dto.channel || 'in_app',
                template: dto.template || null,
                payload: JSON.stringify(dto.payload || dto.data || { message: dto.message || 'Notification' }),
                status: dto.status || 'pending',
            },
        });
    }
    async markRead(orgId, id) {
        const n = await this.prisma.notification.findFirst({ where: { id, organizationId: orgId } });
        if (!n)
            throw new common_1.NotFoundException('Notification not found');
        return this.prisma.notification.update({ where: { id }, data: { status: 'sent', sentAt: new Date() } });
    }
    async markAllRead(orgId, user) {
        const where = { organizationId: orgId, status: 'pending' };
        if (user && user.sub) {
            // mark own + broadcast
            await this.prisma.notification.updateMany({ where: { ...where, userId: user.sub }, data: { status: 'sent', sentAt: new Date() } });
            await this.prisma.notification.updateMany({ where: { ...where, userId: null }, data: { status: 'sent', sentAt: new Date() } });
        }
        else {
            await this.prisma.notification.updateMany({ where, data: { status: 'sent', sentAt: new Date() } });
        }
        return { success: true };
    }
    async remove(orgId, id) {
        const n = await this.prisma.notification.findFirst({ where: { id, organizationId: orgId } });
        if (!n)
            throw new common_1.NotFoundException('Notification not found');
        return this.prisma.notification.delete({ where: { id } });
    }
    async test(orgId, dto) {
        const channel = dto.channel || 'email';
        const notification = await this.prisma.notification.create({
            data: {
                organizationId: orgId,
                userId: dto.userId || null,
                channel,
                template: dto.template || 'test',
                payload: JSON.stringify({ message: dto.message || `Test ${channel} notification`, to: dto.to || 'test@example.com' }),
                status: 'sent',
                sentAt: new Date(),
            },
        });
        return { success: true, channel, notification };
    }
    async countUnread(orgId, user) {
        const cnt = await this.prisma.notification.count({ where: { organizationId: orgId, status: 'pending' } });
        return { unread: cnt };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
