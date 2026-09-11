-- Freelancer capability lifecycle.
--
-- What made a user a freelancer, before this: a row in freelancer_profiles.
-- Nothing else. The workspace resolver asked HasProfile, and POST
-- /freelance/profile created that row from a payload with no required field, so
-- an empty JSON body was enough to acquire the Freelancer workspace
-- permanently. There was no state in which freelancing could be withheld,
-- reviewed, or withdrawn.
--
-- The consequence is the one this migration exists to remove: Kirmya could not
-- stop somebody freelancing without suspending their whole account. A
-- freelancer who defrauded a client had to lose their feed, their network,
-- their messages and their job applications too, or keep bidding.
--
-- freelancer_profiles has no column that can carry the distinction.
-- availability_status is 'available' / 'busy' - whether the person wants work
-- this week, not whether Kirmya permits them to take it. Overloading it would
-- mean a freelancer could lift their own suspension by marking themselves
-- available.
--
-- So one column, on the table that already carries freelancer identity and is
-- already UNIQUE on user_id.
ALTER TABLE freelancer_profiles
    ADD COLUMN IF NOT EXISTS capability_status TEXT NOT NULL DEFAULT 'pending';

-- pending    a profile exists, onboarding is not complete; the account may
--            finish onboarding and nothing else
-- active     onboarding completed; the Freelancer capability is usable
-- suspended  withdrawn by an administrator; denied, and not self-restorable
--
-- Three states, deliberately. There is no reviewer queue for freelancer
-- profiles and no rejection path in the product, so 'rejected' and 'disabled'
-- would be states nothing can enter or leave.
ALTER TABLE freelancer_profiles
    DROP CONSTRAINT IF EXISTS freelancer_profiles_capability_status_check;
ALTER TABLE freelancer_profiles
    ADD CONSTRAINT freelancer_profiles_capability_status_check
    CHECK (capability_status IN ('pending', 'active', 'suspended'));

-- Backfill, conservative by design.
--
-- There is no onboarding-completion marker to read: unlike the recruiter
-- module, which writes a 'Onboarding Completed' activity row, freelancer
-- profiles were written by exactly one path - SaveProfile - which recorded no
-- completion signal and required no field. The only evidence available is
-- whether the profile carries the details a freelancer needs in order to be
-- hired at all.
--
-- So: a rate, a tagline and at least one skill. A profile with all three was
-- filled in by somebody who meant it. A profile missing any of them cannot be
-- distinguished from the empty row that POST /freelance/profile created from
-- '{}', and stays pending.
--
-- That is the fail-safe direction. Someone who genuinely freelanced but left
-- their skills blank completes onboarding once, which is a small annoyance;
-- the alternative grants unrevoked freelancing authority to every row the old
-- no-required-fields endpoint ever created.
UPDATE freelancer_profiles
SET capability_status = 'active'
WHERE hourly_rate > 0
  AND coalesce(trim(tagline), '') <> ''
  AND jsonb_typeof(skills) = 'array'
  AND jsonb_array_length(skills) > 0;

-- The eligibility lookup runs on every /auth/me. user_id is already UNIQUE, so
-- this is a covering index for it rather than a new access path.
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_capability
    ON freelancer_profiles (user_id, capability_status);

-- Administrative authority over the lifecycle.
--
-- Suspending someone's freelancing is a platform decision and needs a route, and
-- every administrative route carries a named permission (see 0099/0100). No
-- existing code fits: users.suspend is about the whole account, which is
-- precisely what this lifecycle exists to avoid touching.
INSERT INTO admin_permissions (id, code, category, description) VALUES
    (gen_random_uuid(), 'freelancers.read',   'users', 'View freelancer capability standing'),
    (gen_random_uuid(), 'freelancers.manage', 'users', 'Suspend and reinstate a freelancer capability')
ON CONFLICT (code) DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'platform_admin'
  AND p.code NOT IN ('roles.manage', 'users.impersonate')
ON CONFLICT DO NOTHING;

-- read_only_admin stays derived from '%.read', so freelancers.read joins it the
-- same way every other read permission has.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'read_only_admin'
  AND p.code LIKE '%.read'
ON CONFLICT DO NOTHING;

-- The two roles that already decide what a person may do on the platform:
-- account administration, and the desk that acts on abuse reports.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code IN ('user_admin', 'trust_safety_admin')
  AND p.code IN ('freelancers.read', 'freelancers.manage')
ON CONFLICT DO NOTHING;
