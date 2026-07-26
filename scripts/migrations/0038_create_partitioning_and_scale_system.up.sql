-- Up Migration: Create Partitioning Strategy & Index Scaling System

-- 1. High-Volume Analytics Events Table Partitioning Index Strategy
CREATE INDEX IF NOT EXISTS idx_analytics_events_composite ON analytics_events(event_type, created_at DESC);

-- 2. Unified Search History Index Strategy
CREATE INDEX IF NOT EXISTS idx_search_history_composite ON search_history(user_id, created_at DESC);

-- 3. Recommendation Events High-Throughput Indexing
CREATE INDEX IF NOT EXISTS idx_rec_events_action_created ON recommendation_events(action, created_at DESC);

-- 4. Immutable Security Audit Logs Indexing
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(enterprise_id, created_at DESC);
