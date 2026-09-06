import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable() export class LeaveService {
  constructor(private prisma: PrismaService) {}
  types(orgId:string){ return this.prisma.leaveType.findMany({ where:{ organizationId: orgId }}); }
  createType(orgId:string, dto:any){ return this.prisma.leaveType.create({ data:{ organizationId: orgId, name: dto.name, maxDays: dto.max_days ?? dto.maxDays }}); }
  async request(orgId:string, userId:string, dto:any){
    const emp = await this.prisma.employee.findUnique({ where:{ userId }});
    if (!emp) throw new ForbiddenException('Employee not found');
    const days = (new Date(dto.end_date).getTime() - new Date(dto.start_date).getTime())/86400000+1;
    return this.prisma.leaveRequest.create({ data:{ organizationId: orgId, employeeId: emp!.id, leaveTypeId: dto.leave_type_id || dto.leaveTypeId, startDate: new Date(dto.start_date), endDate: new Date(dto.end_date), days, reason: dto.reason }});
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
    return this.prisma.leaveRequest.findMany({ where:w, take:50, orderBy:{ createdAt:'desc'}, include:{ leaveType:true, employee:{ select:{ id:true, employeeCode:true, jobTitle:true, userId:true } } }});
  }
  async getOne(orgId:string, id:string, user?: any){
    const req = await this.prisma.leaveRequest.findFirst({ where:{ id, organizationId: orgId }, include:{ leaveType:true, employee:true }});
    if (!req) throw new NotFoundException('Request not found');
    // employees can only view own
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
      if (emp?.id !== req.employeeId) throw new ForbiddenException('Can only view own requests');
    } else if (user?.role === 'manager') {
      const own = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
      if (req.employeeId !== own?.id && req.employee.managerId !== own?.id) throw new ForbiddenException('Manager can only view team requests');
    }
    return req;
  }
  async update(orgId:string, id:string, user:any, dto:any){
    const req = await this.prisma.leaveRequest.findFirst({ where:{ id, organizationId: orgId }, include:{ employee:true }});
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending') throw new ForbiddenException('Only pending requests can be edited');
    // permission check: owner or privileged
    const isOwner = await this.isOwner(user, req);
    const isPrivileged = ['hr_admin','org_admin','super_admin'].includes(user?.role);
    const isManagerOfOwner = user?.role === 'manager' ? await this.isManagerOf(user, req) : false;
    if (!isOwner && !isPrivileged && !isManagerOfOwner) throw new ForbiddenException('Not allowed to edit this request');
    const data:any={};
    if (dto.leave_type_id || dto.leaveTypeId) data.leaveTypeId = dto.leave_type_id || dto.leaveTypeId;
    if (dto.start_date) data.startDate = new Date(dto.start_date);
    if (dto.end_date) data.endDate = new Date(dto.end_date);
    if (dto.start_date || dto.end_date) {
      const start = dto.start_date ? new Date(dto.start_date) : req.startDate;
      const end = dto.end_date ? new Date(dto.end_date) : req.endDate;
      data.days = (end.getTime() - start.getTime())/86400000+1;
    }
    if (dto.reason !== undefined) data.reason = dto.reason;
    return this.prisma.leaveRequest.update({ where:{ id }, data, include:{ leaveType:true }});
  }
  async cancel(orgId:string, id:string, user:any){
    const req = await this.prisma.leaveRequest.findFirst({ where:{ id, organizationId: orgId }, include:{ employee:true }});
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending' && req.status !== 'approved') throw new ForbiddenException('Only pending or approved requests can be cancelled');
    const isOwner = await this.isOwner(user, req);
    const isPrivileged = ['hr_admin','org_admin','super_admin'].includes(user?.role);
    const isManagerOfOwner = user?.role === 'manager' ? await this.isManagerOf(user, req) : false;
    if (!isOwner && !isPrivileged && !isManagerOfOwner) throw new ForbiddenException('Not allowed to cancel this request');
    // if pending -> cancelled, if approved -> cancelled (hr may need to approve cancellation but for now allow)
    return this.prisma.leaveRequest.update({ where:{ id }, data:{ status:'cancelled' }});
  }
  async remove(orgId:string, id:string, user:any){
    const req = await this.prisma.leaveRequest.findFirst({ where:{ id, organizationId: orgId }, include:{ employee:true }});
    if (!req) throw new NotFoundException('Request not found');
    // Only pending can be hard-deleted; otherwise use cancel
    if (req.status !== 'pending') throw new ForbiddenException('Only pending requests can be deleted. Use cancel for approved/rejected.');
    const isOwner = await this.isOwner(user, req);
    const isPrivileged = ['hr_admin','org_admin','super_admin'].includes(user?.role);
    const isManagerOfOwner = user?.role === 'manager' ? await this.isManagerOf(user, req) : false;
    if (!isOwner && !isPrivileged && !isManagerOfOwner) throw new ForbiddenException('Not allowed to delete this request');
    await this.prisma.leaveRequest.delete({ where:{ id }});
    return { success:true, id };
  }
  private async isOwner(user:any, req:any){
    if (!user?.sub) return false;
    const emp = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
    return emp?.id === req.employeeId;
  }
  private async isManagerOf(user:any, req:any){
    const own = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
    if (!own) return false;
    return req.employee.managerId === own.id;
  }
  async approve(id:string, approverId:string, status:string, user?: any){
    const req = await this.prisma.leaveRequest.findUnique({ where:{ id }, include:{ employee:true }});
    if (!req) throw new NotFoundException('Request not found');
    // manager can only approve team
    if (user?.role === 'manager') {
      const own = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
      if (req.employee.managerId !== own?.id && req.employeeId !== own?.id) throw new ForbiddenException('Manager can only approve team');
    }
    if (user?.role === 'employee') throw new ForbiddenException('Employees cannot approve');
    if (req.status !== 'pending') throw new ForbiddenException('Only pending requests can be approved/rejected');
    return this.prisma.leaveRequest.update({ where:{ id }, data:{ status: status as any, approverId }});
  }
  async balances(orgId:string, employeeId:string, user?: any){
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where:{ userId: user.sub }});
      if (emp?.id !== employeeId) throw new ForbiddenException('Can only view own balances');
    }
    return this.prisma.leaveRequest.findMany({ where:{ organizationId: orgId, employeeId }, include:{ leaveType:true }});
  }
}
