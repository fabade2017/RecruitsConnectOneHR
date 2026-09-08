import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';
import { Public } from '../../common/guards/jwt-auth.guard';

@ApiTags('admin')
@Controller('admin')
@Roles('super_admin')
export class AdminController {
  constructor(private svc: AdminService) {}

  // ===== Roles =====
  @Get('roles')
  @Roles('super_admin','org_admin','hr_admin')
  @RequirePermissions('employee:read')
  @ApiOperation({ summary: 'List all roles (super_admin can create/assign, org_admin can list own)' })
  roles(@Req() req:any, @Query('organizationId') orgId?: string) { return this.svc.listRoles(orgId || req.user?.org_id || req.user?.orgId); }

  @Post('roles')
  @RequirePermissions('admin:manage')
  createRole(@Body() dto: any, @Req() req: any) { return this.svc.createRole(dto, req.user); }

  @Patch('roles/:id')
  @RequirePermissions('admin:manage')
  updateRole(@Param('id') id: string, @Body() dto: any) { return this.svc.updateRole(id, dto); }

  @Delete('roles/:id')
  @RequirePermissions('admin:manage')
  deleteRole(@Param('id') id: string) { return this.svc.deleteRole(id); }

  @Post('users/:userId/assign-role')
  @RequirePermissions('admin:manage')
  assignRole(@Param('userId') userId: string, @Body() dto: { role: string; customRoleId?: string }) { return this.svc.assignRole(userId, dto.role, dto.customRoleId); }

  // ===== Permissions =====
  @Get('permissions')
  @RequirePermissions('admin:manage')
  permissions() { return this.svc.listPermissions(); }

  @Get('permissions/grouped')
  @RequirePermissions('admin:manage')
  @ApiOperation({ summary: 'List permissions grouped by module' })
  permissionsGrouped() { return this.svc.listPermissionsGrouped(); }

  @Get('modules')
  @Roles('super_admin', 'org_admin', 'hr_admin', 'hr_manager', 'manager', 'employee')
  @RequirePermissions('employee:read')
  @ApiOperation({ summary: 'List distinct modules (44) grouped from permissions table + static fallback for dropdowns' })
  modules() { return this.svc.listModules(); }

  @Post('permissions')
  @RequirePermissions('admin:manage')
  createPermission(@Body() dto: any) { return this.svc.createPermission(dto); }

  // ===== Module Catalog (pricing) =====
  @Get('module-catalog')
  @RequirePermissions('admin:manage')
  moduleCatalog() { return this.svc.listModuleCatalog(); }

  @Post('module-catalog')
  @RequirePermissions('admin:manage')
  upsertModuleCatalog(@Body() dto: any) { return this.svc.upsertModuleCatalog(dto); }

  @Patch('module-catalog/:key')
  @RequirePermissions('admin:manage')
  updateModuleCatalog(@Param('key') key: string, @Body() dto: any) { return this.svc.updateModuleCatalog(key, dto); }

  @Delete('module-catalog/:key')
  @RequirePermissions('admin:manage')
  deleteModuleCatalog(@Param('key') key: string) { return this.svc.deleteModuleCatalog(key); }

  @Get('plans/pricing')
  @RequirePermissions('admin:manage')
  plansWithPricing() { return this.svc.getPlansWithPricing(); }

  // ===== Company Groups (Group of Companies) =====
  @Get('groups')
  @RequirePermissions('admin:manage')
  groups() { return this.svc.listGroups(); }

  @Get('groups/:id')
  @RequirePermissions('admin:manage')
  group(@Param('id') id: string) { return this.svc.getGroup(id); }

  @Get('groups/:id/hierarchy')
  @RequirePermissions('admin:manage')
  hierarchy(@Param('id') id: string) { return this.svc.groupHierarchy(id); }

  @Post('groups')
  @RequirePermissions('admin:manage')
  createGroup(@Body() dto: any, @Req() req: any) { return this.svc.createGroup(dto, req.user); }

  @Patch('groups/:id')
  @RequirePermissions('admin:manage')
  updateGroup(@Param('id') id: string, @Body() dto: any) { return this.svc.updateGroup(id, dto); }

