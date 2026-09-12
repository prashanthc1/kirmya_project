-- Freelance marketplace foundation.
--
-- Migration 0032 created the first four marketplace tables under the names
-- `projects`, `proposals` and `contracts`. Those names claim three of the most
-- generic nouns in the schema for one module, and nothing in them says which
-- module owns the row. This migration gives the module its own namespace and
-- builds the rest of the marketplace's schema on top of it.
--
-- Three things happen here, in order:
--
--   1. the three generically-named tables are renamed to freelance_*;
--   2. every monetary column moves from NUMERIC to integer minor units with an
--      explicit currency;
--   3. the remaining foundation tables are created.
--
-- Nothing outside internal/freelance reads the renamed tables - checked with a
-- repository-wide search for FROM/JOIN/INTO/UPDATE against each name - so the
-- rename is contained to one module's repository.

-- ---------------------------------------------------------------------------
-- 1. Namespace the module's existing tables.
-- ---------------------------------------------------------------------------
--
-- Renaming carries indexes, constraints and foreign keys with the table, so the
-- two indexes migration 0040 added on `projects` survive untouched. They are
-- renamed below only so their names keep matching the table they sit on.

ALTER TABLE IF EXISTS projects  RENAME TO freelance_projects;
ALTER TABLE IF EXISTS proposals RENAME TO freelance_proposals;
ALTER TABLE IF EXISTS contracts RENAME TO freelance_contracts;

ALTER INDEX IF EXISTS idx_projects_client       RENAME TO idx_freelance_projects_client;
ALTER INDEX IF EXISTS idx_projects_status       RENAME TO idx_freelance_projects_status;
ALTER INDEX IF EXISTS idx_proposals_project     RENAME TO idx_freelance_proposals_project;
ALTER INDEX IF EXISTS idx_proposals_freelancer  RENAME TO idx_freelance_proposals_freelancer;
ALTER INDEX IF EXISTS idx_contracts_client      RENAME TO idx_freelance_contracts_client;
ALTER INDEX IF EXISTS idx_contracts_freelancer  RENAME TO idx_freelance_contracts_freelancer;
ALTER INDEX IF EXISTS idx_projects_skills_gin   RENAME TO idx_freelance_projects_skills_gin;
ALTER INDEX IF EXISTS idx_projects_status_created RENAME TO idx_freelance_projects_status_created;

-- ---------------------------------------------------------------------------
-- 2. Money: integer minor units and an explicit currency.
-- ---------------------------------------------------------------------------
--
-- NUMERIC(10,2) is exact in PostgreSQL, but every Go struct in the module read
-- it into a float64, so the exactness ended at the driver. Rates were added and
-- compared in binary floating point, where 0.1 + 0.2 is not 0.3.
--
-- Minor units - fils for AED, cents for USD - is the convention billing already
-- uses (billing_plans.price_cents), so this is the repository's existing answer
-- rather than a new one. BIGINT rather than INT: INT tops out around 21m AED,
-- which is a plausible contract value.
--
-- The backfill is exact. NUMERIC(10,2) has at most two decimal places, so
-- multiplying by 100 lands on a whole number with nothing to round away; ROUND
-- is belt-and-braces against a value that somehow carried more.
--
-- Currency defaults to AED because that is the launch market. The column exists
-- from the first row so that adding a second currency later is a data change
-- rather than a schema migration across every money column in the module.

ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS hourly_rate_minor_units BIGINT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'AED';
UPDATE freelancer_profiles
   SET hourly_rate_minor_units = ROUND(hourly_rate * 100)::BIGINT
 WHERE hourly_rate_minor_units IS NULL;
ALTER TABLE freelancer_profiles ALTER COLUMN hourly_rate_minor_units SET DEFAULT 0;
UPDATE freelancer_profiles SET hourly_rate_minor_units = 0 WHERE hourly_rate_minor_units IS NULL;
ALTER TABLE freelancer_profiles ALTER COLUMN hourly_rate_minor_units SET NOT NULL;
ALTER TABLE freelancer_profiles DROP COLUMN IF EXISTS hourly_rate;

ALTER TABLE freelance_projects ADD COLUMN IF NOT EXISTS budget_minor_units BIGINT;
ALTER TABLE freelance_projects ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'AED';
UPDATE freelance_projects
   SET budget_minor_units = ROUND(budget * 100)::BIGINT
 WHERE budget_minor_units IS NULL;
