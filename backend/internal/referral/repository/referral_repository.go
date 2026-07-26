package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/referral/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReferralRepository interface {
	CreateRequest(ctx context.Context, req *domain.ReferralRequest) error
	GetOpenRequests(ctx context.Context) ([]domain.ReferralRequest, error)
	GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.ReferralRequest, error)
	UpdateRequestStatus(ctx context.Context, id uuid.UUID, status string) error

	CreateReferral(ctx context.Context, ref *domain.Referral) error
	GetReferralByID(ctx context.Context, id uuid.UUID) (*domain.Referral, error)
	GetUserReferrals(ctx context.Context, userID uuid.UUID) ([]domain.Referral, error)
	UpdateReferralStatus(ctx context.Context, id uuid.UUID, status string, privacyMasked bool) error

	AddHistory(ctx context.Context, hist *domain.ReferralHistory) error
	GetHistoryByReferral(ctx context.Context, referralID uuid.UUID) ([]domain.ReferralHistory, error)
}

type pgxReferralRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	requests  map[uuid.UUID]*domain.ReferralRequest
	referrals map[uuid.UUID]*domain.Referral
	history   map[uuid.UUID]*domain.ReferralHistory
}

func NewReferralRepository(pool *pgxpool.Pool) ReferralRepository {
	return &pgxReferralRepository{
		pool:      pool,
		requests:  make(map[uuid.UUID]*domain.ReferralRequest),
		referrals: make(map[uuid.UUID]*domain.Referral),
		history:   make(map[uuid.UUID]*domain.ReferralHistory),
	}
}

func (r *pgxReferralRepository) CreateRequest(ctx context.Context, req *domain.ReferralRequest) error {
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

func (r *pgxReferralRepository) GetOpenRequests(ctx context.Context) ([]domain.ReferralRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.ReferralRequest
	for _, req := range r.requests {
		if req.Status == domain.ReqStatusOpen {
			list = append(list, *req)
		}
	}
	return list, nil
}

func (r *pgxReferralRepository) GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.ReferralRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if req, exists := r.requests[id]; exists {
		reqCopy := *req
		return &reqCopy, nil
	}
	return nil, fmt.Errorf("referral request not found: %s", id)
}

func (r *pgxReferralRepository) UpdateRequestStatus(ctx context.Context, id uuid.UUID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if req, exists := r.requests[id]; exists {
		req.Status = status
		req.UpdatedAt = time.Now()
		return nil
	}
	return fmt.Errorf("referral request not found: %s", id)
}

func (r *pgxReferralRepository) CreateReferral(ctx context.Context, ref *domain.Referral) error {
	if ref.ID == uuid.Nil {
		ref.ID = uuid.New()
	}
	ref.CreatedAt = time.Now()
	ref.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.referrals[ref.ID] = ref
	return nil
}

func (r *pgxReferralRepository) GetReferralByID(ctx context.Context, id uuid.UUID) (*domain.Referral, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if ref, exists := r.referrals[id]; exists {
		refCopy := *ref
		var hist []domain.ReferralHistory
		for _, h := range r.history {
			if h.ReferralID == id {
				hist = append(hist, *h)
			}
		}
		refCopy.History = hist
		return &refCopy, nil
	}
	return nil, fmt.Errorf("referral record not found: %s", id)
}

func (r *pgxReferralRepository) GetUserReferrals(ctx context.Context, userID uuid.UUID) ([]domain.Referral, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Referral
	for _, ref := range r.referrals {
		if ref.CandidateID == userID || ref.ReferrerID == userID {
			refCopy := *ref
			var hist []domain.ReferralHistory
			for _, h := range r.history {
				if h.ReferralID == ref.ID {
					hist = append(hist, *h)
				}
			}
			refCopy.History = hist
			list = append(list, refCopy)
		}
	}
	return list, nil
}

func (r *pgxReferralRepository) UpdateReferralStatus(ctx context.Context, id uuid.UUID, status string, privacyMasked bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if ref, exists := r.referrals[id]; exists {
		ref.Status = status
		ref.PrivacyMasked = privacyMasked
		ref.UpdatedAt = time.Now()
		return nil
	}
	return fmt.Errorf("referral record not found: %s", id)
}

func (r *pgxReferralRepository) AddHistory(ctx context.Context, hist *domain.ReferralHistory) error {
	if hist.ID == uuid.Nil {
		hist.ID = uuid.New()
	}
	hist.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.history[hist.ID] = hist
	return nil
}

func (r *pgxReferralRepository) GetHistoryByReferral(ctx context.Context, referralID uuid.UUID) ([]domain.ReferralHistory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.ReferralHistory
	for _, h := range r.history {
		if h.ReferralID == referralID {
			list = append(list, *h)
		}
	}
	return list, nil
}
