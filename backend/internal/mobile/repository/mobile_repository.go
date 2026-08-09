package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/mobile/domain"
	"kirmya/internal/shared/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MobileRepository interface {
	RegisterDevice(ctx context.Context, dev *domain.UserMobileDevice) error
	GetUserDevices(ctx context.Context, userID uuid.UUID) ([]domain.UserMobileDevice, error)

	CreateUploadSession(ctx context.Context, sess *domain.MobileUploadSession) error
	GetUploadSessionByID(ctx context.Context, id uuid.UUID) (*domain.MobileUploadSession, error)
}

// memoryMobileRepository satisfies MobileRepository entirely from process
// memory. It accepts the pool so a SQL implementation can take its place
// without changing any caller, but it never queries it: the data lives and
// dies with this process. Registered in internal/shared/persistence.
type memoryMobileRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	devices map[uuid.UUID]*domain.UserMobileDevice
	uploads map[uuid.UUID]*domain.MobileUploadSession
}

func NewMobileRepository(pool *pgxpool.Pool) MobileRepository {
	persistence.RegisterEphemeral(persistence.Ephemeral{
		Module:      "mobile",
		Data:        "registered mobile devices and chunked upload sessions",
		Consequence: "devices have to re-register and uploads in flight during a restart are orphaned",
	})

	return &memoryMobileRepository{
		pool:    pool,
		devices: make(map[uuid.UUID]*domain.UserMobileDevice),
		uploads: make(map[uuid.UUID]*domain.MobileUploadSession),
	}
}

func (r *memoryMobileRepository) RegisterDevice(ctx context.Context, dev *domain.UserMobileDevice) error {
	if dev.ID == uuid.Nil {
		dev.ID = uuid.New()
	}
	dev.LastActiveAt = time.Now()
	dev.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.devices[dev.ID] = dev
	return nil
}

func (r *memoryMobileRepository) GetUserDevices(ctx context.Context, userID uuid.UUID) ([]domain.UserMobileDevice, error) {
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

func (r *memoryMobileRepository) CreateUploadSession(ctx context.Context, sess *domain.MobileUploadSession) error {
	if sess.ID == uuid.Nil {
		sess.ID = uuid.New()
	}
	sess.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.uploads[sess.ID] = sess
	return nil
}

func (r *memoryMobileRepository) GetUploadSessionByID(ctx context.Context, id uuid.UUID) (*domain.MobileUploadSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if sess, exists := r.uploads[id]; exists {
		sessCopy := *sess
		return &sessCopy, nil
	}
	return nil, nil
}
