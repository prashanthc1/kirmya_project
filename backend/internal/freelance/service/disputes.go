package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/payments"
	"kirmya/internal/freelance/repository"
	"kirmya/internal/shared/telemetry"

	"github.com/google/uuid"
)

// Disputes and refunds.
//
//	either party opens a dispute on a funded milestone   milestone, contract, project: disputed
//	both parties add evidence while it is open
//	the raiser withdraws it                               everything returns to where it was
//	an administrator decides it:
//	  release_to_freelancer                               released, payout recorded
//	  refund_to_client                                    refunded through the processor, cancelled
//	  resume_work                                         in_progress, money stays in escrow
//
//	the freelancer refunds a funded milestone             refunded, cancelled
//
// A client cannot pull funded money back alone: the freelancer may have done the
// work. That is what a dispute is for.

// Field bounds, matching migration 0102's columns where it declares them.
const (
	maxDisputeDetailLen  = 8000
	maxEvidenceBodyLen   = 8000
	maxResolutionLen     = 4000
	maxRefundReasonLen   = 2000
	defaultDisputeFilter = "open"
)

// refundFunc builds the processor call the repository makes while the escrow
// rows are locked. The money must be refunded through the processor that holds
// it; a deployment without that processor cannot refund, and says so rather
// than recording a refund that never happened.
func (s *escrowService) refundFunc() repository.RefundFunc {
	return func(ctx context.Context, intent domain.PaymentIntent) (string, error) {
		if s.gateway == nil || !strings.EqualFold(intent.Provider, s.gateway.Name()) {
			return "", ErrPaymentsUnavailable
		}
		reference, err := s.gateway.RefundEscrowCharge(ctx, payments.RefundRequest{
			IntentID:         intent.ID,
			Reference:        intent.ProviderReference,
			AmountMinorUnits: int64(intent.Amount),
			Currency:         intent.Currency,
		})
		if err != nil || strings.TrimSpace(reference) == "" {
			return "", ErrPaymentProvider
		}
		return reference, nil
	}
}

func mapDisputeRepoError(err error) error {
	switch {
	case errors.Is(err, repository.ErrDisputeNotFound):
		return domain.ErrNotFound
	case errors.Is(err, repository.ErrDisputeAlreadyOpen):
		return fmt.Errorf("%w: %s", domain.ErrConflict, repository.ErrDisputeAlreadyOpen.Error())
	}
	return mapEscrowRepoError(err)
}

// disputeFor loads a dispute on a contract the caller is a party to. A stranger
// is told it does not exist.
func (s *escrowService) disputeFor(ctx context.Context, userID, disputeID uuid.UUID) (*domain.Dispute, *domain.Contract, error) {
	if userID == uuid.Nil {
		return nil, nil, domain.ErrUnauthenticated
	}
	d, err := s.repo.GetDispute(ctx, disputeID)
	if err != nil {
		return nil, nil, mapDisputeRepoError(err)
	}
	contract, err := s.contractFor(ctx, userID, d.ContractID)
	if err != nil {
		return nil, nil, err
	}
	return d, contract, nil
}

