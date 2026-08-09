package http

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	authMiddleware "kirmya/internal/auth/middleware"
	authRepository "kirmya/internal/auth/repository"
	authService "kirmya/internal/auth/service"
	companyRepo "kirmya/internal/company/repository"
	companyService "kirmya/internal/company/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// mountCompanyRoutes builds the module exactly as main.go does, minus the
// database. What is being tested here is the gate in front of each handler, and
// that gate runs before any query would.
func mountCompanyRoutes(t *testing.T) (*gin.Engine, *authService.AuthService) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	auth := authService.NewAuthService(authRepository.NewAuthRepository(nil))

	base := companyRepo.NewCompanyRepository(nil)
	mgmtRepo := companyRepo.NewManagementRepository(nil)
	handler := NewCompanyHandler(companyService.NewCompanyService(base, mgmtRepo))
	management := NewManagementHandler(companyService.NewManagementService(
		mgmtRepo, base, nil, "https://app.kirmya.com", "test-salt",
	))

	engine := gin.New()
	api := engine.Group("/api/v1")
	RegisterRoutes(api, handler, management, authMiddleware.NewAuthMiddleware(auth))
	return engine, auth
}

func call(t *testing.T, engine *gin.Engine, method, path, token string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader("{}"))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

// Every write endpoint sits behind authentication. This walks the real route
// tree rather than the handler functions, so a route accidentally registered on
// the public group would fail here even if its handler is correct.
func TestWriteRoutesRejectAnonymousRequests(t *testing.T) {
	engine, _ := mountCompanyRoutes(t)
	id := uuid.New().String()

	writes := []struct{ method, path string }{
		{http.MethodPost, "/api/v1/companies"},
		{http.MethodPut, "/api/v1/companies/" + id},
		{http.MethodPost, "/api/v1/companies/" + id + "/follow"},
		{http.MethodDelete, "/api/v1/companies/" + id + "/follow"},
		{http.MethodPost, "/api/v1/companies/" + id + "/people"},
		{http.MethodPut, "/api/v1/companies/" + id + "/people/" + id},
		{http.MethodPost, "/api/v1/companies/" + id + "/team/invite"},
		{http.MethodPut, "/api/v1/companies/" + id + "/team/" + id},
		{http.MethodDelete, "/api/v1/companies/" + id + "/team/" + id},
		{http.MethodPut, "/api/v1/companies/" + id + "/team/" + id + "/permissions"},
		{http.MethodPost, "/api/v1/companies/" + id + "/recruiters/invite"},
		{http.MethodPut, "/api/v1/companies/" + id + "/recruiters/" + id},
		{http.MethodDelete, "/api/v1/companies/" + id + "/recruiters/" + id},
		{http.MethodDelete, "/api/v1/companies/" + id + "/invitations/" + id},
		{http.MethodPost, "/api/v1/companies/invitations/sometoken/accept"},
		{http.MethodPost, "/api/v1/companies/invitations/sometoken/decline"},
		{http.MethodPost, "/api/v1/companies/" + id + "/verification"},
		{http.MethodPost, "/api/v1/companies/" + id + "/reviews"},
		{http.MethodPut, "/api/v1/companies/" + id + "/reviews/" + id},
		{http.MethodDelete, "/api/v1/companies/" + id + "/reviews/" + id},
		{http.MethodPost, "/api/v1/companies/" + id + "/reviews/" + id + "/report"},
		{http.MethodPost, "/api/v1/companies/" + id + "/reviews/" + id + "/response"},
		{http.MethodPost, "/api/v1/companies/" + id + "/updates"},
		{http.MethodPut, "/api/v1/companies/" + id + "/updates/" + id},
		{http.MethodDelete, "/api/v1/companies/" + id + "/updates/" + id},
		{http.MethodPost, "/api/v1/companies/" + id + "/report"},
	}

	for _, route := range writes {
		t.Run(route.method+" "+route.path, func(t *testing.T) {
			if rec := call(t, engine, route.method, route.path, ""); rec.Code != http.StatusUnauthorized {
				t.Errorf("status = %d, want 401 (body %s)", rec.Code, rec.Body.String())
			}
		})
	}
}

