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
exports.TalentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TalentService = class TalentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listVacancies(orgId, q, user) {
        const where = { organizationId: orgId };
        if (q.status)
            where.status = q.status;
        if (q.search)
            where.title = { contains: q.search, mode: 'insensitive' };
        const vacancies = await this.prisma.internalVacancy.findMany({ where, take: 100, orderBy: { createdAt: 'desc' }, include: { applications: true } });
        // if eligible_for filter, check eligibility
        if (q.eligible_for || q.eligibleFor) {
            const empId = q.eligible_for || q.eligibleFor;
            const emp = await this.prisma.employee.findFirst({ where: { id: empId, organizationId: orgId } });
            if (emp) {
                // simple eligibility: grade check if present in eligibilityRules JSON
                return vacancies.filter(v => {
                    try {
                        const rules = JSON.parse(v.eligibilityRules || '{}');
                        if (rules.min_grade && emp.grade && emp.grade < rules.min_grade)
                            return false;
                        return true;
                    }
                    catch {
                        return true;
                    }
                });
            }
        }
        return vacancies;
    }
    async createVacancy(orgId, dto) {
        if (!dto.title)
            throw new common_1.NotFoundException('title required');
        return this.prisma.internalVacancy.create({
            data: {
                organizationId: orgId,
                title: dto.title,
                departmentId: dto.department_id || dto.departmentId || null,
                description: dto.description || null,
                eligibilityRules: JSON.stringify(dto.eligibility_rules || dto.eligibilityRules || {}),
                status: dto.status || 'open',
            },
        });
    }
    async getVacancy(orgId, id) {
        const v = await this.prisma.internalVacancy.findFirst({ where: { id, organizationId: orgId }, include: { applications: true } });
        if (!v)
            throw new common_1.NotFoundException('Vacancy not found');
        return v;
    }
    async apply(orgId, vacancyId, dto, user) {
        const v = await this.prisma.internalVacancy.findFirst({ where: { id: vacancyId, organizationId: orgId } });
        if (!v)
            throw new common_1.NotFoundException('Vacancy not found');
        // resolve employeeId: from dto or from user
        let employeeId = dto.employeeId || dto.employee_id;
        if (!employeeId && user) {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            employeeId = emp?.id;
        }
        if (!employeeId)
            throw new common_1.NotFoundException('employeeId required');
        const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        // eligibility auto-check
        let eligibilityCheck = { eligible: true, reasons: [] };
        try {
            const rules = JSON.parse(v.eligibilityRules || '{}');
            if (rules.min_grade && emp.grade && emp.grade < rules.min_grade) {
                eligibilityCheck.eligible = false;
                eligibilityCheck.reasons.push('grade below minimum');
            }
            if (rules.skills && Array.isArray(rules.skills)) {
                const empSkills = emp.skills ? JSON.parse(emp.skills) : [];
                const missing = rules.skills.filter((s) => !empSkills.includes(s));
                if (missing.length) {
                    eligibilityCheck.eligible = false;
                    eligibilityCheck.reasons.push('missing skills: ' + missing.join(','));
                }
            }
        }
        catch { }
        return this.prisma.vacancyApplication.create({
            data: {
                vacancyId,
                employeeId,
                status: 'pending',
                eligibilityCheck: JSON.stringify(eligibilityCheck),
            },
        });
    }
    async listApplications(orgId, vacancyId) {
        const v = await this.prisma.internalVacancy.findFirst({ where: { id: vacancyId, organizationId: orgId } });
        if (!v)
            throw new common_1.NotFoundException('Vacancy not found');
        return this.prisma.vacancyApplication.findMany({ where: { vacancyId }, take: 100, orderBy: { createdAt: 'desc' } });
    }
    // Talent Marketplace opportunities (TalentOpportunity)
    async listOpportunities(orgId, q) {
        const where = { organizationId: orgId };
        if (q.type)
            where.type = q.type;
        if (q.status)
            where.status = q.status;
        if (q.search)
            where.title = { contains: q.search, mode: 'insensitive' };
        return this.prisma.talentOpportunity.findMany({ where, take: 100, orderBy: { createdAt: 'desc' } });
    }
    async createOpportunity(orgId, dto) {
        if (!dto.title)
            throw new common_1.NotFoundException('title required');
        return this.prisma.talentOpportunity.create({
            data: {
                organizationId: orgId,
                title: dto.title,
                type: dto.type || 'project',
                description: dto.description,
                skillsRequired: JSON.stringify(dto.skills_required || dto.skillsRequired || []),
                status: dto.status || 'open',
            },
        });
    }
    async marketplace(orgId, q) {
        // Unified marketplace feed: vacancies + opportunities
        const vacancies = await this.prisma.internalVacancy.findMany({ where: { organizationId: orgId, status: 'open' }, take: 20, orderBy: { createdAt: 'desc' } });
        const opps = await this.prisma.talentOpportunity.findMany({ where: { organizationId: orgId, status: 'open' }, take: 20, orderBy: { createdAt: 'desc' } });
        return {
            vacancies: vacancies.map(v => ({ ...v, kind: 'vacancy' })),
            opportunities: opps.map(o => ({ ...o, kind: 'opportunity' })),
            feed: [...vacancies.map(v => ({ id: v.id, title: v.title, type: 'vacancy', status: v.status, createdAt: v.createdAt })), ...opps.map(o => ({ id: o.id, title: o.title, type: o.type, status: o.status, createdAt: o.createdAt }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        };
    }
};
exports.TalentService = TalentService;
exports.TalentService = TalentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TalentService);
