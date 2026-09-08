import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ===== Roles (Super Admin can create/assign) =====
  listRoles(orgId?: string) {
    return this.prisma.roleDefinition.findMany({
      where: orgId ? { OR: [{ organizationId: orgId }, { organizationId: null }] } : {},
      orderBy: { createdAt: 'desc' },
      include: { permissionLinks: true },
    });
  }

  async createRole(dto: any, user: any) {
    // Only super_admin or org_admin can create roles
    if (!['super_admin','org_admin'].includes(user.role)) throw new ForbiddenException('Only super_admin/org_admin can create roles');
    
    const orgId = dto.organizationId || (user.role === 'org_admin' ? user.org_id : null);
    
    // Check duplicate slug
    const exists = await this.prisma.roleDefinition.findFirst({ where: { slug: dto.slug, organizationId: orgId } });
    if (exists) throw new ConflictException('Role slug already exists');

    return this.prisma.roleDefinition.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isSystem: false,
        isActive: true,
        permissions: JSON.stringify(dto.permissions || []),
        createdBy: user.sub,
      }
    });
  }

  async updateRole(id: string, dto: any) {
    const role = await this.prisma.roleDefinition.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new ForbiddenException('Cannot modify system roles');
    if (dto.permissions && Array.isArray(dto.permissions)) dto.permissions = JSON.stringify(dto.permissions);
    return this.prisma.roleDefinition.update({ where: { id }, data: dto });
  }

  async deleteRole(id: string) {
    const role = await this.prisma.roleDefinition.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new ForbiddenException('Cannot delete system roles');
    // Check if any user assigned
    const assigned = await this.prisma.user.count({ where: { customRoleId: id } });
    if (assigned > 0) throw new ConflictException(`Cannot delete: ${assigned} users assigned`);
    return this.prisma.roleDefinition.delete({ where: { id } });
  }

  async assignRole(userId: string, roleSlug: string, customRoleId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    // If customRoleId provided, use it; otherwise use slug (system role)
    if (customRoleId) {
      const customRole = await this.prisma.roleDefinition.findUnique({ where: { id: customRoleId } });
      if (!customRole) throw new NotFoundException('Custom role not found');
      return this.prisma.user.update({ where: { id: userId }, data: { role: customRole.slug, customRoleId } });
    }
    
    // System role assignment
    return this.prisma.user.update({ where: { id: userId }, data: { role: roleSlug, customRoleId: null } });
  }

  // ===== Permissions =====
  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { module: 'asc' } });
  }

  async listPermissionsGrouped() {
    const perms = await this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { key: 'asc' }] });
    const grouped: Record<string, typeof perms> = {};
    for (const p of perms) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    return { permissions: perms, grouped, totalPermissions: perms.length, totalModules: Object.keys(grouped).length };
  }

  async listModules() {
    const perms = await this.prisma.permission.findMany({ select: { module: true }, distinct: ['module'], orderBy: { module: 'asc' } });
    const dbModules = perms.map((p) => p.module);
    // Static 44 modules from enterprise_seed.ts — ensure API returns complete list even if permissions table is sparse
    const STATIC_MODULES = [
      'people','recruitment','onboarding','attendance','smart_clocking','face_verification','gps','shifts','leave','remote_work','tasks','performance','kpi','payroll','benefits','learning','engagement','employee_relations','disciplinary','documents','assets','promotion','succession','offboarding','alumni','compliance','service_desk','reporting','analytics','ai_copilot','workforce_intelligence','workflow','integrations','administration','workforce_activity','work_session','exception_center','digital_passport','talent_marketplace','knowledge_vault','digital_twin','simulator','life_events','automation','notifications',
    ];
    const merged = Array.from(new Set([...dbModules, ...STATIC_MODULES])).sort();
    // Group permissions by module for dropdown convenience
    const allPerms = await this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { key: 'asc' }] });
    const grouped: Record<string, typeof allPerms> = {};
    for (const p of allPerms) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    // Ensure static modules appear even with empty permission list
    for (const m of STATIC_MODULES) if (!grouped[m]) grouped[m] = [];
    return {
      modules: merged,
      grouped,
      totalModules: merged.length,
      totalPermissions: allPerms.length,
    };
  }

  async createPermission(dto: any) {
    return this.prisma.permission.create({
      data: { key: dto.key, name: dto.name, description: dto.description, module: dto.module, isSystem: false }
    });
  }

  // ===== Module Catalog (pricing) =====
  async listModuleCatalog() {
    return this.prisma.moduleCatalog.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
  }

  async upsertModuleCatalog(dto: any) {
    const key = dto.key?.toLowerCase().trim();
    if (!key) throw new ConflictException('Module key required');
    return this.prisma.moduleCatalog.upsert({
      where: { key },
      create: {
        key,
        name: dto.name || key.replace(/_/g,' ').replace(/\b\w/g,(s:string)=>s.toUpperCase()),
        description: dto.description,
        category: dto.category || 'add_on',
        basePrice: dto.basePrice ?? dto.price ?? 0,
        currency: dto.currency || 'NGN',
        isActive: dto.isActive ?? true,
        icon: dto.icon,
      },
      update: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        basePrice: dto.basePrice ?? dto.price,
        currency: dto.currency,
        isActive: dto.isActive,
        icon: dto.icon,
      },
    });
  }

  async updateModuleCatalog(key: string, dto: any) {
    const existing = await this.prisma.moduleCatalog.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException('Module not found');
    return this.prisma.moduleCatalog.update({ where: { key }, data: {
      name: dto.name,
      description: dto.description,
      category: dto.category,
      basePrice: dto.basePrice ?? dto.price,
      currency: dto.currency,
      isActive: dto.isActive,
      icon: dto.icon,
    }});
  }

  async deleteModuleCatalog(key: string) {
    return this.prisma.moduleCatalog.delete({ where: { key } });
  }

  async getPlansWithPricing() {
    const plans = await this.prisma.subscriptionPlan.findMany({ include: { modules: true }, orderBy: { price: 'asc' } });
    const catalog = await this.prisma.moduleCatalog.findMany();
    const catMap = new Map(catalog.map(c=> [c.key, c]));
    return plans.map(p=> ({
      ...p,
      modules: p.modules.map(m=> ({
        ...m,
        catalog: catMap.get(m.moduleKey) || null,
        effectivePrice: m.price != null ? Number(m.price) : (catMap.get(m.moduleKey)?.basePrice != null ? Number(catMap.get(m.moduleKey)!.basePrice) : 0),
      })),
      totalModulePrice: p.modules.reduce((sum,m)=>{
        const cat = catMap.get(m.moduleKey);
        const eff = m.price != null ? Number(m.price) : (cat ? Number(cat.basePrice) : 0);
        return sum + eff;
      }, 0),
    }));
  }

  // ===== Company Groups (Group of Companies) =====
  listGroups() {
    return this.prisma.companyGroup.findMany({ include: { organizations: true, _count: { select: { organizations: true } } }, orderBy: { createdAt: 'desc' } });
  }

  getGroup(id: string) {
    return this.prisma.companyGroup.findUnique({ where: { id }, include: { organizations: true, subscriptions: { include: { plan: true } } } });
  }

  async createGroup(dto: any, user: any) {
    if (user.role !== 'super_admin') throw new ForbiddenException('Only super_admin can create company groups');
    return this.prisma.companyGroup.create({
      data: {
        name: dto.name,
        code: dto.code || `GRP-${Date.now().toString().slice(-6)}`,
        description: dto.description,
        logoUrl: dto.logoUrl,
        ownerId: user.sub,
        isActive: true,
      }
    });
  }

  async updateGroup(id: string, dto: any) {
    return this.prisma.companyGroup.update({ where: { id }, data: dto });
  }

  async assignOrganizationToGroup(groupId: string, orgId: string) {
    const group = await this.prisma.companyGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return this.prisma.organization.update({ where: { id: orgId }, data: { companyGroupId: groupId } });
  }

  async removeOrganizationFromGroup(orgId: string) {
    return this.prisma.organization.update({ where: { id: orgId }, data: { companyGroupId: null } });
  }

  async groupHierarchy(groupId: string) {
    const group = await this.prisma.companyGroup.findUnique({ where: { id: groupId }, include: { organizations: { include: { branches: true, _count: { select: { employees: true, branches: true } } } } } });
    if (!group) throw new NotFoundException('Group not found');
    return {
      group,
      totalOrganizations: group.organizations.length,
      totalEmployees: group.organizations.reduce((sum, org) => sum + (org as any)._count.employees, 0),
      totalBranches: group.organizations.reduce((sum, org) => sum + (org as any)._count.branches, 0),
    };
  }

  // ===== Subscriptions & Module Assignment =====
  listPlans() {
    return this.prisma.subscriptionPlan.findMany({ include: { modules: true, _count: { select: { subscriptions: true } } }, orderBy: { price: 'asc' } });
  }

  getPlan(id: string) {
    return this.prisma.subscriptionPlan.findUnique({ where: { id }, include: { modules: true, subscriptions: true } });
  }

  async createPlan(dto: any) {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'NGN',
        billingCycle: dto.billingCycle || 'monthly',
        maxEmployees: dto.maxEmployees || 50,
        maxBranches: dto.maxBranches || 3,
        isActive: true,
        isCustom: dto.isCustom || false,
      }
    });
    // Add modules if provided
    if (dto.modules && Array.isArray(dto.modules)) {
      for (const mod of dto.modules) {
        await this.prisma.planModule.create({ data: { planId: plan.id, moduleKey: mod, enabled: true } });
      }
    }
    return this.prisma.subscriptionPlan.findUnique({ where: { id: plan.id }, include: { modules: true } });
  }

  async updatePlan(id: string, dto: any) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async assignModulesToPlan(planId: string, modules: (string | { key: string; moduleKey?: string; price?: number })[]) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    // Normalize to {key, price}
    const normalized = modules.map((m:any)=> typeof m==='string' ? { key: m, price: undefined } : { key: m.key || m.moduleKey, price: m.price });
    const keys = normalized.map(n=> n.key);
    // Remove existing modules not in new list
    await this.prisma.planModule.deleteMany({ where: { planId, moduleKey: { notIn: keys } } });
    for (const n of normalized) {
      await this.prisma.planModule.upsert({
        where: { planId_moduleKey: { planId, moduleKey: n.key } },
        create: { planId, moduleKey: n.key, enabled: true, price: n.price != null ? n.price : undefined },
        update: { enabled: true, ...(n.price != null ? { price: n.price } : {}) },
      });
    }
    return this.prisma.subscriptionPlan.findUnique({ where: { id: planId }, include: { modules: true } });
  }

  async setModulePrice(planId: string, moduleKey: string, price: number) {
    return this.prisma.planModule.upsert({
      where: { planId_moduleKey: { planId, moduleKey } },
      create: { planId, moduleKey, enabled: true, price },
      update: { price },
    });
  }

  async removeModuleFromPlan(planId: string, moduleKey: string) {
    return this.prisma.planModule.delete({ where: { planId_moduleKey: { planId, moduleKey } } });
  }

  listSubscriptions(orgId?: string, groupId?: string) {
    const where: any = {};
    if (orgId) where.organizationId = orgId;
    if (groupId) where.companyGroupId = groupId;
    return this.prisma.organizationSubscription.findMany({ where, include: { plan: { include: { modules: true } }, organization: true, companyGroup: true }, orderBy: { createdAt: 'desc' } });
  }

  async assignSubscription(dto: any) {
    const { organizationId, companyGroupId, planId, billingCycle } = dto;
    
    if (!organizationId && !companyGroupId) throw new ForbiddenException('Must provide organizationId or companyGroupId');
    
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    // If assigning to group, assign to all orgs in group
    if (companyGroupId) {
      const group = await this.prisma.companyGroup.findUnique({ where: { id: companyGroupId }, include: { organizations: true } });
      if (!group) throw new NotFoundException('Group not found');
      
      const results = [];
      for (const org of group.organizations) {
        const existing = await this.prisma.organizationSubscription.findFirst({ where: { organizationId: org.id, planId } });
        if (!existing) {
          const sub = await this.prisma.organizationSubscription.create({
            data: { organizationId: org.id, companyGroupId, planId, status: 'active', billingCycle: billingCycle || 'monthly' }
          });
          results.push(sub);
          await this.prisma.organization.update({ where: { id: org.id }, data: { status: 'active', isActive: true } as any }).catch(()=>{});
        }
      }
      return { group: group.name, assigned: results.length, subscriptions: results };
    }

    // Single org assignment
    const sub = await this.prisma.organizationSubscription.create({
      data: { organizationId, planId, status: 'active', billingCycle: billingCycle || 'monthly' }
    });
    // Activate organization (grant access) on first approval
    await this.prisma.organization.update({ where: { id: organizationId }, data: { status: 'active', isActive: true } as any }).catch(()=>{});
    return sub;
  }

  async updateSubscription(id: string, dto: any) {
    return this.prisma.organizationSubscription.update({ where: { id }, data: dto });
  }

  async cancelSubscription(id: string) {
    return this.prisma.organizationSubscription.update({ where: { id }, data: { status: 'cancelled', endDate: new Date() } });
  }

  // Check if org has access to module (based on subscription)
  async checkModuleAccess(organizationId: string, moduleKey: string): Promise<boolean> {
    const sub = await this.prisma.organizationSubscription.findFirst({
      where: { organizationId, status: 'active' },
      include: { plan: { include: { modules: true } } },
      orderBy: { createdAt: 'desc' }
    });
    if (!sub) return false; // No active subscription
    return sub.plan.modules.some(m => m.moduleKey === moduleKey && m.enabled);
  }

  listOrganizations() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { employees: true, branches: true, users: true, departments: true } },
        companyGroup: true,
        subscriptions: { include: { plan: true } },
      },
    });
  }
}
