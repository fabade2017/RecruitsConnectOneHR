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
let LearningService = class LearningService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listCourses(orgId) {
        return this.prisma.course.findMany({ where: { organizationId: orgId }, include: { enrollments: true, materials: true, quiz: { include: { questions: true } } }, orderBy: { createdAt: 'desc' } });
    }
    async getCourse(orgId, id) {
        const c = await this.prisma.course.findFirst({ where: { id, organizationId: orgId }, include: { materials: true, quiz: { include: { questions: true } } } });
        if (!c)
            throw new common_1.NotFoundException('Course not found');
        return c;
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
        if (user?.role === 'employee') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own?.id !== employeeId)
                throw new common_1.ForbiddenException('Can only view own enrollments');
        }
        const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not in org');
        return this.prisma.learningEnrollment.findMany({ where: { employeeId }, include: { course: true, attempts: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' } });
    }
    async uploadMaterial(orgId, courseId, file) {
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
                const pdfParse = require('pdf-parse');
                const data = await pdfParse(file.buffer);
                extractedText = data.text || '';
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
    async generateQuiz(orgId, courseId) {
        const course = await this.prisma.course.findFirst({ where: { id: courseId, organizationId: orgId }, include: { materials: true } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const text = (course.materials || []).map(m => m.extractedText || '').join('\n\n');
        if (!text || text.trim().length < 100)
            throw new common_1.BadRequestException('Need extracted PDF text (>=100 chars). Upload a PDF first.');
        // Simple deterministic MCQ generator from sentences
        const sentences = text.replace(/\r\n/g, '\n').split(/(?<=[.?!])\s+(?=[A-Z0-9(])/).map(s => s.trim()).filter(s => s.length > 40 && s.split(' ').length > 8);
        const picks = sentences.slice(0, 20);
        const questions = [];
        for (let i = 0; i < Math.min(5, picks.length); i++) {
            const s = picks[i];
            const words = s.split(/\s+/).filter(w => w.length > 4);
            const key = words[Math.floor(words.length / 2)] || words[0] || 'policy';
            const q = `According to the training material, which of the following best relates to: "${s.slice(0, 80)}..."?`;
            const opts = [
                `The ${key.replace(/[^A-Za-z]/g, '')} requirement as stated`,
                `A general unrelated procedure`,
                `An optional recommendation with no basis`,
                `A historical note not applicable`
            ];
            // ensure answer is first
            questions.push({ question: q, options: opts, answer: opts[0] });
        }
        if (questions.length < 5) {
            // fallback generic
            for (let i = questions.length; i < 5; i++) {
                questions.push({ question: `Question ${i + 1}: Based on the uploaded onboarding/training manual, select the correct practice.`, options: ['Follow approved procedure', 'Ignore guidelines', 'Guess randomly', 'Bypass controls'], answer: 'Follow approved procedure' });
            }
        }
        const quiz = await this.prisma.learningQuiz.upsert({
            where: { courseId },
            create: { courseId, title: `${course.title} Assessment`, passingScore: 80 },
            update: { title: `${course.title} Assessment`, passingScore: 80 }
        });
        // replace questions
        await this.prisma.learningQuestion.deleteMany({ where: { quizId: quiz.id } });
        for (let i = 0; i < questions.length; i++) {
            await this.prisma.learningQuestion.create({
                data: { quizId: quiz.id, question: questions[i].question, options: JSON.stringify(questions[i].options), answer: questions[i].answer, order: i }
            });
        }
        return this.prisma.learningQuiz.findUnique({ where: { id: quiz.id }, include: { questions: { orderBy: { order: 'asc' } } } });
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
        return { enrollmentId: enr.id, course: enr.course, quiz: { id: quiz.id, passingScore: quiz.passingScore, questions: quiz.questions.map(q => ({ ...q, options: JSON.parse(q.options) })) } };
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
        for (const q of quiz.questions) {
            const a = answers.find((x) => x.questionId === q.id);
            if (a && a.answer === q.answer)
                correct++;
        }
        const score = Math.round((correct / Math.max(1, quiz.questions.length)) * 100);
        const passed = score >= (quiz.passingScore || 80);
        await this.prisma.learningAttempt.create({ data: { enrollmentId: enr.id, quizId: quiz.id, answers: JSON.stringify(answers), score, passed } });
        if (passed) {
            await this.prisma.learningEnrollment.update({ where: { id: enr.id }, data: { progress: 100, status: 'COMPLETED', completedAt: new Date() } });
        }
        else {
            await this.prisma.learningEnrollment.update({ where: { id: enr.id }, data: { progress: Math.max(enr.progress || 0, Math.min(99, score)), status: enr.status === 'ENROLLED' ? 'IN_PROGRESS' : enr.status } });
        }
        return { score, passed, correct, total: quiz.questions.length, status: passed ? 'COMPLETED' : 'IN_PROGRESS' };
    }
};
exports.LearningService = LearningService;
exports.LearningService = LearningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LearningService);
