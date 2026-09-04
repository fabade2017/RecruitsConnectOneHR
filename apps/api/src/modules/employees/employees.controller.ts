import { Controller, Get, Post, Patch, Param, Body, Query, Req, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private svc: EmployeesService) {}
  @Post() @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('employee:*') @ApiOperation({ summary: 'Create employee with auto OneHR ID' }) create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto, req.user); }
  @Post('bulk') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('employee:*') @ApiOperation({ summary: 'Bulk create employees (300+ via JSON or CSV)' }) bulk(@Req() req: any, @Body() dto: any) { return this.svc.createBulk(req.orgId, dto, req.user); }
  @Post('bulk/excel') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('employee:*') @UseInterceptors(FileInterceptor('file')) @ApiOperation({ summary: 'Bulk create via Excel .xlsx with dropdowns' }) async bulkExcel(@Req() req: any, @UploadedFile() file: any) { return this.svc.createBulkExcel(req.orgId, file, req.user); }
  @Get('bulk/template') @RequirePermissions('employee:read') @ApiOperation({ summary: 'Download CSV template for bulk upload' }) template(@Req() req: any) { return this.svc.bulkTemplate(req.orgId); }
  @Get('bulk/template/xlsx') @RequirePermissions('employee:read') @ApiOperation({ summary: 'Download Excel template with dropdowns (employment_type, department, grade, branch)' }) async templateXlsx(@Req() req: any, @Res() res: any) {
    const { buffer, filename } = await this.svc.bulkTemplateExcel(req.orgId);
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.send(Buffer.from(buffer));
  }
  @Get() @RequirePermissions('employee:read') list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q, req.user); }
  @Get(':id') @RequirePermissions('employee:read') get(@Req() req: any, @Param('id') id: string) { return this.svc.findOne(req.orgId, id, req.user); }
  @Patch(':id') @RequirePermissions('employee:*') update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto, req.user); }
  @Post(':id/face-profile') @RequirePermissions('employee:*') async enrollFace(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.enrollFace(req.orgId, id, dto, req.user); }
  @Get(':id/face-profile') @RequirePermissions('employee:read') getFace(@Req() req: any, @Param('id') id: string) { return this.svc.getFaceProfile(req.orgId, id, req.user); }
  @Get(':id/timeline') @RequirePermissions('attendance:read') timeline(@Req() req: any, @Param('id') id: string, @Query('date') date: string) { return this.svc.timeline(req.orgId, id, date, req.user); }
  @Get(':id/passport') @RequirePermissions('employee:read') passport(@Req() req: any, @Param('id') id: string, @Query('fields') fields: string) { return this.svc.passport(req.orgId, id, fields, req.user); }
}
