-- Migration 0064 Up: Create Help Center, Knowledge Base, Support Tickets, & Feedback Tables

-- 1. Support Article Categories Table
CREATE TABLE IF NOT EXISTS support_article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Support Articles Table
CREATE TABLE IF NOT EXISTS support_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    category_code VARCHAR(64) NOT NULL REFERENCES support_article_categories(code) ON UPDATE CASCADE,
    tags JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, review, published, archived
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    version INT NOT NULL DEFAULT 1,
    view_count INT NOT NULL DEFAULT 0,
    helpful_count INT NOT NULL DEFAULT 0,
    not_helpful_count INT NOT NULL DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_articles_slug ON support_articles(slug);
CREATE INDEX IF NOT EXISTS idx_support_articles_status ON support_articles(status);
CREATE INDEX IF NOT EXISTS idx_support_articles_category ON support_articles(category_code);

-- 3. Support Article Revisions Table
CREATE TABLE IF NOT EXISTS support_article_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES support_articles(id) ON DELETE CASCADE,
    version INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    change_summary TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Support Article Feedback Table
CREATE TABLE IF NOT EXISTS support_article_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES support_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_helpful BOOLEAN NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- account, auth, profile, jobs, applications, recruiters, companies, messaging, notifications, privacy, security, trust_safety, technical, feedback, feature_request, other
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, pending, in_progress, waiting_for_user, waiting_for_internal, escalated, resolved, closed, reopened
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_team VARCHAR(100) DEFAULT 'General Support',
    related_resource_type VARCHAR(64),
    related_resource_id UUID,
    sla_due_at TIMESTAMP WITH TIME ZONE,
    satisfaction_rating INT DEFAULT 0, -- 1 to 5
    satisfaction_feedback TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);

-- 6. Support Messages Table (Threaded Conversation with Isolated Internal Notes)
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(32) NOT NULL DEFAULT 'user', -- user, agent, system
    message_text TEXT NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT false,
    attachment_urls JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id, is_internal_note);

-- 7. Support Ticket Audit History Table
CREATE TABLE IF NOT EXISTS support_ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- created, assigned, status_changed, priority_changed, escalated, merged, resolved, closed, reopened
    previous_state JSONB DEFAULT '{}'::jsonb,
    new_state JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Support Feature Requests Table
CREATE TABLE IF NOT EXISTS support_feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted, under_review, planned, in_development, released, declined
    upvotes_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Support Bug Reports Table
CREATE TABLE IF NOT EXISTS support_bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    expected_behavior TEXT,
    actual_behavior TEXT,
    browser VARCHAR(100),
    os VARCHAR(100),
    device VARCHAR(100),
    screenshot_urls JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, triaged, investigating, fixed, closed
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed Categories
INSERT INTO support_article_categories (code, name, description, display_order) VALUES
('getting_started', 'Getting Started', 'Initial setup, registration, and onboarding guides.', 1),
('account', 'Account Management', 'Account settings, password reset, and profile management.', 2),
('jobs', 'Jobs & Applications', 'Discovering job postings, saved searches, and tracking applications.', 3),
('recruiters', 'Recruiter & Hiring Tools', 'Hiring tools, recruiter profiles, and candidate search.', 4),
('companies', 'Companies & Organizations', 'Company profile setup, verification, and brand pages.', 5),
('communities', 'Professional Communities', 'Joining communities, discussions, and networking.', 6),
('messaging', 'Direct Messaging', 'Chat, conversation safety, and networking connections.', 7),
('privacy', 'Privacy & Data Protection', 'Data rights, cookie controls, export, and account deletion.', 8),
('security', 'Security & Authentication', 'Two-Factor authentication, active sessions, and account protection.', 9),
('trust_safety', 'Trust & Safety', 'Reporting scams, blocking users, and platform policies.', 10),
('troubleshooting', 'Troubleshooting & Technical Support', 'Common errors, system status, and technical issues.', 11)
ON CONFLICT (code) DO NOTHING;
