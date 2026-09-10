DROP INDEX IF EXISTS idx_recruiter_profiles_capability;
ALTER TABLE recruiter_profiles
    DROP CONSTRAINT IF EXISTS recruiter_profiles_capability_status_check;
ALTER TABLE recruiter_profiles
    DROP COLUMN IF EXISTS capability_status;
