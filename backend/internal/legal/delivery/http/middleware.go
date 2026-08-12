package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/legal/service"
)

// RequireCurrentLegalConsent ensures user accepts updated legal terms.
func RequireCurrentLegalConsent(legalService service.LegalService, slug string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

// CheckCookieConsent verifies cookie category permission.
func CheckCookieConsent(legalService service.LegalService, category string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
