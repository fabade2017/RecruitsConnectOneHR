import { Injectable, NotFoundException, ForbiddenException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // Cleanup expired files every hour
    setInterval(() => this.cleanupExpiredFiles().catch(()=>{}), 60 * 60 * 1000).unref();
    // Run once after 30s on startup
    setTimeout(() => this.cleanupExpiredFiles().catch(()=>{}), 30_000);
  }

  private async ensureParticipant(orgId: string, conversationId: string, userId: string) {
    const p = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!p) throw new ForbiddenException('Not a participant');
    // also verify org
    const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, organizationId: orgId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    return p;
  }

  async listConversations(orgId: string, userId: string, q: any) {
    const take = Math.min(parseInt(q.limit || '50', 10), 100);
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    const ids = participants.map(p => p.conversationId);
    if (!ids.length) return [];

    const search = q.search?.trim();
    const where: any = { id: { in: ids }, organizationId: orgId };
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
    const enriched = await Promise.all(convs.map(async (c: any) => {
      const unread = await this.prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          createdAt: { gt: (participants.find(p=>p.conversationId===c.id) as any)?.lastReadAt || new Date(0) } as any,
        },
      });
      // compute accurate unread via lastReadAt
      const me = c.participants.find((p: any) => p.userId === userId);
      let unread2 = 0;
      if (me?.lastReadAt) {
        unread2 = await this.prisma.message.count({
          where: { conversationId: c.id, createdAt: { gt: me.lastReadAt }, senderId: { not: userId } },
        });
      } else {
        unread2 = await this.prisma.message.count({ where: { conversationId: c.id, senderId: { not: userId } } });
      }
      // Fetch employee info for participants to show names
      const userIds = c.participants.map((p: any) => p.userId);
      const employees = await this.prisma.employee.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, id: true, jobTitle: true, photoUrl: true },
      });
      const empMap = new Map(employees.map(e => [e.userId, e]));
      const partsEnriched = c.participants.map((p: any) => ({
        ...p,
        employee: empMap.get(p.userId) || null,
      }));
      return { ...c, participants: partsEnriched, unreadCount: unread2 };
    }));
    return enriched;
  }

  async getConversation(orgId: string, conversationId: string, userId: string) {
    await this.ensureParticipant(orgId, conversationId, userId);
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: orgId },
      include: {
        participants: { include: { user: { select: { id: true, email: true, role: true } } } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    const userIds = conv.participants.map((p: any) => p.userId);
    const employees = await this.prisma.employee.findMany({ where: { userId: { in: userIds } }, select: { userId: true, id: true, jobTitle: true, photoUrl: true } });
    const empMap = new Map(employees.map(e => [e.userId, e]));
    return {
      ...conv,
      participants: conv.participants.map((p: any) => ({ ...p, employee: empMap.get(p.userId) || null })),
    };
  }

  async createConversation(orgId: string, creatorId: string, dto: any) {
    const type = dto.type || 'direct';
    let participantIds: string[] = [...(dto.participantIds || [])];
    // dedupe and ensure creator included
    participantIds = [...new Set(participantIds.filter((id: string) => id !== creatorId))];
    if (!participantIds.length) throw new BadRequestException('At least one participant required');

    // verify all users belong to same org
    const users = await this.prisma.user.findMany({ where: { id: { in: participantIds }, organizationId: orgId } });
    if (users.length !== participantIds.length) throw new BadRequestException('One or more participants not found in organization');

    if (type === 'direct') {
      if (participantIds.length !== 1) throw new BadRequestException('Direct chat requires exactly 1 other participant');
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
    if (!dto.name?.trim()) throw new BadRequestException('Group name required');
    if (participantIds.length < 1) throw new BadRequestException('Group requires at least 2 participants total (you + others)');
    if (participantIds.length > 99) throw new BadRequestException('Too many participants (max 100)');
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
            ...participantIds.map((uid: string) => ({ userId: uid, role: 'member' })),
          ],
        },
      },
      include: { participants: true },
    });
    return conv;
  }

  async updateConversation(orgId: string, conversationId: string, userId: string, dto: any) {
    await this.ensureParticipant(orgId, conversationId, userId);
    const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, organizationId: orgId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.type === 'direct' && dto.name) throw new BadRequestException('Cannot rename direct conversation');
    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name: dto.name !== undefined ? dto.name : conv.name,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : (conv as any).avatarUrl,
      },
    });
    return updated;
  }

  async addParticipants(orgId: string, conversationId: string, userId: string, userIds: string[]) {
    await this.ensureParticipant(orgId, conversationId, userId);
    const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, organizationId: orgId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.type === 'direct') throw new BadRequestException('Cannot add participants to direct chat — create a group');
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds }, organizationId: orgId } });
    if (users.length !== userIds.length) throw new BadRequestException('Some users not found in org');
    for (const uid of userIds) {
      await this.prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId, userId: uid } as any },
        create: { conversationId, userId: uid, role: 'member' },
        update: {},
      });
    }
    return this.getConversation(orgId, conversationId, userId);
  }

  async removeParticipant(orgId: string, conversationId: string, requesterId: string, targetUserId: string) {
    await this.ensureParticipant(orgId, conversationId, requesterId);
    const conv = await this.prisma.conversation.findFirst({ where: { id: conversationId, organizationId: orgId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    // Allow self-leave or admin removes
    const requesterPart = await this.prisma.conversationParticipant.findFirst({ where: { conversationId, userId: requesterId } });
    if (targetUserId !== requesterId && requesterPart?.role !== 'admin') throw new ForbiddenException('Only admins can remove others');
    await this.prisma.conversationParticipant.deleteMany({ where: { conversationId, userId: targetUserId } });
    const remaining = await this.prisma.conversationParticipant.count({ where: { conversationId } });
    if (remaining === 0) {
      await this.prisma.conversation.delete({ where: { id: conversationId } });
      return { deleted: true };
    }
    return { success: true };
  }

  async leaveConversation(orgId: string, conversationId: string, userId: string) {
    return this.removeParticipant(orgId, conversationId, userId, userId);
  }

  async listMessages(orgId: string, conversationId: string, userId: string, q: any) {
    await this.ensureParticipant(orgId, conversationId, userId);
    const take = Math.min(parseInt(q.limit || '50', 10), 100);
    const cursor = q.cursor; // message id
    const order = q.order === 'asc' ? 'asc' : 'desc';
    const where: any = { conversationId, organizationId: orgId };
    if (q.search) where.content = { contains: q.search, mode: 'insensitive' };

    let query: any = {
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
      if (curMsg) query.cursor = { id: cursor };
      query.skip = 1;
    }
    const msgs = await this.prisma.message.findMany(query);
    const hasMore = msgs.length > take;
    const items = hasMore ? msgs.slice(0, take) : msgs;
    // enrich with sender employee
    const senderIds = [...new Set(items.map((m: any) => m.senderId))];
    const emps = await this.prisma.employee.findMany({ where: { userId: { in: senderIds } }, select: { userId: true, photoUrl: true, jobTitle: true } });
    const empMap = new Map(emps.map(e => [e.userId, e]));
    const enriched = items.map((m: any) => ({ ...m, senderEmployee: empMap.get(m.senderId) || null }));
    return {
      items: order === 'desc' ? enriched : enriched.reverse(),
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  async sendMessage(orgId: string, conversationId: string, senderId: string, dto: any) {
    await this.ensureParticipant(orgId, conversationId, senderId);
    if (!dto.content?.trim() && !dto.attachments) throw new BadRequestException('Message content required');
    if (dto.replyToId) {
      const reply = await this.prisma.message.findFirst({ where: { id: dto.replyToId, conversationId } });
      if (!reply) throw new BadRequestException('Reply message not found in this conversation');
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
      where: { messageId_userId: { messageId: msg.id, userId: senderId } as any },
      create: { messageId: msg.id, userId: senderId },
      update: {},
    });
    return msg;
  }

  async editMessage(orgId: string, conversationId: string, messageId: string, userId: string, content: string) {
    const msg = await this.prisma.message.findFirst({ where: { id: messageId, conversationId, organizationId: orgId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId) throw new ForbiddenException('Can only edit own messages');
    if (msg.isDeleted) throw new BadRequestException('Cannot edit deleted message');
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { content: content.trim().slice(0, 5000), isEdited: true },
    });
    return updated;
  }

  async deleteMessage(orgId: string, conversationId: string, messageId: string, userId: string) {
    const msg = await this.prisma.message.findFirst({ where: { id: messageId, conversationId, organizationId: orgId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId) {
      // allow admin to delete?
      const part = await this.prisma.conversationParticipant.findFirst({ where: { conversationId, userId } });
      if (part?.role !== 'admin') throw new ForbiddenException('Can only delete own messages');
    }
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: 'This message was deleted' },
    });
    return updated;
  }

  async markRead(orgId: string, conversationId: string, userId: string, messageId?: string) {
    await this.ensureParticipant(orgId, conversationId, userId);
    let lastMsgId = messageId;
    if (!lastMsgId) {
      const last = await this.prisma.message.findFirst({ where: { conversationId }, orderBy: { createdAt: 'desc' }, select: { id: true } });
      lastMsgId = last?.id;
    }
    if (!lastMsgId) return { success: true };
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
        where: { messageId_userId: { messageId: m.id, userId } as any },
        create: { messageId: m.id, userId },
        update: {},
      });
    }
    return { success: true, lastReadMessageId: lastMsgId };
  }

  async getUnreadCount(orgId: string, userId: string) {
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

  async searchUsers(orgId: string, userId: string, q: string) {
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

  async uploadFile(orgId: string, conversationId: string, senderId: string, file: any, content?: string) {
    await this.ensureParticipant(orgId, conversationId, senderId);
    if (!file || !file.buffer) throw new BadRequestException('No file uploaded');
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) throw new BadRequestException('File too large (max 10MB)');
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv'];
    // allow all for now but warn if not in allowed
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const b64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${b64}`;
    const attachments = [{ url: dataUrl, name: file.originalname, type: file.mimetype, size: file.size, expiresAt: expiresAt.toISOString() }];
    const msgContent = content?.trim() || file.originalname;
    const msg = await this.prisma.message.create({
      data: {
        organizationId: orgId,
        conversationId,
        senderId,
        content: msgContent.slice(0, 5000),
        messageType: file.mimetype.startsWith('image/') ? 'image' : 'file',
        attachments: JSON.stringify(attachments),
        expiresAt,
      },
      include: { sender: { select: { id: true, email: true, role: true } } },
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date(), lastMessagePreview: `[${file.mimetype.startsWith('image/') ? 'Image' : 'File'}] ${file.originalname}`.slice(0,120) } });
    await this.prisma.conversationParticipant.updateMany({ where: { conversationId, userId: senderId }, data: { lastReadAt: new Date(), lastReadMessageId: msg.id } });
    await this.prisma.messageRead.upsert({ where: { messageId_userId: { messageId: msg.id, userId: senderId } as any }, create: { messageId: msg.id, userId: senderId }, update: {} });
    return msg;
  }

  async cleanupExpiredFiles() {
    const now = new Date();
    const expired = await this.prisma.message.findMany({ where: { expiresAt: { lt: now }, attachments: { not: null } } as any, select: { id: true } });
    if (!expired.length) return { cleaned: 0 };
    for (const m of expired) {
      await this.prisma.message.update({ where: { id: m.id }, data: { attachments: JSON.stringify([{ expired: true, message: 'File expired after 7 days' }]), content: '[File expired]' } });
    }
    return { cleaned: expired.length };
  }

  async getReadReceipts(orgId: string, conversationId: string, messageId: string, userId: string) {
    await this.ensureParticipant(orgId, conversationId, userId);
    const msg = await this.prisma.message.findFirst({ where: { id: messageId, conversationId } });
    if (!msg) throw new NotFoundException('Message not found');
    const reads = await this.prisma.messageRead.findMany({ where: { messageId }, include: { user: { select: { id: true, email: true } } } });
    return reads;
  }
}
