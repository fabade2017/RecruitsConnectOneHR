import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private svc: AiService) {}
  @Post('chat') @RequirePermissions('employee:read') chat(@Req() req: any, @Body() dto: any) { return this.svc.chat(req.orgId, dto, req.user); }
  @Post('copilot') @RequirePermissions('employee:read') copilot(@Req() req: any, @Body() dto: any) { return this.svc.copilot(req.orgId, dto, req.user); }
  @Post('copilot/query') @RequirePermissions('employee:read') copilotQuery(@Req() req: any, @Body() dto: any) { return this.svc.copilotQuery(req.orgId, dto, req.user); }
  @Get('copilot/history') @RequirePermissions('employee:read') history(@Req() req: any, @Query() q: any) { return this.svc.history(req.orgId, q, req.user); }

  // Alias for frontend that calls /ai/copilot with lowercase
  @Post('query') @RequirePermissions('employee:read') query(@Req() req: any, @Body() dto: any) { return this.svc.chat(req.orgId, dto, req.user); }

  @Get('provider') @RequirePermissions('employee:read') provider() { return this.svc.providerInfo(); }
}

// Also handle /policies/query alias via forward? Already in policies. But add alias for /ai/copilot/query spec POST /ai/copilot/query is same as chat
