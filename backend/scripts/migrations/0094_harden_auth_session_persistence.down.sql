DROP INDEX IF EXISTS idx_sessions_user_active;
DROP INDEX IF EXISTS idx_sessions_rotated_from;

ALTER TABLE sessions
    DROP COLUMN IF EXISTS rotated_from,
    DROP COLUMN IF EXISTS remember_me;
