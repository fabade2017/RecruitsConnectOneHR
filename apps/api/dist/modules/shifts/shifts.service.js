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
        const rawEmployeeIds = dto.employee_ids || dto.employeeIds
            || (dto.employee_id ? [dto.employee_id] : [])
            || (dto.employeeId ? [dto.employeeId] : []);
        const dates = dto.dates || (dto.date ? [dto.date] : []);
        if (!rawEmployeeIds.length)
            throw new common_1.ConflictException('employee_ids required');
        if (!dates.length)
            throw new common_1.ConflictException('dates required');
        // Resolve employees by internal id OR employee code (e.g. RC-000012)
        const employeeIds = [];
        for (const raw of rawEmployeeIds) {
            let e = await this.prisma.employee.findFirst({ where: { id: raw, organizationId: orgId } });
            if (!e)
                e = await this.prisma.employee.findFirst({ where: { employeeCode: raw, organizationId: orgId } });
            if (!e)
                throw new common_1.NotFoundException(`Employee ${raw} not found in org`);
            if (!employeeIds.includes(e.id))
                employeeIds.push(e.id);
        }
        const scheduledMinutes = dto.scheduledMinutes || dto.scheduled_minutes || 480;
        const saved = [];
        for (const eid of employeeIds) {
            for (const d of dates) {
                const date = new Date(d);
                if (isNaN(date.getTime()))
                    throw new common_1.ConflictException(`Invalid date: ${d}`);
                const rec = await this.prisma.rosterAssignment.upsert({
                    where: { employeeId_date: { employeeId: eid, date } },
                    create: { employeeId: eid, shiftId, date, scheduledMinutes },
                    update: { shiftId, scheduledMinutes },
                });
                saved.push(rec);
            }
        }
        return { count: saved.length, data: saved };
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
        const list = await this.prisma.rosterAssignment.findMany({
            where: w,
            take: 200,
            orderBy: { date: 'desc' },
            include: { shift: true },
        });
        // Only org shifts
        const scoped = list.filter((r) => r.shift?.organizationId === orgId);
        // Attach employee display info
        const empIds = Array.from(new Set(scoped.map((r) => r.employeeId)));
        const emps = empIds.length
            ? await this.prisma.employee.findMany({
                where: { id: { in: empIds } },
                select: { id: true, employeeCode: true, firstName: true, lastName: true },
            })
            : [];
        const empMap = new Map(emps.map((e) => [e.id, e]));
        return scoped.map((r) => ({ ...r, employee: empMap.get(r.employeeId) || null }));
    }
};
exports.ShiftsService = ShiftsService;
exports.ShiftsService = ShiftsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftsService);
