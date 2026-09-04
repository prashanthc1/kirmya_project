package middleware

import (
	"errors"
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

// verifyRequestToken extracts and cryptographically verifies the access token
// on a request, returning its claims.
//
// Split out of AuthRequired so that the role middleware in rbac.go authenticates
// through exactly the same code path rather than a second copy of it: two
// implementations of token verification are two things that can drift apart,
// and the one that drifts is the one that lets someone in.
//
// The error is safe to return to the caller — it distinguishes a malformed
// header from a missing or invalid token, and never reveals why a signature
// failed.
func verifyRequestToken(c *gin.Context) (*JWTClaims, error) {
	authHeader := c.GetHeader("Authorization")
	var tokenStr string
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return nil, errors.New("Authorization header must be Bearer token")
		}
		tokenStr = parts[1]
	} else {
		// Fallback to query parameter (needed for browser WebSocket connections)
		tokenStr = c.Query("token")
	}

	if tokenStr == "" {
		return nil, errors.New("Authorization token is required")
	}

	// Cryptographic JWT signature verification against shared JWT_SECRET
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return configPkg.GetJWTSecretBytes(), nil
	})

	if err != nil {
		return nil, errors.New("Invalid or expired token")
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("Invalid token claims")
	}

	return claims, nil
}

// setAuthContext publishes the verified identity for downstream handlers.
// "userID" holds a uuid.UUID; read it with GetUserID rather than c.GetString,
// which type-asserts to string and yields "" for every authenticated user.
func setAuthContext(c *gin.Context, claims *JWTClaims) {
	c.Set("userID", claims.UserID)
	c.Set("email", claims.Email)
	c.Set("role", claims.Role)
}

// AuthRequired verifies a cryptographically signed JWT token. It establishes
// identity only; use RequireRole or RequireAdmin from rbac.go where a route also
// needs an authorization decision.
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, err := verifyRequestToken(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		setAuthContext(c, claims)
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
