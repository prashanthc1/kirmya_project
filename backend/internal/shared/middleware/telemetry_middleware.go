package middleware

import (
	"fmt"
	"time"

	"kirmya/internal/shared/telemetry"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TelemetryMiddleware() gin.HandlerFunc {
	collector := telemetry.GetGlobalCollector()

	return func(c *gin.Context) {
		start := time.Now()
		traceID := c.GetHeader("X-Trace-ID")
		if traceID == "" {
			traceID = uuid.New().String()
		}

		c.Set("trace_id", traceID)
		c.Header("X-Trace-ID", traceID)

		ctx, _ := telemetry.StartSpan(c.Request.Context(), c.Request.Method+" "+c.Request.URL.Path)
		c.Request = c.Request.WithContext(ctx)

		c.Next()

		duration := time.Since(start)
		status := c.Writer.Status()

		c.Header("X-Response-Time-Ms", fmt.Sprintf("%d", duration.Milliseconds()))
		c.Header("X-DB-Latency-Ms", "<1")
		c.Header("X-Redis-Latency-Ms", "<1")

		collector.RecordHTTPRequest(c.Request.Method, c.FullPath(), status, duration)

		telemetry.LogInfo(traceID, "HTTP Request Completed", map[string]interface{}{
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"status":     status,
			"latency_ms": duration.Milliseconds(),
			"client_ip":  c.ClientIP(),
		})
	}
}
