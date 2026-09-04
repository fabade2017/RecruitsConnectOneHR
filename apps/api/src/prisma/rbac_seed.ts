import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main(){
  const org = await prisma.organization.findUnique({ where: { acronym: 'RC' } });
  if (!org) throw new Error('org not found');
  const branch = await prisma.branch.findFirst({ where: { organizationId: org.id } });
  const dept = await prisma.department.findFirst({ where: { organizationId: org.id } });
  const users = [
    { email:'hr@recruitconnect.ng', role:'hr_admin' as const, job:'HR Officer', grade:'H2', code:'RC-000010' },
    { email:'manager@recruitconnect.ng', role:'manager' as const, job:'Branch Manager', grade:'M2', code:'RC-000011' },
    { email:'employee@recruitconnect.ng', role:'employee' as const, job:'Officer', grade:'L1', code:'RC-000012' },
  ];
  for (const u of users) {
    const exists = await prisma.user.findFirst({ where: { email: u.email } });
    if (exists) { console.log('exists', u.email); continue; }
    const hash = await bcrypt.hash('Test@123', 10);
    const user = await prisma.user.create({ data: { organizationId: org.id, email: u.email, passwordHash: hash, role: u.role } });
    let managerId: string | null = null;
    if (u.role === 'employee') {
      const mgrEmp = await prisma.employee.findFirst({ where: { organizationId: org.id, jobTitle: 'Branch Manager' } });
      managerId = mgrEmp?.id || null;
    }
    const emp = await prisma.employee.create({
      data: {
        organizationId: org.id, employeeCode: u.code, userId: user.id,
        departmentId: dept?.id, branchId: branch?.id,
        jobTitle: u.job, grade: u.grade, managerId,
        employmentType: 'permanent', workArrangement: 'office', status: 'active',
        hireDate: new Date(), skills: JSON.stringify([])
      }
    });
    console.log('created', u.email, u.role, emp.employeeCode, 'managerId', managerId);
  }
}
main().then(()=>prisma.$disconnect()).catch(e=>{console.error(e); process.exit(1)});
