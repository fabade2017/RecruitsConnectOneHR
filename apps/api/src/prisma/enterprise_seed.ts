import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

const MODULES = [
  'people','recruitment','onboarding','attendance','smart_clocking','face_verification','gps','shifts','leave','remote_work','tasks','performance','kpi','payroll','benefits','learning','engagement','employee_relations','disciplinary','documents','assets','promotion','succession','offboarding','alumni','compliance','service_desk','reporting','analytics','ai_copilot','workforce_intelligence','workflow','integrations','administration','workforce_activity','work_session','exception_center','digital_passport','talent_marketplace','knowledge_vault','digital_twin','simulator','life_events','automation','notifications'
];

const PERMISSIONS = [
  { key: 'employee:create', name: 'Create Employee', module: 'people' },
  { key: 'employee:read', name: 'View Employees', module: 'people' },
  { key: 'employee:update', name: 'Update Employee', module: 'people' },
  { key: 'employee:delete', name: 'Delete Employee', module: 'people' },
  { key: 'attendance:clock', name: 'Clock In/Out', module: 'attendance' },
  { key: 'attendance:read', name: 'View Attendance', module: 'attendance' },
  { key: 'attendance:manage', name: 'Manage Attendance', module: 'attendance' },
  { key: 'leave:request', name: 'Request Leave', module: 'leave' },
  { key: 'leave:approve', name: 'Approve Leave', module: 'leave' },
  { key: 'leave:read', name: 'View Leave', module: 'leave' },
  { key: 'payroll:read', name: 'View Payroll', module: 'payroll' },
  { key: 'payroll:manage', name: 'Manage Payroll', module: 'payroll' },
  { key: 'job:create', name: 'Create Job', module: 'recruitment' },
  { key: 'job:read', name: 'View Jobs', module: 'recruitment' },
  { key: 'learning:read', name: 'View Learning', module: 'learning' },
  { key: 'learning:manage', name: 'Manage Learning', module: 'learning' },
  { key: 'compliance:read', name: 'View Compliance', module: 'compliance' },
  { key: 'compliance:manage', name: 'Manage Compliance', module: 'compliance' },
  { key: 'report:read', name: 'View Reports', module: 'reporting' },
  { key: 'analytics:read', name: 'View Analytics', module: 'analytics' },
  { key: 'admin:manage', name: 'System Admin', module: 'administration' },
];

async function main() {
  console.log('Seeding enterprise data...');

  // Create super_admin user (global, no org)
  const superOrg = await prisma.organization.findFirst({ where: { acronym: 'RC' } });
  if (!superOrg) throw new Error('RC org not found');
  
  // Check if super admin exists
  let superAdmin = await prisma.user.findFirst({ where: { email: 'superadmin@recruitconnect.ng' } });
  if (!superAdmin) {
    const hash = await bcrypt.hash('Super@123', 10);
    superAdmin = await prisma.user.create({
      data: {
        organizationId: superOrg.id,
        email: 'superadmin@recruitconnect.ng',
        passwordHash: hash,
        role: 'super_admin',
      }
    });
    console.log('Created super_admin:', superAdmin.email);
  } else {
    console.log('Super admin exists:', superAdmin.email);
  }

  // Seed permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: { key: p.key, name: p.name, module: p.module, isSystem: true, description: p.name },
      update: {}
    });
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions`);

  // Seed subscription plans
  const plans = [
    { name: 'Starter', slug: 'starter', price: 50000, maxEmployees: 50, maxBranches: 3, modules: ['people','attendance','leave','shifts','documents'] },
    { name: 'Growth', slug: 'growth', price: 150000, maxEmployees: 200, maxBranches: 10, modules: ['people','attendance','leave','shifts','documents','payroll','recruitment','performance','learning','tasks','reporting'] },
    { name: 'Enterprise', slug: 'enterprise', price: 400000, maxEmployees: 1000, maxBranches: 50, modules: MODULES },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { slug: plan.slug } });
    let planRec;
    if (!existing) {
      planRec = await prisma.subscriptionPlan.create({
        data: {
          name: plan.name,
          slug: plan.slug,
          description: `${plan.name} plan for ${plan.maxEmployees} employees`,
          price: plan.price,
          currency: 'NGN',
          billingCycle: 'monthly',
          maxEmployees: plan.maxEmployees,
          maxBranches: plan.maxBranches,
          isActive: true,
        }
      });
      console.log('Created plan:', plan.name);
    } else {
      planRec = existing;
      console.log('Plan exists:', plan.name);
    }

    // Seed plan modules
    for (const mod of plan.modules) {
      await prisma.planModule.upsert({
        where: { planId_moduleKey: { planId: planRec.id, moduleKey: mod } },
        create: { planId: planRec.id, moduleKey: mod, enabled: true },
        update: {}
      });
    }
    console.log(`  -> ${plan.modules.length} modules for ${plan.name}`);
  }

  // Create a sample company group
  let group = await prisma.companyGroup.findUnique({ where: { code: 'RC-GROUP-001' } });
  if (!group) {
    group = await prisma.companyGroup.create({
      data: {
        name: 'RecruitConnect Holdings',
        code: 'RC-GROUP-001',
        description: 'Group of companies under RecruitConnect',
        isActive: true,
      }
    });
    console.log('Created company group:', group.name);
    
    // Assign RC org to group
    await prisma.organization.update({ where: { id: superOrg.id }, data: { companyGroupId: group.id } });
    console.log('Assigned RC org to group');
  } else {
    console.log('Group exists:', group.name);
  }

  // Create sample custom role
  const customRole = await prisma.roleDefinition.findFirst({ where: { slug: 'custom_hr_lead', organizationId: superOrg.id } });
  if (!customRole) {
    await prisma.roleDefinition.create({
      data: {
        organizationId: superOrg.id,
        name: 'Custom HR Lead',
        slug: 'custom_hr_lead',
        description: 'Custom role with limited payroll access',
        isSystem: false,
        isActive: true,
        permissions: JSON.stringify(['employee:read', 'attendance:read', 'leave:read', 'leave:approve', 'payroll:read']),
      }
    });
    console.log('Created custom role: custom_hr_lead');
  }

  // Assign Enterprise subscription to RC org
  const enterprisePlan = await prisma.subscriptionPlan.findUnique({ where: { slug: 'enterprise' } });
  if (enterprisePlan) {
    const existingSub = await prisma.organizationSubscription.findFirst({ where: { organizationId: superOrg.id, planId: enterprisePlan.id } });
    if (!existingSub) {
      await prisma.organizationSubscription.create({
        data: {
          organizationId: superOrg.id,
          planId: enterprisePlan.id,
          status: 'active',
          billingCycle: 'monthly',
          autoRenew: true,
        }
      });
      console.log('Assigned Enterprise subscription to RC org');
    }
  }

  console.log('Enterprise seed done');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
