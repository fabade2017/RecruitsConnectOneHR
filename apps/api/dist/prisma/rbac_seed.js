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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const org = await prisma.organization.findUnique({ where: { acronym: 'RC' } });
    if (!org)
        throw new Error('org not found');
    const branch = await prisma.branch.findFirst({ where: { organizationId: org.id } });
    const dept = await prisma.department.findFirst({ where: { organizationId: org.id } });
    const users = [
        { email: 'hr@recruitconnect.ng', role: 'hr_admin', job: 'HR Officer', grade: 'H2', code: 'RC-000010' },
        { email: 'manager@recruitconnect.ng', role: 'manager', job: 'Branch Manager', grade: 'M2', code: 'RC-000011' },
        { email: 'employee@recruitconnect.ng', role: 'employee', job: 'Officer', grade: 'L1', code: 'RC-000012' },
    ];
    for (const u of users) {
        const exists = await prisma.user.findFirst({ where: { email: u.email } });
        if (exists) {
            console.log('exists', u.email);
            continue;
        }
        const hash = await bcrypt.hash('Test@123', 10);
        const user = await prisma.user.create({ data: { organizationId: org.id, email: u.email, passwordHash: hash, role: u.role } });
        let managerId = null;
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
main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
