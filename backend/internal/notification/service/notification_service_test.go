package service

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"kirmya/internal/messaging/pubsub"
	"kirmya/internal/notification/models"
	"kirmya/internal/notification/repository"

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
	case <-time.After(1 * time.Second):
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
	assert.Equal(t, models.CategoryInterviews, notif.Category)
	assert.Equal(t, models.PriorityHigh, notif.Priority)
	assert.Equal(t, "Technical Interview Scheduled", notif.Title)
}

func TestQuietHoursEnforcementAndBypass(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	userID := uuid.New()
	now := time.Now()

	startHour := (now.Hour() + 23) % 24
	endHour := (now.Hour() + 2) % 24

	qh := &models.QuietHoursSettings{
		UserID:    userID,
		Enabled:   true,
		StartTime: time.Date(0, 1, 1, startHour, 0, 0, 0, time.UTC).Format("15:04"),
		EndTime:   time.Date(0, 1, 1, endHour, 0, 0, 0, time.UTC).Format("15:04"),
		Days:      "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
	}
	err := svc.UpdateQuietHours(context.Background(), qh)
	assert.NoError(t, err)

	// 1. Non-critical event during quiet hours
	jobEvt := models.NotificationEvent{
		ID:           uuid.New(),
		EventType:    "job_recommendation",
		TargetUserID: userID,
	}
	jobNotif, err := svc.ProcessEvent(context.Background(), jobEvt)
	assert.NoError(t, err)
	assert.NotNil(t, jobNotif)
	assert.Equal(t, models.CategoryJobs, jobNotif.Category)

	// 2. Security alert during quiet hours -> Must bypass quiet hours
	secEvt := models.NotificationEvent{
		ID:           uuid.New(),
		EventType:    "security_alert",
		TargetUserID: userID,
	}
	secNotif, err := svc.ProcessEvent(context.Background(), secEvt)
	assert.NoError(t, err)
	assert.NotNil(t, secNotif)
	assert.Equal(t, models.CategorySecurity, secNotif.Category)
	assert.Equal(t, models.PriorityCritical, secNotif.Priority)
}

func TestIdempotencyDeduplication(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	userID := uuid.New()
	idempotencyKey := "dedup-key-12345"

	evt := models.NotificationEvent{
		ID:             uuid.New(),
		EventType:      "application_submitted",
		TargetUserID:   userID,
		IdempotencyKey: idempotencyKey,
	}

	// First attempt -> processes notification
	n1, err := svc.ProcessEvent(context.Background(), evt)
	assert.NoError(t, err)
	assert.NotNil(t, n1)

	// Second attempt with same key -> deduplicated (returns nil)
	n2, err := svc.ProcessEvent(context.Background(), evt)
	assert.NoError(t, err)
	assert.Nil(t, n2)
}

func TestChannelPreferences(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	userID := uuid.New()
	nType := "skill_recommendation"

	inAppFalse := false
	err := svc.UpdatePreference(context.Background(), userID, models.UpdatePreferencePayload{
		NotificationType: nType,
		InAppEnabled:     &inAppFalse,
	})
	assert.NoError(t, err)

	evt := models.NotificationEvent{
		ID:           uuid.New(),
		EventType:    nType,
		TargetUserID: userID,
	}

	n, err := svc.ProcessEvent(context.Background(), evt)
	assert.NoError(t, err)
	assert.NotNil(t, n)

	list, err := svc.List(context.Background(), userID, "", false, 10, 0)
	assert.NoError(t, err)
	assert.Empty(t, list)
}

func TestDeadLetterQueueRetries(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	dlList, err := svc.ListDeadLetters(context.Background(), 10)
	assert.NoError(t, err)
	assert.NotEmpty(t, dlList)

	targetDL := dlList[0]
	assert.Equal(t, "dead_lettered", targetDL.Status)

	err = svc.RetryDeadLetter(context.Background(), targetDL.ID)
	assert.NoError(t, err)

	dlListUpdated, err := svc.ListDeadLetters(context.Background(), 10)
	assert.NoError(t, err)
	for _, item := range dlListUpdated {
		if item.ID == targetDL.ID {
			assert.Equal(t, "retried", item.Status)
		}
	}
}

func TestDeepLinkFormatting(t *testing.T) {
	tests := []struct {
		eventType   string
		resourceID  string
		expectedURL string
	}{
		{"connection_request", "123", "/network/requests"},
		{"new_message", "msg-1", "/messages"},
		{"mentorship_request", "m-1", "/mentorship"},
		{"community_invitation", "c-1", "/communities"},
		{"job_alert", "j-100", "/jobs"},
		{"application_status_changed", "app-5", "/applications"},
		{"skill_recommendation", "skill-2", "/analytics/career"},
		{"unknown_type", "x", "/notifications"},
	}

	for _, tt := range tests {
		url := formatActionURL(tt.eventType, tt.resourceID)
		assert.Equal(t, tt.expectedURL, url, "Action URL mismatch for eventType: %s", tt.eventType)
	}
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

func TestDomainEventsAndMandatorySecurityOverrides(t *testing.T) {
	ps := pubsub.NewInMemoryPubSub()
	repo := repository.NewNotificationRepository(nil)
	svc := NewNotificationService(repo, ps)

	userID := uuid.New()

	// 1. Trust & Safety event processing
	trustEvt := models.NotificationEvent{
		ID:           uuid.New(),
		EventType:    "trust.restriction_created",
		TargetUserID: userID,
	}
	trustNotif, err := svc.ProcessEvent(context.Background(), trustEvt)
	assert.NoError(t, err)
	assert.NotNil(t, trustNotif)
	assert.Equal(t, models.CategoryTrustSafety, trustNotif.Category)
	assert.Equal(t, models.PriorityHigh, trustNotif.Priority)
	assert.Equal(t, "/safety", trustNotif.ActionURL)

	// 2. Privacy export completed event processing
	privacyEvt := models.NotificationEvent{
		ID:           uuid.New(),
		EventType:    "privacy.export_completed",
		TargetUserID: userID,
	}
	privNotif, err := svc.ProcessEvent(context.Background(), privacyEvt)
	assert.NoError(t, err)
	assert.NotNil(t, privNotif)
	assert.Equal(t, models.CategoryPrivacy, privNotif.Category)
	assert.Equal(t, "/settings/privacy/download-data", privNotif.ActionURL)

	// 3. Security new login event processing -> Critical priority
	secEvt := models.NotificationEvent{
		ID:           uuid.New(),
		EventType:    "security.new_login",
		TargetUserID: userID,
	}
	secNotif, err := svc.ProcessEvent(context.Background(), secEvt)
	assert.NoError(t, err)
	assert.NotNil(t, secNotif)
	assert.Equal(t, models.CategorySecurity, secNotif.Category)
	assert.Equal(t, models.PriorityCritical, secNotif.Priority)
	assert.Equal(t, "/settings/security", secNotif.ActionURL)
}

