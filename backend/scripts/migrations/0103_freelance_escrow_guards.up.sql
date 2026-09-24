-- Guards for the freelance escrow flow.
--
-- Migration 0102 created the milestone and payment-intent tables with nothing
-- writing them. The escrow flow now does, and two of its rules are about money,
-- so they are enforced here as well as in the service: a rule the service alone
-- enforces is one concurrent request away from being broken.

-- At most one live payment intent per milestone. Two clicks on "fund" must not
-- become two charges for one step of work. A failed or cancelled intent is not
-- live, so a client whose card was declined can try again.
CREATE UNIQUE INDEX IF NOT EXISTS uq_freelance_payment_intents_live_milestone
    ON freelance_payment_intents (milestone_id)
    WHERE milestone_id IS NOT NULL
      AND status IN ('requires_payment', 'processing', 'held_in_escrow');

-- A funding intent always names its milestone. The column is nullable because
-- 0102 left room for contract-level payments; none exist, and the escrow flow's
-- lookups and the index above both depend on the milestone being present.
ALTER TABLE freelance_payment_intents DROP CONSTRAINT IF EXISTS freelance_payment_intents_milestone_required;
ALTER TABLE freelance_payment_intents ADD CONSTRAINT freelance_payment_intents_milestone_required
    CHECK (milestone_id IS NOT NULL) NOT VALID;

-- Released milestones carry the time they were released.
ALTER TABLE freelance_contract_milestones DROP CONSTRAINT IF EXISTS freelance_contract_milestones_released_at;
ALTER TABLE freelance_contract_milestones ADD CONSTRAINT freelance_contract_milestones_released_at
    CHECK (status <> 'released' OR completed_at IS NOT NULL);

-- The flow reads a milestone's intents newest first.
CREATE INDEX IF NOT EXISTS idx_freelance_payment_intents_milestone
    ON freelance_payment_intents (milestone_id, created_at DESC);
