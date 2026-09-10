-- Give the admin RBAC something to say.
--
-- admin_roles, admin_permissions, admin_role_permissions and admin_user_roles
-- have existed since 0055 and have never held a row. Nothing seeded them,
-- nothing assigned a role, and no route consulted them: RequireAdmin() reads
-- users.role_id from the token and admits admin, super_admin and platform_admin
-- identically, which is the whole of platform authorization today.
--
-- That left the console offering an administrator a roles screen whose
-- selections changed nothing, and it left three code paths inventing authority
-- from an empty table - GetUserPermissions answering "users.read, reports.read,
-- health.read" and GetUserRoles answering "super_admin" for every account
-- alive, precisely because no row existed to answer with.
--
-- This seeds the vocabulary. The enforcement rule that reads it is:
--
--   an account with NO row in admin_user_roles has every permission
--   an account WITH rows has exactly the permissions those roles carry
--
-- so an assignment can only ever narrow. That direction is deliberate and it is
-- what makes this safe to deploy: every administrator today has no assignment,
-- keeps every permission, and notices nothing. Narrowing is opt-in, one account
-- at a time, and RequireAdmin() still gates the group ahead of any of it - none
-- of this can admit somebody the middleware would refuse.

-- Permissions, one row per thing an administrator can do on a route that
-- exists. Nothing aspirational: every code below is enforced by a route in
-- internal/admin/delivery/http/routes.go.
INSERT INTO admin_permissions (id, code, category, description) VALUES
    (gen_random_uuid(), 'dashboard.read',      'overview',   'View the administrative dashboard'),
    (gen_random_uuid(), 'users.read',          'users',      'View user accounts'),
    (gen_random_uuid(), 'users.update',        'users',      'Change a user account'),
    (gen_random_uuid(), 'users.suspend',       'users',      'Suspend or reinstate a user account'),
    (gen_random_uuid(), 'users.impersonate',   'users',      'Open an impersonation session as another user'),
    (gen_random_uuid(), 'companies.read',      'companies',  'View companies'),
    (gen_random_uuid(), 'companies.verify',    'companies',  'Approve or reject a company verification'),
    (gen_random_uuid(), 'companies.suspend',   'companies',  'Change a company status'),
    (gen_random_uuid(), 'recruiters.read',     'recruiters', 'View recruiter accounts'),
    (gen_random_uuid(), 'jobs.read',           'jobs',       'View job postings'),
    (gen_random_uuid(), 'jobs.moderate',       'jobs',       'Moderate a job posting'),
    (gen_random_uuid(), 'applications.read',   'jobs',       'View applications'),
    (gen_random_uuid(), 'communities.moderate','communities','Moderate communities'),
    (gen_random_uuid(), 'reports.read',        'trust',      'View abuse reports'),
    (gen_random_uuid(), 'reports.resolve',     'trust',      'Resolve an abuse report'),
    (gen_random_uuid(), 'moderation.review',   'trust',      'Work the moderation queue'),
    (gen_random_uuid(), 'verifications.review','trust',      'Review identity and company verifications'),
    (gen_random_uuid(), 'system_jobs.read',    'operations', 'View background jobs'),
    (gen_random_uuid(), 'system_jobs.retry',   'operations', 'Retry a background job'),
    (gen_random_uuid(), 'incidents.manage',    'operations', 'Create and update operational incidents'),
    (gen_random_uuid(), 'maintenance.manage',  'operations', 'Turn maintenance mode on and off'),
    (gen_random_uuid(), 'observability.read',  'operations', 'View health, metrics and error telemetry'),
    (gen_random_uuid(), 'system_settings.manage','platform', 'Read and change system settings'),
    (gen_random_uuid(), 'feature_flags.manage','platform',   'Create and change feature flags'),
    (gen_random_uuid(), 'announcements.manage','platform',   'Publish platform announcements'),
    (gen_random_uuid(), 'analytics.read',      'insight',    'View platform analytics'),
    (gen_random_uuid(), 'audit_logs.read',     'insight',    'Read administrative audit logs'),
    (gen_random_uuid(), 'security_events.read','insight',    'Read security events'),
    (gen_random_uuid(), 'roles.manage',        'platform',   'Assign and revoke administrative roles')
