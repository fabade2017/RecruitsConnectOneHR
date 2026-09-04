import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable() export class LeaveService {
  constructor(private prisma: PrismaService) {}
  types(orgId:string){ return this.prisma.leaveType.findMany({ where:{ organizationId: orgId }}); }
  createType(orgId:string, dto:any){ return this.prisma.leaveType.create({ data:{ organizationId: orgId, name: dto.name, maxDays: dto.max_days }}); }
  async request(orgId:string, userId:string, dto:any){
    const emp = await this.prisma.employee.findUnique({ where:{ userId }});
    if (!emp) throw new ForbiddenException('Employee not found');
    const days = (new Date(dto.end_date).getTime() - new Date(dto.start_date).getTime())/86400000+1;
    return this.prisma.leaveRequest.create({ data:{ organizationId: orgId, employeeId: emp!.id, leaveTypeId: dto.leave_type_id, startDate: new Date(dto.start_date), endDate: new Date(dto.end_date), days, reason: dto.reason }});
  }
  async list(orgId:string, q:any, user?: any){
    const w:any={ organizationId: orgId };
    if(q.status) w.status=q.status;
    if(q.employee_id) w.employeeId=q.employee_id;
    // RBAC scoping
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
      if (emp) w.employeeId = emp.id;
    } else if (user?.role === 'manager') {
      const own = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
      if (own && !q.employee_id) {
        const team = await this.prisma.employee.findMany({ where:{ organizationId: orgId, managerId: own.id }, select:{id:true}});
        const ids = [own.id, ...team.map(t=>t.id)];
        w.employeeId = { in: ids };
      }
    }
    return this.prisma.leaveRequest.findMany({ where:w, take:50, orderBy:{ createdAt:'desc'}});
  }
  async approve(id:string, approverId:string, status:string, user?: any){
    const req = await this.prisma.leaveRequest.findUnique({ where:{ id }, include:{ employee:true }});
    if (!req) throw new ForbiddenException('Request not found');
    // manager can only approve team
    if (user?.role === 'manager') {
      const own = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
      if (req.employee.managerId !== own?.id && req.employeeId !== own?.id) throw new ForbiddenException('Manager can only approve team');
    }
    if (user?.role === 'employee') throw new ForbiddenException('Employees cannot approve');
    return this.prisma.leaveRequest.update({ where:{ id }, data:{ status: status as any, approverId }});
  }
  async balances(orgId:string, employeeId:string, user?: any){
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
      if (emp?.id !== employeeId) throw new ForbiddenException('Can only view own balances');
    }
    return this.prisma.leaveRequest.findMany({ where:{ organizationId: orgId, employeeId }});
  }
}
