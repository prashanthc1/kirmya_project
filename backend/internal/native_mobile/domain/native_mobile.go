package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	PlatformAndroid = "android"
	PlatformIOS     = "ios"

	PushProviderFCM  = "fcm"
	PushProviderAPNS = "apns"
)

type UserDevice struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	DeviceID     string    `json:"device_id"`
	Platform     string    `json:"platform"`
	DeviceModel  string    `json:"device_model"`
	OSVersion    string    `json:"os_version"`
	AppVersion   string    `json:"app_version"`
	IsActive     bool      `json:"is_active"`
	LastActiveAt time.Time `json:"last_active_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type PushToken struct {
	ID        uuid.UUID `json:"id"`
	DeviceID  string    `json:"device_id"`
	UserID    uuid.UUID `json:"user_id"`
	Provider  string    `json:"provider"`
	Token     string    `json:"token"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type MobileSession struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	DeviceID     string    `json:"device_id"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	IsRevoked    bool      `json:"is_revoked"`
	CreatedAt    time.Time `json:"created_at"`
}

type RefreshTokenPayload struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
	DeviceID     string `json:"device_id" binding:"required"`
}

type PushNotificationPayload struct {
	UserID  uuid.UUID              `json:"user_id"`
	Title   string                 `json:"title" binding:"required"`
	Body    string                 `json:"body" binding:"required"`
	Data    map[string]interface{} `json:"data,omitempty"`
	Badge   int                    `json:"badge,omitempty"`
}

// Compact Mobile API DTOs
type MobileUserProfile struct {
	UserID          uuid.UUID `json:"user_id"`
	FullName        string    `json:"full_name"`
	Headline        string    `json:"headline"`
	AvatarURL       string    `json:"avatar_url"`
	IsVerified      bool      `json:"is_verified"`
	UnreadMessages  int       `json:"unread_messages"`
	UnreadNotifs    int       `json:"unread_notifications"`
	ActiveRole      string    `json:"active_role"`
}

type MobileJobItem struct {
	JobID        uuid.UUID `json:"job_id"`
	Title        string    `json:"title"`
	Company      string    `json:"company"`
	Location     string    `json:"location"`
	Salary       string    `json:"salary"`
	MatchScore   int       `json:"match_score"`
	IsRemote     bool      `json:"is_remote"`
	PostedTime   string    `json:"posted_time"`
}

type MobileApplicationItem struct {
	ApplicationID uuid.UUID `json:"application_id"`
	JobTitle      string    `json:"job_title"`
	Company       string    `json:"company"`
	Status        string    `json:"status"` // 'applied', 'reviewing', 'interviewing', 'offered'
	AppliedDate   string    `json:"applied_date"`
}

type MobileMessageItem struct {
	ConversationID string    `json:"conversation_id"`
	SenderName     string    `json:"sender_name"`
	SenderAvatar   string    `json:"sender_avatar"`
	LastMessage    string    `json:"last_message"`
	UnreadCount    int       `json:"unread_count"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type MobileNotificationItem struct {
	ID        uuid.UUID `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Type      string    `json:"type"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}
