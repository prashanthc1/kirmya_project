package repository

import (
	"context"
	"errors"
	"time"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// verifiedFor is how long a completed verification stands before it has to be
// renewed. Companies change hands and registrations lapse, so a badge granted
// once should not be permanent.
const verifiedFor = 365 * 24 * time.Hour

// SubmitVerification opens a verification review and stores the documents
// behind it.
//
// It writes 'pending' and nothing else. There is no code path in this module
// that can write 'verified' — that lives in DecideVerification, which is
// reachable only from the platform-admin route.
func (r *ManagementRepository) SubmitVerification(ctx context.Context, companyID, submitterID uuid.UUID, p models.VerificationSubmitPayload) (*models.CompanyVerification, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var current string
	if err := tx.QueryRow(ctx,
		`SELECT verification_status FROM company_profiles WHERE company_id = $1 FOR UPDATE`,
		companyID).Scan(&current); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	status, ok := domain.ParseVerificationStatus(current)
	if !ok {
		status = domain.VerificationNotVerified
	}
	if !status.CanSubmit() {
		// Already pending, or verified and not yet expired.
		return nil, domain.ErrConflict
	}

	id := uuid.New()
	if _, err := tx.Exec(ctx, `
		INSERT INTO company_verifications
			(id, company_id, status, legal_name, registration_number, registration_country, contact_email, submitted_by)
		VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7)`,
		id, companyID, p.LegalName, p.RegistrationNumber, p.RegistrationCountry, p.ContactEmail, submitterID); err != nil {
		if isUniqueViolation(err) {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	for _, doc := range p.Documents {
		if _, err := tx.Exec(ctx, `
			INSERT INTO company_verification_documents
				(id, verification_id, company_id, document_type, file_url, file_name, file_size, mime_type, checksum, uploaded_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULLIF($9, ''), $10)`,
			uuid.New(), id, companyID, doc.DocumentType, doc.FileURL, doc.FileName,
			doc.FileSize, doc.MimeType, doc.Checksum, submitterID); err != nil {
			return nil, err
		}
	}

	if _, err := tx.Exec(ctx,
		`UPDATE company_profiles SET verification_status = 'pending', updated_at = NOW() WHERE company_id = $1`,
		companyID); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetVerification(ctx, companyID, id)
}

// GetVerification loads one verification review with its documents.
func (r *ManagementRepository) GetVerification(ctx context.Context, companyID, verificationID uuid.UUID) (*models.CompanyVerification, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	v, err := r.scanVerification(r.db.QueryRow(ctx, verificationSelect+`
		WHERE v.company_id = $1 AND v.id = $2`, companyID, verificationID))
	if err != nil {
		return nil, err
	}
	docs, err := r.listVerificationDocuments(ctx, companyID, v.ID)
	if err != nil {
		return nil, err
	}
	v.Documents = docs
	return v, nil
}

// LatestVerification returns the company's most recent review, or nil when it
// has never applied. A company that has never applied is not an error state.
func (r *ManagementRepository) LatestVerification(ctx context.Context, companyID uuid.UUID) (*models.CompanyVerification, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	v, err := r.scanVerification(r.db.QueryRow(ctx, verificationSelect+`
		WHERE v.company_id = $1 ORDER BY v.created_at DESC LIMIT 1`, companyID))
	if errors.Is(err, domain.ErrNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	docs, err := r.listVerificationDocuments(ctx, companyID, v.ID)
	if err != nil {
		return nil, err
	}
	v.Documents = docs
	return v, nil
}

const verificationSelect = `
	SELECT v.id, v.company_id, v.status,
	       COALESCE(v.legal_name, ''), COALESCE(v.registration_number, ''),
	       COALESCE(v.registration_country, ''), COALESCE(v.contact_email, ''),
	       v.submitted_by, v.submitted_at, v.reviewed_at,
	       COALESCE(v.rejection_reason, ''), v.expires_at
	FROM company_verifications v`

func (r *ManagementRepository) scanVerification(row rowScanner) (*models.CompanyVerification, error) {
	var v models.CompanyVerification
	var status string
	err := row.Scan(&v.ID, &v.CompanyID, &status,
		&v.LegalName, &v.RegistrationNumber, &v.RegistrationCountry, &v.ContactEmail,
		&v.SubmittedBy, &v.SubmittedAt, &v.ReviewedAt, &v.RejectionReason, &v.ExpiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if parsed, ok := domain.ParseVerificationStatus(status); ok {
		v.Status = parsed
	} else {
		v.Status = domain.VerificationNotVerified
	}
	return &v, nil
}

// listVerificationDocuments returns the documents for a review. The company id
// is in the predicate so a document set cannot be pulled across companies by
// guessing a verification id.
func (r *ManagementRepository) listVerificationDocuments(ctx context.Context, companyID, verificationID uuid.UUID) ([]models.VerificationDocument, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, document_type, file_url, file_name, file_size, mime_type, COALESCE(checksum, ''), created_at
		FROM company_verification_documents
		WHERE company_id = $1 AND verification_id = $2
		ORDER BY created_at ASC`, companyID, verificationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.VerificationDocument{}
	for rows.Next() {
		var d models.VerificationDocument
		if err := rows.Scan(&d.ID, &d.DocumentType, &d.FileURL, &d.FileName,
			&d.FileSize, &d.MimeType, &d.Checksum, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

// DecideVerification records a platform administrator's ruling and moves the
// company's badge state to match.
//
// This is the only place that can write 'verified'. It refuses any status other
// than an administrator decision, and it will not act on a review that is no
// longer pending, so a stale approve click cannot resurrect a closed case.
func (r *ManagementRepository) DecideVerification(ctx context.Context, verificationID, reviewerID uuid.UUID, status domain.VerificationStatus, reason string) (uuid.UUID, error) {
	if r.db == nil {
		return uuid.Nil, ErrNoDatabase
	}
	if !domain.IsAdminDecision(status) {
		return uuid.Nil, domain.ErrValidation
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback(ctx)

	var expiresAt *time.Time
	if status == domain.VerificationVerified {
		expiry := nowUTC().Add(verifiedFor)
		expiresAt = &expiry
	}

	var companyID uuid.UUID
	err = tx.QueryRow(ctx, `
		UPDATE company_verifications
		SET status = $2, reviewed_by = $3, reviewed_at = NOW(),
		    rejection_reason = NULLIF($4, ''), expires_at = $5, updated_at = NOW()
		WHERE id = $1 AND status = 'pending'
		RETURNING company_id`,
		verificationID, string(status), reviewerID, reason, expiresAt).Scan(&companyID)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, domain.ErrNotFound
	}
	if err != nil {
		return uuid.Nil, err
	}

	// $2 is cast explicitly because it is both assigned to a varchar column and
	// compared against a literal; without the cast PostgreSQL deduces two
	// different types for the one parameter and refuses to plan the statement.
	if _, err := tx.Exec(ctx, `
		UPDATE company_profiles
		SET verification_status = $2::text,
		    verified_at = CASE WHEN $2::text = 'verified' THEN NOW() ELSE NULL END,
		    verification_expires_at = $3,
		    updated_at = NOW()
		WHERE company_id = $1`, companyID, string(status), expiresAt); err != nil {
		return uuid.Nil, err
	}

	// The legacy request table from 0011 is kept in step so anything still
	// reading it sees the same answer.
	if _, err := tx.Exec(ctx, `
		UPDATE company_verification_requests SET status = $2
		WHERE company_id = $1 AND status = 'pending'`,
		companyID, map[domain.VerificationStatus]string{
			domain.VerificationVerified: "approved",
			domain.VerificationRejected: "rejected",
		}[status]); err != nil {
		return uuid.Nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, err
	}
	return companyID, nil
}

// ListPendingVerifications is the platform administrator's queue.
func (r *ManagementRepository) ListPendingVerifications(ctx context.Context, page, limit int) ([]models.CompanyVerification, int, error) {
	if r.db == nil {
		return nil, 0, ErrNoDatabase
	}
	_, limit, offset := normalizePage(page, limit)

	var total int
	if err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM company_verifications WHERE status = 'pending'`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(ctx, verificationSelect+`
		WHERE v.status = 'pending' ORDER BY v.submitted_at ASC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := []models.CompanyVerification{}
	for rows.Next() {
		v, err := r.scanVerification(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *v)
	}
	return out, total, rows.Err()
}

// ExpireLapsedVerifications moves verifications past their expiry out of the
// verified state, which also takes the badge off the company page. Without this
// a one-off approval would grant a permanent badge.
func (r *ManagementRepository) ExpireLapsedVerifications(ctx context.Context) (int64, error) {
	if r.db == nil {
		return 0, ErrNoDatabase
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx, `
		UPDATE company_verifications SET status = 'expired', updated_at = NOW()
		WHERE status = 'verified' AND expires_at IS NOT NULL AND expires_at <= NOW()`)
	if err != nil {
		return 0, err
	}
	if _, err := tx.Exec(ctx, `
		UPDATE company_profiles SET verification_status = 'expired', updated_at = NOW()
		WHERE verification_status = 'verified'
		  AND verification_expires_at IS NOT NULL AND verification_expires_at <= NOW()`); err != nil {
		return 0, err
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}
