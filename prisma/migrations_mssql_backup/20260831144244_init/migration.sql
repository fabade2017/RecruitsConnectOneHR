BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[organizations] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [acronym] NVARCHAR(1000) NOT NULL,
    [industry_template] NVARCHAR(1000) NOT NULL CONSTRAINT [organizations_industry_template_df] DEFAULT 'generic',
    [country] VARCHAR(2) NOT NULL CONSTRAINT [organizations_country_df] DEFAULT 'NG',
    [timezone] NVARCHAR(1000) NOT NULL CONSTRAINT [organizations_timezone_df] DEFAULT 'Africa/Lagos',
    [config] NVARCHAR(max) NOT NULL CONSTRAINT [organizations_config_df] DEFAULT '{}',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [organizations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [company_group_id] NVARCHAR(1000),
    CONSTRAINT [organizations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [organizations_acronym_key] UNIQUE NONCLUSTERED ([acronym])
);

-- CreateTable
CREATE TABLE [dbo].[branches] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [address] NVARCHAR(1000),
    [location] NVARCHAR(1000),
    [is_head_office] BIT NOT NULL CONSTRAINT [branches_is_head_office_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [branches_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [branches_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[departments] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [branch_id] NVARCHAR(1000),
    [parent_id] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [cost_center] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [departments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [departments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [password_hash] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'employee',
    [custom_role_id] NVARCHAR(1000),
    [mfa_enabled] BIT NOT NULL CONSTRAINT [users_mfa_enabled_df] DEFAULT 0,
    [last_login_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_organization_id_email_key] UNIQUE NONCLUSTERED ([organization_id],[email])
);

-- CreateTable
CREATE TABLE [dbo].[employees] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_code] NVARCHAR(1000) NOT NULL,
    [qr_code] NVARCHAR(1000),
    [user_id] NVARCHAR(1000),
    [photo_url] NVARCHAR(1000),
    [face_profile_ref] NVARCHAR(1000),
    [department_id] NVARCHAR(1000),
    [branch_id] NVARCHAR(1000),
    [job_title] NVARCHAR(1000),
    [grade] NVARCHAR(1000),
    [manager_id] NVARCHAR(1000),
    [employment_type] NVARCHAR(1000) NOT NULL CONSTRAINT [employees_employment_type_df] DEFAULT 'permanent',
    [work_arrangement] NVARCHAR(1000) NOT NULL CONSTRAINT [employees_work_arrangement_df] DEFAULT 'office',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [employees_status_df] DEFAULT 'active',
    [hire_date] DATE,
    [probation_end_date] DATE,
    [skills] NVARCHAR(max) NOT NULL CONSTRAINT [employees_skills_df] DEFAULT '[]',
    [metadata] NVARCHAR(max) NOT NULL CONSTRAINT [employees_metadata_df] DEFAULT '{}',
    [consent_face] BIT NOT NULL CONSTRAINT [employees_consent_face_df] DEFAULT 0,
    [consent_gps] BIT NOT NULL CONSTRAINT [employees_consent_gps_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [employees_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [employees_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [employees_user_id_key] UNIQUE NONCLUSTERED ([user_id]),
    CONSTRAINT [employees_organization_id_employee_code_key] UNIQUE NONCLUSTERED ([organization_id],[employee_code])
);

-- CreateTable
CREATE TABLE [dbo].[attendance_policies] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [verification_methods] NVARCHAR(max) NOT NULL CONSTRAINT [attendance_policies_verification_methods_df] DEFAULT '["standard"]',
    [require_face_snapshot] BIT NOT NULL CONSTRAINT [attendance_policies_require_face_snapshot_df] DEFAULT 0,
    [snapshot_capture_events] NVARCHAR(max) NOT NULL CONSTRAINT [attendance_policies_snapshot_capture_events_df] DEFAULT '["clock_in"]',
    [snapshot_retention_days] INT NOT NULL CONSTRAINT [attendance_policies_snapshot_retention_days_df] DEFAULT 90,
    [snapshot_access_roles] NVARCHAR(max) NOT NULL CONSTRAINT [attendance_policies_snapshot_access_roles_df] DEFAULT '["org_admin","hr_admin"]',
    [require_gps] BIT NOT NULL CONSTRAINT [attendance_policies_require_gps_df] DEFAULT 0,
    [grace_period_minutes] INT NOT NULL CONSTRAINT [attendance_policies_grace_period_minutes_df] DEFAULT 10,
    [overtime_requires_approval] BIT NOT NULL CONSTRAINT [attendance_policies_overtime_requires_approval_df] DEFAULT 1,
    [device_registration_required] BIT NOT NULL CONSTRAINT [attendance_policies_device_registration_required_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [attendance_policies_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [attendance_policies_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [attendance_policies_organization_id_key] UNIQUE NONCLUSTERED ([organization_id])
);

-- CreateTable
CREATE TABLE [dbo].[devices] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000),
    [device_fingerprint] NVARCHAR(1000) NOT NULL,
    [device_type] NVARCHAR(1000) NOT NULL,
    [device_name] NVARCHAR(1000),
    [is_authorized] BIT NOT NULL CONSTRAINT [devices_is_authorized_df] DEFAULT 1,
    [last_seen_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [devices_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [devices_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[shifts] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [shifts_type_df] DEFAULT 'fixed',
    [start_time] NVARCHAR(1000),
    [end_time] NVARCHAR(1000),
    [timezone] NVARCHAR(1000) NOT NULL CONSTRAINT [shifts_timezone_df] DEFAULT 'Africa/Lagos',
    [break_duration_minutes] INT NOT NULL CONSTRAINT [shifts_break_duration_minutes_df] DEFAULT 60,
    [flexible_window_start] NVARCHAR(1000),
    [flexible_window_end] NVARCHAR(1000),
    [is_overnight] BIT NOT NULL CONSTRAINT [shifts_is_overnight_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [shifts_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [shifts_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[roster_assignments] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [shift_id] NVARCHAR(1000) NOT NULL,
    [date] DATE NOT NULL,
    [scheduled_minutes] INT NOT NULL CONSTRAINT [roster_assignments_scheduled_minutes_df] DEFAULT 480,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [roster_assignments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [roster_assignments_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [roster_assignments_employee_id_date_key] UNIQUE NONCLUSTERED ([employee_id],[date])
);

-- CreateTable
CREATE TABLE [dbo].[work_sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [shift_id] NVARCHAR(1000),
    [date] DATE NOT NULL,
    [clock_in_at] DATETIME2,
    [clock_out_at] DATETIME2,
    [breaks] NVARCHAR(max) NOT NULL CONSTRAINT [work_sessions_breaks_df] DEFAULT '[]',
    [gross_duration_minutes] INT,
    [break_duration_minutes] INT,
    [net_working_minutes] INT,
    [scheduled_minutes] INT,
    [overtime_minutes] INT,
    [late_minutes] INT,
    [early_departure_minutes] INT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [work_sessions_status_df] DEFAULT 'working',
    [verification_score] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [work_sessions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [work_sessions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [work_sessions_organization_id_employee_id_date_key] UNIQUE NONCLUSTERED ([organization_id],[employee_id],[date])
);

-- CreateTable
CREATE TABLE [dbo].[attendance_events] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [work_session_id] NVARCHAR(1000),
    [event_type] NVARCHAR(1000) NOT NULL,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [attendance_events_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [verification_method] NVARCHAR(1000) NOT NULL CONSTRAINT [attendance_events_verification_method_df] DEFAULT 'standard',
    [device_id] NVARCHAR(1000),
    [location] NVARCHAR(1000),
    [face_snapshot_ref] NVARCHAR(max),
    [face_confidence] DECIMAL(5,2),
    [verification_status] NVARCHAR(1000) NOT NULL CONSTRAINT [attendance_events_verification_status_df] DEFAULT 'pending',
    [ip_address] NVARCHAR(1000),
    [metadata] NVARCHAR(max) NOT NULL CONSTRAINT [attendance_events_metadata_df] DEFAULT '{}',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [attendance_events_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [attendance_events_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[attendance_exceptions] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [attendance_event_id] NVARCHAR(1000),
    [work_session_id] NVARCHAR(1000),
    [employee_id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [severity] NVARCHAR(1000) NOT NULL CONSTRAINT [attendance_exceptions_severity_df] DEFAULT 'medium',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [attendance_exceptions_status_df] DEFAULT 'pending',
    [assigned_to] NVARCHAR(1000),
    [details] NVARCHAR(max) NOT NULL CONSTRAINT [attendance_exceptions_details_df] DEFAULT '{}',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [attendance_exceptions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [attendance_exceptions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[activity_rollups] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [date] DATE NOT NULL,
    [login_sessions] INT NOT NULL CONSTRAINT [activity_rollups_login_sessions_df] DEFAULT 0,
    [active_system_minutes] INT NOT NULL CONSTRAINT [activity_rollups_active_system_minutes_df] DEFAULT 0,
    [workflow_actions] INT NOT NULL CONSTRAINT [activity_rollups_workflow_actions_df] DEFAULT 0,
    [tasks_completed] INT NOT NULL CONSTRAINT [activity_rollups_tasks_completed_df] DEFAULT 0,
    [documents_processed] INT NOT NULL CONSTRAINT [activity_rollups_documents_processed_df] DEFAULT 0,
    [approvals] INT NOT NULL CONSTRAINT [activity_rollups_approvals_df] DEFAULT 0,
    [training_activities] INT NOT NULL CONSTRAINT [activity_rollups_training_activities_df] DEFAULT 0,
    [hr_requests] INT NOT NULL CONSTRAINT [activity_rollups_hr_requests_df] DEFAULT 0,
    [computed_at] DATETIME2 NOT NULL CONSTRAINT [activity_rollups_computed_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [activity_rollups_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [activity_rollups_employee_id_date_key] UNIQUE NONCLUSTERED ([employee_id],[date])
);

-- CreateTable
CREATE TABLE [dbo].[leave_types] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [accrual_rule] NVARCHAR(max) NOT NULL CONSTRAINT [leave_types_accrual_rule_df] DEFAULT '{}',
    [max_days] INT,
    [requires_approval] BIT NOT NULL CONSTRAINT [leave_types_requires_approval_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [leave_types_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [leave_types_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[leave_requests] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [leave_type_id] NVARCHAR(1000) NOT NULL,
    [start_date] DATE NOT NULL,
    [end_date] DATE NOT NULL,
    [days] DECIMAL(5,1) NOT NULL,
    [reason] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [leave_requests_status_df] DEFAULT 'pending',
    [approver_id] NVARCHAR(1000),
    [workflow_instance_id] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [leave_requests_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [leave_requests_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[projects] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [owner_id] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [projects_status_df] DEFAULT 'active',
    [start_date] DATE,
    [end_date] DATE,
    [metadata] NVARCHAR(max) NOT NULL CONSTRAINT [projects_metadata_df] DEFAULT '{}',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [projects_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [projects_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[tasks] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000),
    [assignee_id] NVARCHAR(1000),
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [tasks_status_df] DEFAULT 'todo',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [tasks_priority_df] DEFAULT 'medium',
    [due_date] DATE,
    [completed_at] DATETIME2,
    [estimated_hours] DECIMAL(5,2),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [tasks_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [tasks_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[performance_reviews] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [cycle] NVARCHAR(1000) NOT NULL CONSTRAINT [performance_reviews_cycle_df] DEFAULT 'quarterly',
    [kpi] NVARCHAR(max) NOT NULL CONSTRAINT [performance_reviews_kpi_df] DEFAULT '[]',
    [manager_assessment] NVARCHAR(1000),
    [overall_indicator] NVARCHAR(1000),
    [review_date] DATE,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [performance_reviews_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [performance_reviews_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[documents] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [s3_key] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [documents_status_df] DEFAULT 'active',
    [expiry_date] DATE,
    [verification_status] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [documents_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [documents_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[assets] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [serial] NVARCHAR(1000),
    [assigned_at] DATETIME2 NOT NULL CONSTRAINT [assets_assigned_at_df] DEFAULT CURRENT_TIMESTAMP,
    [returned_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [assets_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [assets_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[certifications] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [issued_at] DATE,
    [expiry_at] DATE,
    [is_mandatory] BIT NOT NULL CONSTRAINT [certifications_is_mandatory_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [certifications_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [certifications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[workflows] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [trigger] NVARCHAR(1000) NOT NULL,
    [condition] NVARCHAR(max) NOT NULL CONSTRAINT [workflows_condition_df] DEFAULT '{}',
    [steps] NVARCHAR(max) NOT NULL CONSTRAINT [workflows_steps_df] DEFAULT '[]',
    [escalation] NVARCHAR(max) NOT NULL CONSTRAINT [workflows_escalation_df] DEFAULT '{}',
    [is_active] BIT NOT NULL CONSTRAINT [workflows_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [workflows_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [workflows_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[workflow_instances] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [workflow_id] NVARCHAR(1000) NOT NULL,
    [entity_type] NVARCHAR(1000) NOT NULL,
    [entity_id] NVARCHAR(1000) NOT NULL,
    [current_step] INT NOT NULL CONSTRAINT [workflow_instances_current_step_df] DEFAULT 0,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [workflow_instances_status_df] DEFAULT 'pending',
    [deadline] DATETIME2,
    [escalated_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [workflow_instances_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [workflow_instances_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[approvals] (
    [id] NVARCHAR(1000) NOT NULL,
    [instance_id] NVARCHAR(1000) NOT NULL,
    [approver_id] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [approvals_status_df] DEFAULT 'pending',
    [comment] NVARCHAR(1000),
    [decided_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [approvals_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [approvals_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[notifications] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000),
    [channel] NVARCHAR(1000) NOT NULL,
    [template] NVARCHAR(1000),
    [payload] NVARCHAR(max) NOT NULL CONSTRAINT [notifications_payload_df] DEFAULT '{}',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [notifications_status_df] DEFAULT 'pending',
    [sent_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [notifications_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [notifications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[policies] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL CONSTRAINT [policies_category_df] DEFAULT 'handbook',
    [s3_key] NVARCHAR(1000) NOT NULL,
    [version] INT NOT NULL CONSTRAINT [policies_version_df] DEFAULT 1,
    [approved_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [policies_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [policies_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[knowledge_articles] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [body] TEXT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [knowledge_articles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [knowledge_articles_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[internal_vacancies] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [department_id] NVARCHAR(1000),
    [description] TEXT,
    [eligibility_rules] NVARCHAR(max) NOT NULL CONSTRAINT [internal_vacancies_eligibility_rules_df] DEFAULT '{}',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [internal_vacancies_status_df] DEFAULT 'open',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [internal_vacancies_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [internal_vacancies_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[vacancy_applications] (
    [id] NVARCHAR(1000) NOT NULL,
    [vacancy_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [vacancy_applications_status_df] DEFAULT 'pending',
    [eligibility_check] NVARCHAR(max) NOT NULL CONSTRAINT [vacancy_applications_eligibility_check_df] DEFAULT '{}',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [vacancy_applications_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [vacancy_applications_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [vacancy_applications_vacancy_id_employee_id_key] UNIQUE NONCLUSTERED ([vacancy_id],[employee_id])
);

-- CreateTable
CREATE TABLE [dbo].[talent_opportunities] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [skills_required] NVARCHAR(max) NOT NULL CONSTRAINT [talent_opportunities_skills_required_df] DEFAULT '[]',
    [description] TEXT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [talent_opportunities_status_df] DEFAULT 'open',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [talent_opportunities_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [talent_opportunities_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[workforce_scores] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [branch_id] NVARCHAR(1000),
    [department_id] NVARCHAR(1000),
    [date] DATE NOT NULL,
    [attendance_health] DECIMAL(5,2),
    [performance_health] DECIMAL(5,2),
    [learning_health] DECIMAL(5,2),
    [engagement_health] DECIMAL(5,2),
    [compliance_health] DECIMAL(5,2),
    [stability] DECIMAL(5,2),
    [hr_health_overall] DECIMAL(5,2),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [workforce_scores_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [workforce_scores_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [workforce_scores_organization_id_date_branch_id_department_id_key] UNIQUE NONCLUSTERED ([organization_id],[date],[branch_id],[department_id])
);

-- CreateTable
CREATE TABLE [dbo].[audit_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000),
    [action] NVARCHAR(1000) NOT NULL,
    [entity_type] NVARCHAR(1000) NOT NULL,
    [entity_id] NVARCHAR(1000),
    [old_value] NVARCHAR(max),
    [new_value] NVARCHAR(max),
    [ip] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [audit_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[consent_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [granted] BIT NOT NULL,
    [version] NVARCHAR(1000),
    [ip] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [consent_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [consent_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[payrolls_merged] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [month] INT NOT NULL,
    [year] INT NOT NULL,
    [basic_salary] DECIMAL(12,2) NOT NULL,
    [allowances] DECIMAL(12,2) NOT NULL CONSTRAINT [payrolls_merged_allowances_df] DEFAULT 0,
    [deductions] DECIMAL(12,2) NOT NULL CONSTRAINT [payrolls_merged_deductions_df] DEFAULT 0,
    [tax] DECIMAL(12,2) NOT NULL CONSTRAINT [payrolls_merged_tax_df] DEFAULT 0,
    [net_pay] DECIMAL(12,2) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [payrolls_merged_status_df] DEFAULT 'DRAFT',
    [paid_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [payrolls_merged_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [payrolls_merged_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [payrolls_merged_employee_id_month_year_key] UNIQUE NONCLUSTERED ([employee_id],[month],[year])
);

-- CreateTable
CREATE TABLE [dbo].[bank_details] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [bank_name] NVARCHAR(1000) NOT NULL,
    [account_number] NVARCHAR(1000) NOT NULL,
    [account_name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [bank_details_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [bank_details_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [bank_details_employee_id_key] UNIQUE NONCLUSTERED ([employee_id])
);

-- CreateTable
CREATE TABLE [dbo].[job_postings] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [department] NVARCHAR(1000) NOT NULL,
    [location] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [description] TEXT NOT NULL,
    [requirements] TEXT,
    [salary_range] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [job_postings_status_df] DEFAULT 'OPEN',
    [posted_at] DATETIME2 NOT NULL CONSTRAINT [job_postings_posted_at_df] DEFAULT CURRENT_TIMESTAMP,
    [closes_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [job_postings_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [job_postings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[job_applications_merged] (
    [id] NVARCHAR(1000) NOT NULL,
    [job_id] NVARCHAR(1000) NOT NULL,
    [first_name] NVARCHAR(1000) NOT NULL,
    [last_name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [resume_url] NVARCHAR(1000),
    [cover_letter] TEXT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [job_applications_merged_status_df] DEFAULT 'NEW',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [job_applications_merged_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [job_applications_merged_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[courses] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    [category] NVARCHAR(1000) NOT NULL,
    [duration] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [courses_status_df] DEFAULT 'ACTIVE',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [courses_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [courses_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[learning_enrollments] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [course_id] NVARCHAR(1000) NOT NULL,
    [progress] INT NOT NULL CONSTRAINT [learning_enrollments_progress_df] DEFAULT 0,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [learning_enrollments_status_df] DEFAULT 'ENROLLED',
    [completed_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [learning_enrollments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [learning_enrollments_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [learning_enrollments_employee_id_course_id_key] UNIQUE NONCLUSTERED ([employee_id],[course_id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_surveys] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    [questions] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [engagement_surveys_status_df] DEFAULT 'DRAFT',
    [start_date] DATETIME2,
    [end_date] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [engagement_surveys_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [engagement_surveys_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_responses] (
    [id] NVARCHAR(1000) NOT NULL,
    [survey_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [answers] NVARCHAR(max) NOT NULL,
    [score] INT,
    [feedback] TEXT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [engagement_responses_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [engagement_responses_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [engagement_responses_survey_id_employee_id_key] UNIQUE NONCLUSTERED ([survey_id],[employee_id])
);

-- CreateTable
CREATE TABLE [dbo].[compliance_policies] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [content] TEXT NOT NULL,
    [version] NVARCHAR(1000) NOT NULL CONSTRAINT [compliance_policies_version_df] DEFAULT '1.0',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [compliance_policies_status_df] DEFAULT 'ACTIVE',
    [effective_date] DATETIME2 NOT NULL,
    [review_date] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [compliance_policies_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [compliance_policies_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[compliance_audits] (
    [id] NVARCHAR(1000) NOT NULL,
    [policy_id] NVARCHAR(1000) NOT NULL,
    [auditor] NVARCHAR(1000) NOT NULL,
    [findings] TEXT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [compliance_audits_status_df] DEFAULT 'PENDING',
    [completed_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [compliance_audits_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [compliance_audits_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[attendance_records] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [employee_id] NVARCHAR(1000) NOT NULL,
    [clock_in] DATETIME2 NOT NULL,
    [clock_out] DATETIME2,
    [clock_in_photo] TEXT,
    [clock_out_photo] TEXT,
    [clock_in_location] NVARCHAR(1000),
    [clock_out_location] NVARCHAR(1000),
    [clock_in_url] NVARCHAR(1000),
    [clock_out_url] NVARCHAR(1000),
    [ip_address] NVARCHAR(1000),
    [user_agent] TEXT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [attendance_records_status_df] DEFAULT 'CLOCKED_IN',
    [notes] TEXT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [attendance_records_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [attendance_records_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[company_groups] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    [logo_url] NVARCHAR(1000),
    [owner_id] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [company_groups_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [company_groups_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [company_groups_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [company_groups_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[permissions] (
    [id] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    [module] NVARCHAR(1000) NOT NULL,
    [is_system] BIT NOT NULL CONSTRAINT [permissions_is_system_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [permissions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [permissions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [permissions_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[role_definitions] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    [is_system] BIT NOT NULL CONSTRAINT [role_definitions_is_system_df] DEFAULT 0,
    [is_active] BIT NOT NULL CONSTRAINT [role_definitions_is_active_df] DEFAULT 1,
    [permissions] NVARCHAR(max) NOT NULL CONSTRAINT [role_definitions_permissions_df] DEFAULT '[]',
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [role_definitions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [role_definitions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [role_definitions_organization_id_slug_key] UNIQUE NONCLUSTERED ([organization_id],[slug])
);

-- CreateTable
CREATE TABLE [dbo].[subscription_plans] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    [price] DECIMAL(12,2) NOT NULL,
    [currency] NVARCHAR(1000) NOT NULL CONSTRAINT [subscription_plans_currency_df] DEFAULT 'NGN',
    [billingCycle] NVARCHAR(1000) NOT NULL CONSTRAINT [subscription_plans_billingCycle_df] DEFAULT 'monthly',
    [max_employees] INT NOT NULL CONSTRAINT [subscription_plans_max_employees_df] DEFAULT 50,
    [max_branches] INT NOT NULL CONSTRAINT [subscription_plans_max_branches_df] DEFAULT 3,
    [is_active] BIT NOT NULL CONSTRAINT [subscription_plans_is_active_df] DEFAULT 1,
    [is_custom] BIT NOT NULL CONSTRAINT [subscription_plans_is_custom_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [subscription_plans_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [subscription_plans_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [subscription_plans_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[plan_modules] (
    [id] NVARCHAR(1000) NOT NULL,
    [plan_id] NVARCHAR(1000) NOT NULL,
    [module_key] NVARCHAR(1000) NOT NULL,
    [enabled] BIT NOT NULL CONSTRAINT [plan_modules_enabled_df] DEFAULT 1,
    [config] NVARCHAR(max),
    CONSTRAINT [plan_modules_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [plan_modules_plan_id_module_key_key] UNIQUE NONCLUSTERED ([plan_id],[module_key])
);

-- CreateTable
CREATE TABLE [dbo].[organization_subscriptions] (
    [id] NVARCHAR(1000) NOT NULL,
    [organization_id] NVARCHAR(1000) NOT NULL,
    [company_group_id] NVARCHAR(1000),
    [plan_id] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [organization_subscriptions_status_df] DEFAULT 'active',
    [start_date] DATETIME2 NOT NULL CONSTRAINT [organization_subscriptions_start_date_df] DEFAULT CURRENT_TIMESTAMP,
    [end_date] DATETIME2,
    [billing_cycle] NVARCHAR(1000) NOT NULL CONSTRAINT [organization_subscriptions_billing_cycle_df] DEFAULT 'monthly',
    [auto_renew] BIT NOT NULL CONSTRAINT [organization_subscriptions_auto_renew_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [organization_subscriptions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [organization_subscriptions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [organization_subscriptions_organization_id_plan_id_key] UNIQUE NONCLUSTERED ([organization_id],[plan_id])
);

-- CreateTable
CREATE TABLE [dbo].[_OrgPermissions] (
    [A] NVARCHAR(1000) NOT NULL,
    [B] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [_OrgPermissions_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateTable
CREATE TABLE [dbo].[_RolePermissions] (
    [A] NVARCHAR(1000) NOT NULL,
    [B] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [_RolePermissions_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [branches_organization_id_idx] ON [dbo].[branches]([organization_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [departments_organization_id_idx] ON [dbo].[departments]([organization_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [employees_organization_id_status_idx] ON [dbo].[employees]([organization_id], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [employees_manager_id_idx] ON [dbo].[employees]([manager_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [devices_organization_id_device_fingerprint_idx] ON [dbo].[devices]([organization_id], [device_fingerprint]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [shifts_organization_id_idx] ON [dbo].[shifts]([organization_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [work_sessions_organization_id_date_idx] ON [dbo].[work_sessions]([organization_id], [date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [attendance_events_organization_id_employee_id_timestamp_idx] ON [dbo].[attendance_events]([organization_id], [employee_id], [timestamp]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [attendance_events_timestamp_idx] ON [dbo].[attendance_events]([timestamp]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [attendance_exceptions_organization_id_status_idx] ON [dbo].[attendance_exceptions]([organization_id], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [leave_types_organization_id_idx] ON [dbo].[leave_types]([organization_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [leave_requests_organization_id_status_idx] ON [dbo].[leave_requests]([organization_id], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [projects_organization_id_idx] ON [dbo].[projects]([organization_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tasks_assignee_id_status_idx] ON [dbo].[tasks]([assignee_id], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [performance_reviews_employee_id_idx] ON [dbo].[performance_reviews]([employee_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documents_employee_id_idx] ON [dbo].[documents]([employee_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [certifications_expiry_at_idx] ON [dbo].[certifications]([expiry_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [workflow_instances_organization_id_status_idx] ON [dbo].[workflow_instances]([organization_id], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notifications_user_id_status_idx] ON [dbo].[notifications]([user_id], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_organization_id_entity_type_idx] ON [dbo].[audit_logs]([organization_id], [entity_type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_created_at_idx] ON [dbo].[audit_logs]([created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [payrolls_merged_organization_id_status_idx] ON [dbo].[payrolls_merged]([organization_id], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [job_postings_organization_id_status_idx] ON [dbo].[job_postings]([organization_id], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [job_applications_merged_job_id_idx] ON [dbo].[job_applications_merged]([job_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [courses_organization_id_category_idx] ON [dbo].[courses]([organization_id], [category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [compliance_policies_organization_id_category_idx] ON [dbo].[compliance_policies]([organization_id], [category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [attendance_records_employee_id_idx] ON [dbo].[attendance_records]([employee_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [attendance_records_clock_in_idx] ON [dbo].[attendance_records]([clock_in]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [attendance_records_status_idx] ON [dbo].[attendance_records]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [permissions_module_idx] ON [dbo].[permissions]([module]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [role_definitions_organization_id_idx] ON [dbo].[role_definitions]([organization_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [plan_modules_plan_id_idx] ON [dbo].[plan_modules]([plan_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [organization_subscriptions_organization_id_idx] ON [dbo].[organization_subscriptions]([organization_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [organization_subscriptions_company_group_id_idx] ON [dbo].[organization_subscriptions]([company_group_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_OrgPermissions_B_index] ON [dbo].[_OrgPermissions]([B]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_RolePermissions_B_index] ON [dbo].[_RolePermissions]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[organizations] ADD CONSTRAINT [organizations_company_group_id_fkey] FOREIGN KEY ([company_group_id]) REFERENCES [dbo].[company_groups]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[branches] ADD CONSTRAINT [branches_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[departments] ADD CONSTRAINT [departments_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[departments] ADD CONSTRAINT [departments_branch_id_fkey] FOREIGN KEY ([branch_id]) REFERENCES [dbo].[branches]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[departments] ADD CONSTRAINT [departments_parent_id_fkey] FOREIGN KEY ([parent_id]) REFERENCES [dbo].[departments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_custom_role_id_fkey] FOREIGN KEY ([custom_role_id]) REFERENCES [dbo].[role_definitions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[employees] ADD CONSTRAINT [employees_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[employees] ADD CONSTRAINT [employees_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[employees] ADD CONSTRAINT [employees_department_id_fkey] FOREIGN KEY ([department_id]) REFERENCES [dbo].[departments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[employees] ADD CONSTRAINT [employees_branch_id_fkey] FOREIGN KEY ([branch_id]) REFERENCES [dbo].[branches]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[employees] ADD CONSTRAINT [employees_manager_id_fkey] FOREIGN KEY ([manager_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_policies] ADD CONSTRAINT [attendance_policies_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[devices] ADD CONSTRAINT [devices_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[devices] ADD CONSTRAINT [devices_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[shifts] ADD CONSTRAINT [shifts_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[roster_assignments] ADD CONSTRAINT [roster_assignments_shift_id_fkey] FOREIGN KEY ([shift_id]) REFERENCES [dbo].[shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[work_sessions] ADD CONSTRAINT [work_sessions_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[work_sessions] ADD CONSTRAINT [work_sessions_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[work_sessions] ADD CONSTRAINT [work_sessions_shift_id_fkey] FOREIGN KEY ([shift_id]) REFERENCES [dbo].[shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_events] ADD CONSTRAINT [attendance_events_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_events] ADD CONSTRAINT [attendance_events_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_events] ADD CONSTRAINT [attendance_events_work_session_id_fkey] FOREIGN KEY ([work_session_id]) REFERENCES [dbo].[work_sessions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_events] ADD CONSTRAINT [attendance_events_device_id_fkey] FOREIGN KEY ([device_id]) REFERENCES [dbo].[devices]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_exceptions] ADD CONSTRAINT [attendance_exceptions_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_exceptions] ADD CONSTRAINT [attendance_exceptions_attendance_event_id_fkey] FOREIGN KEY ([attendance_event_id]) REFERENCES [dbo].[attendance_events]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_exceptions] ADD CONSTRAINT [attendance_exceptions_work_session_id_fkey] FOREIGN KEY ([work_session_id]) REFERENCES [dbo].[work_sessions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_exceptions] ADD CONSTRAINT [attendance_exceptions_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_exceptions] ADD CONSTRAINT [attendance_exceptions_assigned_to_fkey] FOREIGN KEY ([assigned_to]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[activity_rollups] ADD CONSTRAINT [activity_rollups_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[leave_types] ADD CONSTRAINT [leave_types_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[leave_requests] ADD CONSTRAINT [leave_requests_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[leave_requests] ADD CONSTRAINT [leave_requests_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[leave_requests] ADD CONSTRAINT [leave_requests_leave_type_id_fkey] FOREIGN KEY ([leave_type_id]) REFERENCES [dbo].[leave_types]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[leave_requests] ADD CONSTRAINT [leave_requests_approver_id_fkey] FOREIGN KEY ([approver_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[projects] ADD CONSTRAINT [projects_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[tasks] ADD CONSTRAINT [tasks_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[tasks] ADD CONSTRAINT [tasks_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[tasks] ADD CONSTRAINT [tasks_assignee_id_fkey] FOREIGN KEY ([assignee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[performance_reviews] ADD CONSTRAINT [performance_reviews_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[performance_reviews] ADD CONSTRAINT [performance_reviews_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[documents] ADD CONSTRAINT [documents_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[documents] ADD CONSTRAINT [documents_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[assets] ADD CONSTRAINT [assets_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[assets] ADD CONSTRAINT [assets_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[certifications] ADD CONSTRAINT [certifications_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[certifications] ADD CONSTRAINT [certifications_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[workflows] ADD CONSTRAINT [workflows_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[workflow_instances] ADD CONSTRAINT [workflow_instances_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[workflow_instances] ADD CONSTRAINT [workflow_instances_workflow_id_fkey] FOREIGN KEY ([workflow_id]) REFERENCES [dbo].[workflows]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[approvals] ADD CONSTRAINT [approvals_instance_id_fkey] FOREIGN KEY ([instance_id]) REFERENCES [dbo].[workflow_instances]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[notifications] ADD CONSTRAINT [notifications_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[policies] ADD CONSTRAINT [policies_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[knowledge_articles] ADD CONSTRAINT [knowledge_articles_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[internal_vacancies] ADD CONSTRAINT [internal_vacancies_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[vacancy_applications] ADD CONSTRAINT [vacancy_applications_vacancy_id_fkey] FOREIGN KEY ([vacancy_id]) REFERENCES [dbo].[internal_vacancies]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[talent_opportunities] ADD CONSTRAINT [talent_opportunities_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[workforce_scores] ADD CONSTRAINT [workforce_scores_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [audit_logs_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[payrolls_merged] ADD CONSTRAINT [payrolls_merged_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[payrolls_merged] ADD CONSTRAINT [payrolls_merged_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[bank_details] ADD CONSTRAINT [bank_details_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[bank_details] ADD CONSTRAINT [bank_details_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[job_postings] ADD CONSTRAINT [job_postings_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[job_applications_merged] ADD CONSTRAINT [job_applications_merged_job_id_fkey] FOREIGN KEY ([job_id]) REFERENCES [dbo].[job_postings]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[courses] ADD CONSTRAINT [courses_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[learning_enrollments] ADD CONSTRAINT [learning_enrollments_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[learning_enrollments] ADD CONSTRAINT [learning_enrollments_course_id_fkey] FOREIGN KEY ([course_id]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_surveys] ADD CONSTRAINT [engagement_surveys_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_responses] ADD CONSTRAINT [engagement_responses_survey_id_fkey] FOREIGN KEY ([survey_id]) REFERENCES [dbo].[engagement_surveys]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_responses] ADD CONSTRAINT [engagement_responses_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[compliance_policies] ADD CONSTRAINT [compliance_policies_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[compliance_audits] ADD CONSTRAINT [compliance_audits_policy_id_fkey] FOREIGN KEY ([policy_id]) REFERENCES [dbo].[compliance_policies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_records] ADD CONSTRAINT [attendance_records_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendance_records] ADD CONSTRAINT [attendance_records_employee_id_fkey] FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[role_definitions] ADD CONSTRAINT [role_definitions_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[plan_modules] ADD CONSTRAINT [plan_modules_plan_id_fkey] FOREIGN KEY ([plan_id]) REFERENCES [dbo].[subscription_plans]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[organization_subscriptions] ADD CONSTRAINT [organization_subscriptions_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[organization_subscriptions] ADD CONSTRAINT [organization_subscriptions_company_group_id_fkey] FOREIGN KEY ([company_group_id]) REFERENCES [dbo].[company_groups]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[organization_subscriptions] ADD CONSTRAINT [organization_subscriptions_plan_id_fkey] FOREIGN KEY ([plan_id]) REFERENCES [dbo].[subscription_plans]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[_OrgPermissions] ADD CONSTRAINT [_OrgPermissions_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[organizations]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_OrgPermissions] ADD CONSTRAINT [_OrgPermissions_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[permissions]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_RolePermissions] ADD CONSTRAINT [_RolePermissions_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[permissions]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_RolePermissions] ADD CONSTRAINT [_RolePermissions_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[role_definitions]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