// OpenDispute raises a dispute on a milestone whose money is in escrow.
//
// Either party may. The milestone must hold escrow - there is nothing to decide
// over an unfunded one, and a released one is settled - and the contract may
// have only one open dispute at a time.
func (s *escrowService) OpenDispute(ctx context.Context, userID, contractID, milestoneID uuid.UUID, payload domain.OpenDisputePayload) (*domain.Dispute, error) {
	contract, err := s.contractFor(ctx, userID, contractID)
	if err != nil {
		return nil, err
	}
	m, err := s.milestoneOf(ctx, contract, milestoneID)
	if err != nil {
		return nil, err
	}
	if !m.Status.HoldsEscrow() {
		return nil, transitionRefused(m.Status, string(domain.MilestoneDisputed))
	}
	reason, ok := domain.ParseDisputeReason(payload.Reason)
	if !ok {
		return nil, domain.NewValidationError("reason",
			"must be one of work_not_delivered, quality, scope, unresponsive, other")
	}
	if err := checkText("detail", payload.Detail, true, maxDisputeDetailLen); err != nil {
		return nil, err
	}

	d := &domain.Dispute{
		ContractID:  contractID,
		MilestoneID: &milestoneID,
		RaisedBy:    userID,
		Reason:      reason,
		Detail:      strings.TrimSpace(payload.Detail),
	}
	if err := s.repo.OpenDispute(ctx, d); err != nil {
		return nil, mapDisputeRepoError(err)
	}

	telemetry.LogUserAction(ctx, userID.String(), domain.AuditDisputeOpened, map[string]interface{}{
		"contractId":  contractID.String(),
		"milestoneId": milestoneID.String(),
		"disputeId":   d.ID.String(),
		"reason":      string(reason),
	})
	s.publish(ctx, domain.EventDisputeOpened, map[string]interface{}{
		"dispute_id":    d.ID.String(),
		"contract_id":   contractID.String(),
		"milestone_id":  milestoneID.String(),
		"raised_by":     userID.String(),
		"client_id":     contract.ClientID.String(),
		"freelancer_id": contract.FreelancerID.String(),
	})
	return d, nil
}

// ListContractDisputes returns a contract's disputes to either party.
func (s *escrowService) ListContractDisputes(ctx context.Context, userID, contractID uuid.UUID) ([]domain.Dispute, error) {
	if _, err := s.contractFor(ctx, userID, contractID); err != nil {
		return nil, err
	}
	return s.repo.ListContractDisputes(ctx, contractID)
}

// GetDispute returns a dispute, its milestone and all its evidence to either
// party. Both sides see everything submitted: a decision made on evidence one
// party never saw is not one they can answer.
func (s *escrowService) GetDispute(ctx context.Context, userID, disputeID uuid.UUID) (*domain.DisputeDetail, error) {
	d, _, err := s.disputeFor(ctx, userID, disputeID)
	if err != nil {
		return nil, err
	}
	return s.disputeDetail(ctx, d)
}

func (s *escrowService) disputeDetail(ctx context.Context, d *domain.Dispute) (*domain.DisputeDetail, error) {
	detail := &domain.DisputeDetail{Dispute: *d, Evidence: []domain.DisputeEvidence{}}
	if d.MilestoneID != nil {
		if m, err := s.repo.GetContractMilestone(ctx, *d.MilestoneID); err == nil {
			detail.Milestone = m
		}
	}
	evidence, err := s.repo.ListDisputeEvidence(ctx, d.ID)
	if err != nil {
		return nil, err
	}
	detail.Evidence = evidence
	return detail, nil
}

// AddEvidence adds a note, a link or a file reference to an open dispute.
func (s *escrowService) AddEvidence(ctx context.Context, userID, disputeID uuid.UUID, payload domain.AddEvidencePayload) (*domain.DisputeEvidence, error) {
	d, _, err := s.disputeFor(ctx, userID, disputeID)
	if err != nil {
		return nil, err
	}
	if !d.Status.IsOpen() {
		return nil, &domain.TransitionError{Entity: "dispute", From: string(d.Status), To: "evidence added"}
	}
	kind, ok := domain.ParseEvidenceKind(payload.Kind)
	if !ok {
		return nil, domain.NewValidationError("kind", "must be note, link or file")
	}
	body := strings.TrimSpace(payload.Body)
	fileURL := strings.TrimSpace(payload.FileURL)
	switch kind {
	case domain.EvidenceNote:
		if err := checkText("body", body, true, maxEvidenceBodyLen); err != nil {
			return nil, err
		}
		fileURL = ""
	default:
		links, err := normalizeAttachments([]string{fileURL})
		if err != nil || len(links) != 1 {
			return nil, domain.NewValidationError("file_url", "must be an http(s) link")
		}
		if err := checkText("body", body, false, maxEvidenceBodyLen); err != nil {
			return nil, err
		}
	}

	e := &domain.DisputeEvidence{DisputeID: disputeID, UploadedBy: userID, Kind: kind, Body: body, FileURL: fileURL}
	if err := s.repo.AddDisputeEvidence(ctx, e); err != nil {
		return nil, mapDisputeRepoError(err)
	}
	telemetry.LogUserAction(ctx, userID.String(), domain.AuditDisputeEvidence, map[string]interface{}{
		"disputeId":  disputeID.String(),
		"evidenceId": e.ID.String(),
		"kind":       string(kind),
	})
	return e, nil
}

