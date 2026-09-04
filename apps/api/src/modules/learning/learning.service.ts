import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LearningService {
  constructor(private prisma: PrismaService) {}
  async courses(orgId: string, q: any) {
    const where: any = { organizationId: orgId };
    if (q.category) where.category = q.category;
    if (q.status) where.status = q.status;
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    return this.prisma.course.findMany({ where, take: 50, orderBy: { createdAt: 'desc' }, include: { enrollments: true } });
  }
  async getCourse(orgId: string, id: string) {
    const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
    if (!c) throw new NotFoundException('Course not found');
    return c;
  }
  async createCourse(orgId: string, dto: any) {
    if (!dto.title) throw new ConflictException('title required');
    if (!dto.category) throw new ConflictException('category required');
    return this.prisma.course.create({ data: { organizationId: orgId, title: dto.title, description: dto.description, category: dto.category, duration: dto.duration ? parseInt(dto.duration) : 0, status: dto.status || 'ACTIVE' } });
  }
  async updateCourse(orgId: string, id: string, dto: any) {
    const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
    if (!c) throw new NotFoundException('Course not found');
    return this.prisma.course.update({ where: { id }, data: { title: dto.title, description: dto.description, category: dto.category, duration: dto.duration ? parseInt(dto.duration) : undefined, status: dto.status } });
  }
  async removeCourse(orgId: string, id: string) {
    const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
    if (!c) throw new NotFoundException('Course not found');
    await this.prisma.learningEnrollment.deleteMany({ where: { courseId: id } });
    return this.prisma.course.delete({ where: { id } });
  }
  async enroll(orgId: string, dto: any, user?: any) {
    if (!dto.employeeId && !dto.employee_id) throw new ConflictException('employeeId required');
    if (!dto.courseId && !dto.course_id) throw new ConflictException('courseId required');
    const employeeId = dto.employeeId || dto.employee_id;
    const courseId = dto.courseId || dto.course_id;
    // validate org
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!emp) throw new NotFoundException('Employee not in org');
    const course = await this.prisma.course.findFirst({ where: { id: courseId, organizationId: orgId } });
    if (!course) throw new NotFoundException('Course not found');
    if (user?.role === 'employee') {
      const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (own?.id !== employeeId) throw new ForbiddenException('Can only enroll self');
    }
    return this.prisma.learningEnrollment.upsert({
      where: { employeeId_courseId: { employeeId, courseId } },
      create: { employeeId, courseId, progress: dto.progress || 0, status: dto.status || 'ENROLLED' },
      update: { progress: dto.progress, status: dto.status, completedAt: dto.progress === 100 ? new Date() : undefined },
    });
  }
  async enrollments(orgId: string, employeeId: string, user?: any) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    if (user?.role === 'employee') {
      const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (own?.id !== employeeId) throw new ForbiddenException('Can only view own enrollments');
    }
    return this.prisma.learningEnrollment.findMany({ where: { employeeId }, include: { course: true } });
  }
  async updateProgress(orgId: string, id: string, dto: any, user?: any) {
    const en = await this.prisma.learningEnrollment.findUnique({ where: { id }, include: { employee: true } });
    if (!en || (en.employee as any).organizationId !== orgId) throw new NotFoundException('Enrollment not found');
    if (user?.role === 'employee') {
      const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (own?.id !== en.employeeId) throw new ForbiddenException('Can only update own progress');
    }
    return this.prisma.learningEnrollment.update({ where: { id }, data: { progress: dto.progress, status: dto.status, completedAt: dto.progress === 100 ? new Date() : dto.status === 'COMPLETED' ? new Date() : null } });
  }
}
