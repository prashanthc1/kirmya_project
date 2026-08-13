-- Migration 0062: Security, Identity Protection, Session Management, Device Management, MFA, API Security & Administration Module

-- 1. Trusted Devices Table
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL DEFAULT 'Web Browser',
    browser VARCHAR(100) NOT NULL DEFAULT 'Unknown Browser',
    os VARCHAR(100) NOT NULL DEFAULT 'Unknown OS',
    trusted_status VARCHAR(50) NOT NULL DEFAULT 'trusted', -- trusted, pending, revoked
    push_token TEXT,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);

-- 2. MFA Methods Table
CREATE TABLE IF NOT EXISTS mfa_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL DEFAULT 'totp', -- totp, recovery_codes, passkey
    secret_encrypted TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, method_type)
);

CREATE INDEX IF NOT EXISTS idx_mfa_methods_user ON mfa_methods(user_id);

-- 3. MFA Recovery Codes Table
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user ON mfa_recovery_codes(user_id);

-- 4. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(32) NOT NULL,
    scopes TEXT NOT NULL DEFAULT 'profile.read,jobs.read',
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- 5. Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- login.success, login.failure, password.changed, mfa.enabled, session.revoked, api_key.created, suspicious_activity
    severity VARCHAR(32) NOT NULL DEFAULT 'low', -- low, medium, high, critical
    ip_address VARCHAR(45) DEFAULT '',
    user_agent TEXT DEFAULT '',
    location VARCHAR(150) DEFAULT 'Unknown Location',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);

-- 6. Security Incidents Table
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, investigating, contained, resolved, closed
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    affected_area VARCHAR(150) NOT NULL DEFAULT 'Authentication Services',
    description TEXT NOT NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);

-- 7. Security Settings Table
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Platform Security Policies
INSERT INTO security_settings (setting_key, setting_value) VALUES
('session_idle_timeout_minutes', '60'),
('session_max_lifetime_hours', '720'),
('mfa_required_for_admins', 'true'),
('password_min_length', '12'),
('password_require_symbols', 'true'),
('login_rate_limit_per_minute', '10')
ON CONFLICT (setting_key) DO NOTHING;