// WithdrawDispute is the raiser dropping their dispute. The other party cannot
// withdraw it for them.
func (s *escrowService) WithdrawDispute(ctx context.Context, userID, disputeID uuid.UUID) (*domain.Dispute, error) {
	d, _, err := s.disputeFor(ctx, userID, disputeID)
	if err != nil {
		return nil, err
	}
	if d.RaisedBy != userID {
		return nil, domain.ErrForbidden
	}
	if !d.Status.IsOpen() {
		return nil, &domain.TransitionError{Entity: "dispute", From: string(d.Status), To: string(domain.DisputeWithdrawn)}
	}
	withdrawn, err := s.repo.WithdrawDispute(ctx, disputeID)
	if err != nil {
		return nil, mapDisputeRepoError(err)
	}
	telemetry.LogUserAction(ctx, userID.String(), domain.AuditDisputeWithdrawn, map[string]interface{}{
		"disputeId":  disputeID.String(),
		"contractId": d.ContractID.String(),
	})
	s.publish(ctx, domain.EventDisputeWithdrawn, map[string]interface{}{
		"dispute_id":  disputeID.String(),
		"contract_id": d.ContractID.String(),
	})
	return withdrawn, nil
}

// RefundMilestone is the freelancer returning a funded milestone's money to the
// client, which cancels the milestone. Only the freelancer: it is their payment
// to give up. A milestone under dispute is refunded by the dispute's decision.
func (s *escrowService) RefundMilestone(ctx context.Context, freelancerID, contractID, milestoneID uuid.UUID, payload domain.RefundMilestonePayload) (*domain.ContractMilestone, error) {
	contract, err := s.asFreelancer(ctx, freelancerID, contractID)
	if err != nil {
		return nil, err
	}
	m, err := s.milestoneOf(ctx, contract, milestoneID)
	if err != nil {
		return nil, err
	}
	if !m.Status.HoldsEscrow() {
		return nil, transitionRefused(m.Status, "refunded")
	}
	if err := checkText("reason", payload.Reason, true, maxRefundReasonLen); err != nil {
		return nil, err
	}

	refunded, intent, err := s.repo.RefundMilestone(ctx, milestoneID, s.refundFunc())
	if err != nil {
		return nil, mapDisputeRepoError(err)
	}
	telemetry.LogUserAction(ctx, freelancerID.String(), domain.AuditMilestoneRefunded, map[string]interface{}{
		"contractId":      contractID.String(),
		"milestoneId":     milestoneID.String(),
		"paymentIntentId": intent.ID.String(),
		"by":              "freelancer",
	})
	s.publish(ctx, domain.EventMilestoneRefunded, map[string]interface{}{
		"contract_id":  contractID.String(),
		"milestone_id": milestoneID.String(),
		"client_id":    contract.ClientID.String(),
		"reason":       strings.TrimSpace(payload.Reason),
	})
	return refunded, nil
}

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

// AdminListDisputes is the queue, oldest first. status narrows it: "open" (the
// default) is every dispute still awaiting a decision, "all" is everything, and
// a single status name is that status.
func (s *escrowService) AdminListDisputes(ctx context.Context, status string, limit, offset int) ([]domain.Dispute, int, error) {
	var statuses []domain.DisputeStatus
	switch value := strings.ToLower(strings.TrimSpace(status)); value {
	case "", defaultDisputeFilter:
		statuses = []domain.DisputeStatus{
			domain.DisputeOpen, domain.DisputeUnderReview, domain.DisputeAwaitingEvidence, domain.DisputeEscalated,
		}
	case "all":
	default:
		parsed, ok := domain.ParseDisputeStatus(value)
		if !ok {
			return nil, 0, domain.NewValidationError("status", "is not a dispute status")
		}
		statuses = []domain.DisputeStatus{parsed}
	}
	return s.repo.ListDisputes(ctx, statuses, limit, offset)
}

