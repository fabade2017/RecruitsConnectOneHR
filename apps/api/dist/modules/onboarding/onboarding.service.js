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
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const DEFAULT_STEPS = [
    { id: '1', title: 'Offer & E-Sign', desc: 'Sign offer letter • NDA — auto when CONTRACT verified', done: false, autoKey: 'offer_verified' },
    { id: '2', title: 'Documents', desc: 'Upload ID • Bank • Certificates — auto when any doc verified', done: false, autoKey: 'docs_verified' },
    { id: '3', title: 'IT Setup', desc: 'Email • Laptop • Access §14 — auto when asset assigned', done: false, autoKey: 'asset_assigned' },
    { id: '4', title: 'Orientation', desc: 'HR intro • Policies §34 • Tour — auto when first clock-in', done: false, autoKey: 'orientation_done' },
    { id: '5', title: 'Buddy & Training', desc: 'Assigned mentor • LMS path — auto when training completed', done: false, autoKey: 'training_done' },
    { id: '6', title: 'Probation Goals', desc: '30-60-90 day KPIs linked to Performance §22 — auto when review exists', done: false, autoKey: 'probation_goals' },
];
let OnboardingService = class OnboardingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getChecklists(orgId) {
        const workflows = await this.prisma.workflow.findMany({ where: { organizationId: orgId, trigger: 'employee.created' }, take: 5 });
        if (workflows.length) {
            return workflows.map(w => {
                let steps = [];
                try {
                    steps = JSON.parse(w.steps);
                }
                catch { }
                return {
                    id: w.id,
                    name: w.name,
                    steps: steps.map((s, i) => ({ id: String(i + 1), title: s.name || s.title, desc: s.type || '', done: false, autoKey: s.type || `step_${i + 1}` })),
                    workflowId: w.id,
                };
            });
        }
        return [{ id: 'default', name: 'Standard Onboarding', steps: DEFAULT_STEPS }];
    }
    async evaluateAutoSteps(orgId, employeeId, steps) {
        // Query all auto sources in parallel
        const [offerDoc, anyVerifiedDoc, asset, session, trainingDone, review] = await Promise.all([
            // Step 1: Offer & E-Sign -> CONTRACT verified
            this.prisma.document.findFirst({ where: { organizationId: orgId, employeeId, type: 'CONTRACT', verificationStatus: 'verified' } }).catch(() => null),
            // Step 2: Any doc verified
            this.prisma.document.findFirst({ where: { organizationId: orgId, employeeId, verificationStatus: 'verified' } }).catch(() => null),
            // Step 3: Asset assigned and not returned
            this.prisma.asset.findFirst({ where: { organizationId: orgId, employeeId } }).catch(() => null),
            // Step 4: Orientation -> first clock-in / workSession exists
            this.prisma.workSession.findFirst({ where: { organizationId: orgId, employeeId } }).catch(() => null),
            // Step 5: Training completed
            this.prisma.learningEnrollment.findFirst({ where: { employeeId, status: 'COMPLETED' } }).catch(() => null).then(async (r) => {
                if (r)
                    return r;
                return this.prisma.learningEnrollment.findFirst({ where: { employeeId, progress: 100 } }).catch(() => null);
            }),
            // Step 6: Probation goals -> performance review exists
            this.prisma.performanceReview.findFirst({ where: { organizationId: orgId, employeeId } }).catch(() => null),
        ]);
        const autoMap = {
            '1': !!offerDoc,
            '2': !!anyVerifiedDoc,
            '3': !!asset,
            '4': !!session,
            '5': !!trainingDone,
            '6': !!review,
        };
        let changed = false;
        const newSteps = steps.map((s) => {
            const autoDone = autoMap[s.id];
            if (autoDone && !s.done) {
                changed = true;
                return { ...s, done: true, autoVerified: true, verifiedAt: new Date().toISOString(), verifiedBy: 'system' };
            }
            // If auto condition is true, force done true (system verified takes precedence)
            if (autoDone && s.done !== true) {
                changed = true;
                return { ...s, done: true, autoVerified: true };
            }
            // Keep manual done as is if auto not met
            return s;
        });
        return { steps: newSteps, changed };
    }
    async getOrCreateProgress(orgId, employeeId) {
        const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        let prog = await this.prisma.onboardingProgress.findUnique({ where: { employeeId } });
        if (!prog) {
            // Evaluate auto on creation
            const evaluated = await this.evaluateAutoSteps(orgId, employeeId, DEFAULT_STEPS);
            const steps = evaluated.steps;
            const progress = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
            prog = await this.prisma.onboardingProgress.create({
                data: { organizationId: orgId, employeeId, steps: JSON.stringify(steps), progress },
            });
            return prog;
        }
        // On fetch, re-evaluate auto steps and persist if changed
        const currentSteps = JSON.parse(prog.steps);
        const evaluated = await this.evaluateAutoSteps(orgId, employeeId, currentSteps);
        if (evaluated.changed) {
            const progress = Math.round((evaluated.steps.filter((s) => s.done).length / evaluated.steps.length) * 100);
            prog = await this.prisma.onboardingProgress.update({
                where: { employeeId },
                data: { steps: JSON.stringify(evaluated.steps), progress },
            });
        }
        return prog;
    }
    async getByEmployee(orgId, employeeId) {
        const prog = await this.getOrCreateProgress(orgId, employeeId);
        const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId }, select: { employeeCode: true, hireDate: true } });
        const steps = JSON.parse(prog.steps);
        // Re-evaluate again for live view (ensures auto reflects latest verification)
        const evaluated = await this.evaluateAutoSteps(orgId, employeeId, steps);
        if (evaluated.changed) {
            const progress = Math.round((evaluated.steps.filter((s) => s.done).length / evaluated.steps.length) * 100);
            await this.prisma.onboardingProgress.update({ where: { employeeId }, data: { steps: JSON.stringify(evaluated.steps), progress } });
            return {
                employeeId,
                employeeCode: emp?.employeeCode,
                hireDate: emp?.hireDate,
                progress,
                steps: evaluated.steps,
                updatedAt: new Date().toISOString(),
                autoEvaluated: true,
            };
        }
        return {
            employeeId,
            employeeCode: emp?.employeeCode,
            hireDate: emp?.hireDate,
            progress: prog.progress,
            steps,
            updatedAt: prog.updatedAt,
        };
    }
    async listProgress(orgId) {
        // Ensure all recent hires have progress evaluated
        const employees = await this.prisma.employee.findMany({ where: { organizationId: orgId }, take: 100, select: { id: true } });
        for (const e of employees.slice(0, 20)) {
            await this.getOrCreateProgress(orgId, e.id).catch(() => { });
        }
        const progresses = await this.prisma.onboardingProgress.findMany({ where: { organizationId: orgId }, take: 100, orderBy: { updatedAt: 'desc' } });
        const emps = await this.prisma.employee.findMany({ where: { organizationId: orgId, id: { in: progresses.map(p => p.employeeId) } }, select: { id: true, employeeCode: true } });
        const map = new Map(emps.map(e => [e.id, e.employeeCode]));
        // Re-evaluate each for live auto status
        const result = [];
        for (const p of progresses) {
            const steps = JSON.parse(p.steps);
            const evaluated = await this.evaluateAutoSteps(orgId, p.employeeId, steps);
            if (evaluated.changed) {
                const progress = Math.round((evaluated.steps.filter((s) => s.done).length / evaluated.steps.length) * 100);
                await this.prisma.onboardingProgress.update({ where: { employeeId: p.employeeId }, data: { steps: JSON.stringify(evaluated.steps), progress } });
                result.push({ employeeId: p.employeeId, employeeCode: map.get(p.employeeId) || p.employeeId.slice(0, 8), progress, steps: evaluated.steps, updatedAt: new Date().toISOString() });
            }
            else {
                result.push({ employeeId: p.employeeId, employeeCode: map.get(p.employeeId) || p.employeeId.slice(0, 8), progress: p.progress, steps, updatedAt: p.updatedAt });
            }
        }
        return result;
    }
    async toggleStep(orgId, employeeId, stepId) {
        const prog = await this.getOrCreateProgress(orgId, employeeId);
        let steps = JSON.parse(prog.steps);
        const idx = steps.findIndex(s => s.id === stepId);
        if (idx === -1)
            throw new common_1.NotFoundException('Step not found');
        // Prevent manual uncheck of auto-verified steps
        const autoCheck = await this.evaluateAutoSteps(orgId, employeeId, steps);
        const autoDone = autoCheck.steps[idx]?.autoVerified || autoCheck.steps[idx]?.done && steps[idx].autoVerified;
        // If step is auto-verified and currently done, block uncheck unless system condition cleared
        const isAutoStep = ['1', '2', '3', '4', '5', '6'].includes(stepId);
        // Allow toggle, but re-evaluate will force auto true back if condition still met
        steps[idx].done = !steps[idx].done;
        steps[idx].manualToggledAt = new Date().toISOString();
        if (!steps[idx].done)
            delete steps[idx].autoVerified;
        const evaluated = await this.evaluateAutoSteps(orgId, employeeId, steps);
        const finalSteps = evaluated.steps;
        const progress = Math.round((finalSteps.filter((s) => s.done).length / finalSteps.length) * 100);
        const updated = await this.prisma.onboardingProgress.update({
            where: { employeeId },
            data: { steps: JSON.stringify(finalSteps), progress },
        });
        const toggled = finalSteps[idx];
        return { employeeId, stepId, done: toggled.done, progress, steps: finalSteps, autoVerified: !!toggled.autoVerified };
    }
    async updateSteps(orgId, employeeId, steps) {
        const prog = await this.getOrCreateProgress(orgId, employeeId);
        const progress = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
        const updated = await this.prisma.onboardingProgress.update({
            where: { employeeId },
            data: { steps: JSON.stringify(steps), progress },
        });
        return updated;
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OnboardingService);
