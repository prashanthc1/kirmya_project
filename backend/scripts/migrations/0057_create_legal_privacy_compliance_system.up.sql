-- Migration 0057: Create Legal, Privacy, Compliance, Cookie Consent, Terms, Data Rights, and Consent Management System
-- Tech Stack: Golang, Gin, PostgreSQL

-- 1. Legal Documents Catalog
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL, -- terms, privacy, cookies, community-guidelines, etc.
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    current_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    status VARCHAR(50) NOT NULL DEFAULT 'published', -- draft, scheduled, published, archived
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Legal Document Version Snapshots
CREATE TABLE IF NOT EXISTS legal_document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    change_summary TEXT,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'published',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, version)
);

-- 3. Legal Document Acceptances
CREATE TABLE IF NOT EXISTS legal_document_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    document_version_id UUID NOT NULL REFERENCES legal_document_versions(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'web'
);

-- 4. Cookie Registry
CREATE TABLE IF NOT EXISTS cookie_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cookie_name VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'analytics', -- necessary, preferences, analytics, functional, marketing, third_party
    purpose TEXT NOT NULL,
    domain VARCHAR(150),
    path VARCHAR(150) DEFAULT '/',
    duration VARCHAR(50) NOT NULL DEFAULT '30 days',
    is_secure BOOLEAN NOT NULL DEFAULT true,
    is_httponly BOOLEAN NOT NULL DEFAULT true,
    samesite VARCHAR(20) NOT NULL DEFAULT 'Lax',
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. User Cookie Consents
CREATE TABLE IF NOT EXISTS cookie_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL,
    necessary BOOLEAN NOT NULL DEFAULT true,
    preferences BOOLEAN NOT NULL DEFAULT false,
    analytics BOOLEAN NOT NULL DEFAULT false,
    functional BOOLEAN NOT NULL DEFAULT false,
    marketing BOOLEAN NOT NULL DEFAULT false,
    third_party BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- 6. Privacy Requests (SAR, Correction, Deletion, Restriction)
CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- access_export, deletion, correction, restriction, consent_withdrawal, complaint
    status VARCHAR(50) NOT NULL DEFAULT 'received', -- received, under_review, needs_info, processing, completed, rejected, cancelled
    due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Data Export Jobs
CREATE TABLE IF NOT EXISTS data_export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    privacy_request_id UUID REFERENCES privacy_requests(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    download_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    file_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Data Deletion Requests
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    privacy_request_id UUID REFERENCES privacy_requests(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'grace_period', -- grace_period, processing, completed, cancelled
    grace_period_expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '14 days',
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Retention Policies
CREATE TABLE IF NOT EXISTS retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_category VARCHAR(100) UNIQUE NOT NULL, -- user_accounts, messages, applications, audit_logs, security_events, consents
    retention_days INT NOT NULL DEFAULT 365,
    action_type VARCHAR(50) NOT NULL DEFAULT 'anonymize', -- delete, anonymize, archive
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Legal Holds
CREATE TABLE IF NOT EXISTS legal_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL, -- user, organization, application, message
    resource_id UUID NOT NULL,
    reason TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE
);

-- 11. Third Party Sub-Processors
CREATE TABLE IF NOT EXISTS third_party_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(150) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    purpose TEXT NOT NULL,
    data_category VARCHAR(100) NOT NULL,
    country_region VARCHAR(100) NOT NULL DEFAULT 'United States',
    privacy_policy_url TEXT,
    terms_url TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. Privacy Incidents
CREATE TABLE IF NOT EXISTS privacy_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'low', -- low, medium, high, critical
    status VARCHAR(50) NOT NULL DEFAULT 'investigating', -- investigating, contained, resolved
    description TEXT NOT NULL,
    affected_data_category VARCHAR(150),
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_legal_docs_slug ON legal_documents(slug);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user ON legal_document_acceptances(user_id, document_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_visitor ON cookie_consents(visitor_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON privacy_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_user ON data_export_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_legal_holds_resource ON legal_holds(resource_type, resource_id, is_active);

-- Seed Core Legal Documents Catalog
INSERT INTO legal_documents (slug, document_type, title, locale, current_version, status) VALUES
('terms', 'terms', 'Terms of Service', 'en', '1.0.0', 'published'),
('privacy', 'privacy', 'Privacy Policy', 'en', '1.0.0', 'published'),
('cookies', 'cookies', 'Cookie Policy', 'en', '1.0.0', 'published'),
('community-guidelines', 'community', 'Community Guidelines', 'en', '1.0.0', 'published'),
('recruiter-terms', 'recruiter', 'Recruiter Terms of Service', 'en', '1.0.0', 'published'),
('company-terms', 'company', 'Company Terms of Service', 'en', '1.0.0', 'published'),
('acceptable-use', 'acceptable_use', 'Acceptable Use Policy', 'en', '1.0.0', 'published'),
('ai-policy', 'ai', 'AI Career Assistant Policy', 'en', '1.0.0', 'published'),
('accessibility', 'accessibility', 'Accessibility Statement', 'en', '1.0.0', 'published'),
('security', 'security', 'Security Overview', 'en', '1.0.0', 'published'),
('disclaimer', 'disclaimer', 'Platform Disclaimer', 'en', '1.0.0', 'published')
ON CONFLICT (slug) DO NOTHING;

-- Seed Cookie Registry
INSERT INTO cookie_registry (cookie_name, provider, category, purpose, is_required, is_active) VALUES
('kirmya_session', 'Kirmya', 'necessary', 'Stores authenticated user session context securely', true, true),
('kirmya_csrf', 'Kirmya', 'necessary', 'Cross-Site Request Forgery prevention token', true, true),
('kirmya_theme', 'Kirmya', 'preferences', 'Stores UI dark mode / glassmorphism preference', false, true),
('kirmya_analytics_id', 'Kirmya Analytics', 'analytics', 'Anonymous aggregate traffic usage tracking', false, true)
ON CONFLICT DO NOTHING;
