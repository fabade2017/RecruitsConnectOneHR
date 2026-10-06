import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Assigning default Growth plan to organizations without subscription...');

  const organizations = await prisma.organization.findMany({
    where: {
      NOT: {
        organizationSubscriptions: {
          some: {
            status: 'active',
            planId: { not: '' },
          },
        },
      },
    },
    include: {
      organizationSubscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  let assigned = 0;
  for (const org of organizations) {
    const defaultPlan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'growth' } });
    const planId = defaultPlan?.id || '';

    if (!planId) {
      console.log(`⚠️ No Growth plan found - skipping ${org.acronym}`);
      continue;
    }

    // Check if already has active subscription with plan
    const existingSub = org.organizationSubscriptions[0];
    if (existingSub?.planId === planId) {
      console.log(`✅ ${org.acronym} already has Growth plan`);
      continue;
    }

    // Create/update subscription with Growth plan
    await prisma.organizationSubscription.upsert({
      where: {
        organizationId: org.id,
      },
      update: {
        planId,
        status: 'active',
        billingCycle: 'yearly',
      },
      create: {
        organizationId: org.id,
        planId,
        status: 'active',
        billingCycle: 'yearly',
        endDate: new Date(),
      },
    });

    assigned++;
    console.log(`✅ Assigned Growth plan to ${org.acronym}`);
  }

  console.log(`\n${assigned} organizations assigned Growth plan.`);
  
  // Show summary
  const allOrgs = await prisma.organization.findMany();
  console.log(`\nTotal organizations: ${allOrgs.length}`);
  const withPlan = allOrgs.filter(o => o.organizationSubscriptions?.some(s => s.planId && s.planId !== '')).length;
  console.log(`Organizations with active plan: ${withPlan}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });