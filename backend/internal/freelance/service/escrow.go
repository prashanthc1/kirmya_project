package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/payments"
	"kirmya/internal/freelance/repository"
	"kirmya/internal/shared/events"
	"kirmya/internal/shared/telemetry"

	"github.com/google/uuid"
)

// The escrow flow: how a contract's value is scheduled into milestones, how each
// milestone is paid for before work starts, and how the money reaches the
// freelancer once the client accepts the work.
//
//	client adds milestone      pending
//	client funds it            (payment intent: requires_payment)
//	processor confirms         funded       <- signed webhook, never the client
//	freelancer submits work    submitted
//	client requests changes    in_progress  -> freelancer submits again
//	client approves            released     (payout recorded for the freelancer)
//
// Who may do what is decided here, per contract, from the verified caller: the
// client who hired schedules, funds, reviews and releases; the freelancer who
// was hired delivers. Anybody else is told the contract does not exist, for the
// reason set out at GetOwnProject.
//
// What is deliberately not here yet: refunds, disputes, and sending payouts. A
// funded milestone cannot be cancelled, because cancelling it means returning
// the client's money and that belongs with disputes; a released milestone's
// payout is recorded as pending, because sending it needs a processor.

// Escrow refusals the delivery layer maps onto responses.
var (
	// ErrPaymentsUnavailable: this deployment has no payment processor.
	ErrPaymentsUnavailable = errors.New("payments are not available in this environment")
	// ErrPaymentProvider: the processor refused or failed to create the charge.
	ErrPaymentProvider = errors.New("the payment processor could not create the charge")
	// ErrWebhookRejected: the webhook could not be verified.
	ErrWebhookRejected = errors.New("the payment notification could not be verified")
	// ErrUnknownProvider: a webhook arrived for a processor this deployment
	// does not use.
	ErrUnknownProvider = errors.New("unknown payment provider")
)

// Field bounds for the escrow writes, matching migration 0102's columns.
const (
	maxMilestoneTitleLen = 200
	maxDeliverySummary   = 10000
	maxAttachments       = 20
	maxAttachmentLen     = 2048
	maxRevisionReasonLen = 2000
)

// EscrowService is the milestone and escrow use-cases.
type EscrowService interface {
	// GetContract returns one contract, with its milestones and escrow totals,
	// to either party.
	GetContract(ctx context.Context, userID, contractID uuid.UUID) (*domain.ContractDetail, error)

	AddMilestone(ctx context.Context, clientID, contractID uuid.UUID, payload domain.CreateMilestonePayload) (*domain.ContractMilestone, error)
	CancelMilestone(ctx context.Context, clientID, contractID, milestoneID uuid.UUID) (*domain.ContractMilestone, error)

	FundMilestone(ctx context.Context, clientID, contractID, milestoneID uuid.UUID) (*domain.FundingResult, error)
	// HandlePaymentWebhook applies a processor notification. provider is the
	// path segment it arrived on.
	HandlePaymentWebhook(ctx context.Context, provider string, event payments.WebhookEvent) error
	// VerifyPaymentWebhook checks a webhook's signature and returns its event.
	VerifyPaymentWebhook(provider string, payload []byte, headers http.Header) (payments.WebhookEvent, error)

	SubmitMilestone(ctx context.Context, freelancerID, contractID, milestoneID uuid.UUID, payload domain.SubmitMilestonePayload) (*domain.ContractMilestone, error)
	RequestRevision(ctx context.Context, clientID, contractID, milestoneID uuid.UUID, payload domain.RequestRevisionPayload) (*domain.ContractMilestone, error)
	ApproveMilestone(ctx context.Context, clientID, contractID, milestoneID uuid.UUID) (*domain.ContractMilestone, error)
}

type escrowService struct {
	repo repository.FreelanceRepository
	// gateway is nil when the deployment has no processor; funding then answers
	// ErrPaymentsUnavailable and every other step still works.
	gateway payments.Gateway
	bus     events.EventBus
}

