import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';
import { RequireModule } from '../../common/guards/module.guard';

@ApiTags('performance')
@RequireModule('performance')
@Controller('performance')
export class PerformanceController {
  constructor(private svc: PerformanceService) {}
  @Get('reviews') @RequirePermissions('employee:read') list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q, req.user); }
  @Post('reviews') @RequirePermissions('task:*') create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto, req.user); }
  @Patch('reviews/:id') @RequirePermissions('task:*') update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.update(req.orgId, id, dto); }
  @Delete('reviews/:id') @RequirePermissions('task:*') remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.orgId, id); }
  @Get('health') @RequirePermissions('employee:read') health(@Req() req: any, @Query() q: any) { return this.svc.health(req.orgId, q); }
}
