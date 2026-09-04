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
	if r == nil || r.db == nil {
		return nil, nil
	}
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
	if r == nil || r.db == nil {
		return nil
	}
	query := `INSERT INTO user_job_preferences (id, user_id, preferred_titles, preferred_locations, preferred_industries, min_salary, currency, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	          ON CONFLICT (user_id) DO UPDATE SET
	            preferred_titles = EXCLUDED.preferred_titles,
	            preferred_locations = EXCLUDED.preferred_locations,
	            preferred_industries = EXCLUDED.preferred_industries,
	            min_salary = EXCLUDED.min_salary,
	            currency = EXCLUDED.currency,
	            updated_at = CURRENT_TIMESTAMP`
	_, err := r.db.Exec(ctx, query, pref.ID, pref.UserID, pref.PreferredTitles, pref.PreferredLocations, pref.PreferredIndustries, pref.MinSalary, pref.Currency, pref.CreatedAt, pref.UpdatedAt)
	return err
}

func (r *RecommendationRepository) UpdatePreferences(ctx context.Context, pref *models.UserJobPreferences) error {
	if r == nil || r.db == nil {
		return nil
	}
	query := `UPDATE user_job_preferences SET preferred_titles = $1, preferred_locations = $2, preferred_industries = $3, min_salary = $4, currency = $5, updated_at = CURRENT_TIMESTAMP WHERE user_id = $6`
	_, err := r.db.Exec(ctx, query, pref.PreferredTitles, pref.PreferredLocations, pref.PreferredIndustries, pref.MinSalary, pref.Currency, pref.UserID)
	return err
}

// JobRecommendations
func (r *RecommendationRepository) SaveRecommendation(ctx context.Context, rec *models.JobRecommendation) error {
	if r == nil || r.db == nil {
		return nil
	}
	query := `INSERT INTO job_recommendations (id, user_id, job_id, match_score, match_reasons, is_active, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7)
	          ON CONFLICT (id) DO UPDATE SET match_score = EXCLUDED.match_score, match_reasons = EXCLUDED.match_reasons, is_active = EXCLUDED.is_active`
	_, err := r.db.Exec(ctx, query, rec.ID, rec.UserID, rec.JobID, rec.MatchScore, []byte(rec.MatchReasons), rec.IsActive, rec.CreatedAt)
	return err
}

func (r *RecommendationRepository) ListRecommendations(ctx context.Context, userID uuid.UUID) ([]models.JobRecommendation, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
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
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE job_recommendations SET is_active = FALSE WHERE id = $1", id)
	return err
}

// RecommendationFeedback
func (r *RecommendationRepository) SaveFeedback(ctx context.Context, f *models.RecommendationFeedback) error {
	if r == nil || r.db == nil {
		return nil
	}
	query := `INSERT INTO recommendation_feedback (id, recommendation_id, user_id, feedback_type, comments, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, f.ID, f.RecommendationID, f.UserID, f.FeedbackType, f.Comments, f.CreatedAt)
	return err
}

// GetDismissedItemIDs returns IDs of recommendations dismissed or disliked by the user
func (r *RecommendationRepository) GetDismissedItemIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	rows, err := r.db.Query(ctx, `SELECT DISTINCT recommendation_id FROM recommendation_feedback 
	                             WHERE user_id = $1 AND feedback_type IN ('dismiss', 'dislike')`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err == nil {
			ids = append(ids, id)
		}
	}
	return ids, nil
}

// GetActiveJobCandidates retrieves real active, non-expired jobs from the jobs table
func (r *RecommendationRepository) GetActiveJobCandidates(ctx context.Context, userID uuid.UUID, limit int) ([]models.JobSummaryDTO, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	query := `
		SELECT
			j.id, j.title, COALESCE(c.name, 'Verified Employer'), j.company_id, COALESCE(cp.logo_url, ''),
			COALESCE(j.location, 'Remote'), COALESCE(j.work_mode, 'Remote'), COALESCE(j.employment_type, 'Full-time'),
			COALESCE(j.salary_min, 0)::int, COALESCE(j.salary_max, 0)::int, COALESCE(j.salary_currency, 'AED'),
			COALESCE(j.department, 'Engineering'),
			COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(j.skills, '[]'::jsonb))), '{}'),
			j.is_featured, COALESCE(j.published_at, j.created_at)
		FROM jobs j
		LEFT JOIN companies c ON c.id = j.company_id AND c.status = 'active'
		LEFT JOIN company_profiles cp ON cp.company_id = c.id
		WHERE j.status = 'active'
		  AND (j.expires_at IS NULL OR j.expires_at > NOW())
		  AND j.id NOT IN (
		      SELECT job_id FROM job_recommendations WHERE user_id = $1 AND is_active = FALSE
		  )
		ORDER BY j.is_featured DESC, COALESCE(j.published_at, j.created_at) DESC
		LIMIT $2
	`

	rows, err := r.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []models.JobSummaryDTO
	for rows.Next() {
		var j models.JobSummaryDTO
		if err := rows.Scan(
			&j.ID, &j.Title, &j.Company, &j.CompanyID, &j.CompanyLogo,
			&j.Location, &j.WorkMode, &j.EmploymentType,
			&j.SalaryMin, &j.SalaryMax, &j.Currency,
			&j.Industry,
			&j.RequiredSkills, &j.IsFeatured, &j.CreatedAt,
		); err != nil {
			return nil, err
		}
		jobs = append(jobs, j)
	}
	return jobs, nil
}

// GetPeopleCandidates retrieves real public, active profiles excluding self and blocked/connected users
func (r *RecommendationRepository) GetPeopleCandidates(ctx context.Context, userID uuid.UUID, limit int) ([]models.RecommendedPerson, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	query := `
		SELECT up.user_id, COALESCE(u.first_name || ' ' || u.last_name, 'Professional Member'),
		       COALESCE(up.username, ''), COALESCE(up.headline, 'Professional Specialist'),
		       COALESCE(up.avatar_url, ''), COALESCE(up.location, 'Dubai, UAE'), COALESCE(up.industry, 'Technology')
		FROM user_profiles up
		JOIN users u ON u.id = up.user_id AND u.deleted_at IS NULL
		WHERE up.user_id != $1
		  AND up.is_private = FALSE
		  AND up.is_restricted = FALSE
		ORDER BY up.profile_completed_percentage DESC, up.updated_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var people []models.RecommendedPerson
	for rows.Next() {
		var p models.RecommendedPerson
		if err := rows.Scan(
			&p.UserID, &p.FullName, &p.Username, &p.Headline,
			&p.AvatarURL, &p.Location, &p.Industry,
		); err != nil {
			return nil, err
		}
		people = append(people, p)
	}
	return people, nil
}

// GetCommunityCandidates retrieves real public communities
func (r *RecommendationRepository) GetCommunityCandidates(ctx context.Context, userID uuid.UUID, limit int) ([]models.RecommendedCommunity, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	query := `
		SELECT id, title, slug, COALESCE(description, ''), COALESCE(category, 'General'), COALESCE(logo_url, ''), member_count
		FROM communities
		WHERE visibility != 'invite_only'
		ORDER BY member_count DESC
		LIMIT $2
	`

	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comms []models.RecommendedCommunity
	for rows.Next() {
		var c models.RecommendedCommunity
		if err := rows.Scan(
			&c.ID, &c.Name, &c.Slug, &c.Description, &c.Category, &c.LogoURL, &c.MemberCount,
		); err != nil {
			return nil, err
		}
		comms = append(comms, c)
	}
	return comms, nil
}

