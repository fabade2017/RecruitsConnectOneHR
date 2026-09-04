import { Controller, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('payroll')
@Controller('payroll')
export class PayrollController {
  constructor(private svc: PayrollService) {}
  @Get() @Roles('hr_admin','org_admin','hr_manager','manager','executive','super_admin') @RequirePermissions('payroll:read') @ApiOperation({ summary: 'List payrolls (OneHRCon merged)' }) list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q, req.user); }
  @Post() @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:*') create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto); }
  @Patch(':id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('payroll:*') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Get(':id/payslip') @RequirePermissions('payroll:read') payslip(@Req() req: any, @Param('id') id: string) { return this.svc.payslip(id, req.user); }
  @Get('bank/details') @RequirePermissions('payroll:read') bankList(@Req() req: any, @Query('employeeId') eid: string) { return this.svc.bankDetails(req.orgId, eid, req.user); }
  @Post('bank/details') @Roles('hr_admin','org_admin','super_admin','employee') @RequirePermissions('payroll:*') upsertBank(@Req() req: any, @Body() dto: any) { return this.svc.upsertBankDetail(req.orgId, dto, req.user); }
}
