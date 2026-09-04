import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('engagement')
@Controller('engagement')
export class EngagementController {
  constructor(private svc: EngagementService) {}
  @Get('surveys') @RequirePermissions('employee:read') surveys(@Req() req: any, @Query() q: any) { return this.svc.surveys(req.orgId, q); }
  @Post('surveys') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('engagement:*') create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto); }
  @Get('surveys/:id') @RequirePermissions('employee:read') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.orgId, id); }
  @Patch('surveys/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('engagement:*') update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto); }
  @Delete('surveys/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('engagement:*') remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.orgId, id); }
  @Post('surveys/:id/respond') @RequirePermissions('engagement:respond') respond(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.respond(req.orgId, id, dto, req.user); }
  @Get('surveys/:id/responses') @Roles('hr_admin','org_admin','super_admin','manager') @RequirePermissions('engagement:*') responses(@Req() req: any, @Param('id') id: string) { return this.svc.responses(req.orgId, id); }
}
