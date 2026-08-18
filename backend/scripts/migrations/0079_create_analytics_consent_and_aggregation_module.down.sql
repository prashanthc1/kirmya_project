-- Migration: 0079_create_analytics_consent_and_aggregation_module.down.sql
--
-- Reverses 0079. The tables created by 0059/0075/0076/0077 are left alone: this
-- migration only drops what it added.
--
-- analytics_reports is not dropped, only the columns 0079 added to it. Dropping
-- the columns loses the download audit trail for reports generated while they
-- existed, which is the accepted cost of a rollback.

DROP INDEX IF EXISTS idx_security_events_created_at;
DROP INDEX IF EXISTS idx_sessions_created_at;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_user_learning_progress_accessed;
DROP INDEX IF EXISTS idx_safety_reports_category;
DROP INDEX IF EXISTS idx_safety_reports_created_at;
DROP INDEX IF EXISTS idx_notification_deliveries_created;
DROP INDEX IF EXISTS idx_search_history_zero_results;
DROP INDEX IF EXISTS idx_search_history_searched_at;
DROP INDEX IF EXISTS idx_community_members_created_at;
DROP INDEX IF EXISTS idx_connection_requests_status_created;
DROP INDEX IF EXISTS idx_connections_created_at;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_jobs_created_at;
DROP INDEX IF EXISTS idx_saved_jobs_saved_at;
DROP INDEX IF EXISTS idx_application_stage_history_moved;
DROP INDEX IF EXISTS idx_job_applications_candidate_applied;
DROP INDEX IF EXISTS idx_job_applications_applied_at;

DROP INDEX IF EXISTS idx_analytics_events_session;
DROP INDEX IF EXISTS idx_analytics_events_entity;
DROP INDEX IF EXISTS idx_analytics_events_user_created;
DROP INDEX IF EXISTS idx_analytics_events_type_created;

DROP INDEX IF EXISTS idx_analytics_reports_token;

ALTER TABLE analytics_reports
    DROP COLUMN IF EXISTS filter_params,
    DROP COLUMN IF EXISTS error_message,
    DROP COLUMN IF EXISTS download_count,
    DROP COLUMN IF EXISTS downloaded_at,
    DROP COLUMN IF EXISTS file_size_bytes;

DROP TABLE IF EXISTS analytics_event_dead_letters;
DROP TABLE IF EXISTS analytics_search_daily;
DROP TABLE IF EXISTS analytics_user_consents;
