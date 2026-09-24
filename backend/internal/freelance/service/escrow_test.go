package service

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/payments"
	"kirmya/internal/freelance/repository"

	"github.com/google/uuid"
)

// The escrow flow, against the repository's no-database path so it runs in the
// fast unit gate. The PostgreSQL half - the locks, guarded updates and the
// unique index that make the same rules hold under concurrency - is exercised in
// test/ci/freelance_escrow_test.go.

const contractValue = domain.Amount(100000) // 1,000.00 AED

type escrowFixture struct {
	repo       repository.FreelanceRepository
	escrow     EscrowService
	client     uuid.UUID
	freelancer uuid.UUID
	stranger   uuid.UUID
	contract   *domain.Contract
}

// hiredContract walks the marketplace up to a signed contract: a client posts
// and publishes a project, an onboarded freelancer bids, the client accepts.
func hiredContract(t *testing.T, gateway payments.Gateway) *escrowFixture {
	t.Helper()
	ctx := context.Background()
	repo := repository.NewFreelanceRepository(nil)
	market := NewFreelanceService(repo)
	f := &escrowFixture{
		repo:       repo,
		escrow:     NewEscrowService(repo, gateway, nil),
		client:     uuid.New(),
		freelancer: uuid.New(),
		stranger:   uuid.New(),
	}

	proj, err := market.CreateProject(ctx, f.client, draftProject())
	if err != nil {
		t.Fatalf("create project: %v", err)
	}
	for _, status := range []string{"published", "accepting_proposals"} {
		s := status
		if _, err := market.UpdateOwnProject(ctx, f.client, proj.ID, domain.UpdateProjectPayload{Status: &s}); err != nil {
			t.Fatalf("move project to %s: %v", status, err)
		}
	}
	if _, err := market.SaveProfile(ctx, f.freelancer, completeDraft()); err != nil {
		t.Fatalf("save profile: %v", err)
	}
	if _, err := market.CompleteOnboarding(ctx, f.freelancer); err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}
	prop, err := market.SubmitProposal(ctx, f.freelancer, proj.ID, domain.SubmitProposalPayload{
		BidAmount: contractValue, EstimatedDays: 14, CoverLetter: "I have built this twice before.",
	})
	if err != nil {
		t.Fatalf("submit proposal: %v", err)
	}
	f.contract, err = market.AcceptProposal(ctx, f.client, prop.ID)
	if err != nil {
		t.Fatalf("accept proposal: %v", err)
	}
	return f
}

func sandbox() payments.Gateway { return payments.NewSandboxGateway("test-secret") }

func (f *escrowFixture) addMilestone(t *testing.T, title string, amount domain.Amount) *domain.ContractMilestone {
	t.Helper()
	m, err := f.escrow.AddMilestone(context.Background(), f.client, f.contract.ID,
		domain.CreateMilestonePayload{Title: title, Amount: amount})
	if err != nil {
		t.Fatalf("add milestone %q: %v", title, err)
	}
	return m
}

// fund asks for the charge and then plays the processor confirming it.
func (f *escrowFixture) fund(t *testing.T, milestoneID uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	result, err := f.escrow.FundMilestone(ctx, f.client, f.contract.ID, milestoneID)
	if err != nil {
		t.Fatalf("fund milestone: %v", err)
	}
	if err := f.escrow.HandlePaymentWebhook(ctx, payments.SandboxName, payments.WebhookEvent{
		Kind: payments.ChargeSucceeded, Reference: result.Intent.ProviderReference,
	}); err != nil {
		t.Fatalf("confirm payment: %v", err)
	}
}

func (f *escrowFixture) submit(t *testing.T, milestoneID uuid.UUID) {
	t.Helper()
	if _, err := f.escrow.SubmitMilestone(context.Background(), f.freelancer, f.contract.ID, milestoneID,
		domain.SubmitMilestonePayload{Summary: "Done; see the pull request.", Attachments: []string{"https://example.com/pr/1"}}); err != nil {
		t.Fatalf("submit milestone: %v", err)
	}
}

