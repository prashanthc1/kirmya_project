package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/auth/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAuthRepositoryInMemoryUserAndSessionOperations(t *testing.T) {
	repo := NewAuthRepository(nil)
	ctx := context.Background()

	// User creation
	user := &models.User{
		ID:            uuid.New(),
		UUID:          uuid.New(),
		FirstName:     "Repo",
		LastName:      "Tester",
		Email:         "repo@kirmya.ae",
		PasswordHash:  "$2a$12$hashedpassword",
		EmailVerified: true,
		RoleID:        "candidate",
		Status:        "active",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	err := repo.CreateUser(ctx, user)
	assert.NoError(t, err)

	// Fetch User
	fetched, err := repo.GetUserByEmail(ctx, "repo@kirmya.ae")
	assert.NoError(t, err)
	assert.Equal(t, user.ID, fetched.ID)
	assert.Equal(t, "repo@kirmya.ae", fetched.Email)

	// Session Creation & Retrieval
	session := &models.Session{
		ID:           uuid.New(),
		UserID:       user.ID,
		RefreshToken: "test-refresh-token-uuid-1234",
		IPAddress:    "127.0.0.1",
		UserAgent:    "TestAgent/1.0",
		ExpiresAt:    time.Now().Add(24 * time.Hour),
		CreatedAt:    time.Now(),
	}
	err = repo.CreateSession(ctx, session)
	assert.NoError(t, err)

	fetchedSess, err := repo.GetSessionByRefreshToken(ctx, "test-refresh-token-uuid-1234")
	assert.NoError(t, err)
	assert.Equal(t, session.ID, fetchedSess.ID)
	assert.Nil(t, fetchedSess.RevokedAt)

	// Revoke Session
	err = repo.RevokeSession(ctx, session.ID)
	assert.NoError(t, err)

	revokedSess, err := repo.GetSessionByRefreshToken(ctx, "test-refresh-token-uuid-1234")
	assert.NoError(t, err)
	assert.NotNil(t, revokedSess.RevokedAt)
}
