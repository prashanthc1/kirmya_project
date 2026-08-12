-- Up Migration: Create Complete Interview Management System Tables

-- 1. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL,
    job_id UUID,
    organizer_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'feedback_pending'
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    location_type VARCHAR(50) DEFAULT 'virtual', -- 'virtual', 'in_person', 'phone'
    meeting_link VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_organizer ON interviews(organizer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_dates ON interviews(scheduled_start, scheduled_end);

-- 2. Interview Rounds Table (Support for multiple interview rounds per process)
CREATE TABLE IF NOT EXISTS interview_rounds (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    round_name VARCHAR(150) NOT NULL, -- e.g., 'Screening', 'Technical Round 1', 'System Design', 'HR & Culture', 'Executive'
    round_type VARCHAR(50) DEFAULT 'technical', -- 'screening', 'technical', 'system_design', 'behavioral', 'hr'
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_link VARCHAR(500),
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interview_rounds_interview ON interview_rounds(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_rounds_status ON interview_rounds(status);

-- 3. Interview Participants Table (Panel Members & Candidate RSVP tracking)
CREATE TABLE IF NOT EXISTS interview_participants (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    round_id UUID REFERENCES interview_rounds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'interviewer', -- 'interviewer', 'lead_interviewer', 'candidate', 'observer'
    rsvp_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'tentative'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interview_participants_interview ON interview_participants(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_participants_round ON interview_participants(round_id);
CREATE INDEX IF NOT EXISTS idx_interview_participants_user ON interview_participants(user_id);

-- 4. Interview Feedback Table (Feedback scorecards & ratings)
CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    round_id UUID REFERENCES interview_rounds(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL,
    interviewer_name VARCHAR(255),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    technical_score INT CHECK (technical_score >= 1 AND technical_score <= 5),
    communication_score INT CHECK (communication_score >= 1 AND communication_score <= 5),
    problem_solving_score INT CHECK (problem_solving_score >= 1 AND problem_solving_score <= 5),
    recommendation VARCHAR(50) NOT NULL, -- 'strong_hire', 'hire', 'neutral', 'no_hire', 'strong_no_hire'
    feedback_text TEXT NOT NULL,
    strengths TEXT,
    areas_for_improvement TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview ON interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_round ON interview_feedback(round_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interviewer ON interview_feedback(interviewer_id);

-- 5. Candidate Availability Table
CREATE TABLE IF NOT EXISTS candidate_availability (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'booked', 'unavailable'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidate_availability_candidate ON candidate_availability(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_availability_time ON candidate_availability(start_time, end_time);
