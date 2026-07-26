package repository

import (
	"context"
	"errors"
	"kirmya/internal/recommendation/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecommendationRepository struct {
	db *pgxpool.Pool
}

func NewRecommendationRepository(db *pgxpool.Pool) *RecommendationRepository {
	return &RecommendationRepository{db: db}
}

// UserJobPreferences
func (r *RecommendationRepository) GetPreferences(ctx context.Context, userID uuid.UUID) (*models.UserJobPreferences, error) {
	pref := &models.UserJobPreferences{}
	query := `SELECT id, user_id, preferred_titles, preferred_locations, preferred_industries, min_salary, currency, created_at, updated_at 
	          FROM user_job_preferences WHERE user_id = $1`

	err := r.db.QueryRow(ctx, query, userID).Scan(
		&pref.ID, &pref.UserID, &pref.PreferredTitles, &pref.PreferredLocations, &pref.PreferredIndustries,
		&pref.MinSalary, &pref.Currency, &pref.CreatedAt, &pref.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return pref, nil
}

func (r *RecommendationRepository) CreatePreferences(ctx context.Context, pref *models.UserJobPreferences) error {
	query := `INSERT INTO user_job_preferences (id, user_id, preferred_titles, preferred_locations, preferred_industries, min_salary, currency, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err := r.db.Exec(ctx, query, pref.ID, pref.UserID, pref.PreferredTitles, pref.PreferredLocations, pref.PreferredIndustries, pref.MinSalary, pref.Currency, pref.CreatedAt, pref.UpdatedAt)
	return err
}

func (r *RecommendationRepository) UpdatePreferences(ctx context.Context, pref *models.UserJobPreferences) error {
	query := `UPDATE user_job_preferences SET preferred_titles = $1, preferred_locations = $2, preferred_industries = $3, min_salary = $4, currency = $5, updated_at = CURRENT_TIMESTAMP WHERE user_id = $6`
	_, err := r.db.Exec(ctx, query, pref.PreferredTitles, pref.PreferredLocations, pref.PreferredIndustries, pref.MinSalary, pref.Currency, pref.UserID)
	return err
}

// JobRecommendations
func (r *RecommendationRepository) SaveRecommendation(ctx context.Context, rec *models.JobRecommendation) error {
	query := `INSERT INTO job_recommendations (id, user_id, job_id, match_score, match_reasons, is_active, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query, rec.ID, rec.UserID, rec.JobID, rec.MatchScore, []byte(rec.MatchReasons), rec.IsActive, rec.CreatedAt)
	return err
}

func (r *RecommendationRepository) ListRecommendations(ctx context.Context, userID uuid.UUID) ([]models.JobRecommendation, error) {
	rows, err := r.db.Query(ctx, `SELECT id, user_id, job_id, match_score, match_reasons, is_active, created_at 
	                             FROM job_recommendations WHERE user_id = $1 AND is_active = TRUE ORDER BY match_score DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.JobRecommendation
	for rows.Next() {
		var rec models.JobRecommendation
		var reasonsBytes []byte
		err := rows.Scan(&rec.ID, &rec.UserID, &rec.JobID, &rec.MatchScore, &reasonsBytes, &rec.IsActive, &rec.CreatedAt)
		if err != nil {
			return nil, err
		}
		rec.MatchReasons = string(reasonsBytes)
		list = append(list, rec)
	}
	return list, nil
}

func (r *RecommendationRepository) DismissRecommendation(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "UPDATE job_recommendations SET is_active = FALSE WHERE id = $1", id)
	return err
}

// RecommendationFeedback
func (r *RecommendationRepository) SaveFeedback(ctx context.Context, f *models.RecommendationFeedback) error {
	query := `INSERT INTO recommendation_feedback (id, recommendation_id, user_id, feedback_type, comments, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, f.ID, f.RecommendationID, f.UserID, f.FeedbackType, f.Comments, f.CreatedAt)
	return err
}
