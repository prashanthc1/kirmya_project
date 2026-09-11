package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/repository"
	"kirmya/internal/freelance/service"
	configPkg "kirmya/internal/shared/config"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

// freelanceRouter builds the real route table over the real service.
//
// Not a stub: these tests assert which middleware a request survives, and a
// hand-written double would only prove that the double agrees with the test.
func freelanceRouter(t *testing.T) (*gin.Engine, service.FreelanceService) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	svc := service.NewFreelanceService(repository.NewFreelanceRepository(nil))
	engine := gin.New()
	api := engine.Group("/api/v1")
	RegisterRoutes(api, NewFreelanceHandler(svc), svc)
	return engine, svc
}

func tokenFor(t *testing.T, userID uuid.UUID) string {
	t.Helper()
	claims := sharedMiddleware.JWTClaims{
		UserID: userID,
		Email:  "freelancer@example.com",
		// Deliberately the ordinary user role. Freelancer capability must not
		// be derived from the global role, in either direction.
		Role: sharedMiddleware.RoleUser,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString(configPkg.GetJWTSecretBytes())
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}

func request(t *testing.T, engine *gin.Engine, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var payload []byte
	if body != nil {
		payload, _ = json.Marshal(body)
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func codeOf(t *testing.T, rec *httptest.ResponseRecorder) string {
	t.Helper()
	var body struct {
		Code string `json:"code"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	return body.Code
}

const proposalPath = "/api/v1/freelance/projects/00000000-0000-0000-0000-000000000001/proposals"

func proposalBody() map[string]any {
	return map[string]any{"bid_amount": 100, "estimated_days": 3, "cover_letter": "hello"}
}

// An ordinary professional account is refused the freelancer-only route, and is
// told which of the two refusals it is.
func TestProfessionalIsRefusedFreelancerRoutes(t *testing.T) {
	engine, _ := freelanceRouter(t)
	token := tokenFor(t, uuid.New())

	rec := request(t, engine, http.MethodPost, proposalPath, token, proposalBody())
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403 (body: %s)", rec.Code, rec.Body.String())
	}
	if got := codeOf(t, rec); got != CodeFreelancerOnboardingRequired {
		t.Errorf("code = %q, want %q", got, CodeFreelancerOnboardingRequired)
	}
}

// Anonymous is 401, not 403: nothing established who is asking.
func TestAnonymousIsRefusedFreelancerRoutes(t *testing.T) {
	engine, _ := freelanceRouter(t)

	if rec := request(t, engine, http.MethodPost, proposalPath, "", proposalBody()); rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}

// Pending is refused too. Having started onboarding is not having finished it.
func TestPendingFreelancerIsRefused(t *testing.T) {
	engine, svc := freelanceRouter(t)
	userID := uuid.New()
	token := tokenFor(t, userID)

	if _, err := svc.SaveProfile(t.Context(), userID, domain.SaveProfilePayload{
		HourlyRate: 90, Tagline: "Backend engineer", Skills: []string{"Go"},
	}); err != nil {
		t.Fatalf("save draft: %v", err)
	}

	rec := request(t, engine, http.MethodPost, proposalPath, token, proposalBody())
	if rec.Code != http.StatusForbidden {
		t.Fatalf("a pending freelancer got %d, want 403 (body: %s)", rec.Code, rec.Body.String())
	}
	if got := codeOf(t, rec); got != CodeFreelancerOnboardingRequired {
		t.Errorf("code = %q, want %q", got, CodeFreelancerOnboardingRequired)
	}
}

// Active passes the gate. The handler beyond it may do whatever it does; what
// matters here is that the request was not refused by the capability check.
func TestActiveFreelancerPassesTheGate(t *testing.T) {
	engine, svc := freelanceRouter(t)
	userID := uuid.New()
	token := tokenFor(t, userID)

	if _, err := svc.SaveProfile(t.Context(), userID, domain.SaveProfilePayload{
		HourlyRate: 90, Tagline: "Backend engineer", Skills: []string{"Go"},
	}); err != nil {
		t.Fatalf("save draft: %v", err)
	}
	if _, err := svc.CompleteOnboarding(t.Context(), userID); err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}

	rec := request(t, engine, http.MethodPost, proposalPath, token, proposalBody())
	if rec.Code == http.StatusForbidden {
		t.Fatalf("an active freelancer was refused: %s", rec.Body.String())
	}
}

// Suspension denies, and says so distinctly: a client must be able to tell
// "finish onboarding" from "an administrator withdrew this".
func TestSuspendedFreelancerIsRefusedDistinctly(t *testing.T) {
	engine, svc := freelanceRouter(t)
	userID := uuid.New()
	token := tokenFor(t, userID)

	if _, err := svc.SaveProfile(t.Context(), userID, domain.SaveProfilePayload{
		HourlyRate: 90, Tagline: "Backend engineer", Skills: []string{"Go"},
	}); err != nil {
		t.Fatalf("save draft: %v", err)
	}
	if _, err := svc.CompleteOnboarding(t.Context(), userID); err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}
	if err := svc.SuspendCapability(t.Context(), uuid.New(), userID, "CI"); err != nil {
		t.Fatalf("suspend: %v", err)
	}

	rec := request(t, engine, http.MethodPost, proposalPath, token, proposalBody())
	if rec.Code != http.StatusForbidden {
		t.Fatalf("a suspended freelancer got %d, want 403 (body: %s)", rec.Code, rec.Body.String())
	}
	if got := codeOf(t, rec); got != CodeFreelancerAccessSuspended {
		t.Errorf("code = %q, want %q", got, CodeFreelancerAccessSuspended)
	}
}

// The onboarding routes stay open to an ordinary professional. They are the
// only door in, so closing them would make the capability unobtainable.
func TestOnboardingRoutesAreReachableByAProfessional(t *testing.T) {
	engine, _ := freelanceRouter(t)
	token := tokenFor(t, uuid.New())

	rec := request(t, engine, http.MethodGet, "/api/v1/freelance/onboarding", token, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /freelance/onboarding = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	var status service.OnboardingStatus
	if err := json.Unmarshal(rec.Body.Bytes(), &status); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if status.Capability != service.CapabilityNone {
		t.Errorf("capability = %q, want %q", status.Capability, service.CapabilityNone)
	}
	if status.Profile != nil {
		t.Errorf("onboarding status invented a profile: %+v", status.Profile)
	}

	// Saving the draft is allowed, and grants nothing.
	rec = request(t, engine, http.MethodPost, "/api/v1/freelance/profile", token, map[string]any{
		"hourly_rate": 90, "tagline": "Backend engineer", "skills": []string{"Go"},
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("POST /freelance/profile = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}

	// And the freelancer-only route is still refused until onboarding completes.
	if rec := request(t, engine, http.MethodPost, proposalPath, token, proposalBody()); rec.Code != http.StatusForbidden {
		t.Errorf("saving a draft opened the freelancer-only route: %d", rec.Code)
	}

	if rec := request(t, engine, http.MethodPost, "/api/v1/freelance/onboarding/complete", token, nil); rec.Code != http.StatusOK {
		t.Fatalf("POST /freelance/onboarding/complete = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	if rec := request(t, engine, http.MethodPost, proposalPath, token, proposalBody()); rec.Code == http.StatusForbidden {
		t.Errorf("completing onboarding did not open the freelancer-only route: %s", rec.Body.String())
	}
}

// Project discovery is public, and stays public: browsing the marketplace is
// how somebody decides whether to become a freelancer.
func TestProjectDiscoveryStaysPublic(t *testing.T) {
	engine, _ := freelanceRouter(t)

	rec := request(t, engine, http.MethodGet, "/api/v1/freelance/projects", "", nil)
	if rec.Code == http.StatusUnauthorized || rec.Code == http.StatusForbidden {
		t.Errorf("GET /freelance/projects returned %d anonymously; it is meant to be public", rec.Code)
	}
}

// Posting a project and accepting a proposal are hiring, not freelancing. A
// client who is not a freelancer must keep their own projects.
func TestHiringDoesNotRequireFreelancerCapability(t *testing.T) {
	engine, _ := freelanceRouter(t)
	token := tokenFor(t, uuid.New())

	rec := request(t, engine, http.MethodPost, "/api/v1/freelance/projects", token, map[string]any{
		"title": "Index tuning", "description": "Audit the migrations", "budget": 3000,
	})
	if rec.Code == http.StatusForbidden {
		t.Errorf("a client without freelancer capability could not post a project: %s", rec.Body.String())
	}

	// And their own contract list is readable.
	if rec := request(t, engine, http.MethodGet, "/api/v1/freelance/contracts", token, nil); rec.Code == http.StatusForbidden {
		t.Errorf("a client without freelancer capability could not read their contracts: %s", rec.Body.String())
	}
}

// A suspended freelancer keeps read access to engagements they are already
// party to. Suspension stops new commercial activity; it does not hide an
// obligation from the person bound by it.
func TestSuspendedFreelancerKeepsContractReadAccess(t *testing.T) {
	engine, svc := freelanceRouter(t)
	userID := uuid.New()
	token := tokenFor(t, userID)

	if _, err := svc.SaveProfile(t.Context(), userID, domain.SaveProfilePayload{
		HourlyRate: 90, Tagline: "Backend engineer", Skills: []string{"Go"},
	}); err != nil {
		t.Fatalf("save draft: %v", err)
	}
	if _, err := svc.CompleteOnboarding(t.Context(), userID); err != nil {
		t.Fatalf("complete onboarding: %v", err)
	}
	if err := svc.SuspendCapability(t.Context(), uuid.New(), userID, "CI"); err != nil {
		t.Fatalf("suspend: %v", err)
	}

	if rec := request(t, engine, http.MethodGet, "/api/v1/freelance/contracts", token, nil); rec.Code != http.StatusOK {
		t.Errorf("a suspended freelancer could not read their contracts: %d %s", rec.Code, rec.Body.String())
	}
	// Their own profile too - suspension preserves, it does not erase.
	if rec := request(t, engine, http.MethodGet, "/api/v1/freelance/profile", token, nil); rec.Code != http.StatusOK {
		t.Errorf("a suspended freelancer could not read their own profile: %d", rec.Code)
	}
}

// The profile endpoint tells the truth about an account that has none, rather
// than answering 200 with an invented one.
func TestOwnProfileIsNotFabricated(t *testing.T) {
	engine, _ := freelanceRouter(t)

	rec := request(t, engine, http.MethodGet, "/api/v1/freelance/profile", tokenFor(t, uuid.New()), nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("GET /freelance/profile for a non-freelancer = %d, want 404 (body: %s)", rec.Code, rec.Body.String())
	}
}

// Repeated freelancer-only requests by an ordinary account are refused, and
// create nothing. This is the self-provisioning defect, asked directly.
func TestRepeatedRequestsProvisionNothing(t *testing.T) {
	engine, svc := freelanceRouter(t)
	userID := uuid.New()
	token := tokenFor(t, userID)

	for i := 0; i < 10; i++ {
		if rec := request(t, engine, http.MethodPost, proposalPath, token, proposalBody()); rec.Code != http.StatusForbidden {
			t.Fatalf("request %d returned %d, want 403", i, rec.Code)
		}
	}

	capability, err := svc.FreelancerCapability(t.Context(), userID)
	if err != nil {
		t.Fatalf("capability: %v", err)
	}
	if capability != service.CapabilityNone {
		t.Errorf("ten refused requests produced capability %q, want %q", capability, service.CapabilityNone)
	}
	if _, err := svc.GetProfileByUserID(t.Context(), userID); err == nil {
		t.Error("ten refused requests created a freelancer profile")
	}
}

// A router wired without the service refuses rather than admitting.
func TestCapabilityGateFailsClosedWithoutAService(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	api := engine.Group("/api/v1")
	RegisterRoutes(api, NewFreelanceHandler(nil), nil)

	rec := request(t, engine, http.MethodPost, proposalPath, tokenFor(t, uuid.New()), proposalBody())
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500 when no capability source is wired", rec.Code)
	}
}