ALTER TABLE freelance_projects ALTER COLUMN budget_minor_units SET DEFAULT 0;
UPDATE freelance_projects SET budget_minor_units = 0 WHERE budget_minor_units IS NULL;
ALTER TABLE freelance_projects ALTER COLUMN budget_minor_units SET NOT NULL;
ALTER TABLE freelance_projects DROP COLUMN IF EXISTS budget;

ALTER TABLE freelance_proposals ADD COLUMN IF NOT EXISTS bid_amount_minor_units BIGINT;
ALTER TABLE freelance_proposals ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'AED';
UPDATE freelance_proposals
   SET bid_amount_minor_units = ROUND(bid_amount * 100)::BIGINT
 WHERE bid_amount_minor_units IS NULL;
ALTER TABLE freelance_proposals ALTER COLUMN bid_amount_minor_units SET DEFAULT 0;
UPDATE freelance_proposals SET bid_amount_minor_units = 0 WHERE bid_amount_minor_units IS NULL;
ALTER TABLE freelance_proposals ALTER COLUMN bid_amount_minor_units SET NOT NULL;
ALTER TABLE freelance_proposals DROP COLUMN IF EXISTS bid_amount;

ALTER TABLE freelance_contracts ADD COLUMN IF NOT EXISTS total_amount_minor_units BIGINT;
ALTER TABLE freelance_contracts ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'AED';
UPDATE freelance_contracts
   SET total_amount_minor_units = ROUND(total_amount * 100)::BIGINT
 WHERE total_amount_minor_units IS NULL;
ALTER TABLE freelance_contracts ALTER COLUMN total_amount_minor_units SET DEFAULT 0;
UPDATE freelance_contracts SET total_amount_minor_units = 0 WHERE total_amount_minor_units IS NULL;
ALTER TABLE freelance_contracts ALTER COLUMN total_amount_minor_units SET NOT NULL;
ALTER TABLE freelance_contracts DROP COLUMN IF EXISTS total_amount;

-- Money is never negative anywhere in this module. A negative bid or budget is
-- a bug in a caller, and the database is the last place that can still say so.
ALTER TABLE freelancer_profiles DROP CONSTRAINT IF EXISTS freelancer_profiles_rate_nonneg;
ALTER TABLE freelancer_profiles ADD CONSTRAINT freelancer_profiles_rate_nonneg
    CHECK (hourly_rate_minor_units >= 0);
ALTER TABLE freelance_projects DROP CONSTRAINT IF EXISTS freelance_projects_budget_nonneg;
ALTER TABLE freelance_projects ADD CONSTRAINT freelance_projects_budget_nonneg
    CHECK (budget_minor_units >= 0);
ALTER TABLE freelance_proposals DROP CONSTRAINT IF EXISTS freelance_proposals_bid_nonneg;
ALTER TABLE freelance_proposals ADD CONSTRAINT freelance_proposals_bid_nonneg
    CHECK (bid_amount_minor_units >= 0);
ALTER TABLE freelance_contracts DROP CONSTRAINT IF EXISTS freelance_contracts_total_nonneg;
ALTER TABLE freelance_contracts ADD CONSTRAINT freelance_contracts_total_nonneg
    CHECK (total_amount_minor_units >= 0);

-- ---------------------------------------------------------------------------
-- 3. Lifecycle vocabularies.
-- ---------------------------------------------------------------------------
--
-- 0032 wrote the states in a trailing comment and enforced none of them, so a
-- typo in a status string was stored and read back as a state no code handles.
-- Each of the three now carries a CHECK, and the existing values are mapped
-- onto the fuller vocabulary first.
--
-- The mapping is the only judgement call here:
--
--   project  'open'        -> 'accepting_proposals'  (what 'open' meant)
--            'in_progress' -> 'active'               (work underway, post-hire)
--   contract 'active' stays 'active'; the finer states are new and no existing
--            row can be in one.
--
-- Projects now start as 'draft'. 0032 defaulted them to 'open', which made
-- posting a project and publishing it the same irreversible act - there was no
-- state in which a client could write a project down before showing it to
-- anyone.

UPDATE freelance_projects SET status = 'accepting_proposals' WHERE status = 'open';
UPDATE freelance_projects SET status = 'active'              WHERE status = 'in_progress';

