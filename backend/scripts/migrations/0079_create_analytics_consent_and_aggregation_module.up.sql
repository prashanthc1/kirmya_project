-- Migration: 0079_create_analytics_consent_and_aggregation_module.up.sql
-- Module: Platform Analytics, Business Intelligence & Reporting
--
-- Closes the gaps left by 0059 and 0077. Those migrations created the event log
-- (analytics_events_v2), the daily rollups (analytics_daily_*), the cohort and
-- funnel matrices, and the report/export tables, but three things the analytics
-- module reads or writes were never created:
--
--   1. analytics_user_consents  - the repository already queries this table, so
--      every consent lookup errored and silently fell back to "allow".
--   2. analytics_search_daily   - search quality needs latency and click-through
--      per day; search_history stores neither, and no rollup existed.
--   3. analytics_event_dead_letters - events that exhaust their retries had
--      nowhere terminal to land, so poison events retried forever.
--
-- It also adds the covering indexes the aggregation queries need on the source
-- tables they scan by date. Nothing here duplicates an existing table: the
-- notification and recommendation rollups already live in
-- notification_analytics_daily (0075) and recommendation_metrics_daily (0076)
-- and are read as-is.
--
-- RunMigrations replays every .up.sql on each boot, so every statement below is
-- idempotent.

-- 1. Per-user analytics consent.
--
-- Essential telemetry is separated from optional analytics so the platform can
-- keep the security and integrity records it is required to keep while honouring
-- a withdrawal of consent for behavioural tracking. optional_analytics_enabled
-- defaults to FALSE: optional telemetry is only collected once a user opts in.
CREATE TABLE IF NOT EXISTS analytics_user_consents (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    essential_telemetry_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    optional_analytics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    personalization_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    consent_source VARCHAR(50) NOT NULL DEFAULT 'unset',
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_consents_optional
    ON analytics_user_consents(optional_analytics_enabled);

-- 2. Daily search rollup.
--
-- zero_result_searches drives the search-quality report; clicked_searches over
-- total_searches gives click-through. Query text is deliberately absent: only
-- counts are aggregated here. Individual terms stay in search_history, which has
-- its own retention.
CREATE TABLE IF NOT EXISTS analytics_search_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    search_type VARCHAR(50) NOT NULL DEFAULT 'all',
    total_searches BIGINT NOT NULL DEFAULT 0,
    zero_result_searches BIGINT NOT NULL DEFAULT 0,
    clicked_searches BIGINT NOT NULL DEFAULT 0,
    total_results BIGINT NOT NULL DEFAULT 0,
    avg_latency_ms NUMERIC(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_analytics_search_daily UNIQUE (metric_date, search_type)
);

CREATE INDEX IF NOT EXISTS idx_analytics_search_daily_date
    ON analytics_search_daily(metric_date DESC);

-- 3. Terminal dead-letter store for events that exhausted their retries.
--
-- analytics_event_failures (0059) records each failed attempt; a row here means
-- the event was abandoned and will not be retried again. Keeping them lets the
-- data-quality checks report what was dropped instead of losing it silently.
CREATE TABLE IF NOT EXISTS analytics_event_dead_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    idempotency_key VARCHAR(255),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_dead_letters_created
    ON analytics_event_dead_letters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_dead_letters_type
    ON analytics_event_dead_letters(event_type);

-- 4. Columns the analytics module needs on tables it does not own.
--
-- analytics_reports (0077) tracks a generated report but had no way to record
-- who downloaded it or how large it was, both of which the export audit needs.
ALTER TABLE analytics_reports
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS download_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS filter_params JSONB NOT NULL DEFAULT '{}'::jsonb;

-- A download token is only useful if it can be looked up on its own.
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_reports_token
    ON analytics_reports(download_token) WHERE download_token IS NOT NULL;

-- 5. Covering indexes for the aggregation queries.
--
-- Each rollup scans a source table by timestamp, filtered or grouped by the
-- column paired with it here. Without these the daily aggregation degrades to a
-- sequential scan per metric.
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
    ON analytics_events_v2(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created
    ON analytics_events_v2(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity
    ON analytics_events_v2(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session
    ON analytics_events_v2(session_id, created_at DESC) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at
    ON job_applications(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_applied
    ON job_applications(candidate_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_stage_history_moved
    ON application_stage_history(to_stage, moved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_saved_at
    ON saved_jobs(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at
    ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at
    ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_created_at
    ON connections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status_created
    ON connection_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_members_created_at
    ON community_members(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at
    ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_zero_results
    ON search_history(searched_at DESC) WHERE results_count = 0;
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_created
    ON notification_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_reports_created_at
    ON safety_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_reports_category
    ON safety_reports(category);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_accessed
    ON user_learning_progress(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at
    ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at
    ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at
    ON security_events(created_at DESC);
