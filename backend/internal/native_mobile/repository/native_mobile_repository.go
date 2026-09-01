package repository

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/native_mobile/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NativeMobileRepository interface {
	RegisterDevice(ctx context.Context, dev *domain.UserDevice) error
	GetUserDevices(ctx context.Context, userID uuid.UUID) ([]domain.UserDevice, error)

	SavePushToken(ctx context.Context, token *domain.PushToken) error
	GetUserPushTokens(ctx context.Context, userID uuid.UUID) ([]domain.PushToken, error)

	CreateSession(ctx context.Context, sess *domain.MobileSession) error
	GetSessionByRefreshToken(ctx context.Context, refreshToken string) (*domain.MobileSession, error)
	RevokeSession(ctx context.Context, sessionID uuid.UUID) error
}

type postgresNativeMobileRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	devices    map[string]*domain.UserDevice
	pushTokens map[string]*domain.PushToken
	sessions   map[string]*domain.MobileSession
}

func NewNativeMobileRepository(pool *pgxpool.Pool) NativeMobileRepository {
	return &postgresNativeMobileRepository{
		pool:       pool,
		devices:    make(map[string]*domain.UserDevice),
		pushTokens: make(map[string]*domain.PushToken),
		sessions:   make(map[string]*domain.MobileSession),
	}
}

func (r *postgresNativeMobileRepository) RegisterDevice(ctx context.Context, dev *domain.UserDevice) error {
	if dev.ID == uuid.Nil {
		dev.ID = uuid.New()
	}
	now := time.Now()
	dev.CreatedAt = now
	dev.LastActiveAt = now
	dev.IsActive = true

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.devices[dev.DeviceID] = dev
		return nil
	}

	query := `
		INSERT INTO user_devices (
			id, user_id, device_id, platform, device_model, os_version, app_version, is_active, last_active_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (device_id) DO UPDATE SET
			user_id = EXCLUDED.user_id,
			platform = EXCLUDED.platform,
			device_model = EXCLUDED.device_model,
			os_version = EXCLUDED.os_version,
			app_version = EXCLUDED.app_version,
			is_active = EXCLUDED.is_active,
			last_active_at = EXCLUDED.last_active_at
	`
	_, err := r.pool.Exec(ctx, query,
		dev.ID, dev.UserID, dev.DeviceID, dev.Platform, dev.DeviceModel,
		dev.OSVersion, dev.AppVersion, dev.IsActive, dev.LastActiveAt, dev.CreatedAt,
	)
	return err
}

func (r *postgresNativeMobileRepository) GetUserDevices(ctx context.Context, userID uuid.UUID) ([]domain.UserDevice, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []domain.UserDevice
		for _, dev := range r.devices {
			if dev.UserID == userID {
				list = append(list, *dev)
			}
		}
		return list, nil
	}

	query := `
		SELECT id, user_id, device_id, platform, device_model, os_version, app_version, is_active, last_active_at, created_at
		FROM user_devices
		WHERE user_id = $1
		ORDER BY last_active_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.UserDevice
	for rows.Next() {
		var dev domain.UserDevice
		var model, osVer, appVer *string
		if err := rows.Scan(
			&dev.ID, &dev.UserID, &dev.DeviceID, &dev.Platform, &model,
			&osVer, &appVer, &dev.IsActive, &dev.LastActiveAt, &dev.CreatedAt,
		); err != nil {
			return nil, err
		}
		if model != nil {
			dev.DeviceModel = *model
		}
		if osVer != nil {
			dev.OSVersion = *osVer
		}
		if appVer != nil {
			dev.AppVersion = *appVer
		}
		list = append(list, dev)
	}
	return list, rows.Err()
}

func (r *postgresNativeMobileRepository) SavePushToken(ctx context.Context, token *domain.PushToken) error {
	if token.ID == uuid.Nil {
		token.ID = uuid.New()
	}
	now := time.Now()
	token.CreatedAt = now
	token.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.pushTokens[token.DeviceID] = token
		return nil
	}

	query := `
		INSERT INTO push_tokens (
			id, device_id, user_id, provider, token, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (device_id) DO UPDATE SET
			user_id = EXCLUDED.user_id,
			provider = EXCLUDED.provider,
			token = EXCLUDED.token,
			updated_at = EXCLUDED.updated_at
	`
	_, err := r.pool.Exec(ctx, query,
		token.ID, token.DeviceID, token.UserID, token.Provider, token.Token, token.CreatedAt, token.UpdatedAt,
	)
	return err
}

func (r *postgresNativeMobileRepository) GetUserPushTokens(ctx context.Context, userID uuid.UUID) ([]domain.PushToken, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []domain.PushToken
		for _, token := range r.pushTokens {
			if token.UserID == userID {
				list = append(list, *token)
			}
		}
		return list, nil
	}

	query := `
		SELECT id, device_id, user_id, provider, token, created_at, updated_at
		FROM push_tokens
		WHERE user_id = $1
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.PushToken
	for rows.Next() {
		var t domain.PushToken
		if err := rows.Scan(
			&t.ID, &t.DeviceID, &t.UserID, &t.Provider, &t.Token, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, rows.Err()
}

func (r *postgresNativeMobileRepository) CreateSession(ctx context.Context, sess *domain.MobileSession) error {
	if sess.ID == uuid.Nil {
		sess.ID = uuid.New()
	}
	now := time.Now()
	sess.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.sessions[sess.RefreshToken] = sess
		return nil
	}

	query := `
		INSERT INTO mobile_sessions (
			id, user_id, device_id, refresh_token, expires_at, is_revoked, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.pool.Exec(ctx, query,
		sess.ID, sess.UserID, sess.DeviceID, sess.RefreshToken, sess.ExpiresAt, sess.IsRevoked, sess.CreatedAt,
	)
	return err
}

func (r *postgresNativeMobileRepository) GetSessionByRefreshToken(ctx context.Context, refreshToken string) (*domain.MobileSession, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if sess, exists := r.sessions[refreshToken]; exists {
			sCopy := *sess
			return &sCopy, nil
		}
		return nil, fmt.Errorf("session not found")
	}

	query := `
		SELECT id, user_id, device_id, refresh_token, expires_at, is_revoked, created_at
		FROM mobile_sessions
		WHERE refresh_token = $1
	`
	var sess domain.MobileSession
	err := r.pool.QueryRow(ctx, query, refreshToken).Scan(
		&sess.ID, &sess.UserID, &sess.DeviceID, &sess.RefreshToken,
		&sess.ExpiresAt, &sess.IsRevoked, &sess.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("session not found")
		}
		return nil, err
	}
	return &sess, nil
}

func (r *postgresNativeMobileRepository) RevokeSession(ctx context.Context, sessionID uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		for _, sess := range r.sessions {
			if sess.ID == sessionID {
				sess.IsRevoked = true
				return nil
			}
		}
		return fmt.Errorf("session not found")
	}

	query := `
		UPDATE mobile_sessions
		SET is_revoked = true
		WHERE id = $1
	`
	tag, err := r.pool.Exec(ctx, query, sessionID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("session not found")
	}
	return nil
}
