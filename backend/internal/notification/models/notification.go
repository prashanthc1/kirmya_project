package models

import (
	"time"

	"github.com/google/uuid"
)

// Notification represents a normalized in-app or cross-channel alert log.
type Notification struct {
	ID                 uuid.UUID              `json:"id"`
	UserID             uuid.UUID              `json:"userId"`
	Category           string                 `json:"category"` // Security, Jobs, Applications, Interviews, Recruiter, Companies, Networking, Communities, Career, Resume, Cover Letters, AI, System
	Type               string                 `json:"type"`
	Priority           string                 `json:"priority"` // Critical, High, Normal, Low
	Title              string                 `json:"title"`
	Content            string                 `json:"content"`
	ActorID            *uuid.UUID             `json:"actorId,omitempty"`
	ActorName          string                 `json:"actorName,omitempty"`
	TargetResource     string                 `json:"targetResource,omitempty"`
	TargetResourceType string                 `json:"targetResourceType,omitempty"`
	ActionURL          string                 `json:"actionUrl,omitempty"`
	Icon               string                 `json:"icon,omitempty"`
	Metadata           map[string]interface{} `json:"metadata,omitempty"`
	IsRead             bool                   `json:"isRead"`
	IsArchived         bool                   `json:"isArchived"`
	GroupID            *uuid.UUID             `json:"groupId,omitempty"`
	ExpiresAt          *time.Time             `json:"expiresAt,omitempty"`
	CreatedAt          time.Time              `json:"createdAt"`
	UpdatedAt          time.Time              `json:"updatedAt"`
}

// NotificationEvent represents a raw platform event before delivery dispatch.
type NotificationEvent struct {
	ID             uuid.UUID              `json:"id"`
	EventType      string                 `json:"eventType"`
	ActorID        *uuid.UUID             `json:"actorId,omitempty"`
	TargetUserID   uuid.UUID              `json:"targetUserId"`
	ResourceType   string                 `json:"resourceType,omitempty"`
	ResourceID     string                 `json:"resourceId,omitempty"`
	Payload        map[string]interface{} `json:"payload,omitempty"`
	IdempotencyKey string                 `json:"idempotencyKey,omitempty"`
	CreatedAt      time.Time              `json:"createdAt"`
}

// NotificationPreference stores per-type delivery settings.
type NotificationPreference struct {
	UserID           uuid.UUID `json:"userId"`
	NotificationType string    `json:"notificationType"`
	Category         string    `json:"category"`
	EmailEnabled     bool      `json:"emailEnabled"`
	PushEnabled      bool      `json:"pushEnabled"`
	InAppEnabled     bool      `json:"inAppEnabled"`
	SMSEnabled       bool      `json:"smsEnabled"`
	Frequency        string    `json:"frequency"` // Instant, Daily Digest, Weekly Digest, Never
	UpdatedAt        time.Time `json:"updatedAt"`
}

// CategoryPreference stores settings per broad notification category.
type CategoryPreference struct {
	UserID    uuid.UUID `json:"userId"`
	Category  string    `json:"category"`
	Enabled   bool      `json:"enabled"`
	Frequency string    `json:"frequency"`
}

// QuietHoursSettings stores user do-not-disturb schedule settings.
type QuietHoursSettings struct {
	UserID    uuid.UUID `json:"userId"`
	Enabled   bool      `json:"enabled"`
	StartTime string    `json:"startTime"` // e.g. "22:00"
	EndTime   string    `json:"endTime"`   // e.g. "07:00"
	Timezone  string    `json:"timezone"`  // e.g. "UTC"
	Days      string    `json:"days"`      // e.g. "Mon,Tue,Wed,Thu,Fri,Sat,Sun"
	UpdatedAt time.Time `json:"updatedAt"`
}

