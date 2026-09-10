-- Remove the permissions 0100 added, and with them their role mappings.
--
-- The mappings go first and by permission rather than by role: deleting the
-- permission rows alone would leave admin_role_permissions pointing at nothing,
-- and deleting by role would take 0099's mappings with them.
--
-- Reversing this narrows nobody. An account with no assignment still holds
-- every permission - now a shorter list - and an assigned account loses only
-- the codes that no longer exist, which no route consults once the code that
-- referenced them is also rolled back.
DELETE FROM admin_role_permissions
WHERE permission_id IN (
    SELECT id FROM admin_permissions WHERE code IN (
        'notifications.read', 'notifications.manage',
        'support.read', 'support.manage',
        'compliance.read', 'compliance.manage',
        'billing.read',
        'backups.read', 'backups.manage',
        'data_operations.read', 'data_operations.manage',
        'security.manage',
        'analytics.manage'
    )
);

DELETE FROM admin_permissions WHERE code IN (
    'notifications.read', 'notifications.manage',
    'support.read', 'support.manage',
    'compliance.read', 'compliance.manage',
    'billing.read',
    'backups.read', 'backups.manage',
    'data_operations.read', 'data_operations.manage',
    'security.manage',
    'analytics.manage'
);

-- Restore support_admin's users.impersonate, since 0099 granted it.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'support_admin' AND p.code = 'users.impersonate'
ON CONFLICT DO NOTHING;
