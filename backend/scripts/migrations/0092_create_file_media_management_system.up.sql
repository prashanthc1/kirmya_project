-- up migration: create canonical file and media management system

-- 1. Canonical Files Table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(512) UNIQUE NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- 'image', 'document', 'video', 'audio', 'archive'
    detected_content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    checksum VARCHAR(64) NOT NULL, -- SHA-256 hex string
    extension VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'avatar', 'cover', 'resume', 'application_document', 'message_attachment', 'company_logo', 'community_media', 'verification_evidence'
    visibility VARCHAR(20) NOT NULL DEFAULT 'private', -- 'private', 'public', 'shared'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'uploading', 'active', 'deleted'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_visibility ON files(visibility);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_checksum ON files(checksum);
CREATE INDEX IF NOT EXISTS idx_files_storage_key ON files(storage_key);

-- 2. File Attachments Relationship Table
CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'profile', 'resume', 'application', 'message', 'company', 'community', 'verification'
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_attachments_file ON file_attachments(file_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_entity ON file_attachments(entity_type, entity_id);
