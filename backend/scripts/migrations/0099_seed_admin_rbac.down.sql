-- Remove the seeded vocabulary. Assignments referencing these roles go with
-- them by ON DELETE CASCADE, which returns every account to "no assignment" -
-- and under the enforcement rule that means every permission, the behaviour
-- before this was seeded.
DROP INDEX IF EXISTS idx_admin_user_roles_user;
DELETE FROM admin_roles WHERE is_system = TRUE AND code IN (
    'super_admin', 'platform_admin', 'user_admin', 'trust_safety_admin',
    'content_moderator', 'verification_admin', 'support_admin',
    'analytics_admin', 'operations_admin', 'read_only_admin'
);
DELETE FROM admin_permissions WHERE code IN (
    'dashboard.read', 'users.read', 'users.update', 'users.suspend', 'users.impersonate',
    'companies.read', 'companies.verify', 'companies.suspend', 'recruiters.read',
    'jobs.read', 'jobs.moderate', 'applications.read', 'communities.moderate',
    'reports.read', 'reports.resolve', 'moderation.review', 'verifications.review',
    'system_jobs.read', 'system_jobs.retry', 'incidents.manage', 'maintenance.manage',
    'observability.read', 'system_settings.manage', 'feature_flags.manage',
    'announcements.manage', 'analytics.read', 'audit_logs.read', 'security_events.read',
    'roles.manage'
);
