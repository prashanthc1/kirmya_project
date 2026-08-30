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

func mintTestJWTRole(userID uuid.UUID, email, role string, expiry time.Duration) string {
	claims := JWTClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString(configPkg.GetJWTSecretBytes())
	return tokenStr
}

func setupRBACEngine() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	api := r.Group("/api/v1")
	api.Use(AuthRequired())

	api.GET("/admin-only", RequireAdmin(), func(c *gin.Context) {
		uid, _ := GetUserID(c)
		c.JSON(http.StatusOK, gin.H{"adminID": uid.String()})
	})

	api.GET("/recruiter-only", RequireRole("recruiter", "hiring_manager", "admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "authorized"})
	})

	return r
}

func TestAuthRequired_ExpiredToken(t *testing.T) {
	router := setupTestEngine()
	userID := uuid.New()
	expiredToken := mintTestJWTRole(userID, "expired@kirmya.ae", "candidate", -1*time.Hour)

	req, _ := http.NewRequest("GET", "/test-protected", nil)
	req.Header.Set("Authorization", "Bearer "+expiredToken)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

func TestRequireAdmin_AccessControl(t *testing.T) {
	router := setupRBACEngine()

	// 1. Candidate tries to access admin route -> 403 Forbidden
	candidateID := uuid.New()
	candidateToken := mintTestJWTRole(candidateID, "candidate@kirmya.ae", "candidate", 1*time.Hour)

	req, _ := http.NewRequest("GET", "/api/v1/admin-only", nil)
	req.Header.Set("Authorization", "Bearer "+candidateToken)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusForbidden, resp.Code)

	// 2. Admin tries to access admin route -> 200 OK
	adminID := uuid.New()
	adminToken := mintTestJWTRole(adminID, "admin@kirmya.ae", "admin", 1*time.Hour)

	reqAdmin, _ := http.NewRequest("GET", "/api/v1/admin-only", nil)
	reqAdmin.Header.Set("Authorization", "Bearer "+adminToken)
	respAdmin := httptest.NewRecorder()
	router.ServeHTTP(respAdmin, reqAdmin)
	assert.Equal(t, http.StatusOK, respAdmin.Code)
}

func TestRequireRole_RecruiterAccess(t *testing.T) {
	router := setupRBACEngine()

	// 1. Recruiter user -> 200 OK
	recruiterID := uuid.New()
	recruiterToken := mintTestJWTRole(recruiterID, "recruiter@kirmya.ae", "recruiter", 1*time.Hour)

	req, _ := http.NewRequest("GET", "/api/v1/recruiter-only", nil)
	req.Header.Set("Authorization", "Bearer "+recruiterToken)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusOK, resp.Code)

	// 2. Candidate user -> 403 Forbidden
	candidateID := uuid.New()
	candidateToken := mintTestJWTRole(candidateID, "candidate@kirmya.ae", "user", 1*time.Hour)

	reqCand, _ := http.NewRequest("GET", "/api/v1/recruiter-only", nil)
	reqCand.Header.Set("Authorization", "Bearer "+candidateToken)
	respCand := httptest.NewRecorder()
	router.ServeHTTP(respCand, reqCand)
	assert.Equal(t, http.StatusForbidden, respCand.Code)
}
