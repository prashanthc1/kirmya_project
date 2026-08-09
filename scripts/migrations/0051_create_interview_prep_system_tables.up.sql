-- up migration: create interview preparation and AI interview coach tables

-- 1. Interview Preparation Master Table
CREATE TABLE IF NOT EXISTS interview_preparations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL DEFAULT '',
    job_title VARCHAR(255) NOT NULL DEFAULT '',
    job_description TEXT DEFAULT '',
    interview_date TIMESTAMP WITH TIME ZONE,
    interview_type VARCHAR(100) NOT NULL DEFAULT 'Behavioral',
    interview_round VARCHAR(100) NOT NULL DEFAULT 'Recruiter Round',
    experience_level VARCHAR(50) DEFAULT 'Mid-Level',
    preparation_duration VARCHAR(50) DEFAULT '7 Days',
    status VARCHAR(50) NOT NULL DEFAULT 'In Progress', -- In Progress, Ready, Completed, Archived
    readiness_score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interview_prep_user ON interview_preparations(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_job ON interview_preparations(job_id);

-- 2. Interview Question Library Table
CREATE TABLE IF NOT EXISTS interview_question_library (
    id UUID PRIMARY KEY,
    preparation_id UUID REFERENCES interview_preparations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    question TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General', -- Behavioral, Technical, Situational, Leadership, etc.
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Intermediate', -- Beginner, Intermediate, Advanced, Expert
    sample_answer TEXT DEFAULT '',
    user_answer TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    is_practiced BOOLEAN DEFAULT FALSE,
    is_saved BOOLEAN DEFAULT TRUE,
    star_situation TEXT DEFAULT '',
    star_task TEXT DEFAULT '',
    star_action TEXT DEFAULT '',
    star_result TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_lib_user ON interview_question_library(user_id);
CREATE INDEX IF NOT EXISTS idx_question_lib_prep ON interview_question_library(preparation_id);

-- 3. Mock Interview Sessions Table
CREATE TABLE IF NOT EXISTS mock_interview_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    preparation_id UUID REFERENCES interview_preparations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'AI Mock Practice',
    interview_type VARCHAR(100) NOT NULL DEFAULT 'Behavioral',
    difficulty VARCHAR(50) DEFAULT 'Intermediate',
    total_questions INT DEFAULT 5,
    completed_questions INT DEFAULT 0,
    overall_score INT DEFAULT 0,
    relevance_score INT DEFAULT 0,
    clarity_score INT DEFAULT 0,
    confidence_score INT DEFAULT 0,
    technical_score INT DEFAULT 0,
    communication_score INT DEFAULT 0,
    structure_score INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Completed, Abandoned
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_mock_session_user ON mock_interview_sessions(user_id);

-- 4. Mock Interview Answers Table
CREATE TABLE IF NOT EXISTS mock_interview_answers (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES mock_interview_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    candidate_answer TEXT DEFAULT '',
    audio_transcript TEXT DEFAULT '',
    overall_score INT DEFAULT 0,
    relevance_score INT DEFAULT 0,
    clarity_score INT DEFAULT 0,
    confidence_score INT DEFAULT 0,
    technical_score INT DEFAULT 0,
    communication_score INT DEFAULT 0,
    structure_score INT DEFAULT 0,
    what_went_well TEXT DEFAULT '',
    what_could_improve TEXT DEFAULT '',
    suggested_answer TEXT DEFAULT '',
    has_star_situation BOOLEAN DEFAULT FALSE,
    has_star_task BOOLEAN DEFAULT FALSE,
    has_star_action BOOLEAN DEFAULT FALSE,
    has_star_result BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mock_answer_session ON mock_interview_answers(session_id);

-- 5. Preparation Tasks Table
CREATE TABLE IF NOT EXISTS preparation_tasks (
    id UUID PRIMARY KEY,
    preparation_id UUID NOT NULL REFERENCES interview_preparations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    due_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prep_task_prep ON preparation_tasks(preparation_id);

-- 6. Interview Notes Table
CREATE TABLE IF NOT EXISTS interview_notes (
    id UUID PRIMARY KEY,
    preparation_id UUID NOT NULL REFERENCES interview_preparations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    interviewers VARCHAR(255) DEFAULT '',
    topics_discussed TEXT DEFAULT '',
    questions_asked TEXT DEFAULT '',
    candidate_performance TEXT DEFAULT '',
    personal_notes TEXT DEFAULT '',
    overall_feeling VARCHAR(50) DEFAULT 'Good',
    potential_strengths TEXT DEFAULT '',
    potential_weaknesses TEXT DEFAULT '',
    follow_up_suggestions TEXT DEFAULT '',
    thank_you_draft TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Readiness Scores Table
CREATE TABLE IF NOT EXISTS interview_readiness_scores (
    user_id UUID PRIMARY KEY,
    overall_readiness INT DEFAULT 75,
    technical_readiness INT DEFAULT 80,
    behavioral_readiness INT DEFAULT 72,
    communication_readiness INT DEFAULT 85,
    role_fit_readiness INT DEFAULT 78,
    company_knowledge_readiness INT DEFAULT 70,
    total_mock_sessions INT DEFAULT 0,
    total_questions_practiced INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. AI Coach Sessions Table
CREATE TABLE IF NOT EXISTS ai_coach_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    topic VARCHAR(255) DEFAULT 'General Coaching',
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
