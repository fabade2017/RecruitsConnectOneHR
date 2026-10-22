import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { LearningService } from './learning.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';
import { RequireModule } from '../../common/guards/module.guard';

@ApiTags('learning')
@RequireModule('learning')
@Controller('learning')
export class LearningController {
  constructor(private svc: LearningService) {}

  @Get('courses') @RequirePermissions('learning:read') listCourses(@Req() req: any) { return this.svc.listCourses(req.orgId); }
  @Get('courses/:id') @RequirePermissions('learning:read') getCourse(@Req() req: any, @Param('id') id: string) { return this.svc.getCourse(req.orgId, id); }
  @Get(':id') @RequirePermissions('learning:read') getCourseAlias(@Req() req: any, @Param('id') id: string) { return this.svc.getCourse(req.orgId, id); }
  @Post('courses') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') create(@Req() req: any, @Body() dto: any) { return this.svc.createCourse(req.orgId, dto); }
  @Post() @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') createAlias(@Req() req: any, @Body() dto: any) { return this.svc.createCourse(req.orgId, dto); }
  @Patch('courses/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') updateCourse(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updateCourse(req.orgId, id, dto); }
  @Patch(':id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') updateAlias(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updateCourse(req.orgId, id, dto); }
  @Delete('courses/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') removeCourse(@Req() req: any, @Param('id') id: string) { return this.svc.removeCourse(req.orgId, id); }
  @Delete(':id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') removeAlias(@Req() req: any, @Param('id') id: string) { return this.svc.removeCourse(req.orgId, id); }

  @Post('enroll') @RequirePermissions('learning:*') enroll(@Req() req: any, @Body() dto: any) { return this.svc.enroll(req.orgId, dto, req.user); }
  @Get('enrollments/:employeeId') @RequirePermissions('learning:read') listEnrollments(@Req() req: any, @Param('employeeId') employeeId: string) { return this.svc.listEnrollments(req.orgId, employeeId, req.user); }

  @Post('courses/:id/materials') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') @UseInterceptors(FileInterceptor('file')) @ApiConsumes('multipart/form-data') @ApiBody({ schema:{ type:'object', properties:{ file:{ type:'string', format:'binary' } } } }) uploadMaterial(@Req() req: any, @Param('id') id: string, @UploadedFile() file: any) { return this.svc.uploadMaterial(req.orgId, id, file); }
  @Post('courses/:id/quiz/generate') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') generateQuiz(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.generateQuiz(req.orgId, id, dto); }
  @Patch('courses/:id/quiz') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('learning:*') updateQuiz(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updateQuizSettings(req.orgId, id, dto); }
  @Get('enrollments/:enrollmentId/quiz') @RequirePermissions('learning:read') getQuiz(@Req() req: any, @Param('enrollmentId') enrollmentId: string) { return this.svc.getQuizForEnrollment(req.orgId, enrollmentId, req.user); }
  @Post('enrollments/:enrollmentId/quiz/submit') @RequirePermissions('learning:*') submitQuiz(@Req() req: any, @Param('enrollmentId') enrollmentId: string, @Body() dto: any) { return this.svc.submitQuiz(req.orgId, enrollmentId, dto, req.user); }
}
