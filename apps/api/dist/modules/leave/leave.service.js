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
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LeaveService = class LeaveService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    types(orgId) { return this.prisma.leaveType.findMany({ where: { organizationId: orgId } }); }
    createType(orgId, dto) { return this.prisma.leaveType.create({ data: { organizationId: orgId, name: dto.name, maxDays: dto.max_days } }); }
    async request(orgId, userId, dto) {
        const emp = await this.prisma.employee.findUnique({ where: { userId } });
        if (!emp)
            throw new common_1.ForbiddenException('Employee not found');
        const days = (new Date(dto.end_date).getTime() - new Date(dto.start_date).getTime()) / 86400000 + 1;
        return this.prisma.leaveRequest.create({ data: { organizationId: orgId, employeeId: emp.id, leaveTypeId: dto.leave_type_id, startDate: new Date(dto.start_date), endDate: new Date(dto.end_date), days, reason: dto.reason } });
    }
    async list(orgId, q, user) {
        const w = { organizationId: orgId };
        if (q.status)
            w.status = q.status;
        if (q.employee_id)
            w.employeeId = q.employee_id;
        // RBAC scoping
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp)
                w.employeeId = emp.id;
        }
        else if (user?.role === 'manager') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own && !q.employee_id) {
                const team = await this.prisma.employee.findMany({ where: { organizationId: orgId, managerId: own.id }, select: { id: true } });
                const ids = [own.id, ...team.map(t => t.id)];
                w.employeeId = { in: ids };
            }
        }
        return this.prisma.leaveRequest.findMany({ where: w, take: 50, orderBy: { createdAt: 'desc' } });
    }
    async approve(id, approverId, status, user) {
        const req = await this.prisma.leaveRequest.findUnique({ where: { id }, include: { employee: true } });
        if (!req)
            throw new common_1.ForbiddenException('Request not found');
        // manager can only approve team
        if (user?.role === 'manager') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (req.employee.managerId !== own?.id && req.employeeId !== own?.id)
                throw new common_1.ForbiddenException('Manager can only approve team');
        }
        if (user?.role === 'employee')
            throw new common_1.ForbiddenException('Employees cannot approve');
        return this.prisma.leaveRequest.update({ where: { id }, data: { status: status, approverId } });
    }
    async balances(orgId, employeeId, user) {
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp?.id !== employeeId)
                throw new common_1.ForbiddenException('Can only view own balances');
        }
        return this.prisma.leaveRequest.findMany({ where: { organizationId: orgId, employeeId } });
    }
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaveService);
