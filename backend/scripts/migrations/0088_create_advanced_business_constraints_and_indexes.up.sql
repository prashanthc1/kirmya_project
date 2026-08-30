-- Up Migration: 0088_create_advanced_business_constraints_and_indexes
-- Description: Adds compound lookup indexes and foreign key optimizations for AI Matching, Interviews, Compliance, and Recruiter ATS.

-- 1. AI Matching Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_ai_job_matches_job_score ON ai_job_matches(job_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_matching_scores_match_id ON matching_scores(match_id);
CREATE INDEX IF NOT EXISTS idx_matching_feedback_user_match ON matching_feedback(user_id, match_id);

-- 2. Interview Management Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_status ON interviews(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_interviews_organizer_status ON interviews(organizer_id, status);
CREATE INDEX IF NOT EXISTS idx_interview_rounds_interview_id ON interview_rounds(interview_id, round_number);
CREATE INDEX IF NOT EXISTS idx_interview_participants_lookup ON interview_participants(interview_id, user_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_round_interviewer ON interview_feedback(round_id, interviewer_id);

-- 3. Compliance & Governance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_consent_records_user_type ON consent_records(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_data_requests_user_status ON data_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_created ON audit_events(user_id, created_at DESC);

-- 4. Recruiter ATS Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_recruiter_jobs_recruiter_status ON recruiter_jobs(recruiter_id, status);
