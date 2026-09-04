import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, q: any, user?: any) {
    const where: any = { organizationId: orgId };
    if (q.employee_id) where.employeeId = q.employee_id;
    if (q.employeeId) where.employeeId = q.employeeId;
    if (q.cycle) where.cycle = q.cycle;
    // employee sees own only, manager sees team
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (emp) where.employeeId = emp.id;
    } else if (user?.role === 'manager') {
      const ownId = await this.prisma.employee.findUnique({ where: { userId: user.sub } }).then(e => e?.id);
      if (q.employee_id || q.employeeId) {
        const target = await this.prisma.employee.findFirst({ where: { id: where.employeeId, organizationId: orgId } });
        if (target && target.managerId !== ownId && target.id !== ownId) throw new ForbiddenException('Manager can only view team');
      } else {
        const team = await this.prisma.employee.findMany({ where: { managerId: ownId, organizationId: orgId }, select: { id: true } });
        const ids = [ownId, ...team.map(t => t.id)].filter(Boolean) as string[];
        where.employeeId = { in: ids };
      }
    }
    return this.prisma.performanceReview.findMany({ where, take: 100, orderBy: { createdAt: 'desc' }, include: { employee: true } });
  }

  async create(orgId: string, dto: any, user?: any) {
    const employeeId = dto.employeeId || dto.employee_id;
    if (!employeeId) throw new NotFoundException('employeeId required');
    if (!dto.kpi) throw new NotFoundException('kpi required');
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    // normalize kpi: if string keep as string, if array stringify
    let kpiStr: string;
    if (typeof dto.kpi === 'string') kpiStr = JSON.stringify([{ metric: dto.kpi, rating: dto.rating || 3 }]);
    else if (Array.isArray(dto.kpi)) kpiStr = JSON.stringify(dto.kpi);
    else kpiStr = JSON.stringify([dto.kpi]);
    // also store rating in kpi if provided
    let overallIndicator: string | null = null;
    if (dto.rating) {
      const r = Number(dto.rating);
      if (r >= 5) overallIndicator = 'outstanding';
      else if (r >= 4) overallIndicator = 'exceeds';
      else if (r >= 3) overallIndicator = 'meets';
      else overallIndicator = 'needs_improvement';
    }
    return this.prisma.performanceReview.create({
      data: {
        organizationId: orgId,
        employeeId,
        cycle: dto.cycle || '2026-H1',
        kpi: kpiStr,
        managerAssessment: dto.managerAssessment || dto.manager_assessment || null,
        overallIndicator,
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : new Date(),
      },
    });
  }

  async update(orgId: string, id: string, dto: any) {
    const existing = await this.prisma.performanceReview.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Review not found');
    const data: any = {};
    if (dto.kpi !== undefined) data.kpi = typeof dto.kpi === 'string' ? JSON.stringify([{ metric: dto.kpi }]) : JSON.stringify(dto.kpi);
    if (dto.managerAssessment !== undefined) data.managerAssessment = dto.managerAssessment;
    if (dto.manager_assessment !== undefined) data.managerAssessment = dto.manager_assessment;
    if (dto.overallIndicator !== undefined) data.overallIndicator = dto.overallIndicator;
    if (dto.overall_indicator !== undefined) data.overallIndicator = dto.overall_indicator;
    if (dto.rating !== undefined) {
      const r = Number(dto.rating);
      if (r >= 5) data.overallIndicator = 'outstanding';
      else if (r >= 4) data.overallIndicator = 'exceeds';
      else if (r >= 3) data.overallIndicator = 'meets';
      else data.overallIndicator = 'needs_improvement';
      // also update kpi to include rating
      try {
        const kpi = JSON.parse(existing.kpi as any);
        if (Array.isArray(kpi) && kpi[0]) kpi[0].rating = r;
        data.kpi = JSON.stringify(kpi);
      } catch {}
    }
    return this.prisma.performanceReview.update({ where: { id }, data });
  }

  async health(orgId: string, q: any) {
    const where: any = { organizationId: orgId };
    if (q.department_id) {
      const emps = await this.prisma.employee.findMany({ where: { organizationId: orgId, departmentId: q.department_id }, select: { id: true } });
      where.employeeId = { in: emps.map(e => e.id) };
    }
    const reviews = await this.prisma.performanceReview.findMany({ where, take: 1000 });
    if (!reviews.length) return { performance_health: 0, total: 0, averageIndicator: null };
    // compute health by rating distribution
    let sum = 0; let count = 0;
    for (const r of reviews) {
      try {
        const kpi = JSON.parse(r.kpi as any);
        const rating = Array.isArray(kpi) ? (kpi[0]?.rating || 0) : 0;
        if (rating) { sum += (rating / 5) * 100; count++; }
      } catch {}
      // fallback overallIndicator
      if (r.overallIndicator) {
        const map: any = { outstanding: 95, exceeds: 85, meets: 70, needs_improvement: 50 };
        if (!count || map[r.overallIndicator]) { sum += map[r.overallIndicator] || 60; count++; }
      }
    }
    const avg = count ? Math.round(sum / count) : 75;
    return { performance_health: avg, total: reviews.length, averageIndicator: avg >= 85 ? 'exceeds' : avg >= 70 ? 'meets' : 'needs_improvement' };
  }

  async remove(orgId: string, id: string) {
    const existing = await this.prisma.performanceReview.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Review not found');
    return this.prisma.performanceReview.delete({ where: { id } });
  }
}
