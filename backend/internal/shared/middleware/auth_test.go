package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	configPkg "kirmya/internal/shared/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func mintTestJWT(userID uuid.UUID, email string) string {
	claims := JWTClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString(configPkg.GetJWTSecretBytes())
	return tokenStr
}

func setupTestEngine() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(AuthRequired())
	r.GET("/test-protected", func(c *gin.Context) {
		val, _ := c.Get("userID")
		c.JSON(http.StatusOK, gin.H{"userID": val})
	})
	return r
}

func TestAuthRequired_RawUUIDBypassBlocked(t *testing.T) {
	router := setupTestEngine()

	// A raw UUID string must be REJECTED (401 Unauthorized) now that bypass is removed
	rawUUID := uuid.New().String()
	req, _ := http.NewRequest("GET", "/test-protected", nil)
	req.Header.Set("Authorization", "Bearer "+rawUUID)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

func TestAuthRequired_ValidJWT(t *testing.T) {
	router := setupTestEngine()

	userID := uuid.New()
	validToken := mintTestJWT(userID, "user@kirmya.ae")

	req, _ := http.NewRequest("GET", "/test-protected", nil)
	req.Header.Set("Authorization", "Bearer "+validToken)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusOK, resp.Code)
	assert.Contains(t, resp.Body.String(), userID.String())
}

func TestAuthRequired_MissingToken(t *testing.T) {
	router := setupTestEngine()

	req, _ := http.NewRequest("GET", "/test-protected", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}
