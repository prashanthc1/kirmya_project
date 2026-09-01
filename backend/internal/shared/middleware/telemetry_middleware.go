package middleware

import (
	"context"
	"fmt"
	"time"

	"kirmya/internal/shared/telemetry"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type contextKey string

const (
	RequestIDContextKey contextKey = "request_id"
	TraceIDContextKey   contextKey = "trace_id"
)

func TelemetryMiddleware() gin.HandlerFunc {
	collector := telemetry.GetGlobalCollector()

	return func(c *gin.Context) {
		start := time.Now()

		// Request ID
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = c.GetHeader("X-Correlation-ID")
		}
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Trace ID
		traceID := c.GetHeader("X-Trace-ID")
		if traceID == "" {
			traceID = requestID
		}

		// Set Gin Context values
		c.Set("request_id", requestID)
		c.Set("trace_id", traceID)

		// Set Response Headers
		c.Header("X-Request-ID", requestID)
		c.Header("X-Trace-ID", traceID)

		// Create OpenTelemetry-compatible span and enrich Go context
		ctx := c.Request.Context()
		ctx = context.WithValue(ctx, RequestIDContextKey, requestID)
		ctx = context.WithValue(ctx, TraceIDContextKey, traceID)
		ctx, _ = telemetry.StartSpan(ctx, c.Request.Method+" "+c.Request.URL.Path)
		c.Request = c.Request.WithContext(ctx)

		c.Next()

		duration := time.Since(start)
		status := c.Writer.Status()

		c.Header("X-Response-Time-Ms", fmt.Sprintf("%d", duration.Milliseconds()))

		// Record HTTP metrics
		collector.RecordHTTPRequest(c.Request.Method, c.FullPath(), status, duration)

		if duration.Milliseconds() > 500 {
			telemetry.LogWarn(traceID, "Slow HTTP Request Detected", map[string]interface{}{
				"method":     c.Request.Method,
				"path":       c.Request.URL.Path,
				"status":     status,
				"latency_ms": duration.Milliseconds(),
				"client_ip":  c.ClientIP(),
				"request_id": requestID,
			})
		}
	}
}
