-- up migration: create candidate application tracker tables

CREATE TABLE IF NOT EXISTS saved_job_collections (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#0066FF',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES saved_job_collections(id) ON DELETE SET NULL,
    notes TEXT,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(candidate_id, job_id)
);

CREATE TABLE IF NOT EXISTS job_alerts (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    keywords TEXT,
    job_titles TEXT[],
    skills TEXT[],
    location VARCHAR(255),
    industry VARCHAR(100),
    salary_min INT DEFAULT 0,
    salary_max INT DEFAULT 0,
    employment_type VARCHAR(50) DEFAULT 'Full-time',
    frequency VARCHAR(20) DEFAULT 'Daily', -- 'Instant', 'Daily', 'Weekly'
    channel_email BOOLEAN DEFAULT TRUE,
    channel_push BOOLEAN DEFAULT TRUE,
    channel_in_app BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_documents (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'Resume', 'Cover Letter', 'Certificate', 'Portfolio'
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    file_type VARCHAR(50) DEFAULT 'application/pdf',
    is_default BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_notes (
    id UUID PRIMARY KEY,
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_reminders (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_type VARCHAR(50) DEFAULT 'Push', -- 'Email', 'Push', 'In-App'
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_analytics (
    candidate_id UUID PRIMARY KEY,
    total_applications INT DEFAULT 0,
    active_applications INT DEFAULT 0,
    interviews_scheduled INT DEFAULT 0,
    offers_received INT DEFAULT 0,
    rejected_applications INT DEFAULT 0,
    response_rate DOUBLE PRECISION DEFAULT 0.0,
    avg_time_to_response_days DOUBLE PRECISION DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate ON saved_jobs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_candidate ON job_alerts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate ON candidate_documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_app ON application_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_reminders_interview ON interview_reminders(interview_id);
