import { Controller, Get, Post, Patch, Param, Body, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Roles, RequirePermissions } from '../../common/guards/rbac.guard';
import { Public } from '../../common/guards/jwt-auth.guard';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private svc: OrganizationsService) {}
  @Public() @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Public() @Get('check-acronym') checkAcronym(@Query('acronym') acronym: string) { return this.svc.checkAcronym(acronym || ''); }
  @Get() @Roles('super_admin','org_admin') list() { return this.svc.listAll(); }
  @Get(':id') @RequirePermissions('employee:read') get(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch(':id') @Roles('org_admin','super_admin') @RequirePermissions('employee:*') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Get(':id/config') @RequirePermissions('employee:read') config(@Param('id') id: string) { return this.svc.getConfig(id); }
  @Get(':id/branding') @RequirePermissions('employee:read') branding(@Param('id') id: string) { return this.svc.getBranding(id); }
  @Patch(':id/branding') @Roles('org_admin','super_admin') @RequirePermissions('employee:*') updateBranding(@Param('id') id: string, @Body() dto: any) { return this.svc.updateBranding(id, dto); }
  @Post(':id/logo') @Roles('org_admin','super_admin') @RequirePermissions('employee:*') @UseInterceptors(FileInterceptor('logo')) uploadLogo(@Param('id') id: string, @UploadedFile() file: any) { return this.svc.uploadLogo(id, file); }
  @Post(':id/logo/file') @Roles('org_admin','super_admin') @RequirePermissions('employee:*') @UseInterceptors(FileInterceptor('file')) uploadLogoFile(@Param('id') id: string, @UploadedFile() file: any) { return this.svc.uploadLogo(id, file); }
  @Get(':id/health-score') @Roles('executive','org_admin','hr_admin','super_admin') @RequirePermissions('analytics:read') health(@Param('id') id: string, @Query('date') date: string) { return this.svc.healthScore(id, date); }
}
