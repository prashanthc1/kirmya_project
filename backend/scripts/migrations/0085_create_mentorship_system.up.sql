-- up migration: create mentorship system tables

-- 1. Mentor Profiles
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT DEFAULT '',
    job_title VARCHAR(255) DEFAULT '',
    company VARCHAR(255) DEFAULT '',
    years_experience INT DEFAULT 0,
    expertise TEXT[] DEFAULT '{}',
    industries TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    hourly_rate NUMERIC(10,2) DEFAULT 0.00,
    max_mentees INT DEFAULT 5,
    current_mentees INT DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 5.00,
    total_reviews INT DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    session_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_is_available ON mentor_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_rating ON mentor_profiles(rating DESC);

-- 2. Mentorship Requests
CREATE TABLE IF NOT EXISTS mentorship_requests (
    id UUID PRIMARY KEY,
    mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    goals TEXT[] DEFAULT '{}',
    preferred_schedule VARCHAR(255) DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    response_message TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentee_id ON mentorship_requests(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor_id ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON mentorship_requests(status);

-- 3. Mentorships (Active/Completed Relationships)
CREATE TABLE IF NOT EXISTS mentorships (
    id UUID PRIMARY KEY,
    request_id UUID REFERENCES mentorship_requests(id) ON DELETE SET NULL,
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentorships_mentor_id ON mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentee_id ON mentorships(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_status ON mentorships(status);

-- 4. Mentorship Goals
CREATE TABLE IF NOT EXISTS mentorship_goals (
    id UUID PRIMARY KEY,
    mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    target_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentorship_goals_mentorship_id ON mentorship_goals(mentorship_id);

-- 5. Mentorship Sessions
CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id UUID PRIMARY KEY,
    mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT DEFAULT 60,
    meeting_url TEXT DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    notes TEXT DEFAULT '',
    action_items TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentorship_id ON mentorship_sessions(mentorship_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_scheduled_at ON mentorship_sessions(scheduled_at);

-- 6. Mentorship Feedback
CREATE TABLE IF NOT EXISTS mentorship_feedback (
    id UUID PRIMARY KEY,
    mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES mentorship_sessions(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    feedback_type VARCHAR(50) DEFAULT 'session',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentorship_feedback_mentorship_id ON mentorship_feedback(mentorship_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_feedback_mentor_id ON mentorship_feedback(mentor_id);
