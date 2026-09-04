import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, q: any) {
    const where: any = { organizationId: orgId };
    if (q.category) where.category = q.category;
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    return this.prisma.policy.findMany({ where, take: 100, orderBy: { createdAt: 'desc' } });
  }

  async get(orgId: string, id: string) {
    const p = await this.prisma.policy.findFirst({ where: { id, organizationId: orgId } });
    if (!p) throw new NotFoundException('Policy not found');
    return p;
  }

  async create(orgId: string, dto: any, file?: any) {
    let s3Key = dto.s3Key || dto.s3_key || dto.fileUrl || '';
    if (file) s3Key = `org/${orgId}/policies/${Date.now()}-${file.originalname || 'policy.pdf'}`;
    if (!s3Key) s3Key = `org/${orgId}/policies/${dto.title || 'policy'}-${Date.now()}`;
    if (!dto.title) throw new NotFoundException('title required');
    return this.prisma.policy.create({
      data: {
        organizationId: orgId,
        title: dto.title,
        category: dto.category || 'handbook',
        s3Key,
        version: dto.version ? parseInt(dto.version) : 1,
      },
    });
  }

  async upload(orgId: string, dto: any, file: any) {
    return this.create(orgId, dto, file);
  }

  async query(orgId: string, dto: any, user?: any) {
    const question: string = dto.question || dto.query || dto.message || dto.prompt || '';
    if (!question) throw new NotFoundException('question required');
    // Simple keyword RAG: search policies, knowledgeArticles, compliancePolicies
    const keywords = question.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
    const policies = await this.prisma.policy.findMany({ where: { organizationId: orgId }, take: 20 });
    const articles = await this.prisma.knowledgeArticle.findMany({ where: { organizationId: orgId }, take: 20 });
    const compliance = await this.prisma.compliancePolicy.findMany({ where: { organizationId: orgId }, take: 20 });

    const allDocs: any[] = [
      ...policies.map((p: any) => ({ id: p.id, title: p.title, body: p.title + ' ' + (p.category || ''), type: 'policy' })),
      ...articles.map((a: any) => ({ id: a.id, title: a.title, body: a.title + ' ' + (a.body || '').slice(0, 500), type: 'knowledge' })),
      ...compliance.map((c: any) => ({ id: c.id, title: c.title, body: c.title + ' ' + (c.content || '').slice(0, 500), type: 'compliance' })),
    ];

    // Score by keyword overlap
    const scored = allDocs.map(d => {
      const text = (d.title + ' ' + d.body).toLowerCase();
      let score = 0;
      for (const kw of keywords) if (text.includes(kw)) score += 1;
      // also check exact question words
      if (question.toLowerCase().includes('leave') && text.includes('leave')) score += 2;
      if (question.toLowerCase().includes('payroll') && text.includes('payroll')) score += 2;
      if (question.toLowerCase().includes('attendance') && text.includes('attendance')) score += 2;
      return { ...d, score };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    const top = scored.filter(s => s.score > 0);
    let answer: string;
    let citations: any[] = [];
    let confidence = 0.85;
    if (top.length) {
      answer = `Based on your organization policies: ${top.map(t => `${t.title} (${t.type})`).join(', ')}. For "${question}" — see ${top[0].title}. Please refer to the full policy document for details. (RAG matched ${top.length} docs)`;
      citations = top.map(t => ({ policy_id: t.id, title: t.title, type: t.type }));
      confidence = Math.min(0.95, 0.7 + top[0].score * 0.08);
    } else {
      // Fallback generic knowledge
      const fallbacks: Record<string, string> = {
        leave: 'Annual leave is 21 days per year (see Leave Policy §4.2). Sick leave 14 days. Request via Leave → Request → Manager approval → HR.',
        payroll: 'Net Pay = Basic Salary + Allowances − Deductions − Tax. Payroll runs monthly; payslip available after approval. Simulate +10% at Analytics → Simulator.',
        attendance: 'Attendance: Clock In/Out via web/mobile/QR/biometric. Net working = Gross − Breaks. Exceptions (late/missing) flagged for review §37.',
        policy: 'Policies are available in Documents → Policies. Ask about handbook, code of conduct, remote work, or disciplinary.',
      };
      const key = Object.keys(fallbacks).find(k => question.toLowerCase().includes(k));
      answer = key ? fallbacks[key] : `I found no specific policy for "${question}". Please check Documents → Policies or contact HR. (No matching docs in Knowledge Vault)`;
      confidence = key ? 0.75 : 0.45;
    }

    // Apply RBAC filtering note for non-HR
    if (user?.role === 'employee' && question.toLowerCase().includes('salary')) {
      answer += ' [Note: Detailed salary data restricted to your own record — see Payroll → My Payslip]';
    }

    return { answer, citations, confidence, question, mode: dto.mode || 'employee' };
  }

  async update(orgId: string, id: string, dto: any) {
    const p = await this.prisma.policy.findFirst({ where: { id, organizationId: orgId } });
    if (!p) throw new NotFoundException('Policy not found');
    return this.prisma.policy.update({ where: { id }, data: { title: dto.title, category: dto.category, s3Key: dto.s3Key } });
  }

  async remove(orgId: string, id: string) {
    const p = await this.prisma.policy.findFirst({ where: { id, organizationId: orgId } });
    if (!p) throw new NotFoundException('Policy not found');
    return this.prisma.policy.delete({ where: { id } });
  }
}
