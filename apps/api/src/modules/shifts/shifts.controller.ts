import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('shifts')
@Controller()
export class ShiftsController {
  constructor(private svc: ShiftsService) {}
  @Get('shifts') @RequirePermissions('employee:read') list(@Req() req:any, @Query() q:any){ return this.svc.list(req.orgId, q); }
  @Get('shifts/:id') @RequirePermissions('employee:read') get(@Req() req:any, @Param('id') id:string){ return this.svc.get(req.orgId, id); }
  @Post('shifts') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('shift:*') create(@Req() req:any, @Body() dto:any){ return this.svc.create(req.orgId, dto); }
  @Patch('shifts/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('shift:*') update(@Req() req:any, @Param('id') id:string, @Body() dto:any){ return this.svc.update(req.orgId, id, dto); }
  @Delete('shifts/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('shift:*') remove(@Req() req:any, @Param('id') id:string){ return this.svc.remove(req.orgId, id); }
  @Post('rosters') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('shift:*') roster(@Req() req:any, @Body() dto:any){ return this.svc.createRoster(req.orgId, dto); }
  @Get('rosters') @RequirePermissions('attendance:read') rosters(@Query() q:any, @Req() req:any){ return this.svc.rosters(req.orgId, q, req.user); }
}
