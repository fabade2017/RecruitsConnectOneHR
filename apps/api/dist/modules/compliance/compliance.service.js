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
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ComplianceService = class ComplianceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async policies(orgId, q) {
        const where = { organizationId: orgId };
        if (q.category)
            where.category = q.category;
        if (q.status)
            where.status = q.status;
        if (q.search)
            where.title = { contains: q.search, mode: 'insensitive' };
        return this.prisma.compliancePolicy.findMany({ where, take: 50, include: { audits: true }, orderBy: { createdAt: 'desc' } });
    }
    async create(orgId, dto) {
        if (!dto.title)
            throw new common_1.ConflictException('title required');
        if (!dto.category)
            throw new common_1.ConflictException('category required');
        return this.prisma.compliancePolicy.create({ data: { organizationId: orgId, title: dto.title, category: dto.category, content: dto.content || '', version: dto.version || '1.0', status: dto.status || 'ACTIVE', effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(), reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : null } });
    }
    async get(orgId, id) {
        const p = await this.prisma.compliancePolicy.findFirst({ where: { id, organizationId: orgId }, include: { audits: true } });
        if (!p)
            throw new common_1.NotFoundException('Policy not found');
        return p;
    }
    async update(orgId, id, dto) {
        const p = await this.prisma.compliancePolicy.findFirst({ where: { id, organizationId: orgId } });
        if (!p)
            throw new common_1.NotFoundException('Policy not found');
        return this.prisma.compliancePolicy.update({ where: { id }, data: { title: dto.title, category: dto.category, content: dto.content, version: dto.version, status: dto.status, effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined, reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined } });
    }
    async remove(orgId, id) {
        const p = await this.prisma.compliancePolicy.findFirst({ where: { id, organizationId: orgId } });
        if (!p)
            throw new common_1.NotFoundException('Policy not found');
        await this.prisma.complianceAudit.deleteMany({ where: { policyId: id } });
        return this.prisma.compliancePolicy.delete({ where: { id } });
    }
    async audits(orgId, policyId) {
        const p = await this.prisma.compliancePolicy.findFirst({ where: { id: policyId, organizationId: orgId } });
        if (!p)
            throw new common_1.NotFoundException('Policy not found');
        return this.prisma.complianceAudit.findMany({ where: { policyId }, orderBy: { createdAt: 'desc' } });
    }
    async createAudit(orgId, policyId, dto) {
        const p = await this.prisma.compliancePolicy.findFirst({ where: { id: policyId, organizationId: orgId } });
        if (!p)
            throw new common_1.NotFoundException('Policy not found');
        if (!dto.auditor)
            throw new common_1.ConflictException('auditor required');
        return this.prisma.complianceAudit.create({ data: { policyId, auditor: dto.auditor, findings: dto.findings, status: dto.status || 'PENDING', completedAt: dto.completedAt ? new Date(dto.completedAt) : null } });
    }
    async updateAudit(orgId, id, dto) {
        const a = await this.prisma.complianceAudit.findUnique({ where: { id }, include: { policy: true } });
        if (!a || a.policy.organizationId !== orgId)
            throw new common_1.NotFoundException('Audit not found');
        return this.prisma.complianceAudit.update({ where: { id }, data: { auditor: dto.auditor, findings: dto.findings, status: dto.status, completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined } });
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplianceService);
