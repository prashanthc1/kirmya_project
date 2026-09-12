-- Reverse of 0102.
--
-- The new tables are dropped outright. The three renames and the money columns
-- are put back as 0032 left them, so that rolling back lands on a schema the
-- pre-0102 code can actually run against.
--
-- Money loses nothing on the way back: minor units divided by 100 is exact for
-- a two-decimal currency. The normalized portfolio and skill rows are folded
-- back into the JSONB columns they came from.

DROP TABLE IF EXISTS freelance_favorites;
DROP TABLE IF EXISTS freelance_verification_records;
DROP TABLE IF EXISTS freelance_dispute_evidence;
DROP TABLE IF EXISTS freelance_disputes;
DROP TABLE IF EXISTS freelance_reviews;
DROP TABLE IF EXISTS freelance_payouts;
DROP TABLE IF EXISTS freelance_payment_intents;
DROP TABLE IF EXISTS freelance_deliveries;
DROP TABLE IF EXISTS freelance_contract_milestones;
DROP TABLE IF EXISTS freelance_service_packages;
DROP TABLE IF EXISTS freelance_services;
DROP TABLE IF EXISTS freelance_proposal_milestones;

-- Skills back into JSONB before the source table goes away.
ALTER TABLE freelance_projects ADD COLUMN IF NOT EXISTS skills_required JSONB DEFAULT '[]'::jsonb;
UPDATE freelance_projects pr
   SET skills_required = COALESCE(
       (SELECT jsonb_agg(to_jsonb(s.skill) ORDER BY s.skill)
          FROM freelance_project_skills s WHERE s.project_id = pr.id), '[]'::jsonb);
DROP TABLE IF EXISTS freelance_project_skills;

ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS portfolio_links JSONB DEFAULT '[]'::jsonb;
UPDATE freelancer_profiles p
   SET portfolio_links = COALESCE(
       (SELECT jsonb_agg(jsonb_build_object('title', i.title, 'url', i.url) ORDER BY i.position)
          FROM freelance_portfolio_items i WHERE i.profile_id = p.id), '[]'::jsonb);
DROP TABLE IF EXISTS freelance_portfolio_items;

-- Money back to NUMERIC.
ALTER TABLE freelancer_profiles DROP CONSTRAINT IF EXISTS freelancer_profiles_rate_nonneg;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);
UPDATE freelancer_profiles SET hourly_rate = hourly_rate_minor_units::NUMERIC / 100;
ALTER TABLE freelancer_profiles ALTER COLUMN hourly_rate SET NOT NULL;
ALTER TABLE freelancer_profiles DROP COLUMN IF EXISTS hourly_rate_minor_units;
ALTER TABLE freelancer_profiles DROP COLUMN IF EXISTS currency;

ALTER TABLE freelance_projects DROP CONSTRAINT IF EXISTS freelance_projects_budget_nonneg;
ALTER TABLE freelance_projects ADD COLUMN IF NOT EXISTS budget NUMERIC(10, 2);
UPDATE freelance_projects SET budget = budget_minor_units::NUMERIC / 100;
ALTER TABLE freelance_projects ALTER COLUMN budget SET NOT NULL;
ALTER TABLE freelance_projects DROP COLUMN IF EXISTS budget_minor_units;
ALTER TABLE freelance_projects DROP COLUMN IF EXISTS currency;

ALTER TABLE freelance_proposals DROP CONSTRAINT IF EXISTS freelance_proposals_bid_nonneg;
ALTER TABLE freelance_proposals ADD COLUMN IF NOT EXISTS bid_amount NUMERIC(10, 2);
UPDATE freelance_proposals SET bid_amount = bid_amount_minor_units::NUMERIC / 100;
ALTER TABLE freelance_proposals ALTER COLUMN bid_amount SET NOT NULL;
ALTER TABLE freelance_proposals DROP COLUMN IF EXISTS bid_amount_minor_units;
ALTER TABLE freelance_proposals DROP COLUMN IF EXISTS currency;
ALTER TABLE freelance_proposals DROP COLUMN IF EXISTS updated_at;

