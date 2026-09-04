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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BranchesService = class BranchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(orgId, query) {
        const where = { organizationId: orgId };
        if (query.search)
            where.name = { contains: query.search, mode: 'insensitive' };
        if (query.name)
            where.name = { contains: query.name, mode: 'insensitive' };
        // organizationId query param ignored for RLS; JWT orgId is source of truth
        return this.prisma.branch.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            include: { _count: { select: { employees: true, departments: true } } },
        });
    }
    async findOne(orgId, id) {
        const branch = await this.prisma.branch.findFirst({
            where: { id, organizationId: orgId },
            include: { departments: true },
        });
        if (!branch)
            throw new common_1.NotFoundException('Branch not found');
        return branch;
    }
    async create(orgId, dto) {
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
    async update(orgId, id, dto) {
        const existing = await this.prisma.branch.findFirst({ where: { id, organizationId: orgId } });
        if (!existing)
            throw new common_1.NotFoundException('Branch not found');
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.address !== undefined)
            data.address = dto.address;
        if (dto.location !== undefined)
            data.location = dto.location;
        if (dto.isHeadOffice !== undefined)
            data.isHeadOffice = dto.isHeadOffice;
        if (dto.is_head_office !== undefined)
            data.isHeadOffice = dto.is_head_office;
        return this.prisma.branch.update({ where: { id }, data });
    }
    async remove(orgId, id) {
        const existing = await this.prisma.branch.findFirst({ where: { id, organizationId: orgId } });
        if (!existing)
            throw new common_1.NotFoundException('Branch not found');
        // onDelete NoAction: prevent delete if has departments or employees
        const deptCount = await this.prisma.department.count({ where: { branchId: id } });
        if (deptCount > 0)
            throw new common_1.ConflictException(`Cannot delete: ${deptCount} departments linked`);
        const empCount = await this.prisma.employee.count({ where: { branchId: id } });
        if (empCount > 0)
            throw new common_1.ConflictException(`Cannot delete: ${empCount} employees assigned`);
        return this.prisma.branch.delete({ where: { id } });
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
