-- Up Migration: Create Mobile App Support System Tables

-- 1. Mobile App User Devices Table
CREATE TABLE IF NOT EXISTS user_mobile_devices (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'android', 'ios'
    device_model VARCHAR(255),
    os_version VARCHAR(50),
    app_version VARCHAR(50),
    push_token TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_device UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_mobile_devices_user ON user_mobile_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_token ON user_mobile_devices(push_token);

-- 2. Mobile Presigned Upload Sessions Table (Optimized for Mobile Connections)
CREATE TABLE IF NOT EXISTS mobile_upload_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    presigned_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'uploaded', 'expired'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mobile_uploads_user ON mobile_upload_sessions(user_id);