// AdminGetDispute returns any dispute, with its evidence, to an administrator.
func (s *escrowService) AdminGetDispute(ctx context.Context, disputeID uuid.UUID) (*domain.DisputeDetail, error) {
	d, err := s.repo.GetDispute(ctx, disputeID)
	if err != nil {
		return nil, mapDisputeRepoError(err)
	}
	return s.disputeDetail(ctx, d)
}

// AdminResolveDispute applies an administrator's decision.
//
// The decision is one of three outcomes and always carries a written
// resolution: the parties are owed the reasoning, and migration 0102 refuses a
// resolved dispute without one. The whole decision - the money, the milestone,
// the dispute and the contract - commits as one transaction.
func (s *escrowService) AdminResolveDispute(ctx context.Context, adminID, disputeID uuid.UUID, payload domain.ResolveDisputePayload) (*domain.Dispute, error) {
	if adminID == uuid.Nil {
		return nil, domain.ErrUnauthenticated
	}
	outcome, ok := domain.ParseDisputeOutcome(payload.Outcome)
	if !ok {
		return nil, domain.NewValidationError("outcome", "must be release_to_freelancer, refund_to_client or resume_work")
	}
	if err := checkText("resolution", payload.Resolution, true, maxResolutionLen); err != nil {
		return nil, err
	}

	d, err := s.repo.GetDispute(ctx, disputeID)
	if err != nil {
		return nil, mapDisputeRepoError(err)
	}
	if !d.Status.IsOpen() {
		return nil, &domain.TransitionError{Entity: "dispute", From: string(d.Status), To: string(domain.DisputeResolved)}
	}
	contract, err := s.repo.GetContractByID(ctx, d.ContractID)
	if err != nil {
		return nil, mapEscrowRepoError(err)
	}

	var payout *domain.Payout
	if outcome == domain.OutcomeReleaseToFreelancer && d.MilestoneID != nil {
		m, err := s.repo.GetContractMilestone(ctx, *d.MilestoneID)
		if err != nil {
			return nil, mapEscrowRepoError(err)
		}
		payout = &domain.Payout{
			ContractID: &contract.ID,
			PayeeID:    contract.FreelancerID,
			Amount:     m.Amount,
			Currency:   m.Currency,
		}
	}

	result, err := s.repo.ResolveDispute(ctx, disputeID, repository.DisputeDecision{
		Outcome:    outcome,
		Resolution: strings.TrimSpace(payload.Resolution),
		ResolvedBy: adminID,
	}, payout, s.refundFunc())
	if err != nil {
		return nil, mapDisputeRepoError(err)
	}

	// The administrator, the dispute, and the decision - the entry somebody
	// reads when either party asks why the money went where it did.
	telemetry.LogUserAction(ctx, adminID.String(), domain.AuditDisputeDecided, map[string]interface{}{
		"disputeId":   disputeID.String(),
		"contractId":  d.ContractID.String(),
		"milestoneId": result.Milestone.ID.String(),
		"outcome":     string(outcome),
	})
	s.publish(ctx, domain.EventDisputeResolved, map[string]interface{}{
		"dispute_id":    disputeID.String(),
		"contract_id":   d.ContractID.String(),
		"milestone_id":  result.Milestone.ID.String(),
		"outcome":       string(outcome),
		"client_id":     contract.ClientID.String(),
		"freelancer_id": contract.FreelancerID.String(),
	})
	if result.ContractCompleted {
		s.publish(ctx, domain.EventContractComplete, map[string]interface{}{
			"contract_id":   d.ContractID.String(),
			"project_id":    contract.ProjectID.String(),
			"client_id":     contract.ClientID.String(),
			"freelancer_id": contract.FreelancerID.String(),
		})
	}
	resolved := result.Dispute
	return &resolved, nil
}
