package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/messaging/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestMessagingRepositoryInMemoryLifecycle(t *testing.T) {
	repo := NewMessagingRepository(nil)
	ctx := context.Background()

	u1 := uuid.New()
	u2 := uuid.New()

	// 1. Create Conversation
	conv := &models.Conversation{
		ID:              uuid.New(),
		UserID1:         u1,
		UserID2:         u2,
		LastMessageText: "Hello!",
		LastMessageTime: time.Now(),
		CreatedAt:       time.Now(),
	}
	err := repo.CreateConversation(ctx, conv)
	assert.NoError(t, err)

	// 2. Fetch Conversation
	fetched, err := repo.GetConversation(ctx, conv.ID)
	assert.NoError(t, err)
	assert.NotNil(t, fetched)
	assert.Equal(t, conv.ID, fetched.ID)
}
