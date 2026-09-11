-- Reverse the freelancer capability lifecycle.
--
-- The column goes, which returns the rule to "a profile row is the capability".
-- Nothing is deleted: profiles, proposals and contracts are untouched, so
-- re-applying the up migration re-derives the same classification from the same
-- profile contents.
DELETE FROM admin_role_permissions
WHERE permission_id IN (
    SELECT id FROM admin_permissions WHERE code IN ('freelancers.read', 'freelancers.manage')
);
DELETE FROM admin_permissions WHERE code IN ('freelancers.read', 'freelancers.manage');

DROP INDEX IF EXISTS idx_freelancer_profiles_capability;

ALTER TABLE freelancer_profiles
    DROP CONSTRAINT IF EXISTS freelancer_profiles_capability_status_check;
ALTER TABLE freelancer_profiles
    DROP COLUMN IF EXISTS capability_status;
