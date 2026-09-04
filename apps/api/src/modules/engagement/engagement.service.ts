import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EngagementService {
  constructor(private prisma: PrismaService) {}
  async surveys(orgId: string, q: any) {
    const where: any = { organizationId: orgId };
    if (q.status) where.status = q.status;
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    return this.prisma.engagementSurvey.findMany({ where, take: 50, orderBy: { createdAt: 'desc' }, include: { responses: true } });
  }
  async create(orgId: string, dto: any) {
    if (!dto.title) throw new ConflictException('title required');
    let questions = dto.questions;
    if (Array.isArray(questions)) questions = JSON.stringify(questions);
    else if (typeof questions === 'string') questions = questions;
    else questions = JSON.stringify([]);
    return this.prisma.engagementSurvey.create({ data: { organizationId: orgId, title: dto.title, description: dto.description, questions, status: dto.status || 'DRAFT', startDate: dto.startDate ? new Date(dto.startDate) : dto.start_date ? new Date(dto.start_date) : null, endDate: dto.endDate ? new Date(dto.endDate) : dto.end_date ? new Date(dto.end_date) : null } });
  }
  async get(orgId: string, id: string) {
    const s = await this.prisma.engagementSurvey.findFirst({ where: { id, organizationId: orgId }, include: { responses: true } });
    if (!s) throw new NotFoundException('Survey not found');
    return s;
  }
  async update(orgId: string, id: string, dto: any) {
    const s = await this.prisma.engagementSurvey.findFirst({ where: { id, organizationId: orgId } });
    if (!s) throw new NotFoundException('Survey not found');
    return this.prisma.engagementSurvey.update({ where: { id }, data: { title: dto.title, description: dto.description, questions: dto.questions ? (Array.isArray(dto.questions) ? JSON.stringify(dto.questions) : dto.questions) : undefined, status: dto.status } });
  }
  async remove(orgId: string, id: string) {
    const s = await this.prisma.engagementSurvey.findFirst({ where: { id, organizationId: orgId } });
    if (!s) throw new NotFoundException('Survey not found');
    await this.prisma.engagementResponse.deleteMany({ where: { surveyId: id } });
    return this.prisma.engagementSurvey.delete({ where: { id } });
  }
  async respond(orgId: string, surveyId: string, dto: any, user?: any) {
    const survey = await this.prisma.engagementSurvey.findFirst({ where: { id: surveyId, organizationId: orgId } });
    if (!survey) throw new NotFoundException('Survey not found');
    let employeeId = dto.employeeId || dto.employee_id;
    if (!employeeId && user) {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      employeeId = emp?.id;
    }
    if (!employeeId) throw new ConflictException('employeeId required');
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (emp?.id !== employeeId) throw new ForbiddenException('Can only respond as self');
    }
    const empCheck = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!empCheck) throw new NotFoundException('Employee not in org');
    let answers = dto.answers;
    if (Array.isArray(answers) || typeof answers === 'object') answers = JSON.stringify(answers);
    return this.prisma.engagementResponse.upsert({
      where: { surveyId_employeeId: { surveyId, employeeId } },
      create: { surveyId, employeeId, answers: answers || '[]', score: dto.score, feedback: dto.feedback },
      update: { answers: answers || '[]', score: dto.score, feedback: dto.feedback },
    });
  }
  async responses(orgId: string, surveyId: string) {
    const survey = await this.prisma.engagementSurvey.findFirst({ where: { id: surveyId, organizationId: orgId } });
    if (!survey) throw new NotFoundException('Survey not found');
    return this.prisma.engagementResponse.findMany({ where: { surveyId }, include: { employee: true } });
  }
}
