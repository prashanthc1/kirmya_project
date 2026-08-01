-- up migration: create candidate search, talent pools, saved searches and view tables

CREATE TABLE IF NOT EXISTS talent_pools (
    id UUID PRIMARY KEY,
    recruiter_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    shared_with_team BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS talent_pool_candidates (
    id UUID PRIMARY KEY,
    pool_id UUID REFERENCES talent_pools(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    added_by UUID NOT NULL,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_pool_candidate UNIQUE (pool_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS recruiter_saved_searches (
    id UUID PRIMARY KEY,
    recruiter_id UUID NOT NULL,
    search_name VARCHAR(255) NOT NULL,
    query TEXT,
    filters JSONB,
    alert_frequency VARCHAR(50) DEFAULT 'Daily', -- 'Daily', 'Weekly', 'Immediately', 'Off'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_profile_views (
    id UUID PRIMARY KEY,
    recruiter_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_talent_pools_recruiter ON talent_pools(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_talent_pool_candidates_pool ON talent_pool_candidates(pool_id);
CREATE INDEX IF NOT EXISTS idx_talent_pool_candidates_candidate ON talent_pool_candidates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_recruiter ON recruiter_saved_searches(recruiter_id);
