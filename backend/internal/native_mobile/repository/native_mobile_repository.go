package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/native_mobile/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NativeMobileRepository interface {
	RegisterDevice(ctx context.Context, dev *domain.UserDevice) error
	SavePushToken(ctx context.Context, token *domain.PushToken) error
	GetUserPushTokens(ctx context.Context, userID uuid.UUID) ([]domain.PushToken, error)

	CreateSession(ctx context.Context, sess *domain.MobileSession) error
	GetSessionByRefreshToken(ctx context.Context, tokenStr string) (*domain.MobileSession, error)
	RevokeSession(ctx context.Context, sessionID uuid.UUID) error
}

type pgxNativeMobileRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	devices  map[uuid.UUID]*domain.UserDevice
	tokens   map[uuid.UUID]*domain.PushToken
	sessions map[string]*domain.MobileSession
}

func NewNativeMobileRepository(pool *pgxpool.Pool) NativeMobileRepository {
	repo := &pgxNativeMobileRepository{
		pool:     pool,
		devices:  make(map[uuid.UUID]*domain.UserDevice),
		tokens:   make(map[uuid.UUID]*domain.PushToken),
		sessions: make(map[string]*domain.MobileSession),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxNativeMobileRepository) seedDefaultData() {
	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	now := time.Now()

	devID := uuid.New()
	dev := &domain.UserDevice{
		ID:           devID,
		UserID:       userID,
		DeviceID:     "b3e9014f-82a1-43e9-a412-1100aa883311",
		Platform:     domain.PlatformAndroid,
		DeviceModel:  "Google Pixel 8 Pro",
		OSVersion:    "Android 14",
		AppVersion:   "2.1.0",
		IsActive:     true,
		LastActiveAt: now,
		CreatedAt:    now,
	}
	r.devices[devID] = dev

	tID := uuid.New()
	pToken := &domain.PushToken{
		ID:        tID,
		DeviceID:  "b3e9014f-82a1-43e9-a412-1100aa883311",
		UserID:    userID,
		Provider:  domain.PushProviderFCM,
		Token:     "fcm_token_sample_abc123",
		CreatedAt: now,
		UpdatedAt: now,
	}
	r.tokens[tID] = pToken

	sID := uuid.New()
	refreshTokenStr := "ref_mobile_sample_token_xyz987"
	mSess := &domain.MobileSession{
		ID:           sID,
		UserID:       userID,
		DeviceID:     "b3e9014f-82a1-43e9-a412-1100aa883311",
		RefreshToken: refreshTokenStr,
		ExpiresAt:    now.Add(30 * 24 * time.Hour),
		IsRevoked:    false,
		CreatedAt:    now,
	}
	r.sessions[refreshTokenStr] = mSess
}

func (r *pgxNativeMobileRepository) RegisterDevice(ctx context.Context, dev *domain.UserDevice) error {
	if dev.ID == uuid.Nil {
		dev.ID = uuid.New()
	}
	dev.LastActiveAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.devices[dev.ID] = dev
	return nil
}

func (r *pgxNativeMobileRepository) SavePushToken(ctx context.Context, token *domain.PushToken) error {
	if token.ID == uuid.Nil {
		token.ID = uuid.New()
	}
	token.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.tokens[token.ID] = token
	return nil
}

func (r *pgxNativeMobileRepository) GetUserPushTokens(ctx context.Context, userID uuid.UUID) ([]domain.PushToken, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.PushToken
	for _, t := range r.tokens {
		if t.UserID == userID {
			list = append(list, *t)
		}
	}
	return list, nil
}

func (r *pgxNativeMobileRepository) CreateSession(ctx context.Context, sess *domain.MobileSession) error {
	if sess.ID == uuid.Nil {
		sess.ID = uuid.New()
	}
	sess.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.sessions[sess.RefreshToken] = sess
	return nil
}

func (r *pgxNativeMobileRepository) GetSessionByRefreshToken(ctx context.Context, tokenStr string) (*domain.MobileSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if sess, exists := r.sessions[tokenStr]; exists {
		sessCopy := *sess
		return &sessCopy, nil
	}
	return nil, fmt.Errorf("session not found or expired")
}

func (r *pgxNativeMobileRepository) RevokeSession(ctx context.Context, sessionID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, sess := range r.sessions {
		if sess.ID == sessionID {
			sess.IsRevoked = true
			break
		}
	}
	return nil
}
