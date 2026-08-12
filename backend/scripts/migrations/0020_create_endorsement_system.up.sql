-- Up Migration: Create LinkedIn-Style Endorsement & Professional Recommendation System Tables

-- 1. Skill Endorsements Table
CREATE TABLE IF NOT EXISTS skill_endorsements (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL, -- Target candidate whose skill is endorsed
    endorser_id UUID NOT NULL, -- User giving the endorsement
    skill_name VARCHAR(150) NOT NULL,
    endorser_name VARCHAR(255) NOT NULL,
    endorser_title VARCHAR(255),
    endorser_avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_endorser_skill UNIQUE (user_id, endorser_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_endorsements_user ON skill_endorsements(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_skill ON skill_endorsements(skill_name);

-- 2. Professional Recommendations Table
CREATE TABLE IF NOT EXISTS professional_recommendations (
    id UUID PRIMARY KEY,
    recipient_id UUID NOT NULL, -- Target candidate receiving recommendation
    author_id UUID NOT NULL, -- User writing the recommendation
    author_name VARCHAR(255) NOT NULL,
    author_title VARCHAR(255) NOT NULL,
    author_avatar_url TEXT,
    relationship VARCHAR(100) NOT NULL, -- 'managed_directly', 'reported_to', 'worked_same_team', 'client'
    content_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_approval', -- 'pending_approval', 'accepted', 'hidden', 'flagged'
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_recipient ON professional_recommendations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_author ON professional_recommendations(author_id);

-- 3. Professional References Table
CREATE TABLE IF NOT EXISTS professional_references (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL,
    referee_name VARCHAR(255) NOT NULL,
    referee_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    referee_email VARCHAR(255) NOT NULL,
    referee_phone VARCHAR(50),
    relationship VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed', -- 'requested', 'confirmed', 'declined'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_references_candidate ON professional_references(candidate_id);
