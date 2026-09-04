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
exports.ShiftsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ShiftsService = class ShiftsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(orgId, q) {
        const where = { organizationId: orgId };
        if (q?.type)
            where.type = q.type;
        if (q?.search)
            where.name = { contains: q.search, mode: 'insensitive' };
        return this.prisma.shift.findMany({ where, orderBy: { createdAt: 'desc' } });
    }
    async get(orgId, id) {
        const s = await this.prisma.shift.findFirst({ where: { id, organizationId: orgId } });
        if (!s)
            throw new common_1.NotFoundException('Shift not found');
        return s;
    }
    async create(orgId, dto) {
        if (!dto.name)
            throw new common_1.ConflictException('name required');
        return this.prisma.shift.create({ data: { organizationId: orgId, name: dto.name, type: dto.type || 'fixed', startTime: dto.start_time || dto.startTime, endTime: dto.end_time || dto.endTime, breakDurationMinutes: dto.break_duration_minutes ?? dto.breakDurationMinutes ?? 60, timezone: dto.timezone || 'Africa/Lagos', isOvernight: dto.isOvernight || dto.is_overnight || false } });
    }
    async update(orgId, id, dto) {
        const s = await this.prisma.shift.findFirst({ where: { id, organizationId: orgId } });
        if (!s)
            throw new common_1.NotFoundException('Shift not found');
        return this.prisma.shift.update({ where: { id }, data: { name: dto.name, type: dto.type, startTime: dto.start_time || dto.startTime, endTime: dto.end_time || dto.endTime, breakDurationMinutes: dto.break_duration_minutes ?? dto.breakDurationMinutes, isOvernight: dto.isOvernight } });
    }
    async remove(orgId, id) {
        const s = await this.prisma.shift.findFirst({ where: { id, organizationId: orgId } });
        if (!s)
            throw new common_1.NotFoundException('Shift not found');
        const used = await this.prisma.rosterAssignment.count({ where: { shiftId: id } });
        if (used)
            throw new common_1.ConflictException('Shift has roster assignments');
        return this.prisma.shift.delete({ where: { id } });
    }
    async createRoster(orgId, dto) {
        const shiftId = dto.shift_id || dto.shiftId;
        if (!shiftId)
            throw new common_1.ConflictException('shift_id required');
        const shift = await this.prisma.shift.findFirst({ where: { id: shiftId, organizationId: orgId } });
        if (!shift)
            throw new common_1.NotFoundException('Shift not found');
        const employeeIds = dto.employee_ids || dto.employeeIds || (dto.employee_id ? [dto.employee_id] : []);
        const dates = dto.dates || (dto.date ? [dto.date] : []);
        if (!employeeIds.length)
            throw new common_1.ConflictException('employee_ids required');
        if (!dates.length)
            throw new common_1.ConflictException('dates required');
        // validate employees belong to org
        for (const eid of employeeIds) {
            const e = await this.prisma.employee.findFirst({ where: { id: eid, organizationId: orgId } });
            if (!e)
                throw new common_1.NotFoundException(`Employee ${eid} not found in org`);
        }
        const data = employeeIds.flatMap((eid) => dates.map((d) => ({ employeeId: eid, shiftId, date: new Date(d), scheduledMinutes: dto.scheduledMinutes || dto.scheduled_minutes || 480 })));
        return this.prisma.rosterAssignment.createMany({ data });
    }
    async rosters(orgId, q, user) {
        const w = {};
        if (q.employee_id)
            w.employeeId = q.employee_id;
        if (q.employeeId)
            w.employeeId = q.employeeId;
        if (q.shift_id)
            w.shiftId = q.shift_id;
        if (q.shiftId)
            w.shiftId = q.shiftId;
        if (q.date)
            w.date = new Date(q.date);
        // employee can only see own rosters
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp)
                w.employeeId = emp.id;
        }
        else if (user?.role === 'manager' && !w.employeeId) {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own) {
                const team = await this.prisma.employee.findMany({ where: { organizationId: orgId, managerId: own.id }, select: { id: true } });
                const ids = [own.id, ...team.map(t => t.id)].filter(Boolean);
                w.employeeId = { in: ids };
            }
        }
        // verify org scoping via shift organizationId - filter by shift's org via employee?
        // For MSSQL we ensure via employee's org already; additional filter by joining shift
        const list = await this.prisma.rosterAssignment.findMany({ where: w, take: 100, orderBy: { date: 'desc' } });
        // Filter to org shifts only
        const shiftIds = list.map(r => r.shiftId);
        const orgShifts = await this.prisma.shift.findMany({ where: { id: { in: shiftIds }, organizationId: orgId }, select: { id: true } });
        const validIds = new Set(orgShifts.map(s => s.id));
        return list.filter(r => validIds.has(r.shiftId));
    }
};
exports.ShiftsService = ShiftsService;
exports.ShiftsService = ShiftsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftsService);
