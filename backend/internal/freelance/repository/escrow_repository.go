package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"kirmya/internal/freelance/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// The escrow persistence: contract milestones, the payment intents that fund
// them, the deliveries submitted against them, and the payouts their release
// creates.
//
// Every write that moves money or a milestone's state is one transaction, and
// every state change is a guarded UPDATE ... WHERE status IN (...) rather than a
// blind assignment. The service has already checked the transition, but it
// checked a row it read earlier; the guard is what makes two concurrent
// requests - two approvals, a cancel racing a payment confirmation - resolve to
// one winner and one refusal instead of both succeeding.

// Refusals the escrow service maps onto responses.
var (
	ErrContractNotFound  = errors.New("contract not found")
	ErrMilestoneNotFound = errors.New("milestone not found")
	ErrIntentNotFound    = errors.New("payment intent not found")
	// ErrMilestoneExceedsContract: the new milestone would schedule more money
	// than the contract is worth.
	ErrMilestoneExceedsContract = errors.New("milestones would exceed the contract total")
	// ErrContractNotLive: the contract is completed or cancelled.
	ErrContractNotLive = errors.New("contract is no longer live")
	// ErrLiveIntentExists: the milestone already has a payment in flight or held.
	ErrLiveIntentExists = errors.New("a payment for this milestone is already in progress")
	// ErrStaleState: the row was not in the state the write required when the
	// write ran - somebody else moved it first.
	ErrStaleState = errors.New("the record changed state before this request could be applied")
)

// EscrowRepository is the escrow half of the module's persistence boundary.
type EscrowRepository interface {
	GetContractByID(ctx context.Context, id uuid.UUID) (*domain.Contract, error)
	ListContractMilestones(ctx context.Context, contractID uuid.UUID) ([]domain.ContractMilestone, error)
	GetContractMilestone(ctx context.Context, id uuid.UUID) (*domain.ContractMilestone, error)

	// CreateContractMilestone appends a milestone, refusing one that would take
	// the contract's live milestones past its total.
	CreateContractMilestone(ctx context.Context, m *domain.ContractMilestone) error
	// CancelPendingMilestone cancels an unfunded milestone that has no payment
	// in flight.
	CancelPendingMilestone(ctx context.Context, milestoneID uuid.UUID) error

	// CreatePaymentIntent records a request to fund a pending milestone. At most
	// one live intent may exist per milestone.
	CreatePaymentIntent(ctx context.Context, intent *domain.PaymentIntent) error
	// SetPaymentIntentReference stores the processor's handle on the charge.
	SetPaymentIntentReference(ctx context.Context, intentID uuid.UUID, provider, reference string) error
	// FailPaymentIntent marks an intent failed before the processor held any
	// money - used when asking the processor for the charge itself failed.
	FailPaymentIntent(ctx context.Context, intentID uuid.UUID) error

	// ConfirmPaymentHeld applies a verified "the money is held" from the
	// processor: the intent moves to held_in_escrow, its milestone to funded,
	// and the contract and project to active if this is their first funding.
	// Idempotent: a repeated webhook for an intent already held changes nothing
	// and reports AlreadyApplied.
	ConfirmPaymentHeld(ctx context.Context, provider, reference string) (*FundingOutcome, error)
	// MarkPaymentFailed applies a verified "the charge failed". Idempotent.
	MarkPaymentFailed(ctx context.Context, provider, reference string) (*domain.PaymentIntent, bool, error)

	// SubmitMilestone records a delivery and moves the milestone to submitted.
	SubmitMilestone(ctx context.Context, milestoneID uuid.UUID, delivery *domain.Delivery) error
	// RequestMilestoneRevision sends a submitted milestone back to work.
	RequestMilestoneRevision(ctx context.Context, milestoneID uuid.UUID) error
	// ReleaseMilestone approves a submitted milestone and releases its escrow:
	// the milestone and its intent move to released, the latest delivery to
	// accepted, and a pending payout is recorded for the freelancer. When that
	// was the last open milestone of a fully scheduled contract, the contract
	// and its project complete.
	ReleaseMilestone(ctx context.Context, milestoneID uuid.UUID, payout *domain.Payout) (*ReleaseOutcome, error)
}

