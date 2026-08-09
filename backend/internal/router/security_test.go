package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

const testOrigin = "http://localhost:3000"

func newSecuredEngine() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return New(Handlers{AllowedOrigins: []string{testOrigin}}, SwaggerConfig{})
}

// TestCORSWiredIntoRouter guards the wiring itself: the middleware existing is
// no use if New forgets to mount it, and the browser then fails every call.
func TestCORSWiredIntoRouter(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/metrics", nil)
	// Metrics only answer internal callers unless credentials are configured.
	req.RemoteAddr = "127.0.0.1:5555"
	req.Header.Set("Origin", testOrigin)
	rec := httptest.NewRecorder()
	newSecuredEngine().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != testOrigin {
		t.Errorf("expected the frontend origin allowed, got %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Errorf("expected credentialed requests allowed, got %q", got)
	}
}

// TestPreflightOnUnmatchedRouteIsAnswered covers the case that breaks browsers
// hardest: gin registers no OPTIONS handlers, so preflights fall through to the
// 404 chain and must still come back with CORS headers.
func TestPreflightOnUnmatchedRouteIsAnswered(t *testing.T) {
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/onboarding/save", nil)
	req.Header.Set("Origin", testOrigin)
	req.Header.Set("Access-Control-Request-Method", http.MethodPut)
	req.Header.Set("Access-Control-Request-Headers", "authorization,content-type")
	rec := httptest.NewRecorder()
	newSecuredEngine().ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for preflight, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != testOrigin {
		t.Errorf("expected the frontend origin allowed on preflight, got %q", got)
	}
}

func TestSecurityHeadersWiredIntoRouter(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/metrics", nil)
	req.RemoteAddr = "127.0.0.1:5555"
	rec := httptest.NewRecorder()
	newSecuredEngine().ServeHTTP(rec, req)

	for header, want := range map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"Referrer-Policy":        "strict-origin-when-cross-origin",
	} {
		if got := rec.Header().Get(header); got != want {
			t.Errorf("expected %s: %q, got %q", header, want, got)
		}
	}
	if rec.Header().Get("Content-Security-Policy") == "" {
		t.Error("expected a Content-Security-Policy header")
	}
}
