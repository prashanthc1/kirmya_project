package models

import (
	"time"

	"github.com/google/uuid"
)

// Notification represents an in-app alert log.
type Notification struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Type      string    `json:"type"` // connection_request, message, job_recommendation, application, community_activity, profile_view
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	IsRead    bool      `json:"isRead"`
	CreatedAt time.Time `json:"createdAt"`
}

// NotificationPreference stores settings mapping channels to specific types.
type NotificationPreference struct {
	UserID           uuid.UUID `json:"userId"`
	NotificationType string    `json:"notificationType"`
	EmailEnabled     bool      `json:"emailEnabled"`
	PushEnabled      bool      `json:"pushEnabled"`
	InAppEnabled     bool      `json:"inAppEnabled"`
}

// UpdatePreferencePayload is the payload struct for updating user preferences.
type UpdatePreferencePayload struct {
	NotificationType string `json:"notificationType" binding:"required"`
	EmailEnabled     *bool  `json:"emailEnabled,omitempty"`
	PushEnabled      *bool  `json:"pushEnabled,omitempty"`
	InAppEnabled     *bool  `json:"inAppEnabled,omitempty"`
}
