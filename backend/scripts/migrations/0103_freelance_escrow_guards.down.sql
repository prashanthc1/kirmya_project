-- Reverse the freelance escrow guards. No rows are touched.
DROP INDEX IF EXISTS idx_freelance_payment_intents_milestone;
ALTER TABLE freelance_contract_milestones DROP CONSTRAINT IF EXISTS freelance_contract_milestones_released_at;
ALTER TABLE freelance_payment_intents DROP CONSTRAINT IF EXISTS freelance_payment_intents_milestone_required;
DROP INDEX IF EXISTS uq_freelance_payment_intents_live_milestone;
