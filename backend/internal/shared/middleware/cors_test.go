package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
)

const frontendOrigin = "http://localhost:3000"

func corsEngine() *gin.Engine {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(middleware.CORS([]string{frontendOrigin, "https://app.kirmya.com"}))
	engine.GET("/api/v1/onboarding", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"ok": true}) })
	return engine
}

func do(engine *gin.Engine, method, path string, headers map[string]string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, nil)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func TestCORS_AllowedOriginGetsCredentialedHeaders(t *testing.T) {
	rec := do(corsEngine(), http.MethodGet, "/api/v1/onboarding", map[string]string{"Origin": frontendOrigin})

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != frontendOrigin {
		t.Errorf("expected the exact origin echoed, got %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Errorf("expected credentials to be allowed, got %q", got)
	}
	if got := rec.Header().Get("Vary"); !strings.Contains(got, "Origin") {
		t.Errorf("expected Vary to include Origin, got %q", got)
	}
}

func TestCORS_UnknownOriginGetsNoAllowOrigin(t *testing.T) {
	rec := do(corsEngine(), http.MethodGet, "/api/v1/onboarding", map[string]string{"Origin": "https://evil.example"})

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("expected no Access-Control-Allow-Origin for an unknown origin, got %q", got)
	}
	if got := rec.Header().Get("Vary"); !strings.Contains(got, "Origin") {
		t.Errorf("expected Vary to include Origin, got %q", got)
	}
}

func TestCORS_PreflightIsAnsweredWithoutReachingHandlers(t *testing.T) {
	// No OPTIONS route is registered: the preflight must still be answered.
	rec := do(corsEngine(), http.MethodOptions, "/api/v1/onboarding/save", map[string]string{
		"Origin":                         frontendOrigin,
		"Access-Control-Request-Method":  http.MethodPut,
		"Access-Control-Request-Headers": "authorization,content-type",
	})

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for preflight, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != frontendOrigin {
		t.Errorf("expected the origin echoed on preflight, got %q", got)
	}
	for _, want := range []string{http.MethodPut, http.MethodDelete, http.MethodPatch} {
		if !strings.Contains(rec.Header().Get("Access-Control-Allow-Methods"), want) {
			t.Errorf("expected %s in Access-Control-Allow-Methods, got %q", want, rec.Header().Get("Access-Control-Allow-Methods"))
		}
	}
	allowHeaders := strings.ToLower(rec.Header().Get("Access-Control-Allow-Headers"))
	for _, want := range []string{"authorization", "content-type", "x-tenant-id"} {
		if !strings.Contains(allowHeaders, want) {
			t.Errorf("expected %s in Access-Control-Allow-Headers, got %q", want, allowHeaders)
		}
	}
	if rec.Header().Get("Access-Control-Max-Age") == "" {
		t.Error("expected Access-Control-Max-Age so browsers cache the preflight")
	}
}

func TestCORS_PreflightFromUnknownOriginIsRejected(t *testing.T) {
	rec := do(corsEngine(), http.MethodOptions, "/api/v1/onboarding", map[string]string{
		"Origin":                        "https://evil.example",
		"Access-Control-Request-Method": http.MethodGet,
	})

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for preflight, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("expected no Access-Control-Allow-Origin for an unknown origin, got %q", got)
	}
}

func TestCORS_RequestWithoutOriginIsUntouched(t *testing.T) {
	rec := do(corsEngine(), http.MethodGet, "/api/v1/onboarding", nil)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("expected no CORS headers without an Origin, got %q", got)
	}
}

func TestCORS_NoConfiguredOriginsAllowsNothing(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(middleware.CORS(nil))
	engine.GET("/api/v1/onboarding", func(c *gin.Context) { c.Status(http.StatusOK) })

	rec := do(engine, http.MethodGet, "/api/v1/onboarding", map[string]string{"Origin": frontendOrigin})
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("expected no origin allowed when none are configured, got %q", got)
	}
}
