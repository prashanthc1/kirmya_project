-- Up Migration 0040: Production High-Scale Indexing & Constraints Optimization

-- ==============================================================================
-- 1. USER & AUTHENTICATION SUBSYSTEM OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_usr_accounts_created_at ON usr_accounts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usr_accounts_active ON usr_accounts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active 
ON refresh_tokens(user_id, expires_at) 
WHERE is_revoked = false;

-- ==============================================================================
-- 2. PROFILES & SKILLS SUBSYSTEM OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_availability 
ON user_profiles(availability_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_skills_name_lower 
ON user_skills(LOWER(name));

CREATE INDEX IF NOT EXISTS idx_user_skills_profile_name 
ON user_skills(profile_id, name);

-- ==============================================================================
-- 3. JOBS & TALENT PIPELINE SUBSYSTEM OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_recruiter_jobs_title_location 
ON recruiter_jobs(title, location);

CREATE INDEX IF NOT EXISTS idx_recruiter_jobs_active_created 
ON recruiter_jobs(status, created_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_candidate_stage 
ON candidate_pipeline(candidate_id, stage);

CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_job_candidate 
ON candidate_pipeline(job_id, candidate_id);

CREATE INDEX IF NOT EXISTS idx_projects_skills_gin 
ON projects USING GIN (skills_required);

CREATE INDEX IF NOT EXISTS idx_projects_active_created 
ON projects(status, created_at DESC) 
WHERE status = 'open';

-- ==============================================================================
-- 4. MESSAGING & NETWORKING SUBSYSTEM OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread_count 
ON messages(conversation_id, is_read) 
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_conversations_user_pair 
ON conversations(user_id_1, user_id_2);

-- ==============================================================================
-- 5. AI JOB MATCHING & RECRUITER AI OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_ai_job_matches_matched_skills_gin 
ON ai_job_matches USING GIN (matched_skills);

CREATE INDEX IF NOT EXISTS idx_ai_job_matches_user_score 
ON ai_job_matches(user_id, overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_recruiter_ai_sessions_org_created 
ON recruiter_ai_sessions(org_id, created_at DESC);

-- ==============================================================================
-- 6. EVENTS, COMPLIANCE & TRUST SAFETY OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_events_type_start_time 
ON events(event_type, start_time ASC);

CREATE INDEX IF NOT EXISTS idx_event_attendees_user_status 
ON event_attendees(user_id, status);

CREATE INDEX IF NOT EXISTS idx_data_requests_user_type 
ON data_requests(user_id, request_type);

CREATE INDEX IF NOT EXISTS idx_reports_target_status 
ON reports(target_type, target_id, status);

CREATE INDEX IF NOT EXISTS idx_verification_badges_entity_type 
ON verification_badges(entity_type, entity_id);
