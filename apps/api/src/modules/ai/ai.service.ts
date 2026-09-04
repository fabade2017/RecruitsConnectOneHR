import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type Provider = 'mock' | 'ollama' | 'groq' | 'opencode' | 'openai';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  private getProvider(): Provider {
    const p = (process.env.AI_PROVIDER || '').toLowerCase();
    if (p === 'groq' && process.env.GROQ_API_KEY) return 'groq';
    if (p === 'ollama') return 'ollama';
    if (p === 'opencode') return 'opencode';
    if (p === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
    // Auto-detect: prefer groq if key, else ollama if url set, else mock
    if (process.env.GROQ_API_KEY) return 'groq';
    if (process.env.OLLAMA_URL) return 'ollama';
    if (process.env.OPENCODE_API_URL) return 'opencode';
    return 'mock';
  }

  private async callGroq(prompt: string, system: string): Promise<string | null> {
    const key = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
    if (!key) return null;
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.warn('[AI Groq] error', res.status, t.slice(0, 300));
        return null;
      }
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (e: any) {
      console.warn('[AI Groq] exception', e.message);
      return null;
    }
  }

  private async callOllama(prompt: string, system: string): Promise<string | null> {
    const url = process.env.OLLAMA_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.1';
    try {
      // Try chat endpoint first (more capable)
      const res = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          stream: false,
          options: { temperature: 0.3 },
        }),
      });
      if (!res.ok) {
        // Fallback to /api/generate
        const gRes = await fetch(`${url}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt: `${system}\n\nUser: ${prompt}\nAssistant:`, stream: false }),
        });
        if (!gRes.ok) {
          console.warn('[AI Ollama] generate error', gRes.status);
          return null;
        }
        const gData: any = await gRes.json();
        return gData.response || null;
      }
      const data: any = await res.json();
      return data.message?.content || null;
    } catch (e: any) {
      console.warn('[AI Ollama] exception', e.message);
      return null;
    }
  }

  private async callOpenAI(prompt: string, system: string): Promise<string | null> {
    const key = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    if (!key) return null;
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch { return null; }
  }

  private async callOpencode(prompt: string, system: string): Promise<string | null> {
    // Opencode = local Muse Spark / opencode server if running
    // Try OPENCODE_API_URL or default http://localhost:4096 or http://localhost:3000/api (opencode)
    const url = process.env.OPENCODE_API_URL || 'http://localhost:4096';
    try {
      const res = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENCODE_MODEL || 'muse-spark-1.2',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || data.content || data.message || null;
    } catch {
      return null;
    }
  }

  private async ragAnswer(orgId: string, question: string, mode: string, user?: any) {
    const qLower = question.toLowerCase();
    const keywords = qLower.split(/\s+/).filter(w => w.length > 3).slice(0, 6);

    // Fetch up to 20 docs each
    const policies = await this.prisma.policy.findMany({ where: { organizationId: orgId }, take: 20 });
    const articles = await this.prisma.knowledgeArticle.findMany({ where: { organizationId: orgId }, take: 20 });
    const leaves = await this.prisma.leaveType.findMany({ where: { organizationId: orgId }, take: 10 });
    const compliances = await this.prisma.compliancePolicy.findMany({ where: { organizationId: orgId }, take: 10 });

    const docs: any[] = [
      ...policies.map(p => ({ id: p.id, title: p.title, text: p.title + ' ' + p.category, type: 'policy' })),
      ...articles.map(a => ({ id: a.id, title: a.title, text: a.title + ' ' + (a.body || '').slice(0, 800), type: 'knowledge' })),
      ...leaves.map(l => ({ id: l.id, title: l.name, text: l.name + ' leave type', type: 'leave' })),
      ...compliances.map(c => ({ id: c.id, title: c.title, text: c.title + ' ' + c.category, type: 'compliance' })),
    ];

    const scored = docs.map(d => {
      const t = d.text.toLowerCase();
      let score = 0;
      for (const kw of keywords) if (t.includes(kw)) score += 1;
      if (qLower.includes('leave') && t.includes('leave')) score += 3;
      if (qLower.includes('payroll') && t.includes('payroll')) score += 3;
      if (qLower.includes('attendance') && t.includes('attendance')) score += 3;
      if (qLower.includes('policy') && d.type === 'policy') score += 2;
      return { ...d, score };
    }).sort((a,b) => b.score - a.score).slice(0,5);

    const top = scored.filter(s => s.score > 0);
    let citations: any[] = top.map(t => ({ policy_id: t.id, title: t.title, type: t.type }));
    let confidence = top.length ? Math.min(0.95, 0.68 + top[0].score * 0.07) : 0.45;

    const modePrefix: Record<string,string> = {
      hr: '[HR Mode] ',
      manager: '[Manager Mode — team-scoped] ',
      executive: '[Executive Mode — org health] ',
      recruiter: '[Recruiter Mode] ',
      employee: '[Employee Mode — self data only] ',
    };
    const prefix = modePrefix[mode] || '';

    // Build RAG context for LLM
    const context = top.length ? top.map(t => `- ${t.title} (${t.type}): ${t.text.slice(0, 300)}`).join('\n') : 'No specific policy found.';
    const systemPrompt = `You are OneHR AI Copilot (${mode} mode). Answer ONLY from the provided organization context. If no context, say you couldn't find a policy and suggest checking Documents/Policies. Cite sources with [policy_id]. Current org: ${orgId}. Mode: ${mode}. Be concise, helpful, and respect RBAC (employee sees self only, manager sees team).`;
    const prompt = `Context:\n${context}\n\nUser question: "${question}"\n\nInstructions: Answer from context only, cite titles, add note if data is restricted for mode.`;

    let answer: string | null = null;
    let provider = this.getProvider();
    let llmUsed: string | null = null;

    // Try LLM providers in order: chosen provider first, then fallback chain
    const tryOrder: Provider[] = [provider, 'groq', 'ollama', 'opencode', 'openai', 'mock'].filter((v,i,a)=>a.indexOf(v)===i) as Provider[];
    for (const p of tryOrder) {
      if (p === 'mock') break;
      let res: string | null = null;
      if (p === 'groq') res = await this.callGroq(prompt, systemPrompt);
      else if (p === 'ollama') res = await this.callOllama(prompt, systemPrompt);
      else if (p === 'openai') res = await this.callOpenAI(prompt, systemPrompt);
      else if (p === 'opencode') res = await this.callOpencode(prompt, systemPrompt);
      if (res) { answer = (p !== provider ? `[fallback ${p}] ` : '') + res; llmUsed = p; break; }
    }

    if (!answer) {
      // Mock fallback (previous logic)
      if (top.length) {
        answer = `${prefix}Based on ${top.map(t=>t.title).join(', ')}: For "${question}" — see ${top[0].title} (${top[0].type}). This answer is generated from your org's Knowledge Vault & policies with citations.`;
      } else {
        if (qLower.includes('leave')) {
          let balanceInfo = '';
          if (user) {
            try {
              const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
              if (emp) {
                const reqs = await this.prisma.leaveRequest.findMany({ where: { employeeId: emp.id, organizationId: orgId }, take: 5 });
                balanceInfo = ` You have ${reqs.length} leave requests on file.`;
              }
            } catch {}
          }
          answer = `${prefix}Annual leave is typically 21 days (Sick 14). Request via Leave → New Request → Manager approval → HR → Calendar. Check Leave → My Balances for exact remaining.${balanceInfo}`;
          confidence = 0.78;
        } else if (qLower.includes('payroll') || qLower.includes('salary')) {
          answer = `${prefix}Payroll: Net Pay = Basic Salary + Allowances − Deductions − Tax. Cycle monthly, payslips after Payroll → Approve. Simulate scenarios at Analytics → Simulator (+10% → payroll impact).`;
          confidence = 0.75;
        } else if (qLower.includes('attendance') || qLower.includes('clock')) {
          answer = `${prefix}Attendance: Clock In/Out via /attendance (web/mobile/QR/biometric). Net working = Gross − Breaks. Exceptions (late/missing) flagged for HR review §37. Your status: see Employee → Today's Schedule.`;
          confidence = 0.75;
        } else if (qLower.includes('performance') || qLower.includes('kpi') || qLower.includes('review')) {
          answer = `${prefix}Performance: Reviews are quarterly (2026-H1). KPI → Manager assessment → Rating 1-5 → Calibration. Top 10% → promotion eligibility. Create at Performance → Create Review.`;
          confidence = 0.72;
        } else {
          answer = `${prefix}I couldn't find a specific policy for "${question}" in the Knowledge Vault. Please check Documents/Policies or contact HR. Try asking about leave, payroll, attendance, or performance.`;
          confidence = 0.42;
          citations = [];
        }
      }
      llmUsed = 'mock';
      provider = 'mock';
    } else {
      // LLM succeeded, prefix mode and add citations note
      if (!answer.startsWith(prefix.trim())) answer = prefix + answer;
      if (top.length && !answer.includes(citations[0]?.title || '')) {
        answer += ` [Sources: ${top.map(t=>t.title).join(', ')}]`;
      }
    }

    if (mode === 'employee' && (qLower.includes('salary') || qLower.includes('payroll'))) {
      answer += ' [Note: Detailed org payroll data restricted — see Payroll → My Payslip for your record only]';
    }
    if (mode === 'manager' && qLower.includes('team')) {
      answer += ' [Note: Team data scoped to your direct reports — see Manager → My Team]';
    }

    return { answer, response: answer, message: answer, content: answer, citations, confidence, mode, question, provider: llmUsed || provider, ragContext: top.length };
  }

  async chat(orgId: string, dto: any, user?: any) {
    const question = dto.message || dto.prompt || dto.query || dto.question || dto.q || '';
    const mode = dto.mode || 'employee';
    if (!question) return { answer: 'Please provide a question', confidence: 0, provider: this.getProvider() };
    const res = await this.ragAnswer(orgId, question, mode, user);
    return res;
  }

  async copilot(orgId: string, dto: any, user?: any) {
    return this.chat(orgId, dto, user);
  }

  async copilotQuery(orgId: string, dto: any, user?: any) {
    return this.chat(orgId, { ...dto, message: dto.query || dto.message }, user);
  }

  async history(orgId: string, q: any, user?: any) {
    return { history: [], note: 'Chat history persistence not yet enabled — enable via Workflow audit_logs', provider: this.getProvider() };
  }

  providerInfo() {
    const provider = this.getProvider();
    return {
      provider,
      available: {
        groq: !!process.env.GROQ_API_KEY,
        ollama: !!process.env.OLLAMA_URL || provider === 'ollama',
        openai: !!process.env.OPENAI_API_KEY,
        opencode: !!process.env.OPENCODE_API_URL || provider === 'opencode',
      },
      models: {
        groq: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
        ollama: process.env.OLLAMA_MODEL || 'llama3.1',
        openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        opencode: process.env.OPENCODE_MODEL || 'muse-spark-1.2',
      },
      env: {
        AI_PROVIDER: process.env.AI_PROVIDER || '(auto)',
        OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
        GROQ_API_KEY: process.env.GROQ_API_KEY ? '***' : '(not set)',
        OPENCODE_API_URL: process.env.OPENCODE_API_URL || 'http://localhost:4096',
      },
    };
  }
}
