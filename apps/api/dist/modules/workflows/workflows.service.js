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
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let WorkflowsService = class WorkflowsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(orgId) {
        return this.prisma.workflow.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { instances: true } } },
        });
    }
    async get(orgId, id) {
        const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId }, include: { instances: { take: 10, orderBy: { createdAt: 'desc' }, include: { approvals: true } } } });
        if (!wf)
            throw new common_1.NotFoundException('Workflow not found');
        return wf;
    }
    async create(orgId, dto, user) {
        if (!dto.name)
            throw new common_1.ConflictException('Name required');
        const exists = await this.prisma.workflow.findFirst({ where: { organizationId: orgId, name: dto.name } });
        if (exists)
            throw new common_1.ConflictException('Workflow name already exists');
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
    async update(orgId, id, dto) {
        const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
        if (!wf)
            throw new common_1.NotFoundException('Workflow not found');
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.trigger !== undefined)
            data.trigger = dto.trigger;
        if (dto.condition !== undefined)
            data.condition = JSON.stringify(dto.condition);
        if (dto.steps !== undefined)
            data.steps = JSON.stringify(dto.steps);
        if (dto.escalation !== undefined)
            data.escalation = JSON.stringify(dto.escalation);
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.status !== undefined)
            data.isActive = dto.status === 'active';
        return this.prisma.workflow.update({ where: { id }, data });
    }
    async remove(orgId, id) {
        const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
        if (!wf)
            throw new common_1.NotFoundException('Workflow not found');
        // Delete instances first (cascade not set)
        await this.prisma.workflowInstance.deleteMany({ where: { workflowId: id } });
        return this.prisma.workflow.delete({ where: { id } });
    }
    async toggle(orgId, id) {
        const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
        if (!wf)
            throw new common_1.NotFoundException('Workflow not found');
        return this.prisma.workflow.update({ where: { id }, data: { isActive: !wf.isActive } });
    }
    // Instances
    async listInstances(orgId, query) {
        const where = { organizationId: orgId };
        if (query.workflowId)
            where.workflowId = query.workflowId;
        if (query.status)
            where.status = query.status;
        if (query.entityType)
            where.entityType = query.entityType;
        return this.prisma.workflowInstance.findMany({ where, take: 50, orderBy: { createdAt: 'desc' }, include: { workflow: true, approvals: true } });
    }
    async createInstance(orgId, workflowId, entityType, entityId) {
        const wf = await this.prisma.workflow.findFirst({ where: { id: workflowId, organizationId: orgId } });
        if (!wf)
            throw new common_1.NotFoundException('Workflow not found');
        const steps = (() => { try {
            return typeof wf.steps === 'string' ? JSON.parse(wf.steps) : wf.steps;
        }
        catch {
            return [];
        } })();
        const instance = await this.prisma.workflowInstance.create({
            data: {
                organizationId: orgId,
                workflowId,
                entityType,
                entityId,
                currentStep: 0,
                status: 'pending',
                deadline: new Date(Date.now() + 24 * 3600 * 1000),
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
    async approveInstance(orgId, instanceId, dto, user) {
        const inst = await this.prisma.workflowInstance.findFirst({ where: { id: instanceId, organizationId: orgId }, include: { workflow: true } });
        if (!inst)
            throw new common_1.NotFoundException('Instance not found');
        const steps = (() => { try {
            return typeof inst.workflow.steps === 'string' ? JSON.parse(inst.workflow.steps) : inst.workflow.steps;
        }
        catch {
            return [];
        } })();
        const nextIdx = (inst.currentStep || 0) + 1;
        let status = 'pending';
        let currentStep = nextIdx;
        if (nextIdx >= steps.length) {
            status = 'approved';
            currentStep = steps.length;
        }
        // Update approval
        await this.prisma.approval.updateMany({ where: { instanceId, status: 'pending' }, data: { status: dto.status || 'approved', comment: dto.comment, decidedAt: new Date() } });
        // If approved and more steps, create next approval
        if (status === 'pending' && steps[nextIdx]?.type === 'approval') {
            await this.prisma.approval.create({ data: { instanceId, approverId: steps[nextIdx].assignee || 'hr_admin', status: 'pending' } });
        }
        return this.prisma.workflowInstance.update({ where: { id: instanceId }, data: { status, currentStep, escalatedAt: dto.escalate ? new Date() : undefined } });
    }
    async trigger(orgId, trigger, payload) {
        const workflows = await this.prisma.workflow.findMany({ where: { organizationId: orgId, trigger, isActive: true } });
        const instances = [];
        for (const wf of workflows) {
            const inst = await this.createInstance(orgId, wf.id, payload.entityType || 'manual', payload.entityId || 'unknown');
            instances.push(inst);
        }
        return { trigger, matched: workflows.length, instances };
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowsService);
