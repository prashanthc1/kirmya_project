//go:build ciintegration

package ci

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"sync"
	"testing"

	"kirmya/internal/freelance/payments"

	"github.com/jackc/pgx/v5/pgxpool"
)

/*
The freelance escrow flow, against the real API and a real database.

The service tests prove the rules on the no-database path. This file proves the
PostgreSQL half: the SQL itself, the row locks that make concurrent requests
resolve to one winner, and migration 0103's unique index. Those are the parts
that decide whether a client can be charged twice or a freelancer paid twice,
and none of them exist on the no-database path.

The API runs with the sandbox payment processor (FREELANCE_SANDBOX_WEBHOOK_SECRET),
and this file plays the processor by signing webhooks with the same secret.
*/

type escrowParties struct {
	base       string
	client     ciUser
	freelancer ciUser
	contractID string
}

// hireThroughTheAPI walks a real client and a real freelancer to a contract
// worth 1,000.00 AED.
func hireThroughTheAPI(t *testing.T) escrowParties {
	t.Helper()
	base := required(t, "TEST_API_URL")
	p := escrowParties{base: base, client: registerAndLogin(t, base), freelancer: registerAndLogin(t, base)}
	onboardFreelancer(t, base, p.freelancer)

	projectID := createdID(t, do(t, http.MethodPost, base+"/api/v1/freelance/projects", p.client.token,
		projectPayload("Escrow CI project")), "project")
	for _, status := range []string{"published", "accepting_proposals"} {
		resp := do(t, http.MethodPatch, base+"/api/v1/freelance/my/projects/"+projectID, p.client.token,
			map[string]any{"status": status})
		if resp.StatusCode != http.StatusOK {
			body, _ := readBody(resp)
			t.Fatalf("moving the project to %s: %d %s", status, resp.StatusCode, body)
		}
		resp.Body.Close()
	}
	proposalID := createdID(t, do(t, http.MethodPost, base+"/api/v1/freelance/projects/"+projectID+"/proposals",
		p.freelancer.token, map[string]any{
			"bid_amount": 1000.00, "estimated_days": 10, "cover_letter": "Escrow CI proposal.",
		}), "proposal")
	p.contractID = createdID(t, do(t, http.MethodPost, base+"/api/v1/freelance/proposals/"+proposalID+"/accept",
		p.client.token, map[string]any{}), "contract")
	return p
}

func (p escrowParties) url(suffix string) string {
	return p.base + "/api/v1/freelance/contracts/" + p.contractID + suffix
}

// expect performs a request and fails unless it answers want.
func expect(t *testing.T, want int, method, url, token string, body any) string {
	t.Helper()
	resp := do(t, method, url, token, body)
	raw, _ := readBody(resp)
	if resp.StatusCode != want {
		t.Fatalf("%s %s: got %d, want %d. Body: %s", method, url, resp.StatusCode, want, truncateBody(raw))
	}
	return raw
}

func (p escrowParties) addMilestone(t *testing.T, title string, amount float64) string {
	t.Helper()
	return createdID(t, do(t, http.MethodPost, p.url("/milestones"), p.client.token,
		map[string]any{"title": title, "amount": amount}), "milestone")
}

// fund requests the payment and returns the processor reference.
func (p escrowParties) fund(t *testing.T, milestoneID string) string {
	t.Helper()
	raw := expect(t, http.StatusAccepted, http.MethodPost, p.url("/milestones/"+milestoneID+"/fund"), p.client.token, nil)
	var result struct {
		Intent struct {
			ProviderReference string `json:"provider_reference"`
		} `json:"payment_intent"`
	}
	if err := json.Unmarshal([]byte(raw), &result); err != nil || result.Intent.ProviderReference == "" {
		t.Fatalf("funding response carries no processor reference: %s", raw)
	}
	return result.Intent.ProviderReference
}

// webhook posts a processor event, signed with secret when it is not empty.
func webhook(t *testing.T, base, secret, kind, reference string) int {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"type": kind, "reference": reference})
	req, err := http.NewRequest(http.MethodPost, base+"/api/v1/freelance/payments/webhooks/sandbox", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	if secret != "" {
		req.Header.Set(payments.SandboxSignatureHeader, "sha256="+payments.SignSandboxPayload([]byte(secret), body))
	}
	resp, err := httpClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	_, _ = io.Copy(io.Discard, resp.Body)
	resp.Body.Close()
	return resp.StatusCode
}

func (p escrowParties) confirm(t *testing.T, reference string) {
	t.Helper()
	secret := required(t, "FREELANCE_SANDBOX_WEBHOOK_SECRET")
	if code := webhook(t, p.base, secret, string(payments.ChargeSucceeded), reference); code != http.StatusOK {
		t.Fatalf("confirming %s: got %d, want 200", reference, code)
	}
}

