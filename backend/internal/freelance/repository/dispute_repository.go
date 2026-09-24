package repository

import (
	"context"
	"errors"
	"time"

	"kirmya/internal/freelance/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// Disputes over escrowed money, and refunds.
//
// Every write that moves money follows escrow_repository.go: one transaction,
// the rows it depends on locked FOR UPDATE, every state change a guarded UPDATE.
// Refunds additionally call the payment processor while those locks are held,
// through the RefundFunc the service passes in - so no second request can
// release, refund or dispute the same money while the processor is being asked
// to return it. The processor call is idempotent per payment intent, which is
// what makes it safe if the transaction then fails to commit and is retried.

var (
	ErrDisputeNotFound = errors.New("dispute not found")
	// ErrDisputeAlreadyOpen: the contract already has an open dispute
	// (uq_freelance_disputes_open_per_contract).
	ErrDisputeAlreadyOpen = errors.New("this contract already has an open dispute")
)

// RefundFunc asks the payment processor to return a held charge and returns
// its reference for the refund.
type RefundFunc func(ctx context.Context, intent domain.PaymentIntent) (string, error)

// DisputeDecision is an administrator's ruling.
type DisputeDecision struct {
	Outcome    domain.DisputeOutcome
	Resolution string
	ResolvedBy uuid.UUID
}

// DisputeResolution is what ResolveDispute changed.
type DisputeResolution struct {
	Dispute   domain.Dispute
	Milestone domain.ContractMilestone
	// Payout is set when the money was released to the freelancer.
	Payout *domain.Payout
	// Intent is set when the money was refunded to the client.
	Intent            *domain.PaymentIntent
	ContractCompleted bool
}

// DisputeRepository is the dispute and refund half of the persistence boundary.
type DisputeRepository interface {
	// OpenDispute raises a dispute on a milestone holding escrow and freezes
	// it: the milestone, its contract and its project move to disputed.
	OpenDispute(ctx context.Context, d *domain.Dispute) error
	GetDispute(ctx context.Context, id uuid.UUID) (*domain.Dispute, error)
	ListContractDisputes(ctx context.Context, contractID uuid.UUID) ([]domain.Dispute, error)
	// ListDisputes is the administrative queue, oldest first, optionally
	// narrowed to some statuses.
	ListDisputes(ctx context.Context, statuses []domain.DisputeStatus, limit, offset int) ([]domain.Dispute, int, error)

	AddDisputeEvidence(ctx context.Context, e *domain.DisputeEvidence) error
	ListDisputeEvidence(ctx context.Context, disputeID uuid.UUID) ([]domain.DisputeEvidence, error)

	// WithdrawDispute closes an open dispute undecided and puts the milestone
	// back where it was; the contract and project return to active.
	WithdrawDispute(ctx context.Context, disputeID uuid.UUID) (*domain.Dispute, error)
	// ResolveDispute applies an administrator's decision. payout is recorded
	// for a release; refund is called for a refund.
	ResolveDispute(ctx context.Context, disputeID uuid.UUID, decision DisputeDecision, payout *domain.Payout, refund RefundFunc) (*DisputeResolution, error)

	// RefundMilestone returns a milestone's escrowed money to the client and
	// cancels the milestone. The freelancer's voluntary refund; a disputed
	// milestone is refunded through ResolveDispute instead.
	RefundMilestone(ctx context.Context, milestoneID uuid.UUID, refund RefundFunc) (*domain.ContractMilestone, *domain.PaymentIntent, error)
}

var openDisputeStatuses = []domain.DisputeStatus{
	domain.DisputeOpen, domain.DisputeUnderReview, domain.DisputeAwaitingEvidence, domain.DisputeEscalated,
}

func statusStrings(statuses []domain.DisputeStatus) []string {
	out := make([]string, len(statuses))
	for i, s := range statuses {
		out[i] = string(s)
	}
	return out
}

const disputeColumns = `id, contract_id, milestone_id, raised_by, reason, detail, status,
	COALESCE(outcome, ''), COALESCE(milestone_status_before, ''), COALESCE(resolution, ''),
	resolved_by, resolved_at, created_at, updated_at`

func scanDispute(row pgx.Row) (*domain.Dispute, error) {
	d := &domain.Dispute{}
	var reason, status, outcome, before string
	if err := row.Scan(&d.ID, &d.ContractID, &d.MilestoneID, &d.RaisedBy, &reason, &d.Detail, &status,
		&outcome, &before, &d.Resolution, &d.ResolvedBy, &d.ResolvedAt, &d.CreatedAt, &d.UpdatedAt); err != nil {
		return nil, err
	}
	d.Reason = domain.DisputeReason(reason)
	d.Status = domain.DisputeStatus(status)
	d.Outcome = domain.DisputeOutcome(outcome)
	d.MilestoneStatusBefore = domain.MilestoneStatus(before)
	return d, nil
}

// ---------------------------------------------------------------------------
// Opening, reading, evidence
// ---------------------------------------------------------------------------

func (r *pgxFreelanceRepository) OpenDispute(ctx context.Context, d *domain.Dispute) error {
	if d.MilestoneID == nil {
		return ErrMilestoneNotFound
	}
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	now := time.Now().UTC()
	d.CreatedAt, d.UpdatedAt = now, now
	d.Status = domain.DisputeOpen

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		m, ok := r.mem().milestones[*d.MilestoneID]
		if !ok {
			return ErrMilestoneNotFound
		}
		if !m.Status.HoldsEscrow() {
			return ErrStaleState
		}
		for _, existing := range r.mem().disputes {
			if existing.ContractID == d.ContractID && existing.Status.IsOpen() {
				return ErrDisputeAlreadyOpen
			}
		}
		d.MilestoneStatusBefore = m.Status
		m.Status, m.UpdatedAt = domain.MilestoneDisputed, now
		if c := r.contracts[m.ContractID]; c != nil && c.Status == domain.ContractActive {
			c.Status, c.UpdatedAt = domain.ContractDisputed, now
			if p := r.projects[c.ProjectID]; p != nil && p.Status == domain.ProjectActive {
				p.Status = domain.ProjectDisputed
			}
		}
		stored := *d
		r.mem().disputes[d.ID] = &stored
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var status string
	err = tx.QueryRow(ctx,
		`SELECT status FROM freelance_contract_milestones WHERE id = $1 FOR UPDATE`, *d.MilestoneID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrMilestoneNotFound
	}
	if err != nil {
		return err
	}
	if !domain.MilestoneStatus(status).HoldsEscrow() {
		return ErrStaleState
	}
	d.MilestoneStatusBefore = domain.MilestoneStatus(status)

	if _, err := tx.Exec(ctx,
		`INSERT INTO freelance_disputes
		   (id, contract_id, milestone_id, raised_by, reason, detail, status, milestone_status_before, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		d.ID, d.ContractID, d.MilestoneID, d.RaisedBy, string(d.Reason), d.Detail, string(d.Status),
		string(d.MilestoneStatusBefore), d.CreatedAt, d.UpdatedAt); err != nil {
		if isUniqueViolation(err) {
			return ErrDisputeAlreadyOpen
		}
		return err
	}
	if _, err := tx.Exec(ctx,
		`UPDATE freelance_contract_milestones SET status = 'disputed', updated_at = NOW() WHERE id = $1`,
		*d.MilestoneID); err != nil {
		return err
	}
	if err := setContractAndProject(ctx, tx, d.ContractID,
		domain.ContractActive, domain.ContractDisputed, domain.ProjectActive, domain.ProjectDisputed); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// setContractAndProject moves a contract, and its project, between two states
// if they are in the expected ones. Guarded, so a contract in any other state is
// left alone rather than forced.
func setContractAndProject(ctx context.Context, tx pgx.Tx, contractID uuid.UUID,
	contractFrom, contractTo domain.ContractStatus, projectFrom, projectTo domain.ProjectStatus) error {
	var projectID uuid.UUID
	err := tx.QueryRow(ctx,
		`UPDATE freelance_contracts SET status = $3, updated_at = NOW()
		  WHERE id = $1 AND status = $2 RETURNING project_id`,
		contractID, string(contractFrom), string(contractTo)).Scan(&projectID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx,
		`UPDATE freelance_projects SET status = $3, updated_at = NOW() WHERE id = $1 AND status = $2`,
		projectID, string(projectFrom), string(projectTo))
	return err
}

// restoreContractLocked is setContractAndProject's disputed -> active move in
// memory mode. Called with r.mu held.
func (r *pgxFreelanceRepository) restoreContractLocked(contractID uuid.UUID, now time.Time) {
	if c := r.contracts[contractID]; c != nil && c.Status == domain.ContractDisputed {
		c.Status, c.UpdatedAt = domain.ContractActive, now
		if p := r.projects[c.ProjectID]; p != nil && p.Status == domain.ProjectDisputed {
			p.Status = domain.ProjectActive
		}
	}
}

func (r *pgxFreelanceRepository) GetDispute(ctx context.Context, id uuid.UUID) (*domain.Dispute, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		d, ok := r.mem().disputes[id]
		if !ok {
			return nil, ErrDisputeNotFound
		}
		copied := *d
		return &copied, nil
	}
	d, err := scanDispute(r.pool.QueryRow(ctx, `SELECT `+disputeColumns+` FROM freelance_disputes WHERE id = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDisputeNotFound
	}
	return d, err
}

func (r *pgxFreelanceRepository) ListContractDisputes(ctx context.Context, contractID uuid.UUID) ([]domain.Dispute, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		list := []domain.Dispute{}
		for _, d := range r.mem().disputes {
			if d.ContractID == contractID {
				list = append(list, *d)
			}
		}
		sortDisputes(list, true)
		return list, nil
	}
	rows, err := r.pool.Query(ctx,
		`SELECT `+disputeColumns+` FROM freelance_disputes WHERE contract_id = $1 ORDER BY created_at DESC`, contractID)
	if err != nil {
		return nil, err
	}
	return collectDisputes(rows)
}

