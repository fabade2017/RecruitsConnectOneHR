import { Controller, Get, Post, Patch, Param, Body, Query, Req, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private svc: EmployeesService) {}
  @Post() @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('employee:*') @ApiOperation({ summary: 'Create employee with auto OneHR ID' })
  @ApiBody({ schema: { type:'object', required:['job_title'], properties:{
    job_title:{type:'string', example:'Sample Engineer'},
    grade:{type:'string', example:'L1'},
    department_id:{type:'string', example:'sample-dept-id'},
    branch_id:{type:'string', example:'sample-branch-id'},
    employment_type:{type:'string', example:'permanent', enum:['permanent','contract','intern','part_time']},
    work_arrangement:{type:'string', example:'office', enum:['office','remote','hybrid','field','shift']},
    hire_date:{type:'string', format:'date', example:'2024-01-15'},
    dob:{type:'string', format:'date', example:'1990-05-15'},
    date_of_birth:{type:'string', format:'date', example:'1990-05-15'},
    skills:{type:'array', items:{type:'string'}, example:['SampleSkill1','SampleSkill2']},
    email:{type:'string', example:'sample.employee@example.com'},
    phone:{type:'string', example:'08000000000'},
    role:{type:'string', example:'employee'},
  }}}) create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto, req.user); }
  @Post('bulk') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('employee:*') @ApiOperation({ summary: 'Bulk create employees (300+ via JSON or CSV)' })
  @ApiBody({ schema: { type:'object', properties:{
    employees:{type:'array', items:{type:'object', properties:{ job_title:{type:'string', example:'Sample Engineer'}, grade:{type:'string', example:'L1'}, department:{type:'string', example:'Sample Dept'}, branch:{type:'string', example:'Sample Branch'}, employment_type:{type:'string', example:'permanent'}, work_arrangement:{type:'string', example:'office'}, hire_date:{type:'string', example:'2024-01-15'}, dob:{type:'string', example:'1990-05-15'}, skills:{type:'string', example:'SampleSkill1, SampleSkill2'}, phone:{type:'string', example:'08000000000'}, email:{type:'string', example:'sample.bulk@example.com'} }}},
    csv:{type:'string', example:'job_title,grade,department,branch,employment_type,work_arrangement,hire_date,dob,skills,phone,email\nSample Engineer,L1,Sample Dept,Sample Branch,permanent,office,2024-01-15,1990-05-15,\"SampleSkill1,SampleSkill2\",08000000000,sample.bulk@example.com'},
  }}}) bulk(@Req() req: any, @Body() dto: any) { return this.svc.createBulk(req.orgId, dto, req.user); }
  @Post('bulk/excel') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('employee:*') @UseInterceptors(FileInterceptor('file')) @ApiOperation({ summary: 'Bulk create via Excel .xlsx with dropdowns' }) @ApiConsumes('multipart/form-data') @ApiBody({ schema:{ type:'object', properties:{ file:{type:'string', format:'binary', description:'Excel .xlsx file with job_title, grade, department, branch, employment_type, work_arrangement, hire_date, dob, skills, phone, email'} }}}) async bulkExcel(@Req() req: any, @UploadedFile() file: any) { return this.svc.createBulkExcel(req.orgId, file, req.user); }
  @Get('bulk/template') @RequirePermissions('employee:read') @ApiOperation({ summary: 'Download CSV template for bulk upload' }) template(@Req() req: any) { return this.svc.bulkTemplate(req.orgId); }
  @Get('bulk/template/xlsx') @RequirePermissions('employee:read') @ApiOperation({ summary: 'Download Excel template with dropdowns (employment_type, department, grade, branch)' }) async templateXlsx(@Req() req: any, @Res() res: any) {
    const { buffer, filename } = await this.svc.bulkTemplateExcel(req.orgId);
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buffer.length });
    res.send(Buffer.from(buffer));
  }
  @Get() @RequirePermissions('employee:read') @ApiQuery({name:'limit', required:false, type:Number, example:20}) @ApiQuery({name:'status', required:false, type:String, example:'active'}) @ApiQuery({name:'search', required:false, type:String, example:'SAMPLE'}) @ApiQuery({name:'department_id', required:false, type:String}) list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q, req.user); }
  @Get(':id') @RequirePermissions('employee:read') @ApiParam({name:'id', type:String, example:'sample-employee-id'}) get(@Req() req: any, @Param('id') id: string) { return this.svc.findOne(req.orgId, id, req.user); }
  @Patch(':id') @RequirePermissions('employee:*') @ApiParam({name:'id', type:String}) @ApiBody({ schema:{ type:'object', properties:{
    jobTitle:{type:'string', example:'Sample Updated Title'},
    job_title:{type:'string', example:'Sample Updated Title'},
    grade:{type:'string', example:'L2'},
    departmentId:{type:'string', example:'sample-dept-id'},
    department_id:{type:'string', example:'sample-dept-id'},
    branchId:{type:'string', example:'sample-branch-id'},
    branch_id:{type:'string', example:'sample-branch-id'},
    employmentType:{type:'string', example:'contract'},
    employment_type:{type:'string', example:'contract'},
    workArrangement:{type:'string', example:'hybrid'},
    work_arrangement:{type:'string', example:'hybrid'},
    status:{type:'string', example:'active'},
    skills:{type:'array', items:{type:'string'}, example:['SampleSkill1']},
    email:{type:'string', example:'sample.updated@example.com'},
    phone:{type:'string', example:'08000000001'},
    role:{type:'string', example:'employee'},
    dob:{type:'string', example:'1990-05-15'},
    date_of_birth:{type:'string', example:'1990-05-15'},
    hire_date:{type:'string', example:'2024-01-15'},
    hireDate:{type:'string', example:'2024-01-15'},
  }}}) update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto, req.user); }
  @Post(':id/face-profile') @RequirePermissions('employee:*') @ApiParam({name:'id', type:String}) @ApiBody({ schema:{ type:'object', required:['images'], properties:{ images:{type:'array', items:{type:'string'}, example:['data:image/jpeg;base64,...']}, descriptors:{type:'array', items:{type:'array', items:{type:'number'}}, description:'128-d face descriptors'}, consent:{type:'boolean', example:true} }}}) async enrollFace(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.enrollFace(req.orgId, id, dto, req.user); }
  @Get(':id/face-profile') @RequirePermissions('employee:read') @ApiParam({name:'id', type:String}) getFace(@Req() req: any, @Param('id') id: string) { return this.svc.getFaceProfile(req.orgId, id, req.user); }
  @Get(':id/timeline') @RequirePermissions('attendance:read') @ApiParam({name:'id', type:String}) @ApiQuery({name:'date', required:true, type:String, example:'2024-01-15'}) timeline(@Req() req: any, @Param('id') id: string, @Query('date') date: string) { return this.svc.timeline(req.orgId, id, date, req.user); }
  @Get(':id/passport') @RequirePermissions('employee:read') @ApiParam({name:'id', type:String}) @ApiQuery({name:'fields', required:false, type:String, example:'employeeCode,jobTitle,grade'}) passport(@Req() req: any, @Param('id') id: string, @Query('fields') fields: string) { return this.svc.passport(req.orgId, id, fields, req.user); }
}
