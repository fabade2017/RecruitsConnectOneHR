"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LearningService = class LearningService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async courses(orgId, q) {
        const where = { organizationId: orgId };
        if (q.category)
            where.category = q.category;
        if (q.status)
            where.status = q.status;
        if (q.search)
            where.title = { contains: q.search, mode: 'insensitive' };
        return this.prisma.course.findMany({ where, take: 50, orderBy: { createdAt: 'desc' }, include: { enrollments: true } });
    }
    async getCourse(orgId, id) {
        const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
        if (!c)
            throw new common_1.NotFoundException('Course not found');
        return c;
    }
    async createCourse(orgId, dto) {
        if (!dto.title)
            throw new common_1.ConflictException('title required');
        if (!dto.category)
            throw new common_1.ConflictException('category required');
        return this.prisma.course.create({ data: { organizationId: orgId, title: dto.title, description: dto.description, category: dto.category, duration: dto.duration ? parseInt(dto.duration) : 0, status: dto.status || 'ACTIVE' } });
    }
    async updateCourse(orgId, id, dto) {
        const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
        if (!c)
            throw new common_1.NotFoundException('Course not found');
        return this.prisma.course.update({ where: { id }, data: { title: dto.title, description: dto.description, category: dto.category, duration: dto.duration ? parseInt(dto.duration) : undefined, status: dto.status } });
    }
    async removeCourse(orgId, id) {
        const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
        if (!c)
            throw new common_1.NotFoundException('Course not found');
        await this.prisma.learningEnrollment.deleteMany({ where: { courseId: id } });
        return this.prisma.course.delete({ where: { id } });
    }
    async enroll(orgId, dto, user) {
        if (!dto.employeeId && !dto.employee_id)
            throw new common_1.ConflictException('employeeId required');
        if (!dto.courseId && !dto.course_id)
            throw new common_1.ConflictException('courseId required');
        const employeeId = dto.employeeId || dto.employee_id;
        const courseId = dto.courseId || dto.course_id;
        // validate org
        const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not in org');
        const course = await this.prisma.course.findFirst({ where: { id: courseId, organizationId: orgId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        if (user?.role === 'employee') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own?.id !== employeeId)
                throw new common_1.ForbiddenException('Can only enroll self');
        }
        return this.prisma.learningEnrollment.upsert({
            where: { employeeId_courseId: { employeeId, courseId } },
            create: { employeeId, courseId, progress: dto.progress || 0, status: dto.status || 'ENROLLED' },
            update: { progress: dto.progress, status: dto.status, completedAt: dto.progress === 100 ? new Date() : undefined },
        });
    }
    async enrollments(orgId, employeeId, user) {
        const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        if (user?.role === 'employee') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own?.id !== employeeId)
                throw new common_1.ForbiddenException('Can only view own enrollments');
        }
        return this.prisma.learningEnrollment.findMany({ where: { employeeId }, include: { course: true } });
    }
    async updateProgress(orgId, id, dto, user) {
        const en = await this.prisma.learningEnrollment.findUnique({ where: { id }, include: { employee: true } });
        if (!en || en.employee.organizationId !== orgId)
            throw new common_1.NotFoundException('Enrollment not found');
        if (user?.role === 'employee') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own?.id !== en.employeeId)
                throw new common_1.ForbiddenException('Can only update own progress');
        }
        return this.prisma.learningEnrollment.update({ where: { id }, data: { progress: dto.progress, status: dto.status, completedAt: dto.progress === 100 ? new Date() : dto.status === 'COMPLETED' ? new Date() : null } });
    }
};
exports.LearningService = LearningService;
exports.LearningService = LearningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LearningService);
