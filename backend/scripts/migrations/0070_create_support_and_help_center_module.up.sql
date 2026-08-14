-- up migration: create support search queries and indexes for help center

-- 1. Support Search Query Log Table for Search Analytics
CREATE TABLE IF NOT EXISTS support_search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query_text VARCHAR(255) NOT NULL,
    results_count INT NOT NULL DEFAULT 0,
    category_code VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_search_queries_text ON support_search_queries(query_text);
CREATE INDEX IF NOT EXISTS idx_support_search_queries_created ON support_search_queries(created_at DESC);

-- 2. Performance Indexes for Support Tickets and Articles
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status ON support_tickets(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_articles_cat_status ON support_articles(category_code, status, slug);
