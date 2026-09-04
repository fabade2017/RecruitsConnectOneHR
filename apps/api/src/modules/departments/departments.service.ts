import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, query: any) {
    const where: any = { organizationId: orgId };
    // Linked dropdown support: filter by branchId, parentId
    // Note: query.organizationId from client is ignored for RLS; JWT orgId is source of truth
    if (query.branchId) where.branchId = query.branchId;
    if (query.branch_id) where.branchId = query.branch_id;
    if (query.parentId) where.parentId = query.parentId;
    if (query.parent_id) where.parentId = query.parent_id;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (query.name) where.name = { contains: query.name, mode: 'insensitive' };

    return this.prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { branch: true, parent: true, _count: { select: { employees: true, children: true } } },
    });
  }

  async findOne(orgId: string, id: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, organizationId: orgId },
      include: { branch: true, parent: true, children: true },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async create(orgId: string, dto: any) {
    // Validate branch belongs to organization if provided
    if (dto.branchId || dto.branch_id) {
      const branchId = dto.branchId || dto.branch_id;
      const branch = await this.prisma.branch.findFirst({ where: { id: branchId, organizationId: orgId } });
      if (!branch) throw new NotFoundException('Branch not found in organization');
    }
    if (dto.parentId || dto.parent_id) {
      const parentId = dto.parentId || dto.parent_id;
      const parent = await this.prisma.department.findFirst({ where: { id: parentId, organizationId: orgId } });
      if (!parent) throw new NotFoundException('Parent department not found in organization');
    }

    return this.prisma.department.create({
      data: {
        organizationId: orgId,
        branchId: dto.branchId || dto.branch_id || null,
        parentId: dto.parentId || dto.parent_id || null,
        name: dto.name,
        costCenter: dto.costCenter || dto.cost_center || null,
      },
    });
  }

  async update(orgId: string, id: string, dto: any) {
    const existing = await this.prisma.department.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Department not found');

    // Validate reassigned branch/parent
    if (dto.branchId !== undefined || dto.branch_id !== undefined) {
      const branchId = dto.branchId ?? dto.branch_id;
      if (branchId) {
        const branch = await this.prisma.branch.findFirst({ where: { id: branchId, organizationId: orgId } });
        if (!branch) throw new NotFoundException('Branch not found in organization');
      }
    }
    if (dto.parentId !== undefined || dto.parent_id !== undefined) {
      const parentId = dto.parentId ?? dto.parent_id;
      if (parentId) {
        if (parentId === id) throw new ConflictException('Department cannot be its own parent');
        const parent = await this.prisma.department.findFirst({ where: { id: parentId, organizationId: orgId } });
        if (!parent) throw new NotFoundException('Parent department not found in organization');
      }
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.costCenter !== undefined) data.costCenter = dto.costCenter;
    if (dto.cost_center !== undefined) data.costCenter = dto.cost_center;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;
    if (dto.branch_id !== undefined) data.branchId = dto.branch_id;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.parent_id !== undefined) data.parentId = dto.parent_id;

    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(orgId: string, id: string) {
    const existing = await this.prisma.department.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Department not found');

    // onDelete NoAction: prevent delete if has children or employees
    const childrenCount = await this.prisma.department.count({ where: { parentId: id } });
    if (childrenCount > 0) throw new ConflictException(`Cannot delete: ${childrenCount} child departments exist`);

    const employeeCount = await this.prisma.employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) throw new ConflictException(`Cannot delete: ${employeeCount} employees assigned`);

    return this.prisma.department.delete({ where: { id } });
  }
}
