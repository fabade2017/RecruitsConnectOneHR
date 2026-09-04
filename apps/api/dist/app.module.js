"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const employees_module_1 = require("./modules/employees/employees.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const shifts_module_1 = require("./modules/shifts/shifts.module");
const leave_module_1 = require("./modules/leave/leave.module");
const projects_module_1 = require("./modules/projects/projects.module");
const performance_module_1 = require("./modules/performance/performance.module");
const documents_module_1 = require("./modules/documents/documents.module");
const workflows_module_1 = require("./modules/workflows/workflows.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const talent_module_1 = require("./modules/talent/talent.module");
const policies_module_1 = require("./modules/policies/policies.module");
const ai_module_1 = require("./modules/ai/ai.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const learning_module_1 = require("./modules/learning/learning.module");
const engagement_module_1 = require("./modules/engagement/engagement.module");
const compliance_module_1 = require("./modules/compliance/compliance.module");
const health_module_1 = require("./modules/health/health.module");
const admin_module_1 = require("./modules/admin/admin.module");
const departments_module_1 = require("./modules/departments/departments.module");
const branches_module_1 = require("./modules/branches/branches.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
const integrations_module_1 = require("./modules/integrations/integrations.module");
const audit_module_1 = require("./modules/audit/audit.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const rbac_guard_1 = require("./common/guards/rbac.guard");
const audit_log_interceptor_1 = require("./common/interceptors/audit-log.interceptor");
const tenant_interceptor_1 = require("./common/interceptors/tenant.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            organizations_module_1.OrganizationsModule,
            employees_module_1.EmployeesModule,
            attendance_module_1.AttendanceModule,
            shifts_module_1.ShiftsModule,
            leave_module_1.LeaveModule,
            projects_module_1.ProjectsModule,
            performance_module_1.PerformanceModule,
            documents_module_1.DocumentsModule,
            workflows_module_1.WorkflowsModule,
            notifications_module_1.NotificationsModule,
            talent_module_1.TalentModule,
            policies_module_1.PoliciesModule,
            ai_module_1.AiModule,
            analytics_module_1.AnalyticsModule,
            payroll_module_1.PayrollModule,
            jobs_module_1.JobsModule,
            learning_module_1.LearningModule,
            engagement_module_1.EngagementModule,
            compliance_module_1.ComplianceModule,
            health_module_1.HealthModule,
            admin_module_1.AdminModule,
            departments_module_1.DepartmentsModule,
            branches_module_1.BranchesModule,
            onboarding_module_1.OnboardingModule,
            integrations_module_1.IntegrationsModule,
            audit_module_1.AuditModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: rbac_guard_1.RbacGuard },
            { provide: core_1.APP_INTERCEPTOR, useClass: tenant_interceptor_1.TenantInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: audit_log_interceptor_1.AuditLogInterceptor },
        ],
    })
], AppModule);
