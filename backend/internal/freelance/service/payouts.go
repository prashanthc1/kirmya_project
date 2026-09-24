package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"
	"unicode/utf8"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/payments"
	"kirmya/internal/freelance/repository"
	"kirmya/internal/shared/telemetry"

	"github.com/google/uuid"
)

// Paying freelancers.
//
// Releasing a milestone - the client's approval, or an administrator deciding
// a dispute for the freelancer - records a pending payout in the same
// transaction as the release. Sending it is separate, and happens here:
//
//	pending      released, waiting for the payee's payout account or the next attempt
//	processing   claimed by a sender, which is asking the processor
//	paid         the processor accepted the transfer to the payee's account
//	failed       sending failed maxPayoutAttempts times; an administrator retries
//
// A payout is sent only to a payout account the processor says is ready, and
// never to a freelancer whose capability is suspended: their payouts wait
// until the suspension is lifted or an administrator decides otherwise.
//
// The sender is RunPayouts, one per API replica. The claim is row-locked, so
// replicas never send the same payout, and each send is idempotent per payout
// at the processor, so a send whose result was lost is safe to repeat.

const (
	// payoutBatch is how many payouts one claim takes.
	payoutBatch = 25
	// maxPayoutBatches bounds one pass, so a pass always ends.
	maxPayoutBatches = 20
	// payoutStaleAfter is how long a payout may sit in processing before
	// another sender takes it over: its sender stopped mid-send.
	payoutStaleAfter = 15 * time.Minute
	// payoutSendTimeout bounds one call to the processor.
	payoutSendTimeout = 30 * time.Second
	// maxPayoutAttempts is how many sends are tried before a payout is parked
	// as failed for an administrator.
	maxPayoutAttempts = 5
	// maxPayoutErrorLen bounds the stored reason for a failed send.
	maxPayoutErrorLen = 500
)

// payoutBackoff is the wait before the next attempt, by attempts made so far.
var payoutBackoff = []time.Duration{time.Minute, 5 * time.Minute, 30 * time.Minute, 2 * time.Hour}

// nextPayoutAttempt is when a payout that has failed attempts times is tried
// again, or nil when it has had its last try.
func nextPayoutAttempt(backoff []time.Duration, attempts int, now time.Time) *time.Time {
	if attempts >= maxPayoutAttempts {
		return nil
	}
	i := attempts - 1
	if i < 0 {
		i = 0
	}
	if i >= len(backoff) {
		i = len(backoff) - 1
	}
	next := now.Add(backoff[i])
	return &next
}

// payoutGateway is the processor's payout half, or nil when this deployment
// cannot send payouts - no processor, or one that cannot pay anybody.
func (s *escrowService) payoutGateway() payments.PayoutGateway {
	if s.gateway == nil {
		return nil
	}
	pg, _ := s.gateway.(payments.PayoutGateway)
	return pg
}

// nudgePayouts asks the sender for a pass now rather than at its next tick.
// Never blocks: a pass already asked for covers this one too.
func (s *escrowService) nudgePayouts() {
	select {
	case s.payoutNudge <- struct{}{}:
	default:
	}
}

// RunPayouts sends due payouts every interval, and whenever something makes a
// payout sendable, until ctx ends. Returns at once in a deployment that
// cannot send payouts.
func (s *escrowService) RunPayouts(ctx context.Context, interval time.Duration) {
	if s.payoutGateway() == nil {
		return
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		if _, err := s.SendDuePayouts(ctx); err != nil && ctx.Err() == nil {
			slog.Error("freelance payout pass failed", slog.String("error", err.Error()))
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		case <-s.payoutNudge:
		}
	}
}

// SendDuePayouts claims every sendable payout and sends it. Returns how many
// were paid.
func (s *escrowService) SendDuePayouts(ctx context.Context) (int, error) {
	pg := s.payoutGateway()
	if pg == nil {
		return 0, nil
	}
	paid := 0
	for batch := 0; batch < maxPayoutBatches; batch++ {
		claimed, err := s.repo.ClaimDuePayouts(ctx, s.gateway.Name(), payoutBatch, payoutStaleAfter)
		if err != nil {
			return paid, err
		}
		for _, c := range claimed {
			if s.sendClaimedPayout(ctx, pg, c) {
				paid++
			}
		}
		if len(claimed) < payoutBatch {
			break
		}
	}
	return paid, nil
}