func (f *escrowFixture) detail(t *testing.T) *domain.ContractDetail {
	t.Helper()
	d, err := f.escrow.GetContract(context.Background(), f.client, f.contract.ID)
	if err != nil {
		t.Fatalf("get contract: %v", err)
	}
	return d
}

func milestoneIn(t *testing.T, d *domain.ContractDetail, id uuid.UUID) domain.ContractMilestone {
	t.Helper()
	for _, m := range d.Milestones {
		if m.ID == id {
			return m
		}
	}
	t.Fatalf("milestone %s not on the contract", id)
	return domain.ContractMilestone{}
}

// The whole path, from an unfunded schedule to a completed contract, with the
// escrow totals checked at each step that moves money.
func TestEscrowHappyPath(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())

	design := f.addMilestone(t, "Design", 60000)
	build := f.addMilestone(t, "Build", 40000)
	if d := f.detail(t); d.Escrow.Allocated != contractValue || d.Escrow.Unallocated != 0 || d.Escrow.InEscrow != 0 {
		t.Fatalf("after scheduling: escrow = %+v", d.Escrow)
	}

	f.fund(t, design.ID)
	d := f.detail(t)
	if got := milestoneIn(t, d, design.ID).Status; got != domain.MilestoneFunded {
		t.Fatalf("funded milestone status = %q", got)
	}
	if d.Status != domain.ContractActive {
		t.Fatalf("contract status after first funding = %q, want active", d.Status)
	}
	if d.Escrow.InEscrow != 60000 {
		t.Fatalf("in escrow = %d, want 60000", d.Escrow.InEscrow)
	}

	// Submitted, sent back once, submitted again, approved.
	f.submit(t, design.ID)
	if _, err := f.escrow.RequestRevision(ctx, f.client, f.contract.ID, design.ID,
		domain.RequestRevisionPayload{Reason: "The mobile layout is missing."}); err != nil {
		t.Fatalf("request revision: %v", err)
	}
	if got := milestoneIn(t, f.detail(t), design.ID).Status; got != domain.MilestoneInProgress {
		t.Fatalf("status after revision request = %q, want in_progress", got)
	}
	f.submit(t, design.ID)
	released, err := f.escrow.ApproveMilestone(ctx, f.client, f.contract.ID, design.ID)
	if err != nil {
		t.Fatalf("approve: %v", err)
	}
	if released.Status != domain.MilestoneReleased || released.CompletedAt == nil {
		t.Fatalf("approved milestone = %+v", released)
	}
	d = f.detail(t)
	if d.Status != domain.ContractActive {
		t.Fatalf("contract completed with a milestone still open: %q", d.Status)
	}
	if d.Escrow.Released != 60000 || d.Escrow.InEscrow != 0 {
		t.Fatalf("after first release: escrow = %+v", d.Escrow)
	}

	f.fund(t, build.ID)
	f.submit(t, build.ID)
	if _, err := f.escrow.ApproveMilestone(ctx, f.client, f.contract.ID, build.ID); err != nil {
		t.Fatalf("approve final: %v", err)
	}
	d = f.detail(t)
	if d.Status != domain.ContractCompleted {
		t.Fatalf("contract status after the last release = %q, want completed", d.Status)
	}
	if d.Escrow.Released != contractValue {
		t.Fatalf("released = %d, want the whole contract", d.Escrow.Released)
	}
}

// Asking to fund a milestone does not fund it. Only the processor's
// confirmation does - otherwise a client could mark its own work paid.
func TestFundingRequestAloneDoesNotFund(t *testing.T) {
	f := hiredContract(t, sandbox())
	m := f.addMilestone(t, "Design", 50000)

	result, err := f.escrow.FundMilestone(context.Background(), f.client, f.contract.ID, m.ID)
	if err != nil {
		t.Fatalf("fund: %v", err)
	}
	if result.Intent.Status != domain.PaymentRequiresPayment || result.Intent.ProviderReference == "" {
		t.Fatalf("intent = %+v", result.Intent)
	}
	if got := milestoneIn(t, f.detail(t), m.ID).Status; got != domain.MilestonePending {
		t.Fatalf("milestone status before confirmation = %q, want pending", got)
	}
	if f.detail(t).Status != domain.ContractPending {
		t.Fatal("the contract started before any money was confirmed")
	}
}

