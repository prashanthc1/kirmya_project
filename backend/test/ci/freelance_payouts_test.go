//go:build ciintegration

package ci

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"testing"
	"time"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/repository"

	"github.com/google/uuid"
)

/*
Payouts against the real API and a real database.

The API runs with the sandbox processor, which pays into accounts it reports
ready at once and sends nothing. What this proves is the PostgreSQL half:
the claim that lets every replica run the sender without paying anybody twice,
the hold on a suspended freelancer, the one-payout-per-charge index, and a
release that ends as a paid payout without anybody touching the database.
*/

// releasedContract hires, funds and releases the whole contract as one
// milestone, and returns the milestone.
func releasedContract(t *testing.T) (escrowParties, string) {
	t.Helper()
	p := hireThroughTheAPI(t)
	m := p.addMilestone(t, "Everything", 1000.00)
	p.confirm(t, p.fund(t, m))
	p.submit(t, m)
	expect(t, http.StatusOK, http.MethodPost, p.url("/milestones/"+m+"/approve"), p.client.token, nil)
	return p, m
}

type payoutRow struct {
	status, reference, destination string
	attempts                       int
	paid                           bool
	intent                         *uuid.UUID
}

func payoutFor(t *testing.T, milestoneID string) payoutRow {
	t.Helper()
	var r payoutRow
	if err := escrowPool(t).QueryRow(context.Background(),
		`SELECT status, COALESCE(provider_reference, ''), COALESCE(destination_account, ''), attempts,
		        paid_at IS NOT NULL, payment_intent_id
		   FROM freelance_payouts WHERE milestone_id = $1`, milestoneID).
		Scan(&r.status, &r.reference, &r.destination, &r.attempts, &r.paid, &r.intent); err != nil {
		t.Fatalf("reading payout: %v", err)
	}
	return r
}

// waitForPayout polls until the milestone's payout reaches status.
func waitForPayout(t *testing.T, milestoneID, status string) payoutRow {
	t.Helper()
	deadline := time.Now().Add(20 * time.Second)
	for {
		r := payoutFor(t, milestoneID)
		if r.status == status {
			return r
		}
		if time.Now().After(deadline) {
			t.Fatalf("payout still %q after 20s, want %q", r.status, status)
		}
		time.Sleep(200 * time.Millisecond)
	}
}

func payoutAccount(t *testing.T, base, token string) domain.PayoutAccountView {
	t.Helper()
	var view domain.PayoutAccountView
	raw := expect(t, http.StatusOK, http.MethodGet, base+"/api/v1/freelance/payouts/account", token, nil)
	if err := json.Unmarshal([]byte(raw), &view); err != nil {
		t.Fatalf("account view: %v: %s", err, raw)
	}
	return view
}

func TestFreelancePayoutLifecycle(t *testing.T) {
	p, m := releasedContract(t)
	base := p.base

	// Released, and nowhere to send it.
	if r := payoutFor(t, m); r.status != "pending" || r.intent == nil {
		t.Fatalf("after release: %+v", r)
	}
	view := payoutAccount(t, base, p.freelancer.token)
	if !view.Available || view.Status != domain.PayoutAccountNotStarted || view.Waiting["AED"] != 100000 {
		t.Fatalf("account before onboarding = %+v", view)
	}
	time.Sleep(time.Second)
	if r := payoutFor(t, m); r.status != "pending" || r.attempts != 0 {
		t.Fatalf("sent with no payout account: %+v", r)
	}

	// The client has nothing to be paid for.
	expect(t, http.StatusForbidden, http.MethodPost, base+"/api/v1/freelance/payouts/account/onboarding", p.client.token, nil)
	expect(t, http.StatusUnauthorized, http.MethodPost, base+"/api/v1/freelance/payouts/account/onboarding", "", nil)

	// The sandbox needs no form: the account is ready at once, and the payout
	// goes without anybody touching the database.
	raw := expect(t, http.StatusOK, http.MethodPost, base+"/api/v1/freelance/payouts/account/onboarding", p.freelancer.token, nil)
	var onboarding domain.PayoutOnboarding
	if err := json.Unmarshal([]byte(raw), &onboarding); err != nil || onboarding.URL != "" || onboarding.Account.Status != domain.PayoutAccountEnabled {
		t.Fatalf("onboarding = %s", raw)
	}
	r := waitForPayout(t, m, "paid")
	if !r.paid || r.attempts != 1 || r.destination == "" || r.reference == "" {
		t.Fatalf("paid payout = %+v", r)
	}

	// The freelancer sees it paid, and nothing of the send's internals.
	list := expect(t, http.StatusOK, http.MethodGet, base+"/api/v1/freelance/payouts", p.freelancer.token, nil)
	var page struct {
		Data []map[string]any `json:"data"`
	}
	if err := json.Unmarshal([]byte(list), &page); err != nil || len(page.Data) != 1 || page.Data[0]["status"] != "paid" {
		t.Fatalf("payouts = %s", list)
	}
	if _, leaked := page.Data[0]["last_error"]; leaked {
		t.Fatalf("the payee's payout carries last_error: %s", list)
	}
	if view := payoutAccount(t, base, p.freelancer.token); len(view.Waiting) != 0 {
		t.Fatalf("still waiting after payment: %+v", view.Waiting)
	}
	// The client's own payouts list is theirs alone: empty.
	clientList := expect(t, http.StatusOK, http.MethodGet, base+"/api/v1/freelance/payouts", p.client.token, nil)
	if err := json.Unmarshal([]byte(clientList), &page); err != nil || len(page.Data) != 0 {
		t.Fatalf("the client sees payouts: %s", clientList)
	}
}

