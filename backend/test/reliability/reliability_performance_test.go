package reliability

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"kirmya/internal/router"
	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// 1. HEALTH CHECK & READINESS / LIVENESS TESTS
func TestReliability_HealthChecks_LiveAndReady(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := router.New(router.RouterDependencies{}, router.SwaggerConfig{Enabled: false})

	// 1. Test GET /health
	req1, _ := http.NewRequest("GET", "/health", nil)
	w1 := httptest.NewRecorder()
	engine.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)
	assert.Contains(t, w1.Body.String(), `"status":"ok"`)

	// 2. Test GET /health/live
	req2, _ := http.NewRequest("GET", "/health/live", nil)
	w2 := httptest.NewRecorder()
	engine.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code)
	assert.Contains(t, w2.Body.String(), `"status":"alive"`)

	// 3. Test GET /health/ready
	req3, _ := http.NewRequest("GET", "/health/ready", nil)
	w3 := httptest.NewRecorder()
	engine.ServeHTTP(w3, req3)
	assert.Equal(t, http.StatusOK, w3.Code)
	assert.Contains(t, w3.Body.String(), `"status":"ready"`)

	// 4. Test GET /health/dependencies
	req4, _ := http.NewRequest("GET", "/health/dependencies", nil)
	w4 := httptest.NewRecorder()
	engine.ServeHTTP(w4, req4)
	assert.Equal(t, http.StatusOK, w4.Code)
	assert.Contains(t, w4.Body.String(), `"postgresql":"healthy"`)
}

// 2. PANIC RECOVERY AT HTTP BOUNDARY
func TestReliability_PanicRecoveryMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(gin.Recovery())

	r.GET("/panic-trigger", func(c *gin.Context) {
		panic("simulated unexpected nil pointer dereference or invariant failure")
	})

	req, _ := http.NewRequest("GET", "/panic-trigger", nil)
	w := httptest.NewRecorder()

	// Must not crash the process; must return 500 Internal Server Error
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// 3. CONTEXT PROPAGATION & CANCELLATION
func TestReliability_ContextCancellationPropagation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	// Cancel context immediately
	cancel()

	select {
	case <-ctx.Done():
		assert.Equal(t, context.Canceled, ctx.Err())
	default:
		t.Fatal("expected context to be canceled")
	}
}

// 4. TELEMETRY & TRACE ID PROPAGATION
func TestReliability_TelemetryAndTraceIDHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.TelemetryMiddleware())

	r.GET("/telemetry-test", func(c *gin.Context) {
		traceID, exists := c.Get("trace_id")
		assert.True(t, exists)
		assert.NotEmpty(t, traceID)
		c.JSON(http.StatusOK, gin.H{"trace_id": traceID})
	})

	// 1. Client without trace ID header gets a newly minted trace ID
	req1, _ := http.NewRequest("GET", "/telemetry-test", nil)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)
	assert.NotEmpty(t, w1.Header().Get("X-Trace-ID"))
	assert.NotEmpty(t, w1.Header().Get("X-Response-Time-Ms"))

	// 2. Client with custom trace ID preserves it
	customTrace := "custom-trace-uuid-12345"
	req2, _ := http.NewRequest("GET", "/telemetry-test", nil)
	req2.Header.Set("X-Trace-ID", customTrace)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code)
	assert.Equal(t, customTrace, w2.Header().Get("X-Trace-ID"))
}

// 5. SERVER GRACEFUL SHUTDOWN BOUNDED TIMEOUT
func TestReliability_GracefulShutdownLifecycle(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	srv := &http.Server{
		Addr:    "127.0.0.1:0",
		Handler: r,
	}

	// Start server in background goroutine
	go func() {
		_ = srv.ListenAndServe()
	}()

	// Give server 50ms to bind
	time.Sleep(50 * time.Millisecond)

	// Trigger bounded graceful shutdown
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err := srv.Shutdown(shutdownCtx)
	require.NoError(t, err)
}
