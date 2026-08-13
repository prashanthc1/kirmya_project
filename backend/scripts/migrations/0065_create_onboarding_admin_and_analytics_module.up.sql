-- Migration 0065 Up: Create Onboarding Config, Analytics Events, and Extend Progress Table

-- 1. Onboarding Config Table
CREATE TABLE IF NOT EXISTS onboarding_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_key VARCHAR(64) UNIQUE NOT NULL,
    step_order INT NOT NULL,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    role_target VARCHAR(50) NOT NULL DEFAULT 'all', -- all, user, recruiter, employer
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Onboarding Analytics Events Table
CREATE TABLE IF NOT EXISTS onboarding_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL, -- onboarding.started, onboarding.step_viewed, onboarding.step_completed, onboarding.step_skipped, onboarding.abandoned, onboarding.resumed, onboarding.completed
    step_number INT,
    step_key VARCHAR(64),
    role_type VARCHAR(50) DEFAULT 'user',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user ON onboarding_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_type ON onboarding_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_step ON onboarding_analytics_events(step_key);

-- 3. Extend onboarding_progress table if missing columns
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS skipped_steps JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS onboarding_version INT NOT NULL DEFAULT 1;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS role_type VARCHAR(50) NOT NULL DEFAULT 'user';
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Seed Default Onboarding Step Configs
INSERT INTO onboarding_config (step_key, step_order, title, description, is_required, is_enabled, role_target) VALUES
('welcome', 1, 'Welcome to Kirmya', 'Overview of career recovery and professional networking features.', true, true, 'all'),
('account_basics', 2, 'Account & Profile Basics', 'Verify your name and account identification.', true, true, 'all'),
('profile_photo', 3, 'Profile Photo', 'Upload a professional profile avatar.', false, true, 'all'),
('headline', 4, 'Professional Headline', 'Summarize your core expertise and target role.', false, true, 'user'),
('experience', 5, 'Recent Work Experience', 'Add your current or past employment history.', false, true, 'user'),
('skills', 6, 'Core Technical Skills', 'Highlight your key skills and competencies.', false, true, 'user'),
('education', 7, 'Education & Certifications', 'Degree, field of study, and professional licenses.', false, true, 'user'),
('resume_upload', 8, 'Resume Import', 'Parse experience and skills automatically from CV.', false, true, 'user'),
('career_goals', 9, 'Career Goals & Target Industry', 'Define target job title and career growth path.', false, true, 'user'),
('job_preferences', 10, 'Job Seeking Preferences', 'Remote, hybrid, location, and salary expectations.', false, true, 'user'),
('job_alerts', 11, 'Job Alert Configuration', 'Receive real-time notifications for relevant listings.', false, true, 'user'),
('communities', 12, 'Community Discovery', 'Join industry guilds and layoff recovery peer networks.', false, true, 'user'),
('networking', 13, 'Professional Connections', 'Connect with verified recruiters, mentors, and peers.', false, true, 'user'),
('recruiter_setup', 14, 'Recruiter Hiring Focus', 'Configure candidate search filters and company association.', false, true, 'recruiter'),
('review_completion', 15, 'Profile Review & Finish', 'Review completed profile and launch personalized dashboard.', true, true, 'all')
ON CONFLICT (step_key) DO NOTHING;
