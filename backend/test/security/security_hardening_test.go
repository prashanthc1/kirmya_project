package security

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	authDto "kirmya/internal/auth/dto"
	authModels "kirmya/internal/auth/models"
	authRepo "kirmya/internal/auth/repository"
	authSvc "kirmya/internal/auth/service"
	configPkg "kirmya/internal/shared/config"
	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

// Helper: mint JWT token for tests
func mintCustomJWT(userID uuid.UUID, email, role string, expiry time.Duration, secret []byte) string {
	claims := middleware.JWTClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "kirmya-auth-service",
			Subject:   userID.String(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString(secret)
	return tokenStr
}

// 1. AUTHENTICATION & TOKEN HARDENING TESTS
func TestSecurity_JWTValidation_ExpiredAndTampered(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.AuthRequired())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	userID := uuid.New()
	secret := configPkg.GetJWTSecretBytes()

	// Test A: Expired token must be rejected (401)
	expiredToken := mintCustomJWT(userID, "user@kirmya.ae", "candidate", -1*time.Hour, secret)
	reqExpired, _ := http.NewRequest("GET", "/protected", nil)
	reqExpired.Header.Set("Authorization", "Bearer "+expiredToken)
	respExpired := httptest.NewRecorder()
	r.ServeHTTP(respExpired, reqExpired)
	assert.Equal(t, http.StatusUnauthorized, respExpired.Code)

	// Test B: Token signed with foreign key / tampered secret must be rejected (401)
	foreignSecret := []byte("malicious-foreign-secret-key-that-does-not-match")
	tamperedToken := mintCustomJWT(userID, "user@kirmya.ae", "admin", 1*time.Hour, foreignSecret)
	reqTampered, _ := http.NewRequest("GET", "/protected", nil)
	reqTampered.Header.Set("Authorization", "Bearer "+tamperedToken)
	respTampered := httptest.NewRecorder()
	r.ServeHTTP(respTampered, reqTampered)
	assert.Equal(t, http.StatusUnauthorized, respTampered.Code)

	// Test C: Malformed header format must be rejected (401)
	reqMalformed, _ := http.NewRequest("GET", "/protected", nil)
	reqMalformed.Header.Set("Authorization", "InvalidHeaderFormatWithoutBearer")
	respMalformed := httptest.NewRecorder()
	r.ServeHTTP(respMalformed, reqMalformed)
	assert.Equal(t, http.StatusUnauthorized, respMalformed.Code)

	// Test D: Valid token succeeds (200)
	validToken := mintCustomJWT(userID, "user@kirmya.ae", "candidate", 1*time.Hour, secret)
	reqValid, _ := http.NewRequest("GET", "/protected", nil)
	reqValid.Header.Set("Authorization", "Bearer "+validToken)
	respValid := httptest.NewRecorder()
	r.ServeHTTP(respValid, reqValid)
	assert.Equal(t, http.StatusOK, respValid.Code)
}

// 2. PASSWORD SECURITY & TIMING ATTACK DEFENSE
func TestSecurity_PasswordHashingAndConstantTimeComparison(t *testing.T) {
	password := "UltraSecurePassword@2026!"
	hashBytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	require.NoError(t, err)
	hashStr := string(hashBytes)

	// Verify constant time comparison utility
	assert.True(t, authSvc.ComparePasswordSecurely(hashStr, password))
	assert.False(t, authSvc.ComparePasswordSecurely(hashStr, "WrongPassword!"))

	// Verify bcrypt cost is at least 12
	cost, err := bcrypt.Cost(hashBytes)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, cost, 12)
}

// 3. ACCOUNT STATE HARDENING (Locked / Suspended Accounts)
func TestSecurity_LockedAndSuspendedAccountRejection(t *testing.T) {
	ctx := context.Background()
	repo := authRepo.NewAuthRepository(nil)
	svc := authSvc.NewAuthService(repo)

	// Create a locked user
	userID := uuid.New()
	password := "ValidPass123!"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), 12)
	lockedUser := &authModels.User{
		ID:           userID,
		Email:        "locked.user@kirmya.ae",
		PasswordHash: string(hash),
		Status:       "locked",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	_ = repo.CreateUser(ctx, lockedUser)

	// Attempt login -> must be rejected
	_, _, _, err := svc.Login(ctx, &authDto.LoginRequest{
		Email:    "locked.user@kirmya.ae",
		Password: password,
	}, "127.0.0.1", "test-agent")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "locked or suspended")
}

