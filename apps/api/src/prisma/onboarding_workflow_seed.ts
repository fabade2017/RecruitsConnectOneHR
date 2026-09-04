// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Onboarding Workflow Deep Seed ===');
  const org = await prisma.organization.findUnique({ where: { acronym: 'RC' } });
  if (!org) throw new Error('RC org not found');
  const users = await prisma.user.findMany({ where: { organizationId: org.id } });
  const findUser = (email: string) => users.find(u => u.email === email);
  const admin = findUser('admin@recruitconnect.ng');
  const hr = findUser('hr@recruitconnect.ng');
  const manager = findUser('manager@recruitconnect.ng');
  const employeeUser = findUser('employee@recruitconnect.ng');
  if (!admin || !hr || !manager) throw new Error('Required users not found');

  const employees = await prisma.employee.findMany({ where: { organizationId: org.id }, take: 5, include: { user: true, department: true, branch: true } });
  console.log('Employees:', employees.map(e => `${e.employeeCode} ${e.jobTitle}`));

  // 1. Onboarding Workflow (if not exists, create with trigger employee.created)
  let workflow = await prisma.workflow.findFirst({ where: { organizationId: org.id, name: 'Onboarding Workflow' } });
  if (!workflow) {
    const existing = await prisma.workflow.findFirst({ where: { organizationId: org.id, trigger: 'employee.created' } });
    if (existing && existing.name.includes('Onboarding')) workflow = existing;
    else {
      workflow = await prisma.workflow.create({
        data: {
          organizationId: org.id,
          name: 'Onboarding Workflow',
          trigger: 'employee.created',
          condition: JSON.stringify({ field: 'status', op: '=', value: 'active' }),
          steps: JSON.stringify([
            { id: 's1', name: 'Offer & E-Sign Verified', type: 'approval', assignee: 'hr_admin', description: 'HR verifies CONTRACT document verified (auto)', sla_hours: 24 },
            { id: 's2', name: 'Documents Verified', type: 'approval', assignee: 'hr_admin', description: 'ID, Bank, Certificates verified (auto)', sla_hours: 24 },
            { id: 's3', name: 'IT Setup & Asset', type: 'task', assignee: 'hr_admin', description: 'Create email, assign laptop, provision access', sla_hours: 48 },
            { id: 's4', name: 'Orientation Completed', type: 'approval', assignee: 'manager', description: 'HR intro, Policies, Tour - manager confirms', sla_hours: 24 },
            { id: 's5', name: 'Buddy & Training Assigned', type: 'task', assignee: 'hr_admin', description: 'Assign mentor, enroll LMS path, verify training', sla_hours: 72 },
            { id: 's6', name: 'Probation Goals Set', type: 'approval', assignee: 'manager', description: '30-60-90 day KPIs, manager sets goals', sla_hours: 24 },
          ]),
          escalation: JSON.stringify({ after_hours: 48, to: 'org_admin' }),
          isActive: true,
        }
      });
      console.log('Created onboarding workflow:', workflow.id);
    }
  } else console.log('Workflow exists:', workflow.id);

  // 2. For each recent hire, create WorkflowInstance if not exists
  for (const emp of employees.slice(0, 3)) {
    let instance = await prisma.workflowInstance.findFirst({ where: { workflowId: workflow.id, entityId: emp.id } });
    if (instance) {
      console.log(`Instance exists for ${emp.employeeCode} ${instance.id} status ${instance.status}`);
      await prisma.approval.deleteMany({ where: { instanceId: instance.id } });
      await prisma.workflowInstance.update({ where: { id: instance.id }, data: { currentStep: 0, status: 'pending' } });
      instance = await prisma.workflowInstance.findUnique({ where: { id: instance.id } });
    } else {
      instance = await prisma.workflowInstance.create({
        data: {
          organizationId: org.id,
          workflowId: workflow.id,
          entityType: 'employee',
          entityId: emp.id,
          currentStep: 0,
          status: 'pending',
          deadline: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        }
      });
      console.log(`Created instance ${instance.id} for ${emp.employeeCode}`);
    }

    // Ensure onboarding_progress exists and evaluate auto
    const progress = await prisma.onboardingProgress.findUnique({ where: { employeeId: emp.id } });
    let steps: any[] = progress ? JSON.parse(progress.steps as any) : [];
    // If no progress, let getOrCreate create via service logic - simulate by using default
    if (!progress) {
      // Will be created on first GET, but we create here with auto evaluation
      const docsVerified = await prisma.document.findFirst({ where: { organizationId: org.id, employeeId: emp.id, verificationStatus: 'verified' } });
      const asset = await prisma.asset.findFirst({ where: { organizationId: org.id, employeeId: emp.id } });
      const session = await prisma.workSession.findFirst({ where: { organizationId: org.id, employeeId: emp.id } });
      const training = await prisma.learningEnrollment.findFirst({ where: { employeeId: emp.id, status: 'COMPLETED' } });
      const review = await prisma.performanceReview.findFirst({ where: { organizationId: org.id, employeeId: emp.id } });
      const offerDoc = await prisma.document.findFirst({ where: { organizationId: org.id, employeeId: emp.id, type: 'CONTRACT', verificationStatus: 'verified' } });
      const autoSteps = [
        { id: '1', title: 'Offer & E-Sign', desc: 'Sign offer letter • NDA', done: !!offerDoc, autoVerified: !!offerDoc },
        { id: '2', title: 'Documents', desc: 'Upload ID • Bank • Certificates', done: !!docsVerified, autoVerified: !!docsVerified },
        { id: '3', title: 'IT Setup', desc: 'Email • Laptop • Access §14', done: !!asset, autoVerified: !!asset },
        { id: '4', title: 'Orientation', desc: 'HR intro • Policies §34 • Tour', done: !!session, autoVerified: !!session },
        { id: '5', title: 'Buddy & Training', desc: 'Assigned mentor • LMS path', done: !!training, autoVerified: !!training },
        { id: '6', title: 'Probation Goals', desc: '30-60-90 day KPIs', done: !!review, autoVerified: !!review },
      ];
      const prog = Math.round((autoSteps.filter(s=>s.done).length/autoSteps.length)*100);
      await prisma.onboardingProgress.upsert({
        where: { employeeId: emp.id },
        create: { organizationId: org.id, employeeId: emp.id, steps: JSON.stringify(autoSteps), progress: prog },
        update: { steps: JSON.stringify(autoSteps), progress: prog },
      });
      steps = autoSteps;
    }

    // Create approvals for workflow instance steps - simulate who logged in per step
    const approvers = [
      { step: 0, user: hr, role: 'hr_admin', comment: 'Offer verified - CONTRACT doc verified', ip: '102.89.32.14', duration: 420 },
      { step: 1, user: hr, role: 'hr_admin', comment: 'All docs verified - ID, Bank, Certs', ip: '102.89.32.14', duration: 380 },
      { step: 2, user: hr, role: 'hr_admin', comment: 'IT setup done - email created, laptop Dell assigned', ip: '102.89.32.14', duration: 600 },
      { step: 3, user: manager, role: 'manager', comment: 'Orientation completed - HR intro & tour done', ip: '102.89.32.55', duration: 900 },
      { step: 4, user: hr, role: 'hr_admin', comment: 'Buddy assigned - mentor John, LMS enrolled', ip: '102.89.32.14', duration: 540 },
      { step: 5, user: manager, role: 'manager', comment: 'Probation goals set - 30/60/90 KPIs', ip: '102.89.32.55', duration: 780 },
    ];

    for (let i = 0; i < approvers.length; i++) {
      const a = approvers[i];
      const loginAt = new Date(Date.now() - (6 - i) * 2 * 3600 * 1000);
      const decidedAt = new Date(loginAt.getTime() + a.duration * 1000);
      // Login audit
      await prisma.auditLog.create({
        data: {
          organizationId: org.id,
          userId: a.user.id,
          action: `POST /v1/auth/login`,
          entityType: 'auth',
          entityId: a.user.id,
          newValue: JSON.stringify({ email: a.user.email, role: a.role, loginAt: loginAt.toISOString(), ip: a.ip, page: '/login -> /onboarding' }).slice(0, 8000),
          ip: a.ip,
          userAgent: 'Mozilla/5.0 (Onboarding Portal) HR/Mgr',
          duration: 280,
          statusCode: 200,
        }
      });
      // Page view audit - getting to onboarding page
      await prisma.auditLog.create({
        data: {
          organizationId: org.id,
          userId: a.user.id,
          action: `GET /v1/onboarding/${emp.id}`,
          entityType: 'onboarding',
          entityId: emp.id,
          newValue: JSON.stringify({ step: i+1, stepName: steps[i]?.title || `Step ${i+1}`, page: '/onboarding', employeeCode: emp.employeeCode }).slice(0, 8000),
          ip: a.ip,
          userAgent: 'Mozilla/5.0 (Onboarding Portal)',
          duration: 180,
          statusCode: 200,
        }
      });
      const approval = await prisma.approval.create({
        data: {
          instanceId: instance!.id,
          approverId: a.user.id,
          status: 'approved',
          comment: a.comment,
          decidedAt,
        }
      });
      await prisma.auditLog.create({
        data: {
          organizationId: org.id,
          userId: a.user.id,
          action: `PATCH /v1/workflows/instances/${instance!.id}/approve`,
          entityType: 'approval',
          entityId: approval.id,
          newValue: JSON.stringify({ step: i+1, stepName: a.comment.slice(0,30), approver: a.user.email, role: a.role, comment: a.comment, employeeCode: emp.employeeCode, duration: a.duration }).slice(0, 8000),
          ip: a.ip,
          userAgent: 'Mozilla/5.0 (Onboarding Portal)',
          duration: a.duration,
          statusCode: 200,
        }
      });
      await prisma.workflowInstance.update({ where: { id: instance!.id }, data: { currentStep: i+1, status: i === approvers.length -1 ? 'approved' : 'pending' } });
      console.log(`  ${emp.employeeCode} step ${i+1} ${a.user.email} ${a.role} ${a.comment.slice(0,30)}`);
    }
    await prisma.workflowInstance.update({ where: { id: instance!.id }, data: { status: 'approved' } });
    console.log(`  Onboarding ${emp.employeeCode} instance ${instance!.id} approved`);
  }
  console.log('=== Onboarding seed complete ===');
}

main().catch(e=>{console.error(e); process.exit(1);}).finally(()=>prisma.$disconnect());