// FundingOutcome is what ConfirmPaymentHeld changed.
type FundingOutcome struct {
	Intent    domain.PaymentIntent
	Milestone domain.ContractMilestone
	// AlreadyApplied is true when the intent was already held: a repeated
	// webhook, answered without writing anything.
	AlreadyApplied bool
	// ContractActivated is true when this funding started the contract.
	ContractActivated bool
}

// ReleaseOutcome is what ReleaseMilestone changed.
type ReleaseOutcome struct {
	Milestone         domain.ContractMilestone
	Payout            domain.Payout
	ContractCompleted bool
}

// escrowMemory is the no-database store the unit tests run against, alongside
// the maps the rest of the repository keeps for the same purpose.
type escrowMemory struct {
	milestones map[uuid.UUID]*domain.ContractMilestone
	intents    map[uuid.UUID]*domain.PaymentIntent
	deliveries map[uuid.UUID]*domain.Delivery
	payouts    map[uuid.UUID]*domain.Payout
}

func (r *pgxFreelanceRepository) mem() *escrowMemory {
	// Called with r.mu held.
	if r.escrow == nil {
		r.escrow = &escrowMemory{
			milestones: map[uuid.UUID]*domain.ContractMilestone{},
			intents:    map[uuid.UUID]*domain.PaymentIntent{},
			deliveries: map[uuid.UUID]*domain.Delivery{},
			payouts:    map[uuid.UUID]*domain.Payout{},
		}
	}
	return r.escrow
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

func (r *pgxFreelanceRepository) GetContractByID(ctx context.Context, id uuid.UUID) (*domain.Contract, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		c, ok := r.contracts[id]
		if !ok {
			return nil, ErrContractNotFound
		}
		copied := *c
		return &copied, nil
	}

	c, err := scanContract(r.pool.QueryRow(ctx,
		`SELECT `+contractColumns+` FROM freelance_contracts WHERE id = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrContractNotFound
	}
	if err != nil {
		return nil, err
	}
	// The project title is part of the contract as a party sees it.
	_ = r.pool.QueryRow(ctx, `SELECT title FROM freelance_projects WHERE id = $1`, c.ProjectID).Scan(&c.ProjectTitle)
	return c, nil
}

const milestoneColumns = `id, contract_id, position, title, COALESCE(description, ''),
	amount_minor_units, currency, status, due_at, completed_at, created_at, updated_at`

func scanMilestone(row pgx.Row) (*domain.ContractMilestone, error) {
	m := &domain.ContractMilestone{}
	var amount int64
	var status string
	if err := row.Scan(&m.ID, &m.ContractID, &m.Position, &m.Title, &m.Description,
		&amount, &m.Currency, &status, &m.DueAt, &m.CompletedAt, &m.CreatedAt, &m.UpdatedAt); err != nil {
		return nil, err
	}
	m.Amount = domain.Amount(amount)
	m.Status = domain.MilestoneStatus(status)
	return m, nil
}

func (r *pgxFreelanceRepository) ListContractMilestones(ctx context.Context, contractID uuid.UUID) ([]domain.ContractMilestone, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		list := []domain.ContractMilestone{}
		for _, m := range r.mem().milestones {
			if m.ContractID == contractID {
				list = append(list, *m)
			}
		}
		sortMilestones(list)
		return list, nil
	}

	rows, err := r.pool.Query(ctx,
		`SELECT `+milestoneColumns+` FROM freelance_contract_milestones
		  WHERE contract_id = $1 ORDER BY position, created_at`, contractID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []domain.ContractMilestone{}
	for rows.Next() {
		m, scanErr := scanMilestone(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		list = append(list, *m)
	}
	return list, rows.Err()
}

func (r *pgxFreelanceRepository) GetContractMilestone(ctx context.Context, id uuid.UUID) (*domain.ContractMilestone, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		m, ok := r.mem().milestones[id]
		if !ok {
			return nil, ErrMilestoneNotFound
		}
		copied := *m
		return &copied, nil
	}

	m, err := scanMilestone(r.pool.QueryRow(ctx,
		`SELECT `+milestoneColumns+` FROM freelance_contract_milestones WHERE id = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMilestoneNotFound
	}
	return m, err
}

func sortMilestones(list []domain.ContractMilestone) {
	for i := 1; i < len(list); i++ {
		for j := i; j > 0 && list[j].Position < list[j-1].Position; j-- {
			list[j], list[j-1] = list[j-1], list[j]
		}
	}
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

func (r *pgxFreelanceRepository) CreateContractMilestone(ctx context.Context, m *domain.ContractMilestone) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	now := time.Now().UTC()
	m.CreatedAt, m.UpdatedAt = now, now
	m.Status = domain.MilestonePending

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		c, ok := r.contracts[m.ContractID]
		if !ok {
			return ErrContractNotFound
		}
		if c.Status.IsTerminal() {
			return ErrContractNotLive
		}
		var allocated domain.Amount
		position := 0
		for _, existing := range r.mem().milestones {
			if existing.ContractID != m.ContractID {
				continue
			}
			if existing.Position >= position {
				position = existing.Position + 1
			}
			if existing.Status.CountsTowardsContract() {
				allocated += existing.Amount
			}
		}
		if allocated+m.Amount > c.TotalAmount {
			return ErrMilestoneExceedsContract
		}
		m.Position = position
		m.Currency = c.Currency
		stored := *m
		r.mem().milestones[m.ID] = &stored
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// The contract row is locked for the length of the check, so two milestones
	// added at once cannot each see the other's share as unallocated.
	var total int64
	var currency, status string
	err = tx.QueryRow(ctx,
		`SELECT total_amount_minor_units, currency, status FROM freelance_contracts
		  WHERE id = $1 FOR UPDATE`, m.ContractID).Scan(&total, &currency, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrContractNotFound
	}
	if err != nil {
		return err
	}
	if domain.ContractStatus(status).IsTerminal() {
		return ErrContractNotLive
	}

	var allocated int64
	var nextPosition int
	if err := tx.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount_minor_units) FILTER (WHERE status <> 'cancelled'), 0),
		        COALESCE(MAX(position) + 1, 0)
		   FROM freelance_contract_milestones WHERE contract_id = $1`,
		m.ContractID).Scan(&allocated, &nextPosition); err != nil {
		return err
	}
	if allocated+int64(m.Amount) > total {
		return ErrMilestoneExceedsContract
	}
	m.Position = nextPosition
	m.Currency = currency

	if _, err := tx.Exec(ctx,
		`INSERT INTO freelance_contract_milestones
		   (id, contract_id, position, title, description, amount_minor_units, currency, status, due_at, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6, $7, $8, $9, $10, $11)`,
		m.ID, m.ContractID, m.Position, m.Title, m.Description, int64(m.Amount), m.Currency,
		string(m.Status), m.DueAt, m.CreatedAt, m.UpdatedAt); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *pgxFreelanceRepository) CancelPendingMilestone(ctx context.Context, milestoneID uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		m, ok := r.mem().milestones[milestoneID]
		if !ok {
			return ErrMilestoneNotFound
		}
		if m.Status != domain.MilestonePending || r.liveIntentLocked(milestoneID) != nil {
			return ErrStaleState
		}
		m.Status = domain.MilestoneCancelled
		m.UpdatedAt = time.Now().UTC()
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// Locked, then checked for a payment in flight. Without the lock a client
	// could cancel a milestone in the same instant the processor confirms its
	// payment, and the money would land against a cancelled step.
	var status string
	err = tx.QueryRow(ctx,
		`SELECT status FROM freelance_contract_milestones WHERE id = $1 FOR UPDATE`, milestoneID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrMilestoneNotFound
	}
	if err != nil {
		return err
	}
	if domain.MilestoneStatus(status) != domain.MilestonePending {
		return ErrStaleState
	}
	var live int
	if err := tx.QueryRow(ctx,
		`SELECT COUNT(*) FROM freelance_payment_intents
		  WHERE milestone_id = $1 AND status IN ('requires_payment', 'processing', 'held_in_escrow')`,
		milestoneID).Scan(&live); err != nil {
		return err
	}
	if live > 0 {
		return ErrLiveIntentExists
	}
	if _, err := tx.Exec(ctx,
		`UPDATE freelance_contract_milestones SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
		milestoneID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// liveIntentLocked returns the milestone's live intent in memory mode, if any.
