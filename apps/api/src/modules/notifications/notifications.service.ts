import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, q: any, user?: any) {
    const where: any = { organizationId: orgId };
    if (q.user_id) where.userId = q.user_id;
    if (q.userId) where.userId = q.userId;
    if (q.unread === 'true' || q.unread === true) where.status = 'pending';
    if (q.status) where.status = q.status;
    if (q.channel) where.channel = q.channel;
    // Scope: if user is employee, only show own or org-wide where userId null? Show both
    // For simplicity, show all org notifications + own
    return this.prisma.notification.findMany({ where, take: 100, orderBy: { createdAt: 'desc' } });
  }

  async get(orgId: string, id: string) {
    const n = await this.prisma.notification.findFirst({ where: { id, organizationId: orgId } });
    if (!n) throw new NotFoundException('Notification not found');
    return n;
  }

  async create(orgId: string, dto: any, user?: any) {
    if (!dto.channel && !dto.template) throw new NotFoundException('channel or template required');
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

  async markRead(orgId: string, id: string) {
    const n = await this.prisma.notification.findFirst({ where: { id, organizationId: orgId } });
    if (!n) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { status: 'sent', sentAt: new Date() } });
  }

  async markAllRead(orgId: string, user?: any) {
    const where: any = { organizationId: orgId, status: 'pending' };
    if (user && user.sub) {
      // mark own + broadcast
      await this.prisma.notification.updateMany({ where: { ...where, userId: user.sub }, data: { status: 'sent', sentAt: new Date() } });
      await this.prisma.notification.updateMany({ where: { ...where, userId: null }, data: { status: 'sent', sentAt: new Date() } });
    } else {
      await this.prisma.notification.updateMany({ where, data: { status: 'sent', sentAt: new Date() } });
    }
    return { success: true };
  }

  async remove(orgId: string, id: string) {
    const n = await this.prisma.notification.findFirst({ where: { id, organizationId: orgId } });
    if (!n) throw new NotFoundException('Notification not found');
    return this.prisma.notification.delete({ where: { id } });
  }

  async test(orgId: string, dto: any) {
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

  async countUnread(orgId: string, user?: any) {
    const cnt = await this.prisma.notification.count({ where: { organizationId: orgId, status: 'pending' } });
    return { unread: cnt };
  }
}
