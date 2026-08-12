-- Down Migration 0040: Rollback Production High-Scale Indexing & Constraints Optimization

DROP INDEX IF EXISTS idx_verification_badges_entity_type;
DROP INDEX IF EXISTS idx_reports_target_status;
DROP INDEX IF EXISTS idx_data_requests_user_type;
DROP INDEX IF EXISTS idx_event_attendees_user_status;
DROP INDEX IF EXISTS idx_events_type_start_time;

DROP INDEX IF EXISTS idx_recruiter_ai_sessions_org_created;
DROP INDEX IF EXISTS idx_ai_job_matches_user_score;
DROP INDEX IF EXISTS idx_ai_job_matches_matched_skills_gin;

DROP INDEX IF EXISTS idx_conversations_user_pair;
DROP INDEX IF EXISTS idx_messages_unread_count;
DROP INDEX IF EXISTS idx_messages_conversation_created;

DROP INDEX IF EXISTS idx_projects_active_created;
DROP INDEX IF EXISTS idx_projects_skills_gin;
DROP INDEX IF EXISTS idx_candidate_pipeline_job_candidate;
DROP INDEX IF EXISTS idx_candidate_pipeline_candidate_stage;
DROP INDEX IF EXISTS idx_recruiter_jobs_active_created;
DROP INDEX IF EXISTS idx_recruiter_jobs_title_location;

DROP INDEX IF EXISTS idx_user_skills_profile_name;
DROP INDEX IF EXISTS idx_user_skills_name_lower;
DROP INDEX IF EXISTS idx_user_profiles_availability;

DROP INDEX IF EXISTS idx_refresh_tokens_active;
DROP INDEX IF EXISTS idx_usr_accounts_active;
DROP INDEX IF EXISTS idx_usr_accounts_created_at;
