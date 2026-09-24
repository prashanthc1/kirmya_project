package service

import (
	"context"
	"errors"
	"testing"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/payments"

	"github.com/google/uuid"
)

// Disputes and refunds on the no-database path. The PostgreSQL half is in
// test/ci/freelance_disputes_test.go.

func disputePayload() domain.OpenDisputePayload {
	return domain.OpenDisputePayload{Reason: "quality", Detail: "The delivered pages do not match the agreed designs."}
}

// fundedAndSubmitted is a contract with one milestone for its whole value,
// funded, with work submitted against it.
func fundedAndSubmitted(t *testing.T, gateway payments.Gateway) (*escrowFixture, *domain.ContractMilestone) {
	t.Helper()
	f := hiredContract(t, gateway)
	m := f.addMilestone(t, "Everything", contractValue)
	f.fund(t, m.ID)
	f.submit(t, m.ID)
	return f, m
}

func (f *escrowFixture) open(t *testing.T, by uuid.UUID, milestoneID uuid.UUID) *domain.Dispute {
	t.Helper()
	d, err := f.escrow.OpenDispute(context.Background(), by, f.contract.ID, milestoneID, disputePayload())
	if err != nil {
		t.Fatalf("open dispute: %v", err)
	}
	return d
}

func isTransition(err error) bool {
	var transition *domain.TransitionError
	return errors.As(err, &transition)
}

// A dispute freezes the milestone: nothing moves its money while it is open.
func TestDisputeFreezesTheMilestone(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	f.open(t, f.client, m.ID)

	d := f.detail(t)
	if got := milestoneIn(t, d, m.ID).Status; got != domain.MilestoneDisputed {
		t.Fatalf("milestone status = %q, want disputed", got)
	}
	if d.Status != domain.ContractDisputed {
		t.Fatalf("contract status = %q, want disputed", d.Status)
	}
	if _, err := f.escrow.ApproveMilestone(ctx, f.client, f.contract.ID, m.ID); !isTransition(err) {
		t.Errorf("approving a disputed milestone: err = %v, want a transition error", err)
	}
	if _, err := f.escrow.RefundMilestone(ctx, f.freelancer, f.contract.ID, m.ID,
		domain.RefundMilestonePayload{Reason: "x"}); !isTransition(err) {
		t.Errorf("refunding a disputed milestone outside the dispute: err = %v, want a transition error", err)
	}
	if _, err := f.escrow.SubmitMilestone(ctx, f.freelancer, f.contract.ID, m.ID,
		domain.SubmitMilestonePayload{Summary: "again"}); !isTransition(err) {
		t.Errorf("submitting on a disputed milestone: err = %v, want a transition error", err)
	}
}

// Withdrawing returns everything to exactly where it was, and only the raiser
// may do it.
func TestWithdrawalRestoresThePreviousState(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	d := f.open(t, f.client, m.ID)

	if _, err := f.escrow.WithdrawDispute(ctx, f.freelancer, d.ID); !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("the other party withdrawing: err = %v, want ErrForbidden", err)
	}
	if _, err := f.escrow.WithdrawDispute(ctx, f.stranger, d.ID); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("a stranger withdrawing: err = %v, want ErrNotFound", err)
	}
	withdrawn, err := f.escrow.WithdrawDispute(ctx, f.client, d.ID)
	if err != nil {
		t.Fatalf("withdraw: %v", err)
	}
	if withdrawn.Status != domain.DisputeWithdrawn {
		t.Fatalf("dispute status = %q", withdrawn.Status)
	}
	detail := f.detail(t)
	if got := milestoneIn(t, detail, m.ID).Status; got != domain.MilestoneSubmitted {
		t.Fatalf("milestone after withdrawal = %q, want submitted (where it was)", got)
	}
	if detail.Status != domain.ContractActive {
		t.Fatalf("contract after withdrawal = %q, want active", detail.Status)
	}
	// And the flow carries on from there.
	if _, err := f.escrow.ApproveMilestone(ctx, f.client, f.contract.ID, m.ID); err != nil {
		t.Fatalf("approving after the dispute was withdrawn: %v", err)
	}
}

