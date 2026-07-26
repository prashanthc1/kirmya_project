package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// StructuredLogger intercepts requests and outputs structured JSON logs.
func StructuredLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		rawQuery := c.Request.URL.RawQuery

		// Process request
		c.Next()

		latency := time.Since(start)
		statusCode := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method
		errorMessage := c.Errors.ByType(gin.ErrorTypePrivate).String()

		if rawQuery != "" {
			path = path + "?" + rawQuery
		}

		// Log using structured attributes
		logAttrs := []interface{}{
			slog.Int("status", statusCode),
			slog.String("method", method),
			slog.String("path", path),
			slog.String("ip", clientIP),
			slog.Duration("latency", latency),
			slog.String("user_agent", c.Request.UserAgent()),
		}

		if errorMessage != "" {
			logAttrs = append(logAttrs, slog.String("error", errorMessage))
		}

		if statusCode >= 500 {
			slog.Error("Server error processed", logAttrs...)
		} else if statusCode >= 400 {
			slog.Warn("Client error processed", logAttrs...)
		} else {
			slog.Info("Request handled successfully", logAttrs...)
		}
	}
}
