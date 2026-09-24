-- Disputes and refunds for the freelance escrow flow.
--
-- Migration 0102 created freelance_disputes and freelance_dispute_evidence with
-- nothing writing them. The dispute flow now does, and records two things the
-- table had no column for: which of the three decisions an administrator made,
-- and where the milestone was when the dispute froze it (so withdrawing the
-- dispute can put it back exactly there).

ALTER TABLE freelance_disputes ADD COLUMN IF NOT EXISTS outcome VARCHAR(32);
ALTER TABLE freelance_disputes ADD COLUMN IF NOT EXISTS milestone_status_before VARCHAR(32);

ALTER TABLE freelance_disputes DROP CONSTRAINT IF EXISTS freelance_disputes_outcome_check;
ALTER TABLE freelance_disputes ADD CONSTRAINT freelance_disputes_outcome_check
    CHECK (outcome IS NULL OR outcome IN ('release_to_freelancer', 'refund_to_client', 'resume_work'));

-- A resolved dispute says what was decided, not only that something was.
-- NOT VALID: it binds every row written from here on without asserting anything
-- about rows no code has written.
ALTER TABLE freelance_disputes DROP CONSTRAINT IF EXISTS freelance_disputes_outcome_when_resolved;
ALTER TABLE freelance_disputes ADD CONSTRAINT freelance_disputes_outcome_when_resolved
    CHECK (status <> 'resolved' OR outcome IS NOT NULL) NOT VALID;

-- A dispute is about money held for one milestone, so it names the milestone.
ALTER TABLE freelance_disputes DROP CONSTRAINT IF EXISTS freelance_disputes_milestone_required;
ALTER TABLE freelance_disputes ADD CONSTRAINT freelance_disputes_milestone_required
    CHECK (milestone_id IS NOT NULL) NOT VALID;

-- Refunds. The processor's reference for the refund and when it happened; the
-- intent's status already says that it was refunded.
ALTER TABLE freelance_payment_intents ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(255);
ALTER TABLE freelance_payment_intents ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE freelance_payment_intents DROP CONSTRAINT IF EXISTS freelance_payment_intents_refund_recorded;
ALTER TABLE freelance_payment_intents ADD CONSTRAINT freelance_payment_intents_refund_recorded
    CHECK (status <> 'refunded' OR refunded_at IS NOT NULL) NOT VALID;

-- The administrator's queue reads open disputes oldest first, and each party
-- reads a contract's disputes.
CREATE INDEX IF NOT EXISTS idx_freelance_disputes_contract
    ON freelance_disputes (contract_id, created_at DESC);