// NotificationDelivery tracks delivery attempts for a channel.
type NotificationDelivery struct {
	ID             uuid.UUID  `json:"id"`
	NotificationID uuid.UUID  `json:"notificationId"`
	UserID         uuid.UUID  `json:"userId"`
	Channel        string     `json:"channel"`  // in_app, email, push, sms, webhook
	Provider       string     `json:"provider"` // sendgrid, fcm, twilio, internal
	Status         string     `json:"status"`   // Pending, Queued, Sent, Delivered, Opened, Failed, Expired, Cancelled
	Attempts       int        `json:"attempts"`
	MaxAttempts    int        `json:"maxAttempts"`
	LastError      string     `json:"lastError,omitempty"`
	ScheduledAt    time.Time  `json:"scheduledAt"`
	SentAt         *time.Time `json:"sentAt,omitempty"`
	DeliveredAt    *time.Time `json:"deliveredAt,omitempty"`
	OpenedAt       *time.Time `json:"openedAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}

// NotificationDevice stores client mobile/browser push tokens.
type NotificationDevice struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"userId"`
	DeviceToken string    `json:"deviceToken"`
	Platform   string    `json:"platform"` // web, ios, android
	IsActive   bool      `json:"isActive"`
	LastUsedAt time.Time `json:"lastUsedAt"`
	CreatedAt  time.Time `json:"createdAt"`
}

// NotificationTemplate stores admin message formatters.
type NotificationTemplate struct {
	ID                   uuid.UUID `json:"id"`
	Code                 string    `json:"code"`
	Category             string    `json:"category"`
	TitleTemplate        string    `json:"titleTemplate"`
	ContentTemplate      string    `json:"contentTemplate"`
	EmailSubjectTemplate string    `json:"emailSubjectTemplate,omitempty"`
	EmailBodyTemplate    string    `json:"emailBodyTemplate,omitempty"`
	PushTitleTemplate    string    `json:"pushTitleTemplate,omitempty"`
	PushBodyTemplate     string    `json:"pushBodyTemplate,omitempty"`
	Variables            []string  `json:"variables"`
	IsActive             bool      `json:"isActive"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

// NotificationGroup represents bundled high-volume notifications.
type NotificationGroup struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"userId"`
	GroupKey      string    `json:"groupKey"`
	Category      string    `json:"category"`
	Type          string    `json:"type"`
	ItemCount     int       `json:"itemCount"`
	LatestTitle   string    `json:"latestTitle"`
	LatestContent string    `json:"latestContent"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// NotificationFailure tracks dead-letter failures.
type NotificationFailure struct {
	ID             uuid.UUID `json:"id"`
	DeliveryID     uuid.UUID `json:"deliveryId"`
	NotificationID uuid.UUID `json:"notificationId"`
	UserID         uuid.UUID `json:"userId"`
	Channel        string    `json:"channel"`
	ErrorMessage   string    `json:"errorMessage"`
	RetryCount     int       `json:"retryCount"`
	IsDeadLetter   bool      `json:"isDeadLetter"`
	CreatedAt      time.Time `json:"createdAt"`
}

// NotificationAnalytics defines metrics aggregated for system admins.
type NotificationAnalytics struct {
	TotalCreated     int64                  `json:"totalCreated"`
	TotalSent        int64                  `json:"totalSent"`
	DeliveryRate     float64                `json:"deliveryRate"`
	FailureRate      float64                `json:"failureRate"`
	ReadRate         float64                `json:"readRate"`
	TopTypes         map[string]int64       `json:"topTypes"`
	VolumeByChannel  map[string]int64       `json:"volumeByChannel"`
	CategoryBreakdown map[string]int64      `json:"categoryBreakdown"`
}

// AdminAnnouncementRequest payload for platform announcements.
type AdminAnnouncementRequest struct {
	Title     string `json:"title" binding:"required"`
	Content   string `json:"content" binding:"required"`
	Category  string `json:"category"`
	TargetRole string `json:"targetRole"` // All, Candidates, Recruiters, Admins
	ActionURL string `json:"actionUrl"`
}

// UpdatePreferencePayload is the payload struct for updating user preferences.
type UpdatePreferencePayload struct {
	NotificationType string `json:"notificationType" binding:"required"`
	Category         string `json:"category,omitempty"`
	EmailEnabled     *bool  `json:"emailEnabled,omitempty"`
	PushEnabled      *bool  `json:"pushEnabled,omitempty"`
	InAppEnabled     *bool  `json:"inAppEnabled,omitempty"`
	SMSEnabled       *bool  `json:"smsEnabled,omitempty"`
	Frequency        string `json:"frequency,omitempty"`
}

// RegisterDevicePayload holds registration request body.
type RegisterDevicePayload struct {
	DeviceToken string `json:"deviceToken" binding:"required"`
	Platform    string `json:"platform" binding:"required"`
}
