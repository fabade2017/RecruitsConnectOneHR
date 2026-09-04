"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
let IntegrationsService = class IntegrationsService {
    integrations = new Map();
    webhooks = new Map();
    defaultIntegrations() {
        return [
            { id: '1', name: 'Slack Notifications', provider: 'slack', status: 'connected', webhookUrl: 'https://hooks.slack.com/services/T...', events: ['leave.requested', 'attendance.exception', 'payroll.completed'], moduleKey: 'notifications', lastSync: '2m ago' },
            { id: '2', name: 'Microsoft Teams', provider: 'teams', status: 'connected', webhookUrl: 'https://outlook.office.com/webhook/...', events: ['employee.created', 'workflow.completed'], moduleKey: 'notifications', lastSync: '1h ago' },
        ];
    }
    listIntegrations(orgId) {
        if (!this.integrations.has(orgId))
            this.integrations.set(orgId, this.defaultIntegrations());
        return this.integrations.get(orgId);
    }
    createIntegration(orgId, dto) {
        const list = this.listIntegrations(orgId);
        const item = {
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
    listWebhooks(orgId) {
        if (!this.webhooks.has(orgId))
            this.webhooks.set(orgId, [
                { id: 'w1', url: 'https://example.com/webhook/onehr', events: ['employee.created', 'leave.approved'], secret: 'whsec_••••••••', active: true, createdAt: '2026-08-10', organizationId: orgId },
            ]);
        return this.webhooks.get(orgId);
    }
    createWebhook(orgId, dto) {
        const list = this.listWebhooks(orgId);
        const wh = {
            id: Math.random().toString(36).slice(2, 8),
            url: dto.url,
            events: dto.events || [],
            secret: dto.secret || 'whsec_' + Math.random().toString(36).slice(2, 12),
            active: true,
            createdAt: new Date().toISOString().slice(0, 10),
            organizationId: orgId,
        };
        list.push(wh);
        this.webhooks.set(orgId, list);
        return wh;
    }
    deleteWebhook(orgId, id) {
        const list = this.listWebhooks(orgId);
        const filtered = list.filter(w => w.id !== id);
        this.webhooks.set(orgId, filtered);
        return { deleted: true };
    }
    toggleWebhook(orgId, id) {
        const list = this.listWebhooks(orgId);
        const wh = list.find(w => w.id === id);
        if (wh)
            wh.active = !wh.active;
        return wh;
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = __decorate([
    (0, common_1.Injectable)()
], IntegrationsService);
