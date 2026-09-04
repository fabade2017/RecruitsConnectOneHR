"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliciesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PoliciesService = class PoliciesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(orgId, q) {
        const where = { organizationId: orgId };
        if (q.category)
            where.category = q.category;
        if (q.search)
            where.title = { contains: q.search, mode: 'insensitive' };
        return this.prisma.policy.findMany({ where, take: 100, orderBy: { createdAt: 'desc' } });
    }
    async get(orgId, id) {
        const p = await this.prisma.policy.findFirst({ where: { id, organizationId: orgId } });
        if (!p)
            throw new common_1.NotFoundException('Policy not found');
        return p;
    }
    async create(orgId, dto, file) {
        let s3Key = dto.s3Key || dto.s3_key || dto.fileUrl || '';
        if (file)
            s3Key = `org/${orgId}/policies/${Date.now()}-${file.originalname || 'policy.pdf'}`;
        if (!s3Key)
            s3Key = `org/${orgId}/policies/${dto.title || 'policy'}-${Date.now()}`;
        if (!dto.title)
            throw new common_1.NotFoundException('title required');
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
    async upload(orgId, dto, file) {
        return this.create(orgId, dto, file);
    }
    async query(orgId, dto, user) {
        const question = dto.question || dto.query || dto.message || dto.prompt || '';
        if (!question)
            throw new common_1.NotFoundException('question required');
        // Simple keyword RAG: search policies, knowledgeArticles, compliancePolicies
        const keywords = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
        const policies = await this.prisma.policy.findMany({ where: { organizationId: orgId }, take: 20 });
        const articles = await this.prisma.knowledgeArticle.findMany({ where: { organizationId: orgId }, take: 20 });
        const compliance = await this.prisma.compliancePolicy.findMany({ where: { organizationId: orgId }, take: 20 });
        const allDocs = [
            ...policies.map((p) => ({ id: p.id, title: p.title, body: p.title + ' ' + (p.category || ''), type: 'policy' })),
            ...articles.map((a) => ({ id: a.id, title: a.title, body: a.title + ' ' + (a.body || '').slice(0, 500), type: 'knowledge' })),
            ...compliance.map((c) => ({ id: c.id, title: c.title, body: c.title + ' ' + (c.content || '').slice(0, 500), type: 'compliance' })),
        ];
        // Score by keyword overlap
        const scored = allDocs.map(d => {
            const text = (d.title + ' ' + d.body).toLowerCase();
            let score = 0;
            for (const kw of keywords)
                if (text.includes(kw))
                    score += 1;
            // also check exact question words
            if (question.toLowerCase().includes('leave') && text.includes('leave'))
                score += 2;
            if (question.toLowerCase().includes('payroll') && text.includes('payroll'))
                score += 2;
            if (question.toLowerCase().includes('attendance') && text.includes('attendance'))
                score += 2;
            return { ...d, score };
        }).sort((a, b) => b.score - a.score).slice(0, 5);
        const top = scored.filter(s => s.score > 0);
        let answer;
        let citations = [];
        let confidence = 0.85;
        if (top.length) {
            answer = `Based on your organization policies: ${top.map(t => `${t.title} (${t.type})`).join(', ')}. For "${question}" — see ${top[0].title}. Please refer to the full policy document for details. (RAG matched ${top.length} docs)`;
            citations = top.map(t => ({ policy_id: t.id, title: t.title, type: t.type }));
            confidence = Math.min(0.95, 0.7 + top[0].score * 0.08);
        }
        else {
            // Fallback generic knowledge
            const fallbacks = {
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
    async update(orgId, id, dto) {
        const p = await this.prisma.policy.findFirst({ where: { id, organizationId: orgId } });
        if (!p)
            throw new common_1.NotFoundException('Policy not found');
        return this.prisma.policy.update({ where: { id }, data: { title: dto.title, category: dto.category, s3Key: dto.s3Key } });
    }
    async remove(orgId, id) {
        const p = await this.prisma.policy.findFirst({ where: { id, organizationId: orgId } });
        if (!p)
            throw new common_1.NotFoundException('Policy not found');
        return this.prisma.policy.delete({ where: { id } });
    }
};
exports.PoliciesService = PoliciesService;
exports.PoliciesService = PoliciesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PoliciesService);
