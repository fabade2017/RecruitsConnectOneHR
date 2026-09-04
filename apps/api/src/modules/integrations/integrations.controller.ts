import { Controller, Get, Post, Delete, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('integrations')
@Controller()
export class IntegrationsController {
  constructor(private svc: IntegrationsService) {}

  @Get('integrations') @RequirePermissions('employee:read') list(@Req() req: any) { return this.svc.listIntegrations(req.orgId); }
  @Post('integrations') @RequirePermissions('employee:read') create(@Req() req: any, @Body() dto: any) { return this.svc.createIntegration(req.orgId, dto); }

  @Get('webhooks') @RequirePermissions('employee:read') webhooks(@Req() req: any) { return this.svc.listWebhooks(req.orgId); }
  @Post('webhooks') @RequirePermissions('employee:read') createHook(@Req() req: any, @Body() dto: any) { return this.svc.createWebhook(req.orgId, dto); }
  @Delete('webhooks/:id') @RequirePermissions('employee:read') delHook(@Req() req: any, @Param('id') id: string) { return this.svc.deleteWebhook(req.orgId, id); }
  @Patch('webhooks/:id/toggle') @RequirePermissions('employee:read') toggleHook(@Req() req: any, @Param('id') id: string) { return this.svc.toggleWebhook(req.orgId, id); }

  // Aliases for frontend fallback paths
  @Get('notifications/webhooks') @RequirePermissions('employee:read') notifWebhooks(@Req() req: any) { return this.svc.listWebhooks(req.orgId); }
}
