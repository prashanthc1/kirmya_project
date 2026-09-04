package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/messaging/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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
	require.NoError(t, err)

	// 2. Fetch Conversation
	fetched, err := repo.GetConversation(ctx, conv.ID)
	require.NoError(t, err)
	assert.NotNil(t, fetched)
	assert.Equal(t, conv.ID, fetched.ID)

	// 3. List Conversations for u1
	list, err := repo.ListConversations(ctx, u1)
	require.NoError(t, err)
	assert.Len(t, list, 1)

	// 4. Create Message
	msg := &models.Message{
		ID:             uuid.New(),
		ConversationID: conv.ID,
		SenderID:       u1,
		Content:        "Checking in on the project roadmap",
		IsRead:         false,
		CreatedAt:      time.Now(),
	}
	err = repo.CreateMessage(ctx, msg)
	require.NoError(t, err)

	// 5. List Messages
	msgs, err := repo.ListMessages(ctx, conv.ID)
	require.NoError(t, err)
	assert.Len(t, msgs, 1)
	assert.Equal(t, "Checking in on the project roadmap", msgs[0].Content)

	// 6. Search Messages
	searchResults, err := repo.SearchMessages(ctx, u1, "roadmap")
	require.NoError(t, err)
	assert.Len(t, searchResults, 1)

	// 7. Message Request Flow
	reqID := uuid.New()
	msgReq := &models.MessageRequest{
		ID:             reqID,
		SenderID:       u1,
		ReceiverID:     u2,
		InitialMessage: "Let's connect!",
		Status:         "pending",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	err = repo.CreateMessageRequest(ctx, msgReq)
	require.NoError(t, err)

	incoming, err := repo.ListIncomingRequests(ctx, u2)
	require.NoError(t, err)
	assert.Len(t, incoming, 1)

	err = repo.UpdateMessageRequestStatus(ctx, reqID, "accepted")
	require.NoError(t, err)

	updatedReq, err := repo.GetMessageRequest(ctx, reqID)
	require.NoError(t, err)
	assert.Equal(t, "accepted", updatedReq.Status)

	// 8. Presence
	p := &models.UserPresence{
		UserID:   u1,
		Status:   "online",
		LastSeen: time.Now(),
	}
	err = repo.UpsertPresence(ctx, p)
	require.NoError(t, err)

	fetchedP, err := repo.GetPresence(ctx, u1)
	require.NoError(t, err)
	assert.Equal(t, "online", fetchedP.Status)

	// 9. Admin Analytics
	stats, err := repo.GetAdminAnalytics(ctx)
	require.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Equal(t, 1, stats.TotalConversationsCount)
	assert.Equal(t, 1, stats.TotalMessagesSent)
}
