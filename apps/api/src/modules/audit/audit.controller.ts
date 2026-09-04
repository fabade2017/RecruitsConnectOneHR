import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('audit')
@Controller()
export class AuditController {
  constructor(private svc: AuditService) {}

  @Get('audit-logs')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'List audit logs with full transparency — timing, IP, before/after' })
  list(@Req() req: any, @Query() q: any) {
    return this.svc.list(req.orgId, q, req.user);
  }

  @Get('admin/audit-logs')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Admin alias for audit logs (super_admin sees all)' })
  adminList(@Req() req: any, @Query() q: any) {
    return this.svc.list(req.orgId, q, req.user);
  }

  @Get('audit-logs/stats')
  @RequirePermissions('audit:read')
  stats(@Req() req: any) {
    return this.svc.stats(req.orgId, req.user);
  }

  @Get('admin/audit-logs/stats')
  @RequirePermissions('audit:read')
  adminStats(@Req() req: any) {
    return this.svc.stats(req.orgId, req.user);
  }

  @Get('audit-logs/export')
  @RequirePermissions('audit:read')
  async exportCsv(@Req() req: any, @Query() q: any, @Res() res: any) {
    const { csv, count } = await this.svc.exportCsv(req.orgId, q, req.user);
    res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="audit-${new Date().toISOString().slice(0,10)}.csv"`, 'X-Total-Count': String(count) });
    res.send(csv);
  }

  @Get('audit-logs/:id')
  @RequirePermissions('audit:read')
  getOne(@Req() req: any, @Param('id') id: string) {
    return this.svc.getOne(req.orgId, id, req.user);
  }

  @Get('admin/audit-logs/:id')
  @RequirePermissions('audit:read')
  adminGetOne(@Req() req: any, @Param('id') id: string) {
    return this.svc.getOne(req.orgId, id, req.user);
  }
}
