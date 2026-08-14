-- Migration 0076: Recommendation Engine Analytics & Admin Configuration Module
CREATE TABLE IF NOT EXISTS recommendation_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(64) NOT NULL DEFAULT 'kirmya_hybrid_v1',
    algorithm_version VARCHAR(32) NOT NULL DEFAULT 'v1.4.0',
    skill_match_weight DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    title_match_weight DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    location_match_weight DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    industry_match_weight DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    diversity_penalty DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    candidate_pool_limit INT NOT NULL DEFAULT 100,
    min_score_threshold INT NOT NULL DEFAULT 40,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO recommendation_configs (model_name, algorithm_version, skill_match_weight, title_match_weight, location_match_weight, industry_match_weight, diversity_penalty, candidate_pool_limit, min_score_threshold, is_active)
SELECT 'kirmya_hybrid_v1', 'v1.4.0', 0.35, 0.25, 0.15, 0.15, 0.10, 100, 40, TRUE
WHERE NOT EXISTS (SELECT 1 FROM recommendation_configs WHERE is_active = TRUE);

CREATE TABLE IF NOT EXISTS recommendation_metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    item_type VARCHAR(32) NOT NULL,
    total_impressions BIGINT NOT NULL DEFAULT 0,
    total_clicks BIGINT NOT NULL DEFAULT 0,
    total_saves BIGINT NOT NULL DEFAULT 0,
    total_applies BIGINT NOT NULL DEFAULT 0,
    total_dismissals BIGINT NOT NULL DEFAULT 0,
    avg_match_score INT NOT NULL DEFAULT 0,
    avg_latency_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metric_date, item_type)
);

CREATE INDEX IF NOT EXISTS idx_rec_metrics_date ON recommendation_metrics_daily(metric_date DESC);