  @Post('groups/:id/organizations/:orgId')
  @RequirePermissions('admin:manage')
  assignOrg(@Param('id') groupId: string, @Param('orgId') orgId: string) { return this.svc.assignOrganizationToGroup(groupId, orgId); }

  @Delete('groups/:id/organizations/:orgId')
  @RequirePermissions('admin:manage')
  removeOrg(@Param('orgId') orgId: string) { return this.svc.removeOrganizationFromGroup(orgId); }

  // ===== Subscriptions & Module Assignment =====
  @Get('plans')
  @RequirePermissions('admin:manage')
  plans() { return this.svc.listPlans(); }

  @Get('plans/:id')
  @RequirePermissions('admin:manage')
  plan(@Param('id') id: string) { return this.svc.getPlan(id); }

  @Post('plans')
  @RequirePermissions('admin:manage')
  createPlan(@Body() dto: any) { return this.svc.createPlan(dto); }

  @Patch('plans/:id')
  @RequirePermissions('admin:manage')
  updatePlan(@Param('id') id: string, @Body() dto: any) { return this.svc.updatePlan(id, dto); }

  @Post('plans/:id/modules')
  @RequirePermissions('admin:manage')
  @ApiOperation({ summary: 'Assign modules to subscription plan (Super Admin)' })
  assignModules(@Param('id') planId: string, @Body() dto: { modules: any[] }) { return this.svc.assignModulesToPlan(planId, dto.modules); }

  @Patch('plans/:id/modules/:moduleKey/price')
  @RequirePermissions('admin:manage')
  setModulePrice(@Param('id') planId: string, @Param('moduleKey') moduleKey: string, @Body() dto: { price: number }) { return this.svc.setModulePrice(planId, moduleKey, dto.price); }

  @Delete('plans/:id/modules/:moduleKey')
  @RequirePermissions('admin:manage')
  removeModule(@Param('id') planId: string, @Param('moduleKey') moduleKey: string) { return this.svc.removeModuleFromPlan(planId, moduleKey); }

  @Get('subscriptions')
  @RequirePermissions('admin:manage')
  subscriptions(@Query('organizationId') orgId?: string, @Query('companyGroupId') groupId?: string) { return this.svc.listSubscriptions(orgId, groupId); }

  @Post('subscriptions/assign')
  @RequirePermissions('admin:manage')
  @ApiOperation({ summary: 'Assign subscription to org or entire group' })
  assignSubscription(@Body() dto: any) { return this.svc.assignSubscription(dto); }

  @Patch('subscriptions/:id')
  @RequirePermissions('admin:manage')
  updateSubscription(@Param('id') id: string, @Body() dto: any) { return this.svc.updateSubscription(id, dto); }

  @Post('subscriptions/:id/cancel')
  @RequirePermissions('admin:manage')
  cancelSubscription(@Param('id') id: string) { return this.svc.cancelSubscription(id); }

  @Get('organizations/:orgId/modules/:moduleKey/access')
  @RequirePermissions('admin:manage')
  checkAccess(@Param('orgId') orgId: string, @Param('moduleKey') moduleKey: string) { return this.svc.checkModuleAccess(orgId, moduleKey); }

  // ===== Renewals (yearly) =====
  @Get('renewals')
  @RequirePermissions('admin:manage')
  renewals(@Query('status') status?: string) { return this.svc.listRenewals(status); }

  @Post('renewals/:id/approve')
  @RequirePermissions('admin:manage')
  approveRenewal(@Param('id') id: string, @Req() req: any) { return this.svc.approveRenewal(id, req.user.sub); }

  @Post('renewals/:id/reject')
  @RequirePermissions('admin:manage')
  rejectRenewal(@Param('id') id: string, @Req() req: any, @Body() dto: any) { return this.svc.rejectRenewal(id, req.user.sub, dto.reason); }

  @Get('renewals/:id/receipt')
  @RequirePermissions('admin:manage')
  renewalReceipt(@Param('id') id: string) { return this.svc.getRenewalReceipt(id); }

  @Get('organizations')
  @RequirePermissions('admin:manage')
  organizations() { return this.svc.listOrganizations(); }
}
