package router

import (
	"crypto/subtle"
	"net"
	"net/http"

	"github.com/gin-gonic/gin"

	telemetryPkg "kirmya/internal/shared/telemetry"
)

// MetricsConfig controls who may scrape the Prometheus exposition endpoint. The
// metrics leak request volumes, error counts and cache behaviour, so the
// endpoint is never open: with credentials set it requires basic auth, and
// without them it only answers callers on the loopback or private networks
// where a sidecar scraper would live.
type MetricsConfig struct {
	Username string
	Password string
}

// metricsGuard rejects unauthorised scrapes. Failures return 404 rather than
// 403 so an unauthenticated prober cannot confirm the endpoint exists.
func metricsGuard(cfg MetricsConfig) gin.HandlerFunc {
	requireBasicAuth := cfg.Username != "" && cfg.Password != ""

	return func(c *gin.Context) {
		if requireBasicAuth {
			user, pass, ok := c.Request.BasicAuth()
			// Constant-time compares keep the credentials from leaking through
			// response timing.
			userMatch := subtle.ConstantTimeCompare([]byte(user), []byte(cfg.Username)) == 1
			passMatch := subtle.ConstantTimeCompare([]byte(pass), []byte(cfg.Password)) == 1
			if !ok || !userMatch || !passMatch {
				c.Header("WWW-Authenticate", `Basic realm="metrics"`)
				c.AbortWithStatus(http.StatusUnauthorized)
				return
			}
			c.Next()
			return
		}

		// RemoteIP, not ClientIP: the latter honours X-Forwarded-For, which a
		// caller can set to 127.0.0.1 to walk straight through this check.
		if !isInternalIP(c.RemoteIP()) {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		c.Next()
	}
}

// isInternalIP reports whether addr belongs to a loopback, link-local or
// private range — the places a scraper legitimately runs when no credentials
// are configured.
func isInternalIP(addr string) bool {
	ip := net.ParseIP(addr)
	if ip == nil {
		return false
	}
	return ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast()
}

func metricsHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		collector := telemetryPkg.GetGlobalCollector()
		c.String(http.StatusOK, collector.GetPrometheusMetrics())
	}
}
