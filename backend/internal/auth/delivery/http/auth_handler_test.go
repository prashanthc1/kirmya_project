package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"kirmya/internal/auth/dto"
	"kirmya/internal/auth/repository"
	"kirmya/internal/auth/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestAuthHandlerLoginFlow(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := repository.NewAuthRepository(nil)
	svc := service.NewAuthService(repo)
	handler := NewAuthHandler(svc)

	// Pre-register user
	regReq := &dto.RegisterRequest{
		FirstName:       "Handler",
		LastName:        "Test",
		Email:           "handler@kirmya.ae",
		Password:        "SecureP@ssw0rd123!",
		ConfirmPassword: "SecureP@ssw0rd123!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	_, _, err := svc.Register(t.Context(), regReq, "127.0.0.1")
	assert.NoError(t, err)

	router := gin.New()
	router.POST("/api/v1/auth/login", handler.Login)

	// Test case: Invalid password
	bodyInvalid, _ := json.Marshal(dto.LoginRequest{
		Email:    "handler@kirmya.ae",
		Password: "WrongPassword123!",
	})
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(bodyInvalid))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	assert.Equal(t, http.StatusUnauthorized, w1.Code)

	// Test case: Valid login
	bodyValid, _ := json.Marshal(dto.LoginRequest{
		Email:      "handler@kirmya.ae",
		Password:   "SecureP@ssw0rd123!",
		RememberMe: true,
	})
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(bodyValid))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusOK, w2.Code)
	assert.Contains(t, w2.Body.String(), "access_token")
	assert.Contains(t, w2.Header().Get("Set-Cookie"), "refresh_token=")
}
