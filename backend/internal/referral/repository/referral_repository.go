package repository

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/referral/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

type postgresReferralRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	requests  map[uuid.UUID]*domain.ReferralRequest
	referrals map[uuid.UUID]*domain.Referral
	history   map[uuid.UUID]*domain.ReferralHistory
}

func NewReferralRepository(pool *pgxpool.Pool) ReferralRepository {
	return &postgresReferralRepository{
		pool:      pool,
		requests:  make(map[uuid.UUID]*domain.ReferralRequest),
		referrals: make(map[uuid.UUID]*domain.Referral),
		history:   make(map[uuid.UUID]*domain.ReferralHistory),
	}
}

func (r *postgresReferralRepository) CreateRequest(ctx context.Context, req *domain.ReferralRequest) error {
	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	now := time.Now()
	req.CreatedAt = now
	req.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.requests[req.ID] = req
		return nil
	}

	query := `
		INSERT INTO referral_requests (
			id, candidate_id, candidate_name, company_name, job_title,
			target_job_url, resume_link, message_to_referrer, status,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.pool.Exec(ctx, query,
		req.ID, req.CandidateID, req.CandidateName, req.CompanyName, req.JobTitle,
		req.TargetJobURL, req.ResumeLink, req.MessageToReferrer, req.Status,
		req.CreatedAt, req.UpdatedAt,
	)
	return err
}

func (r *postgresReferralRepository) GetOpenRequests(ctx context.Context) ([]domain.ReferralRequest, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, candidate_id, candidate_name, company_name, job_title,
		       target_job_url, resume_link, message_to_referrer, status,
		       created_at, updated_at
		FROM referral_requests
		WHERE status = 'open'
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.ReferralRequest
	for rows.Next() {
		var req domain.ReferralRequest
		var targetJobURL, resumeLink *string
		if err := rows.Scan(
			&req.ID, &req.CandidateID, &req.CandidateName, &req.CompanyName, &req.JobTitle,
			&targetJobURL, &resumeLink, &req.MessageToReferrer, &req.Status,
			&req.CreatedAt, &req.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if targetJobURL != nil {
			req.TargetJobURL = *targetJobURL
		}
		if resumeLink != nil {
			req.ResumeLink = *resumeLink
		}
		list = append(list, req)
	}
	return list, rows.Err()
}

func (r *postgresReferralRepository) GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.ReferralRequest, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if req, exists := r.requests[id]; exists {
			reqCopy := *req
			return &reqCopy, nil
		}
		return nil, fmt.Errorf("referral request not found: %s", id)
	}

	query := `
		SELECT id, candidate_id, candidate_name, company_name, job_title,
		       target_job_url, resume_link, message_to_referrer, status,
		       created_at, updated_at
		FROM referral_requests
		WHERE id = $1
	`
	var req domain.ReferralRequest
	var targetJobURL, resumeLink *string
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&req.ID, &req.CandidateID, &req.CandidateName, &req.CompanyName, &req.JobTitle,
		&targetJobURL, &resumeLink, &req.MessageToReferrer, &req.Status,
		&req.CreatedAt, &req.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("referral request not found: %s", id)
		}
		return nil, err
	}
	if targetJobURL != nil {
		req.TargetJobURL = *targetJobURL
	}
	if resumeLink != nil {
		req.ResumeLink = *resumeLink
	}
	return &req, nil
}

func (r *postgresReferralRepository) UpdateRequestStatus(ctx context.Context, id uuid.UUID, status string) error {
	now := time.Now()
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		if req, exists := r.requests[id]; exists {
			req.Status = status
			req.UpdatedAt = now
			return nil
		}
		return fmt.Errorf("referral request not found: %s", id)
	}

	query := `
		UPDATE referral_requests
		SET status = $1, updated_at = $2
		WHERE id = $3
	`
	tag, err := r.pool.Exec(ctx, query, status, now, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("referral request not found: %s", id)
	}
	return nil
}

func (r *postgresReferralRepository) CreateReferral(ctx context.Context, ref *domain.Referral) error {
	if ref.ID == uuid.Nil {
		ref.ID = uuid.New()
	}
	now := time.Now()
	ref.CreatedAt = now
	ref.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.referrals[ref.ID] = ref
		return nil
	}

	query := `
		INSERT INTO referrals (
			id, request_id, candidate_id, candidate_name, referrer_id,
			referrer_name, referrer_company, referrer_job_title, referrer_email,
			status, privacy_masked, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`
	_, err := r.pool.Exec(ctx, query,
		ref.ID, ref.RequestID, ref.CandidateID, ref.CandidateName, ref.ReferrerID,
		ref.ReferrerName, ref.ReferrerCompany, ref.ReferrerJobTitle, ref.ReferrerEmail,
		ref.Status, ref.PrivacyMasked, ref.CreatedAt, ref.UpdatedAt,
	)
	return err
}

func (r *postgresReferralRepository) GetReferralByID(ctx context.Context, id uuid.UUID) (*domain.Referral, error) {
	if r.pool == nil {
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
		return nil, fmt.Errorf("referral not found: %s", id)
	}

	query := `
		SELECT id, request_id, candidate_id, candidate_name, referrer_id,
		       referrer_name, referrer_company, referrer_job_title, referrer_email,
		       status, privacy_masked, created_at, updated_at
		FROM referrals
		WHERE id = $1
	`
	var ref domain.Referral
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&ref.ID, &ref.RequestID, &ref.CandidateID, &ref.CandidateName, &ref.ReferrerID,
		&ref.ReferrerName, &ref.ReferrerCompany, &ref.ReferrerJobTitle, &ref.ReferrerEmail,
		&ref.Status, &ref.PrivacyMasked, &ref.CreatedAt, &ref.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("referral not found: %s", id)
		}
		return nil, err
	}

	history, err := r.GetHistoryByReferral(ctx, id)
	if err == nil {
		ref.History = history
	}
	return &ref, nil
}

func (r *postgresReferralRepository) GetUserReferrals(ctx context.Context, userID uuid.UUID) ([]domain.Referral, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, request_id, candidate_id, candidate_name, referrer_id,
		       referrer_name, referrer_company, referrer_job_title, referrer_email,
		       status, privacy_masked, created_at, updated_at
		FROM referrals
		WHERE candidate_id = $1 OR referrer_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.Referral
	for rows.Next() {
		var ref domain.Referral
		if err := rows.Scan(
			&ref.ID, &ref.RequestID, &ref.CandidateID, &ref.CandidateName, &ref.ReferrerID,
			&ref.ReferrerName, &ref.ReferrerCompany, &ref.ReferrerJobTitle, &ref.ReferrerEmail,
			&ref.Status, &ref.PrivacyMasked, &ref.CreatedAt, &ref.UpdatedAt,
		); err != nil {
			return nil, err
		}
		history, _ := r.GetHistoryByReferral(ctx, ref.ID)
		ref.History = history
		list = append(list, ref)
	}
	return list, rows.Err()
}

func (r *postgresReferralRepository) UpdateReferralStatus(ctx context.Context, id uuid.UUID, status string, privacyMasked bool) error {
	now := time.Now()
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		if ref, exists := r.referrals[id]; exists {
			ref.Status = status
			ref.PrivacyMasked = privacyMasked
			ref.UpdatedAt = now
			return nil
		}
		return fmt.Errorf("referral not found: %s", id)
	}

	query := `
		UPDATE referrals
		SET status = $1, privacy_masked = $2, updated_at = $3
		WHERE id = $4
	`
	tag, err := r.pool.Exec(ctx, query, status, privacyMasked, now, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("referral not found: %s", id)
	}
	return nil
}

func (r *postgresReferralRepository) AddHistory(ctx context.Context, hist *domain.ReferralHistory) error {
	if hist.ID == uuid.Nil {
		hist.ID = uuid.New()
	}
	now := time.Now()
	hist.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.history[hist.ID] = hist
		return nil
	}

	query := `
		INSERT INTO referral_history (
			id, referral_id, actor_id, previous_status, new_status, notes, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.pool.Exec(ctx, query,
		hist.ID, hist.ReferralID, hist.ActorID, hist.PreviousStatus, hist.NewStatus, hist.Notes, hist.CreatedAt,
	)
	return err
}

func (r *postgresReferralRepository) GetHistoryByReferral(ctx context.Context, referralID uuid.UUID) ([]domain.ReferralHistory, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, referral_id, actor_id, previous_status, new_status, notes, created_at
		FROM referral_history
		WHERE referral_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, referralID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.ReferralHistory
	for rows.Next() {
		var h domain.ReferralHistory
		var prevStatus, notes *string
		if err := rows.Scan(
			&h.ID, &h.ReferralID, &h.ActorID, &prevStatus, &h.NewStatus, &notes, &h.CreatedAt,
		); err != nil {
			return nil, err
		}
		if prevStatus != nil {
			h.PreviousStatus = *prevStatus
		}
		if notes != nil {
			h.Notes = *notes
		}
		list = append(list, h)
	}
	return list, rows.Err()
}
