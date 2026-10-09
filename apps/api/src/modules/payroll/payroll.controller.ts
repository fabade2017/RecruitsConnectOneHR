import { Controller, Get, Post, Patch, Put, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';
import { RequireModule } from '../../common/guards/module.guard';

@ApiTags('payroll')
@RequireModule('payroll')
@Controller('payroll')
export class PayrollController {
  constructor(private svc: PayrollService) {}
  @Get() @Roles('hr_admin','org_admin','hr_manager','manager','executive','super_admin') @RequirePermissions('payroll:read') @ApiOperation({ summary: 'List payrolls (OneHRCon merged)' }) list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q, req.user); }
  @Post() @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:*') create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto); }

  @Get('config') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:read') @ApiOperation({ summary: 'Get Nigeria statutory config' }) getConfig(@Req() req: any) { return this.svc.getConfig(req.orgId); }
  @Patch('config') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:*') @ApiOperation({ summary: 'Update Nigeria statutory config' }) updateConfig(@Req() req: any, @Body() dto: any) { return this.svc.updateConfig(req.orgId, dto); }

  @Get('profiles') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:read') @ApiOperation({ summary: 'List employee statutory profiles' }) listProfiles(@Req() req: any) { return this.svc.listProfiles(req.orgId); }
  @Get('profiles/:employeeId') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:read') getProfile(@Req() req: any, @Param('employeeId') employeeId: string) { return this.svc.getProfile(req.orgId, employeeId); }
  @Put('profiles/:employeeId') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:*') @ApiOperation({ summary: 'Create/update employee statutory profile' }) upsertProfile(@Req() req: any, @Param('employeeId') employeeId: string, @Body() dto: any) { return this.svc.upsertProfile(req.orgId, employeeId, dto); }

  @Post('preview') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:read') @ApiOperation({ summary: 'Preview computed Nigeria payroll for an employee' }) preview(@Req() req: any, @Body() dto: any) { return this.svc.preview(req.orgId, dto.employeeId, dto); }
  @Post('run') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:*') @ApiOperation({ summary: 'Run Nigeria statutory payroll for a period' }) run(@Req() req: any, @Body() dto: any) { return this.svc.run(req.orgId, dto); }
  @Get('statutory-summary') @Roles('hr_admin','org_admin','hr_manager','executive','super_admin') @RequirePermissions('payroll:read') @ApiOperation({ summary: 'Nigeria statutory summary totals' }) summary(@Req() req: any, @Query('month') month: string, @Query('year') year: string) { return this.svc.statutorySummary(req.orgId, month, year); }

  @Patch(':id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:*') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Get(':id/payslip') @RequirePermissions('payroll:read') payslip(@Req() req: any, @Param('id') id: string) { return this.svc.payslip(id, req.user); }
  @Get('bank/details') @RequirePermissions('payroll:read') bankList(@Req() req: any, @Query('employeeId') eid: string) { return this.svc.bankDetails(req.orgId, eid, req.user); }
  @Post('bank/details') @Roles('hr_admin','org_admin','super_admin','employee') @RequirePermissions('payroll:*') upsertBank(@Req() req: any, @Body() dto: any) { return this.svc.upsertBankDetail(req.orgId, dto, req.user); }
}
