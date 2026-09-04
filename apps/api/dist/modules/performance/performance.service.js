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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PerformanceService = class PerformanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(orgId, q, user) {
        const where = { organizationId: orgId };
        if (q.employee_id)
            where.employeeId = q.employee_id;
        if (q.employeeId)
            where.employeeId = q.employeeId;
        if (q.cycle)
            where.cycle = q.cycle;
        // employee sees own only, manager sees team
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp)
                where.employeeId = emp.id;
        }
        else if (user?.role === 'manager') {
            const ownId = await this.prisma.employee.findUnique({ where: { userId: user.sub } }).then(e => e?.id);
            if (q.employee_id || q.employeeId) {
                const target = await this.prisma.employee.findFirst({ where: { id: where.employeeId, organizationId: orgId } });
                if (target && target.managerId !== ownId && target.id !== ownId)
                    throw new common_1.ForbiddenException('Manager can only view team');
            }
            else {
                const team = await this.prisma.employee.findMany({ where: { managerId: ownId, organizationId: orgId }, select: { id: true } });
                const ids = [ownId, ...team.map(t => t.id)].filter(Boolean);
                where.employeeId = { in: ids };
            }
        }
        return this.prisma.performanceReview.findMany({ where, take: 100, orderBy: { createdAt: 'desc' }, include: { employee: true } });
    }
    async create(orgId, dto, user) {
        const employeeId = dto.employeeId || dto.employee_id;
        if (!employeeId)
            throw new common_1.NotFoundException('employeeId required');
        if (!dto.kpi)
            throw new common_1.NotFoundException('kpi required');
        const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        // normalize kpi: if string keep as string, if array stringify
        let kpiStr;
        if (typeof dto.kpi === 'string')
            kpiStr = JSON.stringify([{ metric: dto.kpi, rating: dto.rating || 3 }]);
        else if (Array.isArray(dto.kpi))
            kpiStr = JSON.stringify(dto.kpi);
        else
            kpiStr = JSON.stringify([dto.kpi]);
        // also store rating in kpi if provided
        let overallIndicator = null;
        if (dto.rating) {
            const r = Number(dto.rating);
            if (r >= 5)
                overallIndicator = 'outstanding';
            else if (r >= 4)
                overallIndicator = 'exceeds';
            else if (r >= 3)
                overallIndicator = 'meets';
            else
                overallIndicator = 'needs_improvement';
        }
        return this.prisma.performanceReview.create({
            data: {
                organizationId: orgId,
                employeeId,
                cycle: dto.cycle || '2026-H1',
                kpi: kpiStr,
                managerAssessment: dto.managerAssessment || dto.manager_assessment || null,
                overallIndicator,
                reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : new Date(),
            },
        });
    }
    async update(orgId, id, dto) {
        const existing = await this.prisma.performanceReview.findFirst({ where: { id, organizationId: orgId } });
        if (!existing)
            throw new common_1.NotFoundException('Review not found');
        const data = {};
        if (dto.kpi !== undefined)
            data.kpi = typeof dto.kpi === 'string' ? JSON.stringify([{ metric: dto.kpi }]) : JSON.stringify(dto.kpi);
        if (dto.managerAssessment !== undefined)
            data.managerAssessment = dto.managerAssessment;
        if (dto.manager_assessment !== undefined)
            data.managerAssessment = dto.manager_assessment;
        if (dto.overallIndicator !== undefined)
            data.overallIndicator = dto.overallIndicator;
        if (dto.overall_indicator !== undefined)
            data.overallIndicator = dto.overall_indicator;
        if (dto.rating !== undefined) {
            const r = Number(dto.rating);
            if (r >= 5)
                data.overallIndicator = 'outstanding';
            else if (r >= 4)
                data.overallIndicator = 'exceeds';
            else if (r >= 3)
                data.overallIndicator = 'meets';
            else
                data.overallIndicator = 'needs_improvement';
            // also update kpi to include rating
            try {
                const kpi = JSON.parse(existing.kpi);
                if (Array.isArray(kpi) && kpi[0])
                    kpi[0].rating = r;
                data.kpi = JSON.stringify(kpi);
            }
            catch { }
        }
        return this.prisma.performanceReview.update({ where: { id }, data });
    }
    async health(orgId, q) {
        const where = { organizationId: orgId };
        if (q.department_id) {
            const emps = await this.prisma.employee.findMany({ where: { organizationId: orgId, departmentId: q.department_id }, select: { id: true } });
            where.employeeId = { in: emps.map(e => e.id) };
        }
        const reviews = await this.prisma.performanceReview.findMany({ where, take: 1000 });
        if (!reviews.length)
            return { performance_health: 0, total: 0, averageIndicator: null };
        // compute health by rating distribution
        let sum = 0;
        let count = 0;
        for (const r of reviews) {
            try {
                const kpi = JSON.parse(r.kpi);
                const rating = Array.isArray(kpi) ? (kpi[0]?.rating || 0) : 0;
                if (rating) {
                    sum += (rating / 5) * 100;
                    count++;
                }
            }
            catch { }
            // fallback overallIndicator
            if (r.overallIndicator) {
                const map = { outstanding: 95, exceeds: 85, meets: 70, needs_improvement: 50 };
                if (!count || map[r.overallIndicator]) {
                    sum += map[r.overallIndicator] || 60;
                    count++;
                }
            }
        }
        const avg = count ? Math.round(sum / count) : 75;
        return { performance_health: avg, total: reviews.length, averageIndicator: avg >= 85 ? 'exceeds' : avg >= 70 ? 'meets' : 'needs_improvement' };
    }
    async remove(orgId, id) {
        const existing = await this.prisma.performanceReview.findFirst({ where: { id, organizationId: orgId } });
        if (!existing)
            throw new common_1.NotFoundException('Review not found');
        return this.prisma.performanceReview.delete({ where: { id } });
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PerformanceService);
