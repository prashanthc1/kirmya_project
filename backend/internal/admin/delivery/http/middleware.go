package http

import (
	"net/http"
	"kirmya/internal/admin/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func getUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized context"})
		return uuid.Nil, false
	}
	userID, ok := val.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID context type"})
		return uuid.Nil, false
	}
	return userID, true
}

// RequirePermission Gin middleware that enforces a granular admin permission.
func RequirePermission(adminSvc *service.AdminService, requiredPermission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := getUserID(c)
		if !ok {
			c.Abort()
			return
		}

		hasPerm, err := adminSvc.CheckPermission(c.Request.Context(), userID, requiredPermission)
		if err != nil || !hasPerm {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Insufficient administrative privileges for permission: " + requiredPermission})
			c.Abort()
			return
		}
		c.Next()
	}
}

// RequireAnyPermission Gin middleware requiring at least one of the specified permissions.
func RequireAnyPermission(adminSvc *service.AdminService, requiredPermissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := getUserID(c)
		if !ok {
			c.Abort()
			return
		}

		hasPerm, err := adminSvc.CheckAnyPermission(c.Request.Context(), userID, requiredPermissions...)
		if err != nil || !hasPerm {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Insufficient administrative privileges"})
			c.Abort()
			return
		}
		c.Next()
	}
}
