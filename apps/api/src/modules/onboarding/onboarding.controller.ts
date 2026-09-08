import { Controller, Get, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';
import { RequireModule } from '../../common/guards/module.guard';

@ApiTags('onboarding')
@RequireModule('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private svc: OnboardingService) {}
  @Get() @RequirePermissions('employee:read') list(@Req() req: any) { return this.svc.getChecklists(req.orgId); }
  @Get('progress') @RequirePermissions('employee:read') listProgress(@Req() req: any) { return this.svc.listProgress(req.orgId); }
  @Get('employee/:employeeId') @RequirePermissions('employee:read') getByEmployee(@Req() req: any, @Param('employeeId') id: string) { return this.svc.getByEmployee(req.orgId, id); }
  @Get(':employeeId') @RequirePermissions('employee:read') getByEmployeeAlias(@Req() req: any, @Param('employeeId') id: string) { return this.svc.getByEmployee(req.orgId, id); }
  @Patch('employee/:employeeId/step/:stepId') @RequirePermissions('employee:read') toggle(@Req() req: any, @Param('employeeId') empId: string, @Param('stepId') stepId: string) { return this.svc.toggleStep(req.orgId, empId, stepId); }
  @Patch(':employeeId/step/:stepId') @RequirePermissions('employee:read') toggleAlias(@Req() req: any, @Param('employeeId') empId: string, @Param('stepId') stepId: string) { return this.svc.toggleStep(req.orgId, empId, stepId); }
}