// sendClaimedPayout sends one claimed payout and records the result.
func (s *escrowService) sendClaimedPayout(ctx context.Context, pg payments.PayoutGateway, c repository.ClaimedPayout) bool {
	p := c.Payout
	var contractID uuid.UUID
	if p.ContractID != nil {
		contractID = *p.ContractID
	}
	sendCtx, cancel := context.WithTimeout(ctx, payoutSendTimeout)
	reference, err := pg.SendPayout(sendCtx, payments.PayoutRequest{
		PayoutID:         p.ID,
		ContractID:       contractID,
		Destination:      c.Destination,
		AmountMinorUnits: int64(p.Amount),
		Currency:         p.Currency,
		SourceReference:  c.SourceReference,
	})
	cancel()
	if err == nil && strings.TrimSpace(reference) == "" {
		err = errors.New("the processor returned no transfer reference")
	}

	if err != nil {
		retryAt := nextPayoutAttempt(s.payoutBackoff, p.Attempts, time.Now().UTC())
		failed, markErr := s.repo.MarkPayoutAttemptFailed(ctx, p.ID, truncatePayoutError(err.Error()), retryAt)
		if markErr != nil {
			// Left in processing; it is taken over once stale.
			slog.Error("freelance payout: recording a failed send failed",
				slog.String("payout_id", p.ID.String()), slog.String("error", markErr.Error()))
			return false
		}
		slog.Warn("freelance payout send failed",
			slog.String("payout_id", p.ID.String()), slog.Int("attempts", p.Attempts),
			slog.Bool("will_retry", retryAt != nil), slog.String("error", err.Error()))
		if failed.Status == domain.PayoutFailed {
			telemetry.LogUserAction(ctx, p.PayeeID.String(), domain.AuditPayoutFailed, map[string]interface{}{
				"payoutId": p.ID.String(),
				"attempts": p.Attempts,
			})
			s.publish(ctx, domain.EventPayoutFailed, payoutEventPayload(failed))
		}
		return false
	}

	sent, err := s.repo.MarkPayoutPaid(ctx, p.ID, s.gateway.Name(), reference)
	if err != nil {
		// The processor has the transfer and the row does not say so. Left in
		// processing, the payout is taken over once stale and sent again under
		// the same idempotency key, which names this same transfer.
		slog.Error("freelance payout: recording a sent payout failed",
			slog.String("payout_id", p.ID.String()), slog.String("reference", reference),
			slog.String("error", err.Error()))
		return false
	}
	telemetry.LogUserAction(ctx, p.PayeeID.String(), domain.AuditPayoutPaid, map[string]interface{}{
		"payoutId":  p.ID.String(),
		"reference": reference,
	})
	s.publish(ctx, domain.EventPayoutPaid, payoutEventPayload(sent))
	return true
}

func payoutEventPayload(p *domain.Payout) map[string]interface{} {
	payload := map[string]interface{}{
		"payout_id": p.ID.String(),
		"payee_id":  p.PayeeID.String(),
	}
	if p.ContractID != nil {
		payload["contract_id"] = p.ContractID.String()
	}
	if p.MilestoneID != nil {
		payload["milestone_id"] = p.MilestoneID.String()
	}
	return payload
}

func truncatePayoutError(reason string) string {
	if utf8.RuneCountInString(reason) <= maxPayoutErrorLen {
		return reason
	}
	return string([]rune(reason)[:maxPayoutErrorLen])
}

// ---------------------------------------------------------------------------
// The freelancer's payout account
// ---------------------------------------------------------------------------

