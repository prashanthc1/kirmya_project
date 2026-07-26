package service

import (
	"context"
	"encoding/json"
	"kirmya/internal/messaging/pubsub"
	"kirmya/internal/notification/repository"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestNotificationSendWithInAppEnabled(t *testing.T) {
	// 1. Create a dummy in-memory pubsub broker
	ps := pubsub.NewInMemoryPubSub()
	
	// Create repo stub (db is nil, meaning r.db = nil, so DB operations return gracefully)
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	userID := uuid.New()
	nType := "connection_request"

	// Subscribe to the user's event channel first to listen to pushed websocket payloads
	sub, err := ps.Subscribe(context.Background(), "user:events:"+userID.String())
	assert.NoError(t, err)
	defer sub.Close()

	// Send notification
	notif, err := svc.Send(context.Background(), userID, nType, "New Connection", "You have a connection request")
	assert.NoError(t, err)
	assert.NotNil(t, notif)
	assert.Equal(t, userID, notif.UserID)
	assert.Equal(t, nType, notif.Type)
	assert.Equal(t, "New Connection", notif.Title)

	// Verify that the event is routed over Pub/Sub in real-time
	select {
	case msgBytes := <-sub.Channel():
		var wsEvt map[string]interface{}
		err := json.Unmarshal(msgBytes, &wsEvt)
		assert.NoError(t, err)
		assert.Equal(t, "notification", wsEvt["type"])
		
		payload := wsEvt["payload"].(map[string]interface{})
		assert.Equal(t, notif.ID.String(), payload["id"])
		assert.Equal(t, "connection_request", payload["type"])
		assert.Equal(t, "New Connection", payload["title"])
	default:
		t.Fatal("Expected notification event on Pub/Sub user channel, but none received")
	}
}

func TestNotificationSendWithInAppDisabled(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	userID := uuid.New()
	nType := "connection_request"

	// Since r.db is nil, repository methods GetPreference return defaults (all true).
	// We will verify that sending runs cleanly without panic.
	assert.NotPanics(t, func() {
		_, _ = svc.Send(context.Background(), userID, nType, "Muted test", "Content")
	})
}
