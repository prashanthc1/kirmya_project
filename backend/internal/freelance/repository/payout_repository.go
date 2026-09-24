package repository

import (
	"context"
	"errors"
	"sort"
	"time"

	"kirmya/internal/freelance/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// The payout persistence: freelancers' payout accounts, and the sending of the
// payouts that releasing a milestone records.
//
// Sending is claim, call, record. ClaimDuePayouts moves due payouts to
// processing under FOR UPDATE SKIP LOCKED, so any number of API replicas can
// run the sender at once and each payout is claimed by one of them. The
// processor call happens outside any transaction, and its result is recorded
// by a guarded UPDATE ... WHERE status = 'processing'. A sender that dies
// between the call and the record leaves the payout in processing; once that
// is stale it is claimed again, and the processor's idempotency key makes the
// second send name the first transfer.

var (
	ErrPayoutNotFound        = errors.New("payout not found")
	ErrPayoutAccountNotFound = errors.New("payout account not found")
)

// PayoutRepository is the payout half of the module's persistence boundary.
type PayoutRepository interface {
	// GetPayoutAccount returns a user's account at a processor, or
	// ErrPayoutAccountNotFound.
	GetPayoutAccount(ctx context.Context, userID uuid.UUID, provider string) (*domain.PayoutAccount, error)
	// SavePayoutAccount records a newly created account. If the user already
	// has one at the processor - two requests raced - the stored one is kept
	// and returned.
	SavePayoutAccount(ctx context.Context, account *domain.PayoutAccount) (*domain.PayoutAccount, error)
	// UpdatePayoutAccountState stores what the processor says about an
	// account, found by the processor's id. ErrPayoutAccountNotFound for an
	// account this deployment did not create.
	UpdatePayoutAccountState(ctx context.Context, provider string, state domain.PayoutAccount) (*domain.PayoutAccount, error)

	// ListUserPayouts is a payee's payouts, newest first.
	ListUserPayouts(ctx context.Context, payeeID uuid.UUID, limit, offset int) ([]domain.Payout, int, error)
	// SumUnpaidPayouts is what a payee is owed and has not been sent, per
	// currency.
	SumUnpaidPayouts(ctx context.Context, payeeID uuid.UUID) (map[string]domain.Amount, error)

	// ClaimDuePayouts moves up to limit sendable payouts to processing and
	// returns them. Sendable: pending and due (or processing and not touched
	// for staleAfter), the payee has a ready account at the processor, and the
	// payee's freelancer capability is not suspended.
	ClaimDuePayouts(ctx context.Context, provider string, limit int, staleAfter time.Duration) ([]ClaimedPayout, error)
	// MarkPayoutPaid records a send the processor accepted.
	MarkPayoutPaid(ctx context.Context, payoutID uuid.UUID, provider, reference string) (*domain.Payout, error)
	// MarkPayoutAttemptFailed records a failed send: back to pending until
	// retryAt, or failed for good when retryAt is nil.
	MarkPayoutAttemptFailed(ctx context.Context, payoutID uuid.UUID, reason string, retryAt *time.Time) (*domain.Payout, error)

	// AdminListPayouts is the administrator's view, oldest first. status ""
	// means every status.
	AdminListPayouts(ctx context.Context, status string, limit, offset int) ([]domain.AdminPayout, int, error)
	// RetryFailedPayout puts a failed payout back in the queue with its
	// attempts reset.
	RetryFailedPayout(ctx context.Context, payoutID uuid.UUID) (*domain.Payout, error)
}

// ClaimedPayout is a payout claimed for sending, with what sending it needs.
type ClaimedPayout struct {
	Payout domain.Payout
	// Destination is the payee's account at the processor.
	Destination string
	// SourceReference is the processor's reference for the escrowed charge the
	// payout is paid from, when that charge was taken by the same processor.
	SourceReference string
}

const payoutColumns = `id, contract_id, milestone_id, payment_intent_id, payee_id, amount_minor_units,
	currency, status, COALESCE(provider, ''), COALESCE(provider_reference, ''), attempts,
	next_attempt_at, COALESCE(last_error, ''), paid_at, created_at, updated_at`

// claimedPayoutColumns is payoutColumns qualified for the claim's UPDATE ... FROM.
const claimedPayoutColumns = `p.id, p.contract_id, p.milestone_id, p.payment_intent_id, p.payee_id,
	p.amount_minor_units, p.currency, p.status, COALESCE(p.provider, ''), COALESCE(p.provider_reference, ''),
	p.attempts, p.next_attempt_at, COALESCE(p.last_error, ''), p.paid_at, p.created_at, p.updated_at`

func scanPayout(row pgx.Row, extra ...any) (*domain.Payout, error) {
	var p domain.Payout
	var amount int64
	var status string
	dest := append([]any{&p.ID, &p.ContractID, &p.MilestoneID, &p.PaymentIntentID, &p.PayeeID, &amount,
		&p.Currency, &status, &p.Provider, &p.ProviderReference, &p.Attempts,
		&p.NextAttemptAt, &p.LastError, &p.PaidAt, &p.CreatedAt, &p.UpdatedAt}, extra...)
	if err := row.Scan(dest...); err != nil {
		return nil, err
	}
	p.Amount, p.Status = domain.Amount(amount), domain.PayoutStatus(status)
	return &p, nil
}

const payoutAccountColumns = `user_id, provider, account_id, details_submitted, payouts_enabled,
	transfers_active, requirements_due, COALESCE(disabled_reason, ''), created_at, updated_at`

func scanPayoutAccount(row pgx.Row) (*domain.PayoutAccount, error) {
	var a domain.PayoutAccount
	if err := row.Scan(&a.UserID, &a.Provider, &a.AccountID, &a.DetailsSubmitted, &a.PayoutsEnabled,
		&a.TransfersActive, &a.RequirementsDue, &a.DisabledReason, &a.CreatedAt, &a.UpdatedAt); err != nil {
		return nil, err
	}
	return &a, nil
}

// payoutMemory is the no-database store for payout accounts.
type payoutMemory struct {
	accounts map[string]*domain.PayoutAccount // provider + "/" + user id
}

func (r *pgxFreelanceRepository) payoutMem() *payoutMemory {
	// Called with r.mu held.
	if r.payouts == nil {
		r.payouts = &payoutMemory{accounts: map[string]*domain.PayoutAccount{}}
	}
	return r.payouts
}

func payoutAccountKey(userID uuid.UUID, provider string) string {
	return provider + "/" + userID.String()
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

func (r *pgxFreelanceRepository) GetPayoutAccount(ctx context.Context, userID uuid.UUID, provider string) (*domain.PayoutAccount, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		a, ok := r.payoutMem().accounts[payoutAccountKey(userID, provider)]
		if !ok {
			return nil, ErrPayoutAccountNotFound
		}
		copied := *a
		return &copied, nil
	}
	a, err := scanPayoutAccount(r.pool.QueryRow(ctx,
		`SELECT `+payoutAccountColumns+` FROM freelance_payout_accounts WHERE user_id = $1 AND provider = $2`,
		userID, provider))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPayoutAccountNotFound
	}
	return a, err
}

