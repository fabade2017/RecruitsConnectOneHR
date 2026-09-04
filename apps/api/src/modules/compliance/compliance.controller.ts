import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(private svc: ComplianceService) {}
  @Get('policies') @Roles('hr_admin','org_admin','auditor','super_admin') @RequirePermissions('compliance:read') policies(@Req() req: any, @Query() q: any) { return this.svc.policies(req.orgId, q); }
  @Post('policies') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('compliance:*') create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto); }
  @Get('policies/:id') @RequirePermissions('compliance:read') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.orgId, id); }
  @Patch('policies/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('compliance:*') update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto); }
  @Delete('policies/:id') @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('compliance:*') remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.orgId, id); }
  @Get('policies/:id/audits') @RequirePermissions('compliance:read') audits(@Req() req: any, @Param('id') id: string) { return this.svc.audits(req.orgId, id); }
  @Post('policies/:id/audits') @Roles('auditor','hr_admin','org_admin','super_admin') @RequirePermissions('compliance:*') createAudit(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.createAudit(req.orgId, id, dto); }
  @Patch('audits/:id') @Roles('auditor','hr_admin','org_admin','super_admin') @RequirePermissions('compliance:*') updateAudit(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.updateAudit(req.orgId, id, dto); }
}
