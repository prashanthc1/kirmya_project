-- up migration: create professional networking system tables

-- 1. Active Bidirectional Connections
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY,
    user_id_1 UUID NOT NULL,
    user_id_2 UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_connection_pair UNIQUE(user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_connections_u1 ON connections(user_id_1);
CREATE INDEX IF NOT EXISTS idx_connections_u2 ON connections(user_id_2);

-- 2. Connection Requests Registry (Pending, Accepted, Rejected)
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_request_pair UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_conn_requests_sender ON connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_conn_requests_receiver ON connection_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_conn_requests_status ON connection_requests(receiver_id, status);

-- 3. Blocked Users Privacy Table
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY,
    blocker_id UUID NOT NULL,
    blocked_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_block_pair UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);
