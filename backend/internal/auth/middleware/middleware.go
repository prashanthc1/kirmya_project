package middleware

import (
	"net/http"
	"strings"

	"kirmya/internal/auth/service"

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
func (m *AuthMiddleware) RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRoleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Role missing from token context"})
			c.Abort()
			return
		}

		userRole, ok := userRoleVal.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Invalid role specification"})
			c.Abort()
			return
		}

		allowed := false
		for _, r := range roles {
			if strings.EqualFold(r, userRole) {
				allowed = true
				break
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Insufficient role privileges"})
			c.Abort()
			return
		}

		c.Next()
	}
}
