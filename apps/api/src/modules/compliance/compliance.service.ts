import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}
  async policies(orgId: string, q: any) {
    const where: any = { organizationId: orgId };
    if (q.category) where.category = q.category;
    if (q.status) where.status = q.status;
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    return this.prisma.compliancePolicy.findMany({ where, take: 50, include: { audits: true }, orderBy: { createdAt: 'desc' } });
  }
  async create(orgId: string, dto: any) {
    if (!dto.title) throw new ConflictException('title required');
    if (!dto.category) throw new ConflictException('category required');
    return this.prisma.compliancePolicy.create({ data: { organizationId: orgId, title: dto.title, category: dto.category, content: dto.content || '', version: dto.version || '1.0', status: dto.status || 'ACTIVE', effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(), reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : null } });
  }
  async get(orgId: string, id: string) {
    const p = await this.prisma.compliancePolicy.findFirst({ where: { id, organizationId: orgId }, include: { audits: true } });
    if (!p) throw new NotFoundException('Policy not found');
    return p;
  }
  async update(orgId: string, id: string, dto: any) {
    const p = await this.prisma.compliancePolicy.findFirst({ where: { id, organizationId: orgId } });
    if (!p) throw new NotFoundException('Policy not found');
    return this.prisma.compliancePolicy.update({ where: { id }, data: { title: dto.title, category: dto.category, content: dto.content, version: dto.version, status: dto.status, effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined, reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined } });
  }
  async remove(orgId: string, id: string) {
    const p = await this.prisma.compliancePolicy.findFirst({ where: { id, organizationId: orgId } });
    if (!p) throw new NotFoundException('Policy not found');
    await this.prisma.complianceAudit.deleteMany({ where: { policyId: id } });
    return this.prisma.compliancePolicy.delete({ where: { id } });
  }
  async audits(orgId: string, policyId: string) {
    const p = await this.prisma.compliancePolicy.findFirst({ where: { id: policyId, organizationId: orgId } });
    if (!p) throw new NotFoundException('Policy not found');
    return this.prisma.complianceAudit.findMany({ where: { policyId }, orderBy: { createdAt: 'desc' } });
  }
  async createAudit(orgId: string, policyId: string, dto: any) {
    const p = await this.prisma.compliancePolicy.findFirst({ where: { id: policyId, organizationId: orgId } });
    if (!p) throw new NotFoundException('Policy not found');
    if (!dto.auditor) throw new ConflictException('auditor required');
    return this.prisma.complianceAudit.create({ data: { policyId, auditor: dto.auditor, findings: dto.findings, status: dto.status || 'PENDING', completedAt: dto.completedAt ? new Date(dto.completedAt) : null } });
  }
  async updateAudit(orgId: string, id: string, dto: any) {
    const a = await this.prisma.complianceAudit.findUnique({ where: { id }, include: { policy: true } });
    if (!a || (a.policy as any).organizationId !== orgId) throw new NotFoundException('Audit not found');
    return this.prisma.complianceAudit.update({ where: { id }, data: { auditor: dto.auditor, findings: dto.findings, status: dto.status, completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined } });
  }
}
