-- up migration: create people search, networking, recommendations, and admin management tables

-- 1. Connection Request Notes
CREATE TABLE IF NOT EXISTS connection_request_notes (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES connection_requests(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_request_note UNIQUE(request_id)
);

CREATE INDEX IF NOT EXISTS idx_conn_req_notes_req ON connection_request_notes(request_id);

-- 2. Connection Follows (Follow / Unfollow)
CREATE TABLE IF NOT EXISTS connection_follows (
    id UUID PRIMARY KEY,
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_follow_pair UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_conn_follows_follower ON connection_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_conn_follows_following ON connection_follows(following_id);

-- 3. Recommendation Dismissals ("Not Interested")
CREATE TABLE IF NOT EXISTS recommendation_dismissals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    recommended_user_id UUID NOT NULL,
    reason VARCHAR(100) DEFAULT 'Not Interested',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_recommendation_dismissal UNIQUE(user_id, recommended_user_id)
);

CREATE INDEX IF NOT EXISTS idx_rec_dismiss_user ON recommendation_dismissals(user_id);

-- 4. Network Safety Reports
CREATE TABLE IF NOT EXISTS network_reports (
    id UUID PRIMARY KEY,
    reporter_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, reviewed, dismissed, actioned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_network_reports_target ON network_reports(target_user_id);
CREATE INDEX IF NOT EXISTS idx_network_reports_status ON network_reports(status);

-- 5. Network Analytics & Growth
CREATE TABLE IF NOT EXISTS network_analytics (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_views INT DEFAULT 0,
    search_appearances INT DEFAULT 0,
    requests_sent INT DEFAULT 0,
    requests_received INT DEFAULT 0,
    requests_accepted INT DEFAULT 0,
    total_connections INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_user_network_analytics UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_network_analytics_user ON network_analytics(user_id);
