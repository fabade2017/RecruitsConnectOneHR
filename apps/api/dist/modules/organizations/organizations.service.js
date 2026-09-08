"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
let OrganizationsService = class OrganizationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findOne(id) { return this.prisma.organization.findUnique({ where: { id } }); }
    update(id, dto) {
        // Allow config as JSON string or object
        if (dto.config && typeof dto.config === 'object')
            dto.config = JSON.stringify(dto.config);
        return this.prisma.organization.update({ where: { id }, data: dto });
    }
    getConfig(id) { return this.prisma.organization.findUnique({ where: { id }, select: { config: true, industryTemplate: true } }); }
    healthScore(orgId, date) { return this.prisma.workforceScore.findMany({ where: { organizationId: orgId, date: new Date(date) } }); }
    async getBranding(id) {
        const org = await this.prisma.organization.findUnique({ where: { id }, select: { id: true, name: true, acronym: true, logoUrl: true, watermarkEnabled: true, watermarkText: true, watermarkOpacity: true, watermarkPosition: true, primaryColor: true, config: true } });
        if (!org)
            throw new common_1.ConflictException('Organization not found');
        return org;
    }
    async updateBranding(id, dto) {
        const data = {};
        if (dto.logoUrl !== undefined)
            data.logoUrl = dto.logoUrl;
        if (dto.logo_url !== undefined)
            data.logoUrl = dto.logo_url;
        if (dto.watermarkEnabled !== undefined)
            data.watermarkEnabled = Boolean(dto.watermarkEnabled);
        if (dto.watermark_enabled !== undefined)
            data.watermarkEnabled = Boolean(dto.watermark_enabled);
        if (dto.watermarkText !== undefined)
            data.watermarkText = dto.watermarkText;
        if (dto.watermark_text !== undefined)
            data.watermarkText = dto.watermark_text;
        if (dto.watermarkOpacity !== undefined)
            data.watermarkOpacity = parseFloat(dto.watermarkOpacity);
        if (dto.watermark_opacity !== undefined)
            data.watermarkOpacity = parseFloat(dto.watermark_opacity);
        if (dto.watermarkPosition !== undefined)
            data.watermarkPosition = dto.watermarkPosition;
        if (dto.watermark_position !== undefined)
            data.watermarkPosition = dto.watermark_position;
        if (dto.primaryColor !== undefined)
            data.primaryColor = dto.primaryColor;
        if (dto.primary_color !== undefined)
            data.primaryColor = dto.primary_color;
        // Also allow config merge for branding
        if (dto.config) {
            const existing = await this.prisma.organization.findUnique({ where: { id }, select: { config: true } });
            let cfg = {};
            try {
                cfg = existing?.config ? JSON.parse(existing.config) : {};
            }
            catch { }
            const incoming = typeof dto.config === 'string' ? JSON.parse(dto.config) : dto.config;
            cfg = { ...cfg, ...incoming };
            if (incoming.branding)
                cfg.branding = { ...(cfg.branding || {}), ...incoming.branding };
            data.config = JSON.stringify(cfg);
            // If branding in config, also map to columns for easy query
            if (incoming.branding) {
                if (incoming.branding.logoUrl)
                    data.logoUrl = incoming.branding.logoUrl;
                if (incoming.branding.watermarkText !== undefined)
                    data.watermarkText = incoming.branding.watermarkText;
                if (incoming.branding.watermarkEnabled !== undefined)
                    data.watermarkEnabled = incoming.branding.watermarkEnabled;
            }
        }
        return this.prisma.organization.update({ where: { id }, data });
    }
    async uploadLogo(id, file) {
        if (!file || !file.buffer)
            throw new common_1.ConflictException('No file uploaded');
        const isImage = file.mimetype?.startsWith('image/');
        if (!isImage)
            throw new common_1.ConflictException('Logo must be an image (png, jpg, svg)');
        if (file.size > 3 * 1024 * 1024)
            throw new common_1.ConflictException('Logo too large (max 3MB)');
        const b64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${b64}`;
        return this.prisma.organization.update({ where: { id }, data: { logoUrl: dataUrl } });
    }
    listAll() {
        return this.prisma.organization.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { employees: true, branches: true, users: true } } } });
    }
    async getSubscription(organizationId) {
        const sub = await this.prisma.organizationSubscription.findFirst({
            where: { organizationId, status: 'active' },
            include: { plan: { include: { modules: true } }, organization: true },
            orderBy: { createdAt: 'desc' },
        });
        if (!sub)
            return { hasSubscription: false, message: 'No active subscription — contact Super Admin' };
        const catalog = await this.prisma.moduleCatalog.findMany({ where: { key: { in: sub.plan.modules.map(m => m.moduleKey) } } });
        const catMap = new Map(catalog.map(c => [c.key, c]));
        const modulesWithPrice = sub.plan.modules.map(m => ({
            ...m,
            catalog: catMap.get(m.moduleKey) || null,
            effectivePrice: m.price != null ? Number(m.price) : (catMap.get(m.moduleKey) ? Number(catMap.get(m.moduleKey).basePrice) : 0),
        }));
        const allCatalog = await this.prisma.moduleCatalog.findMany({ orderBy: { key: 'asc' } });
        const enabledKeys = new Set(sub.plan.modules.map(m => m.moduleKey));
        const disabledModules = allCatalog.filter(c => !enabledKeys.has(c.key));
        return {
            hasSubscription: true,
            subscription: sub,
            plan: { ...sub.plan, modules: modulesWithPrice },
            totalModulePrice: modulesWithPrice.reduce((s, m) => s + m.effectivePrice, 0),
            totalPrice: Number(sub.plan.price) + modulesWithPrice.reduce((s, m) => s + m.effectivePrice, 0),
            disabledModules,
            allCatalog,
        };
    }
    async checkAcronym(acronym) {
        const ac = (acronym || '').toUpperCase().trim();
        if (!ac)
            return { available: false, message: 'Acronym required' };
        if (ac.length < 2 || ac.length > 10)
            return { available: false, message: 'Acronym must be 2-10 chars' };
        const exists = await this.prisma.organization.findUnique({ where: { acronym: ac } });
        return exists ? { available: false, message: 'Acronym already taken' } : { available: true, message: 'Acronym available' };
    }
    async create(dto) {
        const acronym = (dto.acronym || '').toUpperCase().trim();
        if (!acronym)
            throw new common_1.ConflictException('Acronym required');
        if (acronym.length < 2 || acronym.length > 10)
            throw new common_1.ConflictException('Acronym must be 2-10 characters');
        if (!/^[A-Z0-9_-]+$/.test(acronym))
            throw new common_1.ConflictException('Acronym must be alphanumeric (A-Z, 0-9, -, _)');
        const exists = await this.prisma.organization.findUnique({ where: { acronym } });
        if (exists)
            throw new common_1.ConflictException('Acronym already exists — choose another');
        const org = await this.prisma.organization.create({
            data: {
                name: dto.name,
                acronym,
                industryTemplate: dto.industryTemplate || 'generic',
                config: JSON.stringify({ workdays: ['mon', 'tue', 'wed', 'thu', 'fri'], grace_period_minutes: 10 }),
                status: 'pending',
                isActive: false,
            },
        });
        await this.prisma.attendancePolicy.create({
            data: {
                organizationId: org.id,
                verificationMethods: JSON.stringify(['standard', 'gps', 'qr_code']),
                snapshotRetentionDays: 90,
                gracePeriodMinutes: 10,
            },
        });
        const branch = await this.prisma.branch.create({
            data: { organizationId: org.id, name: `${dto.name} Head Office`, isHeadOffice: true, address: 'Head Office' },
        });
        const dept = await this.prisma.department.create({
            data: { organizationId: org.id, branchId: branch.id, name: 'Human Resources' },
        });
        let user = null;
        let employee = null;
        if (dto.adminEmail && dto.adminPassword) {
            const hash = await bcrypt.hash(dto.adminPassword, 10);
            user = await this.prisma.user.create({
                data: {
                    organizationId: org.id,
                    email: dto.adminEmail,
                    passwordHash: hash,
                    role: 'org_admin',
                },
            });
            employee = await this.prisma.employee.create({
                data: {
                    organizationId: org.id,
                    employeeCode: `${acronym}-000001`,
                    userId: user.id,
                    departmentId: dept.id,
                    branchId: branch.id,
                    jobTitle: 'Administrator',
                    grade: 'M3',
                    employmentType: 'permanent',
                    workArrangement: 'office',
                    status: 'active',
                    hireDate: new Date(),
                    skills: JSON.stringify(['HRIS']),
                },
            });
        }
        // Seed leave types for new org
        await this.prisma.leaveType.createMany({
            data: [
                { organizationId: org.id, name: 'Annual', maxDays: 21, accrualRule: JSON.stringify({ perYear: 21 }) },
                { organizationId: org.id, name: 'Sick', maxDays: 14, accrualRule: JSON.stringify({ perYear: 14 }) },
            ],
        });
        return { organization: org, branch, department: dept, user: user ? { id: user.id, email: user.email, role: user.role } : null, employee };
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
