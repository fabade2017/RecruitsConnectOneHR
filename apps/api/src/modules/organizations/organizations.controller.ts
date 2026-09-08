import { Controller, Get, Post, Patch, Param, Body, Query, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';
import { Public } from '../../common/guards/jwt-auth.guard';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private svc: OrganizationsService) {}
  @Public() @Post() @ApiOperation({summary:'Register organization'}) @ApiBody({ schema:{ type:'object', required:['name','acronym','adminEmail','adminPassword'], properties:{ name:{type:'string', example:'Sample Org Ltd'}, acronym:{type:'string', example:'SAMPLE'}, adminEmail:{type:'string', example:'sample.admin@example.com'}, adminPassword:{type:'string', example:'Sample@123'}, industryTemplate:{type:'string', example:'generic'}, country:{type:'string', example:'NG'} }}}) create(@Body() dto: any) { return this.svc.create(dto); }
  @Public() @Get('check-acronym') @ApiQuery({name:'acronym', type:String, example:'SAMPLE'}) checkAcronym(@Query('acronym') acronym: string) { return this.svc.checkAcronym(acronym || ''); }
  @Get() @Roles('super_admin','org_admin') @ApiOperation({summary:'List organizations'}) list() { return this.svc.listAll(); }
  @Get(':id') @RequirePermissions('employee:read') @ApiParam({name:'id', type:String}) get(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch(':id') @Roles('org_admin','super_admin') @RequirePermissions('employee:*') @ApiParam({name:'id', type:String}) @ApiBody({ schema:{ type:'object', properties:{ name:{type:'string', example:'Sample Org Updated'}, logoUrl:{type:'string', example:'https://example.com/logo.png'}, primaryColor:{type:'string', example:'#0F172A'} }}}) update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Get(':id/config') @RequirePermissions('employee:read') config(@Param('id') id: string) { return this.svc.getConfig(id); }
  @Get(':id/branding') @RequirePermissions('employee:read') branding(@Param('id') id: string) { return this.svc.getBranding(id); }
  @Patch(':id/branding') @Roles('org_admin','super_admin') @RequirePermissions('employee:*') updateBranding(@Param('id') id: string, @Body() dto: any) { return this.svc.updateBranding(id, dto); }
  @Post(':id/logo') @Roles('org_admin','super_admin') @RequirePermissions('employee:*') @UseInterceptors(FileInterceptor('logo')) uploadLogo(@Param('id') id: string, @UploadedFile() file: any) { return this.svc.uploadLogo(id, file); }
  @Post(':id/logo/file') @Roles('org_admin','super_admin') @RequirePermissions('employee:*') @UseInterceptors(FileInterceptor('file')) uploadLogoFile(@Param('id') id: string, @UploadedFile() file: any) { return this.svc.uploadLogo(id, file); }
  @Get(':id/subscription')
  @RequirePermissions('employee:read')
  subscription(@Param('id') id: string, @Req() req: any) {
    // org_admin can view own, super_admin can view any, others can view own org only
    if (req.user.role !== 'super_admin' && req.user.org_id !== id && req.user.orgId !== id) throw new (require('@nestjs/common').ForbiddenException)('Can only view own organization subscription');
    return this.svc.getSubscription(id);
  }

  @Post(':id/renew')
  @RequirePermissions('employee:read')
  requestRenewal(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'super_admin' && req.user.org_id !== id && req.user.orgId !== id) throw new (require('@nestjs/common').ForbiddenException)('Can only renew own organization');
    return this.svc.requestRenewal(id, req.user.sub);
  }

  @Get(':id/renewals')
  @RequirePermissions('employee:read')
  renewals(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'super_admin' && req.user.org_id !== id && req.user.orgId !== id) throw new (require('@nestjs/common').ForbiddenException)('Can only view own renewals');
    return this.svc.listRenewals(id);
  }

  @Get(':id/renewals/:renewalId')
  @RequirePermissions('employee:read')
  getRenewal(@Param('id') id: string, @Param('renewalId') renewalId: string, @Req() req: any) {
    if (req.user.role !== 'super_admin' && req.user.org_id !== id && req.user.orgId !== id) throw new (require('@nestjs/common').ForbiddenException)('Can only view own renewal');
    return this.svc.getRenewal(renewalId, id);
  }

  @Get(':id/health-score') @Roles('executive','org_admin','hr_admin','super_admin') @RequirePermissions('analytics:read') health(@Param('id') id: string, @Query('date') date: string) { return this.svc.healthScore(id, date); }
}
