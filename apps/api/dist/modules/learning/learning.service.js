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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const quiz_generator_1 = require("./quiz-generator");
async function extractPdfText(buffer) {
    // pdf-parse v2 (class based) — falls back to v1 (function) for older installs
    const mod = require('pdf-parse');
    if (mod?.PDFParse) {
        const parser = new mod.PDFParse({ data: buffer });
        try {
            const result = await parser.getText();
            return (result?.text || '').trim();
        }
        finally {
            try {
                await parser.destroy();
            }
            catch { }
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
let LearningService = class LearningService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listCourses(orgId) {
        try {
            return await this.prisma.course.findMany({ where: { organizationId: orgId }, include: { enrollments: true, materials: true, quiz: { include: { questions: true } } }, orderBy: { createdAt: 'desc' } });
        }
        catch (e) {
            // Fallback if new relations/tables missing
            const courses = await this.prisma.course.findMany({ where: { organizationId: orgId }, include: { enrollments: true }, orderBy: { createdAt: 'desc' } });
            return courses.map((c) => ({ ...c, materials: [], quiz: null }));
        }
    }
    async getCourse(orgId, id) {
        try {
            const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId }, include: { materials: true, quiz: { include: { questions: true } } } });
            if (!c)
                throw new common_1.NotFoundException('Course not found');
            return c;
        }
        catch (e) {
            const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
            if (!c)
                throw new common_1.NotFoundException('Course not found');
            return { ...c, materials: [], quiz: null };
        }
    }
    async createCourse(orgId, dto) {
        return this.prisma.course.create({ data: { organizationId: orgId, title: dto.title, description: dto.description, category: dto.category, duration: Number(dto.duration) || 0, status: dto.status || 'ACTIVE' } });
    }
    async updateCourse(orgId, id, dto) {
        const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
        if (!c)
            throw new common_1.NotFoundException('Course not found');
        const data = {};
        if (dto.title !== undefined)
            data.title = dto.title;
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.category !== undefined)
            data.category = dto.category;
        if (dto.duration !== undefined)
            data.duration = Number(dto.duration);
        if (dto.status !== undefined)
            data.status = dto.status;
        return this.prisma.course.update({ where: { id }, data });
    }
    async removeCourse(orgId, id) {
        const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId } });
        if (!c)
            throw new common_1.NotFoundException('Course not found');
        return this.prisma.course.delete({ where: { id } });
    }
    async enroll(orgId, dto, user) {
        if (!dto.courseId && !dto.course_id)
            throw new common_1.ConflictException('courseId required');
        let employeeId = dto.employeeId || dto.employee_id || null;
        const courseId = dto.courseId || dto.course_id;
        let emp = null;
        if (employeeId) {
            emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
            if (!emp && user?.sub) {
                const ownByUser = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
                if (ownByUser && ownByUser.id === employeeId)
                    emp = ownByUser;
            }
        }
        if (!emp && user?.sub) {
            emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp)
                employeeId = emp.id;
        }
        if (!emp)
            throw new common_1.NotFoundException('Employee not in org');
        if (emp.organizationId && orgId && emp.organizationId !== orgId)
            throw new common_1.NotFoundException('Employee not in org');
        employeeId = emp.id;
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
            update: { progress: dto.progress ?? undefined, status: dto.status ?? undefined, completedAt: dto.progress === 100 ? new Date() : undefined },
        });
    }
    async listEnrollments(orgId, employeeId, user) {
        let emp = null;
        if (user?.role === 'employee') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own) {
                emp = own;
                employeeId = own.id;
            }
        }
        if (!emp && employeeId) {
            emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
            if (!emp) {
                try {
                    emp = await this.prisma.employee.findFirst({ where: { staffId: employeeId, organizationId: orgId } });
                }
                catch { }
            }
            if (emp && emp.organizationId && orgId && emp.organizationId !== orgId)
                emp = null;
        }
        if (!emp && user?.sub) {
            emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp)
                employeeId = emp.id;
        }
        if (!emp)
            throw new common_1.NotFoundException('Employee not in org');
        if (user?.role === 'employee' && emp.userId && user.sub && emp.userId !== user.sub) {
            throw new common_1.ForbiddenException('Can only view own enrollments');
        }
        return this.prisma.learningEnrollment.findMany({
            where: { employeeId: emp.id },
            include: {
                course: { include: { materials: true, quiz: { include: { questions: { select: { id: true } } } } } },
                attempts: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async uploadMaterial(orgId, courseId, file) {
        try {
            const course = await this.prisma.course.findFirst({ where: { id: courseId, organizationId: orgId } });
            if (!course)
                throw new common_1.NotFoundException('Course not found');
            if (!file)
                throw new common_1.BadRequestException('file required');
            const uploadsDir = path.resolve(process.cwd(), 'uploads', 'learning');
            if (!fs.existsSync(uploadsDir))
                fs.mkdirSync(uploadsDir, { recursive: true });
            const ext = path.extname(file.originalname) || '.pdf';
            const filename = `${courseId}-${Date.now()}${ext}`;
            const filepath = path.join(uploadsDir, filename);
            fs.writeFileSync(filepath, file.buffer);
            const url = `/uploads/learning/${filename}`;
            let extractedText = null;
            try {
                if (ext.toLowerCase() === '.pdf' || file.mimetype === 'application/pdf') {
                    extractedText = await extractPdfText(file.buffer);
                }
            }
            catch (e) {
                // best effort
            }
            const material = await this.prisma.learningMaterial.create({
                data: { courseId, filename, originalName: file.originalname, mimeType: file.mimetype || 'application/pdf', size: file.size || 0, url, extractedText }
            });
            return material;
        }
        catch (e) {
            if (e.message?.includes('learning_materials') || e.code === 'P2021') {
                throw new common_1.BadRequestException('Learning materials table not found. Run prisma db push to create tables.');
            }
            throw e;
        }
    }
    async generateQuiz(orgId, courseId, dto) {
        const course = await this.prisma.course.findFirst({ where: { id: courseId, organizationId: orgId }, include: { materials: true } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const text = (course.materials || []).map((m) => m.extractedText || '').join('\n\n');
        if (!text || text.trim().length < 100)
            throw new common_1.BadRequestException('Need extracted PDF text (>=100 chars). Upload a PDF first.');
        const questions = (0, quiz_generator_1.generateQuestions)(text, 5);
        if (!questions.length)
            throw new common_1.BadRequestException('Could not derive questions from the document. PDF may be image-based/scanned — text extraction required.');
        const total = questions.length;
        // HR/admin chooses how many of the questions must be answered correctly.
        const rawCount = dto?.passingCount ?? dto?.passing_count ?? dto?.minCorrect;
        const passingCount = rawCount === undefined || rawCount === null || rawCount === ''
            ? Math.ceil(total * 0.8)
            : Math.min(total, Math.max(1, parseInt(String(rawCount), 10) || 1));
        const passingScore = Math.round((passingCount / total) * 100);
        const quiz = await this.prisma.learningQuiz.upsert({
            where: { courseId },
            create: { courseId, title: `${course.title} Assessment`, passingScore },
            update: { title: `${course.title} Assessment`, passingScore }
        });
        await this.prisma.learningQuestion.deleteMany({ where: { quizId: quiz.id } });
        for (let i = 0; i < questions.length; i++) {
            await this.prisma.learningQuestion.create({
                data: { quizId: quiz.id, question: questions[i].question, options: JSON.stringify(questions[i].options), answer: questions[i].answer, order: i }
            });
        }
        return this.prisma.learningQuiz.findUnique({ where: { id: quiz.id }, include: { questions: { orderBy: { order: 'asc' } } } });
    }
    async updateQuizSettings(orgId, courseId, dto) {
        const course = await this.prisma.course.findFirst({ where: { id: courseId, organizationId: orgId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const quiz = await this.prisma.learningQuiz.findUnique({ where: { courseId }, include: { questions: true } });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not generated yet');
        const total = quiz.questions.length || 5;
        const rawCount = dto?.passingCount ?? dto?.passing_count ?? dto?.minCorrect;
        if (rawCount === undefined || rawCount === null || rawCount === '')
            throw new common_1.BadRequestException('passingCount required');
        const passingCount = Math.min(total, Math.max(1, parseInt(String(rawCount), 10) || 1));
        const passingScore = Math.round((passingCount / total) * 100);
        const updated = await this.prisma.learningQuiz.update({ where: { id: quiz.id }, data: { passingScore } });
        return { ...updated, passingCount, total };
    }
    async getQuizForEnrollment(orgId, enrollmentId, user) {
        const enr = await this.prisma.learningEnrollment.findUnique({ where: { id: enrollmentId }, include: { course: true, employee: true } });
        if (!enr)
            throw new common_1.NotFoundException('Enrollment not found');
        if (enr.course.organizationId !== orgId)
            throw new common_1.NotFoundException('Enrollment not found');
        if (user?.role === 'employee') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own?.id !== enr.employeeId)
                throw new common_1.ForbiddenException('Can only take own quiz');
        }
        const quiz = await this.prisma.learningQuiz.findUnique({ where: { courseId: enr.courseId }, include: { questions: { orderBy: { order: 'asc' }, select: { id: true, question: true, options: true, order: true } } } });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not generated yet');
        const total = quiz.questions.length;
        const passingCount = Math.max(1, Math.round((quiz.passingScore / 100) * total));
        return {
            enrollmentId: enr.id,
            status: enr.status,
            progress: enr.progress,
            employeeId: enr.employeeId,
            course: { id: enr.course.id, title: enr.course.title, description: enr.course.description, category: enr.course.category },
            quiz: { id: quiz.id, title: quiz.title, passingScore: quiz.passingScore, passingCount, total, questions: quiz.questions.map(q => ({ ...q, options: JSON.parse(q.options) })) },
        };
    }
    async submitQuiz(orgId, enrollmentId, dto, user) {
        const enr = await this.prisma.learningEnrollment.findUnique({ where: { id: enrollmentId }, include: { course: true } });
        if (!enr)
            throw new common_1.NotFoundException('Enrollment not found');
        if (enr.course.organizationId !== orgId)
            throw new common_1.NotFoundException('Enrollment not found');
        if (user?.role === 'employee') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own?.id !== enr.employeeId)
                throw new common_1.ForbiddenException('Can only submit own quiz');
        }
        const quiz = await this.prisma.learningQuiz.findUnique({ where: { courseId: enr.courseId }, include: { questions: true } });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not generated yet');
        const answers = Array.isArray(dto.answers) ? dto.answers : [];
        let correct = 0;
        const review = quiz.questions.map((q) => {
            const a = answers.find((x) => x.questionId === q.id);
            const isCorrect = !!a && a.answer === q.answer;
            if (isCorrect)
                correct++;
            return { questionId: q.id, question: q.question, selected: a?.answer ?? null, correctAnswer: q.answer, isCorrect };
        });
        const total = quiz.questions.length;
        const passingCount = Math.max(1, Math.round(((quiz.passingScore || 80) / 100) * total));
        const score = Math.round((correct / Math.max(1, total)) * 100);
        const passed = correct >= passingCount;
        await this.prisma.learningAttempt.create({ data: { enrollmentId: enr.id, quizId: quiz.id, answers: JSON.stringify(answers), score, passed } });
        if (passed) {
            await this.prisma.learningEnrollment.update({ where: { id: enr.id }, data: { progress: 100, status: 'COMPLETED', completedAt: new Date() } });
        }
        else {
            await this.prisma.learningEnrollment.update({ where: { id: enr.id }, data: { progress: Math.max(enr.progress || 0, Math.min(99, score)), status: enr.status === 'ENROLLED' ? 'IN_PROGRESS' : enr.status } });
        }
        return { score, passed, correct, total, passingCount, passingScore: quiz.passingScore || 80, review, status: passed ? 'COMPLETED' : 'IN_PROGRESS' };
    }
};
exports.LearningService = LearningService;
exports.LearningService = LearningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LearningService);
