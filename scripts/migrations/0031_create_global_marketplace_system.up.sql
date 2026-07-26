-- Up Migration: Create Global Job Marketplace Infrastructure Tables

-- 1. Macro-Regions Table
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'ME_GCC', 'APAC', 'NA', 'EU', 'GLOBAL'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Countries Table
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY,
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL, -- ISO-2 e.g. 'AE', 'IN', 'SA', 'US'
    currency_code VARCHAR(10) NOT NULL, -- ISO-3 e.g. 'AED', 'INR', 'SAR', 'USD'
    flag_emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);

-- 3. Multi-Currency Exchange Rates Engine Table
CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- 'AED', 'INR', 'SAR', 'USD', 'EUR', 'GBP', 'SGD'
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    usd_exchange_rate NUMERIC(12, 6) NOT NULL, -- Exchange rate relative to USD
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);

-- 4. Multi-Country Job Locations Table
CREATE TABLE IF NOT EXISTS job_locations (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL,
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    work_arrangement VARCHAR(50) NOT NULL DEFAULT 'onsite', -- 'remote', 'hybrid', 'onsite'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_locations_job ON job_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_job_locations_country ON job_locations(country_id);
