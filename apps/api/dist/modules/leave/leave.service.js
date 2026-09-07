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
    createType(orgId, dto) { return this.prisma.leaveType.create({ data: { organizationId: orgId, name: dto.name, maxDays: dto.max_days ?? dto.maxDays } }); }
    async request(orgId, userId, dto) {
        const emp = await this.prisma.employee.findUnique({ where: { userId } });
        if (!emp)
            throw new common_1.ForbiddenException('Employee not found');
        const days = (new Date(dto.end_date).getTime() - new Date(dto.start_date).getTime()) / 86400000 + 1;
        return this.prisma.leaveRequest.create({ data: { organizationId: orgId, employeeId: emp.id, leaveTypeId: dto.leave_type_id || dto.leaveTypeId, startDate: new Date(dto.start_date), endDate: new Date(dto.end_date), days, reason: dto.reason } });
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
        return this.prisma.leaveRequest.findMany({ where: w, take: 50, orderBy: { createdAt: 'desc' }, include: { leaveType: true, employee: { select: { id: true, employeeCode: true, jobTitle: true, userId: true } } } });
    }
    async getOne(orgId, id, user) {
        const req = await this.prisma.leaveRequest.findFirst({ where: { id, organizationId: orgId }, include: { leaveType: true, employee: true } });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        // employees can only view own
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp?.id !== req.employeeId)
                throw new common_1.ForbiddenException('Can only view own requests');
        }
        else if (user?.role === 'manager') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (req.employeeId !== own?.id && req.employee.managerId !== own?.id)
                throw new common_1.ForbiddenException('Manager can only view team requests');
        }
        return req;
    }
    async update(orgId, id, user, dto) {
        const req = await this.prisma.leaveRequest.findFirst({ where: { id, organizationId: orgId }, include: { employee: true } });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.status !== 'pending')
            throw new common_1.ForbiddenException('Only pending requests can be edited');
        // permission check: owner or privileged
        const isOwner = await this.isOwner(user, req);
        const isPrivileged = ['hr_admin', 'org_admin', 'super_admin'].includes(user?.role);
        const isManagerOfOwner = user?.role === 'manager' ? await this.isManagerOf(user, req) : false;
        if (!isOwner && !isPrivileged && !isManagerOfOwner)
            throw new common_1.ForbiddenException('Not allowed to edit this request');
        const data = {};
        if (dto.leave_type_id || dto.leaveTypeId)
            data.leaveTypeId = dto.leave_type_id || dto.leaveTypeId;
        if (dto.start_date)
            data.startDate = new Date(dto.start_date);
        if (dto.end_date)
            data.endDate = new Date(dto.end_date);
        if (dto.start_date || dto.end_date) {
            const start = dto.start_date ? new Date(dto.start_date) : req.startDate;
            const end = dto.end_date ? new Date(dto.end_date) : req.endDate;
            data.days = (end.getTime() - start.getTime()) / 86400000 + 1;
        }
        if (dto.reason !== undefined)
            data.reason = dto.reason;
        return this.prisma.leaveRequest.update({ where: { id }, data, include: { leaveType: true } });
    }
    async cancel(orgId, id, user) {
        const req = await this.prisma.leaveRequest.findFirst({ where: { id, organizationId: orgId }, include: { employee: true } });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.status !== 'pending' && req.status !== 'approved')
            throw new common_1.ForbiddenException('Only pending or approved requests can be cancelled');
        const isOwner = await this.isOwner(user, req);
        const isPrivileged = ['hr_admin', 'org_admin', 'super_admin'].includes(user?.role);
        const isManagerOfOwner = user?.role === 'manager' ? await this.isManagerOf(user, req) : false;
        if (!isOwner && !isPrivileged && !isManagerOfOwner)
            throw new common_1.ForbiddenException('Not allowed to cancel this request');
        // if pending -> cancelled, if approved -> cancelled (hr may need to approve cancellation but for now allow)
        return this.prisma.leaveRequest.update({ where: { id }, data: { status: 'cancelled' } });
    }
    async remove(orgId, id, user) {
        const req = await this.prisma.leaveRequest.findFirst({ where: { id, organizationId: orgId }, include: { employee: true } });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        // Only pending can be hard-deleted; otherwise use cancel
        if (req.status !== 'pending')
            throw new common_1.ForbiddenException('Only pending requests can be deleted. Use cancel for approved/rejected.');
        const isOwner = await this.isOwner(user, req);
        const isPrivileged = ['hr_admin', 'org_admin', 'super_admin'].includes(user?.role);
        const isManagerOfOwner = user?.role === 'manager' ? await this.isManagerOf(user, req) : false;
        if (!isOwner && !isPrivileged && !isManagerOfOwner)
            throw new common_1.ForbiddenException('Not allowed to delete this request');
        await this.prisma.leaveRequest.delete({ where: { id } });
        return { success: true, id };
    }
    async isOwner(user, req) {
        if (!user?.sub)
            return false;
        const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
        return emp?.id === req.employeeId;
    }
    async isManagerOf(user, req) {
        const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
        if (!own)
            return false;
        return req.employee.managerId === own.id;
    }
    async approve(id, approverId, status, user) {
        const req = await this.prisma.leaveRequest.findUnique({ where: { id }, include: { employee: true } });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        // manager can only approve team
        if (user?.role === 'manager') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (req.employee.managerId !== own?.id && req.employeeId !== own?.id)
                throw new common_1.ForbiddenException('Manager can only approve team');
        }
        if (user?.role === 'employee')
            throw new common_1.ForbiddenException('Employees cannot approve');
        if (req.status !== 'pending')
            throw new common_1.ForbiddenException('Only pending requests can be approved/rejected');
        return this.prisma.leaveRequest.update({ where: { id }, data: { status: status, approverId } });
    }
    async balances(orgId, employeeId, user) {
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp?.id !== employeeId)
                throw new common_1.ForbiddenException('Can only view own balances');
        }
        return this.prisma.leaveRequest.findMany({ where: { organizationId: orgId, employeeId }, include: { leaveType: true } });
    }
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaveService);
