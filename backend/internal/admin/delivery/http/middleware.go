package http

import (
	"kirmya/internal/admin/authz"
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
//
// It is authz's constant rather than a second copy of the string: the admin
// module and every other module now answer a permission denial identically,
// and a client that recognises the code on /api/v1/admin/users recognises it on
// /api/v1/admin/backups too.
const CodeAdminPermissionRequired = authz.CodePermissionRequired

// RequirePermission gates an administrative route on a granular permission.
//
// It runs *inside* RequireAdmin(), never instead of it - see package authz,
// which holds the implementation this and every other module's administrative
// routes share.
//
// A nil service is passed as a nil checker rather than as an interface holding
// a typed nil, so the guard's fail-closed path sees it and answers 500 instead
// of dereferencing it into a panic.
func RequirePermission(adminSvc *service.AdminService, requiredPermission string) gin.HandlerFunc {
	return guardFor(adminSvc).Require(requiredPermission)
}

func guardFor(adminSvc *service.AdminService) *authz.Guard {
	if adminSvc == nil {
		return authz.NewGuard(nil)
	}
	return authz.NewGuard(adminSvc)
}

// RequireAnyPermission Gin middleware requiring at least one of the specified permissions.
//
// It stays here rather than moving to authz because it reads the effective set
// once through CheckAnyPermission; a generic version over the narrow checker
// interface would have to ask once per permission.
func RequireAnyPermission(adminSvc *service.AdminService, requiredPermissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := getUserID(c)
		if !ok {
			c.Abort()
			return
		}
		if adminSvc == nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Administrative permissions could not be determined",
				"code":  authz.CodeInternalError,
			})
			return
		}

		hasPerm, err := adminSvc.CheckAnyPermission(c.Request.Context(), userID, requiredPermissions...)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Administrative permissions could not be determined",
				"code":  authz.CodeInternalError,
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
