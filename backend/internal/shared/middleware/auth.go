package middleware

import (
	"fmt"
	"net/http"
	"strings"

	configPkg "kirmya/internal/shared/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTClaims struct {
	UserID uuid.UUID `json:"userId"`
	Email  string    `json:"email"`
	Role   string    `json:"role"`
	jwt.RegisteredClaims
}

// AuthRequired verifies a cryptographically signed JWT token.
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		var tokenStr string
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header must be Bearer token"})
				return
			}
			tokenStr = parts[1]
		} else {
			// Fallback to query parameter (needed for browser WebSocket connections)
			tokenStr = c.Query("token")
		}

		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is required"})
			return
		}

		// Cryptographic JWT signature verification against shared JWT_SECRET
		token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return configPkg.GetJWTSecretBytes(), nil
		})

		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(*JWTClaims)
		if !ok || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// GetUserID extracts authenticated user UUID from Gin context.
func GetUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, false
	}
	if uid, ok := val.(uuid.UUID); ok {
		return uid, true
	}
	if uidStr, ok := val.(string); ok {
		parsed, err := uuid.Parse(uidStr)
		if err == nil {
			return parsed, true
		}
	}
	return uuid.Nil, false
}

// MustGetUserID extracts authenticated user UUID or panics if not authenticated.
func MustGetUserID(c *gin.Context) uuid.UUID {
	uid, ok := GetUserID(c)
	if !ok {
		panic("MustGetUserID: user is not authenticated")
	}
	return uid
}

// GetUserRole extracts role from Gin context.
func GetUserRole(c *gin.Context) string {
	if val, exists := c.Get("role"); exists {
		if r, ok := val.(string); ok {
			return r
		}
	}
	return ""
}

// GetUserEmail extracts email from Gin context.
func GetUserEmail(c *gin.Context) string {
	if val, exists := c.Get("email"); exists {
		if e, ok := val.(string); ok {
			return e
		}
	}
	return ""
}

// RequireRole ensures the authenticated user has at least one of the specified roles.
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedRoles))
	for _, r := range allowedRoles {
		allowed[strings.ToLower(strings.TrimSpace(r))] = struct{}{}
	}

	return func(c *gin.Context) {
		role := strings.ToLower(GetUserRole(c))
		if _, ok := allowed[role]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Forbidden: insufficient permissions for this resource",
			})
			return
		}
		c.Next()
	}
}

// RequireAdmin is a shortcut for RequireRole("admin", "super_admin", "platform_admin").
func RequireAdmin() gin.HandlerFunc {
	return RequireRole("admin", "super_admin", "platform_admin")
}
