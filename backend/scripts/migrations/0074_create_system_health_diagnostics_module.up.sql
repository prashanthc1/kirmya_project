-- Migration 0074: System Health, Diagnostics & Self-Healing Module
CREATE TABLE IF NOT EXISTS health_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('info', 'warning', 'degraded', 'critical')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('open', 'investigating', 'self_healing', 'resolved', 'suppressed')),
    failure_type VARCHAR(128) NOT NULL DEFAULT '',
    error_message TEXT NOT NULL DEFAULT '',
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    dedup_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_incidents_component ON health_incidents(component_name);
CREATE INDEX IF NOT EXISTS idx_health_incidents_status ON health_incidents(status);
CREATE INDEX IF NOT EXISTS idx_health_incidents_severity ON health_incidents(severity);

CREATE TABLE IF NOT EXISTS health_recovery_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES health_incidents(id) ON DELETE SET NULL,
    action_type VARCHAR(64) NOT NULL CHECK (action_type IN ('restart_worker', 'reconnect_db_pool', 'clear_transient_cache', 'reconnect_event_bus', 'rebuild_search_fallback', 'circuit_breaker_open')),
    component_name VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
    result_summary TEXT NOT NULL DEFAULT '',
    executed_by UUID,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_recovery_component ON health_recovery_actions(component_name);
CREATE INDEX IF NOT EXISTS idx_health_recovery_status ON health_recovery_actions(status);

CREATE TABLE IF NOT EXISTS maintenance_modes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    reason TEXT NOT NULL DEFAULT '',
    allowed_admin_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    enabled_by UUID,
    enabled_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_check_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overall_status VARCHAR(32) NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'critical', 'maintenance')),
    components_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_checked ON health_check_snapshots(checked_at DESC);
