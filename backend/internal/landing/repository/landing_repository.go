package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/landing/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LandingRepository interface {
	GetLandingContent(ctx context.Context) (*domain.LandingContentResponse, error)
	CreateTestimonial(ctx context.Context, t *domain.Testimonial) error
	CreateFeaturedJob(ctx context.Context, j *domain.FeaturedJob) error
	GetStatistics(ctx context.Context) ([]domain.LandingStatistic, error)
	GetFeaturedJobs(ctx context.Context) ([]domain.FeaturedJob, error)
	GetFeaturedCompanies(ctx context.Context) ([]domain.FeaturedCompany, error)
	GetTestimonials(ctx context.Context) ([]domain.Testimonial, error)

	// GetPlatformStatistics counts live figures from the tables that hold the
	// real thing. See platform_statistics.go.
	GetPlatformStatistics(ctx context.Context) (*domain.PlatformStatistics, error)
}

type postgresLandingRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	statistics   []domain.LandingStatistic
	featuredJobs []domain.FeaturedJob
	companies    []domain.FeaturedCompany
	testimonials []domain.Testimonial
}

// NewLandingRepository builds the repository.
//
// It no longer seeds anything. The constructor used to fill the in-memory
// fields with invented statistics, jobs, companies and testimonials —
// "18,450+ Verified Careers Matched", named people at named employers — and
// every read fell back to them when the table was empty or the query failed.
// A fresh deployment therefore served fabrications as fact. Empty is the honest
// answer when there is nothing real to show.
func NewLandingRepository(pool *pgxpool.Pool) LandingRepository {
	return &postgresLandingRepository{pool: pool}
}

func (r *postgresLandingRepository) CreateTestimonial(ctx context.Context, t *domain.Testimonial) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	now := time.Now()
	t.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.testimonials = append(r.testimonials, *t)
		return nil
	}

	query := `
		INSERT INTO testimonials (
			id, author_name, author_role, company_name, avatar_url, quote, achievement, rating, is_featured, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.pool.Exec(ctx, query,
		t.ID, t.AuthorName, t.AuthorRole, t.CompanyName, t.AvatarURL,
		t.Quote, t.Achievement, t.Rating, t.IsFeatured, t.CreatedAt,
	)
	return err
}

func (r *postgresLandingRepository) CreateFeaturedJob(ctx context.Context, j *domain.FeaturedJob) error {
	if j.ID == uuid.Nil {
		j.ID = uuid.New()
	}
	now := time.Now()
	j.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.featuredJobs = append(r.featuredJobs, *j)
		return nil
	}

	tagsJSON, err := json.Marshal(j.Tags)
	if err != nil {
		tagsJSON = []byte("[]")
	}

	query := `
		INSERT INTO featured_jobs (
			id, title, company, location, match_percentage, salary_range, tags, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err = r.pool.Exec(ctx, query,
		j.ID, j.Title, j.Company, j.Location, j.MatchPercentage, j.SalaryRange, tagsJSON, j.CreatedAt,
	)
	return err
}

func (r *postgresLandingRepository) GetStatistics(ctx context.Context) ([]domain.LandingStatistic, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.statistics, nil
	}

	query := `
		SELECT id, stat_key, stat_value, stat_label, display_order
		FROM landing_statistics
		ORDER BY display_order ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query landing statistics: %w", err)
	}
	defer rows.Close()

	var list []domain.LandingStatistic
	for rows.Next() {
		var s domain.LandingStatistic
		if err := rows.Scan(&s.ID, &s.StatKey, &s.StatValue, &s.StatLabel, &s.DisplayOrder); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

func (r *postgresLandingRepository) GetFeaturedJobs(ctx context.Context) ([]domain.FeaturedJob, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.featuredJobs, nil
	}

	query := `
		SELECT id, title, company, location, match_percentage, salary_range, tags, created_at
		FROM featured_jobs
		ORDER BY match_percentage DESC, created_at DESC
		LIMIT 10
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query featured jobs: %w", err)
	}
	defer rows.Close()

	var list []domain.FeaturedJob
	for rows.Next() {
		var j domain.FeaturedJob
		var tagsJSON []byte
		if err := rows.Scan(
			&j.ID, &j.Title, &j.Company, &j.Location, &j.MatchPercentage,
			&j.SalaryRange, &tagsJSON, &j.CreatedAt,
		); err != nil {
			return nil, err
		}
		if len(tagsJSON) > 0 {
			_ = json.Unmarshal(tagsJSON, &j.Tags)
		}
		list = append(list, j)
	}
	return list, rows.Err()
}

func (r *postgresLandingRepository) GetFeaturedCompanies(ctx context.Context) ([]domain.FeaturedCompany, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.companies, nil
	}

	query := `
		SELECT id, name, logo_url, open_positions, industry, location, created_at
		FROM featured_companies
		ORDER BY open_positions DESC
		LIMIT 10
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query featured companies: %w", err)
	}
	defer rows.Close()

	var list []domain.FeaturedCompany
	for rows.Next() {
		var c domain.FeaturedCompany
		if err := rows.Scan(
			&c.ID, &c.Name, &c.LogoURL, &c.OpenPositions, &c.Industry, &c.Location, &c.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

func (r *postgresLandingRepository) GetTestimonials(ctx context.Context) ([]domain.Testimonial, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.testimonials, nil
	}

	query := `
		SELECT id, author_name, author_role, company_name, avatar_url, quote, achievement, rating, is_featured, created_at
		FROM testimonials
		WHERE is_featured = true
		ORDER BY rating DESC, created_at DESC
		LIMIT 6
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query testimonials: %w", err)
	}
	defer rows.Close()

	var list []domain.Testimonial
	for rows.Next() {
		var t domain.Testimonial
		if err := rows.Scan(
			&t.ID, &t.AuthorName, &t.AuthorRole, &t.CompanyName, &t.AvatarURL,
			&t.Quote, &t.Achievement, &t.Rating, &t.IsFeatured, &t.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, rows.Err()
}

func (r *postgresLandingRepository) GetLandingContent(ctx context.Context) (*domain.LandingContentResponse, error) {
	stats, err := r.GetStatistics(ctx)
	if err != nil {
		return nil, err
	}
	jobs, err := r.GetFeaturedJobs(ctx)
	if err != nil {
		return nil, err
	}
	comps, err := r.GetFeaturedCompanies(ctx)
	if err != nil {
		return nil, err
	}
	tests, err := r.GetTestimonials(ctx)
	if err != nil {
		return nil, err
	}

	response := &domain.LandingContentResponse{
		Statistics:        stats,
		FeaturedJobs:      jobs,
		FeaturedCompanies: comps,
		Testimonials:      tests,
	}

	// Counted figures are best-effort: a statistics failure must not take the
	// whole landing page down, and the page renders the band only when they are
	// present, so omitting them degrades to showing less rather than to showing
	// something untrue.
	if platform, statsErr := r.GetPlatformStatistics(ctx); statsErr == nil {
		response.PlatformStatistics = platform
	}

	return response, nil
}