func (r *pgxFreelanceRepository) SavePayoutAccount(ctx context.Context, account *domain.PayoutAccount) (*domain.PayoutAccount, error) {
	now := time.Now().UTC()
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		key := payoutAccountKey(account.UserID, account.Provider)
		if existing, ok := r.payoutMem().accounts[key]; ok {
			copied := *existing
			return &copied, nil
		}
		stored := *account
		stored.CreatedAt, stored.UpdatedAt = now, now
		r.payoutMem().accounts[key] = &stored
		copied := stored
		return &copied, nil
	}
	if _, err := r.pool.Exec(ctx,
		`INSERT INTO freelance_payout_accounts
		   (user_id, provider, account_id, details_submitted, payouts_enabled, transfers_active,
		    requirements_due, disabled_reason, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, ''), $9, $9)
		 ON CONFLICT (user_id, provider) DO NOTHING`,
		account.UserID, account.Provider, account.AccountID, account.DetailsSubmitted, account.PayoutsEnabled,
		account.TransfersActive, account.RequirementsDue, account.DisabledReason, now); err != nil {
		return nil, err
	}
	return r.GetPayoutAccount(ctx, account.UserID, account.Provider)
}

func (r *pgxFreelanceRepository) UpdatePayoutAccountState(ctx context.Context, provider string, state domain.PayoutAccount) (*domain.PayoutAccount, error) {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		for _, a := range r.payoutMem().accounts {
			if a.Provider != provider || a.AccountID != state.AccountID {
				continue
			}
			a.DetailsSubmitted, a.PayoutsEnabled, a.TransfersActive = state.DetailsSubmitted, state.PayoutsEnabled, state.TransfersActive
			a.RequirementsDue, a.DisabledReason, a.UpdatedAt = state.RequirementsDue, state.DisabledReason, time.Now().UTC()
			copied := *a
			return &copied, nil
		}
		return nil, ErrPayoutAccountNotFound
	}
	a, err := scanPayoutAccount(r.pool.QueryRow(ctx,
		`UPDATE freelance_payout_accounts
		    SET details_submitted = $3, payouts_enabled = $4, transfers_active = $5,
		        requirements_due = $6, disabled_reason = NULLIF($7, ''), updated_at = NOW()
		  WHERE provider = $1 AND account_id = $2
		  RETURNING `+payoutAccountColumns,
		provider, state.AccountID, state.DetailsSubmitted, state.PayoutsEnabled, state.TransfersActive,
		state.RequirementsDue, state.DisabledReason))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPayoutAccountNotFound
	}
	return a, err
}

