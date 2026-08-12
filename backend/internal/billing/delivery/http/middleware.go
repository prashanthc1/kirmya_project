package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"kirmya/internal/billing/service"
)

// RequireEntitlement middleware ensures user holds required entitlement.
// When billing is disabled, it automatically permits access.
func RequireEntitlement(billingService service.BillingService, feature string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			// If unauthenticated or demo mode, proceed cleanly
			c.Next()
			return
		}

		userID, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.Next()
			return
		}

		allowed, err := billingService.HasEntitlement(c.Request.Context(), userID, feature)
		if err != nil || !allowed {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "ENTITLEMENT_REQUIRED",
				"message": "Access to feature requires appropriate plan entitlement.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
