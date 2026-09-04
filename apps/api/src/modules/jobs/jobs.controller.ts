import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private svc: JobsService) {}
  @Get() @RequirePermissions('job:read') list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q); }
  @Post() @Roles('recruiter','hr_admin','org_admin','super_admin') @RequirePermissions('job:*') create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto); }
  @Get(':id') @RequirePermissions('job:read') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.orgId, id); }
  @Patch(':id') @Roles('recruiter','hr_admin','org_admin','super_admin') @RequirePermissions('job:*') update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto); }
  @Delete(':id') @Roles('recruiter','hr_admin','org_admin','super_admin') @RequirePermissions('job:*') remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.orgId, id); }
  @Get(':id/applications') @Roles('recruiter','hr_admin','org_admin','super_admin','manager') @RequirePermissions('job:*') apps(@Req() req: any, @Param('id') id: string) { return this.svc.applications(req.orgId, id); }
  @Post(':id/apply') @RequirePermissions('job:read') apply(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.apply(req.orgId, id, dto); }
  @Patch('applications/:id') @Roles('recruiter','hr_admin','org_admin','super_admin') @RequirePermissions('job:*') updateApp(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updateApplication(req.orgId, id, dto); }
}
