package http_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	onboardingHttp "kirmya/internal/onboarding/delivery/http"
	"kirmya/internal/onboarding/repository"
	"kirmya/internal/onboarding/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// newTestEngine wires the onboarding handler over the in-memory repository. When
// authUser is non-nil the request context carries it the way OptionalAuth would
// for a valid bearer token.
func newTestEngine(t *testing.T, authUser *uuid.UUID) (*gin.Engine, service.OnboardingService) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	svc := service.NewOnboardingService(repository.NewOnboardingRepository(nil))
	handler := onboardingHttp.NewOnboardingHandler(svc)

	engine := gin.New()
	api := engine.Group("/api/v1")
	if authUser != nil {
		api.Use(func(c *gin.Context) {
			c.Set("userID", *authUser)
			c.Next()
		})
	}
	onboardingHttp.RegisterRoutes(api, handler, nil)
	return engine, svc
}

func saveStep(t *testing.T, engine *gin.Engine, step string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/onboarding/save", strings.NewReader(`{"step":`+step+`}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func TestSaveProgress_AnonymousWritesAsDemoUser(t *testing.T) {
	engine, svc := newTestEngine(t, nil)

	if rec := saveStep(t, engine, "5"); rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for anonymous save, got %d: %s", rec.Code, rec.Body.String())
	}

	p, err := svc.GetProgress(context.Background(), onboardingHttp.DemoUserID)
	if err != nil {
		t.Fatalf("unexpected error reading demo progress: %v", err)
	}
	if p.CurrentStep != 5 {
		t.Errorf("expected demo user at step 5, got %d", p.CurrentStep)
	}
}

func TestSaveProgress_AuthenticatedWritesAsRealUser(t *testing.T) {
	userID := uuid.New()
	engine, svc := newTestEngine(t, &userID)

	if rec := saveStep(t, engine, "7"); rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for authenticated save, got %d: %s", rec.Code, rec.Body.String())
	}

	p, err := svc.GetProgress(context.Background(), userID)
	if err != nil {
		t.Fatalf("unexpected error reading user progress: %v", err)
	}
	if p.CurrentStep != 7 {
		t.Errorf("expected user at step 7, got %d", p.CurrentStep)
	}

	demo, err := svc.GetProgress(context.Background(), onboardingHttp.DemoUserID)
	if err != nil {
		t.Fatalf("unexpected error reading demo progress: %v", err)
	}
	if demo.CurrentStep != 1 {
		t.Errorf("authenticated write leaked into the demo user: step %d", demo.CurrentStep)
	}
}

func TestSaveProgress_AnonymousRejectedWhenDemoUserDisabled(t *testing.T) {
	t.Setenv("ONBOARDING_ALLOW_DEMO_USER", "false")
	engine, _ := newTestEngine(t, nil)

	rec := saveStep(t, engine, "5")
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 when the demo fallback is off, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestGetProgress_AnonymousReadsDemoUser(t *testing.T) {
	engine, _ := newTestEngine(t, nil)

	if rec := saveStep(t, engine, "3"); rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for anonymous save, got %d: %s", rec.Code, rec.Body.String())
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/onboarding", nil)
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 reading anonymous progress, got %d: %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"current_step":3`) {
		t.Errorf("expected step 3 in response, got %s", rec.Body.String())
	}
}
