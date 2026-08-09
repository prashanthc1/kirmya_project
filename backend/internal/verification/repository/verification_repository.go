package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/shared/persistence"
	"kirmya/internal/verification/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type VerificationRepository interface {
	CreateRequest(ctx context.Context, req *domain.VerificationRequest) error
	GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.VerificationRequest, error)
	GetUserRequests(ctx context.Context, userID uuid.UUID) ([]domain.VerificationRequest, error)
	UpdateRequestStatus(ctx context.Context, id uuid.UUID, status, notes string) error

	AddDocument(ctx context.Context, doc *domain.VerificationDocument) error
	GetDocumentsByRequest(ctx context.Context, requestID uuid.UUID) ([]domain.VerificationDocument, error)

	GetOrCreateStatus(ctx context.Context, userID uuid.UUID) (*domain.VerificationStatus, error)
	UpdatePrivacy(ctx context.Context, userID uuid.UUID, privacySetting string, hideDocs bool) (*domain.VerificationStatus, error)
	UpdateTrustScore(ctx context.Context, status *domain.VerificationStatus) error
}

// memoryVerificationRepository satisfies VerificationRepository entirely from process
// memory. It accepts the pool so a SQL implementation can take its place
// without changing any caller, but it never queries it: the data lives and
// dies with this process. Registered in internal/shared/persistence.
type memoryVerificationRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	requests  map[uuid.UUID]*domain.VerificationRequest
	documents map[uuid.UUID]*domain.VerificationDocument
	statuses  map[uuid.UUID]*domain.VerificationStatus
}

func NewVerificationRepository(pool *pgxpool.Pool) VerificationRepository {
	persistence.RegisterEphemeral(persistence.Ephemeral{
		Module:      "verification",
		Data:        "verification requests, document records and verification status",
		Consequence: "verified users show as unverified again and pending reviews are lost",
	})

	return &memoryVerificationRepository{
		pool:      pool,
		requests:  make(map[uuid.UUID]*domain.VerificationRequest),
		documents: make(map[uuid.UUID]*domain.VerificationDocument),
		statuses:  make(map[uuid.UUID]*domain.VerificationStatus),
	}
}

func (r *memoryVerificationRepository) CreateRequest(ctx context.Context, req *domain.VerificationRequest) error {
	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.requests[req.ID] = req
	return nil
}

func (r *memoryVerificationRepository) GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.VerificationRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if req, exists := r.requests[id]; exists {
		reqCopy := *req
		var docs []domain.VerificationDocument
		for _, doc := range r.documents {
			if doc.RequestID == id {
				docs = append(docs, *doc)
			}
		}
		reqCopy.Documents = docs
		return &reqCopy, nil
	}
	return nil, fmt.Errorf("verification request not found: %s", id)
}

func (r *memoryVerificationRepository) GetUserRequests(ctx context.Context, userID uuid.UUID) ([]domain.VerificationRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.VerificationRequest
	for _, req := range r.requests {
		if req.UserID == userID {
			reqCopy := *req
			var docs []domain.VerificationDocument
			for _, doc := range r.documents {
				if doc.RequestID == req.ID {
					docs = append(docs, *doc)
				}
			}
			reqCopy.Documents = docs
			list = append(list, reqCopy)
		}
	}
	return list, nil
}

func (r *memoryVerificationRepository) UpdateRequestStatus(ctx context.Context, id uuid.UUID, status, notes string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if req, exists := r.requests[id]; exists {
		req.Status = status
		req.ReviewerNotes = notes
		req.UpdatedAt = time.Now()
		return nil
	}
	return fmt.Errorf("request not found: %s", id)
}

func (r *memoryVerificationRepository) AddDocument(ctx context.Context, doc *domain.VerificationDocument) error {
	if doc.ID == uuid.Nil {
		doc.ID = uuid.New()
	}
	doc.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.documents[doc.ID] = doc
	return nil
}

func (r *memoryVerificationRepository) GetDocumentsByRequest(ctx context.Context, requestID uuid.UUID) ([]domain.VerificationDocument, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.VerificationDocument
	for _, doc := range r.documents {
		if doc.RequestID == requestID {
			list = append(list, *doc)
		}
	}
	return list, nil
}

func (r *memoryVerificationRepository) GetOrCreateStatus(ctx context.Context, userID uuid.UUID) (*domain.VerificationStatus, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, st := range r.statuses {
		if st.UserID == userID {
			return st, nil
		}
	}

	newStatus := &domain.VerificationStatus{
		ID:                     uuid.New(),
		UserID:                 userID,
		TrustScore:             40,
		BadgeLevel:             "Basic",
		EmailVerified:          false,
		EmploymentVerified:     false,
		SkillsVerified:         false,
		CertificationsVerified: false,
		PrivacySetting:         domain.PrivacyRecruitersOnly,
		HideSensitiveDocs:      true,
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}
	r.statuses[newStatus.ID] = newStatus
	return newStatus, nil
}

func (r *memoryVerificationRepository) UpdatePrivacy(ctx context.Context, userID uuid.UUID, privacySetting string, hideDocs bool) (*domain.VerificationStatus, error) {
	st, err := r.GetOrCreateStatus(ctx, userID)
	if err != nil {
		return nil, err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	st.PrivacySetting = privacySetting
	st.HideSensitiveDocs = hideDocs
	st.UpdatedAt = time.Now()
	return st, nil
}

func (r *memoryVerificationRepository) UpdateTrustScore(ctx context.Context, status *domain.VerificationStatus) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	status.UpdatedAt = time.Now()
	r.statuses[status.ID] = status
	return nil
}