func collectDisputes(rows pgx.Rows) ([]domain.Dispute, error) {
	defer rows.Close()
	list := []domain.Dispute{}
	for rows.Next() {
		d, err := scanDispute(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *d)
	}
	return list, rows.Err()
}

func sortDisputes(list []domain.Dispute, newestFirst bool) {
	for i := 1; i < len(list); i++ {
		for j := i; j > 0; j-- {
			earlier := list[j].CreatedAt.Before(list[j-1].CreatedAt)
			if earlier == newestFirst {
				break
			}
			list[j], list[j-1] = list[j-1], list[j]
		}
	}
}

func (r *pgxFreelanceRepository) ListDisputes(ctx context.Context, statuses []domain.DisputeStatus, limit, offset int) ([]domain.Dispute, int, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		matched := []domain.Dispute{}
		for _, d := range r.mem().disputes {
			if len(statuses) == 0 || containsStatus(statuses, d.Status) {
				matched = append(matched, *d)
			}
		}
		sortDisputes(matched, false)
		total := len(matched)
		if offset >= total {
			return []domain.Dispute{}, total, nil
		}
		end := offset + limit
		if limit <= 0 || end > total {
			end = total
		}
		return matched[offset:end], total, nil
	}

	filter := statusStrings(statuses)
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM freelance_disputes WHERE cardinality($1::text[]) = 0 OR status = ANY($1)`,
		filter).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx,
		`SELECT `+disputeColumns+` FROM freelance_disputes
		  WHERE cardinality($1::text[]) = 0 OR status = ANY($1)
		  ORDER BY created_at ASC LIMIT $2 OFFSET $3`, filter, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	list, err := collectDisputes(rows)
	return list, total, err
}

func containsStatus(statuses []domain.DisputeStatus, s domain.DisputeStatus) bool {
	for _, candidate := range statuses {
		if candidate == s {
			return true
		}
	}
	return false
}

func (r *pgxFreelanceRepository) AddDisputeEvidence(ctx context.Context, e *domain.DisputeEvidence) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	e.CreatedAt = time.Now().UTC()

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		d, ok := r.mem().disputes[e.DisputeID]
		if !ok {
			return ErrDisputeNotFound
		}
		if !d.Status.IsOpen() {
			return ErrStaleState
		}
		stored := *e
		r.mem().evidence[e.ID] = &stored
		return nil
	}

	// Inserted only while the dispute is open, in one statement, so evidence
	// cannot land on a dispute decided a moment earlier.
	tag, err := r.pool.Exec(ctx,
		`INSERT INTO freelance_dispute_evidence (id, dispute_id, uploaded_by, kind, body, file_url, created_at)
		 SELECT $1, $2, $3, $4, $5, NULLIF($6, ''), $7
		  WHERE EXISTS (SELECT 1 FROM freelance_disputes WHERE id = $2 AND status = ANY($8))`,
		e.ID, e.DisputeID, e.UploadedBy, string(e.Kind), e.Body, e.FileURL, e.CreatedAt,
		statusStrings(openDisputeStatuses))
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrStaleState
	}
	return nil
}

func (r *pgxFreelanceRepository) ListDisputeEvidence(ctx context.Context, disputeID uuid.UUID) ([]domain.DisputeEvidence, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		list := []domain.DisputeEvidence{}
		for _, e := range r.mem().evidence {
			if e.DisputeID == disputeID {
				list = append(list, *e)
			}
		}
		for i := 1; i < len(list); i++ {
			for j := i; j > 0 && list[j].CreatedAt.Before(list[j-1].CreatedAt); j-- {
				list[j], list[j-1] = list[j-1], list[j]
			}
		}
		return list, nil
	}
	rows, err := r.pool.Query(ctx,
		`SELECT id, dispute_id, uploaded_by, kind, body, COALESCE(file_url, ''), created_at
		   FROM freelance_dispute_evidence WHERE dispute_id = $1 ORDER BY created_at`, disputeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []domain.DisputeEvidence{}
	for rows.Next() {
		var e domain.DisputeEvidence
		var kind string
		if err := rows.Scan(&e.ID, &e.DisputeID, &e.UploadedBy, &kind, &e.Body, &e.FileURL, &e.CreatedAt); err != nil {
			return nil, err
		}
		e.Kind = domain.EvidenceKind(kind)
		list = append(list, e)
	}
	return list, rows.Err()
}

// ---------------------------------------------------------------------------
// Withdrawal and decision
// ---------------------------------------------------------------------------

// lockOpenDispute reads a dispute FOR UPDATE and refuses one that is closed.
func lockOpenDispute(ctx context.Context, tx pgx.Tx, id uuid.UUID) (*domain.Dispute, error) {
	d, err := scanDispute(tx.QueryRow(ctx,
		`SELECT `+disputeColumns+` FROM freelance_disputes WHERE id = $1 FOR UPDATE`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDisputeNotFound
	}
	if err != nil {
		return nil, err
	}
	if !d.Status.IsOpen() || d.MilestoneID == nil {
		return nil, ErrStaleState
	}
	return d, nil
}

func (r *pgxFreelanceRepository) WithdrawDispute(ctx context.Context, disputeID uuid.UUID) (*domain.Dispute, error) {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		d, ok := r.mem().disputes[disputeID]
		if !ok {
			return nil, ErrDisputeNotFound
		}
		if !d.Status.IsOpen() || d.MilestoneID == nil {
			return nil, ErrStaleState
		}
		now := time.Now().UTC()
		d.Status, d.UpdatedAt = domain.DisputeWithdrawn, now
		if m := r.mem().milestones[*d.MilestoneID]; m != nil && m.Status == domain.MilestoneDisputed {
			m.Status, m.UpdatedAt = d.MilestoneStatusBefore, now
		}
		r.restoreContractLocked(d.ContractID, now)
		copied := *d
		return &copied, nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	d, err := lockOpenDispute(ctx, tx, disputeID)
	if err != nil {
		return nil, err
	}
	before := d.MilestoneStatusBefore
	if !before.HoldsEscrow() {
		// A dispute written before 0104 has no record of where the milestone
		// was. Funded is the one state every escrowed milestone passed through.
		before = domain.MilestoneFunded
	}
	if _, err := tx.Exec(ctx,
		`UPDATE freelance_disputes SET status = 'withdrawn', updated_at = NOW() WHERE id = $1`, disputeID); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx,
		`UPDATE freelance_contract_milestones SET status = $2, updated_at = NOW()
		  WHERE id = $1 AND status = 'disputed'`, *d.MilestoneID, string(before)); err != nil {
		return nil, err
	}
	if err := setContractAndProject(ctx, tx, d.ContractID,
		domain.ContractDisputed, domain.ContractActive, domain.ProjectDisputed, domain.ProjectActive); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	d.Status = domain.DisputeWithdrawn
	return d, nil
}

func (r *pgxFreelanceRepository) ResolveDispute(ctx context.Context, disputeID uuid.UUID, decision DisputeDecision,
	payout *domain.Payout, refund RefundFunc) (*DisputeResolution, error) {
	if r.pool == nil {
		return r.resolveDisputeInMemory(ctx, disputeID, decision, payout, refund)
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	d, err := lockOpenDispute(ctx, tx, disputeID)
	if err != nil {
		return nil, err
	}
	m, err := scanMilestone(tx.QueryRow(ctx,
		`SELECT `+milestoneColumns+` FROM freelance_contract_milestones WHERE id = $1 FOR UPDATE`, *d.MilestoneID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMilestoneNotFound
	}
	if err != nil {
		return nil, err
	}
	if m.Status != domain.MilestoneDisputed {
		return nil, ErrStaleState
	}
	intent, err := scanIntent(tx.QueryRow(ctx,
		`SELECT `+intentColumns+` FROM freelance_payment_intents
		  WHERE milestone_id = $1 AND status = 'held_in_escrow' FOR UPDATE`, m.ID))
	if errors.Is(err, pgx.ErrNoRows) {
		// A disputed milestone always holds escrow; one that does not has
		// nothing to decide over, and nothing is written.
		return nil, ErrStaleState
	}
	if err != nil {
		return nil, err
	}

	result := &DisputeResolution{}
	switch decision.Outcome {
	case domain.OutcomeReleaseToFreelancer:
		m, err = scanMilestone(tx.QueryRow(ctx,
			`UPDATE freelance_contract_milestones SET status = 'released', completed_at = NOW(), updated_at = NOW()
			  WHERE id = $1 RETURNING `+milestoneColumns, m.ID))
		if err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx,
			`UPDATE freelance_payment_intents SET status = 'released', updated_at = NOW() WHERE id = $1`, intent.ID); err != nil {
			return nil, err
		}
		if err := reviewLatestDelivery(ctx, tx, m.ID, domain.DeliveryAccepted); err != nil {
			return nil, err
		}
		payout.MilestoneID, payout.PaymentIntentID = &m.ID, &intent.ID
		if err := insertPayout(ctx, tx, payout); err != nil {
			return nil, err
		}
		result.Payout = payout

	case domain.OutcomeRefundToClient:
		refunded, err := refundHeldIntent(ctx, tx, intent, refund)
		if err != nil {
			return nil, err
		}
		result.Intent = refunded
		m, err = scanMilestone(tx.QueryRow(ctx,
			`UPDATE freelance_contract_milestones SET status = 'cancelled', updated_at = NOW()
			  WHERE id = $1 RETURNING `+milestoneColumns, m.ID))
		if err != nil {
			return nil, err
		}

	case domain.OutcomeResumeWork:
		m, err = scanMilestone(tx.QueryRow(ctx,
			`UPDATE freelance_contract_milestones SET status = 'in_progress', updated_at = NOW()
			  WHERE id = $1 RETURNING `+milestoneColumns, m.ID))
		if err != nil {
			return nil, err
		}

	default:
		return nil, domain.ErrValidation
	}

	if err := tx.QueryRow(ctx,
		`UPDATE freelance_disputes
		    SET status = 'resolved', outcome = $2, resolution = $3, resolved_by = $4,
		        resolved_at = NOW(), updated_at = NOW()
		  WHERE id = $1 RETURNING resolved_at`,
		d.ID, string(decision.Outcome), decision.Resolution, decision.ResolvedBy).Scan(&d.ResolvedAt); err != nil {
		return nil, err
	}
	d.Status, d.Outcome, d.Resolution, d.ResolvedBy = domain.DisputeResolved, decision.Outcome, decision.Resolution, &decision.ResolvedBy

	if err := setContractAndProject(ctx, tx, d.ContractID,
		domain.ContractDisputed, domain.ContractActive, domain.ProjectDisputed, domain.ProjectActive); err != nil {
		return nil, err
	}
	if result.ContractCompleted, err = completeContractIfDone(ctx, tx, d.ContractID); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	result.Dispute, result.Milestone = *d, *m
	return result, nil
}

func insertPayout(ctx context.Context, tx pgx.Tx, payout *domain.Payout) error {
	if payout.ID == uuid.Nil {
		payout.ID = uuid.New()
	}
	now := time.Now().UTC()
	payout.CreatedAt, payout.UpdatedAt = now, now
	payout.Status = domain.PayoutPending
	_, err := tx.Exec(ctx,
		`INSERT INTO freelance_payouts
		   (id, contract_id, milestone_id, payment_intent_id, payee_id, amount_minor_units, currency,
		    status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		payout.ID, payout.ContractID, payout.MilestoneID, payout.PaymentIntentID, payout.PayeeID,
		int64(payout.Amount), payout.Currency, string(payout.Status), payout.CreatedAt, payout.UpdatedAt)
	return err
}

