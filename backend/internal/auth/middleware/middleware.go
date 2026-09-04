package middleware

import (
	"net/http"
	"strings"

	"kirmya/internal/auth/service"
	sharedMiddleware "kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	authService *service.AuthService
}

func NewAuthMiddleware(s *service.AuthService) *AuthMiddleware {
	return &AuthMiddleware{authService: s}
}

// RequireAuth middleware extracts and validates JWT access token from Authorization header.
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		tokenStr := parts[1]
		claims, err := m.authService.ValidateAccessToken(tokenStr)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired access token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// OptionalAuth validates the access token when one is supplied and populates the
// user context, but lets unauthenticated requests through untouched. Flows that
// run before sign-in (onboarding) use it so handlers can decide themselves
// whether an anonymous caller is acceptable.
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		if m == nil || m.authService == nil {
			c.Next()
			return
		}

		parts := strings.SplitN(c.GetHeader("Authorization"), " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
			c.Next()
			return
		}

		claims, err := m.authService.ValidateAccessToken(parts[1])
		if err != nil {
			c.Next()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// RequireRole enforces specific user roles (e.g., 'admin', 'user').
// RequireRole enforces specific user roles.
//
// It delegates to shared/middleware.RequireRole, which is the single
// implementation of role checking in the codebase. This method is kept as a
// thin adapter so the call sites that reach RBAC through the AuthMiddleware
// value keep working, but there is only one place where the decision is
// actually made — two copies of an authorization rule is two places for it to
// drift, and the copy that drifts is the one that lets someone through.
//
// Behaviour is a superset of the previous local implementation: an
// unauthenticated caller now gets 401 rather than a 403 claiming their role was
// missing. Every existing call site pairs this with RequireAuth, which already
// rejects such callers first, so the status they observe is unchanged.
func (m *AuthMiddleware) RequireRole(roles ...string) gin.HandlerFunc {
	return sharedMiddleware.RequireRole(roles...)
}