ALTER TABLE freelance_projects ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE freelance_projects DROP CONSTRAINT IF EXISTS freelance_projects_status_check;
ALTER TABLE freelance_projects ADD CONSTRAINT freelance_projects_status_check
    CHECK (status IN ('draft', 'published', 'accepting_proposals', 'hired',
                      'active', 'completed', 'cancelled', 'disputed'));

ALTER TABLE freelance_proposals ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE freelance_proposals DROP CONSTRAINT IF EXISTS freelance_proposals_status_check;
ALTER TABLE freelance_proposals ADD CONSTRAINT freelance_proposals_status_check
    CHECK (status IN ('draft', 'submitted', 'viewed', 'shortlisted',
                      'accepted', 'rejected', 'withdrawn'));

ALTER TABLE freelance_contracts ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE freelance_contracts DROP CONSTRAINT IF EXISTS freelance_contracts_status_check;
ALTER TABLE freelance_contracts ADD CONSTRAINT freelance_contracts_status_check
    CHECK (status IN ('pending', 'active', 'in_progress', 'submitted',
                      'revision_requested', 'completed', 'cancelled', 'disputed'));

ALTER TABLE freelance_projects DROP CONSTRAINT IF EXISTS freelance_projects_budget_type_check;
ALTER TABLE freelance_projects ADD CONSTRAINT freelance_projects_budget_type_check
    CHECK (budget_type IN ('fixed', 'hourly'));

ALTER TABLE freelancer_profiles DROP CONSTRAINT IF EXISTS freelancer_profiles_availability_check;
ALTER TABLE freelancer_profiles ADD CONSTRAINT freelancer_profiles_availability_check
    CHECK (availability_status IN ('available', 'busy', 'unavailable'));

-- ---------------------------------------------------------------------------
-- 4. Ownership integrity.
-- ---------------------------------------------------------------------------
--
-- 0032 declared client_id, freelancer_id and user_id as bare UUIDs with no
-- reference, so a project could outlive the account that posted it and a
-- proposal could name a freelancer who never existed. Every read path in the
-- module joins or filters on a live user, so such a row is already unreachable
-- by the product - it is invisible debris, not data anyone can see.
--
-- The orphan sweep below deletes exactly that debris, and only it, so the
-- foreign keys can be added and validated rather than left NOT VALID (which
-- would enforce nothing for the rows that are already wrong).

DELETE FROM freelance_contracts
 WHERE client_id     NOT IN (SELECT id FROM users)
    OR freelancer_id NOT IN (SELECT id FROM users);
DELETE FROM freelance_proposals
 WHERE freelancer_id NOT IN (SELECT id FROM users);
DELETE FROM freelance_projects
 WHERE client_id     NOT IN (SELECT id FROM users);
DELETE FROM freelancer_profiles
 WHERE user_id       NOT IN (SELECT id FROM users);

-- ON DELETE CASCADE throughout: a marketplace row is meaningless without the
-- account on either side of it, and Kirmya deletes an account by deleting the
-- row (see 0008). A contract kept after both parties are gone would be a
-- record nobody can read and nobody can act on.
ALTER TABLE freelancer_profiles DROP CONSTRAINT IF EXISTS freelancer_profiles_user_fk;
ALTER TABLE freelancer_profiles ADD CONSTRAINT freelancer_profiles_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE freelance_projects DROP CONSTRAINT IF EXISTS freelance_projects_client_fk;
ALTER TABLE freelance_projects ADD CONSTRAINT freelance_projects_client_fk
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE freelance_proposals DROP CONSTRAINT IF EXISTS freelance_proposals_freelancer_fk;
ALTER TABLE freelance_proposals ADD CONSTRAINT freelance_proposals_freelancer_fk
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE freelance_contracts DROP CONSTRAINT IF EXISTS freelance_contracts_client_fk;
ALTER TABLE freelance_contracts ADD CONSTRAINT freelance_contracts_client_fk
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE freelance_contracts DROP CONSTRAINT IF EXISTS freelance_contracts_freelancer_fk;
ALTER TABLE freelance_contracts ADD CONSTRAINT freelance_contracts_freelancer_fk
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE;

