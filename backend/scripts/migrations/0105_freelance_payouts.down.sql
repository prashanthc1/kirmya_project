-- Reverse payout sending. Payout rows are kept; the send bookkeeping and the
-- payout accounts are lost.
DROP INDEX IF EXISTS idx_freelance_payouts_due;
ALTER TABLE freelance_payouts DROP CONSTRAINT IF EXISTS freelance_payouts_paid_recorded;
DROP INDEX IF EXISTS uq_freelance_payouts_payment_intent;
ALTER TABLE freelance_payouts DROP COLUMN IF EXISTS next_attempt_at;
ALTER TABLE freelance_payouts DROP COLUMN IF EXISTS last_error;
ALTER TABLE freelance_payouts DROP COLUMN IF EXISTS attempts;
ALTER TABLE freelance_payouts DROP COLUMN IF EXISTS destination_account;
ALTER TABLE freelance_payouts DROP COLUMN IF EXISTS payment_intent_id;
ALTER TABLE freelance_payouts DROP COLUMN IF EXISTS milestone_id;
DROP INDEX IF EXISTS uq_freelance_payout_accounts_account;
DROP TABLE IF EXISTS freelance_payout_accounts;
