package service

import (
	"context"
	"fmt"
	"time"

	"kirmya/internal/mobile/domain"
	"kirmya/internal/mobile/repository"

	"github.com/google/uuid"
)

type MobileService interface {
	RegisterDevice(ctx context.Context, userID uuid.UUID, payload domain.RegisterDevicePayload) (*domain.UserMobileDevice, error)
	CreatePresignedUpload(ctx context.Context, userID uuid.UUID, payload domain.PresignedUploadPayload) (*domain.MobileUploadSession, error)
	GetMobileConfig(ctx context.Context) (*domain.MobileConfig, error)
	GetOpenAPIDocs(ctx context.Context) (map[string]interface{}, error)
}

type mobileService struct {
	repo repository.MobileRepository
}

func NewMobileService(repo repository.MobileRepository) MobileService {
	return &mobileService{repo: repo}
}

func (s *mobileService) RegisterDevice(ctx context.Context, userID uuid.UUID, payload domain.RegisterDevicePayload) (*domain.UserMobileDevice, error) {
	dev := &domain.UserMobileDevice{
		ID:           uuid.New(),
		UserID:       userID,
		DeviceID:     payload.DeviceID,
		Platform:     payload.Platform,
		DeviceModel:  payload.DeviceModel,
		OSVersion:    payload.OSVersion,
		AppVersion:   payload.AppVersion,
		PushToken:    payload.PushToken,
		LastActiveAt: time.Now(),
		CreatedAt:    time.Now(),
	}

	if err := s.repo.RegisterDevice(ctx, dev); err != nil {
		return nil, err
	}
	return dev, nil
}

func (s *mobileService) CreatePresignedUpload(ctx context.Context, userID uuid.UUID, payload domain.PresignedUploadPayload) (*domain.MobileUploadSession, error) {
	sessionID := uuid.New()
	presignedURL := fmt.Sprintf("https://cdn.kirmya.dev/uploads/mobile/%s/%s", sessionID.String(), payload.FileName)

	sess := &domain.MobileUploadSession{
		ID:           sessionID,
		UserID:       userID,
		FileName:     payload.FileName,
		FileType:     payload.FileType,
		FileSize:     payload.FileSize,
		PresignedURL: presignedURL,
		Status:       domain.UploadStatusPending,
		ExpiresAt:    time.Now().Add(30 * time.Minute),
		CreatedAt:    time.Now(),
	}

	if err := s.repo.CreateUploadSession(ctx, sess); err != nil {
		return nil, err
	}
	return sess, nil
}

func (s *mobileService) GetMobileConfig(ctx context.Context) (*domain.MobileConfig, error) {
	return &domain.MobileConfig{
		MinAndroidVersion: "1.2.0",
		MinIOSVersion:     "1.2.0",
		LatestAppVersion:  "2.1.0",
		CDNBaseURL:        "https://cdn.kirmya.dev",
		FeatureFlags: map[string]bool{
			"mobile_ai_assistant":  true,
			"push_notifications":   true,
			"referral_marketplace": true,
			"live_events_webrtc":   true,
		},
		APIVersion: "v1",
		Endpoints: map[string]string{
			"auth_login":         "/api/v1/auth/login",
			"career_assistant":   "/api/v1/ai/career",
			"resume_score":       "/api/v1/ai/resume",
			"referrals":          "/api/v1/referrals",
			"events":             "/api/v1/events",
			"presigned_upload":   "/api/v1/mobile/uploads/presign",
			"register_device":    "/api/v1/mobile/devices",
		},
	}, nil
}

func (s *mobileService) GetOpenAPIDocs(ctx context.Context) (map[string]interface{}, error) {
	return map[string]interface{}{
		"openapi": "3.0.3",
		"info": map[string]interface{}{
			"title":       "Kirmya Native Mobile API Specification (Android & iOS)",
			"description": "Production REST API for Kirmya Android (Kotlin) & iOS (Swift) Native Applications.",
			"version":     "1.0.0",
		},
		"servers": []map[string]string{
			{"url": "http://localhost:8080/api/v1", "description": "Local Development Server"},
			{"url": "https://api.kirmya.dev/api/v1", "description": "Production Mobile Server"},
		},
		"paths": map[string]interface{}{
			"/auth/login": map[string]interface{}{"post": map[string]string{"summary": "Authenticate user & issue Bearer JWT"}},
			"/mobile/devices": map[string]interface{}{"post": map[string]string{"summary": "Register mobile device & FCM/APNs push token"}},
			"/mobile/uploads/presign": map[string]interface{}{"post": map[string]string{"summary": "Request presigned URL for mobile uploads"}},
			"/referrals/requests": map[string]interface{}{"get": map[string]string{"summary": "Discover referral requests"}},
			"/events": map[string]interface{}{"get": map[string]string{"summary": "List professional networking events & webinars"}},
		},
	}, nil
}
