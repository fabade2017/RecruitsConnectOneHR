import { AsyncLocalStorage } from 'node:async_hooks';

export type TenantStore = {
  orgId: string | null;
  role?: string | null;
  bypass?: boolean;
};

export const tenantAls = new AsyncLocalStorage<TenantStore>();

/**
 * Models that carry an `organizationId` column and are therefore tenant-scoped.
 * Kept in sync with prisma/schema.prisma — regenerate with:
 *   awk '/^model /{m=$2} /organizationId/{print m}' prisma/schema.prisma | sort -u
 */
export const TENANT_SCOPED_MODELS = new Set<string>([
  'Asset', 'AttendanceEvent', 'AttendanceException', 'AttendancePolicy', 'AttendanceRecords',
  'AuditLog', 'BankDetail', 'Branch', 'Certification', 'CompliancePolicy', 'Conversation',
  'Course', 'Department', 'Device', 'Document', 'Employee', 'EngagementSurvey', 'InternalVacancy',
  'JobPosting', 'KnowledgeArticle', 'LeaveRequest', 'LeaveType', 'Message', 'Notification',
  'OnboardingProgress', 'OrganizationSubscription', 'PayrollMerged', 'PerformanceReview', 'Policy',
  'Project', 'RoleDefinition', 'Shift', 'SubscriptionRenewal', 'TalentOpportunity', 'Task', 'User',
  'WorkSession', 'Workflow', 'WorkflowInstance', 'WorkforceScore',
]);

export function tenantEnabled(): boolean {
  const raw = (process.env.TENANT_GUARD ?? 'on').toLowerCase();
  return raw !== 'off' && raw !== 'false' && raw !== '0' && raw !== 'disabled';
}

/**
 * The organization the current request must be confined to, or null when no
 * scoping should be applied (global admins, background jobs, seeds, CLI scripts).
 */
export function activeOrgId(): string | null {
  if (!tenantEnabled()) return null;
  const store = tenantAls.getStore();
  if (!store || store.bypass) return null;
  if (store.role === 'super_admin') return null;
  return store.orgId ?? null;
}

export function runWithTenant<T>(store: TenantStore, fn: () => T): T {
  return tenantAls.run(store, fn);
}