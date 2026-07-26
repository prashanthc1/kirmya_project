package provider

import (
	"context"
	"log/slog"

	"kirmya/internal/native_mobile/domain"
)

// PushNotificationProvider interface isolates native push dispatch from business logic
type PushNotificationProvider interface {
	SendPushNotification(ctx context.Context, targetToken, platform string, payload domain.PushNotificationPayload) error
}

type MockPushNotificationProvider struct{}

func NewMockPushNotificationProvider() *MockPushNotificationProvider {
	return &MockPushNotificationProvider{}
}

func (p *MockPushNotificationProvider) SendPushNotification(ctx context.Context, targetToken, platform string, payload domain.PushNotificationPayload) error {
	slog.Info("Native push notification dispatched to mobile device",
		slog.String("platform", platform),
		slog.String("target_token", targetToken),
		slog.String("title", payload.Title),
		slog.String("body", payload.Body),
	)
	return nil
}
