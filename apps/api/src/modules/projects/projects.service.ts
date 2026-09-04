import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, q: any, user?: any) {
    const where: any = { organizationId: orgId };
    if (q.status) where.status = q.status;
    if (q.search) where.name = { contains: q.search, mode: 'insensitive' };
    const projects = await this.prisma.project.findMany({
      where,
      take: Math.min(parseInt(q.limit || '50'), 100),
      orderBy: { createdAt: 'desc' },
      include: { tasks: true },
    });
    return projects;
  }

  async get(orgId: string, id: string) {
    const p = await this.prisma.project.findFirst({ where: { id, organizationId: orgId }, include: { tasks: true } });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  async create(orgId: string, dto: any, user?: any) {
    if (!dto.name) throw new NotFoundException('Name required');
    return this.prisma.project.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
        status: dto.status || 'active',
        ownerId: dto.owner_id || dto.ownerId || null,
        startDate: dto.start_date ? new Date(dto.start_date) : dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.end_date ? new Date(dto.end_date) : dto.endDate ? new Date(dto.endDate) : null,
        metadata: JSON.stringify(dto.metadata || {}),
      },
    });
  }

  async update(orgId: string, id: string, dto: any) {
    const exists = await this.prisma.project.findFirst({ where: { id, organizationId: orgId } });
    if (!exists) throw new NotFoundException('Project not found');
    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        ownerId: dto.owner_id || dto.ownerId,
        startDate: dto.start_date ? new Date(dto.start_date) : dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.end_date ? new Date(dto.end_date) : dto.endDate ? new Date(dto.endDate) : undefined,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : undefined,
      },
    });
  }

  async remove(orgId: string, id: string) {
    const exists = await this.prisma.project.findFirst({ where: { id, organizationId: orgId } });
    if (!exists) throw new NotFoundException('Project not found');
    await this.prisma.task.deleteMany({ where: { projectId: id } });
    return this.prisma.project.delete({ where: { id } });
  }

  async listTasks(orgId: string, projectId: string, q: any) {
    const proj = await this.prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
    if (!proj) throw new NotFoundException('Project not found');
    const where: any = { projectId };
    if (q.status) where.status = q.status;
    if (q.assignee_id) where.assigneeId = q.assignee_id;
    return this.prisma.task.findMany({ where, take: 100, orderBy: { createdAt: 'desc' }, include: { assignee: true } });
  }

  async createTask(orgId: string, projectId: string, dto: any) {
    const proj = await this.prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
    if (!proj) throw new NotFoundException('Project not found');
    if (!dto.title) throw new NotFoundException('Title required');
    return this.prisma.task.create({
      data: {
        organizationId: orgId,
        projectId,
        title: dto.title,
        description: dto.description,
        status: dto.status || 'todo',
        priority: dto.priority || 'medium',
        assigneeId: dto.assignee_id || dto.assigneeId || null,
        dueDate: dto.due_date ? new Date(dto.due_date) : dto.dueDate ? new Date(dto.dueDate) : null,
        estimatedHours: dto.estimated_hours || dto.estimatedHours || null,
      },
    });
  }

  async listAllTasks(orgId: string, q: any, user?: any) {
    const where: any = { organizationId: orgId };
    if (q.status) where.status = q.status;
    if (q.project_id) where.projectId = q.project_id;
    if (q.assignee_id) where.assigneeId = q.assignee_id;
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (emp) where.assigneeId = emp.id;
    }
    return this.prisma.task.findMany({ where, take: 100, orderBy: { createdAt: 'desc' }, include: { project: true, assignee: true } });
  }

  async updateTask(orgId: string, id: string, dto: any, user?: any) {
    const t = await this.prisma.task.findFirst({ where: { id, organizationId: orgId } });
    if (!t) throw new NotFoundException('Task not found');
    // employees can only update own tasks
    if (user?.role === 'employee') {
      const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
      if (t.assigneeId !== emp?.id) throw new ForbiddenException('Can only update own tasks');
    }
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'done') data.completedAt = new Date();
    }
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignee_id !== undefined) data.assigneeId = dto.assignee_id;
    if (dto.assigneeId !== undefined) data.assigneeId = dto.assigneeId;
    if (dto.due_date !== undefined) data.dueDate = dto.due_date ? new Date(dto.due_date) : null;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    return this.prisma.task.update({ where: { id }, data });
  }

  async workload(orgId: string, employeeId: string) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    const tasks = await this.prisma.task.findMany({ where: { assigneeId: employeeId, status: { not: 'done' } } });
    const overtimeAgg = await this.prisma.workSession.aggregate({ where: { employeeId, organizationId: orgId }, _sum: { overtimeMinutes: true } });
    const overtime = overtimeAgg._sum.overtimeMinutes || 0;
    const deadlines = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length;
    let score = tasks.length * 5 + overtime / 60 + deadlines * 10;
    let workload: string = 'balanced';
    if (score > 80) workload = 'critical';
    else if (score > 40) workload = 'high';
    return { employeeId, workload, score: Math.round(score), factors: { tasks: tasks.length, overtime, deadlines } };
  }
}
