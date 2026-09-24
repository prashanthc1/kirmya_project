package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/payments"
	"kirmya/internal/freelance/repository"
	"kirmya/internal/freelance/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// The escrow routes over the real route table, the real service and the
// repository's no-database path. The service tests cover the rules; these cover
// what a caller sees: which middleware a request meets, which status each
// refusal answers, and that the webhook trusts nothing but its signature.

const webhookSecret = "route-test-secret"

type escrowRoutes struct {
	engine     *gin.Engine
	client     uuid.UUID
	freelancer uuid.UUID
	contractID uuid.UUID
}

func newEscrowRoutes(t *testing.T, gateway payments.Gateway) *escrowRoutes {
	t.Helper()
	gin.SetMode(gin.TestMode)
	ctx := context.Background()
	repo := repository.NewFreelanceRepository(nil)
	market := service.NewFreelanceService(repo)
	r := &escrowRoutes{client: uuid.New(), freelancer: uuid.New()}

	proj, err := market.CreateProject(ctx, r.client, domain.CreateProjectPayload{
		Title: "Payments dashboard", Description: "Build it.", Budget: 100000,
	})
	if err != nil {
		t.Fatalf("create project: %v", err)
	}
	for _, status := range []string{"published", "accepting_proposals"} {
		s := status
		if _, err := market.UpdateOwnProject(ctx, r.client, proj.ID, domain.UpdateProjectPayload{Status: &s}); err != nil {
			t.Fatalf("move project to %s: %v", status, err)
		}
	}
	if _, err := market.SaveProfile(ctx, r.freelancer, domain.SaveProfilePayload{
		HourlyRate: 9000, Tagline: "Frontend engineer", Skills: []string{"React"},
	}); err != nil {
		t.Fatalf("save profile: %v", err)
	}
	if _, err := market.CompleteOnboarding(ctx, r.freelancer); err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}
	prop, err := market.SubmitProposal(ctx, r.freelancer, proj.ID, domain.SubmitProposalPayload{
		BidAmount: 100000, EstimatedDays: 10, CoverLetter: "Happy to.",
	})
	if err != nil {
		t.Fatalf("submit proposal: %v", err)
	}
	contract, err := market.AcceptProposal(ctx, r.client, prop.ID)
	if err != nil {
		t.Fatalf("accept proposal: %v", err)
	}
	r.contractID = contract.ID

	r.engine = gin.New()
	api := r.engine.Group("/api/v1")
	RegisterRoutes(api, NewFreelanceHandler(market), market)
	RegisterEscrowRoutes(api, NewEscrowHandler(service.NewEscrowService(repo, gateway, nil)))
	return r
}

func (r *escrowRoutes) path(suffix string) string {
	return "/api/v1/freelance/contracts/" + r.contractID.String() + suffix
}