// Called with r.mu held.
func (r *pgxFreelanceRepository) liveIntentLocked(milestoneID uuid.UUID) *domain.PaymentIntent {
	for _, intent := range r.mem().intents {
		if intent.MilestoneID != nil && *intent.MilestoneID == milestoneID && intent.Status.IsLive() {
			return intent
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// Funding
// ---------------------------------------------------------------------------

const intentColumns = `id, contract_id, milestone_id, payer_id, amount_minor_units, currency, status,
	COALESCE(provider, ''), COALESCE(provider_reference, ''), created_at, updated_at`

func scanIntent(row pgx.Row) (*domain.PaymentIntent, error) {
	p := &domain.PaymentIntent{}
	var amount int64
	var status string
	if err := row.Scan(&p.ID, &p.ContractID, &p.MilestoneID, &p.PayerID, &amount, &p.Currency, &status,
		&p.Provider, &p.ProviderReference, &p.CreatedAt, &p.UpdatedAt); err != nil {
		return nil, err
	}
	p.Amount = domain.Amount(amount)
	p.Status = domain.PaymentIntentStatus(status)
	return p, nil
}

func (r *pgxFreelanceRepository) CreatePaymentIntent(ctx context.Context, intent *domain.PaymentIntent) error {
	if intent.MilestoneID == nil {
		return fmt.Errorf("%w: a funding intent must name its milestone", domain.ErrValidation)
	}
	if intent.ID == uuid.Nil {
		intent.ID = uuid.New()
	}
	now := time.Now().UTC()
	intent.CreatedAt, intent.UpdatedAt = now, now
	intent.Status = domain.PaymentRequiresPayment

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		m, ok := r.mem().milestones[*intent.MilestoneID]
		if !ok {
			return ErrMilestoneNotFound
		}
		if m.Status != domain.MilestonePending {
			return ErrStaleState
		}
		if r.liveIntentLocked(m.ID) != nil {
			return ErrLiveIntentExists
		}
		stored := *intent
		r.mem().intents[intent.ID] = &stored
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var status string
	err = tx.QueryRow(ctx,
		`SELECT status FROM freelance_contract_milestones WHERE id = $1 FOR UPDATE`,
		*intent.MilestoneID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrMilestoneNotFound
	}
	if err != nil {
		return err
	}
	if domain.MilestoneStatus(status) != domain.MilestonePending {
		return ErrStaleState
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO freelance_payment_intents
		   (id, contract_id, milestone_id, payer_id, amount_minor_units, currency, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		intent.ID, intent.ContractID, intent.MilestoneID, intent.PayerID, int64(intent.Amount),
		intent.Currency, string(intent.Status), intent.CreatedAt, intent.UpdatedAt); err != nil {
		// uq_freelance_payment_intents_live_milestone: a second live intent.
		if isUniqueViolation(err) {
			return ErrLiveIntentExists
		}
		return err
	}
	return tx.Commit(ctx)
}

func (r *pgxFreelanceRepository) SetPaymentIntentReference(ctx context.Context, intentID uuid.UUID, provider, reference string) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		intent, ok := r.mem().intents[intentID]
		if !ok {
			return ErrIntentNotFound
		}
		intent.Provider, intent.ProviderReference = provider, reference
		intent.UpdatedAt = time.Now().UTC()
		return nil
	}

	tag, err := r.pool.Exec(ctx,
		`UPDATE freelance_payment_intents SET provider = $2, provider_reference = $3, updated_at = NOW()
		  WHERE id = $1`, intentID, provider, reference)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrIntentNotFound
	}
	return nil
}

func (r *pgxFreelanceRepository) FailPaymentIntent(ctx context.Context, intentID uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		intent, ok := r.mem().intents[intentID]
		if !ok {
			return ErrIntentNotFound
		}
		if intent.Status == domain.PaymentRequiresPayment || intent.Status == domain.PaymentProcessing {
			intent.Status = domain.PaymentFailed
			intent.UpdatedAt = time.Now().UTC()
		}
		return nil
	}

	_, err := r.pool.Exec(ctx,
		`UPDATE freelance_payment_intents SET status = 'failed', updated_at = NOW()
		  WHERE id = $1 AND status IN ('requires_payment', 'processing')`, intentID)
	return err
}