func TestFreelancePayoutsWaitWhileSuspended(t *testing.T) {
	p, m := releasedContract(t)
	pool := escrowPool(t)
	ctx := context.Background()
	if _, err := pool.Exec(ctx,
		`UPDATE freelancer_profiles SET capability_status = 'suspended' WHERE user_id = $1`, p.freelancer.id); err != nil {
		t.Fatal(err)
	}
	// Setting up the account is allowed: the money is theirs for work done.
	expect(t, http.StatusOK, http.MethodPost, p.base+"/api/v1/freelance/payouts/account/onboarding", p.freelancer.token, nil)
	time.Sleep(2 * time.Second)
	if r := payoutFor(t, m); r.status != "pending" || r.attempts != 0 {
		t.Fatalf("a suspended freelancer was paid: %+v", r)
	}

	if _, err := pool.Exec(ctx,
		`UPDATE freelancer_profiles SET capability_status = 'active' WHERE user_id = $1`, p.freelancer.id); err != nil {
		t.Fatal(err)
	}
	// Refreshing the ready account wakes the sender.
	expect(t, http.StatusOK, http.MethodPost, p.base+"/api/v1/freelance/payouts/account/refresh", p.freelancer.token, nil)
	waitForPayout(t, m, "paid")
}

func TestFreelancePayoutAdminRetry(t *testing.T) {
	p, m := releasedContract(t)
	pool := escrowPool(t)
	ctx := context.Background()
	admin := adminFor(t, p.base)
	queue := p.base + "/api/v1/admin/freelance/payouts"

	// Plain users are kept out of the queue.
	expect(t, http.StatusForbidden, http.MethodGet, queue, p.freelancer.token, nil)

	var payoutID string
	if err := pool.QueryRow(ctx, `SELECT id FROM freelance_payouts WHERE milestone_id = $1`, m).Scan(&payoutID); err != nil {
		t.Fatal(err)
	}
	// Only a failed payout can be retried.
	expect(t, http.StatusConflict, http.MethodPost, queue+"/"+payoutID+"/retry", admin.token, nil)
	expect(t, http.StatusNotFound, http.MethodPost, queue+"/"+uuid.NewString()+"/retry", admin.token, nil)

	// Parked as failed, as five failed sends would leave it.
	if _, err := pool.Exec(ctx,
		`UPDATE freelance_payouts SET status = 'failed', attempts = 5, last_error = 'ci: insufficient funds'
		  WHERE id = $1`, payoutID); err != nil {
		t.Fatal(err)
	}
	raw := expect(t, http.StatusOK, http.MethodGet, queue+"?status=failed&limit=100", admin.token, nil)
	var page struct {
		Data []domain.AdminPayout `json:"data"`
	}
	if err := json.Unmarshal([]byte(raw), &page); err != nil {
		t.Fatal(err)
	}
	found := false
	for _, row := range page.Data {
		if row.ID.String() == payoutID {
			found = row.LastError == "ci: insufficient funds"
		}
	}
	if !found {
		t.Fatalf("the failed payout and its reason are not in the queue: %s", truncateBody(raw))
	}
	expect(t, http.StatusBadRequest, http.MethodGet, queue+"?status=lost", admin.token, nil)

	expect(t, http.StatusOK, http.MethodPost, p.base+"/api/v1/freelance/payouts/account/onboarding", p.freelancer.token, nil)
	expect(t, http.StatusOK, http.MethodPost, queue+"/"+payoutID+"/retry", admin.token, nil)
	if r := waitForPayout(t, m, "paid"); r.attempts != 1 {
		t.Fatalf("retried payout = %+v, want a fresh count of 1", r)
	}
}

