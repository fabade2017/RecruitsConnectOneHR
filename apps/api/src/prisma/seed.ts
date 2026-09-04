import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding OneHR...');

  const org = await prisma.organization.upsert({
    where: { acronym: 'RC' },
    update: {},
    create: {
      name: 'RecruitConnect Nigeria Ltd',
      acronym: 'RC',
      industryTemplate: 'banking',
      config: JSON.stringify({
        workdays: ['mon','tue','wed','thu','fri'],
        grace_period_minutes: 10,
        overtime_rules: { threshold_minutes: 480, requires_approval: true },
      }),
    },
  });

  await prisma.attendancePolicy.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      verificationMethods: JSON.stringify(['standard','gps','qr_code']),
      requireFaceSnapshot: false,
      snapshotRetentionDays: 90,
      gracePeriodMinutes: 10,
    },
  });

  const branch = await prisma.branch.create({
    data: { organizationId: org.id, name: 'Lagos Head Office', isHeadOffice: true, address: 'Victoria Island, Lagos' },
  });
  const dept = await prisma.department.create({
    data: { organizationId: org.id, branchId: branch.id, name: 'Human Resources' },
  });

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@recruitconnect.ng',
      passwordHash,
      role: 'org_admin',
    },
  });

  const employee = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeCode: 'RC-000001',
      userId: user.id,
      departmentId: dept.id,
      branchId: branch.id,
      jobTitle: 'HR Administrator',
      grade: 'M3',
      employmentType: 'permanent',
      workArrangement: 'office',
      status: 'active',
      hireDate: new Date('2024-01-15'),
      skills: JSON.stringify(['HRIS','Compliance']),
    },
  });

  const shift = await prisma.shift.create({
    data: {
      organizationId: org.id,
      name: 'Fixed 8-5',
      type: 'fixed',
      startTime: '08:00',
      endTime: '17:00',
      breakDurationMinutes: 60,
    },
  });

  await prisma.leaveType.createMany({
    data: [
      { organizationId: org.id, name: 'Annual', maxDays: 21, accrualRule: JSON.stringify({ perYear: 21 }) },
      { organizationId: org.id, name: 'Sick', maxDays: 14, accrualRule: JSON.stringify({ perYear: 14 }) },
      { organizationId: org.id, name: 'Maternity', maxDays: 90, accrualRule: JSON.stringify({ perYear: 90 }) },
    ],
  });

  console.log({ org: org.acronym, branch: branch.name, dept: dept.name, user: user.email, employee: employee.employeeCode, shift: shift.name });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
