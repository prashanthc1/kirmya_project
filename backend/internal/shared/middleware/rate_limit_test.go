package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
)

func limitedEngine(rate, capacity float64) *gin.Engine {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(middleware.RateLimiter(rate, capacity))
	engine.GET("/ping", func(c *gin.Context) { c.Status(http.StatusOK) })
	return engine
}

func getFrom(engine *gin.Engine, ip string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, "/ping", nil)
	req.RemoteAddr = ip + ":40000"
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func TestRateLimiter_AllowsBurstThenRejects(t *testing.T) {
	// Refill is slow enough that the third request cannot be funded by elapsed time.
	engine := limitedEngine(0.01, 2)

	for i := 1; i <= 2; i++ {
		if rec := getFrom(engine, "10.0.0.1"); rec.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200 within burst, got %d", i, rec.Code)
		}
	}

	rec := getFrom(engine, "10.0.0.1")
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 once the burst is spent, got %d", rec.Code)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Error("expected a Retry-After header on 429")
	}
	if got := rec.Header().Get("X-RateLimit-Limit"); got != "2" {
		t.Errorf("expected X-RateLimit-Limit 2, got %q", got)
	}
}

func TestRateLimiter_IsPerClientIP(t *testing.T) {
	engine := limitedEngine(0.01, 1)

	if rec := getFrom(engine, "10.0.0.1"); rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for the first client, got %d", rec.Code)
	}
	if rec := getFrom(engine, "10.0.0.1"); rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected the first client to be limited, got %d", rec.Code)
	}
	if rec := getFrom(engine, "10.0.0.2"); rec.Code != http.StatusOK {
		t.Errorf("expected a different client to keep its own budget, got %d", rec.Code)
	}
}

// TestRateLimiter_InstancesAreIndependent pins the bug that made a second
// limiter unusable: every RateLimiter used to share one package-level bucket
// registry, so spending the budget on one route drained every other route the
// same client touched.
func TestRateLimiter_InstancesAreIndependent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.GET("/ping", middleware.RateLimiter(0.01, 1), func(c *gin.Context) { c.Status(http.StatusOK) })
	engine.GET("/auth/login", middleware.RateLimiter(0.01, 1), func(c *gin.Context) { c.Status(http.StatusOK) })

	call := func(path string) int {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		req.RemoteAddr = "10.0.0.3:40000"
		rec := httptest.NewRecorder()
		engine.ServeHTTP(rec, req)
		return rec.Code
	}

	if code := call("/ping"); code != http.StatusOK {
		t.Fatalf("expected 200 on the first /ping, got %d", code)
	}
	if code := call("/ping"); code != http.StatusTooManyRequests {
		t.Fatalf("expected /ping to be limited after its burst, got %d", code)
	}
	if code := call("/auth/login"); code != http.StatusOK {
		t.Errorf("expected /auth/login to keep its own budget, got %d", code)
	}
}

func TestRateLimiter_DisabledWhenRateIsZero(t *testing.T) {
	engine := limitedEngine(0, 0)

	for i := 0; i < 20; i++ {
		if rec := getFrom(engine, "10.0.0.4"); rec.Code != http.StatusOK {
			t.Fatalf("expected no limiting when disabled, got %d on request %d", rec.Code, i)
		}
	}
}
