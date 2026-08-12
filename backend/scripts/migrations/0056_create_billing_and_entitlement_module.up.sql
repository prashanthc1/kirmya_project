-- Migration 0056: Create Billing, Subscription, Payment, Invoice, and Entitlement System
-- Tech Stack: Golang, Gin, PostgreSQL

-- 1. Billing Plans
CREATE TABLE IF NOT EXISTS billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'free', -- free, recurring, custom
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly', -- monthly, yearly, one_time, custom
    price_cents INT NOT NULL DEFAULT 0,
    trial_period_days INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_public BOOLEAN NOT NULL DEFAULT true,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Entitlements Catalog
CREATE TABLE IF NOT EXISTS billing_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g. recruiter.advanced_search, company.analytics
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Plan Entitlements Join Table
CREATE TABLE IF NOT EXISTS billing_plan_entitlements (
    plan_id UUID NOT NULL REFERENCES billing_plans(id) ON DELETE CASCADE,
    entitlement_code VARCHAR(100) NOT NULL REFERENCES billing_entitlements(code) ON DELETE CASCADE,
    limit_value INT DEFAULT NULL, -- NULL means unlimited
    PRIMARY KEY (plan_id, entitlement_code)
);

-- 4. Billing Customers Mapping
CREATE TABLE IF NOT EXISTS billing_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
    provider_customer_id VARCHAR(255) UNIQUE,
    billing_email VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    tax_id VARCHAR(100),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Billing Subscriptions
CREATE TABLE IF NOT EXISTS billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES billing_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- trialing, active, past_due, paused, cancelled, expired, incomplete
    provider_subscription_id VARCHAR(255) UNIQUE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Billing Subscription Items
CREATE TABLE IF NOT EXISTS billing_subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
    entitlement_code VARCHAR(100) NOT NULL REFERENCES billing_entitlements(code),
    quantity INT NOT NULL DEFAULT 1,
    price_cents INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Payment Methods
CREATE TABLE IF NOT EXISTS billing_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
    provider_payment_method_id VARCHAR(255) UNIQUE,
    brand VARCHAR(50) NOT NULL DEFAULT 'visa',
    last_four VARCHAR(4) NOT NULL,
    exp_month INT NOT NULL,
    exp_year INT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Payments
CREATE TABLE IF NOT EXISTS billing_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
    amount_cents INT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'succeeded', -- pending, succeeded, failed, refunded
    provider_payment_id VARCHAR(255) UNIQUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Invoices
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
    subtotal_cents INT NOT NULL DEFAULT 0,
    tax_cents INT NOT NULL DEFAULT 0,
    discount_cents INT NOT NULL DEFAULT 0,
    total_cents INT NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'paid', -- draft, open, paid, past_due, void
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT,
    provider_invoice_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Invoice Items
CREATE TABLE IF NOT EXISTS billing_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount_cents INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. Refunds
CREATE TABLE IF NOT EXISTS billing_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES billing_payments(id) ON DELETE CASCADE,
    amount_cents INT NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'succeeded',
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. Coupons
CREATE TABLE IF NOT EXISTS billing_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- percentage, fixed
    discount_value INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 13. Entitlement Usage Tracking
CREATE TABLE IF NOT EXISTS billing_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- user, organization, company
    entity_id UUID NOT NULL,
    entitlement_code VARCHAR(100) NOT NULL REFERENCES billing_entitlements(code),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    current_usage INT NOT NULL DEFAULT 0,
    usage_limit INT DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, entitlement_code, period_start)
);

-- 14. Webhook Events Logging
CREATE TABLE IF NOT EXISTS billing_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
    provider_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(150) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processed', -- pending, processed, failed
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 15. Audit Logs for Billing
CREATE TABLE IF NOT EXISTS billing_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_billing_customers_user_id ON billing_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_org_id ON billing_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer ON billing_subscriptions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_billing_payments_customer ON billing_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer ON billing_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_usage_entity ON billing_usage(entity_type, entity_id, entitlement_code);

-- Seed Default FREE Plan and Core Entitlements
INSERT INTO billing_plans (id, name, slug, description, plan_type, currency, billing_interval, price_cents, trial_period_days, is_active, is_public, features, limits)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Free Plan',
    'free',
    'Full access to standard Kirmya career platform, job posting, applicant tracking, and community features.',
    'free',
    'USD',
    'monthly',
    0,
    0,
    true,
    true,
    '{"jobs": "unlimited", "applications": "unlimited", "ai_matching": "standard"}'::jsonb,
    '{"monthly_job_posts": -1, "monthly_ai_requests": -1}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO billing_entitlements (code, name, category, description) VALUES
('jobs.create', 'Create Job Listings', 'jobs', 'Post standard job listings on Kirmya'),
('jobs.feature', 'Featured Job Posts', 'jobs', 'Highlight job listings on home search'),
('recruiter.search', 'Recruiter Candidate Search', 'recruiter', 'Search public candidate profiles'),
('recruiter.advanced_search', 'AI Advanced Candidate Search', 'recruiter', 'Use AI semantic matching for candidates'),
('company.analytics', 'Company Hiring Analytics', 'company', 'Access workforce intelligence and analytics'),
('applications.submit', 'Submit Job Applications', 'candidate', 'Apply to active job postings'),
('ai.standard', 'Standard AI Resume & Interview Prep', 'ai', 'Access AI career companion and resume helper')
ON CONFLICT (code) DO NOTHING;

INSERT INTO billing_plan_entitlements (plan_id, entitlement_code, limit_value) VALUES
('00000000-0000-0000-0000-000000000001', 'jobs.create', NULL),
('00000000-0000-0000-0000-000000000001', 'recruiter.search', NULL),
('00000000-0000-0000-0000-000000000001', 'company.analytics', NULL),
('00000000-0000-0000-0000-000000000001', 'applications.submit', NULL),
('00000000-0000-0000-0000-000000000001', 'ai.standard', NULL)
ON CONFLICT (plan_id, entitlement_code) DO NOTHING;
