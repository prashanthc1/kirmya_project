package service

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/messaging/models"
	"kirmya/internal/messaging/pubsub"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
)

// TestWSHubConnectionRegistration verifies that client mapping, lock protection,
// and unregistration handles connection maps successfully.
func TestWSHubConnectionRegistration(t *testing.T) {
	// Setup service instance
	ps := pubsub.NewInMemoryPubSub()
	svc := NewMessagingService(nil, ps)

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
	svc := NewMessagingService(nil, ps)
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
	svc := NewMessagingService(nil, ps)

	u1 := uuid.New()
	_, err := svc.GetOrCreateConversation(context.Background(), u1, u1)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot initiate a conversation with yourself")
}
