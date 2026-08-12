-- Up Migration: Create Complete Kirmya Learning Hub Tables

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Technology', 'Management', 'Soft skills', 'Interview preparation', 'Industry certifications'
    difficulty_level VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'all_levels'
    provider VARCHAR(100) DEFAULT 'kirmya', -- 'kirmya', 'coursera', 'udemy', 'pluralsight'
    external_course_id VARCHAR(255),
    external_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    duration_hours INT DEFAULT 10,
    total_lessons INT DEFAULT 12,
    rating NUMERIC(3,2) DEFAULT 4.80,
    skills_covered TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_provider ON courses(provider);

-- 2. Learning Paths Table
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_role VARCHAR(150) NOT NULL, -- e.g., 'Full-Stack Software Engineer', 'Product Manager', 'Data Analyst'
    category VARCHAR(100) NOT NULL,
    estimated_weeks INT DEFAULT 4,
    course_ids UUID[] NOT NULL,
    badge_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_target ON learning_paths(target_role);

-- 3. User Learning Progress Table
CREATE TABLE IF NOT EXISTS user_learning_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    learning_path_id UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'enrolled', -- 'enrolled', 'in_progress', 'completed'
    completed_lessons INT DEFAULT 0,
    total_lessons INT DEFAULT 12,
    completion_percentage INT DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course ON user_learning_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_learning_progress(status);

-- 4. Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    learning_path_id UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    verification_code VARCHAR(100) UNIQUE NOT NULL,
    skills_mastered TEXT[],
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(verification_code);

-- 5. Skill Assessments Table
CREATE TABLE IF NOT EXISTS skill_assessments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    domain VARCHAR(100) NOT NULL, -- 'Technology', 'Management', 'Soft skills', 'Interview preparation'
    score INT NOT NULL, -- 0 to 100
    readiness_level VARCHAR(50) NOT NULL, -- 'Junior/Entry', 'Job Ready', 'Senior/Advanced'
    recommended_path_id UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
    answers_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_user ON skill_assessments(user_id);