// payoutAccountView assembles what GET /freelance/payouts/account shows.
func (s *escrowService) payoutAccountView(ctx context.Context, userID uuid.UUID, account *domain.PayoutAccount) (*domain.PayoutAccountView, error) {
	waiting, err := s.repo.SumUnpaidPayouts(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &domain.PayoutAccountView{
		Available: s.payoutGateway() != nil,
		Status:    account.Status(),
		Account:   account,
		Waiting:   waiting,
	}, nil
}

// storedPayoutAccount is the caller's account at this deployment's processor,
// or nil.
func (s *escrowService) storedPayoutAccount(ctx context.Context, userID uuid.UUID) (*domain.PayoutAccount, error) {
	if s.payoutGateway() == nil {
		return nil, nil
	}
	account, err := s.repo.GetPayoutAccount(ctx, userID, s.gateway.Name())
	if errors.Is(err, repository.ErrPayoutAccountNotFound) {
		return nil, nil
	}
	return account, err
}

// GetPayoutAccount returns where the caller's payout account stands, as last
// stored. It does not ask the processor.
func (s *escrowService) GetPayoutAccount(ctx context.Context, userID uuid.UUID) (*domain.PayoutAccountView, error) {
	if userID == uuid.Nil {
		return nil, domain.ErrUnauthenticated
	}
	account, err := s.storedPayoutAccount(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.payoutAccountView(ctx, userID, account)
}

// StartPayoutOnboarding creates the caller's payout account if they have none
// and returns where to complete it.
//
// Only a freelancer - somebody with a freelancer profile - has anything to be
// paid for; a client never needs a payout account. A suspended freelancer may
// still set one up: what they are owed for work already done stays theirs,
// and the sender, not onboarding, is what holds it.
func (s *escrowService) StartPayoutOnboarding(ctx context.Context, userID uuid.UUID) (*domain.PayoutOnboarding, error) {
	if userID == uuid.Nil {
		return nil, domain.ErrUnauthenticated
	}
	pg := s.payoutGateway()
	if pg == nil {
		return nil, ErrPaymentsUnavailable
	}
	capability, err := s.repo.FreelancerCapability(ctx, userID)
	if err != nil {
		return nil, err
	}
	if capability == repository.CapabilityNone {
		return nil, fmt.Errorf("%w: payouts are for freelancers; set up your freelancer profile first", domain.ErrForbidden)
	}

	account, err := s.storedPayoutAccount(ctx, userID)
	if err != nil {
		return nil, err
	}
	if account == nil {
		accountID, err := pg.CreatePayoutAccount(ctx, payments.PayoutAccountRequest{UserID: userID})
		if err != nil || strings.TrimSpace(accountID) == "" {
			return nil, ErrPaymentProvider
		}
		// A concurrent request may have stored one first; that one is kept.
		if account, err = s.repo.SavePayoutAccount(ctx, &domain.PayoutAccount{
			UserID:    userID,
			Provider:  s.gateway.Name(),
			AccountID: accountID,
		}); err != nil {
			return nil, err
		}
		telemetry.LogUserAction(ctx, userID.String(), domain.AuditPayoutAccountStarted, map[string]interface{}{
			"provider": account.Provider,
		})
	}

	if !account.Ready() {
		link, err := pg.PayoutOnboardingLink(ctx, account.AccountID)
		if err != nil {
			return nil, ErrPaymentProvider
		}
		if link != "" {
			view, err := s.payoutAccountView(ctx, userID, account)
			if err != nil {
				return nil, err
			}
			return &domain.PayoutOnboarding{URL: link, Account: *view}, nil
		}
	}
	// Nothing to fill in: read the account's state now.
	view, err := s.RefreshPayoutAccount(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &domain.PayoutOnboarding{Account: *view}, nil
}

// RefreshPayoutAccount asks the processor for the caller's account state and
// stores it. The freelancer's return from onboarding calls this, so their
// account is up to date without waiting for the processor's webhook.
func (s *escrowService) RefreshPayoutAccount(ctx context.Context, userID uuid.UUID) (*domain.PayoutAccountView, error) {
	if userID == uuid.Nil {
		return nil, domain.ErrUnauthenticated
	}
	pg := s.payoutGateway()
	account, err := s.storedPayoutAccount(ctx, userID)
	if err != nil {
		return nil, err
	}
	if account == nil {
		return s.payoutAccountView(ctx, userID, nil)
	}
	state, err := pg.GetPayoutAccount(ctx, account.AccountID)
	if err != nil {
		return nil, ErrPaymentProvider
	}
	if account, err = s.applyPayoutAccountState(ctx, state); err != nil {
		return nil, err
	}
	return s.payoutAccountView(ctx, userID, account)
}

// applyPayoutAccountState stores a processor's account state, and wakes the
// sender when the account can now be paid.
func (s *escrowService) applyPayoutAccountState(ctx context.Context, state payments.PayoutAccountState) (*domain.PayoutAccount, error) {
	account, err := s.repo.UpdatePayoutAccountState(ctx, s.gateway.Name(), domain.PayoutAccount{
		AccountID:        state.AccountID,
		DetailsSubmitted: state.DetailsSubmitted,
		PayoutsEnabled:   state.PayoutsEnabled,
		TransfersActive:  state.TransfersActive,
		RequirementsDue:  state.RequirementsDue,
		DisabledReason:   state.DisabledReason,
	})
	if err != nil {
		if errors.Is(err, repository.ErrPayoutAccountNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	if account.Ready() {
		s.nudgePayouts()
	}
	return account, nil
}

// ListMyPayouts is the caller's payouts, newest first.
func (s *escrowService) ListMyPayouts(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Payout, int, error) {
	if userID == uuid.Nil {
		return nil, 0, domain.ErrUnauthenticated
	}
	return s.repo.ListUserPayouts(ctx, userID, limit, offset)
}

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

// AdminListPayouts is the payout queue. status defaults to failed - the
// payouts somebody has to act on - and "all" lists every payout.
func (s *escrowService) AdminListPayouts(ctx context.Context, status string, limit, offset int) ([]domain.AdminPayout, int, error) {
	status = strings.ToLower(strings.TrimSpace(status))
	switch {
	case status == "":
		status = string(domain.PayoutFailed)
	case status == "all":
		status = ""
	case !domain.ValidPayoutStatus(status):
		return nil, 0, domain.NewValidationError("status", "is not a payout status")
	}
	return s.repo.AdminListPayouts(ctx, status, limit, offset)
}

// AdminRetryPayout puts a failed payout back in the queue, with a fresh set of
// attempts, once whatever made it fail has been fixed.
func (s *escrowService) AdminRetryPayout(ctx context.Context, adminID, payoutID uuid.UUID) (*domain.Payout, error) {
	p, err := s.repo.RetryFailedPayout(ctx, payoutID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrPayoutNotFound):
			return nil, domain.ErrNotFound
		case errors.Is(err, repository.ErrStaleState):
			return nil, fmt.Errorf("%w: only a failed payout can be retried", domain.ErrConflict)
		}
		return nil, err
	}
	telemetry.LogUserAction(ctx, adminID.String(), domain.AuditPayoutRetried, map[string]interface{}{
		"payoutId": payoutID.String(),
	})
	s.nudgePayouts()
	return p, nil
}
