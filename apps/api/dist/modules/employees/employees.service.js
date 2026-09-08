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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const QRCode = __importStar(require("qrcode"));
const bcrypt = __importStar(require("bcryptjs"));
function canAccessEmployee(user, employeeId, employee) {
    const role = user?.role;
    if (['org_admin', 'super_admin', 'hr_admin', 'hr_manager', 'executive', 'auditor'].includes(role))
        return true;
    if (role === 'employee') {
        // employee can only access self — need to resolve own employee.id
        return user.employeeId === employeeId || employee?.userId === user.sub;
    }
    if (role === 'manager') {
        // manager can access self + subordinates
        return user.employeeId === employeeId || employee?.managerId === user.employeeId;
    }
    return false;
}
let EmployeesService = class EmployeesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveEmployeeIdFromUser(user) {
        if (user.employeeId)
            return user.employeeId;
        const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
        return emp?.id || null;
    }
    async create(orgId, dto, user) {
        const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org)
            throw new common_1.ConflictException('Org not found');
        const count = await this.prisma.employee.count({ where: { organizationId: orgId } });
        const seq = String(count + 1).padStart(6, '0');
        const employeeCode = `${org.acronym}-${seq}`;
        const qrCode = await QRCode.toDataURL(employeeCode);
        // handle DOB
        let dob = undefined;
        const dobRaw = dto.date_of_birth || dto.dob || dto.birth_date || dto.dateOfBirth;
        if (dobRaw) {
            const d = new Date(dobRaw);
            if (!isNaN(d.getTime()))
                dob = d;
        }
        let employee;
        try {
            employee = await this.prisma.employee.create({
                data: {
                    organizationId: orgId, employeeCode, qrCode,
                    departmentId: dto.department_id, branchId: dto.branch_id,
                    jobTitle: dto.job_title, grade: dto.grade, managerId: dto.manager_id,
                    employmentType: dto.employment_type || 'permanent',
                    workArrangement: dto.work_arrangement || 'office',
                    hireDate: dto.hire_date ? new Date(dto.hire_date) : undefined,
                    dateOfBirth: dob,
                    skills: JSON.stringify(dto.skills || []),
                },
            });
        }
        catch (e) {
            if (e.code === 'P2002')
                throw new common_1.ConflictException('Employee code conflict, retry');
            throw e;
        }
        // Auto-create user if email provided — default password Acronym+MMYYYY+DD
        if (dto.email || dto.adminEmail) {
            const email = dto.email || dto.adminEmail;
            const exists = await this.prisma.user.findFirst({ where: { email, organizationId: orgId } });
            if (!exists) {
                const dobDay = dob ? String(dob.getDate()).padStart(2, '0') : '00';
                const now = new Date();
                const pwd = `${org.acronym}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}${dobDay}`;
                const hash = await bcrypt.hash(pwd, 10);
                const newUser = await this.prisma.user.create({ data: { organizationId: orgId, email, phone: dto.phone || undefined, passwordHash: hash, role: dto.role || 'employee', mustChangePassword: true } });
                // Link employee to user so list/edit returns user relation
                try {
                    employee = await this.prisma.employee.update({ where: { id: employee.id }, data: { userId: newUser.id } });
                }
                catch { }
                // Return employee with password hint for superadmin template (not stored plain elsewhere)
                employee.generatedPassword = pwd;
                employee.loginEmail = email;
            }
            else {
                // Email exists but employee not linked — link orphan user to this employee
                if (exists && !employee.userId) {
                    try {
                        employee = await this.prisma.employee.update({ where: { id: employee.id }, data: { userId: exists.id } });
                        // update orphan user phone/role if provided
                        const patch = {};
                        if (dto.phone)
                            patch.phone = dto.phone;
                        if (dto.role)
                            patch.role = dto.role;
                        if (Object.keys(patch).length)
                            await this.prisma.user.update({ where: { id: exists.id }, data: patch }).catch(() => { });
                    }
                    catch { }
                }
            }
        }
        // Ensure returned employee includes user relation for immediate UI populate
        if (employee?.id) {
            const withUser = await this.prisma.employee.findUnique({ where: { id: employee.id }, include: { user: { select: { id: true, email: true, phone: true, role: true } }, department: true, branch: true } }).catch(() => null);
            if (withUser)
                return withUser;
        }
        return employee;
    }
    async list(orgId, query, user) {
        const where = { organizationId: orgId };
        if (query.status)
            where.status = query.status;
        if (query.search)
            where.OR = [{ employeeCode: { contains: query.search, mode: 'insensitive' } }, { jobTitle: { contains: query.search, mode: 'insensitive' } }];
        if (query.department_id)
            where.departmentId = query.department_id;
        // RBAC scoping
        const role = user?.role;
        if (role === 'employee') {
            const ownId = await this.resolveEmployeeIdFromUser(user);
            if (!ownId)
                return [];
            where.id = ownId;
        }
        else if (role === 'manager') {
            const ownId = await this.resolveEmployeeIdFromUser(user);
            const team = await this.prisma.employee.findMany({ where: { organizationId: orgId, managerId: ownId }, select: { id: true } });
            const ids = [ownId, ...team.map(t => t.id)].filter(Boolean);
            where.id = { in: ids };
        }
        return this.prisma.employee.findMany({ where, take: Math.min(parseInt(query.limit || '20'), 100), skip: query.cursor ? 1 : 0, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, email: true, phone: true, role: true } }, department: true, branch: true } });
    }
    async findOne(orgId, id, user) {
        const emp = await this.prisma.employee.findFirst({ where: { id, organizationId: orgId }, include: { user: { select: { id: true, email: true, phone: true, role: true } }, department: true, branch: true, manager: true } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        if (user && !canAccessEmployee(user, id, emp) && !['org_admin', 'super_admin', 'hr_admin', 'hr_manager', 'executive', 'auditor', 'manager'].includes(user.role)) {
            // For manager, we already checked via canAccess but need to allow hr etc
            // Strict check for employee self
            if (user.role === 'employee')
                throw new common_1.ForbiddenException('Access denied to this employee');
            if (user.role === 'manager') {
                const ownId = await this.resolveEmployeeIdFromUser(user);
                if (emp.id !== ownId && emp.managerId !== ownId)
                    throw new common_1.ForbiddenException('Manager can only view team');
            }
        }
        return emp;
    }
    async update(orgId, id, dto, user) {
        // Only hr_admin/org_admin or self (limited fields) can update
        const role = user?.role;
        if (role === 'employee') {
            const ownId = await this.resolveEmployeeIdFromUser(user);
            if (ownId !== id)
                throw new common_1.ForbiddenException('Employees can only update self');
            const allowed = ['phone', 'address', 'photoUrl', 'skills'];
            const filtered = {};
            for (const k of allowed)
                if (dto[k] !== undefined)
                    filtered[k] = dto[k];
            if (Object.keys(filtered).length === 0)
                throw new common_1.ForbiddenException('No permitted fields');
            if (filtered.skills && Array.isArray(filtered.skills))
                filtered.skills = JSON.stringify(filtered.skills);
            return this.prisma.employee.update({ where: { id }, data: filtered });
        }
        if (role === 'manager') {
            const ownId = await this.resolveEmployeeIdFromUser(user);
            const emp = await this.prisma.employee.findUnique({ where: { id } });
            if (emp?.id !== ownId && emp?.managerId !== ownId)
                throw new common_1.ForbiddenException('Manager can only update team');
        }
        // Handle email/phone/role -> User table, DOB -> Employee
        const userUpdates = {};
        if (dto.email !== undefined)
            userUpdates.email = dto.email;
        if (dto.phone !== undefined)
            userUpdates.phone = dto.phone;
        if (dto.role !== undefined)
            userUpdates.role = dto.role;
        if (Object.keys(userUpdates).length) {
            const empForUser = await this.prisma.employee.findUnique({ where: { id }, select: { userId: true } });
            if (empForUser?.userId) {
                // Check email uniqueness within org
                if (userUpdates.email) {
                    const exists = await this.prisma.user.findFirst({ where: { email: userUpdates.email, organizationId: orgId, id: { not: empForUser.userId } } });
                    if (exists)
                        throw new common_1.ConflictException('Email already exists in organization');
                }
                const updatedUser = await this.prisma.user.update({ where: { id: empForUser.userId }, data: userUpdates });
                if (!updatedUser)
                    throw new common_1.NotFoundException('User not found for employee');
            }
            else {
                // Employee has no linked user — handle email/phone/role changes
                // If email provided, check for orphan user with same email (created earlier without linking)
                if (dto.email) {
                    const orphan = await this.prisma.user.findFirst({ where: { email: dto.email, organizationId: orgId } });
                    if (orphan) {
                        // Check if orphan is already linked to another employee
                        const linkedEmp = await this.prisma.employee.findUnique({ where: { userId: orphan.id } });
                        if (linkedEmp && linkedEmp.id !== id)
                            throw new common_1.ConflictException('Email already exists in organization');
                        // Link orphan and apply updates (phone/role/email)
                        await this.prisma.user.update({ where: { id: orphan.id }, data: userUpdates });
                        await this.prisma.employee.update({ where: { id }, data: { userId: orphan.id } });
                    }
                    else {
                        // No orphan — create new user with default password and link
                        const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { acronym: true } });
                        const dobRaw = dto.dob || dto.date_of_birth || dto.birth_date || dto.dateOfBirth;
                        let dobDay = '00';
                        if (dobRaw) {
                            const d = new Date(dobRaw);
                            if (!isNaN(d.getTime()))
                                dobDay = String(d.getDate()).padStart(2, '0');
                        }
                        // also try to fetch current employee DOB for password day fallback
                        if (dobDay === '00') {
                            const cur = await this.prisma.employee.findUnique({ where: { id }, select: { dateOfBirth: true } });
                            if (cur?.dateOfBirth)
                                dobDay = String(new Date(cur.dateOfBirth).getDate()).padStart(2, '0');
                        }
                        const now = new Date();
                        const pwd = `${org?.acronym || 'ORG'}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}${dobDay}`;
                        const hash = await bcrypt.hash(pwd, 10);
                        const newUser = await this.prisma.user.create({ data: { organizationId: orgId, email: dto.email, phone: dto.phone, passwordHash: hash, role: dto.role || 'employee', mustChangePassword: true } });
                        await this.prisma.employee.update({ where: { id }, data: { userId: newUser.id } });
                    }
                }
                else if (userUpdates.phone || userUpdates.role) {
                    // Phone/role update without email and no linked user — nothing to update in users table
                    // Create a placeholder? Instead throw to make caller aware, or silently skip with update to employee if needed
                    // We keep consistency: require email to create user linkage
                    throw new common_1.ConflictException('Cannot update phone/role without linked user email — provide email first');
                }
            }
        }
        // Map frontend snake_case to prisma camelCase + stringify JSON fields
        const map = {};
        // Handle DOB
        if (dto.dob !== undefined)
            dto.date_of_birth = dto.dob;
        if (dto.date_of_birth !== undefined) {
            const d = dto.date_of_birth ? new Date(dto.date_of_birth) : null;
            if (d && !isNaN(d.getTime()))
                map['dateOfBirth'] = d;
            else if (!dto.date_of_birth)
                map['dateOfBirth'] = null;
        }
        if (dto.birth_date !== undefined) {
            const d = new Date(dto.birth_date);
            if (!isNaN(d.getTime()))
                map['dateOfBirth'] = d;
        }
        if (dto.job_title !== undefined)
            map.jobTitle = dto.job_title;
        if (dto.jobTitle !== undefined)
            map.jobTitle = dto.jobTitle;
        if (dto.grade !== undefined)
            map.grade = dto.grade;
        if (dto.department_id !== undefined)
            map.departmentId = dto.department_id;
        if (dto.departmentId !== undefined)
            map.departmentId = dto.departmentId;
        if (dto.branch_id !== undefined)
            map.branchId = dto.branch_id;
        if (dto.branchId !== undefined)
            map.branchId = dto.branchId;
        if (dto.manager_id !== undefined)
            map.managerId = dto.manager_id;
        if (dto.managerId !== undefined)
            map.managerId = dto.managerId;
        if (dto.employment_type !== undefined)
            map.employmentType = dto.employment_type;
        if (dto.employmentType !== undefined)
            map.employmentType = dto.employmentType;
        if (dto.work_arrangement !== undefined)
            map.workArrangement = dto.work_arrangement;
        if (dto.workArrangement !== undefined)
            map.workArrangement = dto.workArrangement;
        if (dto.status !== undefined)
            map.status = dto.status;
        if (dto.skills !== undefined)
            map.skills = Array.isArray(dto.skills) ? JSON.stringify(dto.skills) : dto.skills;
        if (dto.photoUrl !== undefined)
            map.photoUrl = dto.photoUrl;
        if (dto.hire_date !== undefined)
            map.hireDate = dto.hire_date ? new Date(dto.hire_date) : null;
        if (dto.hireDate !== undefined)
            map.hireDate = dto.hireDate ? new Date(dto.hireDate) : null;
        if (dto.date_of_birth !== undefined && !map['dateOfBirth']) {
            const d = new Date(dto.date_of_birth);
            if (!isNaN(d.getTime()))
                map.dateOfBirth = d;
        }
        // copy any other direct fields
        for (const k of ['jobTitle', 'grade', 'departmentId', 'branchId', 'managerId', 'employmentType', 'workArrangement', 'status', 'photoUrl', 'skills', 'dateOfBirth']) {
            if (dto[k] !== undefined && map[k] === undefined)
                map[k] = dto[k];
        }
        if (Object.keys(map).length === 0 && Object.keys(userUpdates).length === 0)
            throw new common_1.ConflictException('No fields to update');
        if (Object.keys(map).length) {
            await this.prisma.employee.update({ where: { id }, data: map });
        }
        // Return fresh employee with user included so frontend can repopulate edit form
        const fresh = await this.prisma.employee.findUnique({ where: { id }, include: { user: { select: { id: true, email: true, phone: true, role: true } }, department: true, branch: true } });
        return fresh;
    }
    async timeline(orgId, id, date, user) {
        // timeline is attendance:read — employee can only view self
        if (user?.role === 'employee') {
            const ownId = await this.resolveEmployeeIdFromUser(user);
            if (ownId !== id)
                throw new common_1.ForbiddenException('Access denied');
        }
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const events = await this.prisma.attendanceEvent.findMany({
            where: { organizationId: orgId, employeeId: id, timestamp: { gte: start, lte: end } },
            orderBy: { timestamp: 'asc' },
        });
        return { date, events: events.map(e => ({ time: e.timestamp.toISOString().slice(11, 16), activity: e.eventType, method: e.verificationMethod, verification: e.verificationStatus })) };
    }
    async passport(orgId, id, fields, user) {
        if (user?.role === 'employee') {
            const ownId = await this.resolveEmployeeIdFromUser(user);
            if (ownId !== id)
                throw new common_1.ForbiddenException('Access denied');
        }
        return this.prisma.employee.findFirst({ where: { id, organizationId: orgId }, select: { employeeCode: true, jobTitle: true, grade: true, skills: true, hireDate: true } });
    }
    async enrollFace(orgId, id, dto, user) {
        const emp = await this.prisma.employee.findFirst({ where: { id, organizationId: orgId } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        if (user?.role === 'employee') {
            const ownId = await this.resolveEmployeeIdFromUser(user);
            if (ownId !== id)
                throw new common_1.ForbiddenException('Employees can only enroll own face');
        }
        // dto: { images: string[] (base64), descriptors?: number[][], consent: boolean }
        const images = dto.images || (dto.faceProfileRef ? [dto.faceProfileRef] : (dto.image ? [dto.image] : []));
        const descriptors = dto.descriptors || [];
        if (!images.length)
            throw new common_1.ConflictException('No face images provided');
        if (images.length > 5)
            throw new common_1.ConflictException('Max 5 images');
        // Basic validation: must be data:image
        for (const img of images)
            if (!img.startsWith('data:image'))
                throw new common_1.ConflictException('Invalid image format');
        // Store both images (truncated) and descriptors for intelligent matching (Euclidean <0.4)
        const toStore = JSON.stringify({
            images: images.map(s => s.slice(0, 8000)),
            descriptors: descriptors.filter(d => Array.isArray(d) && d.length === 128).slice(0, 5),
            updatedAt: new Date().toISOString(),
        });
        const updated = await this.prisma.employee.update({
            where: { id },
            data: { faceProfileRef: toStore, consentFace: dto.consent !== false },
        });
        await this.prisma.consentLog.create({
            data: { employeeId: id, type: 'face', granted: true, version: '1.0', ip: dto.ip || null },
        }).catch(() => { });
        return { employeeId: id, enrolled: images.length, faceProfileRef: toStore, consentFace: true, descriptors: descriptors.length };
    }
    async getFaceProfile(orgId, id, user) {
        const emp = await this.prisma.employee.findFirst({ where: { id, organizationId: orgId }, select: { id: true, employeeCode: true, faceProfileRef: true, consentFace: true, photoUrl: true } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        if (user?.role === 'employee') {
            const ownId = await this.resolveEmployeeIdFromUser(user);
            if (ownId !== id)
                throw new common_1.ForbiddenException('Access denied');
        }
        let count = 0;
        let hasDescriptor = false;
        try {
            const parsed = emp.faceProfileRef ? JSON.parse(emp.faceProfileRef) : null;
            if (Array.isArray(parsed))
                count = parsed.length;
            else if (parsed && Array.isArray(parsed.images)) {
                count = parsed.images.length;
                hasDescriptor = Array.isArray(parsed.descriptors) && parsed.descriptors.length > 0;
            }
            else if (parsed && typeof parsed === 'object')
                count = 0;
        }
        catch { }
        return { employeeId: emp.id, employeeCode: emp.employeeCode, enrolled: count > 0, count, hasDescriptor, consentFace: emp.consentFace, hasPhoto: !!emp.photoUrl };
    }
    bulkTemplate(orgId) {
        const header = 'job_title,grade,department,branch,employment_type,work_arrangement,hire_date,dob,skills,phone,email';
        const example = [
            'Software Engineer,L2,Engineering,Lagos Head Office,permanent,office,2024-01-15,1995-06-15,"React,Node",08012345678,eng1@company.com',
            'HR Officer,H2,Human Resources,Lagos Head Office,permanent,hybrid,2024-02-01,1990-12-02,"HRIS,Payroll",08087654321,hr@company.com',
        ].join('\n');
        return { header, example, csv: `${header}\n${example}\n`, count: 300, note: 'Upload CSV with header above. department/branch by name (will auto-create if not found). skills comma-separated in quotes. Max 500 rows per bulk.' };
    }
    async createBulkExcel(orgId, file, user) {
        if (!file || !file.buffer)
            throw new common_1.ConflictException('No file uploaded. Use field name \"file\" with .xlsx');
        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(file.buffer);
        const ws = wb.getWorksheet('Employees') || wb.worksheets[0];
        if (!ws)
            throw new common_1.ConflictException('No worksheet found');
        const headerRow = ws.getRow(1);
        const headers = [];
        headerRow.eachCell((cell, colNumber) => { headers[colNumber - 1] = String(cell.value || '').trim().toLowerCase(); });
        const list = [];
        ws.eachRow((row, rowNumber) => {
            if (rowNumber <= 1)
                return;
            // Skip empty rows and example rows that are highlighted? Include all with job_title
            const obj = {};
            let hasData = false;
            row.eachCell((cell, colNumber) => {
                const h = headers[colNumber - 1];
                if (!h)
                    return;
                let v = cell.value;
                if (v && typeof v === 'object' && v.text)
                    v = v.text;
                if (v && typeof v === 'object' && v.result)
                    v = v.result;
                v = v == null ? '' : String(v).trim();
                if (v)
                    hasData = true;
                obj[h] = v;
            });
            // Only push if has job_title
            if (hasData && obj['job_title'])
                list.push(obj);
        });
        if (!list.length)
            throw new common_1.ConflictException('No data rows found in Excel. Fill rows 4+ with employee data.');
        return this.createBulk(orgId, { employees: list }, user);
    }
    async bulkTemplateExcel(orgId) {
        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        wb.creator = 'OneHR';
        wb.created = new Date();
        const ws = wb.addWorksheet('Employees', {
            properties: { tabColor: { argb: 'FF0F172A' } },
            pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
        });
        // Fetch dynamic dropdowns
        const depts = await this.prisma.department.findMany({ where: { organizationId: orgId }, select: { name: true } });
        const branches = await this.prisma.branch.findMany({ where: { organizationId: orgId }, select: { name: true } });
        const deptNames = depts.map(d => d.name);
        if (!deptNames.length)
            deptNames.push('Human Resources', 'Engineering', 'Finance', 'Operations');
        const branchNames = branches.map(b => b.name);
        if (!branchNames.length)
            branchNames.push('Lagos Head Office', 'Abuja Branch', 'Port Harcourt');
        const employmentTypes = ['permanent', 'contract', 'intern', 'volunteer', 'consultant', 'seasonal', 'part_time', 'full_time'];
        const workArrangements = ['office', 'remote', 'hybrid', 'field', 'mobile', 'shift', 'flexible', 'project_based', 'contract', 'seasonal', 'part_time', 'full_time', 'volunteer', 'intern', 'consultant'];
        const grades = ['L1', 'L2', 'L3', 'M1', 'M2', 'M3', 'H1', 'H2', 'H3', 'Executive'];
        const statuses = ['active', 'probation', 'suspended', 'exited', 'alumni'];
        // Hidden sheet for dropdown sources
        const ref = wb.addWorksheet('Dropdowns');
        ref.state = 'veryHidden';
        const setList = (col, list) => {
            list.forEach((v, i) => ref.getCell(i + 1, col).value = v);
            const colLetter = String.fromCharCode(64 + col);
            wb.definedNames.add(`Dropdown${col}`, `Dropdowns!$${colLetter}$1:$${colLetter}$${list.length}`);
        };
        setList(1, deptNames);
        setList(2, branchNames);
        setList(3, employmentTypes);
        setList(4, workArrangements);
        setList(5, grades);
        setList(6, statuses);
        // Header — dob added for password generation (Acronym+MMYYYY+DD)
        const headers = ['job_title*', 'grade', 'department', 'branch', 'employment_type', 'work_arrangement', 'hire_date', 'dob', 'skills', 'phone', 'email'];
        const headerRow = ws.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        ws.columns = [
            { header: 'job_title*', key: 'job_title', width: 22 },
            { header: 'grade', key: 'grade', width: 10 },
            { header: 'department', key: 'department', width: 18 },
            { header: 'branch', key: 'branch', width: 20 },
            { header: 'employment_type', key: 'employment_type', width: 16 },
            { header: 'work_arrangement', key: 'work_arrangement', width: 16 },
            { header: 'hire_date', key: 'hire_date', width: 14 },
            { header: 'dob', key: 'dob', width: 14 },
            { header: 'skills', key: 'skills', width: 22 },
            { header: 'phone', key: 'phone', width: 16 },
            { header: 'email', key: 'email', width: 24 },
        ];
        // Example rows — dob used for default password e.g., JSO12202602 (Acronym+MMYYYY+DD)
        const examples = [
            ['Software Engineer', 'L2', 'Engineering', 'Lagos Head Office', 'permanent', 'office', '2024-01-15', '1995-06-15', 'React, Node', '08012345678', 'eng1@company.com'],
            ['HR Officer', 'H2', 'Human Resources', 'Lagos Head Office', 'permanent', 'hybrid', '2024-02-01', 'HRIS, Payroll', '08087654321', 'hr@company.com'],
        ];
        examples.forEach(r => {
            const row = ws.addRow(r);
            row.eachCell((cell) => { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
        });
        // Style example rows as light gray
        for (let i = 2; i <= 3; i++)
            ws.getRow(i).eachCell((c) => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } });
        // Data validations for next 302 rows (up to 300 + header + examples)
        const lastRow = 305;
        const addValidation = (colLetter, formula, startRow = 4) => {
            for (let r = startRow; r <= lastRow; r++) {
                ws.getCell(`${colLetter}${r}`).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: [formula],
                    showDropDown: false,
                };
            }
        };
        addValidation('C', '=Dropdown1'); // department
        addValidation('D', '=Dropdown2'); // branch
        addValidation('E', '=Dropdown3'); // employment_type
        addValidation('F', '=Dropdown4'); // work_arrangement
        addValidation('B', '=Dropdown5'); // grade
        // Note: status not in template but available for edit
        // Freeze header, autoFilter, notes
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.autoFilter = { from: 'A1', to: 'J1' };
        // Add comments/notes for dropdowns
        ws.getCell('C1').note = 'Select from existing departments or type new — will auto-create';
        ws.getCell('D1').note = 'Select branch — linked to departments';
        ws.getCell('E1').note = employmentTypes.join(', ');
        ws.getCell('F1').note = workArrangements.join(', ');
        // Instructions sheet
        const inst = wb.addWorksheet('Instructions');
        inst.getCell('A1').value = 'OneHR Bulk Upload — Instructions';
        inst.getCell('A1').font = { bold: true, size: 14 };
        inst.getCell('A2').value = '1. Fill rows 4-305 with employee data. Columns with * are required.';
        inst.getCell('A3').value = '2. Use dropdowns for employment_type, work_arrangement, grade, department, branch.';
        inst.getCell('A4').value = '3. Department dropdown is filtered by branch — select branch first then department.';
        inst.getCell('A5').value = '4. Skills: comma-separated in one cell, e.g., "React, Node"';
        inst.getCell('A6').value = '5. Upload this file at People → Bulk Upload → Choose Excel (.xlsx) — max 500 rows, 10mb';
        inst.getCell('A7').value = '6. New departments/branches typed will be auto-created.';
        inst.columns = [{ width: 100 }];
        const buf = await wb.xlsx.writeBuffer();
        return { buffer: buf, filename: `OneHR_Employees_Template_${new Date().toISOString().slice(0, 10)}.xlsx` };
    }
    async createBulk(orgId, dto, user) {
        const raw = Array.isArray(dto) ? dto : Array.isArray(dto.employees) ? dto.employees : Array.isArray(dto.data) ? dto.data : [];
        // Also support CSV string in dto.csv
        let list = raw;
        if (!list.length && typeof dto.csv === 'string' && dto.csv.trim()) {
            const lines = dto.csv.trim().split('\n');
            const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim())
                    continue;
                // naive CSV split respecting quotes
                const cols = [];
                let cur = '', inQ = false;
                for (const ch of line) {
                    if (ch === '"')
                        inQ = !inQ;
                    else if (ch === ',' && !inQ) {
                        cols.push(cur.trim().replace(/^"|"$/g, ''));
                        cur = '';
                    }
                    else
                        cur += ch;
                }
                cols.push(cur.trim().replace(/^"|"$/g, ''));
                const obj = {};
                header.forEach((h, idx) => obj[h] = cols[idx] || '');
                list.push(obj);
            }
        }
        if (!list.length)
            throw new common_1.ConflictException('No employees provided. Send {employees:[...]} or {csv:"header\\nrow"}');
        if (list.length > 500)
            throw new common_1.ConflictException('Max 500 per bulk. Split into batches.');
        // Resolve department/branch names to IDs for this org
        const depts = await this.prisma.department.findMany({ where: { organizationId: orgId } });
        const branches = await this.prisma.branch.findMany({ where: { organizationId: orgId } });
        const deptByName = new Map(depts.map(d => [d.name.toLowerCase(), d.id]));
        const branchByName = new Map(branches.map(b => [b.name.toLowerCase(), b.id]));
        // Fetch org acronym for password generation
        const orgForPwd = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { acronym: true } });
        const acronymForPwd = orgForPwd?.acronym || 'ORG';
        const nowForPwd = new Date();
        const mmForPwd = String(nowForPwd.getMonth() + 1).padStart(2, '0');
        const yyyyForPwd = String(nowForPwd.getFullYear());
        const results = [];
        const errors = [];
        const credentials = []; // for superadmin email template
        for (let idx = 0; idx < list.length; idx++) {
            const row = list[idx];
            try {
                // Map CSV header variants to service DTO
                const dobRaw = row.dob || row.date_of_birth || row.dateOfBirth || row.birth_date || row.birthDate || row.DOB;
                const payload = {
                    job_title: row.job_title || row.jobTitle || row.title || `Employee ${idx + 1}`,
                    grade: row.grade || 'L1',
                    department_id: row.department_id || row.departmentId || (row.department ? deptByName.get(String(row.department).toLowerCase()) : undefined),
                    branch_id: row.branch_id || row.branchId || (row.branch ? branchByName.get(String(row.branch).toLowerCase()) : undefined),
                    employment_type: row.employment_type || row.employmentType || 'permanent',
                    work_arrangement: row.work_arrangement || row.workArrangement || 'office',
                    hire_date: row.hire_date || row.hireDate || new Date().toISOString().slice(0, 10),
                    date_of_birth: dobRaw || undefined,
                    dob: dobRaw || undefined,
                    skills: row.skills ? (typeof row.skills === 'string' ? row.skills.split(',').map((s) => s.trim()).filter(Boolean) : row.skills) : [],
                    // Optional: create user if email provided
                    email: row.email || row.adminEmail || undefined,
                    phone: row.phone || undefined,
                };
                // Auto-create department/branch if name not found and name provided
                if (row.department && !payload.department_id) {
                    const created = await this.prisma.department.create({ data: { organizationId: orgId, name: String(row.department), branchId: payload.branch_id || branches[0]?.id } });
                    deptByName.set(String(row.department).toLowerCase(), created.id);
                    payload.department_id = created.id;
                }
                if (row.branch && !payload.branch_id) {
                    const createdB = await this.prisma.branch.create({ data: { organizationId: orgId, name: String(row.branch), isHeadOffice: false } });
                    branchByName.set(String(row.branch).toLowerCase(), createdB.id);
                    payload.branch_id = createdB.id;
                }
                // Upsert: if employee with same email already exists, update it (so edited Excel updates DB)
                let created;
                let isUpdate = false;
                if (payload.email) {
                    const existingUser = await this.prisma.user.findFirst({ where: { email: payload.email, organizationId: orgId } });
                    if (existingUser) {
                        const existingEmp = await this.prisma.employee.findFirst({ where: { userId: existingUser.id, organizationId: orgId } });
                        if (existingEmp) {
                            // Update existing employee with new data
                            created = await this.update(orgId, existingEmp.id, payload, user);
                            // Also ensure user password is regenerated if DOB provided (for upsert)
                            // Note: update handles email/phone/DOB, but we need to return generatedPassword for template
                            // Generate pwd as per spec for display
                            const dobRawForPwd = payload.date_of_birth || payload.dob;
                            let dobDayForPwd = '00';
                            if (dobRawForPwd) {
                                const d = new Date(dobRawForPwd);
                                if (!isNaN(d.getTime()))
                                    dobDayForPwd = String(d.getDate()).padStart(2, '0');
                            }
                            const pwdForUpdate = `${acronymForPwd}${mmForPwd}${yyyyForPwd}${dobDayForPwd}`;
                            created.generatedPassword = pwdForUpdate;
                            created.loginEmail = payload.email;
                            isUpdate = true;
                        }
                    }
                }
                if (!isUpdate) {
                    created = await this.create(orgId, payload, user);
                }
                const pwd = created.generatedPassword;
                const emailForCred = created.loginEmail || payload.email;
                results.push({ index: idx, employeeCode: created.employeeCode, id: created.id, email: emailForCred || null, hasLogin: !!emailForCred, updated: isUpdate });
                if (emailForCred && pwd) {
                    credentials.push({ index: idx, employeeCode: created.employeeCode, email: emailForCred, password: pwd, dob: payload.date_of_birth || payload.dob, phone: payload.phone, updated: isUpdate });
                }
                else if (emailForCred) {
                    // For updates where pwd not generated (existing user), still provide email for template but note password unchanged
                    credentials.push({ index: idx, employeeCode: created.employeeCode, email: emailForCred, password: '(unchanged - see previous bulk)', dob: payload.date_of_birth || payload.dob, phone: payload.phone, updated: isUpdate });
                }
            }
            catch (e) {
                errors.push({ index: idx, error: e.message, row });
            }
        }
        return { total: list.length, success: results.length, failed: errors.length, results, errors, credentials, message: credentials.length ? `Created ${results.length} employees. ${credentials.length} logins generated with default password Acronym+MMYYYY+DD (must change on first login).` : `Created ${results.length} employees.` };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesService);
