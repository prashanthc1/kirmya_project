-- up migration: create messaging, requests, participant settings, reactions, and administration tables

-- 1. Message Requests (Non-connections direct messaging invitations)
CREATE TABLE IF NOT EXISTS message_requests (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    initial_message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, declined, blocked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_message_request_pair UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_msg_req_receiver ON message_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_msg_req_sender ON message_requests(sender_id);

-- 2. Conversation Participant Preferences (Archived, Muted, Pinned, Unread count)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    unread_count INT NOT NULL DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_conversation_participant UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_part_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_part_conv ON conversation_participants(conversation_id);

-- 3. Batch Message Read Receipts
CREATE TABLE IF NOT EXISTS message_reads (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_message_read UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_msg_reads_msg ON message_reads(message_id);

-- 4. Message Safety & Abuse Reports
CREATE TABLE IF NOT EXISTS message_reports (
    id UUID PRIMARY KEY,
    reporter_id UUID NOT NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, reviewed, actioned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_msg_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_msg_reports_reporter ON message_reports(reporter_id);

-- 5. Message Emoji Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    emoji VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_message_user_reaction UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_msg_reactions_msg ON message_reactions(message_id);
