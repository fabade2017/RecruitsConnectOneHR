import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, query: any, user?: any) {
    const where: any = {};
    // RBAC: super_admin can see all or filter by organizationId, others only their org
    const isSuper = user?.role === 'super_admin';
    if (!isSuper) where.organizationId = orgId;
    else if (query.organizationId) where.organizationId = query.organizationId;
    else if (query.orgId) where.organizationId = query.orgId;
    // else super_admin sees all -> no org filter

    if (query.action) where.action = { contains: query.action };
    if (query.entityType) where.entityType = query.entityType;
    if (query.entity_type) where.entityType = query.entity_type;
    if (query.userId) where.userId = query.userId;
    if (query.user_id) where.userId = query.user_id;
    if (query.search) {
      const term = query.search;
      where.OR = [
        { action: { contains: term } },
        { entityType: { contains: term } },
        { entityId: { contains: term } },
        { userId: { contains: term } },
      ];
    }
    if (query.from || query.to || query.startDate || query.endDate) {
      const from = query.from || query.startDate;
      const to = query.to || query.endDate;
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
      if (Object.keys(where.createdAt).length === 0) delete where.createdAt;
    }

    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(100, parseInt(query.limit || '50'));
    const skip = (page - 1) * limit;
    const sort = query.sort === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: sort },
        skip,
        take: limit,
        include: { organization: { select: { acronym: true, name: true } } as any },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Enrich with user emails (batch lookup)
    const userIds = [...new Set(data.map(d => d.userId).filter(Boolean))] as string[];
    const users = userIds.length ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, role: true } }) : [];
    const userMap = new Map(users.map(u => [u.id, u]));
    const enriched = data.map(log => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) || { id: log.userId, email: log.userId.slice(0, 8) } : null,
      timingMs: log.duration,
    }));

    return {
      data: enriched,
      meta: { page, limit, total, pages: Math.ceil(total / limit), has_more: skip + data.length < total },
    };
  }

  async stats(orgId: string, user?: any) {
    const isSuper = user?.role === 'super_admin';
    const baseWhere: any = isSuper && !orgId ? {} : { organizationId: orgId };
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, last24h, last7d, recent] = await Promise.all([
      this.prisma.auditLog.count({ where: baseWhere }),
      this.prisma.auditLog.count({ where: { ...baseWhere, createdAt: { gte: dayAgo } } }),
      this.prisma.auditLog.count({ where: { ...baseWhere, createdAt: { gte: weekAgo } } }),
      this.prisma.auditLog.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: 100 }),
    ]);
    // Manual grouping for MSSQL compatibility (groupBy not fully supported)
    const actionMap: Record<string, number> = {};
    const entityMap: Record<string, number> = {};
    for (const r of recent) {
      actionMap[r.action] = (actionMap[r.action] || 0) + 1;
      entityMap[r.entityType] = (entityMap[r.entityType] || 0) + 1;
    }
    const byAction = Object.entries(actionMap).map(([action, _count]) => ({ action, _count })).sort((a,b)=> (b._count as number)-(a._count as number)).slice(0,10);
    const byEntity = Object.entries(entityMap).map(([entityType, _count]) => ({ entityType, _count })).sort((a,b)=> (b._count as number)-(a._count as number)).slice(0,10);

    return {
      total,
      last24h,
      last7d,
      byAction,
      byEntity,
      recent: recent.slice(0,5),
      transparency: {
        retention: 'immutable, append-only',
        coverage: 'all POST/PATCH/PUT/DELETE + auth via AuditLogInterceptor',
        timing: 'duration ms + IP + userAgent + statusCode',
      },
    };
  }

  async getOne(orgId: string, id: string, user?: any) {
    const isSuper = user?.role === 'super_admin';
    const where: any = { id };
    if (!isSuper) where.organizationId = orgId;
    const log = await this.prisma.auditLog.findFirst({ where, include: { organization: { select: { acronym: true, name: true } } as any } });
    if (!log) return null;
    const u = log.userId ? await this.prisma.user.findUnique({ where: { id: log.userId }, select: { id: true, email: true, role: true } }).catch(() => null) : null;
    return { ...log, user: u };
  }

  async exportCsv(orgId: string, query: any, user?: any) {
    const result = await this.list(orgId, { ...query, limit: 1000, page: 1 }, user);
    const rows = result.data as any[];
    const header = ['timestamp', 'action', 'entityType', 'entityId', 'userId', 'userEmail', 'organization', 'ip', 'durationMs', 'statusCode'];
    const csv = [header.join(',')].concat(
      rows.map(r => [
        r.createdAt.toISOString(),
        `"${String(r.action).replace(/"/g, '""')}"`,
        r.entityType,
        r.entityId || '',
        r.userId || '',
        `"${String(r.user?.email || '').replace(/"/g, '""')}"`,
        r.organization?.acronym || r.organizationId,
        r.ip || '',
        r.duration ?? '',
        r.statusCode ?? '',
      ].join(','))
    ).join('\n');
    return { csv, count: rows.length };
  }
}
