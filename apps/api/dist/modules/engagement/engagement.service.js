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
exports.EngagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let EngagementService = class EngagementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async surveys(orgId, q) {
        const where = { organizationId: orgId };
        if (q.status)
            where.status = q.status;
        if (q.search)
            where.title = { contains: q.search, mode: 'insensitive' };
        return this.prisma.engagementSurvey.findMany({ where, take: 50, orderBy: { createdAt: 'desc' }, include: { responses: true } });
    }
    async create(orgId, dto) {
        if (!dto.title)
            throw new common_1.ConflictException('title required');
        let questions = dto.questions;
        if (Array.isArray(questions))
            questions = JSON.stringify(questions);
        else if (typeof questions === 'string')
            questions = questions;
        else
            questions = JSON.stringify([]);
        return this.prisma.engagementSurvey.create({ data: { organizationId: orgId, title: dto.title, description: dto.description, questions, status: dto.status || 'DRAFT', startDate: dto.startDate ? new Date(dto.startDate) : dto.start_date ? new Date(dto.start_date) : null, endDate: dto.endDate ? new Date(dto.endDate) : dto.end_date ? new Date(dto.end_date) : null } });
    }
    async get(orgId, id) {
        const s = await this.prisma.engagementSurvey.findFirst({ where: { id, organizationId: orgId }, include: { responses: true } });
        if (!s)
            throw new common_1.NotFoundException('Survey not found');
        return s;
    }
    async update(orgId, id, dto) {
        const s = await this.prisma.engagementSurvey.findFirst({ where: { id, organizationId: orgId } });
        if (!s)
            throw new common_1.NotFoundException('Survey not found');
        return this.prisma.engagementSurvey.update({ where: { id }, data: { title: dto.title, description: dto.description, questions: dto.questions ? (Array.isArray(dto.questions) ? JSON.stringify(dto.questions) : dto.questions) : undefined, status: dto.status } });
    }
    async remove(orgId, id) {
        const s = await this.prisma.engagementSurvey.findFirst({ where: { id, organizationId: orgId } });
        if (!s)
            throw new common_1.NotFoundException('Survey not found');
        await this.prisma.engagementResponse.deleteMany({ where: { surveyId: id } });
        return this.prisma.engagementSurvey.delete({ where: { id } });
    }
    async respond(orgId, surveyId, dto, user) {
        const survey = await this.prisma.engagementSurvey.findFirst({ where: { id: surveyId, organizationId: orgId } });
        if (!survey)
            throw new common_1.NotFoundException('Survey not found');
        let employeeId = dto.employeeId || dto.employee_id;
        if (!employeeId && user) {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            employeeId = emp?.id;
        }
        if (!employeeId)
            throw new common_1.ConflictException('employeeId required');
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp?.id !== employeeId)
                throw new common_1.ForbiddenException('Can only respond as self');
        }
        const empCheck = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
        if (!empCheck)
            throw new common_1.NotFoundException('Employee not in org');
        let answers = dto.answers;
        if (Array.isArray(answers) || typeof answers === 'object')
            answers = JSON.stringify(answers);
        return this.prisma.engagementResponse.upsert({
            where: { surveyId_employeeId: { surveyId, employeeId } },
            create: { surveyId, employeeId, answers: answers || '[]', score: dto.score, feedback: dto.feedback },
            update: { answers: answers || '[]', score: dto.score, feedback: dto.feedback },
        });
    }
    async responses(orgId, surveyId) {
        const survey = await this.prisma.engagementSurvey.findFirst({ where: { id: surveyId, organizationId: orgId } });
        if (!survey)
            throw new common_1.NotFoundException('Survey not found');
        return this.prisma.engagementResponse.findMany({ where: { surveyId }, include: { employee: true } });
    }
};
exports.EngagementService = EngagementService;
exports.EngagementService = EngagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EngagementService);