func TestOnlyEscrowedMilestonesCanBeDisputed(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())
	pending := f.addMilestone(t, "Unfunded", 50000)
	if _, err := f.escrow.OpenDispute(ctx, f.client, f.contract.ID, pending.ID, disputePayload()); !isTransition(err) {
		t.Errorf("disputing an unfunded milestone: err = %v, want a transition error", err)
	}

	released := f.addMilestone(t, "Released", 50000)
	f.fund(t, released.ID)
	f.submit(t, released.ID)
	if _, err := f.escrow.ApproveMilestone(ctx, f.client, f.contract.ID, released.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := f.escrow.OpenDispute(ctx, f.client, f.contract.ID, released.ID, disputePayload()); !isTransition(err) {
		t.Errorf("disputing a released milestone: err = %v, want a transition error", err)
	}
}

func TestOneOpenDisputePerContract(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())
	a := f.addMilestone(t, "A", 50000)
	b := f.addMilestone(t, "B", 50000)
	f.fund(t, a.ID)
	f.fund(t, b.ID)
	f.open(t, f.client, a.ID)
	if _, err := f.escrow.OpenDispute(ctx, f.freelancer, f.contract.ID, b.ID, disputePayload()); !errors.Is(err, domain.ErrConflict) {
		t.Fatalf("second open dispute: err = %v, want ErrConflict", err)
	}
}

func TestDisputeInputIsValidated(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	cases := map[string]domain.OpenDisputePayload{
		"reason": {Reason: "i-am-cross", Detail: "x"},
		"detail": {Reason: "quality", Detail: "   "},
	}
	for field, payload := range cases {
		_, err := f.escrow.OpenDispute(ctx, f.client, f.contract.ID, m.ID, payload)
		var validation *domain.ValidationError
		if !errors.As(err, &validation) || validation.Field != field {
			t.Errorf("%s: err = %v, want a validation error on %s", field, err, field)
		}
	}
	if _, err := f.escrow.OpenDispute(ctx, f.stranger, f.contract.ID, m.ID, disputePayload()); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("a stranger opening a dispute: err = %v, want ErrNotFound", err)
	}
}

// Both parties see and add evidence; nobody else does, and nothing is added
// once the dispute is decided.
func TestEvidence(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	d := f.open(t, f.client, m.ID)

	if _, err := f.escrow.AddEvidence(ctx, f.client, d.ID, domain.AddEvidencePayload{Body: "See the brief, section 3."}); err != nil {
		t.Fatalf("client note: %v", err)
	}
	if _, err := f.escrow.AddEvidence(ctx, f.freelancer, d.ID, domain.AddEvidencePayload{
		Kind: "link", FileURL: "https://example.com/approved-designs",
	}); err != nil {
		t.Fatalf("freelancer link: %v", err)
	}
	if _, err := f.escrow.AddEvidence(ctx, f.freelancer, d.ID, domain.AddEvidencePayload{
		Kind: "link", FileURL: "javascript:alert(1)",
	}); err == nil {
		t.Error("a non-http link was accepted as evidence")
	}
	if _, err := f.escrow.AddEvidence(ctx, f.stranger, d.ID, domain.AddEvidencePayload{Body: "x"}); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("a stranger adding evidence: err = %v, want ErrNotFound", err)
	}

	detail, err := f.escrow.GetDispute(ctx, f.freelancer, d.ID)
	if err != nil {
		t.Fatalf("freelancer reading the dispute: %v", err)
	}
	if len(detail.Evidence) != 2 || detail.Milestone == nil {
		t.Fatalf("dispute detail = %+v", detail)
	}

	if _, err := f.escrow.AdminResolveDispute(ctx, uuid.New(), d.ID, domain.ResolveDisputePayload{
		Outcome: "resume_work", Resolution: "Both designs were approved; continue.",
	}); err != nil {
		t.Fatal(err)
	}
	if _, err := f.escrow.AddEvidence(ctx, f.client, d.ID, domain.AddEvidencePayload{Body: "late"}); !isTransition(err) {
		t.Errorf("evidence after resolution: err = %v, want a transition error", err)
	}
}

