package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/payments"
	"kirmya/internal/freelance/repository"

	"github.com/google/uuid"
)

// Sending payouts, against the no-database repository. The claim's row locking
// under concurrency is exercised against PostgreSQL in
// test/ci/freelance_payouts_test.go.

// payoutProcessor is the sandbox with a controllable payout half: accounts
// that are not ready until told, and sends that fail until told.
type payoutProcessor struct {
	*payments.SandboxGateway
	mu       sync.Mutex
	ready    bool
	failWith error
	sent     []payments.PayoutRequest
	link     string
}

func newPayoutProcessor() *payoutProcessor {
	return &payoutProcessor{SandboxGateway: payments.NewSandboxGateway("test-secret"), link: "https://processor.example/onboard"}
}

func (p *payoutProcessor) PayoutOnboardingLink(context.Context, string) (string, error) {
	return p.link, nil
}

func (p *payoutProcessor) GetPayoutAccount(_ context.Context, accountID string) (payments.PayoutAccountState, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	return payments.PayoutAccountState{
		AccountID: accountID, DetailsSubmitted: p.ready, PayoutsEnabled: p.ready, TransfersActive: p.ready,
	}, nil
}

func (p *payoutProcessor) SendPayout(ctx context.Context, req payments.PayoutRequest) (string, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.failWith != nil {
		return "", p.failWith
	}
	p.sent = append(p.sent, req)
	return p.SandboxGateway.SendPayout(ctx, req)
}

func (p *payoutProcessor) set(ready bool, failWith error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.ready, p.failWith = ready, failWith
}

// released walks one whole-contract milestone to release.
func released(t *testing.T, gateway payments.Gateway) (*escrowFixture, *domain.ContractMilestone) {
	t.Helper()
	f, m := fundedAndSubmitted(t, gateway)
	if _, err := f.escrow.ApproveMilestone(context.Background(), f.client, f.contract.ID, m.ID); err != nil {
		t.Fatalf("approve: %v", err)
	}
	return f, m
}

func (f *escrowFixture) payouts(t *testing.T) []domain.Payout {
	t.Helper()
	list, _, err := f.escrow.ListMyPayouts(context.Background(), f.freelancer, 50, 0)
	if err != nil {
		t.Fatalf("list payouts: %v", err)
	}
	return list
}

func (f *escrowFixture) onlyPayout(t *testing.T) domain.Payout {
	t.Helper()
	list := f.payouts(t)
	if len(list) != 1 {
		t.Fatalf("payouts = %d, want 1", len(list))
	}
	return list[0]
}

func (f *escrowFixture) send(t *testing.T) int {
	t.Helper()
	n, err := f.escrow.SendDuePayouts(context.Background())
	if err != nil {
		t.Fatalf("send: %v", err)
	}
	return n
}

func TestReleasedPayoutWaitsForAPayoutAccount(t *testing.T) {
	ctx := context.Background()
	proc := newPayoutProcessor()
	f, m := released(t, proc)

	p := f.onlyPayout(t)
	if p.Status != domain.PayoutPending || p.Amount != contractValue || p.MilestoneID == nil || *p.MilestoneID != m.ID || p.PaymentIntentID == nil {
		t.Fatalf("payout = %+v", p)
	}
	view, err := f.escrow.GetPayoutAccount(ctx, f.freelancer)
	if err != nil {
		t.Fatal(err)
	}
	if !view.Available || view.Status != domain.PayoutAccountNotStarted || view.Waiting["AED"] != contractValue {
		t.Fatalf("view = %+v", view)
	}
	// Nowhere to send it: nothing is sent.
	if n := f.send(t); n != 0 || len(proc.sent) != 0 {
		t.Fatalf("sent %d with no payout account", n)
	}
	if got := f.onlyPayout(t); got.Status != domain.PayoutPending || got.Attempts != 0 {
		t.Fatalf("payout = %+v", got)
	}
}

