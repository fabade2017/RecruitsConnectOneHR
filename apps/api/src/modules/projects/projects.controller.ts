import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('projects')
@Controller()
export class ProjectsController {
  constructor(private svc: ProjectsService) {}

  @Get('projects') @RequirePermissions('employee:read') @ApiOperation({ summary: 'List projects' })
  list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q, req.user); }

  @Get('projects/:id') @RequirePermissions('employee:read')
  get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.orgId, id); }

  @Post('projects') @RequirePermissions('task:*') @ApiOperation({ summary: 'Create project' })
  create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto, req.user); }

  @Patch('projects/:id') @RequirePermissions('task:*')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto); }

  @Delete('projects/:id') @Roles('hr_admin','org_admin','super_admin')
  remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.orgId, id); }

  @Get('projects/:id/tasks') @RequirePermissions('task:read')
  tasks(@Req() req: any, @Param('id') id: string, @Query() q: any) { return this.svc.listTasks(req.orgId, id, q); }

  @Post('projects/:id/tasks') @RequirePermissions('task:*')
  createTask(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.createTask(req.orgId, id, dto); }

  @Get('tasks') @RequirePermissions('task:read')
  allTasks(@Req() req: any, @Query() q: any) { return this.svc.listAllTasks(req.orgId, q, req.user); }

  @Patch('tasks/:id') @RequirePermissions('task:*')
  updateTask(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updateTask(req.orgId, id, dto, req.user); }

  @Get('workload/:employeeId') @RequirePermissions('employee:read')
  workload(@Req() req: any, @Param('employeeId') id: string) { return this.svc.workload(req.orgId, id); }
}
