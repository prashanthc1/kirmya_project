-- Sending payouts to freelancers.
--
-- Releasing a milestone has recorded a pending payout since migration 0102, and
-- nothing sent it. Two things are added:
--
-- freelance_payout_accounts: where a freelancer is paid. One account per user
-- per processor, created by the processor's own hosted onboarding - Kirmya
-- stores the processor's account id and what the processor last said about it,
-- never bank details.
--
-- On freelance_payouts: the escrowed charge each payout is paid from, and the
-- bookkeeping a retried send needs - how many attempts, the last error, and when
-- to try again.

CREATE TABLE IF NOT EXISTS freelance_payout_accounts (
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider          VARCHAR(50) NOT NULL,
    account_id        VARCHAR(255) NOT NULL,
    details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    payouts_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    transfers_active  BOOLEAN NOT NULL DEFAULT FALSE,
    requirements_due  BOOLEAN NOT NULL DEFAULT FALSE,
    disabled_reason   VARCHAR(255),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, provider)
);
-- The processor's webhooks name the account, not the user.
CREATE UNIQUE INDEX IF NOT EXISTS uq_freelance_payout_accounts_account
    ON freelance_payout_accounts (provider, account_id);

ALTER TABLE freelance_payouts ADD COLUMN IF NOT EXISTS milestone_id UUID
    REFERENCES freelance_contract_milestones(id) ON DELETE SET NULL;
ALTER TABLE freelance_payouts ADD COLUMN IF NOT EXISTS payment_intent_id UUID
    REFERENCES freelance_payment_intents(id) ON DELETE SET NULL;
ALTER TABLE freelance_payouts ADD COLUMN IF NOT EXISTS destination_account VARCHAR(255);
ALTER TABLE freelance_payouts ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE freelance_payouts ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE freelance_payouts ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;

-- Escrowed money is paid out once. A second payout for the same charge - a
-- release racing a dispute decision - fails here whatever the code above did.
CREATE UNIQUE INDEX IF NOT EXISTS uq_freelance_payouts_payment_intent
    ON freelance_payouts (payment_intent_id) WHERE payment_intent_id IS NOT NULL;

-- A paid payout says where the money went and when.
ALTER TABLE freelance_payouts DROP CONSTRAINT IF EXISTS freelance_payouts_paid_recorded;
ALTER TABLE freelance_payouts ADD CONSTRAINT freelance_payouts_paid_recorded
    CHECK (status <> 'paid' OR (paid_at IS NOT NULL AND provider_reference IS NOT NULL)) NOT VALID;

-- The sender claims due payouts oldest first.
CREATE INDEX IF NOT EXISTS idx_freelance_payouts_due
    ON freelance_payouts (created_at) WHERE status IN ('pending', 'processing');
