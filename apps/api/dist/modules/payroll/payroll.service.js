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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PayrollService = class PayrollService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(orgId, query, user) {
        const where = { organizationId: orgId };
        if (query.employeeId)
            where.employeeId = query.employeeId;
        if (query.status)
            where.status = query.status;
        if (query.month)
            where.month = parseInt(query.month);
        if (query.year)
            where.year = parseInt(query.year);
        // RBAC scoping
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp)
                where.employeeId = emp.id;
        }
        else if (user?.role === 'manager') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own && !query.employeeId) {
                const team = await this.prisma.employee.findMany({ where: { organizationId: orgId, managerId: own.id }, select: { id: true } });
                const ids = [own.id, ...team.map(t => t.id)];
                where.employeeId = { in: ids };
            }
        }
        return this.prisma.payrollMerged.findMany({ where, take: 50, orderBy: { createdAt: 'desc' }, include: { employee: true } });
    }
    create(orgId, dto) {
        const allowances = dto.allowances || 0;
        const deductions = dto.deductions || 0;
        const tax = dto.tax || 0;
        const netPay = dto.basicSalary + allowances - deductions - tax;
        return this.prisma.payrollMerged.create({
            data: { organizationId: orgId, employeeId: dto.employeeId, month: dto.month, year: dto.year, basicSalary: dto.basicSalary, allowances, deductions, tax, netPay, status: dto.status || 'DRAFT' },
        });
    }
    update(id, dto) { return this.prisma.payrollMerged.update({ where: { id }, data: dto }); }
    async payslip(id, user) {
        const p = await this.prisma.payrollMerged.findUnique({ where: { id }, include: { employee: true } });
        if (!p)
            throw new common_1.ForbiddenException('Not found');
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp?.id !== p.employeeId)
                throw new common_1.ForbiddenException('Can only view own payslip');
        }
        return p;
    }
    async bankDetails(orgId, employeeId, user) {
        const where = { organizationId: orgId };
        if (employeeId)
            where.employeeId = employeeId;
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp)
                where.employeeId = emp.id;
        }
        return this.prisma.bankDetail.findMany({ where, include: { employee: true } });
    }
    async upsertBankDetail(orgId, dto, user) {
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp?.id !== dto.employeeId)
                throw new common_1.ForbiddenException('Can only update own bank details');
        }
        return this.prisma.bankDetail.upsert({
            where: { employeeId: dto.employeeId },
            create: { organizationId: orgId, employeeId: dto.employeeId, bankName: dto.bankName, accountNumber: dto.accountNumber, accountName: dto.accountName },
            update: { bankName: dto.bankName, accountNumber: dto.accountNumber, accountName: dto.accountName },
        });
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollService);
