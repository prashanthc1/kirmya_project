-- Up Migration: Create Advanced Analytics System Tables

-- 1. High-Throughput Analytics Raw Events Log Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,
    event_name VARCHAR(150),
    entity_id VARCHAR(255),
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS event_name VARCHAR(150);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS entity_id VARCHAR(255);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS properties JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant ON analytics_events(tenant_id, created_at DESC);

-- 2. Pre-Calculated Aggregated Metrics Rollup Table (Optimized for Large Data Volume)
CREATE TABLE IF NOT EXISTS aggregated_metrics (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL, -- 'user_growth', 'skill_demand', 'hiring_speed', 'candidate_conversion', 'profile_views'
    period_date DATE NOT NULL,
    dimension_key VARCHAR(255) NOT NULL, -- e.g. 'Go', 'React', 'total_users', 'screened'
    metric_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_metric_period UNIQUE (tenant_id, metric_type, period_date, dimension_key)
);

CREATE INDEX IF NOT EXISTS idx_aggregated_metrics_query ON aggregated_metrics(tenant_id, metric_type, period_date DESC);