// NewEscrowService wires the escrow flow. gateway and bus may be nil.
func NewEscrowService(repo repository.FreelanceRepository, gateway payments.Gateway, bus events.EventBus) EscrowService {
	return &escrowService{repo: repo, gateway: gateway, bus: bus}
}

func (s *escrowService) publish(ctx context.Context, eventType string, payload map[string]interface{}) {
	if s.bus == nil {
		return
	}
	// Published after the write committed; a failed publish is not a failed write.
	_ = s.bus.Publish(ctx, events.DomainEvent{Type: eventType, Producer: "freelance", Payload: payload})
}

// contractFor loads a contract the caller is a party to.
//
// A stranger gets ErrNotFound rather than ErrForbidden: a 403 would confirm the
// id names a real contract.
func (s *escrowService) contractFor(ctx context.Context, userID, contractID uuid.UUID) (*domain.Contract, error) {
	if userID == uuid.Nil {
		return nil, domain.ErrUnauthenticated
	}
	contract, err := s.repo.GetContractByID(ctx, contractID)
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	if !contract.IsParty(userID) {
		return nil, domain.ErrNotFound
	}
	return contract, nil
}

// asClient loads a contract the caller hired on. The freelancer on the same
// contract already knows it exists, so they are told ErrForbidden, not
// ErrNotFound.
func (s *escrowService) asClient(ctx context.Context, userID, contractID uuid.UUID) (*domain.Contract, error) {
	contract, err := s.contractFor(ctx, userID, contractID)
	if err != nil {
		return nil, err
	}
	if contract.ClientID != userID {
		return nil, domain.ErrForbidden
	}
	return contract, nil
}

func (s *escrowService) asFreelancer(ctx context.Context, userID, contractID uuid.UUID) (*domain.Contract, error) {
	contract, err := s.contractFor(ctx, userID, contractID)
	if err != nil {
		return nil, err
	}
	if contract.FreelancerID != userID {
		return nil, domain.ErrForbidden
	}
	return contract, nil
}

