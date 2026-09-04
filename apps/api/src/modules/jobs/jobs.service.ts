import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}
  async list(orgId: string, q: any) {
    const where: any = { organizationId: orgId };
    if (q.status) where.status = q.status;
    if (q.department) where.department = q.department;
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    return this.prisma.jobPosting.findMany({ where, take: 50, orderBy: { postedAt: 'desc' }, include: { applications: true } });
  }
  async create(orgId: string, dto: any) {
    if (!dto.title) throw new ConflictException('title required');
    return this.prisma.jobPosting.create({ data: { organizationId: orgId, title: dto.title, department: dto.department || 'HR', location: dto.location || 'Lagos', type: dto.type || 'FULL_TIME', description: dto.description || '', requirements: dto.requirements, salaryRange: dto.salaryRange || dto.salary_range, status: dto.status || 'OPEN', closesAt: dto.closesAt ? new Date(dto.closesAt) : dto.closes_at ? new Date(dto.closes_at) : null } });
  }
  async get(orgId: string, id: string) {
    const j = await this.prisma.jobPosting.findFirst({ where: { id, organizationId: orgId }, include: { applications: true } });
    if (!j) throw new NotFoundException('Job not found');
    return j;
  }
  async update(orgId: string, id: string, dto: any) {
    const j = await this.prisma.jobPosting.findFirst({ where: { id, organizationId: orgId } });
    if (!j) throw new NotFoundException('Job not found');
    return this.prisma.jobPosting.update({ where: { id }, data: { title: dto.title, department: dto.department, location: dto.location, type: dto.type, description: dto.description, requirements: dto.requirements, salaryRange: dto.salaryRange, status: dto.status, closesAt: dto.closesAt ? new Date(dto.closesAt) : undefined } });
  }
  async remove(orgId: string, id: string) {
    const j = await this.prisma.jobPosting.findFirst({ where: { id, organizationId: orgId } });
    if (!j) throw new NotFoundException('Job not found');
    await this.prisma.jobApplicationMerged.deleteMany({ where: { jobId: id } });
    return this.prisma.jobPosting.delete({ where: { id } });
  }

  async applications(orgId: string, jobId: string) {
    const j = await this.prisma.jobPosting.findFirst({ where: { id: jobId, organizationId: orgId } });
    if (!j) throw new NotFoundException('Job not found');
    return this.prisma.jobApplicationMerged.findMany({ where: { jobId }, orderBy: { createdAt: 'desc' } });
  }
  async apply(orgId: string, jobId: string, dto: any) {
    const j = await this.prisma.jobPosting.findFirst({ where: { id: jobId, organizationId: orgId } });
    if (!j) throw new NotFoundException('Job not found');
    if (!dto.firstName && !dto.first_name) throw new ConflictException('firstName required');
    if (!dto.email) throw new ConflictException('email required');
    return this.prisma.jobApplicationMerged.create({ data: { jobId, firstName: dto.firstName || dto.first_name, lastName: dto.lastName || dto.last_name || '', email: dto.email, phone: dto.phone, resumeUrl: dto.resumeUrl || dto.resume_url, coverLetter: dto.coverLetter || dto.cover_letter, status: dto.status || 'NEW' } });
  }
  async updateApplication(orgId: string, id: string, dto: any) {
    const a = await this.prisma.jobApplicationMerged.findUnique({ where: { id }, include: { job: true } });
    if (!a || (a.job as any).organizationId !== orgId) throw new NotFoundException('Application not found');
    return this.prisma.jobApplicationMerged.update({ where: { id }, data: { status: dto.status, coverLetter: dto.coverLetter } });
  }
}
