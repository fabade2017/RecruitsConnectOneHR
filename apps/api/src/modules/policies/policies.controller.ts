import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('policies')
@Controller('policies')
export class PoliciesController {
  constructor(private svc: PoliciesService) {}
  @Get() @RequirePermissions('employee:read') list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q); }
  @Get(':id') @RequirePermissions('employee:read') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.orgId, id); }
  @Post() @RequirePermissions('document:*') create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto); }
  @Post('upload') @RequirePermissions('document:*') @UseInterceptors(FileInterceptor('file')) upload(@Req() req: any, @Body() dto: any, @UploadedFile() file: any) { return this.svc.upload(req.orgId, dto, file); }
  @Post('query') @RequirePermissions('employee:read') query(@Req() req: any, @Body() dto: any) { return this.svc.query(req.orgId, dto, req.user); }
  @Patch(':id') @RequirePermissions('document:*') update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto); }
  @Delete(':id') @RequirePermissions('document:*') remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.orgId, id); }
}