func (r *escrowRoutes) addMilestone(t *testing.T, amount float64) string {
	t.Helper()
	rec := request(t, r.engine, http.MethodPost, r.path("/milestones"), tokenFor(t, r.client),
		map[string]any{"title": "Milestone", "amount": amount})
	if rec.Code != http.StatusCreated {
		t.Fatalf("add milestone: %d %s", rec.Code, rec.Body)
	}
	var m struct {
		ID string `json:"id"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &m)
	return m.ID
}

func (r *escrowRoutes) webhook(t *testing.T, provider string, body []byte, signature string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/freelance/payments/webhooks/"+provider, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if signature != "" {
		req.Header.Set(payments.SandboxSignatureHeader, "sha256="+signature)
	}
	rec := httptest.NewRecorder()
	r.engine.ServeHTTP(rec, req)
	return rec
}

func sign(body []byte) string {
	return payments.SignSandboxPayload([]byte(webhookSecret), body)
}

func TestEscrowRoutesRequireAuthentication(t *testing.T) {
	r := newEscrowRoutes(t, payments.NewSandboxGateway(webhookSecret))
	for _, call := range []struct{ method, path string }{
		{http.MethodGet, r.path("")},
		{http.MethodPost, r.path("/milestones")},
		{http.MethodPost, r.path("/milestones/" + uuid.NewString() + "/fund")},
		{http.MethodPost, r.path("/milestones/" + uuid.NewString() + "/approve")},
	} {
		if rec := request(t, r.engine, call.method, call.path, "", nil); rec.Code != http.StatusUnauthorized {
			t.Errorf("anonymous %s %s = %d, want 401", call.method, call.path, rec.Code)
		}
	}
}

// A stranger is told the contract does not exist; the freelancer is told they
// may not schedule or pay on it.
func TestEscrowRoutesRefuseNonParties(t *testing.T) {
	r := newEscrowRoutes(t, payments.NewSandboxGateway(webhookSecret))
	stranger := tokenFor(t, uuid.New())

	if rec := request(t, r.engine, http.MethodGet, r.path(""), stranger, nil); rec.Code != http.StatusNotFound {
		t.Errorf("stranger reading the contract = %d, want 404", rec.Code)
	}
	if rec := request(t, r.engine, http.MethodGet, r.path(""), tokenFor(t, r.freelancer), nil); rec.Code != http.StatusOK {
		t.Errorf("freelancer reading their contract = %d, want 200", rec.Code)
	}
	rec := request(t, r.engine, http.MethodPost, r.path("/milestones"), tokenFor(t, r.freelancer),
		map[string]any{"title": "Mine", "amount": 10})
	if rec.Code != http.StatusForbidden {
		t.Errorf("freelancer adding a milestone = %d, want 403", rec.Code)
	}
}

// Through HTTP end to end: schedule, fund, a forged and then a genuine
// confirmation, delivery, approval.
func TestEscrowRoutesEndToEnd(t *testing.T) {
	r := newEscrowRoutes(t, payments.NewSandboxGateway(webhookSecret))
	client, freelancer := tokenFor(t, r.client), tokenFor(t, r.freelancer)
	milestoneID := r.addMilestone(t, 1000.00)
	milestone := r.path("/milestones/" + milestoneID)

	rec := request(t, r.engine, http.MethodPost, milestone+"/fund", client, nil)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("fund = %d %s, want 202", rec.Code, rec.Body)
	}
	var funding struct {
		Intent struct {
			ProviderReference string `json:"provider_reference"`
			Status            string `json:"status"`
		} `json:"payment_intent"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &funding)
	if funding.Intent.Status != "requires_payment" || funding.Intent.ProviderReference == "" {
		t.Fatalf("funding response = %s", rec.Body)
	}

	body := []byte(`{"type":"charge.succeeded","reference":"` + funding.Intent.ProviderReference + `"}`)

	// Forged: unsigned, signed with the wrong key, or aimed at another provider.
	if rec := r.webhook(t, "sandbox", body, ""); rec.Code != http.StatusUnauthorized {
		t.Errorf("unsigned webhook = %d, want 401", rec.Code)
	}
	if rec := r.webhook(t, "sandbox", body, payments.SignSandboxPayload([]byte("wrong"), body)); rec.Code != http.StatusUnauthorized {
		t.Errorf("wrongly signed webhook = %d, want 401", rec.Code)
	}
	if rec := r.webhook(t, "another-processor", body, sign(body)); rec.Code != http.StatusNotFound {
		t.Errorf("webhook for an unknown provider = %d, want 404", rec.Code)
	}
	// Submitting is still refused: none of those funded anything.
	if rec := request(t, r.engine, http.MethodPost, milestone+"/submit", freelancer,
		map[string]any{"summary": "early"}); rec.Code != http.StatusConflict {
		t.Fatalf("submitting after forged confirmations = %d, want 409", rec.Code)
	}

	// Genuine, delivered twice as a processor would.
	for i := 0; i < 2; i++ {
		if rec := r.webhook(t, "sandbox", body, sign(body)); rec.Code != http.StatusOK {
			t.Fatalf("genuine webhook delivery %d = %d %s", i+1, rec.Code, rec.Body)
		}
	}

	if rec := request(t, r.engine, http.MethodPost, milestone+"/submit", freelancer,
		map[string]any{"summary": "Shipped", "attachments": []string{"https://example.com/demo"}}); rec.Code != http.StatusOK {
		t.Fatalf("submit = %d %s", rec.Code, rec.Body)
	}
	if rec := request(t, r.engine, http.MethodPost, milestone+"/approve", client, nil); rec.Code != http.StatusOK {
		t.Fatalf("approve = %d %s", rec.Code, rec.Body)
	}

	rec = request(t, r.engine, http.MethodGet, r.path(""), client, nil)
	var detail struct {
		Status string `json:"status"`
		Escrow struct {
			Released float64 `json:"released"`
		} `json:"escrow"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &detail)
	if detail.Status != "completed" || detail.Escrow.Released != 1000.00 {
		t.Fatalf("contract after the only milestone was released: %s", rec.Body)
	}
}

func TestFundingWithoutAProcessorAnswers503(t *testing.T) {
	r := newEscrowRoutes(t, nil)
	milestoneID := r.addMilestone(t, 500)
	rec := request(t, r.engine, http.MethodPost, r.path("/milestones/"+milestoneID+"/fund"), tokenFor(t, r.client), nil)
	if rec.Code != http.StatusServiceUnavailable || codeOf(t, rec) != CodePaymentsUnavailable {
		t.Fatalf("fund without a processor = %d %s", rec.Code, rec.Body)
	}
	// And the webhook has no provider to answer for.
	body := []byte(`{"type":"charge.succeeded","reference":"sbx_x"}`)
	if rec := r.webhook(t, "sandbox", body, sign(body)); rec.Code != http.StatusNotFound {
		t.Fatalf("webhook without a processor = %d, want 404", rec.Code)
	}
}

func TestOverSchedulingIsA400OnAmount(t *testing.T) {
	r := newEscrowRoutes(t, payments.NewSandboxGateway(webhookSecret))
	r.addMilestone(t, 900)
	rec := request(t, r.engine, http.MethodPost, r.path("/milestones"), tokenFor(t, r.client),
		map[string]any{"title": "Too much", "amount": 100.01})
	var body struct {
		Field string `json:"field"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	if rec.Code != http.StatusBadRequest || body.Field != "amount" {
		t.Fatalf("over-scheduling = %d %s, want 400 on amount", rec.Code, rec.Body)
	}
}

// fundedAndSubmittedOverHTTP is a single-milestone contract, funded and
// delivered, through the routes.
func (r *escrowRoutes) fundedAndSubmittedOverHTTP(t *testing.T) string {
	t.Helper()
	milestoneID := r.addMilestone(t, 1000.00)
	milestone := r.path("/milestones/" + milestoneID)
	rec := request(t, r.engine, http.MethodPost, milestone+"/fund", tokenFor(t, r.client), nil)
	var funding struct {
		Intent struct {
			ProviderReference string `json:"provider_reference"`
		} `json:"payment_intent"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &funding)
	body := []byte(`{"type":"charge.succeeded","reference":"` + funding.Intent.ProviderReference + `"}`)
	if rec := r.webhook(t, "sandbox", body, sign(body)); rec.Code != http.StatusOK {
		t.Fatalf("confirm: %d %s", rec.Code, rec.Body)
	}
	if rec := request(t, r.engine, http.MethodPost, milestone+"/submit", tokenFor(t, r.freelancer),
		map[string]any{"summary": "Done"}); rec.Code != http.StatusOK {
		t.Fatalf("submit: %d %s", rec.Code, rec.Body)
	}
	return milestoneID
}

func TestDisputeRoutes(t *testing.T) {
	r := newEscrowRoutes(t, payments.NewSandboxGateway(webhookSecret))
	client, freelancer, stranger := tokenFor(t, r.client), tokenFor(t, r.freelancer), tokenFor(t, uuid.New())
	milestone := r.path("/milestones/" + r.fundedAndSubmittedOverHTTP(t))

	if rec := request(t, r.engine, http.MethodPost, milestone+"/dispute", stranger,
		map[string]any{"reason": "quality", "detail": "x"}); rec.Code != http.StatusNotFound {
		t.Errorf("stranger opening a dispute = %d, want 404", rec.Code)
	}
	rec := request(t, r.engine, http.MethodPost, milestone+"/dispute", client,
		map[string]any{"reason": "quality", "detail": "Not what we agreed."})
	if rec.Code != http.StatusCreated {
		t.Fatalf("open dispute = %d %s", rec.Code, rec.Body)
	}
	var dispute struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &dispute)
	disputePath := "/api/v1/freelance/disputes/" + dispute.ID

	// Frozen: approval is refused while the dispute is open.
	if rec := request(t, r.engine, http.MethodPost, milestone+"/approve", client, nil); rec.Code != http.StatusConflict {
		t.Errorf("approve while disputed = %d, want 409", rec.Code)
	}
	if rec := request(t, r.engine, http.MethodPost, disputePath+"/evidence", freelancer,
		map[string]any{"kind": "link", "file_url": "https://example.com/proof"}); rec.Code != http.StatusCreated {
		t.Errorf("freelancer evidence = %d %s", rec.Code, rec.Body)
	}
	if rec := request(t, r.engine, http.MethodGet, disputePath, stranger, nil); rec.Code != http.StatusNotFound {
		t.Errorf("stranger reading the dispute = %d, want 404", rec.Code)
	}
	if rec := request(t, r.engine, http.MethodGet, r.path("/disputes"), freelancer, nil); rec.Code != http.StatusOK {
		t.Errorf("freelancer listing the contract's disputes = %d", rec.Code)
	}
	if rec := request(t, r.engine, http.MethodPost, disputePath+"/withdraw", freelancer, nil); rec.Code != http.StatusForbidden {
		t.Errorf("the other party withdrawing = %d, want 403", rec.Code)
	}
	if rec := request(t, r.engine, http.MethodPost, disputePath+"/withdraw", client, nil); rec.Code != http.StatusOK {
		t.Fatalf("withdraw = %d %s", rec.Code, rec.Body)
	}
	if rec := request(t, r.engine, http.MethodPost, milestone+"/approve", client, nil); rec.Code != http.StatusOK {
		t.Fatalf("approve after withdrawal = %d %s", rec.Code, rec.Body)
	}
}

func TestRefundRoute(t *testing.T) {
	r := newEscrowRoutes(t, payments.NewSandboxGateway(webhookSecret))
	milestone := r.path("/milestones/" + r.fundedAndSubmittedOverHTTP(t))
	reason := map[string]any{"reason": "We agreed to stop."}

	if rec := request(t, r.engine, http.MethodPost, milestone+"/refund", tokenFor(t, r.client), reason); rec.Code != http.StatusForbidden {
		t.Errorf("client refunding = %d, want 403", rec.Code)
	}
	rec := request(t, r.engine, http.MethodPost, milestone+"/refund", tokenFor(t, r.freelancer), reason)
	if rec.Code != http.StatusOK {
		t.Fatalf("freelancer refunding = %d %s", rec.Code, rec.Body)
	}
	var m struct {
		Status string `json:"status"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &m)
	if m.Status != "cancelled" {
		t.Fatalf("refunded milestone status = %q", m.Status)
	}
}