// A processor redelivers until acknowledged. The second "succeeded" must be
// acknowledged without changing anything.
func TestRepeatedConfirmationIsHarmless(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())
	m := f.addMilestone(t, "Design", 50000)
	result, err := f.escrow.FundMilestone(ctx, f.client, f.contract.ID, m.ID)
	if err != nil {
		t.Fatalf("fund: %v", err)
	}
	event := payments.WebhookEvent{Kind: payments.ChargeSucceeded, Reference: result.Intent.ProviderReference}
	for i := 0; i < 3; i++ {
		if err := f.escrow.HandlePaymentWebhook(ctx, payments.SandboxName, event); err != nil {
			t.Fatalf("delivery %d: %v", i+1, err)
		}
	}
	if d := f.detail(t); d.Escrow.InEscrow != 50000 {
		t.Fatalf("in escrow after repeated confirmations = %d, want 50000", d.Escrow.InEscrow)
	}
}

// Nobody outside the contract learns it exists, and each party may only do its
// own half.
func TestEscrowAuthorization(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())
	m := f.addMilestone(t, "Design", 50000)

	// A stranger: not found, for every operation.
	strangerCalls := map[string]error{}
	_, strangerCalls["get"] = f.escrow.GetContract(ctx, f.stranger, f.contract.ID)
	_, strangerCalls["add"] = f.escrow.AddMilestone(ctx, f.stranger, f.contract.ID, domain.CreateMilestonePayload{Title: "x", Amount: 1})
	_, strangerCalls["fund"] = f.escrow.FundMilestone(ctx, f.stranger, f.contract.ID, m.ID)
	_, strangerCalls["submit"] = f.escrow.SubmitMilestone(ctx, f.stranger, f.contract.ID, m.ID, domain.SubmitMilestonePayload{Summary: "x"})
	_, strangerCalls["approve"] = f.escrow.ApproveMilestone(ctx, f.stranger, f.contract.ID, m.ID)
	_, strangerCalls["cancel"] = f.escrow.CancelMilestone(ctx, f.stranger, f.contract.ID, m.ID)
	for op, err := range strangerCalls {
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("stranger %s: err = %v, want ErrNotFound", op, err)
		}
	}

	// The freelancer can see the contract but cannot schedule, pay or approve.
	if _, err := f.escrow.GetContract(ctx, f.freelancer, f.contract.ID); err != nil {
		t.Errorf("freelancer reading their contract: %v", err)
	}
	freelancerCalls := map[string]error{}
	_, freelancerCalls["add"] = f.escrow.AddMilestone(ctx, f.freelancer, f.contract.ID, domain.CreateMilestonePayload{Title: "x", Amount: 1})
	_, freelancerCalls["fund"] = f.escrow.FundMilestone(ctx, f.freelancer, f.contract.ID, m.ID)
	_, freelancerCalls["approve"] = f.escrow.ApproveMilestone(ctx, f.freelancer, f.contract.ID, m.ID)
	_, freelancerCalls["revision"] = f.escrow.RequestRevision(ctx, f.freelancer, f.contract.ID, m.ID, domain.RequestRevisionPayload{Reason: "x"})
	for op, err := range freelancerCalls {
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("freelancer %s: err = %v, want ErrForbidden", op, err)
		}
	}

	// The client cannot deliver work on their own contract.
	f.fund(t, m.ID)
	if _, err := f.escrow.SubmitMilestone(ctx, f.client, f.contract.ID, m.ID,
		domain.SubmitMilestonePayload{Summary: "x"}); !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("client submitting work: err = %v, want ErrForbidden", err)
	}
}

