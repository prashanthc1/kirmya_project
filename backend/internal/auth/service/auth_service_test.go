package service

import (
	"context"
	"kirmya/internal/auth/repository"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAuthRegisterPasswordComplexity(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	// Case 1: Short password
	_, err := svc.Register(context.Background(), "test@kirmya.ae", "Short1!")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be at least 12 characters")

	// Case 2: Missing special character
	_, err = svc.Register(context.Background(), "test@kirmya.ae", "NoSpecialChar123")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must contain uppercase, lowercase, numbers, and special symbols")

	// Case 3: Valid password
	// Note: since r.db is nil, it will return nil error or skip DB insert.
	// In our repository implementation, CreateUserAccount returns nil if db is nil.
	user, err := svc.Register(context.Background(), "test@kirmya.ae", "SecureP@ssw0rd123!")
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, "test@kirmya.ae", user.Email)
}

func TestTokenGenerationAndValidation(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	userID := uuid.New()
	email := "developer@kirmya.ae"

	token, err := svc.GenerateAccessToken(userID, email)
	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := svc.ValidateAccessToken(token)
	assert.NoError(t, err)
	assert.NotNil(t, claims)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, email, claims.Email)
}
