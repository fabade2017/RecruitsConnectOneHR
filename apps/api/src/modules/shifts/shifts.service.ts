import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable() export class ShiftsService {
  constructor(private prisma: PrismaService) {}
  async list(orgId: string, q?: any) {
    const where: any = { organizationId: orgId };
    if (q?.type) where.type = q.type;
    if (q?.search) where.name = { contains: q.search, mode: 'insensitive' };
    return this.prisma.shift.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  async get(orgId: string, id: string) {
    const s = await this.prisma.shift.findFirst({ where: { id, organizationId: orgId } });
    if (!s) throw new NotFoundException('Shift not found');
    return s;
  }
  async create(orgId: string, dto: any) {
    if (!dto.name) throw new ConflictException('name required');
    return this.prisma.shift.create({ data: { organizationId: orgId, name: dto.name, type: dto.type || 'fixed', startTime: dto.start_time || dto.startTime, endTime: dto.end_time || dto.endTime, breakDurationMinutes: dto.break_duration_minutes ?? dto.breakDurationMinutes ?? 60, timezone: dto.timezone || 'Africa/Lagos', isOvernight: dto.isOvernight || dto.is_overnight || false } });
  }
  async update(orgId: string, id: string, dto: any) {
    const s = await this.prisma.shift.findFirst({ where: { id, organizationId: orgId } });
    if (!s) throw new NotFoundException('Shift not found');
    return this.prisma.shift.update({ where: { id }, data: { name: dto.name, type: dto.type, startTime: dto.start_time || dto.startTime, endTime: dto.end_time || dto.endTime, breakDurationMinutes: dto.break_duration_minutes ?? dto.breakDurationMinutes, isOvernight: dto.isOvernight } });
  }
  async remove(orgId: string, id: string) {
    const s = await this.prisma.shift.findFirst({ where: { id, organizationId: orgId } });
    if (!s) throw new NotFoundException('Shift not found');
    const used = await this.prisma.rosterAssignment.count({ where: { shiftId: id } });
    if (used) throw new ConflictException('Shift has roster assignments');
    return this.prisma.shift.delete({ where: { id } });
  }
  async createRoster(orgId: string, dto: any) {
    const shiftId = dto.shift_id || dto.shiftId;
    if (!shiftId) throw new ConflictException('shift_id required');
    const shift = await this.prisma.shift.findFirst({ where: { id: shiftId, organizationId: orgId } });
    if (!shift) throw new NotFoundException('Shift not found');
    const rawEmployeeIds: string[] = dto.employee_ids || dto.employeeIds
      || (dto.employee_id ? [dto.employee_id] : [])
      || (dto.employeeId ? [dto.employeeId] : []);
    const dates: string[] = dto.dates || (dto.date ? [dto.date] : []);
    if (!rawEmployeeIds.length) throw new ConflictException('employee_ids required');
    if (!dates.length) throw new ConflictException('dates required');

    // Resolve employees by internal id OR employee code (e.g. RC-000012)
    const employeeIds: string[] = [];
    for (const raw of rawEmployeeIds) {
      let e = await this.prisma.employee.findFirst({ where: { id: raw, organizationId: orgId } });
      if (!e) e = await this.prisma.employee.findFirst({ where: { employeeCode: raw, organizationId: orgId } });
      if (!e) throw new NotFoundException(`Employee ${raw} not found in org`);
      if (!employeeIds.includes(e.id)) employeeIds.push(e.id);
    }

    const scheduledMinutes = dto.scheduledMinutes || dto.scheduled_minutes || 480;
    const saved: any[] = [];
    for (const eid of employeeIds) {
      for (const d of dates) {
        const date = new Date(d);
        if (isNaN(date.getTime())) throw new ConflictException(`Invalid date: ${d}`);
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
  async rosters(orgId: string, q: any, user?: any) {
    const w:any={};
    if(q.employee_id) w.employeeId=q.employee_id;
    if(q.employeeId) w.employeeId=q.employeeId;
    if(q.shift_id) w.shiftId=q.shift_id;
    if(q.shiftId) w.shiftId=q.shiftId;
    if(q.date) w.date = new Date(q.date);
    // employee can only see own rosters
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (emp) w.employeeId = emp.id;
    } else if (user?.role === 'manager' && !w.employeeId) {
      const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (own) {
        const team = await this.prisma.employee.findMany({ where: { organizationId: orgId, managerId: own.id }, select: { id: true } });
        const ids = [own.id, ...team.map(t=>t.id)].filter(Boolean) as string[];
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
}
