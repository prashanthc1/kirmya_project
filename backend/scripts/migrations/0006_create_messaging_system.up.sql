-- up migration: create professional messaging system tables

-- 1. Conversation Rooms List
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY,
    user_id_1 UUID NOT NULL,
    user_id_2 UUID NOT NULL,
    last_message_text TEXT DEFAULT '',
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_conversation_pair UNIQUE (user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_conversations_u1 ON conversations(user_id_1);
CREATE INDEX IF NOT EXISTS idx_conversations_u2 ON conversations(user_id_2);

-- 2. Message Entries List
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_cid ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(conversation_id, created_at ASC);

-- 3. File Attachments Registry
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_msg_attachments_msg_id ON message_attachments(message_id);

-- 4. User Presence Table (Scalable online status cache)
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'offline', -- online, offline
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
