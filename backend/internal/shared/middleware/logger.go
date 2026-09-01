package middleware

import (
	"log/slog"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

var sensitiveQueryKeys = map[string]bool{
	"token":              true,
	"access_token":       true,
	"refresh_token":      true,
	"password":           true,
	"secret":             true,
	"api_key":            true,
	"code":               true,
	"otp":                true,
	"verification_token": true,
	"reset_token":        true,
}

func sanitizeQuery(rawQuery string) string {
	if rawQuery == "" {
		return ""
	}
	values, err := url.ParseQuery(rawQuery)
	if err != nil {
		return "[INVALID_QUERY]"
	}
	for k := range values {
		lowerK := strings.ToLower(k)
		if sensitiveQueryKeys[lowerK] || strings.Contains(lowerK, "token") || strings.Contains(lowerK, "secret") || strings.Contains(lowerK, "password") {
			values.Set(k, "[REDACTED]")
		}
	}
	return values.Encode()
}

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

		cleanQuery := sanitizeQuery(rawQuery)
		if cleanQuery != "" {
			path = path + "?" + cleanQuery
		}

		reqID, _ := c.Get("request_id")
		if reqID == nil || reqID == "" {
			reqID = c.GetHeader("X-Request-ID")
		}
		traceID, _ := c.Get("trace_id")
		if traceID == nil || traceID == "" {
			traceID = c.GetHeader("X-Trace-ID")
		}

		// Log using structured attributes
		logAttrs := []any{
			slog.Int("status", statusCode),
			slog.String("method", method),
			slog.String("path", path),
			slog.String("ip", clientIP),
			slog.Duration("latency", latency),
			slog.String("user_agent", c.Request.UserAgent()),
		}

		if reqID != nil && reqID != "" {
			logAttrs = append(logAttrs, slog.Any("request_id", reqID))
		}
		if traceID != nil && traceID != "" {
			logAttrs = append(logAttrs, slog.Any("trace_id", traceID))
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
