package service

import (
	"context"
	"encoding/json"
	"kirmya/internal/messaging/pubsub"
	"kirmya/internal/notification/models"
	"kirmya/internal/notification/repository"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestNotificationSendWithInAppEnabled(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	userID := uuid.New()
	nType := "connection_request"

	sub, err := ps.Subscribe(context.Background(), "user:events:"+userID.String())
	assert.NoError(t, err)
	defer sub.Close()

	notif, err := svc.Send(context.Background(), userID, nType, "New Connection", "You have a connection request")
	assert.NoError(t, err)
	assert.NotNil(t, notif)
	assert.Equal(t, userID, notif.UserID)
	assert.Equal(t, nType, notif.Type)
	assert.Equal(t, "New Connection", notif.Title)

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

func TestProcessEventCentralized(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	targetUserID := uuid.New()
	evt := models.NotificationEvent{
		ID:           uuid.New(),
		EventType:    "interview_scheduled",
		TargetUserID: targetUserID,
		Payload: map[string]interface{}{
			"title":   "Technical Interview Scheduled",
			"content": "Your interview with Emaar is set for tomorrow at 10:00 AM.",
		},
	}

	notif, err := svc.ProcessEvent(context.Background(), evt)
	assert.NoError(t, err)
	assert.NotNil(t, notif)
	assert.Equal(t, "Interviews", notif.Category)
	assert.Equal(t, "High", notif.Priority)
	assert.Equal(t, "Technical Interview Scheduled", notif.Title)
}

func TestAdminAnalyticsAndAnnouncements(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	analytics, err := svc.GetAnalytics(context.Background())
	assert.NoError(t, err)
	assert.NotNil(t, analytics)
	assert.Greater(t, analytics.TotalCreated, int64(0))

	adminID := uuid.New()
	err = svc.SendAnnouncement(context.Background(), models.AdminAnnouncementRequest{
		Title:   "System Upgrade Notice",
		Content: "Platform scheduled maintenance tonight.",
	}, adminID)
	assert.NoError(t, err)
}