// Many senders claiming at once - every API replica runs one - never claim the
// same payout twice. Claims under a provider name the running API does not
// use, so its own sender stays out of the way.
func TestFreelancePayoutClaimIsExclusive(t *testing.T) {
	const payouts, senders = 30, 8
	// A provider name of its own per run: a database reused across runs keeps
	// earlier runs' payouts in processing, and once they are an hour old the
	// claim rightly takes them over as stale - which would be another run's
	// payouts turning up here.
	provider := "ci-claim-" + uuid.NewString()[:8]
	pool := escrowPool(t)
	ctx := context.Background()
	payee := registerAndLogin(t, required(t, "TEST_API_URL"))

	if _, err := pool.Exec(ctx,
		`INSERT INTO freelance_payout_accounts (user_id, provider, account_id, details_submitted, payouts_enabled, transfers_active)
		 VALUES ($1, $2, $3, TRUE, TRUE, TRUE)`, payee.id, provider, "acct_ci_"+payee.id); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < payouts; i++ {
		if _, err := pool.Exec(ctx,
			`INSERT INTO freelance_payouts (payee_id, amount_minor_units, currency, status) VALUES ($1, 100, 'AED', 'pending')`,
			payee.id); err != nil {
			t.Fatal(err)
		}
	}

	repo := repository.NewFreelanceRepository(pool)
	var mu sync.Mutex
	seen := map[uuid.UUID]int{}
	var wg sync.WaitGroup
	start := make(chan struct{})
	for i := 0; i < senders; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			for {
				claimed, err := repo.ClaimDuePayouts(ctx, provider, 3, time.Hour)
				if err != nil {
					t.Errorf("claim: %v", err)
					return
				}
				if len(claimed) == 0 {
					// An empty claim does not prove there is nothing left:
					// under READ COMMITTED, FOR UPDATE with LIMIT can come back
					// short, even empty, when the rows it picked were claimed
					// by another transaction just before it locked them. Stop
					// only when none is pending.
					var pending int
					if err := pool.QueryRow(ctx,
						`SELECT COUNT(*) FROM freelance_payouts WHERE payee_id = $1 AND status = 'pending'`,
						payee.id).Scan(&pending); err != nil {
						t.Errorf("counting pending: %v", err)
						return
					}
					if pending == 0 {
						return
					}
					time.Sleep(5 * time.Millisecond)
					continue
				}
				mu.Lock()
				for _, c := range claimed {
					seen[c.Payout.ID]++
					if c.Destination != "acct_ci_"+payee.id {
						t.Errorf("claimed for destination %q", c.Destination)
					}
				}
				mu.Unlock()
			}
		}()
	}
	close(start)
	wg.Wait()

	if len(seen) != payouts {
		t.Fatalf("claimed %d distinct payouts, want %d", len(seen), payouts)
	}
	for id, n := range seen {
		if n != 1 {
			t.Errorf("payout %s claimed %d times", id, n)
		}
	}
	var processing int
	_ = pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM freelance_payouts WHERE payee_id = $1 AND status = 'processing' AND attempts = 1`, payee.id).Scan(&processing)
	if processing != payouts {
		t.Fatalf("processing = %d, want %d", processing, payouts)
	}
}

// Escrowed money is paid out once: a second payout naming the same charge is
// refused by the database itself.
func TestSecondPayoutForOneChargeIsRefusedByTheDatabase(t *testing.T) {
	p, m := releasedContract(t)
	r := payoutFor(t, m)
	if r.intent == nil {
		t.Fatal("the payout does not name its charge")
	}
	_, err := escrowPool(t).Exec(context.Background(),
		`INSERT INTO freelance_payouts (payee_id, payment_intent_id, amount_minor_units, currency)
		 VALUES ($1, $2, 100000, 'AED')`, p.freelancer.id, *r.intent)
	if err == nil {
		t.Fatal("a second payout for one charge was stored")
	}
}
