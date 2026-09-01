package repository

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/resume_analysis/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ResumeAnalysisRepository interface {
	SaveAnalysis(ctx context.Context, analysis *domain.ResumeAnalysis) error
	GetAnalysisByID(ctx context.Context, id uuid.UUID) (*domain.ResumeAnalysis, error)
	GetUserAnalysisHistory(ctx context.Context, userID uuid.UUID) ([]domain.ResumeAnalysis, error)
}

type postgresResumeAnalysisRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	analyses     map[uuid.UUID]*domain.ResumeAnalysis
	scores       map[uuid.UUID]*domain.ResumeScores
	improvements map[uuid.UUID]*domain.ImprovementHistory
}

func NewResumeAnalysisRepository(pool *pgxpool.Pool) ResumeAnalysisRepository {
	return &postgresResumeAnalysisRepository{
		pool:         pool,
		analyses:     make(map[uuid.UUID]*domain.ResumeAnalysis),
		scores:       make(map[uuid.UUID]*domain.ResumeScores),
		improvements: make(map[uuid.UUID]*domain.ImprovementHistory),
	}
}

func (r *postgresResumeAnalysisRepository) SaveAnalysis(ctx context.Context, analysis *domain.ResumeAnalysis) error {
	if analysis.ID == uuid.Nil {
		analysis.ID = uuid.New()
	}
	now := time.Now()
	analysis.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.analyses[analysis.ID] = analysis
		if analysis.Scores != nil {
			if analysis.Scores.ID == uuid.Nil {
				analysis.Scores.ID = uuid.New()
			}
			analysis.Scores.AnalysisID = analysis.ID
			analysis.Scores.CreatedAt = now
			r.scores[analysis.ID] = analysis.Scores
		}
		if analysis.Improvements != nil {
			if analysis.Improvements.ID == uuid.Nil {
				analysis.Improvements.ID = uuid.New()
			}
			analysis.Improvements.AnalysisID = analysis.ID
			analysis.Improvements.UserID = analysis.UserID
			analysis.Improvements.CreatedAt = now
			r.improvements[analysis.ID] = analysis.Improvements
		}
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) // nolint:errcheck

	query := `
		INSERT INTO resume_analysis (
			id, user_id, target_job_title, target_job_description, resume_text, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err = tx.Exec(ctx, query,
		analysis.ID, analysis.UserID, analysis.TargetJobTitle, analysis.TargetJobDescription,
		analysis.ResumeText, analysis.Status, analysis.CreatedAt,
	)
	if err != nil {
		return err
	}

	if analysis.Scores != nil {
		if analysis.Scores.ID == uuid.Nil {
			analysis.Scores.ID = uuid.New()
		}
		analysis.Scores.AnalysisID = analysis.ID
		analysis.Scores.CreatedAt = now

		scoreQuery := `
			INSERT INTO resume_scores (
				id, analysis_id, overall_score, ats_compatibility_score,
				structure_score, skills_score, experience_score, job_match_score, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`
		_, err = tx.Exec(ctx, scoreQuery,
			analysis.Scores.ID, analysis.Scores.AnalysisID, analysis.Scores.OverallScore,
			analysis.Scores.ATSCompatibilityScore, analysis.Scores.StructureScore, analysis.Scores.SkillsScore,
			analysis.Scores.ExperienceScore, analysis.Scores.JobMatchScore, analysis.Scores.CreatedAt,
		)
		if err != nil {
			return err
		}
	}

	if analysis.Improvements != nil {
		if analysis.Improvements.ID == uuid.Nil {
			analysis.Improvements.ID = uuid.New()
		}
		analysis.Improvements.AnalysisID = analysis.ID
		analysis.Improvements.UserID = analysis.UserID
		analysis.Improvements.CreatedAt = now

		impQuery := `
			INSERT INTO improvement_history (
				id, analysis_id, user_id, missing_skills, present_keywords, missing_keywords,
				keyword_density_score, structure_feedback, experience_bullet_fixes, general_suggestions, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`
		_, err = tx.Exec(ctx, impQuery,
			analysis.Improvements.ID, analysis.Improvements.AnalysisID, analysis.Improvements.UserID,
			analysis.Improvements.MissingSkills, analysis.Improvements.PresentKeywords, analysis.Improvements.MissingKeywords,
			analysis.Improvements.KeywordDensityScore, analysis.Improvements.StructureFeedback,
			analysis.Improvements.ExperienceBulletFixes, analysis.Improvements.GeneralSuggestions,
			analysis.Improvements.CreatedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *postgresResumeAnalysisRepository) GetAnalysisByID(ctx context.Context, id uuid.UUID) (*domain.ResumeAnalysis, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if a, exists := r.analyses[id]; exists {
			aCopy := *a
			aCopy.Scores = r.scores[id]
			aCopy.Improvements = r.improvements[id]
			return &aCopy, nil
		}
		return nil, fmt.Errorf("resume analysis not found: %s", id)
	}

	query := `
		SELECT id, user_id, target_job_title, target_job_description, resume_text, status, created_at
		FROM resume_analysis
		WHERE id = $1
	`
	var a domain.ResumeAnalysis
	var targetDesc *string
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.UserID, &a.TargetJobTitle, &targetDesc, &a.ResumeText, &a.Status, &a.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("resume analysis not found: %s", id)
		}
		return nil, err
	}
	if targetDesc != nil {
		a.TargetJobDescription = *targetDesc
	}

	// Fetch Scores
	scoreQuery := `
		SELECT id, analysis_id, overall_score, ats_compatibility_score,
		       structure_score, skills_score, experience_score, job_match_score, created_at
		FROM resume_scores
		WHERE analysis_id = $1
	`
	var s domain.ResumeScores
	if err := r.pool.QueryRow(ctx, scoreQuery, id).Scan(
		&s.ID, &s.AnalysisID, &s.OverallScore, &s.ATSCompatibilityScore,
		&s.StructureScore, &s.SkillsScore, &s.ExperienceScore, &s.JobMatchScore, &s.CreatedAt,
	); err == nil {
		a.Scores = &s
	}

	// Fetch Improvements
	impQuery := `
		SELECT id, analysis_id, user_id, missing_skills, present_keywords, missing_keywords,
		       keyword_density_score, structure_feedback, experience_bullet_fixes, general_suggestions, created_at
		FROM improvement_history
		WHERE analysis_id = $1
	`
	var imp domain.ImprovementHistory
	if err := r.pool.QueryRow(ctx, impQuery, id).Scan(
		&imp.ID, &imp.AnalysisID, &imp.UserID, &imp.MissingSkills, &imp.PresentKeywords, &imp.MissingKeywords,
		&imp.KeywordDensityScore, &imp.StructureFeedback, &imp.ExperienceBulletFixes, &imp.GeneralSuggestions, &imp.CreatedAt,
	); err == nil {
		a.Improvements = &imp
	}

	return &a, nil
}

func (r *postgresResumeAnalysisRepository) GetUserAnalysisHistory(ctx context.Context, userID uuid.UUID) ([]domain.ResumeAnalysis, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []domain.ResumeAnalysis
		for _, a := range r.analyses {
			if a.UserID == userID {
				aCopy := *a
				aCopy.Scores = r.scores[a.ID]
				aCopy.Improvements = r.improvements[a.ID]
				list = append(list, aCopy)
			}
		}
		return list, nil
	}

	query := `
		SELECT id, user_id, target_job_title, target_job_description, resume_text, status, created_at
		FROM resume_analysis
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.ResumeAnalysis
	for rows.Next() {
		var a domain.ResumeAnalysis
		var targetDesc *string
		if err := rows.Scan(
			&a.ID, &a.UserID, &a.TargetJobTitle, &targetDesc, &a.ResumeText, &a.Status, &a.CreatedAt,
		); err != nil {
			return nil, err
		}
		if targetDesc != nil {
			a.TargetJobDescription = *targetDesc
		}
		list = append(list, a)
	}

	// Populate scores for list
	for i := range list {
		scoreQuery := `
			SELECT id, analysis_id, overall_score, ats_compatibility_score,
			       structure_score, skills_score, experience_score, job_match_score, created_at
			FROM resume_scores
			WHERE analysis_id = $1
		`
		var s domain.ResumeScores
		if err := r.pool.QueryRow(ctx, scoreQuery, list[i].ID).Scan(
			&s.ID, &s.AnalysisID, &s.OverallScore, &s.ATSCompatibilityScore,
			&s.StructureScore, &s.SkillsScore, &s.ExperienceScore, &s.JobMatchScore, &s.CreatedAt,
		); err == nil {
			list[i].Scores = &s
		}
	}

	return list, rows.Err()
}
