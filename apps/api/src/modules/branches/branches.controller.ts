import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('branches')
@Controller('branches')
export class BranchesController {
  constructor(private svc: BranchesService) {}

  @Get()
  @RequirePermissions('employee:read')
  @ApiOperation({ summary: 'List branches (org-scoped)' })
  @ApiQuery({ name: 'search', required: false })
  list(@Req() req: any, @Query() query: any) {
    return this.svc.list(req.orgId, query);
  }

  @Get(':id')
  @RequirePermissions('employee:read')
  getOne(@Req() req: any, @Param('id') id: string) {
    return this.svc.findOne(req.orgId, id);
  }

  @Post()
  @Roles('hr_admin', 'org_admin', 'super_admin')
  @RequirePermissions('employee:*')
  @ApiOperation({ summary: 'Create branch' })
  create(@Req() req: any, @Body() dto: any) {
    return this.svc.create(req.orgId, dto);
  }

  @Patch(':id')
  @Roles('hr_admin', 'org_admin', 'super_admin')
  @RequirePermissions('employee:*')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.svc.update(req.orgId, id, dto);
  }

  @Delete(':id')
  @Roles('hr_admin', 'org_admin', 'super_admin')
  @RequirePermissions('employee:*')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.remove(req.orgId, id);
  }
}