// A milestone id from another contract, reached through this contract's URL,
// is not found - the caller's right to one contract is not a right to another.
func TestMilestoneMustBelongToThePathContract(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())
	other := hiredContract(t, sandbox())
	foreign := other.addMilestone(t, "Theirs", 50000)

	if _, err := f.escrow.FundMilestone(ctx, f.client, f.contract.ID, foreign.ID); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("funding another contract's milestone: err = %v, want ErrNotFound", err)
	}
}

func TestMilestonesCannotExceedTheContract(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())
	first := f.addMilestone(t, "Most of it", 90000)

	_, err := f.escrow.AddMilestone(ctx, f.client, f.contract.ID, domain.CreateMilestonePayload{Title: "Too much", Amount: 10001})
	var validation *domain.ValidationError
	if !errors.As(err, &validation) || validation.Field != "amount" {
		t.Fatalf("over-scheduling: err = %v, want a validation error on amount", err)
	}

	// Cancelling an unfunded milestone gives its share back.
	if _, err := f.escrow.CancelMilestone(ctx, f.client, f.contract.ID, first.ID); err != nil {
		t.Fatalf("cancel: %v", err)
	}
	f.addMilestone(t, "Now it fits", 100000)
}

func TestMilestoneInputIsValidated(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())
	cases := map[string]domain.CreateMilestonePayload{
		"title":  {Title: "  ", Amount: 100},
		"amount": {Title: "Zero", Amount: 0},
	}
	for field, payload := range cases {
		_, err := f.escrow.AddMilestone(ctx, f.client, f.contract.ID, payload)
		var validation *domain.ValidationError
		if !errors.As(err, &validation) || validation.Field != field {
			t.Errorf("%s: err = %v, want a validation error on %s", field, err, field)
		}
	}
}

// Escrow's promise to the freelancer: nobody works on a step that has not been
// paid for.
func TestUnfundedMilestoneCannotBeSubmitted(t *testing.T) {
	f := hiredContract(t, sandbox())
	m := f.addMilestone(t, "Design", 50000)

	_, err := f.escrow.SubmitMilestone(context.Background(), f.freelancer, f.contract.ID, m.ID,
		domain.SubmitMilestonePayload{Summary: "Done"})
	var transition *domain.TransitionError
	if !errors.As(err, &transition) {
		t.Fatalf("submitting unfunded work: err = %v, want a transition error", err)
	}
}

func TestWorkMustBeSubmittedBeforeItIsApproved(t *testing.T) {
	f := hiredContract(t, sandbox())
	m := f.addMilestone(t, "Design", 50000)
	f.fund(t, m.ID)

	_, err := f.escrow.ApproveMilestone(context.Background(), f.client, f.contract.ID, m.ID)
	var transition *domain.TransitionError
	if !errors.As(err, &transition) {
		t.Fatalf("approving undelivered work: err = %v, want a transition error", err)
	}
}

// One milestone, one live payment: a second click on "fund" must not become a
// second charge. After a failure the client may try again.
func TestOneLivePaymentPerMilestone(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())
	m := f.addMilestone(t, "Design", 50000)

	first, err := f.escrow.FundMilestone(ctx, f.client, f.contract.ID, m.ID)
	if err != nil {
		t.Fatalf("fund: %v", err)
	}
	if _, err := f.escrow.FundMilestone(ctx, f.client, f.contract.ID, m.ID); !errors.Is(err, domain.ErrConflict) {
		t.Fatalf("second funding while the first is in flight: err = %v, want ErrConflict", err)
	}

	if err := f.escrow.HandlePaymentWebhook(ctx, payments.SandboxName, payments.WebhookEvent{
		Kind: payments.ChargeFailed, Reference: first.Intent.ProviderReference,
	}); err != nil {
		t.Fatalf("failure webhook: %v", err)
	}
	if _, err := f.escrow.FundMilestone(ctx, f.client, f.contract.ID, m.ID); err != nil {
		t.Fatalf("retrying after a failed payment: %v", err)
	}
}