func TestOnboardingThenPayout(t *testing.T) {
	ctx := context.Background()
	proc := newPayoutProcessor()
	f, _ := released(t, proc)

	onboarding, err := f.escrow.StartPayoutOnboarding(ctx, f.freelancer)
	if err != nil {
		t.Fatalf("onboarding: %v", err)
	}
	if onboarding.URL != proc.link || onboarding.Account.Status != domain.PayoutAccountOnboarding {
		t.Fatalf("onboarding = %+v", onboarding)
	}
	// Starting again reuses the account.
	again, err := f.escrow.StartPayoutOnboarding(ctx, f.freelancer)
	if err != nil || again.Account.Account == nil || again.Account.Account.Provider != payments.SandboxName {
		t.Fatalf("second onboarding = %+v, %v", again, err)
	}

	// Not verified yet: still nothing is sent.
	if n := f.send(t); n != 0 {
		t.Fatalf("sent %d to an account that is not ready", n)
	}

	// The freelancer comes back and the processor says the account is ready.
	proc.set(true, nil)
	view, err := f.escrow.RefreshPayoutAccount(ctx, f.freelancer)
	if err != nil || view.Status != domain.PayoutAccountEnabled {
		t.Fatalf("refresh = %+v, %v", view, err)
	}
	if n := f.send(t); n != 1 {
		t.Fatalf("sent %d, want 1", n)
	}
	p := f.onlyPayout(t)
	if p.Status != domain.PayoutPaid || p.PaidAt == nil || p.ProviderReference == "" || p.Attempts != 1 {
		t.Fatalf("payout = %+v", p)
	}
	req := proc.sent[0]
	if req.PayoutID != p.ID || req.AmountMinorUnits != int64(contractValue) || req.Currency != "AED" ||
		req.Destination == "" || req.ContractID != f.contract.ID {
		t.Fatalf("send request = %+v", req)
	}
	// The payout is tied to the escrowed charge it was collected by.
	if req.SourceReference == "" {
		t.Error("the payout does not name the charge it is paid from")
	}
	// Paid once: another pass sends nothing.
	if n := f.send(t); n != 0 || len(proc.sent) != 1 {
		t.Fatalf("a paid payout was sent again")
	}
	if view, _ := f.escrow.GetPayoutAccount(ctx, f.freelancer); len(view.Waiting) != 0 {
		t.Errorf("waiting after payment = %+v", view.Waiting)
	}
}

func TestSandboxOnboardingNeedsNoForm(t *testing.T) {
	f, _ := released(t, sandbox())
	onboarding, err := f.escrow.StartPayoutOnboarding(context.Background(), f.freelancer)
	if err != nil {
		t.Fatal(err)
	}
	if onboarding.URL != "" || onboarding.Account.Status != domain.PayoutAccountEnabled {
		t.Fatalf("onboarding = %+v", onboarding)
	}
	if n := f.send(t); n != 1 {
		t.Fatalf("sent %d, want 1", n)
	}
}

func TestOnlyFreelancersSetUpPayouts(t *testing.T) {
	ctx := context.Background()
	f, _ := released(t, newPayoutProcessor())
	if _, err := f.escrow.StartPayoutOnboarding(ctx, f.client); !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("a client: err = %v, want ErrForbidden", err)
	}
	if _, err := f.escrow.StartPayoutOnboarding(ctx, uuid.Nil); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Fatalf("anonymous: err = %v", err)
	}
	// A client is owed nothing and sees nothing of the freelancer's payouts.
	if list, _, _ := f.escrow.ListMyPayouts(ctx, f.client, 50, 0); len(list) != 0 {
		t.Fatalf("the client sees %d payouts", len(list))
	}
}

func TestNoPayoutsWithoutAProcessor(t *testing.T) {
	ctx := context.Background()
	f := hiredContract(t, nil)
	if _, err := f.escrow.StartPayoutOnboarding(ctx, f.freelancer); !errors.Is(err, ErrPaymentsUnavailable) {
		t.Fatalf("err = %v, want ErrPaymentsUnavailable", err)
	}
	view, err := f.escrow.GetPayoutAccount(ctx, f.freelancer)
	if err != nil || view.Available {
		t.Fatalf("view = %+v, %v", view, err)
	}
	if n, err := f.escrow.SendDuePayouts(ctx); n != 0 || err != nil {
		t.Fatalf("send = %d, %v", n, err)
	}
}

// failingSends is a released payout to a ready account whose sends fail.
func failingSends(t *testing.T) (*escrowFixture, *payoutProcessor) {
	t.Helper()
	proc := newPayoutProcessor()
	proc.set(true, nil)
	f, _ := released(t, proc)
	if _, err := f.escrow.StartPayoutOnboarding(context.Background(), f.freelancer); err != nil {
		t.Fatal(err)
	}
	if view, err := f.escrow.RefreshPayoutAccount(context.Background(), f.freelancer); err != nil || view.Status != domain.PayoutAccountEnabled {
		t.Fatalf("refresh = %+v, %v", view, err)
	}
	proc.set(true, errors.New("stripe POST /v1/transfers: 400 balance_insufficient Insufficient funds"))
	return f, proc
}

