package repository

import (
	"context"
	"encoding/json"
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
		DownloadURL: "https://kirmya.com/api/v1/compliance/download/export-9a8b7c6d.zip",
		RequestedAt: now.Add(-2 * time.Hour),
		CompletedAt: &completedAt,
	}

	r.events[userID] = []domain.AuditEvent{
		{
			ID:        uuid.New(),
			UserID:    userID,
			EventType: "PROFILE_DATA_ACCESS",
			Resource:  "/api/v1/profiles/me",
			Details:   map[string]interface{}{"ip": "192.168.1.100", "user_agent": "Mozilla/5.0"},
			CreatedAt: now,
		},
	}
}

func (r *pgxComplianceRepository) SaveConsent(ctx context.Context, record *domain.ConsentRecord) error {
	if record.ID == uuid.Nil {
		record.ID = uuid.New()
	}
	record.GrantedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO consent_records (id, user_id, consent_type, is_granted, granted_at, ip_address) 
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.pool.Exec(ctx, query, record.ID, record.UserID, record.ConsentType, record.IsGranted, record.GrantedAt, record.IPAddress)
		if err != nil {
			return err
		}
	}

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
	if r.pool != nil {
		query := `SELECT id, user_id, consent_type, is_granted, granted_at, ip_address FROM consent_records WHERE user_id = $1`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.ConsentRecord
			for rows.Next() {
				var c domain.ConsentRecord
				if err := rows.Scan(&c.ID, &c.UserID, &c.ConsentType, &c.IsGranted, &c.GrantedAt, &c.IPAddress); err == nil {
					list = append(list, c)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.consents[userID], nil
}

func (r *pgxComplianceRepository) CreateDataRequest(ctx context.Context, req *domain.DataRequest) error {
	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	req.RequestedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO data_requests (id, user_id, request_type, status, download_url, requested_at, completed_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7)`
		_, err := r.pool.Exec(ctx, query, req.ID, req.UserID, req.RequestType, req.Status, req.DownloadURL, req.RequestedAt, req.CompletedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.requests[req.ID] = req
	return nil
}

func (r *pgxComplianceRepository) GetUserDataRequests(ctx context.Context, userID uuid.UUID) ([]domain.DataRequest, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, request_type, status, download_url, requested_at, completed_at FROM data_requests WHERE user_id = $1 ORDER BY requested_at DESC`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.DataRequest
			for rows.Next() {
				var req domain.DataRequest
				if err := rows.Scan(&req.ID, &req.UserID, &req.RequestType, &req.Status, &req.DownloadURL, &req.RequestedAt, &req.CompletedAt); err == nil {
					list = append(list, req)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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
	if r.pool != nil {
		query := `UPDATE data_requests SET status = $1, download_url = $2, completed_at = $3 WHERE id = $4`
		_, err := r.pool.Exec(ctx, query, req.Status, req.DownloadURL, req.CompletedAt, req.ID)
		if err != nil {
			return err
		}
	}

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

	if r.pool != nil {
		detailsBytes, _ := json.Marshal(event.Details)
		query := `INSERT INTO audit_events (id, user_id, event_type, resource, details, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.pool.Exec(ctx, query, event.ID, event.UserID, event.EventType, event.Resource, detailsBytes, event.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.events[event.UserID] = append([]domain.AuditEvent{*event}, r.events[event.UserID]...)
	return nil
}

func (r *pgxComplianceRepository) GetUserAuditEvents(ctx context.Context, userID uuid.UUID) ([]domain.AuditEvent, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, event_type, resource, details, created_at FROM audit_events WHERE user_id = $1 ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.AuditEvent
			for rows.Next() {
				var ev domain.AuditEvent
				var detailsBytes []byte
				if err := rows.Scan(&ev.ID, &ev.UserID, &ev.EventType, &ev.Resource, &detailsBytes, &ev.CreatedAt); err == nil {
					_ = json.Unmarshal(detailsBytes, &ev.Details)
					list = append(list, ev)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.events[userID], nil
}
