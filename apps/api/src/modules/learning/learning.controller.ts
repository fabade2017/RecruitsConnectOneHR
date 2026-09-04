import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LearningService } from './learning.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('learning')
@Controller('learning')
export class LearningController {
  constructor(private svc: LearningService) {}
  @Get('courses') @RequirePermissions('learning:read') courses(@Req() req: any, @Query() q: any) { return this.svc.courses(req.orgId, q); }
  @Get() @RequirePermissions('learning:read') listAlias(@Req() req: any, @Query() q: any) { return this.svc.courses(req.orgId, q); }
  @Get('courses/:id') @RequirePermissions('learning:read') getCourse(@Req() req: any, @Param('id') id: string) { return this.svc.getCourse(req.orgId, id); }
  @Get(':id') @RequirePermissions('learning:read') getCourseAlias(@Req() req: any, @Param('id') id: string) { return this.svc.getCourse(req.orgId, id); }
  @Post('courses') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') create(@Req() req: any, @Body() dto: any) { return this.svc.createCourse(req.orgId, dto); }
  @Post() @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') createAlias(@Req() req: any, @Body() dto: any) { return this.svc.createCourse(req.orgId, dto); }
  @Patch('courses/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') updateCourse(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updateCourse(req.orgId, id, dto); }
  @Patch(':id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') updateAlias(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updateCourse(req.orgId, id, dto); }
  @Delete('courses/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') removeCourse(@Req() req: any, @Param('id') id: string) { return this.svc.removeCourse(req.orgId, id); }
  @Delete(':id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') removeAlias(@Req() req: any, @Param('id') id: string) { return this.svc.removeCourse(req.orgId, id); }
  @Post('enroll') @RequirePermissions('learning:enroll') enroll(@Req() req: any, @Body() dto: any) { return this.svc.enroll(req.orgId, dto, req.user); }
  @Get('enrollments/:employeeId') @RequirePermissions('learning:read') enrollments(@Req() req: any, @Param('employeeId') id: string) { return this.svc.enrollments(req.orgId, id, req.user); }
  @Patch('enrollments/:id') @RequirePermissions('learning:read') update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updateProgress(req.orgId, id, dto, req.user); }
}