func (r *pgxFreelanceRepository) ConfirmPaymentHeld(ctx context.Context, provider, reference string) (*FundingOutcome, error) {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		intent := r.intentByReferenceLocked(provider, reference)
		if intent == nil {
			return nil, ErrIntentNotFound
		}
		m := r.mem().milestones[*intent.MilestoneID]
		if m == nil {
			return nil, ErrMilestoneNotFound
		}
		if intent.Status == domain.PaymentHeldInEscrow || intent.Status == domain.PaymentReleased {
			return &FundingOutcome{Intent: *intent, Milestone: *m, AlreadyApplied: true}, nil
		}
		if !intent.Status.CanTransitionTo(domain.PaymentHeldInEscrow) || m.Status != domain.MilestonePending {
			return nil, ErrStaleState
		}
		now := time.Now().UTC()
		intent.Status, intent.UpdatedAt = domain.PaymentHeldInEscrow, now
		m.Status, m.UpdatedAt = domain.MilestoneFunded, now
		outcome := &FundingOutcome{Intent: *intent, Milestone: *m}
		if c := r.contracts[m.ContractID]; c != nil && c.Status == domain.ContractPending {
			c.Status, c.UpdatedAt = domain.ContractActive, now
			outcome.ContractActivated = true
			if p := r.projects[c.ProjectID]; p != nil && p.Status == domain.ProjectHired {
				p.Status = domain.ProjectActive
			}
		}
		return outcome, nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	intent, err := scanIntent(tx.QueryRow(ctx,
		`SELECT `+intentColumns+` FROM freelance_payment_intents
		  WHERE provider = $1 AND provider_reference = $2 FOR UPDATE`, provider, reference))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrIntentNotFound
	}
	if err != nil {
		return nil, err
	}
	if intent.MilestoneID == nil {
		return nil, ErrMilestoneNotFound
	}
	m, err := scanMilestone(tx.QueryRow(ctx,
		`SELECT `+milestoneColumns+` FROM freelance_contract_milestones WHERE id = $1 FOR UPDATE`,
		*intent.MilestoneID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMilestoneNotFound
	}
	if err != nil {
		return nil, err
	}

	// A processor retries a webhook until it is acknowledged, so the same
	// confirmation arriving twice is normal and must not fund anything twice.
	if intent.Status == domain.PaymentHeldInEscrow || intent.Status == domain.PaymentReleased {
		return &FundingOutcome{Intent: *intent, Milestone: *m, AlreadyApplied: true}, nil
	}
	if !intent.Status.CanTransitionTo(domain.PaymentHeldInEscrow) || m.Status != domain.MilestonePending {
		return nil, ErrStaleState
	}

	if _, err := tx.Exec(ctx,
		`UPDATE freelance_payment_intents SET status = 'held_in_escrow', updated_at = NOW() WHERE id = $1`,
		intent.ID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx,
		`UPDATE freelance_contract_milestones SET status = 'funded', updated_at = NOW() WHERE id = $1`,
		m.ID); err != nil {
		return nil, err
	}
	intent.Status = domain.PaymentHeldInEscrow
	m.Status = domain.MilestoneFunded
	outcome := &FundingOutcome{Intent: *intent, Milestone: *m}

	// The first funded milestone is what starts the engagement.
	var projectID uuid.UUID
	err = tx.QueryRow(ctx,
		`UPDATE freelance_contracts SET status = 'active', updated_at = NOW()
		  WHERE id = $1 AND status = 'pending' RETURNING project_id`, m.ContractID).Scan(&projectID)
	switch {
	case err == nil:
		outcome.ContractActivated = true
		if _, err := tx.Exec(ctx,
			`UPDATE freelance_projects SET status = 'active', updated_at = NOW()
			  WHERE id = $1 AND status = 'hired'`, projectID); err != nil {
			return nil, err
		}
	case !errors.Is(err, pgx.ErrNoRows):
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return outcome, nil
}

// intentByReferenceLocked finds an intent in memory mode. Called with r.mu held.
func (r *pgxFreelanceRepository) intentByReferenceLocked(provider, reference string) *domain.PaymentIntent {
	for _, intent := range r.mem().intents {
		if intent.Provider == provider && intent.ProviderReference == reference {
			return intent
		}
	}
	return nil
}

func (r *pgxFreelanceRepository) MarkPaymentFailed(ctx context.Context, provider, reference string) (*domain.PaymentIntent, bool, error) {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		intent := r.intentByReferenceLocked(provider, reference)
		if intent == nil {
			return nil, false, ErrIntentNotFound
		}
		if intent.Status == domain.PaymentFailed {
			return intent, false, nil
		}
		if !intent.Status.CanTransitionTo(domain.PaymentFailed) {
			return nil, false, ErrStaleState
		}
		intent.Status, intent.UpdatedAt = domain.PaymentFailed, time.Now().UTC()
		copied := *intent
		return &copied, true, nil
	}

	intent, err := scanIntent(r.pool.QueryRow(ctx,
		`UPDATE freelance_payment_intents SET status = 'failed', updated_at = NOW()
		  WHERE provider = $1 AND provider_reference = $2 AND status IN ('requires_payment', 'processing')
		  RETURNING `+intentColumns, provider, reference))
	if err == nil {
		return intent, true, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, false, err
	}

	// Nothing moved. Either the intent is unknown, already failed (a repeated
	// webhook), or in a state a failure cannot reach - money already held.
	existing, err := scanIntent(r.pool.QueryRow(ctx,
		`SELECT `+intentColumns+` FROM freelance_payment_intents
		  WHERE provider = $1 AND provider_reference = $2`, provider, reference))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, false, ErrIntentNotFound
	}
	if err != nil {
		return nil, false, err
	}
	if existing.Status == domain.PaymentFailed {
		return existing, false, nil
	}
	return nil, false, ErrStaleState
}

