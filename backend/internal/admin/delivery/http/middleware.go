package http

import (
	"kirmya/internal/admin/service"
	"net/http"
	"strings"

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

// CodeAdminPermissionRequired means the caller is an administrator, but not one
// holding the permission this route needs.
const CodeAdminPermissionRequired = "ADMIN_PERMISSION_REQUIRED"

// RequirePermission gates an administrative route on a granular permission.
//
// It runs *inside* RequireAdmin(), never instead of it. The outer gate decides
// who is an administrator, from users.role_id; this decides what a given
// administrator may do, from admin_user_roles. An account with no assignment
// holds every permission and passes, which is why adding this to a route
// changes nothing for anybody until somebody is deliberately narrowed.
//
// Consequently this middleware can only ever refuse. It is incapable of
// admitting a caller the middleware ahead of it turned away, and it must never
// be used as the only guard on a route.
func RequirePermission(adminSvc *service.AdminService, requiredPermission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := getUserID(c)
		if !ok {
			c.Abort()
			return
		}

		hasPerm, err := adminSvc.CheckPermission(c.Request.Context(), userID, requiredPermission)
		if err != nil {
			// A failed lookup is not a denial. Answering 403 here would report
			// an outage as an authorization decision, and would tell an
			// administrator their access had been removed when the database
			// was merely unreachable.
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Administrative permissions could not be determined",
				"code":  "INTERNAL_ERROR",
			})
			return
		}
		if !hasPerm {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "This administrative action requires the " + requiredPermission + " permission.",
				"code":  CodeAdminPermissionRequired,
			})
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
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Administrative permissions could not be determined",
				"code":  "INTERNAL_ERROR",
			})
			return
		}
		if !hasPerm {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "This administrative action requires one of: " + strings.Join(requiredPermissions, ", "),
				"code":  CodeAdminPermissionRequired,
			})
			return
		}
		c.Next()
	}
}
