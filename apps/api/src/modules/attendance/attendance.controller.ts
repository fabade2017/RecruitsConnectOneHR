import { Controller, Post, Get, Patch, Body, Query, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';
import { RequireModule } from '../../common/guards/module.guard';

@ApiTags('attendance')
@RequireModule('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}
  @Post('clock-in') @RequirePermissions('attendance:clock') @ApiOperation({ summary: 'Smart clock-in (7 methods)' }) clockIn(@Req() req: any, @Body() dto: any) { return this.svc.clockIn(req.orgId, req.user.sub, dto); }
  @Post('clock-out') @RequirePermissions('attendance:clock') clockOut(@Req() req: any, @Body() dto: any) { return this.svc.clockOut(req.orgId, req.user.sub, dto); }
  @Post('break/start') @RequirePermissions('attendance:clock') breakStart(@Req() req: any, @Body() dto: any) { return this.svc.breakStart(req.orgId, req.user.sub, dto); }
  @Post('break/end') @RequirePermissions('attendance:clock') breakEnd(@Req() req: any, @Body() dto: any) { return this.svc.breakEnd(req.orgId, req.user.sub, dto); }
  @Get('sessions') @RequirePermissions('attendance:read') sessions(@Req() req: any, @Query() q: any) { return this.svc.sessions(req.orgId, q, req.user); }
  @Get('map') @RequirePermissions('attendance:read') map(@Req() req: any, @Query() q: any) { return this.svc.mapData(req.orgId, q, req.user); }
  @Get('command-center') @Roles('hr_admin','org_admin','hr_manager','manager','executive','super_admin') @RequirePermissions('attendance:read') commandCenter(@Req() req: any) { return this.svc.commandCenter(req.orgId, req.user); }
  @Get('exceptions') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('attendance:*') exceptions(@Req() req: any, @Query() q: any) { return this.svc.exceptionsList(req.orgId, q); }
  @Patch('exceptions/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('attendance:*') resolve(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.resolveException(req.orgId, id, dto); }

  @Patch('admin/sessions/:id/clock-out') @Roles('super_admin','org_admin','hr_admin') @RequirePermissions('attendance:*') adminClockOut(@Req() req: any, @Param('id') id: string, @Body() dto: { clockOutAt: string; reason?: string }) { return this.svc.adminClockOut(req.orgId, id, dto.clockOutAt, dto.reason, req.user); }
  @Post('admin/auto-close') @Roles('super_admin','org_admin') @RequirePermissions('attendance:*') autoClose(@Req() req: any, @Body() dto: { date: string; clockOutAt?: string }) { return this.svc.autoCloseMissing(req.orgId, dto.date, dto.clockOutAt, req.user); }
  @Get('admin/missing') @Roles('super_admin','org_admin','hr_admin') @RequirePermissions('attendance:*') missing(@Req() req: any, @Query() q: any) { return this.svc.missingSessions(req.orgId, q); }
}
