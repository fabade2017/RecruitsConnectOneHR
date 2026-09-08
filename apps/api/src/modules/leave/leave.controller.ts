import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';
import { RequireModule } from '../../common/guards/module.guard';

@ApiTags('leave')
@RequireModule('leave')
@Controller('leave')
export class LeaveController {
  constructor(private svc: LeaveService) {}
  @Get('types') @RequirePermissions('leave:read') types(@Req() req:any){ return this.svc.types(req.orgId); }
  @Post('types') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('leave:*') createType(@Req() req:any, @Body() dto:any){ return this.svc.createType(req.orgId, dto); }
  @Post('requests') @RequirePermissions('leave:request:self') request(@Req() req:any, @Body() dto:any){ return this.svc.request(req.orgId, req.user.sub, dto); }
  @Get('requests') @RequirePermissions('leave:read') list(@Req() req:any, @Query() q:any){ return this.svc.list(req.orgId, q, req.user); }
  @Get('requests/:id') @RequirePermissions('leave:read') getOne(@Req() req:any, @Param('id') id:string){ return this.svc.getOne(req.orgId, id, req.user); }
  @Patch('requests/:id') @RequirePermissions('leave:request:self') update(@Req() req:any, @Param('id') id:string, @Body() dto:any){ return this.svc.update(req.orgId, id, req.user, dto); }
  @Patch('requests/:id/cancel') @RequirePermissions('leave:request:self') cancel(@Req() req:any, @Param('id') id:string){ return this.svc.cancel(req.orgId, id, req.user); }
  @Delete('requests/:id') @RequirePermissions('leave:request:self') remove(@Req() req:any, @Param('id') id:string){ return this.svc.remove(req.orgId, id, req.user); }
  @Patch('requests/:id/approve') @Roles('manager','hr_admin','org_admin','super_admin') @RequirePermissions('leave:approve:team') approve(@Param('id') id:string, @Req() req:any){ return this.svc.approve(id, req.user.sub, 'approved', req.user); }
  @Patch('requests/:id/reject') @Roles('manager','hr_admin','org_admin','super_admin') @RequirePermissions('leave:approve:team') reject(@Param('id') id:string, @Req() req:any){ return this.svc.approve(id, req.user.sub, 'rejected', req.user); }
  @Get('balances/:employeeId') @RequirePermissions('leave:read') bal(@Req() req:any, @Param('employeeId') eid:string){ return this.svc.balances(req.orgId, eid, req.user); }
}
