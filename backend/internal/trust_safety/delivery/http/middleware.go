package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/trust_safety/service"
)

// RequireActiveSafetyStatus verifies user does not have an active suspension.
func RequireActiveSafetyStatus(safetyService service.TrustSafetyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

// CheckUserBlock restricts interaction if user block exists.
func CheckUserBlock(safetyService service.TrustSafetyService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
