-- up migration: create candidate search history, saved candidate folder structures, recruiter notes, and full-text indexes

-- 1. Candidate Search History Table
CREATE TABLE IF NOT EXISTS candidate_search_history (
    id UUID PRIMARY KEY,
    recruiter_id UUID REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
    query VARCHAR(255),
    filters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_hist_recruiter ON candidate_search_history(recruiter_id);

-- 2. Saved Candidates List Table
CREATE TABLE IF NOT EXISTS saved_candidates (
    id UUID PRIMARY KEY,
    recruiter_id UUID REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    list_name VARCHAR(150) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_cands_recruiter ON saved_candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_saved_cands_list ON saved_candidates(list_name);

-- 3. Recruiter Candidate Notes Table
CREATE TABLE IF NOT EXISTS recruiter_notes (
    id UUID PRIMARY KEY,
    recruiter_id UUID REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_notes_cand ON recruiter_notes(candidate_id);

-- 4. PostgreSQL Full-Text Search Optimizations (GIN Indexes)
CREATE INDEX IF NOT EXISTS idx_resume_sections_content_gin ON resume_sections USING gin(content);
CREATE INDEX IF NOT EXISTS idx_user_profiles_summary_fts ON user_profiles USING gin(to_tsvector('english', coalesce(summary, '') || ' ' || coalesce(headline, '')));
