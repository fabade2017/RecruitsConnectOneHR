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
var WorkflowsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let WorkflowsService = class WorkflowsService {
    static { WorkflowsService_1 = this; }
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ===== Approver resolution =====
    // Step approver can be: role only (any member), a specific user, or role -> specific member.
    // Legacy steps only carry `assignee` (role slug, or sometimes a user id).
    approverTarget(step) {
        const mode = step?.approverMode;
        if ((mode === 'user' || mode === 'role_user') && step?.approverUserId)
            return { kind: 'user', id: step.approverUserId };
        const a = step?.approverRole || step?.assignee || 'manager';
        if (UUID_RE.test(String(a)))
            return { kind: 'user', id: String(a) };
        return { kind: 'role', role: String(a) };
    }
    approverIdOf(step) {
        const t = this.approverTarget(step);
        return t.kind === 'user' ? t.id : t.role;
    }
    approverModeOf(step) {
        if (step?.approverMode === 'user' || step?.approverMode === 'role_user')
            return step.approverMode;
        const t = this.approverTarget(step);
        if (t.kind === 'user')
            return 'user';
        if (step?.approverUserId)
            return 'role_user';
        return 'role';
    }
    async roleExists(orgId, slug) {
        if (Object.keys(rbac_guard_1.ROLE_PERMISSIONS).includes(slug))
            return true;
        const custom = await this.prisma.roleDefinition.findFirst({ where: { slug, organizationId: orgId } })
            || await this.prisma.roleDefinition.findFirst({ where: { slug, organizationId: null } });
        return !!custom;
    }
    async validateApprover(orgId, step, idx) {
        const mode = this.approverModeOf(step);
        const n = `Step ${idx + 1}`;
        if (mode === 'role' || mode === 'role_user') {
            const slug = step?.approverRole || (mode === 'role' ? step?.assignee : '');
            if (!slug || UUID_RE.test(String(slug)))
                throw new common_1.ConflictException(`${n}: choose an approver role`);
            if (!(await this.roleExists(orgId, String(slug))))
                throw new common_1.ConflictException(`${n}: unknown role "${slug}"`);
        }
        if (mode === 'user' || mode === 'role_user') {
            const uid = step?.approverUserId;
            if (!uid)
                throw new common_1.ConflictException(`${n}: choose an approver user`);
            const u = await this.prisma.user.findFirst({ where: { id: uid, organizationId: orgId }, select: { id: true, email: true, role: true, customRoleId: true } });
            if (!u)
                throw new common_1.ConflictException(`${n}: approver user not found in your organisation`);
            if (mode === 'role_user') {
                const slug = String(step?.approverRole || '');
                if (Object.keys(rbac_guard_1.ROLE_PERMISSIONS).includes(slug)) {
                    if (u.role !== slug)
                        throw new common_1.ConflictException(`${n}: ${u.email} does not have the "${slug}" role`);
                }
                else {
                    const rd = await this.prisma.roleDefinition.findFirst({ where: { slug, organizationId: orgId } })
                        || await this.prisma.roleDefinition.findFirst({ where: { slug, organizationId: null } });
                    if (!rd || u.customRoleId !== rd.id)
                        throw new common_1.ConflictException(`${n}: ${u.email} does not have the "${slug}" role`);
                }
            }
        }
    }
    async validateSteps(orgId, steps) {
        if (steps === undefined || steps === null)
            return;
        if (!Array.isArray(steps))
            throw new common_1.ConflictException('steps must be an array');
        for (let i = 0; i < steps.length; i++) {
            const s = steps[i];
            if (!s || typeof s !== 'object')
                throw new common_1.ConflictException(`Step ${i + 1} is invalid`);
            if (s.type === 'approval')
                await this.validateApprover(orgId, s, i);
        }
    }
    // Roles + users of the org for the workflow builder's approver pickers
    async approverOptions(orgId) {
        const systemRoles = Object.keys(rbac_guard_1.ROLE_PERMISSIONS).map((slug) => ({ slug, name: slug.replace(/_/g, ' '), system: true }));
        const customRoles = await this.prisma.roleDefinition.findMany({
            where: { OR: [{ organizationId: orgId }, { organizationId: null }] },
            select: { id: true, slug: true, name: true, isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        const roleSeen = new Set();
        const roles = [
            ...systemRoles.filter((r) => (roleSeen.add(r.slug), true)),
            ...customRoles.filter((r) => r.isActive && !roleSeen.has(r.slug)).map((r) => ({ slug: r.slug, name: r.name || r.slug, system: false, id: r.id })),
        ];
        const users = await this.prisma.user.findMany({
            where: { organizationId: orgId },
            select: { id: true, email: true, role: true, customRoleId: true, employee: { select: { employeeCode: true } } },
            orderBy: { email: 'asc' },
        });
        return {
            roles,
            users: users.map((u) => ({
                id: u.id, email: u.email, role: u.role, customRoleId: u.customRoleId,
                label: u.employee?.employeeCode ? `${u.employee.employeeCode} — ${u.email}` : u.email,
            })),
        };
    }
    // steps/condition/escalation are JSON strings in the DB — expose parsed values to clients
    parseWf(w) {
        const parse = (v, fb) => {
            if (v === null || v === undefined)
                return fb;
            if (typeof v !== 'string')
                return v;
            try {
                const p = JSON.parse(v);
                return p ?? fb;
            }
            catch {
                return fb;
            }
        };
        return { ...w, steps: parse(w.steps, []), condition: parse(w.condition, {}), escalation: parse(w.escalation, {}) };
    }
    async list(orgId) {
        const rows = await this.prisma.workflow.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { instances: true } } },
        });
        return rows.map((w) => this.parseWf(w));
    }
    async get(orgId, id) {
        const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId }, include: { instances: { take: 10, orderBy: { createdAt: 'desc' }, include: { approvals: true } } } });
        if (!wf)
            throw new common_1.NotFoundException('Workflow not found');
        return this.parseWf(wf);
    }
    async create(orgId, dto, user) {
        if (!dto.name)
            throw new common_1.ConflictException('Name required');
        await this.validateSteps(orgId, dto.steps);
        const exists = await this.prisma.workflow.findFirst({ where: { organizationId: orgId, name: dto.name } });
        if (exists)
            throw new common_1.ConflictException('Workflow name already exists');
        const created = await this.prisma.workflow.create({
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
        return this.parseWf(created);
    }
    async update(orgId, id, dto) {
        const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
        if (!wf)
            throw new common_1.NotFoundException('Workflow not found');
        if (dto.steps !== undefined)
            await this.validateSteps(orgId, dto.steps);
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
        const updated = await this.prisma.workflow.update({ where: { id }, data });
        return this.parseWf(updated);
    }
    async remove(orgId, id) {
        const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
        if (!wf)
            throw new common_1.NotFoundException('Workflow not found');
        // Delete approvals -> instances first (no cascade on either FK)
        const instIds = (await this.prisma.workflowInstance.findMany({ where: { workflowId: id }, select: { id: true } })).map((i) => i.id);
        if (instIds.length)
            await this.prisma.approval.deleteMany({ where: { instanceId: { in: instIds } } });
        await this.prisma.workflowInstance.deleteMany({ where: { workflowId: id } });
        return this.prisma.workflow.delete({ where: { id } });
    }
    async toggle(orgId, id) {
        const wf = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
        if (!wf)
            throw new common_1.NotFoundException('Workflow not found');
        const toggled = await this.prisma.workflow.update({ where: { id }, data: { isActive: !wf.isActive } });
        return this.parseWf(toggled);
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
        // Create first approval if steps has approval (role slug or specific user id)
        if (steps[0]?.type === 'approval') {
            await this.prisma.approval.create({
                data: { instanceId: instance.id, approverId: this.approverIdOf(steps[0]), status: 'pending' },
            });
        }
        return instance;
    }
    // Only the assigned user (role_user/user modes) or a member of the assigned role may approve
    async assertCanApprove(target, user) {
        if (UUID_RE.test(String(target))) {
            if (user?.sub !== target)
                throw new common_1.ForbiddenException('This approval is assigned to a specific user');
            return;
        }
        if (user?.role === target)
            return;
        if (user?.customRoleId) {
            try {
                const rd = await this.prisma.roleDefinition.findUnique({ where: { id: user.customRoleId }, select: { slug: true } });
                if (rd?.slug === target)
                    return;
            }
            catch { }
        }
        throw new common_1.ForbiddenException(`Only the "${target}" role can approve this step`);
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
        // Enforce who may act on the pending step
        const pending = await this.prisma.approval.findFirst({ where: { instanceId, status: 'pending' }, orderBy: { createdAt: 'asc' } });
        if (pending)
            await this.assertCanApprove(pending.approverId, user);
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
            await this.prisma.approval.create({ data: { instanceId, approverId: this.approverIdOf(steps[nextIdx]), status: 'pending' } });
        }
        return this.prisma.workflowInstance.update({ where: { id: instanceId }, data: { status, currentStep, escalatedAt: dto.escalate ? new Date() : undefined } });
    }
    // Point 5: versioned engines — seed catalog matching live v2.7..v3.3
    static ENGINE_CATALOG = {
        'leave_request': { version: 'v2.8', label: 'Leave Workflow', defaultSteps: [{ type: 'approval', assignee: 'manager' }, { type: 'notification', channel: 'email' }] },
        'performance_review': { version: 'v2.9', label: 'Performance Workflow', defaultSteps: [{ type: 'approval', assignee: 'manager' }, { type: 'approval', assignee: 'hr_admin' }] },
        'recruitment': { version: 'v3.0', label: 'Recruitment Workflow', defaultSteps: [{ type: 'approval', assignee: 'recruiter' }, { type: 'approval', assignee: 'hr_admin' }] },
        'documents_compliance': { version: 'v3.1', label: 'Documents & Compliance Workflow', defaultSteps: [{ type: 'approval', assignee: 'hr_admin' }] },
        'service_desk': { version: 'v3.2', label: 'Service Desk Workflow', defaultSteps: [{ type: 'approval', assignee: 'hr_admin' }] },
        'payroll_run': { version: 'v3.3', label: 'Payroll Workflow', defaultSteps: [{ type: 'approval', assignee: 'org_admin' }, { type: 'approval', assignee: 'super_admin' }] },
    };
    async catalog(orgId) {
        const workflows = await this.prisma.workflow.findMany({ where: { organizationId: orgId } });
        const byTrigger = {};
        for (const w of workflows)
            (byTrigger[w.trigger] = byTrigger[w.trigger] || []).push(w);
        return Object.entries(WorkflowsService_1.ENGINE_CATALOG).map(([trigger, meta]) => ({
            trigger, version: meta.version, label: meta.label,
            active: (byTrigger[trigger] || []).filter((w) => w.isActive).length,
            total: (byTrigger[trigger] || []).length,
            workflows: byTrigger[trigger] || [],
            defaultSteps: meta.defaultSteps,
        }));
    }
    async trigger(orgId, trigger, payload) {
        const workflows = await this.prisma.workflow.findMany({ where: { organizationId: orgId, trigger, isActive: true } });
        const instances = [];
        for (const wf of workflows) {
            const inst = await this.createInstance(orgId, wf.id, payload.entityType || 'manual', payload.entityId || 'unknown');
            instances.push(inst);
        }
        const meta = WorkflowsService_1.ENGINE_CATALOG[trigger];
        return { trigger, version: meta?.version || 'v2.7', label: meta?.label || trigger, matched: workflows.length, instances };
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = WorkflowsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowsService);
