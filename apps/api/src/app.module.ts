import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { LeaveModule } from './modules/leave/leave.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TalentModule } from './modules/talent/talent.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { AiModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { LearningModule } from './modules/learning/learning.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { BranchesModule } from './modules/branches/branches.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AuditModule } from './modules/audit/audit.module';
import { ChatModule } from './modules/chat/chat.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RbacGuard } from './common/guards/rbac.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    EmployeesModule,
    AttendanceModule,
    ShiftsModule,
    LeaveModule,
    ProjectsModule,
    PerformanceModule,
    DocumentsModule,
    WorkflowsModule,
    NotificationsModule,
    TalentModule,
    PoliciesModule,
    AiModule,
    AnalyticsModule,
    PayrollModule,
    JobsModule,
    LearningModule,
    EngagementModule,
    ComplianceModule,
    HealthModule,
    AdminModule,
    DepartmentsModule,
    BranchesModule,
    OnboardingModule,
    IntegrationsModule,
    AuditModule,
    ChatModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
