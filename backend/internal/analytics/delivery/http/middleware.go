package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireAnalyticsConsent verifies user privacy choices before tracking optional analytics.
func RequireAnalyticsConsent() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Operational telemetry is always allowed; non-essential tracking checks header
		consentHeader := c.GetHeader("X-Kirmya-Analytics-Consent")
		if consentHeader == "denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Analytics consent opted out by user privacy policy"})
			c.Abort()
			return
		}
		c.Next()
	}
}