// ---------------------------------------------------------------------------
// A payee's payouts
// ---------------------------------------------------------------------------

func (r *pgxFreelanceRepository) ListUserPayouts(ctx context.Context, payeeID uuid.UUID, limit, offset int) ([]domain.Payout, int, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var all []domain.Payout
		for _, p := range r.mem().payouts {
			if p.PayeeID == payeeID {
				all = append(all, *p)
			}
		}
		sort.Slice(all, func(i, j int) bool { return all[i].CreatedAt.After(all[j].CreatedAt) })
		return pageOf(all, limit, offset), len(all), nil
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM freelance_payouts WHERE payee_id = $1`, payeeID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx,
		`SELECT `+payoutColumns+` FROM freelance_payouts WHERE payee_id = $1
		  ORDER BY created_at DESC, id LIMIT $2 OFFSET $3`, payeeID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	payouts := []domain.Payout{}
	for rows.Next() {
		p, err := scanPayout(rows)
		if err != nil {
			return nil, 0, err
		}
		payouts = append(payouts, *p)
	}
	return payouts, total, rows.Err()
}

func (r *pgxFreelanceRepository) SumUnpaidPayouts(ctx context.Context, payeeID uuid.UUID) (map[string]domain.Amount, error) {
	sums := map[string]domain.Amount{}
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		for _, p := range r.mem().payouts {
			if p.PayeeID == payeeID && p.Status.IsUnpaid() {
				sums[p.Currency] += p.Amount
			}
		}
		return sums, nil
	}
	rows, err := r.pool.Query(ctx,
		`SELECT currency, SUM(amount_minor_units) FROM freelance_payouts
		  WHERE payee_id = $1 AND status IN ('pending', 'processing', 'failed')
		  GROUP BY currency`, payeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var currency string
		var sum int64
		if err := rows.Scan(&currency, &sum); err != nil {
			return nil, err
		}
		sums[currency] = domain.Amount(sum)
	}
	return sums, rows.Err()
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

func (r *pgxFreelanceRepository) ClaimDuePayouts(ctx context.Context, provider string, limit int, staleAfter time.Duration) ([]ClaimedPayout, error) {
	if limit <= 0 {
		return nil, nil
	}
	if r.pool == nil {
		return r.claimDuePayoutsInMemory(provider, limit, staleAfter), nil
	}

	// The payee's account and capability are read in the same statement that
	// claims, so a payout is never claimed for an account that is not ready or
	// a freelancer who is suspended. A suspended freelancer's payouts wait,
	// they are not cancelled: the money is still theirs if the suspension is
	// lifted, and an administrator decides otherwise.
	rows, err := r.pool.Query(ctx,
		`WITH due AS (
		    SELECT p.id, a.account_id
		      FROM freelance_payouts p
		      JOIN freelance_payout_accounts a
		        ON a.user_id = p.payee_id AND a.provider = $1
		       AND a.transfers_active AND a.payouts_enabled
		     WHERE ((p.status = 'pending' AND (p.next_attempt_at IS NULL OR p.next_attempt_at <= NOW()))
		         OR (p.status = 'processing' AND p.updated_at < NOW() - make_interval(secs => $3)))
		       AND NOT EXISTS (SELECT 1 FROM freelancer_profiles fp
		                        WHERE fp.user_id = p.payee_id AND fp.capability_status = 'suspended')
		     ORDER BY p.created_at, p.id
		     LIMIT $2
		     FOR UPDATE OF p SKIP LOCKED
		 )
		 UPDATE freelance_payouts p
		    SET status = 'processing', provider = $1, attempts = p.attempts + 1,
		        destination_account = due.account_id, updated_at = NOW()
		   FROM due
		  WHERE p.id = due.id
		 RETURNING `+claimedPayoutColumns+`, p.destination_account,
		        COALESCE((SELECT i.provider_reference FROM freelance_payment_intents i
		                   WHERE i.id = p.payment_intent_id AND i.provider = $1), '')`,
		provider, limit, staleAfter.Seconds())
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var claimed []ClaimedPayout
	for rows.Next() {
		var c ClaimedPayout
		p, err := scanPayout(rows, &c.Destination, &c.SourceReference)
		if err != nil {
			return nil, err
		}
		c.Payout = *p
		claimed = append(claimed, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	sort.Slice(claimed, func(i, j int) bool { return claimed[i].Payout.CreatedAt.Before(claimed[j].Payout.CreatedAt) })
	return claimed, nil
}

func (r *pgxFreelanceRepository) claimDuePayoutsInMemory(provider string, limit int, staleAfter time.Duration) []ClaimedPayout {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now().UTC()
	var due []*domain.Payout
	for _, p := range r.mem().payouts {
		pending := p.Status == domain.PayoutPending && (p.NextAttemptAt == nil || !p.NextAttemptAt.After(now))
		stale := p.Status == domain.PayoutProcessing && p.UpdatedAt.Before(now.Add(-staleAfter))
		if !pending && !stale {
			continue
		}
		account := r.payoutMem().accounts[payoutAccountKey(p.PayeeID, provider)]
		if !account.Ready() {
			continue
		}
		if prof := r.profiles[p.PayeeID]; prof != nil && prof.CapabilityStatus == domain.CapabilitySuspended {
			continue
		}
		due = append(due, p)
	}
	sort.Slice(due, func(i, j int) bool { return due[i].CreatedAt.Before(due[j].CreatedAt) })
	if len(due) > limit {
		due = due[:limit]
	}
	claimed := make([]ClaimedPayout, 0, len(due))
	for _, p := range due {
		account := r.payoutMem().accounts[payoutAccountKey(p.PayeeID, provider)]
		p.Status, p.Provider, p.UpdatedAt = domain.PayoutProcessing, provider, now
		p.Attempts++
		c := ClaimedPayout{Payout: *p, Destination: account.AccountID}
		if p.PaymentIntentID != nil {
			if intent := r.mem().intents[*p.PaymentIntentID]; intent != nil && intent.Provider == provider {
				c.SourceReference = intent.ProviderReference
			}
		}
		claimed = append(claimed, c)
	}
	return claimed
}

func (r *pgxFreelanceRepository) MarkPayoutPaid(ctx context.Context, payoutID uuid.UUID, provider, reference string) (*domain.Payout, error) {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		p, ok := r.mem().payouts[payoutID]
		if !ok {
			return nil, ErrPayoutNotFound
		}
		if p.Status != domain.PayoutProcessing {
			return nil, ErrStaleState
		}
		now := time.Now().UTC()
		p.Status, p.Provider, p.ProviderReference, p.PaidAt, p.UpdatedAt = domain.PayoutPaid, provider, reference, &now, now
		p.LastError, p.NextAttemptAt = "", nil
		copied := *p
		return &copied, nil
	}
	p, err := scanPayout(r.pool.QueryRow(ctx,
		`UPDATE freelance_payouts
		    SET status = 'paid', provider = $2, provider_reference = $3, paid_at = NOW(),
		        last_error = NULL, next_attempt_at = NULL, updated_at = NOW()
		  WHERE id = $1 AND status = 'processing'
		  RETURNING `+payoutColumns, payoutID, provider, reference))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrStaleState
	}
	return p, err
}

func (r *pgxFreelanceRepository) MarkPayoutAttemptFailed(ctx context.Context, payoutID uuid.UUID, reason string, retryAt *time.Time) (*domain.Payout, error) {
	status := domain.PayoutFailed
	if retryAt != nil {
		status = domain.PayoutPending
	}
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		p, ok := r.mem().payouts[payoutID]
		if !ok {
			return nil, ErrPayoutNotFound
		}
		if p.Status != domain.PayoutProcessing {
			return nil, ErrStaleState
		}
		p.Status, p.LastError, p.NextAttemptAt, p.UpdatedAt = status, reason, retryAt, time.Now().UTC()
		copied := *p
		return &copied, nil
	}
	p, err := scanPayout(r.pool.QueryRow(ctx,
		`UPDATE freelance_payouts
		    SET status = $2, last_error = $3, next_attempt_at = $4, updated_at = NOW()
		  WHERE id = $1 AND status = 'processing'
		  RETURNING `+payoutColumns, payoutID, string(status), reason, retryAt))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrStaleState
	}
	return p, err
}

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

func (r *pgxFreelanceRepository) AdminListPayouts(ctx context.Context, status string, limit, offset int) ([]domain.AdminPayout, int, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var all []domain.AdminPayout
		for _, p := range r.mem().payouts {
			if status == "" || string(p.Status) == status {
				all = append(all, domain.AdminPayout{Payout: *p, LastError: p.LastError})
			}
		}
		sort.Slice(all, func(i, j int) bool { return all[i].CreatedAt.Before(all[j].CreatedAt) })
		return pageOf(all, limit, offset), len(all), nil
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM freelance_payouts WHERE ($1 = '' OR status = $1)`, status).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx,
		`SELECT `+payoutColumns+`, COALESCE(destination_account, '') FROM freelance_payouts
		  WHERE ($1 = '' OR status = $1)
		  ORDER BY created_at, id LIMIT $2 OFFSET $3`, status, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	payouts := []domain.AdminPayout{}
	for rows.Next() {
		var destination string
		p, err := scanPayout(rows, &destination)
		if err != nil {
			return nil, 0, err
		}
		payouts = append(payouts, domain.AdminPayout{Payout: *p, LastError: p.LastError, DestinationAccount: destination})
	}
	return payouts, total, rows.Err()
}

