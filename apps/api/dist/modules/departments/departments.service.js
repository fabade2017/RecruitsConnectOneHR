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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(orgId, query) {
        const where = { organizationId: orgId };
        // Linked dropdown support: filter by branchId, parentId
        // Note: query.organizationId from client is ignored for RLS; JWT orgId is source of truth
        if (query.branchId)
            where.branchId = query.branchId;
        if (query.branch_id)
            where.branchId = query.branch_id;
        if (query.parentId)
            where.parentId = query.parentId;
        if (query.parent_id)
            where.parentId = query.parent_id;
        if (query.search)
            where.name = { contains: query.search, mode: 'insensitive' };
        if (query.name)
            where.name = { contains: query.name, mode: 'insensitive' };
        return this.prisma.department.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { branch: true, parent: true, _count: { select: { employees: true, children: true } } },
        });
    }
    async findOne(orgId, id) {
        const dept = await this.prisma.department.findFirst({
            where: { id, organizationId: orgId },
            include: { branch: true, parent: true, children: true },
        });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        return dept;
    }
    async create(orgId, dto) {
        // Validate branch belongs to organization if provided
        if (dto.branchId || dto.branch_id) {
            const branchId = dto.branchId || dto.branch_id;
            const branch = await this.prisma.branch.findFirst({ where: { id: branchId, organizationId: orgId } });
            if (!branch)
                throw new common_1.NotFoundException('Branch not found in organization');
        }
        if (dto.parentId || dto.parent_id) {
            const parentId = dto.parentId || dto.parent_id;
            const parent = await this.prisma.department.findFirst({ where: { id: parentId, organizationId: orgId } });
            if (!parent)
                throw new common_1.NotFoundException('Parent department not found in organization');
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
    async update(orgId, id, dto) {
        const existing = await this.prisma.department.findFirst({ where: { id, organizationId: orgId } });
        if (!existing)
            throw new common_1.NotFoundException('Department not found');
        // Validate reassigned branch/parent
        if (dto.branchId !== undefined || dto.branch_id !== undefined) {
            const branchId = dto.branchId ?? dto.branch_id;
            if (branchId) {
                const branch = await this.prisma.branch.findFirst({ where: { id: branchId, organizationId: orgId } });
                if (!branch)
                    throw new common_1.NotFoundException('Branch not found in organization');
            }
        }
        if (dto.parentId !== undefined || dto.parent_id !== undefined) {
            const parentId = dto.parentId ?? dto.parent_id;
            if (parentId) {
                if (parentId === id)
                    throw new common_1.ConflictException('Department cannot be its own parent');
                const parent = await this.prisma.department.findFirst({ where: { id: parentId, organizationId: orgId } });
                if (!parent)
                    throw new common_1.NotFoundException('Parent department not found in organization');
            }
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.costCenter !== undefined)
            data.costCenter = dto.costCenter;
        if (dto.cost_center !== undefined)
            data.costCenter = dto.cost_center;
        if (dto.branchId !== undefined)
            data.branchId = dto.branchId;
        if (dto.branch_id !== undefined)
            data.branchId = dto.branch_id;
        if (dto.parentId !== undefined)
            data.parentId = dto.parentId;
        if (dto.parent_id !== undefined)
            data.parentId = dto.parent_id;
        return this.prisma.department.update({ where: { id }, data });
    }
    async remove(orgId, id) {
        const existing = await this.prisma.department.findFirst({ where: { id, organizationId: orgId } });
        if (!existing)
            throw new common_1.NotFoundException('Department not found');
        // onDelete NoAction: prevent delete if has children or employees
        const childrenCount = await this.prisma.department.count({ where: { parentId: id } });
        if (childrenCount > 0)
            throw new common_1.ConflictException(`Cannot delete: ${childrenCount} child departments exist`);
        const employeeCount = await this.prisma.employee.count({ where: { departmentId: id } });
        if (employeeCount > 0)
            throw new common_1.ConflictException(`Cannot delete: ${employeeCount} employees assigned`);
        return this.prisma.department.delete({ where: { id } });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
