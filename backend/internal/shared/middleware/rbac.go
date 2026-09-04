package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Role-based access control for the platform.
//
// # Claim structure
//
// Authorization decisions are made from the claims in the signed access token,
// which AuthRequired verifies and places in the Gin context:
//
//	{
//	  "userId": "3f1c…-uuid",   // context key "userID", type uuid.UUID
//	  "email":  "a@b.com",      // context key "email",  type string
//	  "role":   "admin",        // context key "role",   type string
//	  "iss": "kirmya-auth-service", "sub": "<userId>",
//	  "exp": <issued + 15m>, "iat": …, "nbf": …
//	}
//
// The token carries exactly one role, sourced from users.role_id at sign-in and
// at refresh. There is no permissions array in the token: anything finer than a
// role is a database lookup, not a claim — see "Layering" below.
//
// # Role vocabulary
//
// The values below are the roles the platform issues. Compare against the
// constants rather than string literals so a typo is a compile error instead of
// a silently failing authorization check.
//
// # Layering
//
// Three tiers, cheapest first, each meaningful on its own:
//
//	AuthRequired()                     is there a valid token at all?
//	RequireRole(...) / RequireAdmin()  does the token's role permit this? (no I/O)
//	admin.RequirePermission(svc, "…")  granular, database-backed, admin module only
//
// RequireRole is the single supported way to gate a route group on role. It
// authenticates as well as authorizes, so a group protected with it is safe
// whether or not AuthRequired ran first.
//
// # Freshness
//
// A role lives in the token for its 15-minute lifetime. Demoting a user in the
// database does not retroactively shrink an access token already issued to
// them; it takes effect on their next refresh. Where an authorization decision
// must reflect the database immediately, use the permission tier, which reads
// through on every request.
const (
	RoleUser          = "user"
	RoleRecruiter     = "recruiter"
	RoleHiringManager = "hiring_manager"
	RoleModerator     = "moderator"
	RoleAdmin         = "admin"
	RoleSuperAdmin    = "super_admin"
	RolePlatformAdmin = "platform_admin"
)

// AdminRoles is the canonical set of roles that may reach administrative
// routes. It exists so the set is defined once: the codebase previously spelled
// it out per call site and drifted, with most groups accepting
// admin/super_admin and a couple also accepting platform_admin, which meant a
// platform_admin's access depended on which module they happened to hit.
func AdminRoles() []string {
	return []string{RoleAdmin, RoleSuperAdmin, RolePlatformAdmin}
}

// RequireRole gates a route or group on the caller's role.
//
// It performs both halves of the check, in the order that produces correct
// status codes:
//
//	no valid token            → 401 Unauthorized
//	valid token, wrong role   → 403 Forbidden
//
// Authentication is idempotent. If AuthRequired (or any middleware that
// populates the context) already ran, the existing identity is reused; if
// nothing has, the token is verified here. That means a group can be protected
// with a single Use call and cannot be left unauthenticated by forgetting to
// pair it with AuthRequired:
//
//	admin := api.Group("/admin")
//	admin.Use(middleware.RequireAdmin())
//
// Calling it with no roles is a programming error and denies everything, rather
// than admitting everyone, so a mistake fails closed.
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedRoles))
	for _, r := range allowedRoles {
		if r = strings.ToLower(strings.TrimSpace(r)); r != "" {
			allowed[r] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		// Authenticate only if an earlier middleware has not already done so,
		// so this is safe both standalone and stacked after AuthRequired.
		if _, ok := GetUserID(c); !ok {
			claims, err := verifyRequestToken(c)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}
			setAuthContext(c, claims)
		}

		role := strings.ToLower(strings.TrimSpace(GetUserRole(c)))
		if _, ok := allowed[role]; !ok {
			// The caller is authenticated but not permitted. Deliberately does
			// not echo the required roles back: that tells an attacker which
			// role to target.
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Forbidden: insufficient permissions for this resource",
			})
			return
		}

		c.Next()
	}
}

// RequireAdmin gates a route group on the canonical admin role set. This is the
// one way to protect an administrative route.
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(AdminRoles()...)
}