func (r *pgxFreelanceRepository) RetryFailedPayout(ctx context.Context, payoutID uuid.UUID) (*domain.Payout, error) {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		p, ok := r.mem().payouts[payoutID]
		if !ok {
			return nil, ErrPayoutNotFound
		}
		if p.Status != domain.PayoutFailed {
			return nil, ErrStaleState
		}
		p.Status, p.Attempts, p.NextAttemptAt, p.UpdatedAt = domain.PayoutPending, 0, nil, time.Now().UTC()
		copied := *p
		return &copied, nil
	}
	p, err := scanPayout(r.pool.QueryRow(ctx,
		`UPDATE freelance_payouts
		    SET status = 'pending', attempts = 0, next_attempt_at = NULL, updated_at = NOW()
		  WHERE id = $1 AND status = 'failed'
		  RETURNING `+payoutColumns, payoutID))
	if errors.Is(err, pgx.ErrNoRows) {
		var exists bool
		if err := r.pool.QueryRow(ctx,
			`SELECT EXISTS (SELECT 1 FROM freelance_payouts WHERE id = $1)`, payoutID).Scan(&exists); err != nil {
			return nil, err
		}
		if !exists {
			return nil, ErrPayoutNotFound
		}
		return nil, ErrStaleState
	}
	return p, err
}

// pageOf is limit/offset over an in-memory list.
func pageOf[T any](all []T, limit, offset int) []T {
	if offset >= len(all) {
		return []T{}
	}
	end := len(all)
	if limit > 0 && offset+limit < end {
		end = offset + limit
	}
	return all[offset:end]
}
