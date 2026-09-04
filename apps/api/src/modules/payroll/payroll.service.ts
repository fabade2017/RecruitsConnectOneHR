import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, query: any, user?: any) {
    const where: any = { organizationId: orgId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;
    if (query.month) where.month = parseInt(query.month);
    if (query.year) where.year = parseInt(query.year);
    // RBAC scoping
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (emp) where.employeeId = emp.id;
    } else if (user?.role === 'manager') {
      const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (own && !query.employeeId) {
        const team = await this.prisma.employee.findMany({ where: { organizationId: orgId, managerId: own.id }, select: { id: true } });
        const ids = [own.id, ...team.map(t => t.id)];
        where.employeeId = { in: ids };
      }
    }
    return this.prisma.payrollMerged.findMany({ where, take: 50, orderBy: { createdAt: 'desc' }, include: { employee: true } });
  }

  create(orgId: string, dto: any) {
    const allowances = dto.allowances || 0;
    const deductions = dto.deductions || 0;
    const tax = dto.tax || 0;
    const netPay = dto.basicSalary + allowances - deductions - tax;
    return this.prisma.payrollMerged.create({
      data: { organizationId: orgId, employeeId: dto.employeeId, month: dto.month, year: dto.year, basicSalary: dto.basicSalary, allowances, deductions, tax, netPay, status: dto.status || 'DRAFT' },
    });
  }

  update(id: string, dto: any) { return this.prisma.payrollMerged.update({ where: { id }, data: dto }); }

  async payslip(id: string, user?: any) {
    const p = await this.prisma.payrollMerged.findUnique({ where: { id }, include: { employee: true } });
    if (!p) throw new ForbiddenException('Not found');
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (emp?.id !== p.employeeId) throw new ForbiddenException('Can only view own payslip');
    }
    return p;
  }

  async bankDetails(orgId: string, employeeId?: string, user?: any) {
    const where: any = { organizationId: orgId };
    if (employeeId) where.employeeId = employeeId;
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (emp) where.employeeId = emp.id;
    }
    return this.prisma.bankDetail.findMany({ where, include: { employee: true } });
  }

  async upsertBankDetail(orgId: string, dto: any, user?: any) {
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (emp?.id !== dto.employeeId) throw new ForbiddenException('Can only update own bank details');
    }
    return this.prisma.bankDetail.upsert({
      where: { employeeId: dto.employeeId },
      create: { organizationId: orgId, employeeId: dto.employeeId, bankName: dto.bankName, accountNumber: dto.accountNumber, accountName: dto.accountName },
      update: { bankName: dto.bankName, accountNumber: dto.accountNumber, accountName: dto.accountName },
    });
  }
}
