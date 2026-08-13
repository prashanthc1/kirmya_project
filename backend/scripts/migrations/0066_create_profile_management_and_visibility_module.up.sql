-- Migration 0066 Up: Profile Management, Professional Identity, Verification & Visibility Module

-- 1. Extend user_profiles table with header, identity, privacy, and verification fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(64) UNIQUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location VARCHAR(128) DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(128) DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS industry VARCHAR(128) DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_position VARCHAR(128) DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS open_to_recruiters BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_roles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_locations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(32) DEFAULT 'unverified'; -- unverified, pending, verified, rejected
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verification_notes TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_views_count INT DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS search_appearances_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification ON user_profiles(verification_status);

-- 2. User Work Experiences Table
CREATE TABLE IF NOT EXISTS user_work_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    employment_type VARCHAR(64) DEFAULT 'Full-time',
    location VARCHAR(255) DEFAULT '',
    start_date DATE NOT NULL,
    end_date DATE,
    is_current_job BOOLEAN DEFAULT false,
    description TEXT DEFAULT '',
    skills_used JSONB DEFAULT '[]'::jsonb,
    achievements TEXT DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_exp_profile ON user_work_experiences(profile_id);

-- 3. User Educations Table
CREATE TABLE IF NOT EXISTS user_educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255) DEFAULT '',
    start_date DATE,
    end_date DATE,
    grade VARCHAR(64) DEFAULT '',
    description TEXT DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_educations_profile ON user_educations(profile_id);

-- 4. User Profile Analytics Log Table
CREATE TABLE IF NOT EXISTS user_profile_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL, -- view, search_appearance, share
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_analytics_profile ON user_profile_analytics(profile_id);

-- 5. User Profile Reports Table (Trust & Safety Integration)
CREATE TABLE IF NOT EXISTS user_profile_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(128) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(32) DEFAULT 'pending', -- pending, reviewed, dismissed, actioned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_reports_reported ON user_profile_reports(reported_user_id);
