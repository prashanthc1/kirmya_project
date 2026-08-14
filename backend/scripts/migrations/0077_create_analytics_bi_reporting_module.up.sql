-- Migration: 0077_create_analytics_bi_reporting_module.up.sql
-- Module: Analytics, Reporting, Business Intelligence & Scheduled Export

CREATE TABLE IF NOT EXISTS analytics_events_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    session_id VARCHAR(255),
    source VARCHAR(50) NOT NULL DEFAULT 'web',
    platform VARCHAR(50) NOT NULL DEFAULT 'desktop',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_v2_type ON analytics_events_v2(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_v2_user ON analytics_events_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_v2_org ON analytics_events_v2(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_v2_created ON analytics_events_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_v2_idempotency ON analytics_events_v2(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    dimension_key VARCHAR(100) NOT NULL DEFAULT 'overall',
    metric_value NUMERIC(15, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_daily_metric UNIQUE(metric_date, metric_category, metric_name, dimension_key)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_category ON analytics_daily_metrics(metric_category);

CREATE TABLE IF NOT EXISTS analytics_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    export_format VARCHAR(10) NOT NULL DEFAULT 'csv',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    row_count INT NOT NULL DEFAULT 0,
    file_path VARCHAR(512),
    download_token VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_admin ON analytics_reports(admin_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_status ON analytics_reports(status);

CREATE TABLE IF NOT EXISTS analytics_scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(50) NOT NULL DEFAULT '0 0 * * 1',
    report_type VARCHAR(50) NOT NULL,
    export_format VARCHAR(10) NOT NULL DEFAULT 'csv',
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
    filter_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_scheduled_active ON analytics_scheduled_reports(is_active);
