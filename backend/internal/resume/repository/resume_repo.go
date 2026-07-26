package repository

import (
	"context"
	"errors"
	"kirmya/internal/resume/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ResumeRepository struct {
	db *pgxpool.Pool
}

func NewResumeRepository(db *pgxpool.Pool) *ResumeRepository {
	return &ResumeRepository{db: db}
}

func (r *ResumeRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]models.Resume, error) {
	rows, err := r.db.Query(ctx, `SELECT id, user_id, title, template_name, is_default, ats_score, ai_suggestions, created_at, updated_at 
	                             FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Resume
	for rows.Next() {
		var res models.Resume
		var aiSug []byte
		err := rows.Scan(
			&res.ID, &res.UserID, &res.Title, &res.TemplateName, &res.IsDefault,
			&res.AtsScore, &aiSug, &res.CreatedAt, &res.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		res.AiSuggestions = string(aiSug)
		list = append(list, res)
	}
	return list, nil
}

func (r *ResumeRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Resume, error) {
	res := &models.Resume{}
	var aiSug []byte
	err := r.db.QueryRow(ctx, `SELECT id, user_id, title, template_name, is_default, ats_score, ai_suggestions, created_at, updated_at 
	                          FROM resumes WHERE id = $1`, id).Scan(
		&res.ID, &res.UserID, &res.Title, &res.TemplateName, &res.IsDefault,
		&res.AtsScore, &aiSug, &res.CreatedAt, &res.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	res.AiSuggestions = string(aiSug)

	// Fetch sections
	sections, err := r.GetSections(ctx, res.ID)
	if err == nil {
		res.Sections = sections
	}

	return res, nil
}

func (r *ResumeRepository) Create(ctx context.Context, res *models.Resume) error {
	_, err := r.db.Exec(ctx, `INSERT INTO resumes (id, user_id, title, template_name, is_default, ats_score, ai_suggestions, created_at, updated_at) 
	                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		res.ID, res.UserID, res.Title, res.TemplateName, res.IsDefault, res.AtsScore, []byte(res.AiSuggestions), res.CreatedAt, res.UpdatedAt)
	return err
}

func (r *ResumeRepository) Update(ctx context.Context, res *models.Resume) error {
	_, err := r.db.Exec(ctx, `UPDATE resumes SET title = $1, template_name = $2, is_default = $3, ats_score = $4, ai_suggestions = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
		res.Title, res.TemplateName, res.IsDefault, res.AtsScore, []byte(res.AiSuggestions), res.ID)
	return err
}

func (r *ResumeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM resumes WHERE id = $1", id)
	return err
}

func (r *ResumeRepository) ClearDefault(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, "UPDATE resumes SET is_default = FALSE WHERE user_id = $1", userID)
	return err
}

func (r *ResumeRepository) SetDefault(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "UPDATE resumes SET is_default = TRUE WHERE id = $1", id)
	return err
}

// Section sub-resources
func (r *ResumeRepository) GetSections(ctx context.Context, resumeID uuid.UUID) ([]models.ResumeSection, error) {
	rows, err := r.db.Query(ctx, "SELECT id, resume_id, section_type, content, sort_order FROM resume_sections WHERE resume_id = $1 ORDER BY sort_order ASC", resumeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sections []models.ResumeSection
	for rows.Next() {
		var s models.ResumeSection
		var contentBytes []byte
		if err := rows.Scan(&s.ID, &s.ResumeID, &s.SectionType, &contentBytes, &s.SortOrder); err != nil {
			return nil, err
		}
		s.Content = string(contentBytes)
		sections = append(sections, s)
	}
	return sections, nil
}

func (r *ResumeRepository) CreateSection(ctx context.Context, s *models.ResumeSection) error {
	_, err := r.db.Exec(ctx, "INSERT INTO resume_sections (id, resume_id, section_type, content, sort_order) VALUES ($1, $2, $3, $4, $5)",
		s.ID, s.ResumeID, s.SectionType, []byte(s.Content), s.SortOrder)
	return err
}

func (r *ResumeRepository) ClearSections(ctx context.Context, resumeID uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM resume_sections WHERE resume_id = $1", resumeID)
	return err
}

// Version management
func (r *ResumeRepository) SaveVersion(ctx context.Context, v *models.ResumeVersion) error {
	_, err := r.db.Exec(ctx, `INSERT INTO resume_versions (id, resume_id, version_tag, content_snapshot, ats_score, ai_suggestions, created_at) 
	                          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		v.ID, v.ResumeID, v.VersionTag, []byte(v.ContentSnapshot), v.AtsScore, []byte(v.AiSuggestions), v.CreatedAt)
	return err
}

func (r *ResumeRepository) ListVersions(ctx context.Context, resumeID uuid.UUID) ([]models.ResumeVersion, error) {
	rows, err := r.db.Query(ctx, `SELECT id, resume_id, version_tag, content_snapshot, ats_score, ai_suggestions, created_at 
	                             FROM resume_versions WHERE resume_id = $1 ORDER BY created_at DESC`, resumeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ResumeVersion
	for rows.Next() {
		var v models.ResumeVersion
		var snap []byte
		var aiSug []byte
		err := rows.Scan(&v.ID, &v.ResumeID, &v.VersionTag, &snap, &v.AtsScore, &aiSug, &v.CreatedAt)
		if err != nil {
			return nil, err
		}
		v.ContentSnapshot = string(snap)
		v.AiSuggestions = string(aiSug)
		list = append(list, v)
	}
	return list, nil
}
