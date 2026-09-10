-- Recruiter capability lifecycle.
--
-- Until now nothing made a user a recruiter. /recruiter/* was gated on
-- authentication alone, and the first call by any authenticated account
-- auto-provisioned an organization, a recruiter_organization_profile with
-- verification_status 'Verified', and a recruiter_profile with verified = true.
-- Both of those claims were written by the system for a profile nobody had
-- verified, and the account could then publish a live public job posting.
--
-- Recruiter capability needs a state the code can check, and neither existing
-- column can carry it:
--
--   recruiter_profiles.verified                       boolean, and means
--                                                     "verified", not "may act"
--   recruiter_organization_profiles.verification_status
--                                                     text, but conflating
--                                                     verification with
--                                                     capability is exactly the
--                                                     separation ADR 0002 keeps
--
-- So one column, on the table that already carries recruiter identity and is
-- unique on user_id.
ALTER TABLE recruiter_profiles
    ADD COLUMN IF NOT EXISTS capability_status TEXT NOT NULL DEFAULT 'pending';

-- pending    onboarding not completed; the account may onboard, nothing else
-- active     onboarding completed; the Recruiting capability is usable
-- suspended  withdrawn by an administrator; denied, and not self-restorable
ALTER TABLE recruiter_profiles
    DROP CONSTRAINT IF EXISTS recruiter_profiles_capability_status_check;
ALTER TABLE recruiter_profiles
    ADD CONSTRAINT recruiter_profiles_capability_status_check
    CHECK (capability_status IN ('pending', 'active', 'suspended'));

-- Backfill, deliberately not blanket in either direction.
--
-- SubmitOnboarding writes a recruiter_activity row of type 'Onboarding
-- Completed'; the auto-provisioning path never did. That marker is the only
-- signal in the data that separates someone who actually onboarded from someone
-- who merely touched an endpoint, so it is what decides.
--
-- Everything without it stays 'pending'. That is the fail-safe direction: an
-- account that genuinely onboarded but lost its activity row re-onboards, which
-- is a small annoyance; the alternative grants recruiter authority to every
-- account that ever loaded a recruiter page.
UPDATE recruiter_profiles rp
SET capability_status = 'active'
WHERE EXISTS (
    SELECT 1
    FROM recruiter_activity ra
    WHERE ra.recruiter_id = rp.id
      AND ra.activity_type = 'Onboarding Completed'
);

CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_capability
    ON recruiter_profiles (user_id, capability_status);

-- The fallback wrote verified = true for profiles nothing verified. Correct the
-- claim for every profile that never completed onboarding; leave the rest, so a
-- real verification decision is not overwritten.
UPDATE recruiter_profiles
SET verified = false
WHERE capability_status = 'pending';
