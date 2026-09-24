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
)

/*
Disputes and refunds against the real API and a real database.

The service tests prove the rules on the no-database path. This file proves the
PostgreSQL half: the locks that make two decisions on one dispute resolve to
one, the columns migration 0104 adds, and that a refund, a release and a
withdrawal each leave the money, the milestone, the contract and the project in
agreement.
*/

// disputedMilestone hires, schedules the whole contract as one milestone, funds
// it, has the work submitted, and opens a dispute as the client.
func disputedMilestone(t *testing.T) (escrowParties, string, string) {
	t.Helper()
	p := hireThroughTheAPI(t)
	m := p.addMilestone(t, "Everything", 1000.00)
	p.confirm(t, p.fund(t, m))
	p.submit(t, m)
	disputeID := createdID(t, do(t, http.MethodPost, p.url("/milestones/"+m+"/dispute"), p.client.token,
		map[string]any{"reason": "quality", "detail": "Raised by the dispute CI suite."}), "dispute")
	return p, m, disputeID
}

func milestoneAndIntent(t *testing.T, milestoneID string) (milestone, intent string) {
	t.Helper()
	pool := escrowPool(t)
	if err := pool.QueryRow(context.Background(),
		`SELECT m.status, i.status FROM freelance_contract_milestones m
		   JOIN freelance_payment_intents i ON i.milestone_id = m.id AND i.status <> 'failed'
		  WHERE m.id = $1`, milestoneID).Scan(&milestone, &intent); err != nil {
		t.Fatalf("reading milestone and intent: %v", err)
	}
	return milestone, intent
}

func (p escrowParties) resolve(t *testing.T, token, disputeID, outcome string) int {
	t.Helper()
	resp := do(t, http.MethodPost, p.base+"/api/v1/admin/freelance/disputes/"+disputeID+"/resolve", token,
		map[string]any{"outcome": outcome, "resolution": "Decided by the dispute CI suite."})
	_, _ = readBody(resp)
	return resp.StatusCode
}

func adminFor(t *testing.T, base string) ciUser {
	t.Helper()
	return makePlatformAdmin(t, escrowPool(t), registerAndLogin(t, base))
}

func TestFreelanceDisputeFreezesAndWithdrawalRestores(t *testing.T) {
	p, m, disputeID := disputedMilestone(t)

	if milestone, intent := milestoneAndIntent(t, m); milestone != "disputed" || intent != "held_in_escrow" {
		t.Fatalf("while disputed: milestone %q, intent %q", milestone, intent)
	}
	if contract, project := contractAndProjectStatus(t, escrowPool(t), p.contractID); contract != "disputed" || project != "disputed" {
		t.Fatalf("while disputed: contract %q, project %q", contract, project)
	}
	expect(t, http.StatusConflict, http.MethodPost, p.url("/milestones/"+m+"/approve"), p.client.token, nil)

	// Evidence from both sides, visible to both.
	expect(t, http.StatusCreated, http.MethodPost, p.base+"/api/v1/freelance/disputes/"+disputeID+"/evidence",
		p.freelancer.token, map[string]any{"kind": "link", "file_url": "https://example.com/delivered"})
	expect(t, http.StatusCreated, http.MethodPost, p.base+"/api/v1/freelance/disputes/"+disputeID+"/evidence",
		p.client.token, map[string]any{"body": "The brief asked for three pages."})
	raw := expect(t, http.StatusOK, http.MethodGet, p.base+"/api/v1/freelance/disputes/"+disputeID, p.freelancer.token, nil)
	var detail struct {
		Evidence []json.RawMessage `json:"evidence"`
	}
	_ = json.Unmarshal([]byte(raw), &detail)
	if len(detail.Evidence) != 2 {
		t.Fatalf("evidence visible to the freelancer = %d, want 2", len(detail.Evidence))
	}

	expect(t, http.StatusForbidden, http.MethodPost, p.base+"/api/v1/freelance/disputes/"+disputeID+"/withdraw", p.freelancer.token, nil)
	expect(t, http.StatusOK, http.MethodPost, p.base+"/api/v1/freelance/disputes/"+disputeID+"/withdraw", p.client.token, nil)

	if milestone, _ := milestoneAndIntent(t, m); milestone != "submitted" {
		t.Fatalf("after withdrawal: milestone %q, want submitted (where it was)", milestone)
	}
	if contract, project := contractAndProjectStatus(t, escrowPool(t), p.contractID); contract != "active" || project != "active" {
		t.Fatalf("after withdrawal: contract %q, project %q", contract, project)
	}
	expect(t, http.StatusOK, http.MethodPost, p.url("/milestones/"+m+"/approve"), p.client.token, nil)
}

