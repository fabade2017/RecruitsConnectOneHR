import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, query: any) {
    const where: any = { organizationId: orgId };
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (query.name) where.name = { contains: query.name, mode: 'insensitive' };
    // organizationId query param ignored for RLS; JWT orgId is source of truth
    return this.prisma.branch.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { employees: true, departments: true } } },
    });
  }

  async findOne(orgId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, organizationId: orgId },
      include: { departments: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(orgId: string, dto: any) {
    return this.prisma.branch.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        address: dto.address || null,
        location: dto.location || null,
        isHeadOffice: dto.isHeadOffice ?? dto.is_head_office ?? false,
      },
    });
  }

  async update(orgId: string, id: string, dto: any) {
    const existing = await this.prisma.branch.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Branch not found');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.isHeadOffice !== undefined) data.isHeadOffice = dto.isHeadOffice;
    if (dto.is_head_office !== undefined) data.isHeadOffice = dto.is_head_office;

    return this.prisma.branch.update({ where: { id }, data });
  }

  async remove(orgId: string, id: string) {
    const existing = await this.prisma.branch.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Branch not found');

    // onDelete NoAction: prevent delete if has departments or employees
    const deptCount = await this.prisma.department.count({ where: { branchId: id } });
    if (deptCount > 0) throw new ConflictException(`Cannot delete: ${deptCount} departments linked`);

    const empCount = await this.prisma.employee.count({ where: { branchId: id } });
    if (empCount > 0) throw new ConflictException(`Cannot delete: ${empCount} employees assigned`);

    return this.prisma.branch.delete({ where: { id } });
  }
}
