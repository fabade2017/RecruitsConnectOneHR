import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, q: any, user?: any) {
    const where: any = { organizationId: orgId };
    if (q.employee_id) where.employeeId = q.employee_id;
    if (q.employeeId) where.employeeId = q.employeeId;
    if (q.type) where.type = q.type;
    if (q.status) where.status = q.status;
    // Department filter: only employee docs where employee's department matches
    if (q.department_id || q.departmentId || q.department) {
      const deptId = q.department_id || q.departmentId || q.department;
      // If deptId is name, resolve to id; if uuid, use directly
      let deptEmployees: string[] = [];
      // Try as id first
      const byId = await this.prisma.employee.findMany({ where: { organizationId: orgId, departmentId: deptId }, select: { id: true } }).catch(() => []);
      if (byId.length) deptEmployees = byId.map(e => e.id);
      else {
        // Try by department name
        const dept = await this.prisma.department.findFirst({ where: { organizationId: orgId, name: { contains: deptId } } }).catch(() => null);
        if (dept) {
          const emps = await this.prisma.employee.findMany({ where: { organizationId: orgId, departmentId: dept.id }, select: { id: true } });
          deptEmployees = emps.map(e => e.id);
        }
      }
      if (deptEmployees.length) where.employeeId = { in: deptEmployees };
      else where.employeeId = 'no-match'; // no docs will match
    }
    // Branch filter similarly
    if (q.branch_id || q.branchId || q.branch) {
      const branchId = q.branch_id || q.branchId || q.branch;
      let branchEmployees: string[] = [];
      const byId = await this.prisma.employee.findMany({ where: { organizationId: orgId, branchId }, select: { id: true } }).catch(() => []);
      if (byId.length) branchEmployees = byId.map(e => e.id);
      else {
        const branch = await this.prisma.branch.findFirst({ where: { organizationId: orgId, name: { contains: branchId } } }).catch(() => null);
        if (branch) {
          const emps = await this.prisma.employee.findMany({ where: { organizationId: orgId, branchId: branch.id }, select: { id: true } });
          branchEmployees = emps.map(e => e.id);
        }
      }
      if (branchEmployees.length) where.employeeId = { in: branchEmployees };
      else where.employeeId = 'no-match';
    }
    // Scope filter: organization vs employee
    if (q.scope === 'organization') where.employeeId = null;
    if (q.scope === 'employee') where.employeeId = { not: null };
    // employee sees own docs only (overrides other filters)
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      where.employeeId = emp?.id || 'no-access';
    }
    // Search across title, type, s3Key and employee code/name
    if (q.search) {
      const term = q.search;
      // Find matching employees by code/name/department
      const matchedEmps = await this.prisma.employee.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { employeeCode: { contains: term } },
            { jobTitle: { contains: term } },
          ],
        },
        select: { id: true },
        take: 50,
      }).catch(() => []);
      const matchedIds = matchedEmps.map(e => e.id);
      // Also match department name
      const matchedDepts = await this.prisma.department.findMany({ where: { organizationId: orgId, name: { contains: term } }, select: { id: true } }).catch(() => []);
      if (matchedDepts.length) {
        const deptEmps = await this.prisma.employee.findMany({ where: { organizationId: orgId, departmentId: { in: matchedDepts.map(d => d.id) } }, select: { id: true } }).catch(() => []);
        for (const e of deptEmps) if (!matchedIds.includes(e.id)) matchedIds.push(e.id);
      }
      where.OR = [
        { title: { contains: term } },
        { type: { contains: term } },
        { s3Key: { contains: term } },
        ...(matchedIds.length ? [{ employeeId: { in: matchedIds } }] : []),
      ];
    }
    return this.prisma.document.findMany({
      where,
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { employee: { include: { department: true, branch: true } } as any },
    });
  }

  async get(orgId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, organizationId: orgId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(orgId: string, dto: any, file?: any, user?: any) {
    if (!dto.title && !dto.name) throw new NotFoundException('title required');
    // s3Key: use file originalname or dto.s3Key or generate — for preview we store data URL for small images
    let s3Key = dto.s3Key || dto.s3_key || dto.fileUrl || '';
    if (file) {
      // Store data URL for immediate view if image/pdf and <2MB, else S3 key path
      const isViewable = file.mimetype?.startsWith('image/') || file.mimetype === 'application/pdf';
      const canInline = file.buffer && file.size < 2 * 1024 * 1024 && isViewable;
      if (canInline) {
        const b64 = file.buffer.toString('base64');
        s3Key = `data:${file.mimetype};base64,${b64}`;
      } else {
        s3Key = `org/${orgId}/docs/${Date.now()}-${file.originalname || 'file'}`;
      }
    }
    if (!s3Key) s3Key = `org/${orgId}/docs/${dto.title || 'document'}-${Date.now()}`;
    // employee self-assign
    let employeeId = dto.employee_id || dto.employeeId || null;
    if (user?.role === 'employee' && !employeeId) {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      employeeId = emp?.id || null;
    }
    return this.prisma.document.create({
      data: {
        organizationId: orgId,
        employeeId,
        type: dto.type || 'OTHER',
        title: dto.title || dto.name,
        s3Key,
        status: dto.status || 'pending',
        expiryDate: dto.expiry_date ? new Date(dto.expiry_date) : dto.expiryDate ? new Date(dto.expiryDate) : null,
        verificationStatus: dto.verificationStatus || 'pending',
      },
    });
  }

  async verify(orgId: string, id: string, dto: any) {
    const doc = await this.prisma.document.findFirst({ where: { id, organizationId: orgId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.document.update({
      where: { id },
      data: {
        verificationStatus: dto.verificationStatus || dto.status || 'verified',
        status: dto.status || 'verified',
      },
    });
  }

  async update(orgId: string, id: string, dto: any) {
    const doc = await this.prisma.document.findFirst({ where: { id, organizationId: orgId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.document.update({ where: { id }, data: { title: dto.title, type: dto.type, status: dto.status, verificationStatus: dto.verificationStatus, expiryDate: dto.expiry_date ? new Date(dto.expiry_date) : undefined } });
  }

  async remove(orgId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, organizationId: orgId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.document.delete({ where: { id } });
  }

  async download(orgId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, organizationId: orgId } });
    if (!doc) throw new NotFoundException('Document not found');
    // If s3Key is already a data URL (inline preview), return it directly
    if (doc.s3Key.startsWith('data:')) {
      return { url: doc.s3Key, s3Key: doc.s3Key, title: doc.title, inline: true };
    }
    return { url: `https://s3.mock/${doc.s3Key}?expires=300`, s3Key: doc.s3Key, title: doc.title, inline: false };
  }

  // Assets - using Asset model but exposed under /assets and /documents assets legacy
  async listAssets(orgId: string, q: any) {
    const where: any = { organizationId: orgId };
    if (q.employee_id) where.employeeId = q.employee_id;
    return this.prisma.asset.findMany({ where, take: 100, orderBy: { createdAt: 'desc' }, include: { employee: true } });
  }

  async assignAsset(orgId: string, dto: any) {
    if (!dto.name) throw new NotFoundException('Asset name required');
    return this.prisma.asset.create({
      data: {
        organizationId: orgId,
        employeeId: dto.employee_id || dto.employeeId || null,
        name: dto.name,
        serial: dto.serial || null,
      },
    });
  }

  async returnAsset(orgId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id, organizationId: orgId } });
    if (!asset) throw new NotFoundException('Asset not found');
    return this.prisma.asset.update({ where: { id }, data: { returnedAt: new Date() } });
  }
}