ALTER TABLE freelance_contracts DROP CONSTRAINT IF EXISTS freelance_contracts_total_nonneg;
ALTER TABLE freelance_contracts ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2);
UPDATE freelance_contracts SET total_amount = total_amount_minor_units::NUMERIC / 100;
ALTER TABLE freelance_contracts ALTER COLUMN total_amount SET NOT NULL;
ALTER TABLE freelance_contracts DROP COLUMN IF EXISTS total_amount_minor_units;
ALTER TABLE freelance_contracts DROP COLUMN IF EXISTS currency;

-- Lifecycle vocabularies back to the 0032 values.
UPDATE freelance_projects SET status = 'open'        WHERE status IN ('draft', 'published', 'accepting_proposals');
UPDATE freelance_projects SET status = 'in_progress' WHERE status IN ('hired', 'active', 'disputed');
UPDATE freelance_projects SET status = 'completed'   WHERE status = 'cancelled';
ALTER TABLE freelance_projects DROP CONSTRAINT IF EXISTS freelance_projects_status_check;
ALTER TABLE freelance_projects DROP CONSTRAINT IF EXISTS freelance_projects_budget_type_check;
ALTER TABLE freelance_projects ALTER COLUMN status SET DEFAULT 'open';

UPDATE freelance_proposals SET status = 'submitted' WHERE status IN ('draft', 'viewed', 'shortlisted');
UPDATE freelance_proposals SET status = 'rejected'  WHERE status = 'withdrawn';
ALTER TABLE freelance_proposals DROP CONSTRAINT IF EXISTS freelance_proposals_status_check;
ALTER TABLE freelance_proposals ALTER COLUMN status SET DEFAULT 'submitted';

UPDATE freelance_contracts SET status = 'active'    WHERE status IN ('pending', 'in_progress', 'submitted', 'revision_requested', 'disputed');
ALTER TABLE freelance_contracts DROP CONSTRAINT IF EXISTS freelance_contracts_status_check;
ALTER TABLE freelance_contracts ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE freelancer_profiles DROP CONSTRAINT IF EXISTS freelancer_profiles_availability_check;

DROP INDEX IF EXISTS uq_freelance_proposals_live;
DROP INDEX IF EXISTS uq_freelance_contracts_proposal;

ALTER TABLE freelancer_profiles DROP CONSTRAINT IF EXISTS freelancer_profiles_user_fk;
ALTER TABLE freelance_projects  DROP CONSTRAINT IF EXISTS freelance_projects_client_fk;
ALTER TABLE freelance_proposals DROP CONSTRAINT IF EXISTS freelance_proposals_freelancer_fk;
ALTER TABLE freelance_contracts DROP CONSTRAINT IF EXISTS freelance_contracts_client_fk;
ALTER TABLE freelance_contracts DROP CONSTRAINT IF EXISTS freelance_contracts_freelancer_fk;

ALTER INDEX IF EXISTS idx_freelance_projects_client        RENAME TO idx_projects_client;
ALTER INDEX IF EXISTS idx_freelance_projects_status        RENAME TO idx_projects_status;
ALTER INDEX IF EXISTS idx_freelance_proposals_project      RENAME TO idx_proposals_project;
ALTER INDEX IF EXISTS idx_freelance_proposals_freelancer   RENAME TO idx_proposals_freelancer;
ALTER INDEX IF EXISTS idx_freelance_contracts_client       RENAME TO idx_contracts_client;
ALTER INDEX IF EXISTS idx_freelance_contracts_freelancer   RENAME TO idx_contracts_freelancer;
ALTER INDEX IF EXISTS idx_freelance_projects_skills_gin    RENAME TO idx_projects_skills_gin;
ALTER INDEX IF EXISTS idx_freelance_projects_status_created RENAME TO idx_projects_status_created;

ALTER TABLE IF EXISTS freelance_projects  RENAME TO projects;
ALTER TABLE IF EXISTS freelance_proposals RENAME TO proposals;
ALTER TABLE IF EXISTS freelance_contracts RENAME TO contracts;

DELETE FROM admin_role_permissions WHERE permission_id IN
    (SELECT id FROM admin_permissions WHERE code IN ('freelance.admin.read', 'freelance.admin.write'));
DELETE FROM admin_permissions WHERE code IN ('freelance.admin.read', 'freelance.admin.write');