-- One live proposal per freelancer per project. Without this a freelancer could
-- bid on the same project repeatedly and flood the client's inbox; withdrawn
-- and rejected proposals are excluded so that a second attempt after a genuine
-- withdrawal is still possible.
CREATE UNIQUE INDEX IF NOT EXISTS uq_freelance_proposals_live
    ON freelance_proposals (project_id, freelancer_id)
    WHERE status NOT IN ('withdrawn', 'rejected');

-- A proposal can only ever produce one contract.
CREATE UNIQUE INDEX IF NOT EXISTS uq_freelance_contracts_proposal
    ON freelance_contracts (proposal_id)
    WHERE proposal_id IS NOT NULL;

-- updated_at exists on proposals nowhere in 0032, so a modified proposal
-- carried only its creation time.
ALTER TABLE freelance_proposals
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 5. The rest of the foundation.
-- ---------------------------------------------------------------------------
--
-- These tables carry no rows yet and no endpoint writes them in this change.
-- They exist now so that the shape of the marketplace is settled in one
-- reviewable migration rather than accreting a table at a time alongside the
-- feature that needed it, which is how the first four ended up without a single
-- foreign key between them.
--
-- Conventions, applied uniformly below:
--   * every money column is <name>_minor_units BIGINT with a sibling currency;
--   * every lifecycle column carries a CHECK listing its states;
--   * every owning reference is a real FOREIGN KEY;
--   * timestamps are TIMESTAMPTZ, defaulted server-side.

-- Portfolio. freelancer_profiles.portfolio_links was a JSONB array, which
-- cannot be indexed per item, ordered, or referenced by a review. The JSONB is
-- migrated into rows below and then dropped: one representation, not two.
CREATE TABLE IF NOT EXISTS freelance_portfolio_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id   UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    title        VARCHAR(200) NOT NULL,
    url          TEXT,
    description  TEXT,
    position     INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_portfolio_items_title_len CHECK (char_length(trim(title)) > 0)
);
CREATE INDEX IF NOT EXISTS idx_freelance_portfolio_items_profile
    ON freelance_portfolio_items (profile_id, position);

INSERT INTO freelance_portfolio_items (profile_id, title, url, position)
SELECT p.id,
       left(coalesce(nullif(trim(item->>'title'), ''), 'Untitled'), 200),
       item->>'url',
       (ord - 1)::int
  FROM freelancer_profiles p
  CROSS JOIN LATERAL jsonb_array_elements(
       CASE WHEN jsonb_typeof(p.portfolio_links) = 'array'
            THEN p.portfolio_links ELSE '[]'::jsonb END) WITH ORDINALITY AS t(item, ord)
 WHERE NOT EXISTS (SELECT 1 FROM freelance_portfolio_items e WHERE e.profile_id = p.id);

ALTER TABLE freelancer_profiles DROP COLUMN IF EXISTS portfolio_links;

-- Project skills. skills_required was likewise a JSONB array; a normalized row
-- is what makes "projects needing Go" an index lookup rather than a scan.
CREATE TABLE IF NOT EXISTS freelance_project_skills (
    project_id UUID NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
    skill      VARCHAR(80) NOT NULL,
    PRIMARY KEY (project_id, skill),
    CONSTRAINT freelance_project_skills_len CHECK (char_length(trim(skill)) > 0)
);
CREATE INDEX IF NOT EXISTS idx_freelance_project_skills_skill
    ON freelance_project_skills (skill);