// refundHeldIntent asks the processor for the refund, then records it. The
// intent is locked by the caller, so nothing else can move it meanwhile.
func refundHeldIntent(ctx context.Context, tx pgx.Tx, intent *domain.PaymentIntent, refund RefundFunc) (*domain.PaymentIntent, error) {
	if refund == nil {
		return nil, domain.ErrValidation
	}
	reference, err := refund(ctx, *intent)
	if err != nil {
		return nil, err
	}
	return scanIntent(tx.QueryRow(ctx,
		`UPDATE freelance_payment_intents
		    SET status = 'refunded', refund_reference = $2, refunded_at = NOW(), updated_at = NOW()
		  WHERE id = $1 AND status = 'held_in_escrow'
		  RETURNING `+intentColumns, intent.ID, reference))
}

func (r *pgxFreelanceRepository) resolveDisputeInMemory(ctx context.Context, disputeID uuid.UUID, decision DisputeDecision,
	payout *domain.Payout, refund RefundFunc) (*DisputeResolution, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	d, ok := r.mem().disputes[disputeID]
	if !ok {
		return nil, ErrDisputeNotFound
	}
	if !d.Status.IsOpen() || d.MilestoneID == nil {
		return nil, ErrStaleState
	}
	m := r.mem().milestones[*d.MilestoneID]
	if m == nil {
		return nil, ErrMilestoneNotFound
	}
	intent := r.liveIntentLocked(m.ID)
	if m.Status != domain.MilestoneDisputed || intent == nil || intent.Status != domain.PaymentHeldInEscrow {
		return nil, ErrStaleState
	}

	now := time.Now().UTC()
	result := &DisputeResolution{}
	switch decision.Outcome {
	case domain.OutcomeReleaseToFreelancer:
		m.Status, m.CompletedAt, m.UpdatedAt = domain.MilestoneReleased, &now, now
		intent.Status, intent.UpdatedAt = domain.PaymentReleased, now
		if del := r.latestDeliveryLocked(m.ID); del != nil {
			del.Status, del.ReviewedAt, del.UpdatedAt = domain.DeliveryAccepted, &now, now
		}
		if payout.ID == uuid.Nil {
			payout.ID = uuid.New()
		}
		payout.CreatedAt, payout.UpdatedAt, payout.Status = now, now, domain.PayoutPending
		payout.MilestoneID, payout.PaymentIntentID = &m.ID, &intent.ID
		stored := *payout
		r.mem().payouts[payout.ID] = &stored
		result.Payout = payout
	case domain.OutcomeRefundToClient:
		if refund == nil {
			return nil, domain.ErrValidation
		}
		reference, err := refund(ctx, *intent)
		if err != nil {
			return nil, err
		}
		intent.Status, intent.RefundReference, intent.RefundedAt, intent.UpdatedAt = domain.PaymentRefunded, reference, &now, now
		m.Status, m.UpdatedAt = domain.MilestoneCancelled, now
		copied := *intent
		result.Intent = &copied
	case domain.OutcomeResumeWork:
		m.Status, m.UpdatedAt = domain.MilestoneInProgress, now
	default:
		return nil, domain.ErrValidation
	}

	d.Status, d.Outcome, d.Resolution = domain.DisputeResolved, decision.Outcome, decision.Resolution
	resolvedBy := decision.ResolvedBy
	d.ResolvedBy, d.ResolvedAt, d.UpdatedAt = &resolvedBy, &now, now
	r.restoreContractLocked(d.ContractID, now)
	result.ContractCompleted = r.completeContractIfDoneLocked(d.ContractID, now)
	result.Dispute, result.Milestone = *d, *m
	return result, nil
}

