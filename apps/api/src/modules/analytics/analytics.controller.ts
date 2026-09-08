import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';
import { RequireModule } from '../../common/guards/module.guard';

@ApiTags('analytics')
@RequireModule('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private svc: AnalyticsService) {}
  @Get('workforce-scores') @RequirePermissions('report:read') scores(@Req() req: any, @Query() q: any) { return this.svc.workforceScores(req.orgId, q); }
  @Get('workforce-score') @RequirePermissions('report:read') score(@Req() req: any, @Query() q: any) { return this.svc.workforceScores(req.orgId, q); }
  @Get('dashboard') @RequirePermissions('report:read') dashboard(@Req() req: any, @Query() q: any) { return this.svc.dashboard(req.orgId, q); }
  @Get('reports') @RequirePermissions('report:read') reports(@Req() req: any, @Query() q: any) { return this.svc.reports(req.orgId, q); }
  @Get('activity') @RequirePermissions('report:read') activity(@Req() req: any, @Query() q: any) { return this.svc.activity(req.orgId, q); }
  @Get('risks') @RequirePermissions('report:read') risks(@Req() req: any) { return this.svc.risks(req.orgId); }
  @Get('early-warnings') @RequirePermissions('report:read') warnings(@Req() req: any, @Query() q: any) { return this.svc.earlyWarnings(req.orgId, q); }
  @Post('simulate') @RequirePermissions('report:read') simulate(@Req() req: any, @Body() dto: any) { return this.svc.simulate(req.orgId, dto); }
  @Get('digital-twin') @RequirePermissions('report:read') twin(@Req() req: any, @Query() q: any) { return this.svc.digitalTwin(req.orgId, q); }
  @Get('workforce-score/detail') @RequirePermissions('report:read') detail(@Req() req: any, @Query() q: any) { return this.svc.workforceScores(req.orgId, q); }
}