func TestFailedSendWaitsForItsNextAttempt(t *testing.T) {
	f, _ := failingSends(t)
	if n := f.send(t); n != 0 {
		t.Fatalf("a refused send counted as paid")
	}
	p := f.onlyPayout(t)
	if p.Status != domain.PayoutPending || p.Attempts != 1 || p.NextAttemptAt == nil || !p.NextAttemptAt.After(time.Now()) {
		t.Fatalf("after one failure: %+v", p)
	}
	f.send(t)
	if got := f.onlyPayout(t); got.Attempts != 1 {
		t.Fatalf("retried before its time: attempts = %d", got.Attempts)
	}
}

func TestFailedSendsStopThenAnAdministratorRetries(t *testing.T) {
	ctx := context.Background()
	f, proc := failingSends(t)
	f.escrow.(*escrowService).payoutBackoff = []time.Duration{0}

	for attempt := 1; attempt <= maxPayoutAttempts+2; attempt++ {
		f.send(t)
	}
	p := f.onlyPayout(t)
	if p.Status != domain.PayoutFailed || p.Attempts != maxPayoutAttempts || p.NextAttemptAt != nil {
		t.Fatalf("after repeated failures: %+v", p)
	}
	// The administrator sees why; the payee's JSON never carries it.
	queue, total, err := f.escrow.AdminListPayouts(ctx, "", 50, 0)
	if err != nil || total != 1 || queue[0].LastError == "" {
		t.Fatalf("admin queue = %+v, %d, %v", queue, total, err)
	}
	if raw, _ := json.Marshal(p); strings.Contains(string(raw), "Insufficient") {
		t.Fatalf("the payee's payout carries the processor's error: %s", raw)
	}

	// Once fixed, an administrator retries it and it goes.
	proc.set(true, nil)
	retried, err := f.escrow.AdminRetryPayout(ctx, uuid.New(), p.ID)
	if err != nil || retried.Status != domain.PayoutPending || retried.Attempts != 0 {
		t.Fatalf("retry = %+v, %v", retried, err)
	}
	if n := f.send(t); n != 1 || f.onlyPayout(t).Status != domain.PayoutPaid {
		t.Fatalf("the retried payout was not sent")
	}
	if _, err := f.escrow.AdminRetryPayout(ctx, uuid.New(), p.ID); !errors.Is(err, domain.ErrConflict) {
		t.Fatalf("retrying a paid payout: err = %v, want conflict", err)
	}
	if _, err := f.escrow.AdminRetryPayout(ctx, uuid.New(), uuid.New()); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("retrying no payout: err = %v", err)
	}
}

func TestSuspendedFreelancersPayoutsWait(t *testing.T) {
	ctx := context.Background()
	f, _ := released(t, sandbox())
	if _, err := f.escrow.StartPayoutOnboarding(ctx, f.freelancer); err != nil {
		t.Fatal(err)
	}
	if err := f.repo.SetFreelancerCapability(ctx, f.freelancer, repository.CapabilitySuspended); err != nil {
		t.Fatal(err)
	}
	if n := f.send(t); n != 0 {
		t.Fatalf("paid a suspended freelancer")
	}
	if got := f.onlyPayout(t); got.Status != domain.PayoutPending || got.Attempts != 0 {
		t.Fatalf("payout = %+v", got)
	}
	// Reinstated, the money that was theirs all along goes.
	if err := f.repo.SetFreelancerCapability(ctx, f.freelancer, repository.CapabilityActive); err != nil {
		t.Fatal(err)
	}
	if n := f.send(t); n != 1 {
		t.Fatalf("sent %d after reinstatement, want 1", n)
	}
}

func TestDisputeReleaseCreatesASendablePayout(t *testing.T) {
	ctx := context.Background()
	f, m := fundedAndSubmitted(t, sandbox())
	d := f.open(t, f.client, m.ID)
	if _, err := f.escrow.AdminResolveDispute(ctx, uuid.New(), d.ID, domain.ResolveDisputePayload{
		Outcome: "release_to_freelancer", Resolution: "The work matches the approved designs.",
	}); err != nil {
		t.Fatal(err)
	}
	if _, err := f.escrow.StartPayoutOnboarding(ctx, f.freelancer); err != nil {
		t.Fatal(err)
	}
	p := f.onlyPayout(t)
	if p.PaymentIntentID == nil || p.MilestoneID == nil || *p.MilestoneID != m.ID {
		t.Fatalf("payout = %+v", p)
	}
	if n := f.send(t); n != 1 {
		t.Fatalf("sent %d, want 1", n)
	}
}

