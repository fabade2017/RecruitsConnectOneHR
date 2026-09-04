"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuditLogInterceptor = class AuditLogInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const method = req.method;
        const url = req.url || '';
        const start = Date.now();
        const isWrite = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
        // Skip health and docs and audit-logs itself to avoid recursion
        const skip = url.includes('/health') || url.includes('/api/docs') || url.includes('/audit-logs');
        return next.handle().pipe((0, rxjs_1.tap)({
            next: async () => {
                if (skip)
                    return;
                // Log all writes + also auth login for transparency (POST /auth/login)
                const shouldLog = isWrite || url.includes('/auth/login') || url.includes('/auth/refresh');
                if (shouldLog && req.orgId) {
                    try {
                        const duration = Date.now() - start;
                        const statusCode = res?.statusCode;
                        const entityType = url.split('?')[0].split('/').filter(Boolean).pop() || 'unknown';
                        // Try to get entityId from params or body
                        const entityId = req.params?.id || req.body?.id || req.body?.employeeId || req.params?.employeeId || null;
                        // Truncate large bodies for audit
                        const bodyStr = req.body ? JSON.stringify(req.body).slice(0, 8000) : null;
                        const userAgent = req.headers?.['user-agent']?.slice(0, 500) || null;
                        await this.prisma.auditLog.create({
                            data: {
                                organizationId: req.orgId,
                                userId: req.user?.sub || req.user?.id || null,
                                action: `${method} ${url}`,
                                entityType,
                                entityId: entityId ? String(entityId).slice(0, 100) : null,
                                newValue: bodyStr,
                                ip: req.ip || req.headers?.['x-forwarded-for'] || null,
                                userAgent,
                                duration,
                                statusCode,
                            },
                        });
                    }
                    catch { }
                }
            },
            error: async (err) => {
                if (skip || !req.orgId)
                    return;
                try {
                    const duration = Date.now() - start;
                    await this.prisma.auditLog.create({
                        data: {
                            organizationId: req.orgId,
                            userId: req.user?.sub || null,
                            action: `${method} ${url} [ERROR]`,
                            entityType: 'error',
                            newValue: JSON.stringify({ message: err?.message, stack: err?.stack?.slice(0, 2000) }).slice(0, 8000),
                            ip: req.ip,
                            duration,
                            statusCode: err?.status || 500,
                        },
                    });
                }
                catch { }
            },
        }));
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogInterceptor);
