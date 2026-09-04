import { Injectable } from '@nestjs/common';

type Integration = { id: string; name: string; provider: string; status: string; webhookUrl: string; events: string[]; moduleKey: string; lastSync?: string };
type Webhook = { id: string; url: string; events: string[]; secret: string; active: boolean; createdAt: string; organizationId: string };

@Injectable()
export class IntegrationsService {
  private integrations = new Map<string, Integration[]>();
  private webhooks = new Map<string, Webhook[]>();

  private defaultIntegrations(): Integration[] {
    return [
      { id: '1', name: 'Slack Notifications', provider: 'slack', status: 'connected', webhookUrl: 'https://hooks.slack.com/services/T...', events: ['leave.requested','attendance.exception','payroll.completed'], moduleKey: 'notifications', lastSync: '2m ago' },
      { id: '2', name: 'Microsoft Teams', provider: 'teams', status: 'connected', webhookUrl: 'https://outlook.office.com/webhook/...', events: ['employee.created','workflow.completed'], moduleKey: 'notifications', lastSync: '1h ago' },
    ];
  }

  listIntegrations(orgId: string) {
    if (!this.integrations.has(orgId)) this.integrations.set(orgId, this.defaultIntegrations());
    return this.integrations.get(orgId)!;
  }

  createIntegration(orgId: string, dto: any) {
    const list = this.listIntegrations(orgId);
    const item: Integration = {
      id: Math.random().toString(36).slice(2, 8),
      name: dto.name || dto.url || 'Custom Webhook',
      provider: dto.provider || 'custom',
      status: 'connected',
      webhookUrl: dto.url || dto.webhookUrl || '',
      events: dto.events || [],
      moduleKey: dto.moduleKey || 'general',
      lastSync: 'just now',
    };
    list.push(item);
    this.integrations.set(orgId, list);
    return item;
  }

  listWebhooks(orgId: string) {
    if (!this.webhooks.has(orgId)) this.webhooks.set(orgId, [
      { id: 'w1', url: 'https://example.com/webhook/onehr', events: ['employee.created','leave.approved'], secret: 'whsec_••••••••', active: true, createdAt: '2026-08-10', organizationId: orgId },
    ]);
    return this.webhooks.get(orgId)!;
  }

  createWebhook(orgId: string, dto: any) {
    const list = this.listWebhooks(orgId);
    const wh: Webhook = {
      id: Math.random().toString(36).slice(2, 8),
      url: dto.url,
      events: dto.events || [],
      secret: dto.secret || 'whsec_'+Math.random().toString(36).slice(2,12),
      active: true,
      createdAt: new Date().toISOString().slice(0,10),
      organizationId: orgId,
    };
    list.push(wh);
    this.webhooks.set(orgId, list);
    return wh;
  }

  deleteWebhook(orgId: string, id: string) {
    const list = this.listWebhooks(orgId);
    const filtered = list.filter(w => w.id !== id);
    this.webhooks.set(orgId, filtered);
    return { deleted: true };
  }

  toggleWebhook(orgId: string, id: string) {
    const list = this.listWebhooks(orgId);
    const wh = list.find(w => w.id === id);
    if (wh) wh.active = !wh.active;
    return wh;
  }
}
