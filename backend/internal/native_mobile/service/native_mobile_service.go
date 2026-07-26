package service

import (
	"context"
	"fmt"
	"time"

	"kirmya/internal/native_mobile/domain"
	"kirmya/internal/native_mobile/provider"
	"kirmya/internal/native_mobile/repository"

	"github.com/google/uuid"
)

type NativeMobileService interface {
	RefreshToken(ctx context.Context, payload domain.RefreshTokenPayload) (string, string, error)
	RegisterDevice(ctx context.Context, userID uuid.UUID, dev *domain.UserDevice, pushToken *domain.PushToken) error
	SendPushNotification(ctx context.Context, payload domain.PushNotificationPayload) error

	GetMobileUserProfile(ctx context.Context, userID uuid.UUID) (*domain.MobileUserProfile, error)
	GetMobileUserJobs(ctx context.Context, userID uuid.UUID) ([]domain.MobileJobItem, error)
	GetMobileUserApplications(ctx context.Context, userID uuid.UUID) ([]domain.MobileApplicationItem, error)
	GetMobileUserMessages(ctx context.Context, userID uuid.UUID) ([]domain.MobileMessageItem, error)
	GetMobileUserNotifications(ctx context.Context, userID uuid.UUID) ([]domain.MobileNotificationItem, error)
}

type nativeMobileService struct {
	repo         repository.NativeMobileRepository
	pushProvider provider.PushNotificationProvider
}

func NewNativeMobileService(repo repository.NativeMobileRepository, pushProvider provider.PushNotificationProvider) NativeMobileService {
	return &nativeMobileService{
		repo:         repo,
		pushProvider: pushProvider,
	}
}

func (s *nativeMobileService) RefreshToken(ctx context.Context, payload domain.RefreshTokenPayload) (string, string, error) {
	sess, err := s.repo.GetSessionByRefreshToken(ctx, payload.RefreshToken)
	if err != nil || sess.IsRevoked || time.Now().After(sess.ExpiresAt) {
		return "", "", fmt.Errorf("invalid or expired refresh token")
	}

	// Token rotation: Revoke old session and issue new token pair
	_ = s.repo.RevokeSession(ctx, sess.ID)

	newRefreshToken := fmt.Sprintf("ref_rot_%s_%d", uuid.New().String(), time.Now().Unix())
	newSession := &domain.MobileSession{
		ID:           uuid.New(),
		UserID:       sess.UserID,
		DeviceID:     payload.DeviceID,
		RefreshToken: newRefreshToken,
		ExpiresAt:    time.Now().Add(30 * 24 * time.Hour),
		IsRevoked:    false,
		CreatedAt:    time.Now(),
	}
	_ = s.repo.CreateSession(ctx, newSession)

	newAccessToken := sess.UserID.String()
	return newAccessToken, newRefreshToken, nil
}

func (s *nativeMobileService) RegisterDevice(ctx context.Context, userID uuid.UUID, dev *domain.UserDevice, pushToken *domain.PushToken) error {
	dev.UserID = userID
	if err := s.repo.RegisterDevice(ctx, dev); err != nil {
		return err
	}

	if pushToken != nil && pushToken.Token != "" {
		pushToken.UserID = userID
		pushToken.DeviceID = dev.DeviceID
		_ = s.repo.SavePushToken(ctx, pushToken)
	}

	return nil
}

func (s *nativeMobileService) SendPushNotification(ctx context.Context, payload domain.PushNotificationPayload) error {
	tokens, err := s.repo.GetUserPushTokens(ctx, payload.UserID)
	if err != nil || len(tokens) == 0 {
		return nil // Graceful no-op if user has no active devices
	}

	for _, t := range tokens {
		_ = s.pushProvider.SendPushNotification(ctx, t.Token, t.Provider, payload)
	}
	return nil
}

func (s *nativeMobileService) GetMobileUserProfile(ctx context.Context, userID uuid.UUID) (*domain.MobileUserProfile, error) {
	return &domain.MobileUserProfile{
		UserID:         userID,
		FullName:       "Alex Rivera",
		Headline:       "Senior Go Backend Architect",
		AvatarURL:      "https://cdn.kirmya.dev/avatars/alex.jpg",
		IsVerified:     true,
		UnreadMessages: 3,
		UnreadNotifs:   5,
		ActiveRole:     "Candidate & Referrer",
	}, nil
}

func (s *nativeMobileService) GetMobileUserJobs(ctx context.Context, userID uuid.UUID) ([]domain.MobileJobItem, error) {
	return []domain.MobileJobItem{
		{
			JobID:      uuid.MustParse("j1111111-1111-1111-1111-111111111111"),
			Title:      "Senior Go Backend Architect",
			Company:    "Stripe Global",
			Location:   "Remote / SF",
			Salary:     "$180k - $220k",
			MatchScore: 96,
			IsRemote:   true,
			PostedTime: "2 hours ago",
		},
		{
			JobID:      uuid.MustParse("j2222222-2222-2222-2222-222222222222"),
			Title:      "Lead Distributed Systems Engineer",
			Company:    "TechCorp Cloud",
			Location:   "Remote",
			Salary:     "$190k - $240k",
			MatchScore: 88,
			IsRemote:   true,
			PostedTime: "1 day ago",
		},
	}, nil
}

func (s *nativeMobileService) GetMobileUserApplications(ctx context.Context, userID uuid.UUID) ([]domain.MobileApplicationItem, error) {
	return []domain.MobileApplicationItem{
		{
			ApplicationID: uuid.New(),
			JobTitle:      "Senior Go Backend Architect",
			Company:       "Stripe Global",
			Status:        "interviewing",
			AppliedDate:   "July 24, 2026",
		},
	}, nil
}

func (s *nativeMobileService) GetMobileUserMessages(ctx context.Context, userID uuid.UUID) ([]domain.MobileMessageItem, error) {
	return []domain.MobileMessageItem{
		{
			ConversationID: "conv-1",
			SenderName:     "Stripe Technical Recruiter",
			SenderAvatar:   "https://cdn.kirmya.dev/avatars/recruiter.jpg",
			LastMessage:    "Hi Alex, looking forward to our technical interview session tomorrow at 2 PM PST!",
			UnreadCount:    1,
			UpdatedAt:      time.Now().Add(-30 * time.Minute),
		},
	}, nil
}

func (s *nativeMobileService) GetMobileUserNotifications(ctx context.Context, userID uuid.UUID) ([]domain.MobileNotificationItem, error) {
	return []domain.MobileNotificationItem{
		{
			ID:        uuid.New(),
			Title:     "Interview Reminder",
			Body:      "Your Stripe Technical Interview is scheduled for tomorrow.",
			Type:      "interview",
			IsRead:    false,
			CreatedAt: time.Now().Add(-1 * time.Hour),
		},
		{
			ID:        uuid.New(),
			Title:     "Referral Match Accepted",
			Body:      "Your employee referral match for Stripe Global was accepted!",
			Type:      "referral",
			IsRead:    true,
			CreatedAt: time.Now().Add(-5 * time.Hour),
		},
	}, nil
}
