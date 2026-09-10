-- Extend the admin RBAC vocabulary past /api/v1/admin/*.
--
-- 0099 seeded a vocabulary that described one module. Enforcement reached only
-- that module too: the routes under internal/admin carried a granular
-- permission, and the twenty other modules that mount an administrative group
-- carried RequireAdmin() and nothing else.
--
-- So a read_only_admin - an account whose entire definition is "sees the
-- administrative surface, changes nothing" - was refused PUT /admin/users/:id
-- and allowed PATCH /admin/compliance/legal-holds/:id/release, POST
-- /admin/backups/restore-confirm, PUT /admin/security/settings and POST
-- /admin/data-operations/bulk-operations. The narrowing was real where it had
-- been written and absent everywhere else, which is worse than no narrowing at
-- all: it read as a guarantee it did not make.
--
-- The permissions below exist because the routes they gate had no honest
-- match in 0099's set. Mapping the notification desk to announcements.manage,
-- or a production restore to system_settings.manage, would have handed narrow
-- roles authority nobody chose to give them.
--
-- The enforcement rule is unchanged and still one-directional:
--
--   an account with NO row in admin_user_roles has every permission
--   an account WITH rows has exactly the permissions those roles carry
--
-- Every administrator today still has no assignment, so every administrator
-- still keeps exactly the access they have now. Adding permissions to this
-- table cannot narrow anybody, because the no-assignment case is defined as
-- "all of them" rather than as a list that could fall behind.

INSERT INTO admin_permissions (id, code, category, description) VALUES
    (gen_random_uuid(), 'notifications.read',    'notifications', 'View the notification desk: templates, queue, failures and providers'),
    (gen_random_uuid(), 'notifications.manage',  'notifications', 'Create and publish notification templates and retry dead letters'),
    (gen_random_uuid(), 'support.read',          'support',       'View support tickets, help articles and feedback'),
    (gen_random_uuid(), 'support.manage',        'support',       'Answer, assign and resolve support tickets, and publish help articles'),
    (gen_random_uuid(), 'compliance.read',       'compliance',    'View data subject requests, legal holds, retention and privacy records'),
    (gen_random_uuid(), 'compliance.manage',     'compliance',    'Decide data subject requests, place and release legal holds, change retention policy'),
    (gen_random_uuid(), 'billing.read',          'insight',       'View platform billing status, plans and entitlements'),
    (gen_random_uuid(), 'backups.read',          'operations',    'View backups, restore tests and backup configuration'),
    (gen_random_uuid(), 'backups.manage',        'operations',    'Trigger backups and restore tests, and confirm a production restore'),
    (gen_random_uuid(), 'data_operations.read',  'operations',    'View bulk imports, exports and migrations'),
    (gen_random_uuid(), 'data_operations.manage','operations',    'Run bulk imports, exports, retention runs and bulk operations'),
    (gen_random_uuid(), 'security.manage',       'platform',      'Change platform security settings, detection rules, incidents and alerts'),
    (gen_random_uuid(), 'analytics.manage',      'insight',       'Generate and schedule analytics exports and custom reports')
ON CONFLICT (code) DO NOTHING;

-- super_admin holds everything. Re-running the same INSERT ... SELECT as 0099
-- picks up the new codes; ON CONFLICT leaves the existing rows alone.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'platform_admin'
  AND p.code NOT IN ('roles.manage', 'users.impersonate')
ON CONFLICT DO NOTHING;

-- read_only_admin is still derived, not listed, so the six new .read codes join
-- it here for the same reason the original ones did. This is what makes "sees
-- the administrative surface, changes nothing" true across every module rather
-- than only across the one that happened to be enforced first.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'read_only_admin'
  AND p.code LIKE '%.read'
ON CONFLICT DO NOTHING;

-- Operations owns the machinery: backups, bulk data movement and the
-- notification pipeline, alongside the background jobs and incidents it already
-- had. Not security.manage - changing the platform's detection rules is not an
-- operational task, and it stays with super_admin and platform_admin.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'operations_admin'
  AND p.code IN ('backups.read', 'backups.manage',
                 'data_operations.read', 'data_operations.manage',
                 'notifications.read', 'notifications.manage')
ON CONFLICT DO NOTHING;

-- Support answers tickets and reads the notification desk to see whether a
-- user's mail actually went out. It does not manage templates.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'support_admin'
  AND p.code IN ('support.read', 'support.manage', 'notifications.read')
ON CONFLICT DO NOTHING;

-- Analytics generates the reports it already reads, and sees billing as one
-- more platform metric. It gets no write anywhere else.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'analytics_admin'
  AND p.code IN ('analytics.manage', 'billing.read')
ON CONFLICT DO NOTHING;

-- Take users.impersonate away from support_admin.
--
-- 0099 granted it, and the comment beside the platform_admin exclusion claimed
-- that among the seeded roles only super_admin could become another user. That
-- was not true of the seed it was describing. Impersonation produces a session
-- indistinguishable from the user's own; it belongs with role assignment, in
-- the one role that already holds every dangerous thing.
--
-- This narrows nobody today: admin_user_roles is empty, so no account holds
-- support_admin. The DELETE is scoped to the one (role, permission) pair and
-- cannot touch super_admin's grant of the same permission.
DELETE FROM admin_role_permissions
WHERE role_id = (SELECT id FROM admin_roles WHERE code = 'support_admin')
  AND permission_id = (SELECT id FROM admin_permissions WHERE code = 'users.impersonate');