// A funded milestone holds the client's money; cancelling it would be a refund,
// which is not built. A pending one with a payment in flight cannot be
// cancelled either, or the money could land against a cancelled step.
func TestCancellationNeverStrandsMoney(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())

	inFlight := f.addMilestone(t, "In flight", 30000)
	if _, err := f.escrow.FundMilestone(ctx, f.client, f.contract.ID, inFlight.ID); err != nil {
		t.Fatalf("fund: %v", err)
	}
	if _, err := f.escrow.CancelMilestone(ctx, f.client, f.contract.ID, inFlight.ID); !errors.Is(err, domain.ErrConflict) {
		t.Errorf("cancelling with a payment in flight: err = %v, want ErrConflict", err)
	}

	funded := f.addMilestone(t, "Funded", 30000)
	f.fund(t, funded.ID)
	var transition *domain.TransitionError
	if _, err := f.escrow.CancelMilestone(ctx, f.client, f.contract.ID, funded.ID); !errors.As(err, &transition) {
		t.Errorf("cancelling a funded milestone: err = %v, want a transition error", err)
	}
}

// Without a processor, funding is refused rather than simulated.
func TestFundingWithoutAProcessorIsRefused(t *testing.T) {
	f := hiredContract(t, nil)
	m := f.addMilestone(t, "Design", 50000)
	if _, err := f.escrow.FundMilestone(context.Background(), f.client, f.contract.ID, m.ID); !errors.Is(err, ErrPaymentsUnavailable) {
		t.Fatalf("err = %v, want ErrPaymentsUnavailable", err)
	}
	if got := milestoneIn(t, f.detail(t), m.ID).Status; got != domain.MilestonePending {
		t.Fatalf("milestone status = %q, want pending", got)
	}
}

type failingGateway struct{ payments.Gateway }

func (failingGateway) CreateEscrowCharge(context.Context, payments.EscrowChargeRequest) (payments.EscrowCharge, error) {
	return payments.EscrowCharge{}, errors.New("processor unavailable")
}

// A processor error leaves nothing live, so the client can simply try again.
func TestProcessorErrorLeavesTheMilestoneFundable(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, failingGateway{sandbox()})
	m := f.addMilestone(t, "Design", 50000)
	if _, err := f.escrow.FundMilestone(ctx, f.client, f.contract.ID, m.ID); !errors.Is(err, ErrPaymentProvider) {
		t.Fatalf("err = %v, want ErrPaymentProvider", err)
	}

	if got := milestoneIn(t, f.detail(t), m.ID).Status; got != domain.MilestonePending {
		t.Fatalf("milestone status after a processor error = %q, want pending", got)
	}

	// The same milestone, once the processor is back.
	f.escrow = NewEscrowService(f.repo, sandbox(), nil)
	if _, err := f.escrow.FundMilestone(ctx, f.client, f.contract.ID, m.ID); err != nil {
		t.Fatalf("retry after the processor recovered: %v", err)
	}
}

func TestWebhooksForOtherProvidersOrChargesAreRefused(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, sandbox())

	if err := f.escrow.HandlePaymentWebhook(ctx, "someone-else", payments.WebhookEvent{
		Kind: payments.ChargeSucceeded, Reference: "sbx_x",
	}); !errors.Is(err, ErrUnknownProvider) {
		t.Errorf("other provider: err = %v, want ErrUnknownProvider", err)
	}
	if err := f.escrow.HandlePaymentWebhook(ctx, payments.SandboxName, payments.WebhookEvent{
		Kind: payments.ChargeSucceeded, Reference: "sbx_unknown",
	}); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("unknown charge: err = %v, want ErrNotFound", err)
	}
	if _, err := f.escrow.VerifyPaymentWebhook(payments.SandboxName, []byte(`{}`), http.Header{}); !errors.Is(err, ErrWebhookRejected) {
		t.Errorf("unsigned webhook: err = %v, want ErrWebhookRejected", err)
	}
}
