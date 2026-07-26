package service

import (
	"context"
	"encoding/json"
	"log"
	"kirmya/internal/messaging/pubsub"
	"kirmya/internal/notification/models"
	"kirmya/internal/notification/repository"
	"time"

	"github.com/google/uuid"
)

type NotificationService struct {
	repo   *repository.NotificationRepository
	pubsub pubsub.PubSub
}

func NewNotificationService(repo *repository.NotificationRepository, ps pubsub.PubSub) *NotificationService {
	return &NotificationService{
		repo:   repo,
		pubsub: ps,
	}
}

// Send dispatches a notification checking preference gates first.
func (s *NotificationService) Send(ctx context.Context, userID uuid.UUID, nType string, title string, content string) (*models.Notification, error) {
	// 1. Fetch user preference for this type
	pref, err := s.repo.GetPreference(ctx, userID, nType)
	if err != nil {
		return nil, err
	}

	n := &models.Notification{
		ID:        uuid.New(),
		UserID:    userID,
		Type:      nType,
		Title:     title,
		Content:   content,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	// 2. Dispatch In-App Notification (write to DB + publish to WS stream)
	if pref.InAppEnabled {
		if err := s.repo.Create(ctx, n); err != nil {
			return nil, err
		}

		// Route to WS hub if connected
		if s.pubsub != nil {
			wsEvt := map[string]interface{}{
				"type": "notification",
				"id":   n.ID.String(),
				"payload": map[string]interface{}{
					"id":        n.ID.String(),
					"type":      n.Type,
					"title":     n.Title,
					"content":   n.Content,
					"isRead":    n.IsRead,
					"createdAt": n.CreatedAt.Format(time.RFC3339),
				},
				"timestamp": time.Now().Format(time.RFC3339),
			}
			msgBytes, err := json.Marshal(wsEvt)
			if err == nil {
				_ = s.pubsub.Publish(ctx, "user:events:"+userID.String(), msgBytes)
			}
		}
	}

	// 3. Email Delivery Support prepared
	if pref.EmailEnabled {
		log.Printf("[EMAIL STUB] Dispatching email to %s. Title: %s. Body: %s", userID, title, content)
	}

	// 4. Push Notification Support prepared
	if pref.PushEnabled {
		log.Printf("[PUSH STUB] Dispatching push to %s. Title: %s. Message: %s", userID, title, content)
	}

	return n, nil
}

func (s *NotificationService) List(ctx context.Context, userID uuid.UUID) ([]models.Notification, error) {
	return s.repo.List(ctx, userID)
}

func (s *NotificationService) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.MarkRead(ctx, id, userID)
}

func (s *NotificationService) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	return s.repo.MarkAllRead(ctx, userID)
}

func (s *NotificationService) GetPreferences(ctx context.Context, userID uuid.UUID) ([]models.NotificationPreference, error) {
	return s.repo.GetPreferences(ctx, userID)
}

func (s *NotificationService) UpdatePreference(ctx context.Context, userID uuid.UUID, payload models.UpdatePreferencePayload) error {
	pref, err := s.repo.GetPreference(ctx, userID, payload.NotificationType)
	if err != nil {
		return err
	}

	if payload.EmailEnabled != nil {
		pref.EmailEnabled = *payload.EmailEnabled
	}
	if payload.PushEnabled != nil {
		pref.PushEnabled = *payload.PushEnabled
	}
	if payload.InAppEnabled != nil {
		pref.InAppEnabled = *payload.InAppEnabled
	}

	return s.repo.UpsertPreference(ctx, pref)
}
