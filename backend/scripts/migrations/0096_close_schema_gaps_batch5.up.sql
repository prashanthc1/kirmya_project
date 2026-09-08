-- Batch 5 schema conformance.
--
-- Every statement here answers a query the code already runs. They were found
-- by comparing the SQL in internal/*/repository against the migrated schema:
-- three tables no repository could ever reach, and a set of columns that only
-- exist in a second CREATE TABLE for a name an earlier migration had already
-- taken. `CREATE TABLE IF NOT EXISTS` made every one of those collisions
-- silent - the later definition is skipped, and the module that expected it
-- fails at runtime instead of at migration time.

-- 1. Networking goals, notes and labels.
--    internal/networking/repository/networking_repo.go reads and writes all
--    three. None was ever created, so GET /api/v1/network/goals answered 500
--    with `relation "networking_goals" does not exist` and every note or label
--    write failed the same way.
CREATE TABLE IF NOT EXISTS networking_goals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    target_count INTEGER NOT NULL DEFAULT 0,
    current_count INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(64) NOT NULL DEFAULT 'connect',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    deadline VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_networking_goals_user ON networking_goals (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS connection_notes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, target_user_id)
);

CREATE TABLE IF NOT EXISTS connection_labels (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, target_user_id, label)
);

-- 2. Notification preferences are toggled per category by the settings screen.
--    notification_preference_categories existed with only enabled/frequency, so
--    the per-channel switches had nowhere to go.
ALTER TABLE notification_preference_categories
    ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Community membership records when a member joined; the insert names
--    joined_at while the original table created created_at.
ALTER TABLE community_members
    ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 4. Mentorship feedback is written with the author and subject of the note.
ALTER TABLE mentorship_feedback
    ADD COLUMN IF NOT EXISTS from_user_id UUID,
    ADD COLUMN IF NOT EXISTS to_user_id UUID;

-- 5. Multi-factor authentication. internal/security wrote a TOTP secret and
--    the enrolment flags into columns that do not exist, discarded the error,
--    and fell back to a process-memory map: enrolment reported success and the
--    secret disappeared on restart.
ALTER TABLE mfa_methods
    ADD COLUMN IF NOT EXISTS secret TEXT,
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_mfa_methods_user_method ON mfa_methods (user_id, method_type);

-- 6. Per-user security settings. security_settings is a global key/value table
--    from the admin module; the per-user rows the security module upserts need
--    their own table rather than a third meaning for that name.
CREATE TABLE IF NOT EXISTS user_security_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    password_last_changed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Security incidents and events carry the fields the module reports on.
ALTER TABLE security_incidents
    ADD COLUMN IF NOT EXISTS incident_number VARCHAR(64),
    ADD COLUMN IF NOT EXISTS category VARCHAR(64),
    ADD COLUMN IF NOT EXISTS details JSONB,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE security_events
    ADD COLUMN IF NOT EXISTS severity VARCHAR(32) NOT NULL DEFAULT 'info';

-- 8. Privacy incidents and retention policies: the governance migration
--    redefined both names an earlier one had created, so its columns were
--    never added.
ALTER TABLE privacy_incidents
    ADD COLUMN IF NOT EXISTS breach_type VARCHAR(64),
    ADD COLUMN IF NOT EXISTS impacted_user_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reported_by UUID,
    ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE retention_policies
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 9. Recommendation feedback: the job-alerts migration redefined the
--    recommendation module's table name.
ALTER TABLE recommendation_feedback
    ADD COLUMN IF NOT EXISTS action_type VARCHAR(32),
    ADD COLUMN IF NOT EXISTS feedback_reason TEXT;

-- 10. The recommendation engine's own preference vector. Its migration tried to
--     create user_preferences, which the profile system already owns with an
--     unrelated shape, so the engine read columns that were never there.
CREATE TABLE IF NOT EXISTS recommendation_user_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
    disliked_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    feature_vector JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