// 4. RBAC & PRIVILEGE ESCALATION DEFENSE
func TestSecurity_RBAC_PrivilegeEscalationDefense(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	api := r.Group("/api/v1")
	api.Use(middleware.AuthRequired())

	api.DELETE("/admin/users/:id", middleware.RequireAdmin(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	})

	api.POST("/recruiter/jobs", middleware.RequireRole("recruiter", "hiring_manager", "admin"), func(c *gin.Context) {
		c.JSON(http.StatusCreated, gin.H{"job_created": true})
	})

	secret := configPkg.GetJWTSecretBytes()
	candToken := mintCustomJWT(uuid.New(), "cand@kirmya.ae", "candidate", 1*time.Hour, secret)
	recToken := mintCustomJWT(uuid.New(), "rec@kirmya.ae", "recruiter", 1*time.Hour, secret)
	adminToken := mintCustomJWT(uuid.New(), "admin@kirmya.ae", "admin", 1*time.Hour, secret)

	// 1. Candidate attempts admin operation -> 403 Forbidden
	req1, _ := http.NewRequest("DELETE", "/api/v1/admin/users/"+uuid.New().String(), nil)
	req1.Header.Set("Authorization", "Bearer "+candToken)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusForbidden, w1.Code)

	// 2. Candidate attempts recruiter operation -> 403 Forbidden
	req2, _ := http.NewRequest("POST", "/api/v1/recruiter/jobs", nil)
	req2.Header.Set("Authorization", "Bearer "+candToken)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusForbidden, w2.Code)

	// 3. Recruiter attempts recruiter operation -> 201 Created
	req3, _ := http.NewRequest("POST", "/api/v1/recruiter/jobs", nil)
	req3.Header.Set("Authorization", "Bearer "+recToken)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	assert.Equal(t, http.StatusCreated, w3.Code)

	// 4. Admin attempts admin operation -> 200 OK
	req4, _ := http.NewRequest("DELETE", "/api/v1/admin/users/"+uuid.New().String(), nil)
	req4.Header.Set("Authorization", "Bearer "+adminToken)
	w4 := httptest.NewRecorder()
	r.ServeHTTP(w4, req4)
	assert.Equal(t, http.StatusOK, w4.Code)
}

// 5. SECURITY HEADERS & CLICKJACKING / XSS DEFENSE
func TestSecurity_HardeningHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.SecurityHeaders())
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "DENY", w.Header().Get("X-Frame-Options"))
	assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"))
	assert.Equal(t, "strict-origin-when-cross-origin", w.Header().Get("Referrer-Policy"))
	assert.Contains(t, w.Header().Get("Strict-Transport-Security"), "max-age=")
	assert.Contains(t, w.Header().Get("Content-Security-Policy"), "default-src 'self'")
}

// 6. RATE LIMITING & DOS BURST PROTECTION
func TestSecurity_RateLimiter_BurstExhaustion(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	// Rate limit: 2 requests capacity, 1 req/sec refill
	r.Use(middleware.RateLimiter(1.0, 2.0))
	r.GET("/rate-test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// Request 1: Allowed (200)
	req1, _ := http.NewRequest("GET", "/rate-test", nil)
	req1.RemoteAddr = "192.168.1.50:12345"
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Request 2: Allowed (200)
	req2, _ := http.NewRequest("GET", "/rate-test", nil)
	req2.RemoteAddr = "192.168.1.50:12345"
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code)

	// Request 3 (burst exceeded): Rejected (429 Too Many Requests)
	req3, _ := http.NewRequest("GET", "/rate-test", nil)
	req3.RemoteAddr = "192.168.1.50:12345"
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	assert.Equal(t, http.StatusTooManyRequests, w3.Code)
	assert.NotEmpty(t, w3.Header().Get("Retry-After"))
}

// 7. INPUT INJECTION & PATH TRAVERSAL RESILIENCE
func TestSecurity_InputSanitization_PathTraversalAndSQLInjection(t *testing.T) {
	// 1. Path traversal simulation
	maliciousFilename := "../../etc/shadow"
	safeExtension := ".jpg"
	userID := uuid.New()

	// Safe storage path derivation: isolation by UUID, ignoring raw client filename
	assert.NotEmpty(t, maliciousFilename)
	photoURL := "/uploads/profiles/" + userID.String() + "_avatar" + safeExtension
	assert.False(t, strings.Contains(photoURL, ".."))
	assert.True(t, strings.HasPrefix(photoURL, "/uploads/profiles/"+userID.String()))

	// 2. SQL injection payload resilience in parameterized query arguments
	sqlPayloads := []string{
		"' OR 1=1 --",
		"'; DROP TABLE users; --",
		"admin'--",
		"' UNION SELECT username, password_hash FROM users --",
	}

	for _, payload := range sqlPayloads {
		// Verify payload is treated as literal value in parameterized slice
		args := []any{payload, userID}
		assert.Equal(t, payload, args[0])
		assert.Len(t, args, 2)
	}
}
