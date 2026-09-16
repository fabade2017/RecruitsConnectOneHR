import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string) {
    return this.prisma.workflow.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { instances: true } } },
    });
  }

  async get(orgId: string, id: string) {
    const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId }, include: { instances: { take: 10, orderBy: { createdAt: 'desc' }, include: { approvals: true } } } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return wf;
  }

  async create(orgId: string, dto: any, user: any) {
    if (!dto.name) throw new ConflictException('Name required');
    const exists = await this.prisma.workflow.findFirst({ where: { organizationId: orgId, name: dto.name } });
    if (exists) throw new ConflictException('Workflow name already exists');
    return this.prisma.workflow.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        trigger: dto.trigger || 'manual',
        condition: JSON.stringify(dto.condition || {}),
        steps: JSON.stringify(dto.steps || []),
        escalation: JSON.stringify(dto.escalation || {}),
        isActive: dto.isActive !== false,
      },
    });
  }

  async update(orgId: string, id: string, dto: any) {
    const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.trigger !== undefined) data.trigger = dto.trigger;
    if (dto.condition !== undefined) data.condition = JSON.stringify(dto.condition);
    if (dto.steps !== undefined) data.steps = JSON.stringify(dto.steps);
    if (dto.escalation !== undefined) data.escalation = JSON.stringify(dto.escalation);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.status !== undefined) data.isActive = dto.status === 'active';
    return this.prisma.workflow.update({ where: { id }, data });
  }

  async remove(orgId: string, id: string) {
    const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    // Delete instances first (cascade not set)
    await this.prisma.workflowInstance.deleteMany({ where: { workflowId: id } });
    return this.prisma.workflow.delete({ where: { id } });
  }

  async toggle(orgId: string, id: string) {
    const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return this.prisma.workflow.update({ where: { id }, data: { isActive: !wf.isActive } });
  }

  // Instances
  async listInstances(orgId: string, query: any) {
    const where: any = { organizationId: orgId };
    if (query.workflowId) where.workflowId = query.workflowId;
    if (query.status) where.status = query.status;
    if (query.entityType) where.entityType = query.entityType;
    return this.prisma.workflowInstance.findMany({ where, take: 50, orderBy: { createdAt: 'desc' }, include: { workflow: true, approvals: true } });
  }

  async createInstance(orgId: string, workflowId: string, entityType: string, entityId: string) {
    const wf = await this.prisma.workflow.findFirst({ where: { id: workflowId, organizationId: orgId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    const steps: any[] = (()=>{ try{ return typeof wf.steps === 'string' ? JSON.parse(wf.steps as any) : wf.steps as any } catch{return []}})();
    const instance = await this.prisma.workflowInstance.create({
      data: {
        organizationId: orgId,
        workflowId,
        entityType,
        entityId,
        currentStep: 0,
        status: 'pending',
        deadline: new Date(Date.now() + 24*3600*1000),
      },
    });
    // Create first approval if steps has approval
    if (steps[0]?.type === 'approval') {
      await this.prisma.approval.create({
        data: { instanceId: instance.id, approverId: steps[0].assignee || 'manager', status: 'pending' },
      });
    }
    return instance;
  }

  async approveInstance(orgId: string, instanceId: string, dto: any, user: any) {
    const inst = await this.prisma.workflowInstance.findFirst({ where: { id: instanceId, organizationId: orgId }, include: { workflow: true } });
    if (!inst) throw new NotFoundException('Instance not found');
    const steps: any[] = (()=>{ try{ return typeof inst.workflow.steps === 'string' ? JSON.parse(inst.workflow.steps as any) : inst.workflow.steps as any } catch{return []}})();
    const nextIdx = (inst.currentStep || 0) + 1;
    let status = 'pending';
    let currentStep = nextIdx;
    if (nextIdx >= steps.length) { status = 'approved'; currentStep = steps.length; }
    // Update approval
    await this.prisma.approval.updateMany({ where: { instanceId, status: 'pending' }, data: { status: dto.status || 'approved', comment: dto.comment, decidedAt: new Date() } });
    // If approved and more steps, create next approval
    if (status === 'pending' && steps[nextIdx]?.type === 'approval') {
      await this.prisma.approval.create({ data: { instanceId, approverId: steps[nextIdx].assignee || 'hr_admin', status: 'pending' } });
    }
    return this.prisma.workflowInstance.update({ where: { id: instanceId }, data: { status, currentStep, escalatedAt: dto.escalate ? new Date() : undefined } });
  }

  // Point 5: versioned engines — seed catalog matching live v2.7..v3.3
  static ENGINE_CATALOG: Record<string, { version: string; label: string; defaultSteps: any[] }> = {
    'leave_request': { version: 'v2.8', label: 'Leave Workflow', defaultSteps: [{ type: 'approval', assignee: 'manager' }, { type: 'notification', channel: 'email' }] },
    'performance_review': { version: 'v2.9', label: 'Performance Workflow', defaultSteps: [{ type: 'approval', assignee: 'manager' }, { type: 'approval', assignee: 'hr_admin' }] },
    'recruitment': { version: 'v3.0', label: 'Recruitment Workflow', defaultSteps: [{ type: 'approval', assignee: 'recruiter' }, { type: 'approval', assignee: 'hr_admin' }] },
    'documents_compliance': { version: 'v3.1', label: 'Documents & Compliance Workflow', defaultSteps: [{ type: 'approval', assignee: 'hr_admin' }] },
    'service_desk': { version: 'v3.2', label: 'Service Desk Workflow', defaultSteps: [{ type: 'approval', assignee: 'hr_admin' }] },
    'payroll_run': { version: 'v3.3', label: 'Payroll Workflow', defaultSteps: [{ type: 'approval', assignee: 'org_admin' }, { type: 'approval', assignee: 'super_admin' }] },
  };

  async catalog(orgId: string) {
    const workflows = await this.prisma.workflow.findMany({ where: { organizationId: orgId } });
    const byTrigger: Record<string, any[]> = {};
    for (const w of workflows) (byTrigger[w.trigger] = byTrigger[w.trigger] || []).push(w);
    return Object.entries(WorkflowsService.ENGINE_CATALOG).map(([trigger, meta]) => ({
      trigger, version: meta.version, label: meta.label,
      active: (byTrigger[trigger] || []).filter((w:any)=>w.isActive).length,
      total: (byTrigger[trigger] || []).length,
      workflows: byTrigger[trigger] || [],
      defaultSteps: meta.defaultSteps,
    }));
  }

  async trigger(orgId: string, trigger: string, payload: any) {
    const workflows = await this.prisma.workflow.findMany({ where: { organizationId: orgId, trigger, isActive: true } });
    const instances = [];
    for (const wf of workflows) {
      const inst = await this.createInstance(orgId, wf.id, payload.entityType || 'manual', payload.entityId || 'unknown');
      instances.push(inst);
    }
    const meta = (WorkflowsService.ENGINE_CATALOG as any)[trigger];
    return { trigger, version: meta?.version || 'v2.7', label: meta?.label || trigger, matched: workflows.length, instances };
  }
}
