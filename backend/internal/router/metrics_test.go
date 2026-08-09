package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func metricsRequest(engine *gin.Engine, remoteAddr string, mutate func(*http.Request)) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/metrics", nil)
	req.RemoteAddr = remoteAddr
	if mutate != nil {
		mutate(req)
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func TestMetrics_PublicCallerIsRefused(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := New(Handlers{}, SwaggerConfig{})

	rec := metricsRequest(engine, "203.0.113.9:41000", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for a public caller, got %d", rec.Code)
	}
	if strings.Contains(rec.Body.String(), "kirmya") {
		t.Errorf("metrics body leaked to a public caller: %s", rec.Body.String())
	}
}

// TestMetrics_ForwardedForCannotForgeInternalAccess covers the bypass that
// makes an IP allowlist worthless: the guard reads the socket peer, not the
// X-Forwarded-For header the caller controls.
func TestMetrics_ForwardedForCannotForgeInternalAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := New(Handlers{}, SwaggerConfig{})

	rec := metricsRequest(engine, "203.0.113.9:41000", func(r *http.Request) {
		r.Header.Set("X-Forwarded-For", "127.0.0.1")
	})
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected a spoofed X-Forwarded-For to be ignored, got %d", rec.Code)
	}
}

func TestMetrics_InternalCallerIsAllowed(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := New(Handlers{}, SwaggerConfig{})

	rec := metricsRequest(engine, "127.0.0.1:41000", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for a loopback scraper, got %d", rec.Code)
	}
	if rec.Body.Len() == 0 {
		t.Error("expected a metrics body for an allowed caller")
	}
}

func TestMetrics_BasicAuthGatesRemoteScrapers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := New(Handlers{Metrics: MetricsConfig{Username: "scraper", Password: "s3cret"}}, SwaggerConfig{})

	rec := metricsRequest(engine, "203.0.113.9:41000", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without credentials, got %d", rec.Code)
	}
	if rec.Header().Get("WWW-Authenticate") == "" {
		t.Error("expected a WWW-Authenticate challenge")
	}

	rec = metricsRequest(engine, "203.0.113.9:41000", func(r *http.Request) {
		r.SetBasicAuth("scraper", "wrong")
	})
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for a wrong password, got %d", rec.Code)
	}

	rec = metricsRequest(engine, "203.0.113.9:41000", func(r *http.Request) {
		r.SetBasicAuth("scraper", "s3cret")
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for a credentialed scraper, got %d", rec.Code)
	}
}

// TestMetrics_BasicAuthAppliesToLoopbackToo makes sure configuring credentials
// closes the network shortcut rather than adding a second way in.
func TestMetrics_BasicAuthAppliesToLoopbackToo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := New(Handlers{Metrics: MetricsConfig{Username: "scraper", Password: "s3cret"}}, SwaggerConfig{})

	rec := metricsRequest(engine, "127.0.0.1:41000", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected loopback to still need credentials, got %d", rec.Code)
	}
}
