-- Down Migration: 0088_create_advanced_business_constraints_and_indexes

DROP INDEX IF EXISTS idx_ai_job_matches_job_score;
DROP INDEX IF EXISTS idx_matching_scores_match_id;
DROP INDEX IF EXISTS idx_matching_feedback_user_match;

DROP INDEX IF EXISTS idx_interviews_candidate_status;
DROP INDEX IF EXISTS idx_interviews_organizer_status;
DROP INDEX IF EXISTS idx_interview_rounds_interview_id;
DROP INDEX IF EXISTS idx_interview_participants_lookup;
DROP INDEX IF EXISTS idx_interview_feedback_round_interviewer;

DROP INDEX IF EXISTS idx_consent_records_user_type;
DROP INDEX IF EXISTS idx_data_requests_user_status;
DROP INDEX IF EXISTS idx_audit_events_user_created;

DROP INDEX IF EXISTS idx_recruiter_jobs_recruiter_status;