// The private half of a company — its team, invitations, verification file,
// dashboard, analytics and audit trail — is not readable without a token
// either.
func TestPrivateReadRoutesRejectAnonymousRequests(t *testing.T) {
	engine, _ := mountCompanyRoutes(t)
	id := uuid.New().String()

	reads := []string{
		"/api/v1/companies/following",
		"/api/v1/companies/mine",
		"/api/v1/companies/" + id + "/team",
		"/api/v1/companies/" + id + "/recruiters",
		"/api/v1/companies/" + id + "/invitations",
		"/api/v1/companies/" + id + "/verification",
		"/api/v1/companies/" + id + "/dashboard",
		"/api/v1/companies/" + id + "/analytics",
		"/api/v1/companies/" + id + "/jobs/" + id + "/analytics",
		"/api/v1/companies/" + id + "/audit",
	}

	for _, path := range reads {
		t.Run(path, func(t *testing.T) {
			if rec := call(t, engine, http.MethodGet, path, ""); rec.Code != http.StatusUnauthorized {
				t.Errorf("status = %d, want 401 (body %s)", rec.Code, rec.Body.String())
			}
		})
	}
}

// A forged or expired token is not a token. Without this the 401s above would
// only prove that the header is required, not that it is checked.
func TestWriteRoutesRejectInvalidTokens(t *testing.T) {
	engine, _ := mountCompanyRoutes(t)

	tokens := map[string]string{
		"gibberish":     "not-a-jwt",
		"forged HS256":  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGI3In0.forged",
		"alg none":      "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiI2MGI3In0.",
		"empty segment": ".",
	}

	for name, token := range tokens {
		t.Run(name, func(t *testing.T) {
			if rec := call(t, engine, http.MethodPost, "/api/v1/companies", token); rec.Code != http.StatusUnauthorized {
				t.Errorf("a forged token was accepted: status %d, body %s", rec.Code, rec.Body.String())
			}
		})
	}
}

// Verification decisions live behind the administrator role as well as
// authentication. A signed-in company owner reaching this route must be
// refused by the middleware before the service ever sees the request.
func TestVerificationDecisionRoutesRequireAdminRole(t *testing.T) {
	engine, auth := mountCompanyRoutes(t)
	verificationID := uuid.New().String()

	ordinary, err := auth.GenerateAccessToken(uuid.New(), "owner@example.com", "user")
	if err != nil {
		t.Fatalf("mint token: %v", err)
	}

	if rec := call(t, engine, http.MethodGet, "/api/v1/admin/company-verifications", ordinary); rec.Code != http.StatusForbidden {
		t.Errorf("review queue: status = %d, want 403 (body %s)", rec.Code, rec.Body.String())
	}
	if rec := call(t, engine, http.MethodPut, "/api/v1/admin/company-verifications/"+verificationID, ordinary); rec.Code != http.StatusForbidden {
		t.Errorf("decision: status = %d, want 403 (body %s)", rec.Code, rec.Body.String())
	}
	if rec := call(t, engine, http.MethodGet, "/api/v1/admin/company-verifications", ""); rec.Code != http.StatusUnauthorized {
		t.Errorf("anonymous review queue: status = %d, want 401", rec.Code)
	}

	// Holding a company-scoped role name at the platform level changes nothing:
	// the route allows 'admin' and 'super_admin' only.
	for _, role := range []string{"company_owner", "org_admin", "recruiter", "employer"} {
		token, err := auth.GenerateAccessToken(uuid.New(), "user@example.com", role)
		if err != nil {
			t.Fatalf("mint token: %v", err)
		}
		if rec := call(t, engine, http.MethodGet, "/api/v1/admin/company-verifications", token); rec.Code != http.StatusForbidden {
			t.Errorf("role %q reached the review queue: status %d", role, rec.Code)
		}
	}
}

