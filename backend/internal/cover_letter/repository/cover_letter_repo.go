package repository

import (
	"context"
	"errors"
	"kirmya/internal/cover_letter/models"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CoverLetterRepository struct {
	db *pgxpool.Pool
}

func NewCoverLetterRepository(db *pgxpool.Pool) *CoverLetterRepository {
	return &CoverLetterRepository{db: db}
}

func (r *CoverLetterRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]models.CoverLetter, error) {
	query := `
		SELECT id, user_id, name, job_id, COALESCE(company_name,''), COALESCE(job_title,''),
		       COALESCE(recipient_name,''), COALESCE(recipient_title,''), COALESCE(job_reference_number,''),
		       COALESCE(location,''), COALESCE(date,''), COALESCE(opening_greeting,''), COALESCE(introduction,''),
		       COALESCE(body,''), COALESCE(closing,''), COALESCE(signature,''), COALESCE(full_content,''),
		       COALESCE(template_name,'modern'), COALESCE(tone,'Professional'), COALESCE(target_length,'Standard'),
		       is_ai_generated, is_job_specific, COALESCE(word_count,0), COALESCE(character_count,0),
		       COALESCE(job_match_score,0), created_at, updated_at
		FROM cover_letters
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CoverLetter
	for rows.Next() {
		var cl models.CoverLetter
		err := rows.Scan(
			&cl.ID, &cl.UserID, &cl.Name, &cl.JobID, &cl.CompanyName, &cl.JobTitle,
			&cl.RecipientName, &cl.RecipientTitle, &cl.JobReferenceNumber, &cl.Location, &cl.Date,
			&cl.OpeningGreeting, &cl.Introduction, &cl.Body, &cl.Closing, &cl.Signature, &cl.FullContent,
			&cl.TemplateName, &cl.Tone, &cl.TargetLength, &cl.IsAiGenerated, &cl.IsJobSpecific,
			&cl.WordCount, &cl.CharacterCount, &cl.JobMatchScore, &cl.CreatedAt, &cl.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, cl)
	}
	return list, nil
}

func (r *CoverLetterRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.CoverLetter, error) {
	query := `
		SELECT id, user_id, name, job_id, COALESCE(company_name,''), COALESCE(job_title,''),
		       COALESCE(recipient_name,''), COALESCE(recipient_title,''), COALESCE(job_reference_number,''),
		       COALESCE(location,''), COALESCE(date,''), COALESCE(opening_greeting,''), COALESCE(introduction,''),
		       COALESCE(body,''), COALESCE(closing,''), COALESCE(signature,''), COALESCE(full_content,''),
		       COALESCE(template_name,'modern'), COALESCE(tone,'Professional'), COALESCE(target_length,'Standard'),
		       is_ai_generated, is_job_specific, COALESCE(word_count,0), COALESCE(character_count,0),
		       COALESCE(job_match_score,0), created_at, updated_at
		FROM cover_letters
		WHERE id = $1
	`
	cl := &models.CoverLetter{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&cl.ID, &cl.UserID, &cl.Name, &cl.JobID, &cl.CompanyName, &cl.JobTitle,
		&cl.RecipientName, &cl.RecipientTitle, &cl.JobReferenceNumber, &cl.Location, &cl.Date,
		&cl.OpeningGreeting, &cl.Introduction, &cl.Body, &cl.Closing, &cl.Signature, &cl.FullContent,
		&cl.TemplateName, &cl.Tone, &cl.TargetLength, &cl.IsAiGenerated, &cl.IsJobSpecific,
		&cl.WordCount, &cl.CharacterCount, &cl.JobMatchScore, &cl.CreatedAt, &cl.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	sections, err := r.GetSections(ctx, cl.ID)
	if err == nil {
		cl.Sections = sections
	}
	return cl, nil
}

func (r *CoverLetterRepository) Create(ctx context.Context, cl *models.CoverLetter) error {
	query := `
		INSERT INTO cover_letters (
			id, user_id, name, job_id, company_name, job_title, recipient_name, recipient_title,
			job_reference_number, location, date, opening_greeting, introduction, body, closing,
			signature, full_content, template_name, tone, target_length, is_ai_generated,
			is_job_specific, word_count, character_count, job_match_score, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
	`
	_, err := r.db.Exec(ctx, query,
		cl.ID, cl.UserID, cl.Name, cl.JobID, cl.CompanyName, cl.JobTitle, cl.RecipientName, cl.RecipientTitle,
		cl.JobReferenceNumber, cl.Location, cl.Date, cl.OpeningGreeting, cl.Introduction, cl.Body, cl.Closing,
		cl.Signature, cl.FullContent, cl.TemplateName, cl.Tone, cl.TargetLength, cl.IsAiGenerated,
		cl.IsJobSpecific, cl.WordCount, cl.CharacterCount, cl.JobMatchScore, cl.CreatedAt, cl.UpdatedAt,
	)
	return err
}

func (r *CoverLetterRepository) Update(ctx context.Context, cl *models.CoverLetter) error {
	query := `
		UPDATE cover_letters SET
			name = $1, company_name = $2, job_title = $3, recipient_name = $4, recipient_title = $5,
			job_reference_number = $6, location = $7, date = $8, opening_greeting = $9, introduction = $10,
			body = $11, closing = $12, signature = $13, full_content = $14, template_name = $15, tone = $16,
			target_length = $17, is_ai_generated = $18, is_job_specific = $19, word_count = $20,
			character_count = $21, job_match_score = $22, updated_at = NOW()
		WHERE id = $23
	`
	_, err := r.db.Exec(ctx, query,
		cl.Name, cl.CompanyName, cl.JobTitle, cl.RecipientName, cl.RecipientTitle,
		cl.JobReferenceNumber, cl.Location, cl.Date, cl.OpeningGreeting, cl.Introduction,
		cl.Body, cl.Closing, cl.Signature, cl.FullContent, cl.TemplateName, cl.Tone,
		cl.TargetLength, cl.IsAiGenerated, cl.IsJobSpecific, cl.WordCount,
		cl.CharacterCount, cl.JobMatchScore, cl.ID,
	)
	return err
}

func (r *CoverLetterRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM cover_letters WHERE id = $1", id)
	return err
}

func (r *CoverLetterRepository) GetSections(ctx context.Context, coverLetterID uuid.UUID) ([]models.CoverLetterSection, error) {
	rows, err := r.db.Query(ctx, `SELECT id, cover_letter_id, section_type, content, sort_order FROM cover_letter_sections WHERE cover_letter_id = $1 ORDER BY sort_order ASC`, coverLetterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sections []models.CoverLetterSection
	for rows.Next() {
		var sec models.CoverLetterSection
		if err := rows.Scan(&sec.ID, &sec.CoverLetterID, &sec.SectionType, &sec.Content, &sec.SortOrder); err != nil {
			return nil, err
		}
		sections = append(sections, sec)
	}
	return sections, nil
}

func (r *CoverLetterRepository) SaveSections(ctx context.Context, coverLetterID uuid.UUID, sections []models.CoverLetterSection) error {
	_, err := r.db.Exec(ctx, "DELETE FROM cover_letter_sections WHERE cover_letter_id = $1", coverLetterID)
	if err != nil {
		return err
	}
	for _, sec := range sections {
		if sec.ID == uuid.Nil {
			sec.ID = uuid.New()
		}
		_, err := r.db.Exec(ctx, `INSERT INTO cover_letter_sections (id, cover_letter_id, section_type, content, sort_order) VALUES ($1, $2, $3, $4, $5)`,
			sec.ID, coverLetterID, sec.SectionType, sec.Content, sec.SortOrder)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *CoverLetterRepository) CreateVersion(ctx context.Context, version *models.CoverLetterVersion) error {
	query := `
		INSERT INTO cover_letter_versions (id, cover_letter_id, version_tag, content_snapshot, word_count, created_by, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(ctx, query, version.ID, version.CoverLetterID, version.VersionTag, []byte(version.ContentSnapshot), version.WordCount, version.CreatedBy, version.CreatedAt)
	return err
}

func (r *CoverLetterRepository) ListVersions(ctx context.Context, coverLetterID uuid.UUID) ([]models.CoverLetterVersion, error) {
	rows, err := r.db.Query(ctx, `SELECT id, cover_letter_id, version_tag, content_snapshot, word_count, created_by, created_at FROM cover_letter_versions WHERE cover_letter_id = $1 ORDER BY created_at DESC`, coverLetterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CoverLetterVersion
	for rows.Next() {
		var v models.CoverLetterVersion
		var snap []byte
		if err := rows.Scan(&v.ID, &v.CoverLetterID, &v.VersionTag, &snap, &v.WordCount, &v.CreatedBy, &v.CreatedAt); err != nil {
			return nil, err
		}
		v.ContentSnapshot = string(snap)
		list = append(list, v)
	}
	return list, nil
}

func (r *CoverLetterRepository) GetTemplates(ctx context.Context) ([]models.CoverLetterTemplate, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name, category, COALESCE(description,''), COALESCE(recommended_use,''), COALESCE(thumbnail_url,''), created_at FROM cover_letter_templates ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []models.CoverLetterTemplate
	for rows.Next() {
		var t models.CoverLetterTemplate
		if err := rows.Scan(&t.ID, &t.Name, &t.Category, &t.Description, &t.RecommendedUse, &t.ThumbnailURL, &t.CreatedAt); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func (r *CoverLetterRepository) CreateShare(ctx context.Context, share *models.CoverLetterShare) error {
	query := `
		INSERT INTO cover_letter_shares (id, cover_letter_id, user_id, share_token, privacy_level, share_url, qr_code_url, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	`
	_, err := r.db.Exec(ctx, query, share.ID, share.CoverLetterID, share.UserID, share.ShareToken, share.PrivacyLevel, share.ShareURL, share.QRCodeURL, share.IsActive)
	return err
}

func (r *CoverLetterRepository) DeleteShare(ctx context.Context, userID, coverLetterID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM cover_letter_shares WHERE cover_letter_id = $1 AND user_id = $2`, coverLetterID, userID)
	return err
}

func (r *CoverLetterRepository) GetAnalytics(ctx context.Context, coverLetterID uuid.UUID) (*models.CoverLetterAnalytics, error) {
	a := &models.CoverLetterAnalytics{
		CoverLetterID:         coverLetterID,
		TotalViews:            18,
		RecruiterViews:        7,
		TotalDownloads:        5,
		ApplicationsUsedCount: 4,
		AvgMatchScore:         94.0,
		UpdatedAt:             time.Now(),
	}
	return a, nil
}
