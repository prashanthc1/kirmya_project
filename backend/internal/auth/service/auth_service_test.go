package service

import (
	"context"
	"testing"

	"kirmya/internal/auth/dto"
	"kirmya/internal/auth/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAuthRegisterPasswordComplexity(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	// Case 1: Short password
	req1 := &dto.RegisterRequest{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "test1@kirmya.ae",
		Password:        "Short1!",
		ConfirmPassword: "Short1!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	_, _, err := svc.Register(context.Background(), req1, "127.0.0.1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be at least 12 characters")

	// Case 2: Missing special character
	req2 := &dto.RegisterRequest{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "test2@kirmya.ae",
		Password:        "NoSpecialChar123",
		ConfirmPassword: "NoSpecialChar123",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	_, _, err = svc.Register(context.Background(), req2, "127.0.0.1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must contain at least one special character")

	// Case 3: Valid registration
	reqValid := &dto.RegisterRequest{
		FirstName:       "Jane",
		LastName:        "Doe",
		Email:           "jane@kirmya.ae",
		Password:        "SecureP@ssw0rd123!",
		ConfirmPassword: "SecureP@ssw0rd123!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	user, verifyToken, err := svc.Register(context.Background(), reqValid, "127.0.0.1")
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.NotEmpty(t, verifyToken)
	assert.Equal(t, "jane@kirmya.ae", user.Email)
}

func TestLoginAndRefreshFlow(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	reqValid := &dto.RegisterRequest{
		FirstName:       "Alex",
		LastName:        "Smith",
		Email:           "alex@kirmya.ae",
		Password:        "SecureP@ssw0rd123!",
		ConfirmPassword: "SecureP@ssw0rd123!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	_, verifyToken, err := svc.Register(context.Background(), reqValid, "127.0.0.1")
	assert.NoError(t, err)

	// Verify Email
	err = svc.VerifyEmail(context.Background(), verifyToken, "127.0.0.1")
	assert.NoError(t, err)

	// Login
	loginReq := &dto.LoginRequest{
		Email:      "alex@kirmya.ae",
		Password:   "SecureP@ssw0rd123!",
		RememberMe: true,
	}
	accToken, refToken, user, err := svc.Login(context.Background(), loginReq, "127.0.0.1", "UnitTestAgent/1.0")
	assert.NoError(t, err)
	assert.NotEmpty(t, accToken)
	assert.NotEmpty(t, refToken)
	assert.Equal(t, "alex@kirmya.ae", user.Email)

	// Token validation
	claims, err := svc.ValidateAccessToken(accToken)
	assert.NoError(t, err)
	assert.Equal(t, user.ID, claims.UserID)

	// Token refresh
	newAccToken, newRefToken, err := svc.Refresh(context.Background(), refToken, "127.0.0.1", "UnitTestAgent/1.0")
	assert.NoError(t, err)
	assert.NotEmpty(t, newAccToken)
	assert.NotEmpty(t, newRefToken)
}

func TestTokenGenerationAndValidation(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	userID := uuid.New()
	email := "developer@kirmya.ae"

	token, err := svc.GenerateAccessToken(userID, email, "user")
	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := svc.ValidateAccessToken(token)
	assert.NoError(t, err)
	assert.NotNil(t, claims)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, email, claims.Email)
}
