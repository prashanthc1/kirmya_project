package repository

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/verification/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

type postgresVerificationRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	// In-memory fallback for offline test suites without active PostgreSQL instance
	requests  map[uuid.UUID]*domain.VerificationRequest
	documents map[uuid.UUID]*domain.VerificationDocument
	statuses  map[uuid.UUID]*domain.VerificationStatus
}

func NewVerificationRepository(pool *pgxpool.Pool) VerificationRepository {
	return &postgresVerificationRepository{
		pool:      pool,
		requests:  make(map[uuid.UUID]*domain.VerificationRequest),
		documents: make(map[uuid.UUID]*domain.VerificationDocument),
		statuses:  make(map[uuid.UUID]*domain.VerificationStatus),
	}
}

func (r *postgresVerificationRepository) CreateRequest(ctx context.Context, req *domain.VerificationRequest) error {
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
		INSERT INTO verification_requests (
			id, user_id, verification_type, title, organization_name,
			credential_id, verification_url, work_email, status, reviewer_notes,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := r.pool.Exec(ctx, query,
		req.ID, req.UserID, req.VerificationType, req.Title, req.OrganizationName,
		req.CredentialID, req.VerificationURL, req.WorkEmail, req.Status, req.ReviewerNotes,
		req.CreatedAt, req.UpdatedAt,
	)
	return err
}

func (r *postgresVerificationRepository) GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.VerificationRequest, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, user_id, verification_type, title, organization_name,
		       credential_id, verification_url, work_email, status, reviewer_notes,
		       created_at, updated_at
		FROM verification_requests
		WHERE id = $1
	`
	var req domain.VerificationRequest
	var orgName, credID, verURL, workEmail, reviewerNotes *string
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&req.ID, &req.UserID, &req.VerificationType, &req.Title, &orgName,
		&credID, &verURL, &workEmail, &req.Status, &reviewerNotes,
		&req.CreatedAt, &req.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("verification request not found: %s", id)
		}
		return nil, err
	}
	if orgName != nil {
		req.OrganizationName = *orgName
	}
	if credID != nil {
		req.CredentialID = *credID
	}
	if verURL != nil {
		req.VerificationURL = *verURL
	}
	if workEmail != nil {
		req.WorkEmail = *workEmail
	}
	if reviewerNotes != nil {
		req.ReviewerNotes = *reviewerNotes
	}

	docs, err := r.GetDocumentsByRequest(ctx, id)
	if err == nil {
		req.Documents = docs
	}

	return &req, nil
}

func (r *postgresVerificationRepository) GetUserRequests(ctx context.Context, userID uuid.UUID) ([]domain.VerificationRequest, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, user_id, verification_type, title, organization_name,
		       credential_id, verification_url, work_email, status, reviewer_notes,
		       created_at, updated_at
		FROM verification_requests
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.VerificationRequest
	for rows.Next() {
		var req domain.VerificationRequest
		var orgName, credID, verURL, workEmail, reviewerNotes *string
		if err := rows.Scan(
			&req.ID, &req.UserID, &req.VerificationType, &req.Title, &orgName,
			&credID, &verURL, &workEmail, &req.Status, &reviewerNotes,
			&req.CreatedAt, &req.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if orgName != nil {
			req.OrganizationName = *orgName
		}
		if credID != nil {
			req.CredentialID = *credID
		}
		if verURL != nil {
			req.VerificationURL = *verURL
		}
		if workEmail != nil {
			req.WorkEmail = *workEmail
		}
		if reviewerNotes != nil {
			req.ReviewerNotes = *reviewerNotes
		}

		docs, _ := r.GetDocumentsByRequest(ctx, req.ID)
		req.Documents = docs
		list = append(list, req)
	}
	return list, rows.Err()
}

func (r *postgresVerificationRepository) UpdateRequestStatus(ctx context.Context, id uuid.UUID, status, notes string) error {
	now := time.Now()
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		if req, exists := r.requests[id]; exists {
			req.Status = status
			req.ReviewerNotes = notes
			req.UpdatedAt = now
			return nil
		}
		return fmt.Errorf("verification request not found: %s", id)
	}

	query := `
		UPDATE verification_requests
		SET status = $1, reviewer_notes = $2, updated_at = $3
		WHERE id = $4
	`
	tag, err := r.pool.Exec(ctx, query, status, notes, now, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("verification request not found: %s", id)
	}
	return nil
}

func (r *postgresVerificationRepository) AddDocument(ctx context.Context, doc *domain.VerificationDocument) error {
	if doc.ID == uuid.Nil {
		doc.ID = uuid.New()
	}
	now := time.Now()
	doc.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.documents[doc.ID] = doc
		return nil
	}

	query := `
		INSERT INTO verification_documents (
			id, request_id, user_id, document_type, file_name, file_url, is_sensitive, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.pool.Exec(ctx, query,
		doc.ID, doc.RequestID, doc.UserID, doc.DocumentType, doc.FileName, doc.FileURL, doc.IsSensitive, doc.CreatedAt,
	)
	return err
}

func (r *postgresVerificationRepository) GetDocumentsByRequest(ctx context.Context, requestID uuid.UUID) ([]domain.VerificationDocument, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, request_id, user_id, document_type, file_name, file_url, is_sensitive, created_at
		FROM verification_documents
		WHERE request_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, requestID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.VerificationDocument
	for rows.Next() {
		var doc domain.VerificationDocument
		if err := rows.Scan(
			&doc.ID, &doc.RequestID, &doc.UserID, &doc.DocumentType, &doc.FileName, &doc.FileURL, &doc.IsSensitive, &doc.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, doc)
	}
	return list, rows.Err()
}

func (r *postgresVerificationRepository) GetOrCreateStatus(ctx context.Context, userID uuid.UUID) (*domain.VerificationStatus, error) {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		if s, exists := r.statuses[userID]; exists {
			sCopy := *s
			return &sCopy, nil
		}
		newStatus := &domain.VerificationStatus{
			ID:                     uuid.New(),
			UserID:                 userID,
			TrustScore:             20,
			BadgeLevel:             "Basic",
			EmailVerified:          false,
			EmploymentVerified:     false,
			SkillsVerified:         false,
			CertificationsVerified: false,
			PrivacySetting:         "recruiters_only",
			HideSensitiveDocs:      true,
			CreatedAt:              time.Now(),
			UpdatedAt:              time.Now(),
		}
		r.statuses[userID] = newStatus
		sCopy := *newStatus
		return &sCopy, nil
	}

	query := `
		SELECT id, user_id, trust_score, badge_level, email_verified, employment_verified,
		       skills_verified, certifications_verified, privacy_setting, hide_sensitive_docs,
		       created_at, updated_at
		FROM verification_status
		WHERE user_id = $1
	`
	var s domain.VerificationStatus
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&s.ID, &s.UserID, &s.TrustScore, &s.BadgeLevel, &s.EmailVerified, &s.EmploymentVerified,
		&s.SkillsVerified, &s.CertificationsVerified, &s.PrivacySetting, &s.HideSensitiveDocs,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err == nil {
		return &s, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	// Insert new default status
	now := time.Now()
	newStatus := domain.VerificationStatus{
		ID:                     uuid.New(),
		UserID:                 userID,
		TrustScore:             20,
		BadgeLevel:             "Basic",
		EmailVerified:          false,
		EmploymentVerified:     false,
		SkillsVerified:         false,
		CertificationsVerified: false,
		PrivacySetting:         "recruiters_only",
		HideSensitiveDocs:      true,
		CreatedAt:              now,
		UpdatedAt:              now,
	}

	insertQuery := `
		INSERT INTO verification_status (
			id, user_id, trust_score, badge_level, email_verified, employment_verified,
			skills_verified, certifications_verified, privacy_setting, hide_sensitive_docs,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (user_id) DO UPDATE SET updated_at = EXCLUDED.updated_at
		RETURNING id, user_id, trust_score, badge_level, email_verified, employment_verified,
		          skills_verified, certifications_verified, privacy_setting, hide_sensitive_docs,
		          created_at, updated_at
	`
	err = r.pool.QueryRow(ctx, insertQuery,
		newStatus.ID, newStatus.UserID, newStatus.TrustScore, newStatus.BadgeLevel, newStatus.EmailVerified, newStatus.EmploymentVerified,
		newStatus.SkillsVerified, newStatus.CertificationsVerified, newStatus.PrivacySetting, newStatus.HideSensitiveDocs,
		newStatus.CreatedAt, newStatus.UpdatedAt,
	).Scan(
		&s.ID, &s.UserID, &s.TrustScore, &s.BadgeLevel, &s.EmailVerified, &s.EmploymentVerified,
		&s.SkillsVerified, &s.CertificationsVerified, &s.PrivacySetting, &s.HideSensitiveDocs,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *postgresVerificationRepository) UpdatePrivacy(ctx context.Context, userID uuid.UUID, privacySetting string, hideDocs bool) (*domain.VerificationStatus, error) {
	st, err := r.GetOrCreateStatus(ctx, userID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	st.PrivacySetting = privacySetting
	st.HideSensitiveDocs = hideDocs
	st.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.statuses[userID] = st
		sCopy := *st
		return &sCopy, nil
	}

	query := `
		UPDATE verification_status
		SET privacy_setting = $1, hide_sensitive_docs = $2, updated_at = $3
		WHERE user_id = $4
		RETURNING id, user_id, trust_score, badge_level, email_verified, employment_verified,
		          skills_verified, certifications_verified, privacy_setting, hide_sensitive_docs,
		          created_at, updated_at
	`
	var s domain.VerificationStatus
	err = r.pool.QueryRow(ctx, query, privacySetting, hideDocs, now, userID).Scan(
		&s.ID, &s.UserID, &s.TrustScore, &s.BadgeLevel, &s.EmailVerified, &s.EmploymentVerified,
		&s.SkillsVerified, &s.CertificationsVerified, &s.PrivacySetting, &s.HideSensitiveDocs,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *postgresVerificationRepository) UpdateTrustScore(ctx context.Context, status *domain.VerificationStatus) error {
	status.UpdatedAt = time.Now()

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.statuses[status.UserID] = status
		return nil
	}

	query := `
		UPDATE verification_status
		SET trust_score = $1, badge_level = $2, email_verified = $3,
		    employment_verified = $4, skills_verified = $5, certifications_verified = $6,
		    updated_at = $7
		WHERE user_id = $8
	`
	_, err := r.pool.Exec(ctx, query,
		status.TrustScore, status.BadgeLevel, status.EmailVerified,
		status.EmploymentVerified, status.SkillsVerified, status.CertificationsVerified,
		status.UpdatedAt, status.UserID,
	)
	return err
}
