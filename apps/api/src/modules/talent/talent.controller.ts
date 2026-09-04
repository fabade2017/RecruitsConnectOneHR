import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TalentService } from './talent.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('talent')
@Controller()
export class TalentController {
  constructor(private svc: TalentService) {}

  @Get('vacancies') @RequirePermissions('employee:read') listVacancies(@Req() req: any, @Query() q: any) { return this.svc.listVacancies(req.orgId, q, req.user); }
  @Post('vacancies') @RequirePermissions('job:*') createVacancy(@Req() req: any, @Body() dto: any) { return this.svc.createVacancy(req.orgId, dto); }
  @Get('vacancies/:id') @RequirePermissions('employee:read') getVacancy(@Req() req: any, @Param('id') id: string) { return this.svc.getVacancy(req.orgId, id); }
  @Post('vacancies/:id/apply') @RequirePermissions('employee:read') apply(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.svc.apply(req.orgId, id, dto, req.user); }
  @Get('vacancies/:id/applications') @RequirePermissions('employee:read') apps(@Req() req: any, @Param('id') id: string) { return this.svc.listApplications(req.orgId, id); }

  @Get('talent/opportunities') @RequirePermissions('employee:read') opps(@Req() req: any, @Query() q: any) { return this.svc.listOpportunities(req.orgId, q); }
  @Post('talent/opportunities') @RequirePermissions('job:*') createOpp(@Req() req: any, @Body() dto: any) { return this.svc.createOpportunity(req.orgId, dto); }
  @Get('talent/marketplace') @RequirePermissions('employee:read') marketplace(@Req() req: any, @Query() q: any) { return this.svc.marketplace(req.orgId, q); }
}
