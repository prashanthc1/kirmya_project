-- up migration: create profile system tables

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    headline VARCHAR(255) DEFAULT '',
    summary TEXT DEFAULT '',
    availability_status VARCHAR(50) DEFAULT 'looking_for_networking',
    profile_completed_percentage INT DEFAULT 0,
    volunteering TEXT DEFAULT '',
    publications TEXT DEFAULT '',
    licenses TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 2. Skills Table
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(50) NOT NULL DEFAULT 'Intermediate'
);

CREATE INDEX IF NOT EXISTS idx_user_skills_profile_id ON user_skills(profile_id);

-- 3. Certifications Table
CREATE TABLE IF NOT EXISTS user_certifications (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE,
    expiration_date DATE,
    credential_id VARCHAR(100) DEFAULT '',
    credential_url VARCHAR(255) DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_user_certs_profile_id ON user_certifications(profile_id);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    url VARCHAR(255) DEFAULT '',
    start_date DATE,
    end_date DATE
);

CREATE INDEX IF NOT EXISTS idx_user_projects_profile_id ON user_projects(profile_id);

-- 5. Languages Table
CREATE TABLE IF NOT EXISTS user_languages (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    proficiency VARCHAR(50) NOT NULL DEFAULT 'Professional working proficiency'
);

CREATE INDEX IF NOT EXISTS idx_user_languages_profile_id ON user_languages(profile_id);

-- 6. Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    date_achieved DATE
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_profile_id ON user_achievements(profile_id);

-- 7. Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    profile_visibility VARCHAR(50) DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_pref_user_id ON user_preferences(user_id);
