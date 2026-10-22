import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { generateQuestions } from './quiz-generator';

async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse v2 (class based) — falls back to v1 (function) for older installs
  const mod: any = require('pdf-parse');
  if (mod?.PDFParse) {
    const parser = new mod.PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return (result?.text || '').trim();
    } finally {
      try { await parser.destroy(); } catch {}
    }
  }
  if (typeof mod === 'function') {
    const data = await mod(buffer);
    return (data?.text || '').trim();
  }
  if (mod?.default) {
    const data = await mod.default(buffer);
    return (data?.text || '').trim();
  }
  throw new Error('Unsupported pdf-parse export');
}

@Injectable()
export class LearningService {
  constructor(private prisma: PrismaService) {}

  async listCourses(orgId: string) {
    try {
      return await this.prisma.course.findMany({ where: { organizationId: orgId }, include: { enrollments: true, materials: true, quiz: { include: { questions: true } } }, orderBy: { createdAt: 'desc' } });
    } catch (e) {
      // Fallback if new relations/tables missing
      const courses = await this.prisma.course.findMany({ where: { organizationId: orgId }, include: { enrollments: true }, orderBy: { createdAt: 'desc' } });
      return courses.map((c: any) => ({ ...c, materials: [], quiz: null }));
    }
  }
  async getCourse(orgId: string, id: string) {
    try {
      const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId }, include: { materials: true, quiz: { include: { questions: true } } } });
      if (!c) throw new NotFoundException('Course not found');
      return c;
    } catch (e) {
      const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
      if (!c) throw new NotFoundException('Course not found');
      return { ...c, materials: [], quiz: null };
    }
  }
  async createCourse(orgId: string, dto: any) {
    return this.prisma.course.create({ data: { organizationId: orgId, title: dto.title, description: dto.description, category: dto.category, duration: Number(dto.duration)||0, status: dto.status||'ACTIVE' } });
  }
  async updateCourse(orgId: string, id: string, dto: any) {
    const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
    if (!c) throw new NotFoundException('Course not found');
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.duration !== undefined) data.duration = Number(dto.duration);
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.course.update({ where: { id }, data });
  }
  async removeCourse(orgId: string, id: string) {
    const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
    if (!c) throw new NotFoundException('Course not found');
    return this.prisma.course.delete({ where: { id } });
  }

  async enroll(orgId: string, dto: any, user?: any) {
    if (!dto.courseId && !dto.course_id) throw new ConflictException('courseId required');
    let employeeId = dto.employeeId || dto.employee_id || null;
    const courseId = dto.courseId || dto.course_id;

    let emp: any = null;
    if (employeeId) {
      emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
      if (!emp && user?.sub) {
        const ownByUser = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
        if (ownByUser && ownByUser.id === employeeId) emp = ownByUser;
      }
    }
    if (!emp && user?.sub) {
      emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (emp) employeeId = emp.id;
    }
    if (!emp) throw new NotFoundException('Employee not in org');
    if (emp.organizationId && orgId && emp.organizationId !== orgId) throw new NotFoundException('Employee not in org');
    employeeId = emp.id;

    const course = await this.prisma.course.findFirst({ where: { id: courseId, organizationId: orgId } });
    if (!course) throw new NotFoundException('Course not found');
    if (user?.role === 'employee') {
      const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (own?.id !== employeeId) throw new ForbiddenException('Can only enroll self');
    }
    return this.prisma.learningEnrollment.upsert({
      where: { employeeId_courseId: { employeeId, courseId } },
      create: { employeeId, courseId, progress: dto.progress || 0, status: dto.status || 'ENROLLED' },
      update: { progress: dto.progress ?? undefined, status: dto.status ?? undefined, completedAt: dto.progress === 100 ? new Date() : undefined },
    });
  }

  async listEnrollments(orgId: string, employeeId: string, user?: any) {
    if (user?.role === 'employee') {
      const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (own?.id !== employeeId) throw new ForbiddenException('Can only view own enrollments');
    }
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!emp) throw new NotFoundException('Employee not in org');
    return this.prisma.learningEnrollment.findMany({ where: { employeeId }, include: { course: true, attempts: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' } });
  }

  async uploadMaterial(orgId: string, courseId: string, file: any) {
    try {
      const course = await this.prisma.course.findFirst({ where: { id: courseId, organizationId: orgId } });
      if (!course) throw new NotFoundException('Course not found');
      if (!file) throw new BadRequestException('file required');
      const uploadsDir = path.resolve(process.cwd(), 'uploads', 'learning');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = path.extname(file.originalname) || '.pdf';
      const filename = `${courseId}-${Date.now()}${ext}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, file.buffer);
      const url = `/uploads/learning/${filename}`;
      let extractedText: string | null = null;
      try {
        if (ext.toLowerCase() === '.pdf' || file.mimetype === 'application/pdf') {
          extractedText = await extractPdfText(file.buffer);
        }
      } catch (e) {
        // best effort
      }
      const material = await (this.prisma as any).learningMaterial.create({
        data: { courseId, filename, originalName: file.originalname, mimeType: file.mimetype || 'application/pdf', size: file.size || 0, url, extractedText }
      });
      return material;
    } catch (e: any) {
      if (e.message?.includes('learning_materials') || e.code === 'P2021') {
        throw new BadRequestException('Learning materials table not found. Run prisma db push to create tables.');
      }
      throw e;
    }
  }

  async generateQuiz(orgId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, organizationId: orgId }, include: { materials: true } });
    if (!course) throw new NotFoundException('Course not found');
    const text = (course.materials || []).map((m) => m.extractedText || '').join('\n\n');
    if (!text || text.trim().length < 100) throw new BadRequestException('Need extracted PDF text (>=100 chars). Upload a PDF first.');
    const questions = generateQuestions(text, 5);
    if (!questions.length) throw new BadRequestException('Could not derive questions from the document. PDF may be image-based/scanned — text extraction required.');
    const quiz = await this.prisma.learningQuiz.upsert({
      where: { courseId },
      create: { courseId, title: `${course.title} Assessment`, passingScore: 80 },
      update: { title: `${course.title} Assessment`, passingScore: 80 }
    });
    await this.prisma.learningQuestion.deleteMany({ where: { quizId: quiz.id } });
    for (let i = 0; i < questions.length; i++) {
      await this.prisma.learningQuestion.create({
        data: { quizId: quiz.id, question: questions[i].question, options: JSON.stringify(questions[i].options), answer: questions[i].answer, order: i }
      });
    }
    return this.prisma.learningQuiz.findUnique({ where: { id: quiz.id }, include: { questions: { orderBy: { order: 'asc' } } } });
  }

  async getQuizForEnrollment(orgId: string, enrollmentId: string, user?: any) {
    const enr = await this.prisma.learningEnrollment.findUnique({ where: { id: enrollmentId }, include: { course: true, employee: true } });
    if (!enr) throw new NotFoundException('Enrollment not found');
    if (enr.course.organizationId !== orgId) throw new NotFoundException('Enrollment not found');
    if (user?.role === 'employee') {
      const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (own?.id !== enr.employeeId) throw new ForbiddenException('Can only take own quiz');
    }
    const quiz = await this.prisma.learningQuiz.findUnique({ where: { courseId: enr.courseId }, include: { questions: { orderBy: { order: 'asc' }, select: { id: true, question: true, options: true, order: true } } } });
    if (!quiz) throw new NotFoundException('Quiz not generated yet');
    return { enrollmentId: enr.id, course: enr.course, quiz: { id: quiz.id, passingScore: quiz.passingScore, questions: quiz.questions.map(q => ({ ...q, options: JSON.parse(q.options) })) } };
  }

  async submitQuiz(orgId: string, enrollmentId: string, dto: any, user?: any) {
    const enr = await this.prisma.learningEnrollment.findUnique({ where: { id: enrollmentId }, include: { course: true } });
    if (!enr) throw new NotFoundException('Enrollment not found');
    if (enr.course.organizationId !== orgId) throw new NotFoundException('Enrollment not found');
    if (user?.role === 'employee') {
      const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (own?.id !== enr.employeeId) throw new ForbiddenException('Can only submit own quiz');
    }
    const quiz = await this.prisma.learningQuiz.findUnique({ where: { courseId: enr.courseId }, include: { questions: true } });
    if (!quiz) throw new NotFoundException('Quiz not generated yet');
    const answers = Array.isArray(dto.answers) ? dto.answers : [];
    let correct = 0;
    for (const q of quiz.questions) {
      const a = answers.find((x: any) => x.questionId === q.id);
      if (a && a.answer === q.answer) correct++;
    }
    const score = Math.round((correct / Math.max(1, quiz.questions.length)) * 100);
    const passed = score >= (quiz.passingScore || 80);
    await this.prisma.learningAttempt.create({ data: { enrollmentId: enr.id, quizId: quiz.id, answers: JSON.stringify(answers), score, passed } });
    if (passed) {
      await this.prisma.learningEnrollment.update({ where: { id: enr.id }, data: { progress: 100, status: 'COMPLETED', completedAt: new Date() } });
    } else {
      await this.prisma.learningEnrollment.update({ where: { id: enr.id }, data: { progress: Math.max(enr.progress || 0, Math.min(99, score)), status: enr.status === 'ENROLLED' ? 'IN_PROGRESS' : enr.status } });
    }
    return { score, passed, correct, total: quiz.questions.length, status: passed ? 'COMPLETED' : 'IN_PROGRESS' };
  }
}
