-- Where an account lands when nothing else says.
--
-- The active workspace follows the URL and is not stored: there is deliberately
-- no "current workspace" row, because a stored current-workspace is a second
-- source of truth whose only job is to disagree with the address bar. That
-- design stands, and this table does not change it.
--
-- This answers a different question, the one the URL cannot: where to go when
-- there is no URL yet. Signing in lands every account on /feed today, so a
-- recruiter who works a pipeline all day re-enters that workspace every
-- morning. One key, remembered, so the product opens where the account works.
--
-- Read this as a preference and never as a grant. Selecting a workspace confers
-- nothing; every route behind it authorizes its own request, and the key stored
-- here is validated against the account's live workspace list both when it is
-- written and again when it is served. A membership revoked between those two
-- moments resolves to no preference at all, not to a workspace.
CREATE TABLE IF NOT EXISTS workspace_preferences (
    -- One row per account, so the primary key is the account. There is no
    -- history here: the question is "where now", not "where before".
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- The workspace Key from internal/workspace/domain: a type name for the
    -- personal workspaces ('recruiting'), and type:uuid for the entity-scoped
    -- ones ('company:0f2c...'). Keys are stored rather than resolved ids
    -- because a key names exactly one workspace across every type, and the
    -- serving code compares it against keys it has just resolved.
    --
    -- Deliberately unconstrained beyond non-empty. A CHECK listing the valid
    -- types would be a copy of the domain vocabulary that migrations could not
    -- keep in step, and it would buy nothing: an unrecognised key fails the
    -- resolved-list comparison on the way out and is treated as no preference.
    last_workspace_key TEXT NOT NULL CHECK (length(trim(last_workspace_key)) > 0),

    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