func TestResolveReleasesToTheFreelancer(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	d := f.open(t, f.client, m.ID)

	resolved, err := f.escrow.AdminResolveDispute(ctx, uuid.New(), d.ID, domain.ResolveDisputePayload{
		Outcome: "release_to_freelancer", Resolution: "The work matches the approved designs.",
	})
	if err != nil {
		t.Fatalf("resolve: %v", err)
	}
	if resolved.Status != domain.DisputeResolved || resolved.Outcome != domain.OutcomeReleaseToFreelancer || resolved.ResolvedAt == nil {
		t.Fatalf("resolved dispute = %+v", resolved)
	}
	detail := f.detail(t)
	if got := milestoneIn(t, detail, m.ID).Status; got != domain.MilestoneReleased {
		t.Fatalf("milestone = %q, want released", got)
	}
	// It was the whole contract, so the contract is done.
	if detail.Status != domain.ContractCompleted || detail.Escrow.Released != contractValue {
		t.Fatalf("contract = %q, escrow = %+v", detail.Status, detail.Escrow)
	}
}

func TestResolveRefundsTheClient(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	d := f.open(t, f.freelancer, m.ID)

	if _, err := f.escrow.AdminResolveDispute(ctx, uuid.New(), d.ID, domain.ResolveDisputePayload{
		Outcome: "refund_to_client", Resolution: "Nothing matching the brief was delivered.",
	}); err != nil {
		t.Fatalf("resolve: %v", err)
	}
	detail := f.detail(t)
	if got := milestoneIn(t, detail, m.ID).Status; got != domain.MilestoneCancelled {
		t.Fatalf("milestone = %q, want cancelled", got)
	}
	if detail.Status != domain.ContractActive {
		t.Fatalf("contract = %q, want active", detail.Status)
	}
	if detail.Escrow.InEscrow != 0 || detail.Escrow.Released != 0 || detail.Escrow.Unallocated != contractValue {
		t.Fatalf("escrow after a refund = %+v", detail.Escrow)
	}
}

func TestResolveResumesWork(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	d := f.open(t, f.client, m.ID)

	if _, err := f.escrow.AdminResolveDispute(ctx, uuid.New(), d.ID, domain.ResolveDisputePayload{
		Outcome: "resume_work", Resolution: "Fix the two listed pages and resubmit.",
	}); err != nil {
		t.Fatalf("resolve: %v", err)
	}
	detail := f.detail(t)
	if got := milestoneIn(t, detail, m.ID).Status; got != domain.MilestoneInProgress {
		t.Fatalf("milestone = %q, want in_progress", got)
	}
	if detail.Escrow.InEscrow != contractValue {
		t.Fatalf("money left escrow on resume_work: %+v", detail.Escrow)
	}
	f.submit(t, m.ID)
	if _, err := f.escrow.ApproveMilestone(ctx, f.client, f.contract.ID, m.ID); err != nil {
		t.Fatalf("approving the resubmitted work: %v", err)
	}
}

func TestResolutionIsValidatedAndFinal(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	d := f.open(t, f.client, m.ID)
	admin := uuid.New()

	cases := map[string]domain.ResolveDisputePayload{
		"outcome":    {Outcome: "split_it", Resolution: "x"},
		"resolution": {Outcome: "resume_work", Resolution: " "},
	}
	for field, payload := range cases {
		_, err := f.escrow.AdminResolveDispute(ctx, admin, d.ID, payload)
		var validation *domain.ValidationError
		if !errors.As(err, &validation) || validation.Field != field {
			t.Errorf("%s: err = %v, want a validation error on %s", field, err, field)
		}
	}
	ok := domain.ResolveDisputePayload{Outcome: "release_to_freelancer", Resolution: "Delivered as agreed."}
	if _, err := f.escrow.AdminResolveDispute(ctx, admin, d.ID, ok); err != nil {
		t.Fatal(err)
	}
	if _, err := f.escrow.AdminResolveDispute(ctx, admin, d.ID,
		domain.ResolveDisputePayload{Outcome: "refund_to_client", Resolution: "Changed my mind."}); !isTransition(err) {
		t.Fatalf("deciding a dispute twice: err = %v, want a transition error", err)
	}
}

