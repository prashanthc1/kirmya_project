-- up migration: create company public profile sub-tables

CREATE TABLE IF NOT EXISTS company_departments (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    open_jobs INT DEFAULT 0,
    employee_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS company_locations (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Headquarters', 'Regional Office', 'Branch'
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS company_leaders (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    photo_url TEXT,
    summary TEXT,
    linkedin_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS company_gallery (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(150),
    media_url TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'image', -- 'image', 'video'
    category VARCHAR(50) DEFAULT 'workplace' -- 'office', 'event', 'award', 'workplace'
);

CREATE TABLE IF NOT EXISTS company_reports (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL,
    reason VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_locations_company ON company_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_leaders_company ON company_leaders(company_id);
CREATE INDEX IF NOT EXISTS idx_company_gallery_company ON company_gallery(company_id);
