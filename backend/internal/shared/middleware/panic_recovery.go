package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// PanicRecovery intercepts runtime panics, logs the stack trace to structured slog internally,
// and returns a safe canonical HTTP 500 JSON response without leaking internal paths or stack traces.
func PanicRecovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				reqID, _ := c.Get("request_id")
				traceID, _ := c.Get("trace_id")
				stack := string(debug.Stack())

				slog.Error("CRITICAL: Panic recovered in HTTP request handler",
					slog.Any("panic", r),
					slog.Any("request_id", reqID),
					slog.Any("trace_id", traceID),
					slog.String("method", c.Request.Method),
					slog.String("path", c.Request.URL.Path),
					slog.String("client_ip", c.ClientIP()),
					slog.String("stack_trace", stack),
				)

				// Ensure response is abort JSON
				var reqIDStr string
				if s, ok := reqID.(string); ok {
					reqIDStr = s
				}

				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error":      "An unexpected internal error occurred. Please try again.",
					"code":       "INTERNAL_ERROR",
					"request_id": reqIDStr,
				})
			}
		}()

		c.Next()
	}
}

// CustomRecoveryWithWriter returns a Gin recovery handler compatible with Gin engine setup.
func CustomRecoveryWithWriter() gin.HandlerFunc {
	return PanicRecovery()
}

func PanicMessage(r interface{}) string {
	if err, ok := r.(error); ok {
		return err.Error()
	}
	return fmt.Sprintf("%v", r)
}
