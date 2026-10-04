import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  const plan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Enterprise' }, include: { modules: true } });
  if (!plan) throw new Error('Enterprise plan missing — run enterprise_seed.ts first');
  if (!plan.modules.some((m) => m.moduleKey === 'payroll' && m.enabled)) throw new Error('Enterprise plan lacks payroll module');

  const hash = await bcrypt.hash('Test@123', 10);

  const mk = async (name: string, email: string) => {
    const org = await prisma.organization.create({
      data: { name: `${name} Ltd`, acronym: name.toUpperCase(), status: 'active', isActive: true },
    });
    const user = await prisma.user.create({
      data: { email, passwordHash: hash, organizationId: org.id, role: 'org_admin', mustChangePassword: false },
    });
    const employee = await prisma.employee.create({
      data: { employeeCode: `${name}-E001`, organizationId: org.id, userId: user.id, jobTitle: 'Engineer' } as any,
    });
    const payroll = await prisma.payrollMerged.create({
      data: {
        organizationId: org.id, employeeId: employee.id, month: 1, year: 2026,
        basicSalary: 500000, allowances: 0, deductions: 0, tax: 0, netPay: 500000, status: 'DRAFT',
      },
    });
    await prisma.organizationSubscription.create({
      data: {
        organizationId: org.id, planId: plan.id, status: 'active', billingCycle: 'yearly',
        endDate: new Date(Date.now() + 31536000000),
      },
    });
    return { org, user, employee, payroll };
  };

  const A = await mk('Zeta', 'zeta@example.test');
  const B = await mk('Yotta', 'yotta@example.test');

  console.log(JSON.stringify({
    A: { org: A.org.id, user: A.user.id, email: 'zeta@example.test', payroll: A.payroll.id },
    B: { org: B.org.id, user: B.user.id, email: 'yotta@example.test', payroll: B.payroll.id },
  }, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });