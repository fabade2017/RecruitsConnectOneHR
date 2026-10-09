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
const nigeria_1 = require("./nigeria");
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
        const profile = await this.prisma.payrollStatutoryProfile.findUnique({ where: { employeeId: p.employeeId } });
        const config = await this.prisma.payrollStatutoryConfig.findUnique({ where: { organizationId: p.organizationId } });
        return { ...p, statutoryProfile: profile, statutoryConfig: config };
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
    // ---- Nigeria statutory configuration ------------------------------------
    async getConfig(orgId) {
        const existing = await this.prisma.payrollStatutoryConfig.findUnique({ where: { organizationId: orgId } });
        if (existing)
            return this.serializeConfig(existing);
        const created = await this.prisma.payrollStatutoryConfig.create({
            data: { organizationId: orgId, payeBands: JSON.stringify(nigeria_1.DEFAULT_NIGERIA_RATES.payeBands) },
        });
        return this.serializeConfig(created);
    }
    async updateConfig(orgId, dto) {
        await this.prisma.payrollStatutoryConfig.upsert({
            where: { organizationId: orgId },
            create: { organizationId: orgId, ...this.configData(dto) },
            update: this.configData(dto),
        });
        return this.getConfig(orgId);
    }
    configData(dto) {
        const data = {};
        const numeric = [
            'employeePensionRate', 'employerPensionRate', 'nhfRate', 'nhisEmployeeRate',
            'nhisEmployerRate', 'nsitfRate', 'itfRate', 'rentReliefRate', 'rentReliefCap',
        ];
        for (const key of numeric)
            if (dto[key] !== undefined && dto[key] !== null && dto[key] !== '')
                data[key] = Number(dto[key]);
        if (dto.currency)
            data.currency = dto.currency;
        if (dto.employerItfLiable !== undefined)
            data.employerItfLiable = !!dto.employerItfLiable;
        if (dto.payeBands !== undefined)
            data.payeBands = typeof dto.payeBands === 'string' ? dto.payeBands : JSON.stringify(dto.payeBands);
        return data;
    }
    serializeConfig(config) {
        return { ...config, payeBands: (0, nigeria_1.parsePayeBands)(config.payeBands) };
    }
    toRates(config) {
        return {
            currency: config?.currency || nigeria_1.DEFAULT_NIGERIA_RATES.currency,
            employeePensionRate: Number(config?.employeePensionRate ?? nigeria_1.DEFAULT_NIGERIA_RATES.employeePensionRate),
            employerPensionRate: Number(config?.employerPensionRate ?? nigeria_1.DEFAULT_NIGERIA_RATES.employerPensionRate),
            nhfRate: Number(config?.nhfRate ?? nigeria_1.DEFAULT_NIGERIA_RATES.nhfRate),
            nhisEmployeeRate: Number(config?.nhisEmployeeRate ?? nigeria_1.DEFAULT_NIGERIA_RATES.nhisEmployeeRate),
            nhisEmployerRate: Number(config?.nhisEmployerRate ?? nigeria_1.DEFAULT_NIGERIA_RATES.nhisEmployerRate),
            nsitfRate: Number(config?.nsitfRate ?? nigeria_1.DEFAULT_NIGERIA_RATES.nsitfRate),
            itfRate: Number(config?.itfRate ?? nigeria_1.DEFAULT_NIGERIA_RATES.itfRate),
            rentReliefRate: Number(config?.rentReliefRate ?? nigeria_1.DEFAULT_NIGERIA_RATES.rentReliefRate),
            rentReliefCap: Number(config?.rentReliefCap ?? nigeria_1.DEFAULT_NIGERIA_RATES.rentReliefCap),
            employerItfLiable: config?.employerItfLiable ?? nigeria_1.DEFAULT_NIGERIA_RATES.employerItfLiable,
            payeBands: (0, nigeria_1.parsePayeBands)(config?.payeBands),
        };
    }
    // ---- Nigeria employee statutory profiles --------------------------------
    async listProfiles(orgId) {
        return this.prisma.payrollStatutoryProfile.findMany({
            where: { organizationId: orgId },
            include: { employee: true },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getProfile(orgId, employeeId) {
        const profile = await this.prisma.payrollStatutoryProfile.findUnique({
            where: { employeeId },
            include: { employee: true },
        });
        if (!profile || profile.organizationId !== orgId)
            throw new common_1.NotFoundException('Statutory profile not found');
        return profile;
    }
    async upsertProfile(orgId, employeeId, dto) {
        const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        const data = {
            tin: dto.tin ?? undefined,
            pfa: dto.pfa ?? undefined,
            rsaPin: dto.rsaPin ?? undefined,
            stateOfResidence: dto.stateOfResidence ?? undefined,
        };
        const numeric = [
            'basicSalary', 'housingAllowance', 'transportAllowance', 'otherTaxable', 'nonTaxable',
            'annualRentPaid', 'otherDeductions', 'loanRepayment',
        ];
        for (const key of numeric)
            if (dto[key] !== undefined && dto[key] !== null && dto[key] !== '')
                data[key] = Number(dto[key]);
        if (dto.nhisEnrolled !== undefined)
            data.nhisEnrolled = !!dto.nhisEnrolled;
        if (dto.nhfEnrolled !== undefined)
            data.nhfEnrolled = !!dto.nhfEnrolled;
        return this.prisma.payrollStatutoryProfile.upsert({
            where: { employeeId },
            create: { organizationId: orgId, employeeId, ...data },
            update: data,
            include: { employee: true },
        });
    }
    // ---- Nigeria payroll computation & run ----------------------------------
    async preview(orgId, employeeId, dto) {
        const profile = await this.prisma.payrollStatutoryProfile.findUnique({ where: { employeeId } });
        const config = await this.prisma.payrollStatutoryConfig.findUnique({ where: { organizationId: orgId } });
        const input = this.mergeInput(profile, dto);
        const result = (0, nigeria_1.computeNigeriaPayroll)(input, this.toRates(config));
        return { input, rates: this.toRates(config), result };
    }
    mergeInput(profile, dto) {
        const pick = (key) => (dto?.[key] !== undefined && dto?.[key] !== null && dto?.[key] !== '' ? dto[key] : profile?.[key]);
        return {
            basicSalary: Number(pick('basicSalary') || 0),
            housingAllowance: Number(pick('housingAllowance') || 0),
            transportAllowance: Number(pick('transportAllowance') || 0),
            otherTaxable: Number(pick('otherTaxable') || 0),
            nonTaxable: Number(pick('nonTaxable') || 0),
            annualRentPaid: Number(pick('annualRentPaid') || 0),
            nhisEnrolled: pick('nhisEnrolled') ?? false,
            nhfEnrolled: pick('nhfEnrolled') ?? true,
            otherDeductions: Number(pick('otherDeductions') || 0),
            loanRepayment: Number(pick('loanRepayment') || 0),
        };
    }
    toWriteData(result, currency) {
        return {
            basicSalary: result.basicSalary,
            allowances: result.housingAllowance + result.transportAllowance + result.otherTaxable + result.nonTaxable,
            deductions: result.employeePension + result.nhf + result.nhisEmployee + result.otherDeductions + result.loanRepayment,
            tax: result.monthlyPaye,
            netPay: result.netPay,
            currency,
            grossPay: result.grossPay,
            housingAllowance: result.housingAllowance,
            transportAllowance: result.transportAllowance,
            otherTaxable: result.otherTaxable,
            nonTaxable: result.nonTaxable,
            employeePension: result.employeePension,
            employerPension: result.employerPension,
            nhf: result.nhf,
            nhisEmployee: result.nhisEmployee,
            nhisEmployer: result.nhisEmployer,
            nsitf: result.nsitf,
            itf: result.itf,
            rentRelief: result.rentRelief,
            chargeableIncome: result.annualChargeableIncome,
            loanRepayment: result.loanRepayment,
            groupLifeCover: result.groupLifeCover,
            employerCost: result.employerCost,
        };
    }
    async run(orgId, dto) {
        const month = parseInt(dto.month);
        const year = parseInt(dto.year);
        if (!month || !year)
            throw new common_1.ForbiddenException('month and year are required');
        const config = await this.prisma.payrollStatutoryConfig.findUnique({ where: { organizationId: orgId } });
        const rates = this.toRates(config);
        const currency = config?.currency || nigeria_1.DEFAULT_NIGERIA_RATES.currency;
        let profiles = await this.prisma.payrollStatutoryProfile.findMany({
            where: { organizationId: orgId },
            include: { employee: true },
        });
        if (dto.employeeId)
            profiles = profiles.filter(p => p.employeeId === dto.employeeId);
        if (!profiles.length)
            throw new common_1.NotFoundException('No employee statutory profiles configured. Set up staff payroll profiles first.');
        const results = [];
        for (const profile of profiles) {
            const input = this.mergeInput(profile, {});
            const result = (0, nigeria_1.computeNigeriaPayroll)(input, rates);
            const data = this.toWriteData(result, currency);
            const record = await this.prisma.payrollMerged.upsert({
                where: { employeeId_month_year: { employeeId: profile.employeeId, month, year } },
                create: { organizationId: orgId, employeeId: profile.employeeId, month, year, status: dto.status || 'DRAFT', ...data },
                update: { status: dto.status || 'DRAFT', ...data },
                include: { employee: true },
            });
            results.push({ record, result });
        }
        return { month, year, currency, count: results.length, records: results.map(r => r.record), summary: this.summarize(results) };
    }
    summarize(results) {
        const totals = results.reduce((acc, { result }) => {
            acc.grossPay += result.grossPay;
            acc.netPay += result.netPay;
            acc.paye += result.monthlyPaye;
            acc.employeePension += result.employeePension;
            acc.employerPension += result.employerPension;
            acc.nhf += result.nhf;
            acc.nhisEmployee += result.nhisEmployee;
            acc.nhisEmployer += result.nhisEmployer;
            acc.nsitf += result.nsitf;
            acc.itf += result.itf;
            acc.employerCost += result.employerCost;
            acc.totalStatutoryCost += result.totalStatutoryCost;
            return acc;
        }, { grossPay: 0, netPay: 0, paye: 0, employeePension: 0, employerPension: 0, nhf: 0, nhisEmployee: 0, nhisEmployer: 0, nsitf: 0, itf: 0, employerCost: 0, totalStatutoryCost: 0 });
        Object.keys(totals).forEach(k => { totals[k] = Math.round(totals[k] * 100) / 100; });
        return totals;
    }
    async statutorySummary(orgId, month, year) {
        const where = { organizationId: orgId };
        if (month)
            where.month = parseInt(month);
        if (year)
            where.year = parseInt(year);
        const rows = await this.prisma.payrollMerged.findMany({ where, include: { employee: true } });
        const results = rows.map(r => ({
            result: {
                grossPay: Number(r.grossPay),
                netPay: Number(r.netPay),
                monthlyPaye: Number(r.tax),
                employeePension: Number(r.employeePension),
                employerPension: Number(r.employerPension),
                nhf: Number(r.nhf),
                nhisEmployee: Number(r.nhisEmployee),
                nhisEmployer: Number(r.nhisEmployer),
                nsitf: Number(r.nsitf),
                itf: Number(r.itf),
                employerCost: Number(r.employerCost),
                totalStatutoryCost: Number(r.tax) + Number(r.employeePension) + Number(r.nhf) + Number(r.nhisEmployee) +
                    Number(r.employerPension) + Number(r.nhisEmployer) + Number(r.nsitf) + Number(r.itf),
            },
        }));
        return { month: month ? parseInt(month) : null, year: year ? parseInt(year) : null, count: rows.length, summary: this.summarize(results) };
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollService);
