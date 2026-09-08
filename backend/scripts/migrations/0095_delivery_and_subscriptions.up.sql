-- Durable delivery for notifications and job alerts, and a real newsletter
-- subscription record.
--
-- notification_deliveries already had the right shape — status, attempts,
-- max_attempts, last_error, scheduled_at, sent_at — and the admin dead-letter
-- and retry endpoints were already built against it. Nothing ever wrote a row.
-- What was missing was a producer and a worker, not a schema; this migration
-- adds only the indexes those need and the two things that genuinely did not
-- exist.

-- The worker claims due rows with FOR UPDATE SKIP LOCKED. Without this index the
-- claim is a sequential scan over every delivery ever attempted.
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_due
    ON notification_deliveries (scheduled_at)
    WHERE status IN ('Pending', 'Retrying');

-- A notification must not be queued twice on the same channel. This is what
-- makes the producer safe to call again after a crash mid-enqueue.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_deliveries_unique_channel
    ON notification_deliveries (notification_id, channel);

-- The matcher only looks at jobs published since it last ran for this alert, so
-- a candidate is not re-notified about the same posting on every pass.
ALTER TABLE job_alerts
    ADD COLUMN IF NOT EXISTS last_matched_at TIMESTAMPTZ;

-- Alerts are swept oldest-watermark-first.
CREATE INDEX IF NOT EXISTS idx_job_alerts_active_watermark
    ON job_alerts (last_matched_at NULLS FIRST)
    WHERE is_active = TRUE;

-- One row per (alert, job) the candidate has already been told about.
--
-- alert_delivery_history is digest-shaped — one row per send, with counts of
-- jobs included — so it cannot answer "has this candidate already seen this
-- posting for this alert?". Without that, every sweep re-notifies about every
-- still-open job the alert matches, forever. The unique constraint is the
-- dedup: the matcher inserts and lets the database decide, so two concurrent
-- sweeps cannot both send.
CREATE TABLE IF NOT EXISTS job_alert_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES job_alerts(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL,
    job_id UUID NOT NULL,
    notification_id UUID,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_alert_matches_unique
    ON job_alert_matches (alert_id, job_id);

CREATE INDEX IF NOT EXISTS idx_job_alert_matches_candidate
    ON job_alert_matches (candidate_id, matched_at DESC);

-- Newsletter subscriptions.
--
-- The footer form set a local "Subscribed successfully!" flag and sent nothing
-- anywhere, so every address anyone ever entered was discarded. Storing one is
-- the whole of F09; the columns beyond the address exist so the record can also
-- be honoured: a token to unsubscribe with, and the state to stop sending.
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL,
    -- 'pending' until confirmed, 'subscribed' once confirmed, 'unsubscribed'
    -- after the recipient opts out. Rows are never deleted: an unsubscribe has
    -- to survive a later re-import of the same address.
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Where the address came from, so a complaint can be traced to a form.
    source VARCHAR(64) NOT NULL DEFAULT 'footer',
    -- Opaque, unguessable, and the only thing an unsubscribe link needs to
    -- carry. Never the email address: a link with an address in it lets anyone
    -- unsubscribe anyone by editing the URL.
    unsubscribe_token VARCHAR(64) NOT NULL,
    confirm_token VARCHAR(64),
    ip_address VARCHAR(45) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One record per address. Re-subscribing updates the existing row rather than
-- accumulating duplicates, which is what makes the unsubscribe state stick.
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email
    ON newsletter_subscriptions (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscriptions_unsubscribe_token
    ON newsletter_subscriptions (unsubscribe_token);