INSERT INTO freelance_project_skills (project_id, skill)
SELECT DISTINCT pr.id, left(trim(s.value #>> '{}'), 80)
  FROM freelance_projects pr
  CROSS JOIN LATERAL jsonb_array_elements(
       CASE WHEN jsonb_typeof(pr.skills_required) = 'array'
            THEN pr.skills_required ELSE '[]'::jsonb END) AS s(value)
 WHERE char_length(trim(s.value #>> '{}')) > 0
ON CONFLICT DO NOTHING;

ALTER TABLE freelance_projects DROP COLUMN IF EXISTS skills_required;

-- Milestones proposed as part of a bid. Sum is validated in the service layer
-- against the proposal's bid; storing the total here as well would be a derived
-- value that can drift from its own rows.
CREATE TABLE IF NOT EXISTS freelance_proposal_milestones (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id        UUID NOT NULL REFERENCES freelance_proposals(id) ON DELETE CASCADE,
    position           INT NOT NULL DEFAULT 0,
    title              VARCHAR(200) NOT NULL,
    description        TEXT,
    amount_minor_units BIGINT NOT NULL DEFAULT 0,
    currency           CHAR(3) NOT NULL DEFAULT 'AED',
    due_at             TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_proposal_milestones_amount_nonneg CHECK (amount_minor_units >= 0)
);
CREATE INDEX IF NOT EXISTS idx_freelance_proposal_milestones_proposal
    ON freelance_proposal_milestones (proposal_id, position);

-- Productised services a freelancer sells directly, as opposed to bidding.
CREATE TABLE IF NOT EXISTS freelance_services (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(200) NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    category      VARCHAR(80),
    status        VARCHAR(32) NOT NULL DEFAULT 'draft',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_services_status_check
        CHECK (status IN ('draft', 'published', 'paused', 'archived')),
    CONSTRAINT freelance_services_title_len CHECK (char_length(trim(title)) > 0)
);
CREATE INDEX IF NOT EXISTS idx_freelance_services_freelancer ON freelance_services (freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelance_services_discovery
    ON freelance_services (status, category, created_at DESC);

CREATE TABLE IF NOT EXISTS freelance_service_packages (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id         UUID NOT NULL REFERENCES freelance_services(id) ON DELETE CASCADE,
    tier               VARCHAR(16) NOT NULL,
    title              VARCHAR(200) NOT NULL,
    description        TEXT,
    price_minor_units  BIGINT NOT NULL DEFAULT 0,
    currency           CHAR(3) NOT NULL DEFAULT 'AED',
    delivery_days      INT NOT NULL DEFAULT 1,
    revisions          INT NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (service_id, tier),
    CONSTRAINT freelance_service_packages_tier_check CHECK (tier IN ('basic', 'standard', 'premium')),
    CONSTRAINT freelance_service_packages_price_nonneg CHECK (price_minor_units >= 0),
    CONSTRAINT freelance_service_packages_delivery_pos CHECK (delivery_days > 0),
    CONSTRAINT freelance_service_packages_revisions_nonneg CHECK (revisions >= 0)
);

-- Contract milestones. Separate from proposal milestones on purpose: the
-- proposal's are an offer and stop changing once accepted, these are the live
-- schedule of work and money.
CREATE TABLE IF NOT EXISTS freelance_contract_milestones (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id        UUID NOT NULL REFERENCES freelance_contracts(id) ON DELETE CASCADE,
    position           INT NOT NULL DEFAULT 0,
    title              VARCHAR(200) NOT NULL,
    description        TEXT,
    amount_minor_units BIGINT NOT NULL DEFAULT 0,
    currency           CHAR(3) NOT NULL DEFAULT 'AED',
    status             VARCHAR(32) NOT NULL DEFAULT 'pending',
    due_at             TIMESTAMPTZ,
    completed_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_contract_milestones_status_check
        CHECK (status IN ('pending', 'funded', 'in_progress', 'submitted',
                          'approved', 'released', 'cancelled', 'disputed')),
    CONSTRAINT freelance_contract_milestones_amount_nonneg CHECK (amount_minor_units >= 0)
);
CREATE INDEX IF NOT EXISTS idx_freelance_contract_milestones_contract
    ON freelance_contract_milestones (contract_id, position);

-- A submission of work against a contract, optionally against one milestone.
CREATE TABLE IF NOT EXISTS freelance_deliveries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id  UUID NOT NULL REFERENCES freelance_contracts(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES freelance_contract_milestones(id) ON DELETE SET NULL,
    submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    summary      TEXT NOT NULL DEFAULT '',
    attachments  JSONB NOT NULL DEFAULT '[]'::jsonb,
    status       VARCHAR(32) NOT NULL DEFAULT 'submitted',
    reviewed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_deliveries_status_check
        CHECK (status IN ('submitted', 'accepted', 'revision_requested', 'rejected'))
);
CREATE INDEX IF NOT EXISTS idx_freelance_deliveries_contract
    ON freelance_deliveries (contract_id, created_at DESC);

-- Money movement. Both tables are schema only: no payment provider is wired up
-- in this change, and nothing writes them. They exist so that the contract and
-- milestone tables above can be referenced by the payment work when it starts,
-- rather than that work reshaping tables that already hold rows.
--
-- provider and provider_reference are deliberately nullable and carry no
-- provider-specific columns: the choice of processor is not made yet, and
-- modelling one processor's fields into the schema would have to be undone.
CREATE TABLE IF NOT EXISTS freelance_payment_intents (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id        UUID NOT NULL REFERENCES freelance_contracts(id) ON DELETE CASCADE,
    milestone_id       UUID REFERENCES freelance_contract_milestones(id) ON DELETE SET NULL,
    payer_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_minor_units BIGINT NOT NULL,
    currency           CHAR(3) NOT NULL DEFAULT 'AED',
    status             VARCHAR(32) NOT NULL DEFAULT 'requires_payment',
    provider           VARCHAR(50),
    provider_reference VARCHAR(255),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_payment_intents_status_check
        CHECK (status IN ('requires_payment', 'processing', 'held_in_escrow',
                          'released', 'refunded', 'failed', 'cancelled')),
    CONSTRAINT freelance_payment_intents_amount_pos CHECK (amount_minor_units > 0)
);
CREATE INDEX IF NOT EXISTS idx_freelance_payment_intents_contract
    ON freelance_payment_intents (contract_id, created_at DESC);
-- A processor reference identifies one intent or it identifies nothing; a
-- duplicate here is a double-charge waiting to be reconciled by hand.
CREATE UNIQUE INDEX IF NOT EXISTS uq_freelance_payment_intents_provider_ref
    ON freelance_payment_intents (provider, provider_reference)
    WHERE provider IS NOT NULL AND provider_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS freelance_payouts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id        UUID REFERENCES freelance_contracts(id) ON DELETE SET NULL,
    payee_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_minor_units BIGINT NOT NULL,
    currency           CHAR(3) NOT NULL DEFAULT 'AED',
    status             VARCHAR(32) NOT NULL DEFAULT 'pending',
    provider           VARCHAR(50),
    provider_reference VARCHAR(255),
    paid_at            TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_payouts_status_check
        CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    CONSTRAINT freelance_payouts_amount_pos CHECK (amount_minor_units > 0)
);
CREATE INDEX IF NOT EXISTS idx_freelance_payouts_payee
    ON freelance_payouts (payee_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_freelance_payouts_provider_ref
    ON freelance_payouts (provider, provider_reference)
    WHERE provider IS NOT NULL AND provider_reference IS NOT NULL;

-- Reviews. One review per author per contract, enforced by the primary-key-like
-- unique constraint rather than by the service alone.
CREATE TABLE IF NOT EXISTS freelance_reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES freelance_contracts(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL,
    comment     TEXT NOT NULL DEFAULT '',
    is_public   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (contract_id, author_id),
    CONSTRAINT freelance_reviews_rating_range CHECK (rating BETWEEN 1 AND 5),
    -- Reviewing yourself is not a rating, it is an advertisement.
    CONSTRAINT freelance_reviews_not_self CHECK (author_id <> subject_id)
);
CREATE INDEX IF NOT EXISTS idx_freelance_reviews_subject
    ON freelance_reviews (subject_id, created_at DESC) WHERE is_public;

-- Disputes. One open dispute per contract: a second concurrent dispute over the
-- same contract has no meaning, and the partial unique index says so rather
-- than leaving it to whichever handler checks first.
CREATE TABLE IF NOT EXISTS freelance_disputes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id   UUID NOT NULL REFERENCES freelance_contracts(id) ON DELETE CASCADE,
    milestone_id  UUID REFERENCES freelance_contract_milestones(id) ON DELETE SET NULL,
    raised_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason        VARCHAR(80) NOT NULL,
    detail        TEXT NOT NULL DEFAULT '',
    status        VARCHAR(32) NOT NULL DEFAULT 'open',
    resolution    TEXT,
    resolved_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_disputes_status_check
        CHECK (status IN ('open', 'under_review', 'awaiting_evidence',
                          'resolved', 'withdrawn', 'escalated')),
    -- A resolved dispute without a recorded decision is an unauditable outcome.
    CONSTRAINT freelance_disputes_resolution_present
        CHECK (status <> 'resolved' OR (resolved_at IS NOT NULL AND resolution IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_freelance_disputes_open_per_contract
    ON freelance_disputes (contract_id)
    WHERE status IN ('open', 'under_review', 'awaiting_evidence', 'escalated');
CREATE INDEX IF NOT EXISTS idx_freelance_disputes_status
    ON freelance_disputes (status, created_at DESC);

CREATE TABLE IF NOT EXISTS freelance_dispute_evidence (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id  UUID NOT NULL REFERENCES freelance_disputes(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        VARCHAR(32) NOT NULL DEFAULT 'note',
    body        TEXT NOT NULL DEFAULT '',
    file_url    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_dispute_evidence_kind_check
        CHECK (kind IN ('note', 'file', 'link', 'message_reference'))
);
CREATE INDEX IF NOT EXISTS idx_freelance_dispute_evidence_dispute
    ON freelance_dispute_evidence (dispute_id, created_at);

-- Freelancer verification, separate from the platform-wide verification module
-- because what is being verified here is a trading identity - the right to be
-- paid for work - not a profile badge.
CREATE TABLE IF NOT EXISTS freelance_verification_records (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    kind          VARCHAR(40) NOT NULL,
    status        VARCHAR(32) NOT NULL DEFAULT 'pending',
    reference     VARCHAR(255),
    notes         TEXT,
    reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at   TIMESTAMPTZ,
    expires_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT freelance_verification_records_kind_check
        CHECK (kind IN ('identity', 'address', 'tax', 'bank_account', 'skill_assessment')),
    CONSTRAINT freelance_verification_records_status_check
        CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'expired'))
);
-- One live record per kind per profile; a rejected or expired one may be retried.
CREATE UNIQUE INDEX IF NOT EXISTS uq_freelance_verification_live
    ON freelance_verification_records (profile_id, kind)
    WHERE status IN ('pending', 'in_review', 'approved');

-- Saved freelancers, projects and services. One row per (user, target), which
-- is what makes "favourite" idempotent.
CREATE TABLE IF NOT EXISTS freelance_favorites (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id   UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, target_type, target_id),
    CONSTRAINT freelance_favorites_target_check
        CHECK (target_type IN ('project', 'service', 'freelancer'))
);
-- target_id is polymorphic and therefore carries no foreign key. The service
-- layer resolves the target before inserting, and a favourite pointing at a
-- deleted row is a dangling bookmark rather than a corrupt contract - the read
-- path joins and drops it.
CREATE INDEX IF NOT EXISTS idx_freelance_favorites_target
    ON freelance_favorites (target_type, target_id);

-- ---------------------------------------------------------------------------
-- 6. Administrative permissions for the module.
-- ---------------------------------------------------------------------------
--
-- Two codes, matching internal/admin/domain/rbac.go, which is the canonical
-- vocabulary; TestAdminRBACSeedMatchesTheCode compares this seed against it.
--
-- These are the only *administrative* freelance permissions. The per-user
-- freelance permissions (freelance.project.create and friends) are not admin
-- permissions and deliberately do not appear here - they are ownership rules
-- enforced in the module's service layer, and putting them in admin_permissions
-- would mean an administrator could be granted "create a project as somebody
-- else", which is not a thing the product does.
INSERT INTO admin_permissions (id, code, category, description) VALUES
    (gen_random_uuid(), 'freelance.admin.read',  'freelance', 'View freelance marketplace records across accounts'),
    (gen_random_uuid(), 'freelance.admin.write', 'freelance', 'Act on freelance marketplace records, including dispute decisions')
ON CONFLICT (code) DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'super_admin'
  AND p.code IN ('freelance.admin.read', 'freelance.admin.write')
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'platform_admin'
  AND p.code IN ('freelance.admin.read', 'freelance.admin.write')
ON CONFLICT DO NOTHING;

-- read_only_admin is derived from '%.read' everywhere else in the seed.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'read_only_admin'
  AND p.code = 'freelance.admin.read'
ON CONFLICT DO NOTHING;

-- The desk that already rules on abuse reports is the desk that takes a
-- fraudulent project off the marketplace; user_admin gets the read side, so it
-- can answer an account question without being able to remove a posting.
--
-- These two role grants must match rolePermissions in
-- internal/admin/domain/rbac.go exactly: TestAdminRBACSeedMatchesTheCode
-- compares the seed against the code role by role.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'trust_safety_admin'
  AND p.code IN ('freelance.admin.read', 'freelance.admin.write')
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.code = 'user_admin'
  AND p.code = 'freelance.admin.read'
ON CONFLICT DO NOTHING;
