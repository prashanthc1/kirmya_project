// Package authz issues the per-route permission middleware for administrative
// routes, wherever in the codebase those routes are mounted.
//
// It exists because the administrative surface is not one module. Twenty of
// them mount an /admin group of their own, and before this package the granular
// permission check reached only the routes under internal/admin. Every other
// administrative route was gated by RequireAdmin() alone, so a "read only"
// administrator narrowed on /api/v1/admin/users could still release a legal
// hold, rewrite the retention policy, or confirm a production restore.
//
// This is deliberately not a second permission system. The vocabulary is
// admin/domain's, the effective-permission rule is admin/domain's, and the
// lookup is the same AdminService call the admin module already made. What is
// new is only that modules outside internal/admin can now perform it, which
// they could not do before without importing the admin module's HTTP package.
//
// # Ordering
//
// A Guard's middleware is the INNER gate and runs after the outer one:
//
//	AuthRequired -> RequireAdmin -> Guard.Require(perm) -> handler
//
// RequireAdmin() decides who is an administrator, from the token's role, with
// no I/O. This decides what a given administrator may do, from admin_user_roles.
// An account with no assignment holds every permission, so this middleware can
// only ever refuse - it is structurally incapable of admitting a caller the
// outer gate turned away, and must never be the only guard on a route.
package authz

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PermissionChecker is the narrow slice of the admin service this needs.
//
// A narrow interface rather than the concrete service so that twenty modules
// can depend on the permission check without depending on the admin module's
// repository, models and handlers - and so that a test can supply a checker
// with a known answer instead of a database.
type PermissionChecker interface {
	CheckPermission(ctx context.Context, adminID uuid.UUID, permission string) (bool, error)
}

// CodePermissionRequired means the caller is an administrator, but not one
// holding the permission this route needs.
const CodePermissionRequired = "ADMIN_PERMISSION_REQUIRED"

// CodeInternalError means the permission could not be determined at all.
const CodeInternalError = "INTERNAL_ERROR"

// Guard issues permission middleware backed by one checker.
type Guard struct {
	checker PermissionChecker
}

// NewGuard returns a Guard over the given checker.
//
// A nil checker is allowed and produces a guard that refuses everything with
// 500. That is the deliberate choice: a router assembled without a permission
// checker cannot answer "may this administrator do this", and a surface that
// answers "yes" to a question it cannot evaluate is the failure this whole
// slice exists to remove.
func NewGuard(checker PermissionChecker) *Guard {
	return &Guard{checker: checker}
}

// Require returns middleware demanding one permission.
func (g *Guard) Require(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		checker := g.resolve(c)
		if checker == nil {
			return
		}
		adminID, ok := callerID(c)
		if !ok {
			return
		}

		allowed, err := checker.CheckPermission(c.Request.Context(), adminID, permission)
		if err != nil {
			// A failed lookup is not a denial. Answering 403 here would report
			// an outage as an authorization decision, and would tell an
			// administrator their access had been removed when the database
			// was merely unreachable.
			abortInternal(c)
			return
		}
		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "This administrative action requires the " + permission + " permission.",
				"code":  CodePermissionRequired,
			})
			return
		}
		c.Next()
	}
}

// resolve returns the checker, or aborts the request and returns nil.
//
// The receiver is checked for nil as well as the field: a module handed no
// guard at all holds a nil *Guard, and that must fail the same closed way as a
// guard holding no checker rather than panicking into a 500 by accident.
func (g *Guard) resolve(c *gin.Context) PermissionChecker {
	if g == nil || g.checker == nil {
		abortInternal(c)
		return nil
	}
	return g.checker
}

func abortInternal(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
		"error": "Administrative permissions could not be determined",
		"code":  CodeInternalError,
	})
}

// callerID reads the authenticated caller set by AuthRequired.
//
// Its absence is 401 rather than 403: nothing established who is asking, so
// there is no administrator to have permissions evaluated. In the assembled
// router this cannot happen - RequireAdmin has already read the same context -
// but a guard that assumed it would be a guard that trusted its callers.
func callerID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized context",
			"code":  "UNAUTHORIZED",
		})
		return uuid.Nil, false
	}
	adminID, ok := val.(uuid.UUID)
	if !ok {
		abortInternal(c)
		return uuid.Nil, false
	}
	return adminID, true
}
