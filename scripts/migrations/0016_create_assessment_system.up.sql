-- Up Migration: Create Complete Professional Skill Assessment System Tables

-- 1. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Engineering', 'Architecture', 'DevOps', 'Management', 'Soft Skills'
    difficulty_level VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
    duration_minutes INT DEFAULT 30,
    passing_score INT DEFAULT 70, -- Score percentage required to pass
    total_questions INT DEFAULT 5,
    badge_title VARCHAR(150),
    badge_tier VARCHAR(50) DEFAULT 'Gold', -- 'Bronze', 'Silver', 'Gold', 'Platinum'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_category ON assessments(category);
CREATE INDEX IF NOT EXISTS idx_assessments_level ON assessments(difficulty_level);

-- 2. Questions Table (MCQs & Practical Scenarios)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL DEFAULT 'mcq', -- 'mcq', 'practical'
    question_text TEXT NOT NULL,
    options_json JSONB, -- JSON array of option strings for MCQs: ["Option A", "Option B", ...]
    correct_option_index INT, -- 0-indexed for MCQs
    practical_rubric TEXT, -- AI evaluation criteria & expected solution points for practical scenarios
    max_points INT DEFAULT 10,
    question_order INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_assessment ON questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);

-- 3. User Assessment Results Table
CREATE TABLE IF NOT EXISTS user_assessment_results (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name VARCHAR(255),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    assessment_title VARCHAR(255),
    score_percentage INT NOT NULL,
    mcq_score INT DEFAULT 0,
    practical_ai_score INT DEFAULT 0,
    percentile_rank INT DEFAULT 85, -- Calculated percentile against all test takers
    passed BOOLEAN DEFAULT FALSE,
    time_taken_seconds INT DEFAULT 600,
    user_answers_json JSONB, -- User submitted answer choices & practical response text
    ai_feedback_summary TEXT, -- AI evaluation critique for practical answers
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_results_user ON user_assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_assessment ON user_assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_results_score ON user_assessment_results(score_percentage);

-- 4. Skill Badges Table
CREATE TABLE IF NOT EXISTS skill_badges (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    badge_title VARCHAR(255) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'Gold', -- 'Bronze', 'Silver', 'Gold', 'Platinum'
    verification_code VARCHAR(100) UNIQUE NOT NULL,
    skills_validated TEXT[],
    icon_name VARCHAR(100) DEFAULT 'verified',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON skill_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_code ON skill_badges(verification_code);
