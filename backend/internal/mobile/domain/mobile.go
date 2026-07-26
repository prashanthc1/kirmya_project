package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	PlatformAndroid = "android"
	PlatformIOS     = "ios"

	UploadStatusPending = "pending"
	UploadStatusDone    = "uploaded"
)

type UserMobileDevice struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	DeviceID     string    `json:"device_id"`
	Platform     string    `json:"platform"` // 'android', 'ios'
	DeviceModel  string    `json:"device_model"`
	OSVersion    string    `json:"os_version"`
	AppVersion   string    `json:"app_version"`
	PushToken    string    `json:"push_token"`
	LastActiveAt time.Time `json:"last_active_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type MobileUploadSession struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	FileName     string    `json:"file_name"`
	FileType     string    `json:"file_type"`
	FileSize     int       `json:"file_size"`
	PresignedURL string    `json:"presigned_url"`
	Status       string    `json:"status"`
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type RegisterDevicePayload struct {
	DeviceID    string `json:"device_id" binding:"required"`
	Platform    string `json:"platform" binding:"required"` // 'android' or 'ios'
	DeviceModel string `json:"device_model"`
	OSVersion   string `json:"os_version"`
	AppVersion  string `json:"app_version"`
	PushToken   string `json:"push_token"`
}

type PresignedUploadPayload struct {
	FileName string `json:"file_name" binding:"required"`
	FileType string `json:"file_type" binding:"required"`
	FileSize int    `json:"file_size" binding:"required"`
}

type MobileConfig struct {
	MinAndroidVersion string            `json:"min_android_version"`
	MinIOSVersion     string            `json:"min_ios_version"`
	LatestAppVersion  string            `json:"latest_app_version"`
	CDNBaseURL        string            `json:"cdn_base_url"`
	FeatureFlags      map[string]bool   `json:"feature_flags"`
	APIVersion        string            `json:"api_version"`
	Endpoints         map[string]string `json:"endpoints"`
}