// ---------------------------------------------------------------------------
// Voluntary refund
// ---------------------------------------------------------------------------

func (r *pgxFreelanceRepository) RefundMilestone(ctx context.Context, milestoneID uuid.UUID, refund RefundFunc) (*domain.ContractMilestone, *domain.PaymentIntent, error) {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		m, ok := r.mem().milestones[milestoneID]
		if !ok {
			return nil, nil, ErrMilestoneNotFound
		}
		intent := r.liveIntentLocked(milestoneID)
		if !m.Status.HoldsEscrow() || intent == nil || intent.Status != domain.PaymentHeldInEscrow {
			return nil, nil, ErrStaleState
		}
		if refund == nil {
			return nil, nil, domain.ErrValidation
		}
		reference, err := refund(ctx, *intent)
		if err != nil {
			return nil, nil, err
		}
		now := time.Now().UTC()
		intent.Status, intent.RefundReference, intent.RefundedAt, intent.UpdatedAt = domain.PaymentRefunded, reference, &now, now
		m.Status, m.UpdatedAt = domain.MilestoneCancelled, now
		copiedM, copiedI := *m, *intent
		return &copiedM, &copiedI, nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	m, err := scanMilestone(tx.QueryRow(ctx,
		`SELECT `+milestoneColumns+` FROM freelance_contract_milestones WHERE id = $1 FOR UPDATE`, milestoneID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, ErrMilestoneNotFound
	}
	if err != nil {
		return nil, nil, err
	}
	// A disputed milestone is not refundable here: the dispute decides it.
	if !m.Status.HoldsEscrow() {
		return nil, nil, ErrStaleState
	}
	intent, err := scanIntent(tx.QueryRow(ctx,
		`SELECT `+intentColumns+` FROM freelance_payment_intents
		  WHERE milestone_id = $1 AND status = 'held_in_escrow' FOR UPDATE`, milestoneID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, ErrStaleState
	}
	if err != nil {
		return nil, nil, err
	}
	refunded, err := refundHeldIntent(ctx, tx, intent, refund)
	if err != nil {
		return nil, nil, err
	}
	m, err = scanMilestone(tx.QueryRow(ctx,
		`UPDATE freelance_contract_milestones SET status = 'cancelled', updated_at = NOW()
		  WHERE id = $1 RETURNING `+milestoneColumns, milestoneID))
	if err != nil {
		return nil, nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, nil, err
	}
	return m, refunded, nil
}
