import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}
  findOne(id: string) { return this.prisma.organization.findUnique({ where: { id } }); }
  update(id: string, dto: any) {
    // Allow config as JSON string or object
    if (dto.config && typeof dto.config === 'object') dto.config = JSON.stringify(dto.config);
    return this.prisma.organization.update({ where: { id }, data: dto });
  }
  getConfig(id: string) { return this.prisma.organization.findUnique({ where: { id }, select: { config: true, industryTemplate: true } }); }
  healthScore(orgId: string, date: string) { return this.prisma.workforceScore.findMany({ where: { organizationId: orgId, date: new Date(date) } }); }

  async getBranding(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id }, select: { id: true, name: true, acronym: true, logoUrl: true, watermarkEnabled: true, watermarkText: true, watermarkOpacity: true, watermarkPosition: true, primaryColor: true, config: true } });
    if (!org) throw new ConflictException('Organization not found');
    return org;
  }

  async updateBranding(id: string, dto: any) {
    const data: any = {};
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl;
    if (dto.logo_url !== undefined) data.logoUrl = dto.logo_url;
    if (dto.watermarkEnabled !== undefined) data.watermarkEnabled = Boolean(dto.watermarkEnabled);
    if (dto.watermark_enabled !== undefined) data.watermarkEnabled = Boolean(dto.watermark_enabled);
    if (dto.watermarkText !== undefined) data.watermarkText = dto.watermarkText;
    if (dto.watermark_text !== undefined) data.watermarkText = dto.watermark_text;
    if (dto.watermarkOpacity !== undefined) data.watermarkOpacity = parseFloat(dto.watermarkOpacity);
    if (dto.watermark_opacity !== undefined) data.watermarkOpacity = parseFloat(dto.watermark_opacity);
    if (dto.watermarkPosition !== undefined) data.watermarkPosition = dto.watermarkPosition;
    if (dto.watermark_position !== undefined) data.watermarkPosition = dto.watermark_position;
    if (dto.primaryColor !== undefined) data.primaryColor = dto.primaryColor;
    if (dto.primary_color !== undefined) data.primaryColor = dto.primary_color;
    // Also allow config merge for branding
    if (dto.config) {
      const existing = await this.prisma.organization.findUnique({ where: { id }, select: { config: true } });
      let cfg: any = {};
      try { cfg = existing?.config ? JSON.parse(existing.config as any) : {}; } catch {}
      const incoming = typeof dto.config === 'string' ? JSON.parse(dto.config) : dto.config;
      cfg = { ...cfg, ...incoming };
      if (incoming.branding) cfg.branding = { ...(cfg.branding||{}), ...incoming.branding };
      data.config = JSON.stringify(cfg);
      // If branding in config, also map to columns for easy query
      if (incoming.branding) {
        if (incoming.branding.logoUrl) data.logoUrl = incoming.branding.logoUrl;
        if (incoming.branding.watermarkText !== undefined) data.watermarkText = incoming.branding.watermarkText;
        if (incoming.branding.watermarkEnabled !== undefined) data.watermarkEnabled = incoming.branding.watermarkEnabled;
      }
    }
    return this.prisma.organization.update({ where: { id }, data });
  }

  async uploadLogo(id: string, file: any) {
    if (!file || !file.buffer) throw new ConflictException('No file uploaded');
    const isImage = file.mimetype?.startsWith('image/');
    if (!isImage) throw new ConflictException('Logo must be an image (png, jpg, svg)');
    if (file.size > 3 * 1024 * 1024) throw new ConflictException('Logo too large (max 3MB)');
    const b64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${b64}`;
    return this.prisma.organization.update({ where: { id }, data: { logoUrl: dataUrl } });
  }

  listAll() {
    return this.prisma.organization.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { employees: true, branches: true, users: true } } } });
  }

  async getSubscription(organizationId: string) {
    const sub = await this.prisma.organizationSubscription.findFirst({
      where: { organizationId, status: 'active' },
      include: { plan: { include: { modules: true } }, organization: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) return { hasSubscription: false, message: 'No active subscription — contact Super Admin' };
    const catalog = await this.prisma.moduleCatalog.findMany({ where: { key: { in: sub.plan.modules.map(m=>m.moduleKey) } } });
    const catMap = new Map(catalog.map(c=>[c.key, c]));
    const modulesWithPrice = sub.plan.modules.map(m=> ({
      ...m,
      catalog: catMap.get(m.moduleKey) || null,
      effectivePrice: m.price != null ? Number(m.price) : (catMap.get(m.moduleKey) ? Number(catMap.get(m.moduleKey)!.basePrice) : 0),
    }));
    const allCatalog = await this.prisma.moduleCatalog.findMany({ orderBy: { key: 'asc' } });
    const enabledKeys = new Set(sub.plan.modules.map(m=>m.moduleKey));
    const disabledModules = allCatalog.filter(c=> !enabledKeys.has(c.key));
    return {
      hasSubscription: true,
      subscription: sub,
      plan: { ...sub.plan, modules: modulesWithPrice },
      totalModulePrice: modulesWithPrice.reduce((s,m)=>s+ (m.effectivePrice as number),0),
      totalPrice: Number(sub.plan.price) + modulesWithPrice.reduce((s,m)=>s+ (m.effectivePrice as number),0),
      disabledModules,
      allCatalog,
      // expiry helpers
      expiresAt: sub.endDate,
      daysLeft: sub.endDate ? Math.ceil((new Date(sub.endDate).getTime() - Date.now())/86400000) : null,
    };
  }

  async requestRenewal(organizationId: string, userId?: string) {
    const sub = await this.prisma.organizationSubscription.findFirst({ where: { organizationId, status: 'active' }, orderBy: { createdAt: 'desc' } });
    if (!sub) throw new NotFoundException('No active subscription to renew');
    // Prevent duplicate pending
    const pending = await this.prisma.subscriptionRenewal.findFirst({ where: { organizationId, status: 'pending' } });
    if (pending) throw new ConflictException('Renewal already pending — awaiting Super Admin approval');
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: sub.planId }, include: { modules: true } });
    if (!plan) throw new NotFoundException('Plan not found');
    const catalog = await this.prisma.moduleCatalog.findMany({ where: { key: { in: plan.modules.map(m=>m.moduleKey) } } });
    const catMap = new Map(catalog.map(c=>[c.key,c]));
    const totalModule = plan.modules.reduce((s,m)=> s + (m.price != null ? Number(m.price) : (catMap.get(m.moduleKey)? Number(catMap.get(m.moduleKey)!.basePrice):0)),0);
    const amount = Number(plan.price) + totalModule;
    const previousEndDate = sub.endDate || new Date();
    const newEndDate = new Date(previousEndDate);
    newEndDate.setFullYear(newEndDate.getFullYear()+1);
    const renewal = await this.prisma.subscriptionRenewal.create({
      data: {
        organizationId,
        planId: plan.id,
        subscriptionId: sub.id,
        previousEndDate,
        newEndDate,
        amount,
        status: 'pending',
        requestedBy: userId,
      } as any,
    });
    return renewal;
  }

  async listRenewals(organizationId: string) {
    return this.prisma.subscriptionRenewal.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, include: { plan: true } });
  }

  async getRenewal(renewalId: string, organizationId?: string) {
    const where:any={ id: renewalId };
    if (organizationId) where.organizationId = organizationId;
    const r = await this.prisma.subscriptionRenewal.findFirst({ where, include: { plan: true, organization: true } });
    if (!r) throw new NotFoundException('Renewal not found');
    return r;
  }

  async checkAcronym(acronym: string) {
    const ac = (acronym || '').toUpperCase().trim();
    if (!ac) return { available: false, message: 'Acronym required' };
    if (ac.length < 2 || ac.length > 10) return { available: false, message: 'Acronym must be 2-10 chars' };
    const exists = await this.prisma.organization.findUnique({ where: { acronym: ac } });
    return exists ? { available: false, message: 'Acronym already taken' } : { available: true, message: 'Acronym available' };
  }

  async create(dto: any) {
    const acronym = (dto.acronym || '').toUpperCase().trim();
    if (!acronym) throw new ConflictException('Acronym required');
    if (acronym.length < 2 || acronym.length > 10) throw new ConflictException('Acronym must be 2-10 characters');
    if (!/^[A-Z0-9_-]+$/.test(acronym)) throw new ConflictException('Acronym must be alphanumeric (A-Z, 0-9, -, _)');
    const exists = await this.prisma.organization.findUnique({ where: { acronym } });
    if (exists) throw new ConflictException('Acronym already exists — choose another');

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        acronym,
        industryTemplate: dto.industryTemplate || 'generic',
        config: JSON.stringify({ workdays: ['mon','tue','wed','thu','fri'], grace_period_minutes: 10 }),
        status: 'pending',
        isActive: false,
      },
    });

    await this.prisma.attendancePolicy.create({
      data: {
        organizationId: org.id,
        verificationMethods: JSON.stringify(['standard','gps','qr_code']),
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

    let user: any = null;
    let employee: any = null;
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
}
