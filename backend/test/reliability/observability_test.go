package reliability

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sharedErrors "kirmya/internal/shared/errors"
	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestPanicRecoveryMiddleware(t *testing.T) {
	router := gin.New()
	router.Use(middleware.PanicRecovery())

	router.GET("/test-panic", func(c *gin.Context) {
		panic("simulated critical crash in handler")
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test-panic", nil)
	req.Header.Set("X-Request-ID", "test-req-12345")

	router.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", w.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response JSON: %v", err)
	}

	if resp["code"] != "INTERNAL_ERROR" {
		t.Errorf("expected error code INTERNAL_ERROR, got %v", resp["code"])
	}

	// Verify no stack trace or internal details leaked
	bodyStr := w.Body.String()
	if bodyStr == "" || resp["error"] != "An unexpected internal error occurred. Please try again." {
		t.Errorf("unexpected error message: %v", resp["error"])
	}
}

func TestTelemetryAndRequestIDPropagation(t *testing.T) {
	router := gin.New()
	router.Use(middleware.TelemetryMiddleware())

	var capturedReqID string
	var capturedTraceID string

	router.GET("/test-trace", func(c *gin.Context) {
		capturedReqID = c.GetString("request_id")
		capturedTraceID = c.GetString("trace_id")
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Scenario 1: Upstream provided request ID
	w1 := httptest.NewRecorder()
	req1, _ := http.NewRequest("GET", "/test-trace", nil)
	req1.Header.Set("X-Request-ID", "upstream-trace-id-999")
	router.ServeHTTP(w1, req1)

	if w1.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", w1.Code)
	}
	if capturedReqID != "upstream-trace-id-999" {
		t.Errorf("expected captured req ID upstream-trace-id-999, got %s", capturedReqID)
	}
	if capturedTraceID == "" {
		t.Errorf("expected non-empty trace ID, got empty")
	}
	if w1.Header().Get("X-Request-ID") != "upstream-trace-id-999" {
		t.Errorf("expected response header X-Request-ID upstream-trace-id-999, got %s", w1.Header().Get("X-Request-ID"))
	}

	// Scenario 2: Generated request ID when none provided
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/test-trace", nil)
	router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", w2.Code)
	}
	if capturedReqID == "" {
		t.Error("expected auto-generated request ID, got empty")
	}
	if w2.Header().Get("X-Request-ID") == "" {
		t.Error("expected X-Request-ID response header to be set")
	}
}

func TestTimeoutMiddlewareExecution(t *testing.T) {
	router := gin.New()
	router.Use(middleware.TimeoutMiddleware(100 * time.Millisecond))

	router.GET("/fast-route", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "fast"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/fast-route", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for fast route, got %d", w.Code)
	}
}

func TestRateLimiterMiddleware(t *testing.T) {
	router := gin.New()
	// Rate limit: 2 requests per minute, burst 2
	router.Use(middleware.RateLimiter(2.0/60.0, 2.0))

	router.GET("/rate-limited", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "allowed"})
	})

	// Request 1: Allowed
	w1 := httptest.NewRecorder()
	req1, _ := http.NewRequest("GET", "/rate-limited", nil)
	router.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("request 1 expected 200, got %d", w1.Code)
	}

	// Request 2: Allowed
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/rate-limited", nil)
	router.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("request 2 expected 200, got %d", w2.Code)
	}

	// Request 3: Rate limited
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("GET", "/rate-limited", nil)
	router.ServeHTTP(w3, req3)
	if w3.Code != http.StatusTooManyRequests {
		t.Fatalf("request 3 expected 429 Too Many Requests, got %d", w3.Code)
	}
	if w3.Header().Get("Retry-After") == "" {
		t.Error("expected Retry-After header on 429 response")
	}
}

func TestCanonicalErrorTaxonomy(t *testing.T) {
	router := gin.New()

	router.GET("/error/unauth", func(c *gin.Context) {
		sharedErrors.RespondError(c, sharedErrors.ErrUnauthenticated)
	})
	router.GET("/error/conflict", func(c *gin.Context) {
		sharedErrors.RespondError(c, sharedErrors.ErrConflict)
	})
	router.GET("/error/db", func(c *gin.Context) {
		sharedErrors.RespondError(c, sharedErrors.ErrDatabase)
	})

	// Test 401
	w1 := httptest.NewRecorder()
	req1, _ := http.NewRequest("GET", "/error/unauth", nil)
	router.ServeHTTP(w1, req1)
	if w1.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w1.Code)
	}

	// Test 409
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/error/conflict", nil)
	router.ServeHTTP(w2, req2)
	if w2.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d", w2.Code)
	}

	// Test 503
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("GET", "/error/db", nil)
	router.ServeHTTP(w3, req3)
	if w3.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", w3.Code)
	}
}
