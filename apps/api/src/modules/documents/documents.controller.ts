import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('documents')
@Controller()
export class DocumentsController {
  constructor(private svc: DocumentsService) {}

  @Get('documents') @RequirePermissions('document:read') list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q, req.user); }
  @Get('documents/:id') @RequirePermissions('document:read') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.orgId, id); }
  @Get('documents/:id/download') @RequirePermissions('document:read') download(@Req() req: any, @Param('id') id: string) { return this.svc.download(req.orgId, id); }
  @Post('documents') @RequirePermissions('document:*') @UseInterceptors(FileInterceptor('file')) create(@Req() req: any, @Body() dto: any, @UploadedFile() file: any) { return this.svc.create(req.orgId, dto, file, req.user); }
  @Patch('documents/:id/verify') @RequirePermissions('document:*') verify(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.verify(req.orgId, id, dto); }
  @Patch('documents/:id') @RequirePermissions('document:*') update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto); }
  @Delete('documents/:id') @RequirePermissions('document:*') remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.orgId, id); }

  // Assets endpoints (frontend /assets uses these)
  @Get('assets') @RequirePermissions('document:read') listAssets(@Req() req: any, @Query() q: any) { return this.svc.listAssets(req.orgId, q); }
  @Post('assets') @RequirePermissions('document:*') createAsset(@Req() req: any, @Body() dto: any) { return this.svc.assignAsset(req.orgId, dto); }
  @Post('assets/assign') @RequirePermissions('document:*') assignAsset(@Req() req: any, @Body() dto: any) { return this.svc.assignAsset(req.orgId, dto); }
  @Post('assets/:id/return') @RequirePermissions('document:*') returnAsset(@Req() req: any, @Param('id') id: string) { return this.svc.returnAsset(req.orgId, id); }
  @Post('assets/:id/assign') @RequirePermissions('document:*') assignAssetById(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    // if assigning existing asset to employee, update
    return this.svc.update(req.orgId, id, dto) as any;
  }
}
