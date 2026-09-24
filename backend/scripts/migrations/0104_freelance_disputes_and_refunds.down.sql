-- Reverse the dispute and refund columns. Dispute rows are kept; what they
-- recorded in these columns is lost.
DROP INDEX IF EXISTS idx_freelance_disputes_contract;
ALTER TABLE freelance_payment_intents DROP CONSTRAINT IF EXISTS freelance_payment_intents_refund_recorded;
ALTER TABLE freelance_payment_intents DROP COLUMN IF EXISTS refunded_at;
ALTER TABLE freelance_payment_intents DROP COLUMN IF EXISTS refund_reference;
ALTER TABLE freelance_disputes DROP CONSTRAINT IF EXISTS freelance_disputes_milestone_required;
ALTER TABLE freelance_disputes DROP CONSTRAINT IF EXISTS freelance_disputes_outcome_when_resolved;
ALTER TABLE freelance_disputes DROP CONSTRAINT IF EXISTS freelance_disputes_outcome_check;
ALTER TABLE freelance_disputes DROP COLUMN IF EXISTS milestone_status_before;
ALTER TABLE freelance_disputes DROP COLUMN IF EXISTS outcome;