// ---------------------------------------------------------------------------
// Delivery and release
// ---------------------------------------------------------------------------

func (r *pgxFreelanceRepository) SubmitMilestone(ctx context.Context, milestoneID uuid.UUID, delivery *domain.Delivery) error {
	if delivery.ID == uuid.Nil {
		delivery.ID = uuid.New()
	}
	now := time.Now().UTC()
	delivery.CreatedAt, delivery.UpdatedAt = now, now
	delivery.Status = domain.DeliverySubmitted
	delivery.MilestoneID = &milestoneID
	if delivery.Attachments == nil {
		delivery.Attachments = []string{}
	}

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		m, ok := r.mem().milestones[milestoneID]
		if !ok {
			return ErrMilestoneNotFound
		}
		if m.Status != domain.MilestoneFunded && m.Status != domain.MilestoneInProgress {
			return ErrStaleState
		}
		m.Status, m.UpdatedAt = domain.MilestoneSubmitted, now
		stored := *delivery
		r.mem().deliveries[delivery.ID] = &stored
		return nil
	}

	attachments, err := json.Marshal(delivery.Attachments)
	if err != nil {
		return err
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	tag, err := tx.Exec(ctx,
		`UPDATE freelance_contract_milestones SET status = 'submitted', updated_at = NOW()
		  WHERE id = $1 AND status IN ('funded', 'in_progress')`, milestoneID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrStaleState
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO freelance_deliveries
		   (id, contract_id, milestone_id, submitted_by, summary, attachments, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		delivery.ID, delivery.ContractID, milestoneID, delivery.SubmittedBy, delivery.Summary,
		attachments, string(delivery.Status), delivery.CreatedAt, delivery.UpdatedAt); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *pgxFreelanceRepository) RequestMilestoneRevision(ctx context.Context, milestoneID uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		m, ok := r.mem().milestones[milestoneID]
		if !ok {
			return ErrMilestoneNotFound
		}
		if m.Status != domain.MilestoneSubmitted {
			return ErrStaleState
		}
		now := time.Now().UTC()
		m.Status, m.UpdatedAt = domain.MilestoneInProgress, now
		if d := r.latestDeliveryLocked(milestoneID); d != nil {
			d.Status, d.ReviewedAt, d.UpdatedAt = domain.DeliveryRevisionRequested, &now, now
		}
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	tag, err := tx.Exec(ctx,
		`UPDATE freelance_contract_milestones SET status = 'in_progress', updated_at = NOW()
		  WHERE id = $1 AND status = 'submitted'`, milestoneID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrStaleState
	}
	if err := reviewLatestDelivery(ctx, tx, milestoneID, domain.DeliveryRevisionRequested); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// reviewLatestDelivery records the client's verdict on the submission under
// review, which is the newest one still marked submitted.
func reviewLatestDelivery(ctx context.Context, tx pgx.Tx, milestoneID uuid.UUID, verdict domain.DeliveryStatus) error {
	_, err := tx.Exec(ctx,
		`UPDATE freelance_deliveries SET status = $2, reviewed_at = NOW(), updated_at = NOW()
		  WHERE id = (SELECT id FROM freelance_deliveries
		               WHERE milestone_id = $1 AND status = 'submitted'
		               ORDER BY created_at DESC LIMIT 1)`, milestoneID, string(verdict))
	return err
}

// latestDeliveryLocked is reviewLatestDelivery's memory-mode lookup. Called with
// r.mu held.
func (r *pgxFreelanceRepository) latestDeliveryLocked(milestoneID uuid.UUID) *domain.Delivery {
	var latest *domain.Delivery
	for _, d := range r.mem().deliveries {
		if d.MilestoneID == nil || *d.MilestoneID != milestoneID || d.Status != domain.DeliverySubmitted {
			continue
		}
		if latest == nil || d.CreatedAt.After(latest.CreatedAt) {
			latest = d
		}
	}
	return latest
}

func (r *pgxFreelanceRepository) ReleaseMilestone(ctx context.Context, milestoneID uuid.UUID, payout *domain.Payout) (*ReleaseOutcome, error) {
	if payout.ID == uuid.Nil {
		payout.ID = uuid.New()
	}
	now := time.Now().UTC()
	payout.CreatedAt, payout.UpdatedAt = now, now
	payout.Status = domain.PayoutPending

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		m, ok := r.mem().milestones[milestoneID]
		if !ok {
			return nil, ErrMilestoneNotFound
		}
		intent := r.liveIntentLocked(milestoneID)
		if m.Status != domain.MilestoneSubmitted || intent == nil || intent.Status != domain.PaymentHeldInEscrow {
			return nil, ErrStaleState
		}
		m.Status, m.CompletedAt, m.UpdatedAt = domain.MilestoneReleased, &now, now
		intent.Status, intent.UpdatedAt = domain.PaymentReleased, now
		if d := r.latestDeliveryLocked(milestoneID); d != nil {
			d.Status, d.ReviewedAt, d.UpdatedAt = domain.DeliveryAccepted, &now, now
		}
		stored := *payout
		r.mem().payouts[payout.ID] = &stored

		outcome := &ReleaseOutcome{Milestone: *m, Payout: *payout}
		c := r.contracts[m.ContractID]
		if c != nil && c.Status == domain.ContractActive && r.contractFullyReleasedLocked(c) {
			c.Status, c.UpdatedAt = domain.ContractCompleted, now
			outcome.ContractCompleted = true
			if p := r.projects[c.ProjectID]; p != nil && p.Status == domain.ProjectActive {
				p.Status = domain.ProjectCompleted
			}
		}
		return outcome, nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	m, err := scanMilestone(tx.QueryRow(ctx,
		`UPDATE freelance_contract_milestones
		    SET status = 'released', completed_at = NOW(), updated_at = NOW()
		  WHERE id = $1 AND status = 'submitted'
		  RETURNING `+milestoneColumns, milestoneID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrStaleState
	}
	if err != nil {
		return nil, err
	}

	// The escrowed money for this milestone is what is being released. If none
	// is held - which the lifecycle should make impossible - nothing is released
	// and the whole transaction stops, rather than recording a payout backed by
	// no money.
	tag, err := tx.Exec(ctx,
		`UPDATE freelance_payment_intents SET status = 'released', updated_at = NOW()
		  WHERE milestone_id = $1 AND status = 'held_in_escrow'`, milestoneID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() != 1 {
		return nil, ErrStaleState
	}

	if err := reviewLatestDelivery(ctx, tx, milestoneID, domain.DeliveryAccepted); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO freelance_payouts
		   (id, contract_id, payee_id, amount_minor_units, currency, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		payout.ID, payout.ContractID, payout.PayeeID, int64(payout.Amount), payout.Currency,
		string(payout.Status), payout.CreatedAt, payout.UpdatedAt); err != nil {
		return nil, err
	}

	outcome := &ReleaseOutcome{Milestone: *m, Payout: *payout}

	// Complete the contract when this was the last open milestone and the
	// milestones account for the whole contract. A contract with value still
	// unscheduled is not finished just because everything scheduled so far is.
	var total, allocated int64
	var open int
	var status string
	var projectID uuid.UUID
	if err := tx.QueryRow(ctx,
		`SELECT c.total_amount_minor_units, c.status, c.project_id,
		        COALESCE(SUM(m.amount_minor_units) FILTER (WHERE m.status <> 'cancelled'), 0),
		        COUNT(m.id) FILTER (WHERE m.status NOT IN ('released', 'cancelled'))
		   FROM freelance_contracts c
		   LEFT JOIN freelance_contract_milestones m ON m.contract_id = c.id
		  WHERE c.id = $1
		  GROUP BY c.id`, m.ContractID).Scan(&total, &status, &projectID, &allocated, &open); err != nil {
		return nil, err
	}
	if status == string(domain.ContractActive) && open == 0 && allocated == total {
		if _, err := tx.Exec(ctx,
			`UPDATE freelance_contracts SET status = 'completed', updated_at = NOW()
			  WHERE id = $1 AND status = 'active'`, m.ContractID); err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx,
			`UPDATE freelance_projects SET status = 'completed', updated_at = NOW()
			  WHERE id = $1 AND status = 'active'`, projectID); err != nil {
			return nil, err
		}
		outcome.ContractCompleted = true
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return outcome, nil
}

// contractFullyReleasedLocked is the completion rule in memory mode. Called with
// r.mu held.
func (r *pgxFreelanceRepository) contractFullyReleasedLocked(c *domain.Contract) bool {
	var allocated domain.Amount
	for _, m := range r.mem().milestones {
		if m.ContractID != c.ID || !m.Status.CountsTowardsContract() {
			continue
		}
		if m.Status != domain.MilestoneReleased {
			return false
		}
		allocated += m.Amount
	}
	return allocated == c.TotalAmount
}