func TestFreelanceDisputeRefundToClient(t *testing.T) {
	p, m, disputeID := disputedMilestone(t)
	pool := escrowPool(t)

	// A signed-in non-administrator is refused before anything is read.
	if code := p.resolve(t, p.client.token, disputeID, "refund_to_client"); code != http.StatusForbidden {
		t.Fatalf("the client deciding their own dispute: got %d, want 403", code)
	}
	if code := p.resolve(t, adminFor(t, p.base).token, disputeID, "refund_to_client"); code != http.StatusOK {
		t.Fatalf("resolve: got %d", code)
	}

	var milestone, intent, refundRef string
	var refundedAt *string
	if err := pool.QueryRow(context.Background(),
		`SELECT m.status, i.status, COALESCE(i.refund_reference, ''), i.refunded_at::text
		   FROM freelance_contract_milestones m JOIN freelance_payment_intents i ON i.milestone_id = m.id
		  WHERE m.id = $1 AND i.status <> 'failed'`, m).Scan(&milestone, &intent, &refundRef, &refundedAt); err != nil {
		t.Fatal(err)
	}
	if milestone != "cancelled" || intent != "refunded" || refundRef == "" || refundedAt == nil {
		t.Fatalf("after refund: milestone %q, intent %q, reference %q, refunded_at %v", milestone, intent, refundRef, refundedAt)
	}
	var outcome, status string
	if err := pool.QueryRow(context.Background(),
		`SELECT status, outcome FROM freelance_disputes WHERE id = $1`, disputeID).Scan(&status, &outcome); err != nil {
		t.Fatal(err)
	}
	if status != "resolved" || outcome != "refund_to_client" {
		t.Fatalf("dispute: %q / %q", status, outcome)
	}
	var payouts int
	_ = pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM freelance_payouts WHERE contract_id = $1`, p.contractID).Scan(&payouts)
	if payouts != 0 {
		t.Fatalf("a refunded dispute recorded %d payouts", payouts)
	}
	if contract, project := contractAndProjectStatus(t, pool, p.contractID); contract != "active" || project != "active" {
		t.Fatalf("after refund: contract %q, project %q", contract, project)
	}
	// Decided means closed.
	expect(t, http.StatusConflict, http.MethodPost, p.base+"/api/v1/freelance/disputes/"+disputeID+"/evidence",
		p.client.token, map[string]any{"body": "late"})
}

func TestFreelanceDisputeReleaseToFreelancer(t *testing.T) {
	p, m, disputeID := disputedMilestone(t)
	pool := escrowPool(t)
	if code := p.resolve(t, adminFor(t, p.base).token, disputeID, "release_to_freelancer"); code != http.StatusOK {
		t.Fatalf("resolve: got %d", code)
	}
	if milestone, intent := milestoneAndIntent(t, m); milestone != "released" || intent != "released" {
		t.Fatalf("after release: milestone %q, intent %q", milestone, intent)
	}
	var owed int64
	_ = pool.QueryRow(context.Background(),
		`SELECT COALESCE(SUM(amount_minor_units), 0) FROM freelance_payouts WHERE contract_id = $1`, p.contractID).Scan(&owed)
	if owed != 100000 {
		t.Fatalf("payout = %d, want 100000", owed)
	}
	// The only milestone, for the whole contract: the contract is done.
	if contract, project := contractAndProjectStatus(t, pool, p.contractID); contract != "completed" || project != "completed" {
		t.Fatalf("after release: contract %q, project %q", contract, project)
	}
}

// Two administrators deciding one dispute at once: exactly one decision lands,
// and the money moves once.
func TestFreelanceDisputeIsDecidedOnce(t *testing.T) {
	p, m, disputeID := disputedMilestone(t)
	admin := adminFor(t, p.base)

	body, _ := json.Marshal(map[string]any{"outcome": "refund_to_client", "resolution": "Race."})
	var wg sync.WaitGroup
	var mu sync.Mutex
	codes := map[int]int{}
	start := make(chan struct{})
	for i := 0; i < 6; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			req, _ := http.NewRequest(http.MethodPost, p.base+"/api/v1/admin/freelance/disputes/"+disputeID+"/resolve", bytes.NewReader(body))
			req.Header.Set("Authorization", "Bearer "+admin.token)
			req.Header.Set("Content-Type", "application/json")
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
	if codes[http.StatusOK] != 1 || codes[http.StatusOK]+codes[http.StatusConflict] != 6 {
		t.Fatalf("six simultaneous decisions answered %v; want one 200 and five 409", codes)
	}
	if milestone, intent := milestoneAndIntent(t, m); milestone != "cancelled" || intent != "refunded" {
		t.Fatalf("after the race: milestone %q, intent %q", milestone, intent)
	}
}

// The freelancer's voluntary refund, and the client being unable to take the
// money back alone.
func TestFreelanceVoluntaryRefund(t *testing.T) {
	p := hireThroughTheAPI(t)
	m := p.addMilestone(t, "Design", 400.00)
	p.confirm(t, p.fund(t, m))

	reason := map[string]any{"reason": "We agreed to stop."}
	expect(t, http.StatusForbidden, http.MethodPost, p.url("/milestones/"+m+"/refund"), p.client.token, reason)
	expect(t, http.StatusOK, http.MethodPost, p.url("/milestones/"+m+"/refund"), p.freelancer.token, reason)
	if milestone, intent := milestoneAndIntent(t, m); milestone != "cancelled" || intent != "refunded" {
		t.Fatalf("after refund: milestone %q, intent %q", milestone, intent)
	}
	expect(t, http.StatusConflict, http.MethodPost, p.url("/milestones/"+m+"/refund"), p.freelancer.token, reason)
}
