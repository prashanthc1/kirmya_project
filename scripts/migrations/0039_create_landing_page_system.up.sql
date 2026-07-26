-- Up Migration: Create Landing Page Dynamic System Tables

-- 1. Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY,
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(150) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    avatar_url TEXT NOT NULL,
    quote TEXT NOT NULL,
    achievement VARCHAR(255) NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    is_featured BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Featured Jobs Table
CREATE TABLE IF NOT EXISTS featured_jobs (
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    company VARCHAR(150) NOT NULL,
    location VARCHAR(100) NOT NULL,
    match_percentage INT NOT NULL,
    salary_range VARCHAR(100) NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Featured Companies Table
CREATE TABLE IF NOT EXISTS featured_companies (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    logo_url TEXT NOT NULL,
    open_positions INT NOT NULL,
    industry VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Landing Statistics Table
CREATE TABLE IF NOT EXISTS landing_statistics (
    id UUID PRIMARY KEY,
    stat_key VARCHAR(100) UNIQUE NOT NULL,
    stat_value VARCHAR(100) NOT NULL,
    stat_label VARCHAR(150) NOT NULL,
    display_order INT DEFAULT 0
);