// An administrator gets past the role gate. The request then fails at the
// database, which is a different failure and proves the gate is what was being
// measured above.
func TestAdministratorPassesTheRoleGate(t *testing.T) {
	engine, auth := mountCompanyRoutes(t)

	token, err := auth.GenerateAccessToken(uuid.New(), "staff@kirmya.com", "admin")
	if err != nil {
		t.Fatalf("mint token: %v", err)
	}

	rec := call(t, engine, http.MethodGet, "/api/v1/admin/company-verifications", token)
	if rec.Code == http.StatusForbidden || rec.Code == http.StatusUnauthorized {
		t.Errorf("an administrator was refused: status %d, body %s", rec.Code, rec.Body.String())
	}
}

// Public reads stay reachable without a token. A company page that 401s is a
// broken company page, and the spec requires these to work for visitors.
func TestPublicReadRoutesAcceptAnonymousRequests(t *testing.T) {
	engine, _ := mountCompanyRoutes(t)
	id := uuid.New().String()

	public := []string{
		"/api/v1/companies",
		"/api/v1/companies/featured",
		"/api/v1/companies/popular",
		"/api/v1/companies/industries",
		"/api/v1/companies/permissions",
		"/api/v1/companies/search",
		"/api/v1/companies/discovery",
		"/api/v1/companies/" + id,
		"/api/v1/companies/" + id + "/people",
		"/api/v1/companies/" + id + "/jobs",
		"/api/v1/companies/" + id + "/reviews",
		"/api/v1/companies/" + id + "/updates",
		"/api/v1/company/acme-middle-east",
		"/api/v1/company/acme-middle-east/people",
		"/api/v1/company/acme-middle-east/jobs",
		"/api/v1/company/acme-middle-east/reviews",
		"/api/v1/company/acme-middle-east/updates",
	}

	for _, path := range public {
		t.Run(path, func(t *testing.T) {
			rec := call(t, engine, http.MethodGet, path, "")
			if rec.Code == http.StatusUnauthorized || rec.Code == http.StatusForbidden {
				t.Errorf("a public page demanded a token: status %d, body %s", rec.Code, rec.Body.String())
			}
			if rec.Code == http.StatusNotFound && strings.Contains(rec.Body.String(), "404 page not found") {
				t.Errorf("route is not registered at all")
			}
		})
	}
}

// The permission catalogue is public because the settings UI renders from it
// before a company exists. It must therefore contain the vocabulary and
// nothing about any company.
func TestPermissionCatalogueIsPublicAndCompanyFree(t *testing.T) {
	engine, _ := mountCompanyRoutes(t)

	rec := call(t, engine, http.MethodGet, "/api/v1/companies/permissions", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body %s", rec.Code, rec.Body.String())
	}

	body := rec.Body.String()
	for _, want := range []string{"company_owner", "org_admin", "recruiter_admin", "hiring_manager", "recruiter", "employee", "viewer"} {
		if !strings.Contains(body, want) {
			t.Errorf("the catalogue omits %q", want)
		}
	}
}

// Passing no auth middleware must not mount the write routes unauthenticated.
// A wiring mistake in main.go has to produce a missing route, not an open one.
func TestRoutesRefuseToMountWritesWithoutAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)

	base := companyRepo.NewCompanyRepository(nil)
	mgmtRepo := companyRepo.NewManagementRepository(nil)
	handler := NewCompanyHandler(companyService.NewCompanyService(base, mgmtRepo))
	management := NewManagementHandler(companyService.NewManagementService(
		mgmtRepo, base, nil, "https://app.kirmya.com", "test-salt",
	))

	engine := gin.New()
	api := engine.Group("/api/v1")
	RegisterRoutes(api, handler, management, nil)

	for _, route := range engine.Routes() {
		if route.Method != http.MethodGet {
			t.Errorf("write route %s %s was mounted without an auth middleware", route.Method, route.Path)
		}
	}

	// The public reads are still there, so an unauthenticated deployment
	// degrades to a read-only company directory rather than to nothing.
	if len(engine.Routes()) == 0 {
		t.Error("no routes were mounted at all")
	}
}
