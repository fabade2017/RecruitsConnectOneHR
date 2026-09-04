import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TalentService {
  constructor(private prisma: PrismaService) {}

  async listVacancies(orgId: string, q: any, user?: any) {
    const where: any = { organizationId: orgId };
    if (q.status) where.status = q.status;
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    const vacancies = await this.prisma.internalVacancy.findMany({ where, take: 100, orderBy: { createdAt: 'desc' }, include: { applications: true } });
    // if eligible_for filter, check eligibility
    if (q.eligible_for || q.eligibleFor) {
      const empId = q.eligible_for || q.eligibleFor;
      const emp = await this.prisma.employee.findFirst({ where: { id: empId, organizationId: orgId } });
      if (emp) {
        // simple eligibility: grade check if present in eligibilityRules JSON
        return vacancies.filter(v => {
          try {
            const rules = JSON.parse(v.eligibilityRules as any || '{}');
            if (rules.min_grade && emp.grade && emp.grade < rules.min_grade) return false;
            return true;
          } catch { return true; }
        });
      }
    }
    return vacancies;
  }

  async createVacancy(orgId: string, dto: any) {
    if (!dto.title) throw new NotFoundException('title required');
    return this.prisma.internalVacancy.create({
      data: {
        organizationId: orgId,
        title: dto.title,
        departmentId: dto.department_id || dto.departmentId || null,
        description: dto.description || null,
        eligibilityRules: JSON.stringify(dto.eligibility_rules || dto.eligibilityRules || {}),
        status: dto.status || 'open',
      },
    });
  }

  async getVacancy(orgId: string, id: string) {
    const v = await this.prisma.internalVacancy.findFirst({ where: { id, organizationId: orgId }, include: { applications: true } });
    if (!v) throw new NotFoundException('Vacancy not found');
    return v;
  }

  async apply(orgId: string, vacancyId: string, dto: any, user?: any) {
    const v = await this.prisma.internalVacancy.findFirst({ where: { id: vacancyId, organizationId: orgId } });
    if (!v) throw new NotFoundException('Vacancy not found');
    // resolve employeeId: from dto or from user
    let employeeId = dto.employeeId || dto.employee_id;
    if (!employeeId && user) {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      employeeId = emp?.id;
    }
    if (!employeeId) throw new NotFoundException('employeeId required');
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    // eligibility auto-check
    let eligibilityCheck: any = { eligible: true, reasons: [] };
    try {
      const rules = JSON.parse(v.eligibilityRules as any || '{}');
      if (rules.min_grade && emp.grade && emp.grade < rules.min_grade) { eligibilityCheck.eligible = false; eligibilityCheck.reasons.push('grade below minimum'); }
      if (rules.skills && Array.isArray(rules.skills)) {
        const empSkills = emp.skills ? JSON.parse(emp.skills as any) : [];
        const missing = rules.skills.filter((s: string) => !empSkills.includes(s));
        if (missing.length) { eligibilityCheck.eligible = false; eligibilityCheck.reasons.push('missing skills: ' + missing.join(',')); }
      }
    } catch {}
    return this.prisma.vacancyApplication.create({
      data: {
        vacancyId,
        employeeId,
        status: 'pending',
        eligibilityCheck: JSON.stringify(eligibilityCheck),
      },
    });
  }

  async listApplications(orgId: string, vacancyId: string) {
    const v = await this.prisma.internalVacancy.findFirst({ where: { id: vacancyId, organizationId: orgId } });
    if (!v) throw new NotFoundException('Vacancy not found');
    return this.prisma.vacancyApplication.findMany({ where: { vacancyId }, take: 100, orderBy: { createdAt: 'desc' } });
  }

  // Talent Marketplace opportunities (TalentOpportunity)
  async listOpportunities(orgId: string, q: any) {
    const where: any = { organizationId: orgId };
    if (q.type) where.type = q.type;
    if (q.status) where.status = q.status;
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    return this.prisma.talentOpportunity.findMany({ where, take: 100, orderBy: { createdAt: 'desc' } });
  }

  async createOpportunity(orgId: string, dto: any) {
    if (!dto.title) throw new NotFoundException('title required');
    return this.prisma.talentOpportunity.create({
      data: {
        organizationId: orgId,
        title: dto.title,
        type: dto.type || 'project',
        description: dto.description,
        skillsRequired: JSON.stringify(dto.skills_required || dto.skillsRequired || []),
        status: dto.status || 'open',
      },
    });
  }

  async marketplace(orgId: string, q: any) {
    // Unified marketplace feed: vacancies + opportunities
    const vacancies = await this.prisma.internalVacancy.findMany({ where: { organizationId: orgId, status: 'open' }, take: 20, orderBy: { createdAt: 'desc' } });
    const opps = await this.prisma.talentOpportunity.findMany({ where: { organizationId: orgId, status: 'open' }, take: 20, orderBy: { createdAt: 'desc' } });
    return {
      vacancies: vacancies.map(v => ({ ...v, kind: 'vacancy' })),
      opportunities: opps.map(o => ({ ...o, kind: 'opportunity' })),
      feed: [...vacancies.map(v => ({ id: v.id, title: v.title, type: 'vacancy', status: v.status, createdAt: v.createdAt })), ...opps.map(o => ({ id: o.id, title: o.title, type: o.type, status: o.status, createdAt: o.createdAt }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  }
}