// The freelancer may give a funded milestone's money back; the client may not
// take it back alone.
func TestVoluntaryRefund(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())
	m := f.addMilestone(t, "Design", 40000)
	f.fund(t, m.ID)

	reason := domain.RefundMilestonePayload{Reason: "We agreed to stop here."}
	if _, err := f.escrow.RefundMilestone(ctx, f.client, f.contract.ID, m.ID, reason); !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("client refunding: err = %v, want ErrForbidden", err)
	}
	refunded, err := f.escrow.RefundMilestone(ctx, f.freelancer, f.contract.ID, m.ID, reason)
	if err != nil {
		t.Fatalf("freelancer refunding: %v", err)
	}
	if refunded.Status != domain.MilestoneCancelled {
		t.Fatalf("refunded milestone = %q, want cancelled", refunded.Status)
	}
	if d := f.detail(t); d.Escrow.InEscrow != 0 || d.Escrow.Allocated != 0 {
		t.Fatalf("escrow after refund = %+v", d.Escrow)
	}
	if _, err := f.escrow.RefundMilestone(ctx, f.freelancer, f.contract.ID, m.ID, reason); !isTransition(err) {
		t.Fatalf("refunding twice: err = %v, want a transition error", err)
	}

	pending := f.addMilestone(t, "Unfunded", 10000)
	if _, err := f.escrow.RefundMilestone(ctx, f.freelancer, f.contract.ID, pending.ID, reason); !isTransition(err) {
		t.Fatalf("refunding an unfunded milestone: err = %v, want a transition error", err)
	}
}

type refundFailingGateway struct{ payments.Gateway }

func (refundFailingGateway) RefundEscrowCharge(context.Context, payments.RefundRequest) (string, error) {
	return "", errors.New("processor unavailable")
}

// If the processor cannot return the money, nothing is recorded as refunded.
func TestFailedProcessorRefundChangesNothing(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, refundFailingGateway{sandbox()})
	d := f.open(t, f.client, m.ID)

	_, err := f.escrow.AdminResolveDispute(ctx, uuid.New(), d.ID, domain.ResolveDisputePayload{
		Outcome: "refund_to_client", Resolution: "Refund.",
	})
	if !errors.Is(err, ErrPaymentProvider) {
		t.Fatalf("err = %v, want ErrPaymentProvider", err)
	}
	detail := f.detail(t)
	if got := milestoneIn(t, detail, m.ID).Status; got != domain.MilestoneDisputed {
		t.Fatalf("milestone after a failed refund = %q, want still disputed", got)
	}
	if detail.Escrow.InEscrow != contractValue {
		t.Fatalf("escrow after a failed refund = %+v", detail.Escrow)
	}
	still, err := f.escrow.GetDispute(ctx, f.client, d.ID)
	if err != nil || still.Status != domain.DisputeOpen {
		t.Fatalf("dispute after a failed refund = %+v, %v", still, err)
	}
}

func TestAdminQueueDefaultsToOpenDisputes(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	d := f.open(t, f.client, m.ID)

	open, total, err := f.escrow.AdminListDisputes(ctx, "", 20, 0)
	if err != nil || total != 1 || len(open) != 1 || open[0].ID != d.ID {
		t.Fatalf("open queue = %v (%d), %v", open, total, err)
	}
	if _, err := f.escrow.WithdrawDispute(ctx, f.client, d.ID); err != nil {
		t.Fatal(err)
	}
	if _, total, _ := f.escrow.AdminListDisputes(ctx, "open", 20, 0); total != 0 {
		t.Fatalf("withdrawn dispute still in the open queue (%d)", total)
	}
	if _, total, _ := f.escrow.AdminListDisputes(ctx, "all", 20, 0); total != 1 {
		t.Fatalf("all disputes = %d, want 1", total)
	}
	if _, _, err := f.escrow.AdminListDisputes(ctx, "nonsense", 20, 0); err == nil {
		t.Fatal("an unknown status filter was accepted")
	}
}
