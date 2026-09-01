package repository

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/mobile/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MobileRepository interface {
	RegisterDevice(ctx context.Context, device *domain.UserMobileDevice) error
	GetUserDevices(ctx context.Context, userID uuid.UUID) ([]domain.UserMobileDevice, error)
	CreateUploadSession(ctx context.Context, sess *domain.MobileUploadSession) error
	GetUploadSessionByID(ctx context.Context, id uuid.UUID) (*domain.MobileUploadSession, error)
}

type postgresMobileRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	devices  map[uuid.UUID]*domain.UserMobileDevice
	sessions map[uuid.UUID]*domain.MobileUploadSession
}

func NewMobileRepository(pool *pgxpool.Pool) MobileRepository {
	return &postgresMobileRepository{
		pool:     pool,
		devices:  make(map[uuid.UUID]*domain.UserMobileDevice),
		sessions: make(map[uuid.UUID]*domain.MobileUploadSession),
	}
}

func (r *postgresMobileRepository) RegisterDevice(ctx context.Context, device *domain.UserMobileDevice) error {
	if device.ID == uuid.Nil {
		device.ID = uuid.New()
	}
	now := time.Now()
	device.CreatedAt = now
	device.LastActiveAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.devices[device.ID] = device
		return nil
	}

	query := `
		INSERT INTO user_mobile_devices (
			id, user_id, device_id, platform, device_model, os_version, app_version, push_token, last_active_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (user_id, device_id) DO UPDATE SET
			platform = EXCLUDED.platform,
			device_model = EXCLUDED.device_model,
			os_version = EXCLUDED.os_version,
			app_version = EXCLUDED.app_version,
			push_token = EXCLUDED.push_token,
			last_active_at = EXCLUDED.last_active_at
	`
	_, err := r.pool.Exec(ctx, query,
		device.ID, device.UserID, device.DeviceID, device.Platform, device.DeviceModel,
		device.OSVersion, device.AppVersion, device.PushToken, device.LastActiveAt, device.CreatedAt,
	)
	return err
}

func (r *postgresMobileRepository) GetUserDevices(ctx context.Context, userID uuid.UUID) ([]domain.UserMobileDevice, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []domain.UserMobileDevice
		for _, dev := range r.devices {
			if dev.UserID == userID {
				list = append(list, *dev)
			}
		}
		return list, nil
	}

	query := `
		SELECT id, user_id, device_id, platform, device_model, os_version, app_version, push_token, last_active_at, created_at
		FROM user_mobile_devices
		WHERE user_id = $1
		ORDER BY last_active_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.UserMobileDevice
	for rows.Next() {
		var dev domain.UserMobileDevice
		var model, osVer, appVer, token *string
		if err := rows.Scan(
			&dev.ID, &dev.UserID, &dev.DeviceID, &dev.Platform, &model,
			&osVer, &appVer, &token, &dev.LastActiveAt, &dev.CreatedAt,
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
		if token != nil {
			dev.PushToken = *token
		}
		list = append(list, dev)
	}
	return list, rows.Err()
}

func (r *postgresMobileRepository) CreateUploadSession(ctx context.Context, sess *domain.MobileUploadSession) error {
	if sess.ID == uuid.Nil {
		sess.ID = uuid.New()
	}
	now := time.Now()
	sess.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.sessions[sess.ID] = sess
		return nil
	}

	query := `
		INSERT INTO mobile_upload_sessions (
			id, user_id, file_name, file_type, file_size, presigned_url, status, expires_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.pool.Exec(ctx, query,
		sess.ID, sess.UserID, sess.FileName, sess.FileType, sess.FileSize,
		sess.PresignedURL, sess.Status, sess.ExpiresAt, sess.CreatedAt,
	)
	return err
}

func (r *postgresMobileRepository) GetUploadSessionByID(ctx context.Context, id uuid.UUID) (*domain.MobileUploadSession, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if sess, exists := r.sessions[id]; exists {
			sCopy := *sess
			return &sCopy, nil
		}
		return nil, fmt.Errorf("upload session not found: %s", id)
	}

	query := `
		SELECT id, user_id, file_name, file_type, file_size, presigned_url, status, expires_at, created_at
		FROM mobile_upload_sessions
		WHERE id = $1
	`
	var sess domain.MobileUploadSession
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&sess.ID, &sess.UserID, &sess.FileName, &sess.FileType, &sess.FileSize,
		&sess.PresignedURL, &sess.Status, &sess.ExpiresAt, &sess.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("upload session not found: %s", id)
		}
		return nil, err
	}
	return &sess, nil
}
