import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get() @RequirePermissions('employee:read') list(@Req() req: any, @Query() q: any) { return this.svc.list(req.orgId, q, req.user); }
  @Get('unread/count') @RequirePermissions('employee:read') unread(@Req() req: any) { return this.svc.countUnread(req.orgId, req.user); }
  @Get(':id') @RequirePermissions('employee:read') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.orgId, id); }
  @Post() @RequirePermissions('employee:read') create(@Req() req: any, @Body() dto: any) { return this.svc.create(req.orgId, dto, req.user); }
  @Post('test') @RequirePermissions('employee:read') test(@Req() req: any, @Body() dto: any) { return this.svc.test(req.orgId, dto); }
  @Patch(':id/read') @RequirePermissions('employee:read') read(@Req() req: any, @Param('id') id: string) { return this.svc.markRead(req.orgId, id); }
  @Post('read-all') @RequirePermissions('employee:read') readAll(@Req() req: any) { return this.svc.markAllRead(req.orgId, req.user); }
  @Delete(':id') @RequirePermissions('employee:read') remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.orgId, id); }
}
