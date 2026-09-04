"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('=== Payroll Workflow Deep Seed ===');
    const org = await prisma.organization.findUnique({ where: { acronym: 'RC' } });
    if (!org)
        throw new Error('RC org not found');
    console.log('Org:', org.acronym, org.id);
    // Find users
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    const findUser = (email) => users.find(u => u.email === email);
    const admin = findUser('admin@recruitconnect.ng');
    const hr = findUser('hr@recruitconnect.ng');
    const manager = findUser('manager@recruitconnect.ng');
    const employeeUser = findUser('employee@recruitconnect.ng');
    const superAdmin = findUser('superadmin@recruitconnect.ng') || admin;
    if (!admin || !hr || !manager) {
        console.log('Users found:', users.map(u => `${u.email} ${u.role}`));
        throw new Error('Required users not found - run rbac_seed.ts first');
    }
    console.log('Users:', users.map(u => `${u.email} (${u.role})`));
    const employees = await prisma.employee.findMany({ where: { organizationId: org.id }, take: 10, include: { user: true, department: true, branch: true } });
    console.log('Employees:', employees.map(e => `${e.employeeCode} ${e.jobTitle} dept:${e.department?.name || e.departmentId}`));
    // 1. Create Payroll Workflow
    const existing = await prisma.workflow.findFirst({ where: { organizationId: org.id, name: 'Payroll Approval Chain' } });
    let workflow;
    if (existing) {
        workflow = existing;
        console.log('Workflow exists:', workflow.id);
    }
    else {
        workflow = await prisma.workflow.create({
            data: {
                organizationId: org.id,
                name: 'Payroll Approval Chain',
                trigger: 'payroll.submitted',
                condition: JSON.stringify({ field: 'netPay', op: '>', value: 0 }),
                steps: JSON.stringify([
                    { id: 's1', name: 'HR Draft & Check', type: 'task', assignee: 'hr_admin', description: 'HR verifies attendance, overtime, deductions', sla_hours: 24 },
                    { id: 's2', name: 'Manager Approval', type: 'approval', assignee: 'manager', description: 'Line manager approves team payroll', sla_hours: 24 },
                    { id: 's3', name: 'HR Admin Verification', type: 'approval', assignee: 'hr_admin', description: 'HR Admin verifies compliance and policy', sla_hours: 24 },
                    { id: 's4', name: 'Finance & Org Admin Approval', type: 'approval', assignee: 'org_admin', description: 'Org Admin / Finance approves net pay and tax', sla_hours: 48 },
                    { id: 's5', name: 'Payroll Paid & Notify', type: 'notification', assignee: 'system', description: 'System marks PAID and notifies employee via email/SMS', sla_hours: 2 },
                ]),
                escalation: JSON.stringify({ after_hours: 48, to: 'hr_admin', notify: 'email' }),
                isActive: true,
            }
        });
        console.log('Created workflow:', workflow.id, workflow.name);
    }
    // 2. Seed Payroll Records for Aug 2026
    const month = 8, year = 2026;
    const payrolls = [];
    for (const emp of employees.slice(0, 5)) {
        const existingPayroll = await prisma.payrollMerged.findFirst({ where: { employeeId: emp.id, month, year } });
        if (existingPayroll) {
            console.log(`Payroll exists for ${emp.employeeCode} ${month}/${year}: ${existingPayroll.status} net ${existingPayroll.netPay}`);
            payrolls.push(existingPayroll);
            continue;
        }
        const basic = emp.grade === 'M3' ? 800000 : emp.grade === 'M2' ? 500000 : emp.grade === 'H2' ? 350000 : 180000;
        const allowances = Math.round(basic * 0.2);
        const deductions = Math.round(basic * 0.05);
        const tax = Math.round(basic * 0.07);
        const netPay = basic + allowances - deductions - tax;
        const payroll = await prisma.payrollMerged.create({
            data: {
                organizationId: org.id,
                employeeId: emp.id,
                month,
                year,
                basicSalary: basic,
                allowances,
                deductions,
                tax,
                netPay,
                status: 'DRAFT',
            }
        });
        console.log(`Created payroll for ${emp.employeeCode}: basic ${basic} net ${netPay} id ${payroll.id}`);
        payrolls.push(payroll);
    }
    // 3. Create Workflow Instances + Approvals with deep audit
    const approvers = [
        { step: 0, user: hr, role: 'hr_admin', action: 'HR Draft & Check - task completed', comment: 'Verified attendance 94%, overtime 23m, deductions correct', ip: '102.89.32.14', duration: 340 },
        { step: 1, user: manager, role: 'manager', action: 'Manager Approval', comment: 'Approved team payroll for August - all present', ip: '102.89.32.55', duration: 1200 },
        { step: 2, user: hr, role: 'hr_admin', action: 'HR Admin Verification', comment: 'Compliance checked, NHIS and pension verified', ip: '102.89.32.14', duration: 890 },
        { step: 3, user: admin, role: 'org_admin', action: 'Finance & Org Admin Approval', comment: 'Approved net pay, tax remittance scheduled', ip: '102.89.45.201', duration: 2100 },
    ];
    for (const payroll of payrolls) {
        let instance = await prisma.workflowInstance.findFirst({ where: { workflowId: workflow.id, entityId: payroll.id } });
        if (instance) {
            console.log(`Instance exists for payroll ${payroll.id} status ${instance.status} step ${instance.currentStep}`);
            // Clean old approvals for re-seed
            await prisma.approval.deleteMany({ where: { instanceId: instance.id } });
            await prisma.workflowInstance.update({ where: { id: instance.id }, data: { currentStep: 0, status: 'pending' } });
            instance = await prisma.workflowInstance.findUnique({ where: { id: instance.id } });
        }
        else {
            instance = await prisma.workflowInstance.create({
                data: {
                    organizationId: org.id,
                    workflowId: workflow.id,
                    entityType: 'payroll',
                    entityId: payroll.id,
                    currentStep: 0,
                    status: 'pending',
                    deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000),
                }
            });
            console.log(`Created instance ${instance.id} for payroll ${payroll.id} emp ${payroll.employeeId}`);
        }
        // Create approvals step by step with audit logs
        for (let i = 0; i < approvers.length; i++) {
            const a = approvers[i];
            const loginAt = new Date(Date.now() - (4 - i) * 3600 * 1000 - Math.random() * 600000);
            const decidedAt = new Date(loginAt.getTime() + a.duration * 1000);
            // Simulate login audit
            await prisma.auditLog.create({
                data: {
                    organizationId: org.id,
                    userId: a.user.id,
                    action: `POST /v1/auth/login`,
                    entityType: 'auth',
                    entityId: a.user.id,
                    newValue: JSON.stringify({ email: a.user.email, role: a.user.role, loginAt: loginAt.toISOString(), ip: a.ip, userAgent: 'Mozilla/5.0 (HR Portal)' }).slice(0, 8000),
                    ip: a.ip,
                    userAgent: 'Mozilla/5.0 (HR Portal) Chrome/126',
                    duration: 320,
                    statusCode: 200,
                }
            });
            // Create approval
            const approval = await prisma.approval.create({
                data: {
                    instanceId: instance.id,
                    approverId: a.user.id,
                    status: 'approved',
                    comment: a.comment,
                    decidedAt,
                }
            });
            // Audit for approval
            await prisma.auditLog.create({
                data: {
                    organizationId: org.id,
                    userId: a.user.id,
                    action: `PATCH /v1/workflows/instances/${instance.id}/approve`,
                    entityType: 'approval',
                    entityId: approval.id,
                    newValue: JSON.stringify({ step: a.step + 1, stepName: a.action, approver: a.user.email, role: a.role, comment: a.comment, payrollId: payroll.id, duration: a.duration }).slice(0, 8000),
                    ip: a.ip,
                    userAgent: 'Mozilla/5.0 (HR Portal)',
                    duration: a.duration,
                    statusCode: 200,
                }
            });
            console.log(`  Step ${i + 1} approved by ${a.user.email} (${a.role}) at ${decidedAt.toISOString()} ip ${a.ip}`);
            // Update instance step
            await prisma.workflowInstance.update({ where: { id: instance.id }, data: { currentStep: i + 1, status: i === approvers.length - 1 ? 'approved' : 'pending' } });
        }
        // Final step 5 - system notification (auto)
        await prisma.auditLog.create({
            data: {
                organizationId: org.id,
                userId: null,
                action: `POST /v1/workflows/instances/${instance.id}/notify`,
                entityType: 'notification',
                entityId: instance.id,
                newValue: JSON.stringify({ step: 5, type: 'notification', channel: 'email', to: payroll.employeeId, payrollId: payroll.id, message: 'Payroll PAID - payslip sent' }).slice(0, 8000),
                ip: '10.0.0.1',
                userAgent: 'system/workflow-engine',
                duration: 150,
                statusCode: 200,
            }
        });
        // Mark payroll as PAID
        await prisma.payrollMerged.update({ where: { id: payroll.id }, data: { status: 'PAID', paidAt: new Date() } });
        await prisma.workflowInstance.update({ where: { id: instance.id }, data: { status: 'approved' } });
        console.log(`  Payroll ${payroll.id} marked PAID, instance approved`);
    }
    console.log('=== Seed complete ===');
    // Export summary for PDF generator
    return { org, workflow, payrolls };
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
