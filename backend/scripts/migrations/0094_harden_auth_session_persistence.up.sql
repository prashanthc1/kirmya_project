-- Session persistence hardening: carry the Remember Me policy across refresh
-- token rotation, and store refresh tokens as hashes rather than as the bearer
-- value itself.
--
-- remember_me records the policy the session was created under. Rotation reads
-- it back so a 30-day Remember Me session keeps its own expiry instead of being
-- silently reissued with the 7-day default, and so the cookie's Max-Age can be
-- derived from the same instant the session row carries.
--
-- token_hash holds the SHA-256 of the refresh token. Anyone with read access to
-- this table previously held every live session's bearer token; a hash cannot be
-- presented to the API. Existing rows are migrated to a revoked state rather
-- than being rewritten: the raw token cannot be recovered into a hash, and
-- leaving them live would mean a lookup by hash never matches them while the
-- row still counts as an active session. Everyone signed in at deploy time signs
-- in again once, which is the intended cost of removing plaintext tokens.

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS remember_me BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rotated_from UUID;

-- Revoke any session still holding a plaintext refresh token. The column is
-- reused to store the hash from here on, so a row written before this migration
-- can never be matched again and must not stay active.
UPDATE sessions
   SET revoked_at = COALESCE(revoked_at, NOW())
 WHERE length(refresh_token) <> 64
    OR refresh_token !~ '^[0-9a-f]+$';

-- Rotation walks this chain when auditing a reuse incident.
CREATE INDEX IF NOT EXISTS idx_sessions_rotated_from ON sessions(rotated_from);

-- Expiry sweeps and the "sessions for this user" screens both filter on these.
CREATE INDEX IF NOT EXISTS idx_sessions_user_active
    ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;