func TestAccountUpdatedWebhook(t *testing.T) {
	ctx := context.Background()
	proc := newPayoutProcessor()
	f, _ := released(t, proc)
	onboarding, err := f.escrow.StartPayoutOnboarding(ctx, f.freelancer)
	if err != nil {
		t.Fatal(err)
	}
	accountID := "sbx_acct_" + f.freelancer.String()
	if onboarding.Account.Account == nil {
		t.Fatal("no account stored")
	}

	state := payments.PayoutAccountState{AccountID: accountID, DetailsSubmitted: true, PayoutsEnabled: true, TransfersActive: true}
	if err := f.escrow.HandlePaymentWebhook(ctx, payments.SandboxName, payments.WebhookEvent{
		Kind: payments.AccountUpdated, Reference: accountID, Account: &state,
	}); err != nil {
		t.Fatalf("webhook: %v", err)
	}
	if view, _ := f.escrow.GetPayoutAccount(ctx, f.freelancer); view.Status != domain.PayoutAccountEnabled {
		t.Fatalf("status = %q, want enabled", view.Status)
	}
	// An account this deployment never created is acknowledged, not applied.
	other := payments.PayoutAccountState{AccountID: "acct_unknown", PayoutsEnabled: true, TransfersActive: true}
	if err := f.escrow.HandlePaymentWebhook(ctx, payments.SandboxName, payments.WebhookEvent{
		Kind: payments.AccountUpdated, Reference: "acct_unknown", Account: &other,
	}); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("unknown account: err = %v, want ErrNotFound", err)
	}
}

func TestAccountStatusSummary(t *testing.T) {
	cases := []struct {
		account *domain.PayoutAccount
		want    domain.PayoutAccountStatus
	}{
		{nil, domain.PayoutAccountNotStarted},
		{&domain.PayoutAccount{}, domain.PayoutAccountOnboarding},
		{&domain.PayoutAccount{DetailsSubmitted: true, RequirementsDue: true}, domain.PayoutAccountActionRequired},
		{&domain.PayoutAccount{DetailsSubmitted: true}, domain.PayoutAccountInReview},
		{&domain.PayoutAccount{DetailsSubmitted: true, TransfersActive: true}, domain.PayoutAccountInReview},
		{&domain.PayoutAccount{DetailsSubmitted: true, TransfersActive: true, PayoutsEnabled: true}, domain.PayoutAccountEnabled},
	}
	for _, tc := range cases {
		if got := tc.account.Status(); got != tc.want {
			t.Errorf("%+v: status = %q, want %q", tc.account, got, tc.want)
		}
	}
}

func TestPayoutBackoff(t *testing.T) {
	now := time.Now()
	var last time.Time
	for attempts := 1; attempts < maxPayoutAttempts; attempts++ {
		next := nextPayoutAttempt(payoutBackoff, attempts, now)
		if next == nil || !next.After(last) {
			t.Fatalf("attempt %d: next = %v", attempts, next)
		}
		last = *next
	}
	if next := nextPayoutAttempt(payoutBackoff, maxPayoutAttempts, now); next != nil {
		t.Fatalf("after the last attempt: next = %v, want none", next)
	}
}

func TestAdminPayoutQueueStatus(t *testing.T) {
	ctx := context.Background()
	f, _ := released(t, sandbox())
	if list, _, err := f.escrow.AdminListPayouts(ctx, "", 50, 0); err != nil || len(list) != 0 {
		t.Fatalf("default (failed) = %d, %v", len(list), err)
	}
	if list, _, err := f.escrow.AdminListPayouts(ctx, "all", 50, 0); err != nil || len(list) != 1 {
		t.Fatalf("all = %d, %v", len(list), err)
	}
	if _, _, err := f.escrow.AdminListPayouts(ctx, "lost", 50, 0); !errors.Is(err, domain.ErrValidation) {
		t.Fatalf("an unknown status: err = %v", err)
	}
}

func TestAdminPayoutQueueNamesPayeeAndProject(t *testing.T) {
	f, _ := released(t, sandbox())
	queue, _, err := f.escrow.AdminListPayouts(context.Background(), "all", 50, 0)
	if err != nil || len(queue) != 1 {
		t.Fatalf("queue = %+v, %v", queue, err)
	}
	p := queue[0]
	if p.Payee == nil || p.Payee.ID != f.freelancer || p.ProjectTitle == "" {
		t.Fatalf("payout = %+v", p)
	}
}
