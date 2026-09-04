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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let JobsService = class JobsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(orgId, q) {
        const where = { organizationId: orgId };
        if (q.status)
            where.status = q.status;
        if (q.department)
            where.department = q.department;
        if (q.search)
            where.title = { contains: q.search, mode: 'insensitive' };
        return this.prisma.jobPosting.findMany({ where, take: 50, orderBy: { postedAt: 'desc' }, include: { applications: true } });
    }
    async create(orgId, dto) {
        if (!dto.title)
            throw new common_1.ConflictException('title required');
        return this.prisma.jobPosting.create({ data: { organizationId: orgId, title: dto.title, department: dto.department || 'HR', location: dto.location || 'Lagos', type: dto.type || 'FULL_TIME', description: dto.description || '', requirements: dto.requirements, salaryRange: dto.salaryRange || dto.salary_range, status: dto.status || 'OPEN', closesAt: dto.closesAt ? new Date(dto.closesAt) : dto.closes_at ? new Date(dto.closes_at) : null } });
    }
    async get(orgId, id) {
        const j = await this.prisma.jobPosting.findFirst({ where: { id, organizationId: orgId }, include: { applications: true } });
        if (!j)
            throw new common_1.NotFoundException('Job not found');
        return j;
    }
    async update(orgId, id, dto) {
        const j = await this.prisma.jobPosting.findFirst({ where: { id, organizationId: orgId } });
        if (!j)
            throw new common_1.NotFoundException('Job not found');
        return this.prisma.jobPosting.update({ where: { id }, data: { title: dto.title, department: dto.department, location: dto.location, type: dto.type, description: dto.description, requirements: dto.requirements, salaryRange: dto.salaryRange, status: dto.status, closesAt: dto.closesAt ? new Date(dto.closesAt) : undefined } });
    }
    async remove(orgId, id) {
        const j = await this.prisma.jobPosting.findFirst({ where: { id, organizationId: orgId } });
        if (!j)
            throw new common_1.NotFoundException('Job not found');
        await this.prisma.jobApplicationMerged.deleteMany({ where: { jobId: id } });
        return this.prisma.jobPosting.delete({ where: { id } });
    }
    async applications(orgId, jobId) {
        const j = await this.prisma.jobPosting.findFirst({ where: { id: jobId, organizationId: orgId } });
        if (!j)
            throw new common_1.NotFoundException('Job not found');
        return this.prisma.jobApplicationMerged.findMany({ where: { jobId }, orderBy: { createdAt: 'desc' } });
    }
    async apply(orgId, jobId, dto) {
        const j = await this.prisma.jobPosting.findFirst({ where: { id: jobId, organizationId: orgId } });
        if (!j)
            throw new common_1.NotFoundException('Job not found');
        if (!dto.firstName && !dto.first_name)
            throw new common_1.ConflictException('firstName required');
        if (!dto.email)
            throw new common_1.ConflictException('email required');
        return this.prisma.jobApplicationMerged.create({ data: { jobId, firstName: dto.firstName || dto.first_name, lastName: dto.lastName || dto.last_name || '', email: dto.email, phone: dto.phone, resumeUrl: dto.resumeUrl || dto.resume_url, coverLetter: dto.coverLetter || dto.cover_letter, status: dto.status || 'NEW' } });
    }
    async updateApplication(orgId, id, dto) {
        const a = await this.prisma.jobApplicationMerged.findUnique({ where: { id }, include: { job: true } });
        if (!a || a.job.organizationId !== orgId)
            throw new common_1.NotFoundException('Application not found');
        return this.prisma.jobApplicationMerged.update({ where: { id }, data: { status: dto.status, coverLetter: dto.coverLetter } });
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobsService);