// milestoneOf loads a milestone and checks it belongs to the contract in the
// path. A milestone of a different contract is not found, whoever asks: the
// caller's right to the contract in the URL is not a right to any other.
func (s *escrowService) milestoneOf(ctx context.Context, contract *domain.Contract, milestoneID uuid.UUID) (*domain.ContractMilestone, error) {
	m, err := s.repo.GetContractMilestone(ctx, milestoneID)
	if err != nil {
		if errors.Is(err, repository.ErrMilestoneNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	if m.ContractID != contract.ID {
		return nil, domain.ErrNotFound
	}
	return m, nil
}

// transitionRefused builds the 409 for a move the lifecycle does not allow.
func transitionRefused(from domain.MilestoneStatus, to string) error {
	return &domain.TransitionError{Entity: "milestone", From: string(from), To: to}
}

// mapEscrowRepoError turns a repository refusal into a domain one.
//
// ErrStaleState means another request moved the row between our read and our
// write. It is reported as a conflict: the caller's request was legal when they
// made it and is not any more.
func mapEscrowRepoError(err error) error {
	switch {
	case errors.Is(err, repository.ErrContractNotFound), errors.Is(err, repository.ErrMilestoneNotFound):
		return domain.ErrNotFound
	case errors.Is(err, repository.ErrMilestoneExceedsContract):
		return domain.NewValidationError("amount", "would schedule more than the contract total")
	case errors.Is(err, repository.ErrContractNotLive):
		return fmt.Errorf("%w: the contract is no longer live", domain.ErrConflict)
	case errors.Is(err, repository.ErrLiveIntentExists):
		return fmt.Errorf("%w: %s", domain.ErrConflict, repository.ErrLiveIntentExists.Error())
	case errors.Is(err, repository.ErrStaleState):
		return fmt.Errorf("%w: %s", domain.ErrConflict, repository.ErrStaleState.Error())
	}
	return err
}

// GetContract returns the contract, its milestones and where its money stands.
func (s *escrowService) GetContract(ctx context.Context, userID, contractID uuid.UUID) (*domain.ContractDetail, error) {
	contract, err := s.contractFor(ctx, userID, contractID)
	if err != nil {
		return nil, err
	}
	milestones, err := s.repo.ListContractMilestones(ctx, contractID)
	if err != nil {
		return nil, err
	}
	return &domain.ContractDetail{
		Contract:   *contract,
		Milestones: milestones,
		Escrow:     domain.SummarizeEscrow(contract, milestones),
	}, nil
}

// AddMilestone schedules part of the contract's value as a milestone.
//
// The client does this, because the client is the one who will pay for each
// step. The amount is in the contract's currency, must be positive, and the
// repository refuses one that would take the schedule past the contract total -
// under a lock, so two added at once cannot both fit into the same headroom.
func (s *escrowService) AddMilestone(ctx context.Context, clientID, contractID uuid.UUID, payload domain.CreateMilestonePayload) (*domain.ContractMilestone, error) {
	contract, err := s.asClient(ctx, clientID, contractID)
	if err != nil {
		return nil, err
	}
	if contract.Status.IsTerminal() {
		return nil, &domain.TransitionError{Entity: "contract", From: string(contract.Status), To: "scheduled"}
	}
	if err := checkText("title", payload.Title, true, maxMilestoneTitleLen); err != nil {
		return nil, err
	}
	if err := checkText("description", payload.Description, false, maxDescriptionLen); err != nil {
		return nil, err
	}
	if payload.Amount <= 0 {
		return nil, domain.NewValidationError("amount", "must be greater than zero")
	}
	if payload.DueAt != nil && payload.DueAt.Before(time.Now().Add(-24*time.Hour)) {
		return nil, domain.NewValidationError("due_at", "cannot be in the past")
	}

	m := &domain.ContractMilestone{
		ContractID:  contractID,
		Title:       strings.TrimSpace(payload.Title),
		Description: strings.TrimSpace(payload.Description),
		Amount:      payload.Amount,
		Currency:    contract.Currency,
		DueAt:       payload.DueAt,
	}
	if err := s.repo.CreateContractMilestone(ctx, m); err != nil {
		return nil, mapEscrowRepoError(err)
	}

	telemetry.LogUserAction(ctx, clientID.String(), domain.AuditMilestoneCreated, map[string]interface{}{
		"contractId":  contractID.String(),
		"milestoneId": m.ID.String(),
	})
	return m, nil
}

// CancelMilestone withdraws a milestone that has not been paid for.
func (s *escrowService) CancelMilestone(ctx context.Context, clientID, contractID, milestoneID uuid.UUID) (*domain.ContractMilestone, error) {
	contract, err := s.asClient(ctx, clientID, contractID)
	if err != nil {
		return nil, err
	}
	m, err := s.milestoneOf(ctx, contract, milestoneID)
	if err != nil {
		return nil, err
	}
	// Only an unfunded milestone. A funded one holds the client's money, and
	// cancelling it is a refund - which is not built.
	if m.Status != domain.MilestonePending {
		return nil, transitionRefused(m.Status, string(domain.MilestoneCancelled))
	}
	if err := s.repo.CancelPendingMilestone(ctx, milestoneID); err != nil {
		return nil, mapEscrowRepoError(err)
	}
	m.Status = domain.MilestoneCancelled

	telemetry.LogUserAction(ctx, clientID.String(), domain.AuditMilestoneCancelled, map[string]interface{}{
		"contractId":  contractID.String(),
		"milestoneId": milestoneID.String(),
	})
	return m, nil
}

// FundMilestone asks the processor to collect the milestone's value into escrow.
//
// It does not fund anything. It records a payment intent and returns what the
// client needs to pay; the milestone becomes funded only when the processor's
// verified webhook confirms the money. If creating the charge fails, the intent
// is marked failed so the client can try again.
func (s *escrowService) FundMilestone(ctx context.Context, clientID, contractID, milestoneID uuid.UUID) (*domain.FundingResult, error) {
	contract, err := s.asClient(ctx, clientID, contractID)
	if err != nil {
		return nil, err
	}
	if contract.Status.IsTerminal() {
		return nil, &domain.TransitionError{Entity: "contract", From: string(contract.Status), To: "funded"}
	}
	m, err := s.milestoneOf(ctx, contract, milestoneID)
	if err != nil {
		return nil, err
	}
	if m.Status != domain.MilestonePending {
		return nil, transitionRefused(m.Status, string(domain.MilestoneFunded))
	}
	// Checked after authorization and state, so a stranger learns nothing and a
	// client is told about a wrong state before being told about the deployment.
	if s.gateway == nil {
		return nil, ErrPaymentsUnavailable
	}

	intent := &domain.PaymentIntent{
		ContractID:  contractID,
		MilestoneID: &milestoneID,
		PayerID:     clientID,
		Amount:      m.Amount,
		Currency:    m.Currency,
	}
	if err := s.repo.CreatePaymentIntent(ctx, intent); err != nil {
		return nil, mapEscrowRepoError(err)
	}

	charge, err := s.gateway.CreateEscrowCharge(ctx, payments.EscrowChargeRequest{
		IntentID:         intent.ID,
		ContractID:       contractID,
		MilestoneID:      milestoneID,
		PayerID:          clientID,
		AmountMinorUnits: int64(m.Amount),
		Currency:         m.Currency,
	})
	if err != nil || strings.TrimSpace(charge.Reference) == "" {
		// Release the milestone for another attempt. The intent was never
		// charged, so failing it moves no money.
		_ = s.repo.FailPaymentIntent(ctx, intent.ID)
		return nil, ErrPaymentProvider
	}
	if err := s.repo.SetPaymentIntentReference(ctx, intent.ID, s.gateway.Name(), charge.Reference); err != nil {
		_ = s.repo.FailPaymentIntent(ctx, intent.ID)
		return nil, err
	}
	intent.Provider = s.gateway.Name()
	intent.ProviderReference = charge.Reference

	telemetry.LogUserAction(ctx, clientID.String(), domain.AuditMilestoneFunding, map[string]interface{}{
		"contractId":      contractID.String(),
		"milestoneId":     milestoneID.String(),
		"paymentIntentId": intent.ID.String(),
		"provider":        intent.Provider,
	})
	return &domain.FundingResult{Intent: *intent, CheckoutURL: charge.CheckoutURL}, nil
}

// VerifyPaymentWebhook checks the webhook came from the processor it claims.
func (s *escrowService) VerifyPaymentWebhook(provider string, payload []byte, headers http.Header) (payments.WebhookEvent, error) {
	if s.gateway == nil || !strings.EqualFold(provider, s.gateway.Name()) {
		return payments.WebhookEvent{}, ErrUnknownProvider
	}
	event, err := s.gateway.ParseWebhook(payload, headers)
	if err != nil {
		return payments.WebhookEvent{}, fmt.Errorf("%w: %v", ErrWebhookRejected, err)
	}
	return event, nil
}

// HandlePaymentWebhook applies a verified processor notification.
//
// Idempotent, because processors redeliver until acknowledged: a second
// "succeeded" for money already held changes nothing and is acknowledged.
func (s *escrowService) HandlePaymentWebhook(ctx context.Context, provider string, event payments.WebhookEvent) error {
	if s.gateway == nil || !strings.EqualFold(provider, s.gateway.Name()) {
		return ErrUnknownProvider
	}
	name := s.gateway.Name()

	switch event.Kind {
	case payments.ChargeSucceeded:
		outcome, err := s.repo.ConfirmPaymentHeld(ctx, name, event.Reference)
		if err != nil {
			if errors.Is(err, repository.ErrIntentNotFound) {
				return domain.ErrNotFound
			}
			return mapEscrowRepoError(err)
		}
		if outcome.AlreadyApplied {
			return nil
		}
		telemetry.LogUserAction(ctx, outcome.Intent.PayerID.String(), domain.AuditMilestoneFunded, map[string]interface{}{
			"contractId":      outcome.Milestone.ContractID.String(),
			"milestoneId":     outcome.Milestone.ID.String(),
			"paymentIntentId": outcome.Intent.ID.String(),
		})
		s.publish(ctx, domain.EventMilestoneFunded, map[string]interface{}{
			"contract_id":        outcome.Milestone.ContractID.String(),
			"milestone_id":       outcome.Milestone.ID.String(),
			"contract_activated": outcome.ContractActivated,
		})
		return nil

	case payments.ChargeFailed:
		intent, changed, err := s.repo.MarkPaymentFailed(ctx, name, event.Reference)
		if err != nil {
			if errors.Is(err, repository.ErrIntentNotFound) {
				return domain.ErrNotFound
			}
			return mapEscrowRepoError(err)
		}
		if !changed {
			return nil
		}
		telemetry.LogUserAction(ctx, intent.PayerID.String(), domain.AuditPaymentFailed, map[string]interface{}{
			"contractId":      intent.ContractID.String(),
			"paymentIntentId": intent.ID.String(),
		})
		payload := map[string]interface{}{"contract_id": intent.ContractID.String()}
		if intent.MilestoneID != nil {
			payload["milestone_id"] = intent.MilestoneID.String()
		}
		s.publish(ctx, domain.EventPaymentFailed, payload)
		return nil
	}
	return fmt.Errorf("%w: %s", ErrWebhookRejected, event.Kind)
}

// SubmitMilestone is the freelancer delivering the work for a funded milestone.
//
// Only a funded milestone can be delivered against: the point of escrow is that
// the freelancer never works on a step nobody has paid for.
func (s *escrowService) SubmitMilestone(ctx context.Context, freelancerID, contractID, milestoneID uuid.UUID, payload domain.SubmitMilestonePayload) (*domain.ContractMilestone, error) {
	contract, err := s.asFreelancer(ctx, freelancerID, contractID)
	if err != nil {
		return nil, err
	}
	m, err := s.milestoneOf(ctx, contract, milestoneID)
	if err != nil {
		return nil, err
	}
	if !m.Status.CanTransitionTo(domain.MilestoneSubmitted) || m.Status == domain.MilestoneSubmitted {
		return nil, transitionRefused(m.Status, string(domain.MilestoneSubmitted))
	}
	if err := checkText("summary", payload.Summary, true, maxDeliverySummary); err != nil {
		return nil, err
	}
	attachments, err := normalizeAttachments(payload.Attachments)
	if err != nil {
		return nil, err
	}

	delivery := &domain.Delivery{
		ContractID:  contractID,
		SubmittedBy: freelancerID,
		Summary:     strings.TrimSpace(payload.Summary),
		Attachments: attachments,
	}
	if err := s.repo.SubmitMilestone(ctx, milestoneID, delivery); err != nil {
		return nil, mapEscrowRepoError(err)
	}
	m.Status = domain.MilestoneSubmitted

	telemetry.LogUserAction(ctx, freelancerID.String(), domain.AuditMilestoneSubmitted, map[string]interface{}{
		"contractId":  contractID.String(),
		"milestoneId": milestoneID.String(),
		"deliveryId":  delivery.ID.String(),
	})
	s.publish(ctx, domain.EventMilestoneSubmitted, map[string]interface{}{
		"contract_id":  contractID.String(),
		"milestone_id": milestoneID.String(),
		"client_id":    contract.ClientID.String(),
	})
	return m, nil
}

// normalizeAttachments trims and bounds the links a delivery carries. They are
// URLs to work stored elsewhere (the media module's uploads, a repository);
// this module stores the references, not the files.
func normalizeAttachments(raw []string) ([]string, error) {
	out := make([]string, 0, len(raw))
	for _, link := range raw {
		trimmed := strings.TrimSpace(link)
		if trimmed == "" {
			continue
		}
		if utf8.RuneCountInString(trimmed) > maxAttachmentLen {
			return nil, domain.NewValidationError("attachments", "contains a link that is too long")
		}
		if !strings.HasPrefix(trimmed, "https://") && !strings.HasPrefix(trimmed, "http://") {
			return nil, domain.NewValidationError("attachments", "must be http(s) links")
		}
		out = append(out, trimmed)
	}
	if len(out) > maxAttachments {
		return nil, domain.NewValidationError("attachments", fmt.Sprintf("cannot have more than %d links", maxAttachments))
	}
	return out, nil
}

// RequestRevision sends a submitted milestone back to the freelancer.
func (s *escrowService) RequestRevision(ctx context.Context, clientID, contractID, milestoneID uuid.UUID, payload domain.RequestRevisionPayload) (*domain.ContractMilestone, error) {
	contract, err := s.asClient(ctx, clientID, contractID)
	if err != nil {
		return nil, err
	}
	m, err := s.milestoneOf(ctx, contract, milestoneID)
	if err != nil {
		return nil, err
	}
	if m.Status != domain.MilestoneSubmitted {
		return nil, transitionRefused(m.Status, string(domain.MilestoneInProgress))
	}
	if err := checkText("reason", payload.Reason, true, maxRevisionReasonLen); err != nil {
		return nil, err
	}
	if err := s.repo.RequestMilestoneRevision(ctx, milestoneID); err != nil {
		return nil, mapEscrowRepoError(err)
	}
	m.Status = domain.MilestoneInProgress

	// The reason goes to the freelancer through the event, not into the audit
	// log: it is part of the conversation between the parties, not a record of
	// who changed whose standing.
	telemetry.LogUserAction(ctx, clientID.String(), domain.AuditMilestoneRevision, map[string]interface{}{
		"contractId":  contractID.String(),
		"milestoneId": milestoneID.String(),
	})
	s.publish(ctx, domain.EventMilestoneRevision, map[string]interface{}{
		"contract_id":   contractID.String(),
		"milestone_id":  milestoneID.String(),
		"freelancer_id": contract.FreelancerID.String(),
		"reason":        strings.TrimSpace(payload.Reason),
	})
	return m, nil
}

// ApproveMilestone accepts the submitted work and releases the escrowed money.
//
// Approval and release are one act and one transaction: the milestone and its
// payment move to released, and a payout is recorded as owed to the freelancer.
// Recording it is as far as this goes - sending it needs a processor - so the
// payout is pending until that exists.
func (s *escrowService) ApproveMilestone(ctx context.Context, clientID, contractID, milestoneID uuid.UUID) (*domain.ContractMilestone, error) {
	contract, err := s.asClient(ctx, clientID, contractID)
	if err != nil {
		return nil, err
	}
	m, err := s.milestoneOf(ctx, contract, milestoneID)
	if err != nil {
		return nil, err
	}
	if m.Status != domain.MilestoneSubmitted {
		return nil, transitionRefused(m.Status, string(domain.MilestoneReleased))
	}

	payout := &domain.Payout{
		ContractID: &contractID,
		PayeeID:    contract.FreelancerID,
		Amount:     m.Amount,
		Currency:   m.Currency,
	}
	outcome, err := s.repo.ReleaseMilestone(ctx, milestoneID, payout)
	if err != nil {
		return nil, mapEscrowRepoError(err)
	}

	telemetry.LogUserAction(ctx, clientID.String(), domain.AuditMilestoneReleased, map[string]interface{}{
		"contractId":  contractID.String(),
		"milestoneId": milestoneID.String(),
		"payoutId":    outcome.Payout.ID.String(),
	})
	s.publish(ctx, domain.EventMilestoneReleased, map[string]interface{}{
		"contract_id":   contractID.String(),
		"milestone_id":  milestoneID.String(),
		"freelancer_id": contract.FreelancerID.String(),
		"payout_id":     outcome.Payout.ID.String(),
	})
	if outcome.ContractCompleted {
		telemetry.LogUserAction(ctx, clientID.String(), domain.AuditContractCompleted, map[string]interface{}{
			"contractId": contractID.String(),
		})
		s.publish(ctx, domain.EventContractComplete, map[string]interface{}{
			"contract_id":   contractID.String(),
			"project_id":    contract.ProjectID.String(),
			"client_id":     contract.ClientID.String(),
			"freelancer_id": contract.FreelancerID.String(),
		})
	}
	released := outcome.Milestone
	return &released, nil
}
