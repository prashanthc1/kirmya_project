package service

import (
	"context"
	"strings"
	"testing"
	"time"

	"kirmya/internal/messaging/models"
	"kirmya/internal/messaging/pubsub"
	"kirmya/internal/messaging/repository"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestWSHubConnectionRegistration verifies that client mapping, lock protection,
// and unregistration handles connection maps successfully.
func TestWSHubConnectionRegistration(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewMessagingRepository(nil)
	svc := NewMessagingService(repo, ps)

	userID := uuid.New()
	dummyConn := &websocket.Conn{}

	// Lock mutex and register
	svc.RegisterClient(userID, dummyConn)

	svc.clientsMu.RLock()
	c, exists := svc.clients[userID]
	svc.clientsMu.RUnlock()

	assert.True(t, exists)
	assert.Equal(t, dummyConn, c.Conn)

	// Clean connection
	svc.UnregisterClient(userID)

	svc.clientsMu.RLock()
	_, exists = svc.clients[userID]
	svc.clientsMu.RUnlock()

	assert.False(t, exists)
}

// TestSendEventToDisconnectedUser ensures no panic or blocks when sending message
// to offline users.
func TestSendEventToDisconnectedUser(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewMessagingRepository(nil)
	svc := NewMessagingService(repo, ps)
	userID := uuid.New()

	evt := models.WSEvent{
		Type:      "chat",
		Content:   "Hello World",
		Timestamp: time.Now(),
	}

	// Should execute cleanly without panics
	assert.NotPanics(t, func() {
		svc.SendEventToUser(userID, evt)
	})
}

// TestSelfMessagingValidation ensures self-messaging is rejected
func TestSelfMessagingValidation(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewMessagingRepository(nil)
	svc := NewMessagingService(repo, ps)

	u1 := uuid.New()
	_, err := svc.GetOrCreateConversation(context.Background(), u1, u1)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot initiate a conversation with yourself")
}

// TestFullMessagingLifecycle verifies conversation creation, message send, validation,
// read receipts, and search.
func TestFullMessagingLifecycle(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewMessagingRepository(nil)
	svc := NewMessagingService(repo, ps)
	ctx := context.Background()

	u1 := uuid.New()
	u2 := uuid.New()

	// 1. Create conversation
	conv, err := svc.GetOrCreateConversation(ctx, u1, u2)
	require.NoError(t, err)
	require.NotNil(t, conv)

	// Idempotency: re-request returns same conversation
	conv2, err := svc.GetOrCreateConversation(ctx, u2, u1)
	require.NoError(t, err)
	assert.Equal(t, conv.ID, conv2.ID)

	// 2. Empty message validation
	_, err = svc.SendMessage(ctx, u1, conv.ID, "   ", nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot be empty")

	// 3. Oversized message validation
	longMsg := strings.Repeat("A", 5001)
	_, err = svc.SendMessage(ctx, u1, conv.ID, longMsg, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "exceeds maximum limit")

	// 4. Unauthorized participant send
	unauthID := uuid.New()
	_, err = svc.SendMessage(ctx, unauthID, conv.ID, "Hello", nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unauthorized")

	// 5. Valid message send
	msg, err := svc.SendMessage(ctx, u1, conv.ID, "Hi Salim, let's review the API design.", nil)
	require.NoError(t, err)
	assert.Equal(t, "Hi Salim, let&#39;s review the API design.", msg.Content)

	// 6. List messages
	messages, err := svc.GetMessages(ctx, conv.ID, u2)
	require.NoError(t, err)
	assert.Len(t, messages, 1)

	// 7. Mark messages read
	err = svc.MarkMessagesRead(ctx, conv.ID, u2)
	require.NoError(t, err)

	// 8. Search messages
	found, err := svc.SearchMessages(ctx, u1, "review")
	require.NoError(t, err)
	assert.Len(t, found, 1)

	// 9. Message request workflow
	req, err := svc.SendMessageRequest(ctx, u1, u2, "Would love to connect regarding Cloud DevOps.")
	require.NoError(t, err)
	assert.Equal(t, "pending", req.Status)

	reqs, err := svc.ListIncomingRequests(ctx, u2)
	require.NoError(t, err)
	assert.Len(t, reqs, 1)

	acceptedConv, err := svc.AcceptMessageRequest(ctx, u2, req.ID)
	require.NoError(t, err)
	assert.NotNil(t, acceptedConv)

	// 10. Reactions & Reports
	err = svc.AddReaction(ctx, msg.ID, u2, "👍")
	require.NoError(t, err)

	err = svc.ReportMessage(ctx, u2, conv.ID, &msg.ID, "spam", "Unsolicited promotional note")
	require.NoError(t, err)

	// 11. Admin analytics
	analytics, err := svc.GetAdminAnalytics(ctx)
	require.NoError(t, err)
	assert.NotNil(t, analytics)
}
