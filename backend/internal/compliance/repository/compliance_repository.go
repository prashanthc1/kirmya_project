package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/compliance/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ComplianceRepository interface {
	SaveConsent(ctx context.Context, record *domain.ConsentRecord) error
	GetUserConsents(ctx context.Context, userID uuid.UUID) ([]domain.ConsentRecord, error)

	CreateDataRequest(ctx context.Context, req *domain.DataRequest) error
	GetUserDataRequests(ctx context.Context, userID uuid.UUID) ([]domain.DataRequest, error)
	UpdateDataRequest(ctx context.Context, req *domain.DataRequest) error

	LogAuditEvent(ctx context.Context, event *domain.AuditEvent) error
	GetUserAuditEvents(ctx context.Context, userID uuid.UUID) ([]domain.AuditEvent, error)
}

type pgxComplianceRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	consents map[uuid.UUID][]domain.ConsentRecord
	requests map[uuid.UUID]*domain.DataRequest
	events   map[uuid.UUID][]domain.AuditEvent
}

func NewComplianceRepository(pool *pgxpool.Pool) ComplianceRepository {
	repo := &pgxComplianceRepository{
		pool:     pool,
		consents: make(map[uuid.UUID][]domain.ConsentRecord),
		requests: make(map[uuid.UUID]*domain.DataRequest),
		events:   make(map[uuid.UUID][]domain.AuditEvent),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxComplianceRepository) seedDefaultData() {
	now := time.Now()
	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")

	r.consents[userID] = []domain.ConsentRecord{
		{ID: uuid.New(), UserID: userID, ConsentType: domain.ConsentAnalytics, IsGranted: true, GrantedAt: now, IPAddress: "192.168.1.100"},
		{ID: uuid.New(), UserID: userID, ConsentType: domain.ConsentMarketing, IsGranted: false, GrantedAt: now, IPAddress: "192.168.1.100"},
		{ID: uuid.New(), UserID: userID, ConsentType: domain.ConsentThirdParty, IsGranted: false, GrantedAt: now, IPAddress: "192.168.1.100"},
	}

	completedAt := now.Add(-1 * time.Hour)
	reqID := uuid.New()
	r.requests[reqID] = &domain.DataRequest{
		ID:          reqID,
		UserID:      userID,
		RequestType: domain.RequestTypeExport,
		Status:      domain.RequestStatusCompleted,
		DownloadURL: "https://cdn.kirmya.dev/gdpr/exports/alex_rivera_gdpr_export.json",
		RequestedAt: now.Add(-2 * time.Hour),
		CompletedAt: &completedAt,
	}

	r.events[userID] = []domain.AuditEvent{
		{
			ID:        uuid.New(),
			UserID:    userID,
			EventType: "GDPR_CONSENT_UPDATE",
			Resource:  "Privacy Center / Consent Settings",
			Details:   map[string]interface{}{"analytics": true, "marketing": false},
			CreatedAt: now,
		},
	}
}

func (r *pgxComplianceRepository) SaveConsent(ctx context.Context, record *domain.ConsentRecord) error {
	if record.ID == uuid.Nil {
		record.ID = uuid.New()
	}
	record.GrantedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	list := r.consents[record.UserID]
	updated := false
	for i, c := range list {
		if c.ConsentType == record.ConsentType {
			list[i] = *record
			updated = true
			break
		}
	}
	if !updated {
		r.consents[record.UserID] = append(list, *record)
	}
	return nil
}

func (r *pgxComplianceRepository) GetUserConsents(ctx context.Context, userID uuid.UUID) ([]domain.ConsentRecord, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.consents[userID], nil
}

func (r *pgxComplianceRepository) CreateDataRequest(ctx context.Context, req *domain.DataRequest) error {
	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	req.RequestedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.requests[req.ID] = req
	return nil
}

func (r *pgxComplianceRepository) GetUserDataRequests(ctx context.Context, userID uuid.UUID) ([]domain.DataRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.DataRequest
	for _, req := range r.requests {
		if req.UserID == userID {
			list = append(list, *req)
		}
	}
	return list, nil
}

func (r *pgxComplianceRepository) UpdateDataRequest(ctx context.Context, req *domain.DataRequest) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.requests[req.ID] = req
	return nil
}

func (r *pgxComplianceRepository) LogAuditEvent(ctx context.Context, event *domain.AuditEvent) error {
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	event.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.events[event.UserID] = append([]domain.AuditEvent{*event}, r.events[event.UserID]...)
	return nil
}

func (r *pgxComplianceRepository) GetUserAuditEvents(ctx context.Context, userID uuid.UUID) ([]domain.AuditEvent, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.events[userID], nil
}