ON CONFLICT (code) DO NOTHING;

-- Roles. is_system marks these as the platform's own, so a later console that
-- lets an operator define roles can tell them from the seeded ones.
INSERT INTO admin_roles (id, code, name, description, is_system) VALUES
    (gen_random_uuid(), 'super_admin',        'Super Admin',          'Unrestricted platform control, including role assignment', TRUE),
    (gen_random_uuid(), 'platform_admin',     'Platform Admin',       'Platform configuration and operations, without role assignment or impersonation', TRUE),
    (gen_random_uuid(), 'user_admin',         'User Admin',           'User account administration', TRUE),
    (gen_random_uuid(), 'trust_safety_admin', 'Trust & Safety Admin', 'Abuse reports, moderation and account suspension', TRUE),
    (gen_random_uuid(), 'content_moderator',  'Content Moderator',    'Job and community content moderation', TRUE),
    (gen_random_uuid(), 'verification_admin', 'Verification Admin',   'Company and identity verification review', TRUE),
    (gen_random_uuid(), 'support_admin',      'Support Admin',        'Customer support, including impersonation', TRUE),
    (gen_random_uuid(), 'analytics_admin',    'Analytics Admin',      'Platform analytics, audit logs and telemetry', TRUE),
    (gen_random_uuid(), 'operations_admin',   'Operations Admin',     'Background jobs, incidents and maintenance mode', TRUE),
    (gen_random_uuid(), 'read_only_admin',    'Read-only Admin',      'Sees the administrative surface, changes nothing', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Role to permission. Written as one INSERT ... SELECT per role so the mapping
-- reads as a list of permission codes rather than a wall of uuids.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'platform_admin'
  -- Everything except the two that let an administrator become someone else or
  -- grant themselves more. Those stay with super_admin.
  AND p.code NOT IN ('roles.manage', 'users.impersonate')
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'user_admin'
  AND p.code IN ('dashboard.read', 'users.read', 'users.update', 'users.suspend',
                 'companies.read', 'recruiters.read')
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'trust_safety_admin'
  AND p.code IN ('dashboard.read', 'reports.read', 'reports.resolve', 'moderation.review',
                 'communities.moderate', 'users.read', 'users.suspend')
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'content_moderator'
  AND p.code IN ('dashboard.read', 'jobs.read', 'jobs.moderate', 'applications.read',
                 'communities.moderate', 'reports.read', 'reports.resolve', 'moderation.review')
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'verification_admin'
  AND p.code IN ('dashboard.read', 'verifications.review', 'companies.read',
                 'companies.verify', 'companies.suspend')
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'support_admin'
  AND p.code IN ('dashboard.read', 'users.read', 'users.impersonate', 'reports.read')
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'analytics_admin'
  AND p.code IN ('dashboard.read', 'analytics.read', 'audit_logs.read',
                 'security_events.read', 'observability.read')
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'operations_admin'
  AND p.code IN ('dashboard.read', 'system_jobs.read', 'system_jobs.retry',
                 'incidents.manage', 'maintenance.manage', 'observability.read')
ON CONFLICT DO NOTHING;

-- Read-only is every permission whose code ends in .read, and nothing else. It
-- is derived rather than listed so a permission added later is not silently
-- excluded from the role whose whole definition is "can look at things".
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'read_only_admin'
  AND p.code LIKE '%.read'
ON CONFLICT DO NOTHING;

-- assigned_by has been on the table since 0055 and nothing ever wrote it. The
-- assign path does now, so a narrowing can be traced to whoever performed it.
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user ON admin_user_roles (user_id);
