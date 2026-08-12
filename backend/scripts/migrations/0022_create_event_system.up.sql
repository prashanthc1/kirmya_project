-- Up Migration: Create Professional Networking Events System Tables

-- 1. Event Hosts Table
CREATE TABLE IF NOT EXISTS event_hosts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    host_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    verified_host BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_hosts_user ON event_hosts(user_id);

-- 2. Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    host_id UUID REFERENCES event_hosts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'career_event', 'webinar', 'hiring_event', 'community_meetup'
    description TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_attendees INT DEFAULT 500,
    current_attendees INT DEFAULT 0,
    location_type VARCHAR(50) DEFAULT 'virtual', -- 'virtual', 'in_person'
    live_stream_url TEXT,
    banner_image_url TEXT,
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'live', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_id);

-- 3. Event Attendees Table
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_event_user_attendee UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);
