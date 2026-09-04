import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';
import { Public } from '../../common/guards/jwt-auth.guard';

@ApiTags('workflows')
@Controller('workflows')
export class WorkflowsController {
  constructor(private svc: WorkflowsService) {}

  @Get('instances/list') @RequirePermissions('employee:read') instances(@Req() req: any, @Query() q: any) { return this.svc.listInstances(req.orgId, q); }
  @Post('instances') @Roles('hr_admin','org_admin','super_admin') createInstance(@Req() req: any, @Body() dto: any) { return this.svc.createInstance(req.orgId, dto.workflowId, dto.entityType, dto.entityId); }
  @Patch('instances/:id/approve') @RequirePermissions('employee:read') approve(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.approveInstance(req.orgId, id, dto, req.user); }
  @Post('trigger/:trigger') @Public() trigger(@Req() req: any, @Param('trigger') trigger: string, @Body() payload: any) {
    const orgId = req.orgId || payload.organizationId || req.headers['x-organization-id'];
    if (!orgId) return { error: 'orgId required' };
    return this.svc.trigger(orgId, trigger, payload);
  }

  @Get() @RequirePermissions('employee:read') list(@Req() req: any) { return this.svc.list(req.orgId); }
  @Get(':id') @RequirePermissions('employee:read') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.orgId, id); }
  @Post() @Roles('hr_admin','org_admin','super_admin') @RequirePermissions('workflow:*') @ApiOperation({ summary: 'Create workflow (no-code builder)' }) create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto, req.user); }
  @Patch(':id') @Roles('hr_admin','org_admin','super_admin') update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto); }
  @Delete(':id') @Roles('hr_admin','org_admin','super_admin') remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.orgId, id); }
  @Post(':id/toggle') @Roles('hr_admin','org_admin','super_admin') toggle(@Req() req: any, @Param('id') id: string) { return this.svc.toggle(req.orgId, id); }
}
