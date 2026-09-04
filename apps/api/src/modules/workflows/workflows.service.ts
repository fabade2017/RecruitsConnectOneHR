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

  async trigger(orgId: string, trigger: string, payload: any) {
    const workflows = await this.prisma.workflow.findMany({ where: { organizationId: orgId, trigger, isActive: true } });
    const instances = [];
    for (const wf of workflows) {
      const inst = await this.createInstance(orgId, wf.id, payload.entityType || 'manual', payload.entityId || 'unknown');
      instances.push(inst);
    }
    return { trigger, matched: workflows.length, instances };
  }
}