func (p escrowParties) submit(t *testing.T, milestoneID string) {
	t.Helper()
	expect(t, http.StatusOK, http.MethodPost, p.url("/milestones/"+milestoneID+"/submit"), p.freelancer.token,
		map[string]any{"summary": "Delivered by the escrow CI suite.", "attachments": []string{"https://example.com/ci"}})
}

func escrowPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	pool, err := pgxpool.New(context.Background(), required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

func contractAndProjectStatus(t *testing.T, pool *pgxpool.Pool, contractID string) (string, string) {
	t.Helper()
	var contract, project string
	if err := pool.QueryRow(context.Background(),
		`SELECT c.status, p.status FROM freelance_contracts c JOIN freelance_projects p ON p.id = c.project_id
		  WHERE c.id = $1`, contractID).Scan(&contract, &project); err != nil {
		t.Fatalf("reading contract status: %v", err)
	}
	return contract, project
}

// TestFreelanceEscrowLifecycle is the whole path through the real stack, with
// the database checked at each step that moves money.
func TestFreelanceEscrowLifecycle(t *testing.T) {
	p := hireThroughTheAPI(t)
	pool := escrowPool(t)
	ctx := context.Background()
	secret := required(t, "FREELANCE_SANDBOX_WEBHOOK_SECRET")

	design := p.addMilestone(t, "Design", 600.00)
	build := p.addMilestone(t, "Build", 400.00)
	expect(t, http.StatusBadRequest, http.MethodPost, p.url("/milestones"), p.client.token,
		map[string]any{"title": "One fil too many", "amount": 0.01})

	// Nobody outside the contract learns it exists.
	stranger := registerAndLogin(t, p.base)
	expect(t, http.StatusNotFound, http.MethodGet, p.url(""), stranger.token, nil)
	expect(t, http.StatusNotFound, http.MethodPost, p.url("/milestones/"+design+"/fund"), stranger.token, nil)

	reference := p.fund(t, design)

	// Forged confirmations change nothing.
	if code := webhook(t, p.base, "", string(payments.ChargeSucceeded), reference); code != http.StatusUnauthorized {
		t.Errorf("unsigned confirmation: got %d, want 401", code)
	}
	if code := webhook(t, p.base, "not-the-secret", string(payments.ChargeSucceeded), reference); code != http.StatusUnauthorized {
		t.Errorf("wrongly signed confirmation: got %d, want 401", code)
	}
	var milestoneStatus string
	if err := pool.QueryRow(ctx, `SELECT status FROM freelance_contract_milestones WHERE id = $1`, design).Scan(&milestoneStatus); err != nil {
		t.Fatal(err)
	}
	if milestoneStatus != "pending" {
		t.Fatalf("milestone status after forged confirmations = %q, want pending", milestoneStatus)
	}

	// A genuine confirmation, redelivered as a processor would.
	p.confirm(t, reference)
	if code := webhook(t, p.base, secret, string(payments.ChargeSucceeded), reference); code != http.StatusOK {
		t.Fatalf("redelivered confirmation: got %d, want 200", code)
	}
	var held int
	if err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM freelance_payment_intents WHERE milestone_id = $1 AND status = 'held_in_escrow'`,
		design).Scan(&held); err != nil {
		t.Fatal(err)
	}
	if held != 1 {
		t.Fatalf("held intents for the milestone = %d, want exactly 1", held)
	}
	if contract, project := contractAndProjectStatus(t, pool, p.contractID); contract != "active" || project != "active" {
		t.Fatalf("after first funding: contract %q, project %q, want active and active", contract, project)
	}

	// Delivered, sent back, delivered again, approved.
	p.submit(t, design)
	expect(t, http.StatusOK, http.MethodPost, p.url("/milestones/"+design+"/request-revision"), p.client.token,
		map[string]any{"reason": "Please add the empty states."})
	p.submit(t, design)
	expect(t, http.StatusOK, http.MethodPost, p.url("/milestones/"+design+"/approve"), p.client.token, nil)

	var payout int64
	var payoutStatus, payoutCurrency string
	if err := pool.QueryRow(ctx,
		`SELECT amount_minor_units, status, currency FROM freelance_payouts WHERE contract_id = $1`,
		p.contractID).Scan(&payout, &payoutStatus, &payoutCurrency); err != nil {
		t.Fatalf("reading the payout: %v", err)
	}
	if payout != 60000 || payoutStatus != "pending" || payoutCurrency != "AED" {
		t.Fatalf("payout = %d %s %s, want 60000 AED pending", payout, payoutCurrency, payoutStatus)
	}
	var accepted, revised int
	if err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FILTER (WHERE status = 'accepted'), COUNT(*) FILTER (WHERE status = 'revision_requested')
		   FROM freelance_deliveries WHERE milestone_id = $1`, design).Scan(&accepted, &revised); err != nil {
		t.Fatal(err)
	}
	if accepted != 1 || revised != 1 {
		t.Fatalf("deliveries: %d accepted, %d revision requested; want 1 and 1", accepted, revised)
	}
	if contract, _ := contractAndProjectStatus(t, pool, p.contractID); contract != "active" {
		t.Fatalf("contract completed with a milestone still open: %q", contract)
	}

	// The last milestone completes the contract and the project.
	p.confirm(t, p.fund(t, build))
	p.submit(t, build)
	expect(t, http.StatusOK, http.MethodPost, p.url("/milestones/"+build+"/approve"), p.client.token, nil)
	if contract, project := contractAndProjectStatus(t, pool, p.contractID); contract != "completed" || project != "completed" {
		t.Fatalf("after the last release: contract %q, project %q, want completed and completed", contract, project)
	}
	var owed int64
	if err := pool.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount_minor_units), 0) FROM freelance_payouts WHERE contract_id = $1`,
		p.contractID).Scan(&owed); err != nil {
		t.Fatal(err)
	}
	if owed != 100000 {
		t.Fatalf("payouts total %d, want the whole contract (100000)", owed)
	}
}

// race fires the same request n times at once and returns the status codes.
func race(t *testing.T, n int, method, url, token string) map[int]int {
	t.Helper()
	var wg sync.WaitGroup
	var mu sync.Mutex
	codes := map[int]int{}
	start := make(chan struct{})
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			req, _ := http.NewRequest(method, url, nil)
			req.Header.Set("Authorization", "Bearer "+token)
			resp, err := httpClient().Do(req)
			if err != nil {
				t.Error(err)
				return
			}
			_, _ = io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
			mu.Lock()
			codes[resp.StatusCode]++
			mu.Unlock()
		}()
	}
	close(start)
	wg.Wait()
	return codes
}

// Concurrent clicks must resolve to one charge and one payout. This is what the
// row locks and migration 0103's index are for.
func TestFreelanceEscrowUnderConcurrency(t *testing.T) {
	p := hireThroughTheAPI(t)
	pool := escrowPool(t)
	ctx := context.Background()
	m := p.addMilestone(t, "Everything", 1000.00)

	codes := race(t, 8, http.MethodPost, p.url("/milestones/"+m+"/fund"), p.client.token)
	if codes[http.StatusAccepted] != 1 || codes[http.StatusAccepted]+codes[http.StatusConflict] != 8 {
		t.Fatalf("eight simultaneous funding requests answered %v; want one 202 and seven 409", codes)
	}
	var live int
	if err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM freelance_payment_intents
		  WHERE milestone_id = $1 AND status IN ('requires_payment', 'processing', 'held_in_escrow')`, m).Scan(&live); err != nil {
		t.Fatal(err)
	}
	if live != 1 {
		t.Fatalf("live payment intents = %d, want 1", live)
	}

	var reference string
	if err := pool.QueryRow(ctx,
		`SELECT provider_reference FROM freelance_payment_intents WHERE milestone_id = $1 AND status = 'requires_payment'`,
		m).Scan(&reference); err != nil {
		t.Fatal(err)
	}
	p.confirm(t, reference)
	p.submit(t, m)

	codes = race(t, 8, http.MethodPost, p.url("/milestones/"+m+"/approve"), p.client.token)
	if codes[http.StatusOK] != 1 || codes[http.StatusOK]+codes[http.StatusConflict] != 8 {
		t.Fatalf("eight simultaneous approvals answered %v; want one 200 and seven 409", codes)
	}
	var payouts int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM freelance_payouts WHERE contract_id = $1`, p.contractID).Scan(&payouts); err != nil {
		t.Fatal(err)
	}
	if payouts != 1 {
		t.Fatalf("payouts after concurrent approvals = %d, want 1", payouts)
	}
}

// The index itself, exercised directly: a service bug must not be able to
// create a second live charge for one milestone.
func TestSecondLivePaymentIntentIsRefusedByTheDatabase(t *testing.T) {
	p := hireThroughTheAPI(t)
	pool := escrowPool(t)
	ctx := context.Background()
	m := p.addMilestone(t, "Everything", 1000.00)
	p.fund(t, m)

	_, err := pool.Exec(ctx,
		`INSERT INTO freelance_payment_intents (contract_id, milestone_id, payer_id, amount_minor_units, currency, status)
		 SELECT contract_id, milestone_id, payer_id, amount_minor_units, currency, 'requires_payment'
		   FROM freelance_payment_intents WHERE milestone_id = $1`, m)
	if err == nil {
		t.Fatal("the database accepted a second live payment intent for one milestone")
	}
}
