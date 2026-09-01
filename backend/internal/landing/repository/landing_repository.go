package repository

import (
	"context"
	"encoding/json"
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
}

type postgresLandingRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	statistics   []domain.LandingStatistic
	featuredJobs []domain.FeaturedJob
	companies    []domain.FeaturedCompany
	testimonials []domain.Testimonial
}

func NewLandingRepository(pool *pgxpool.Pool) LandingRepository {
	repo := &postgresLandingRepository{pool: pool}
	repo.seedDefaultDataIfMemory()
	return repo
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
		return r.statistics, nil
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
	if len(list) == 0 {
		return r.statistics, nil
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
		return r.featuredJobs, nil
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
	if len(list) == 0 {
		return r.featuredJobs, nil
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
		return r.companies, nil
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
	if len(list) == 0 {
		return r.companies, nil
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
		return r.testimonials, nil
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
	if len(list) == 0 {
		return r.testimonials, nil
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

	return &domain.LandingContentResponse{
		Statistics:        stats,
		FeaturedJobs:      jobs,
		FeaturedCompanies: comps,
		Testimonials:      tests,
	}, nil
}

func (r *postgresLandingRepository) seedDefaultDataIfMemory() {
	r.statistics = []domain.LandingStatistic{
		{ID: uuid.New(), StatKey: "jobs_matched", StatValue: "18,450+", StatLabel: "Verified Careers Matched", DisplayOrder: 1},
		{ID: uuid.New(), StatKey: "avg_placement_days", StatValue: "14 Days", StatLabel: "Average Time-to-Offer", DisplayOrder: 2},
		{ID: uuid.New(), StatKey: "vetted_employers", StatValue: "850+", StatLabel: "Vetted Enterprise Employers", DisplayOrder: 3},
		{ID: uuid.New(), StatKey: "interview_rate", StatValue: "78%", StatLabel: "AI-Matched Interview Rate", DisplayOrder: 4},
	}

	r.featuredJobs = []domain.FeaturedJob{
		{
			ID:              uuid.New(),
			Title:           "Staff Infrastructure Architect",
			Company:         "Careem Global",
			Location:        "Dubai, UAE (Hybrid)",
			MatchPercentage: 96,
			SalaryRange:     "AED 38,000 - 52,000 / mo",
			Tags:            []string{"Go", "Kubernetes", "High-Throughput", "Fintech"},
			CreatedAt:       time.Now().Add(-6 * time.Hour),
		},
		{
			ID:              uuid.New(),
			Title:           "Principal AI Systems Engineer",
			Company:         "Noon Tech",
			Location:        "Riyadh, Saudi Arabia (On-site)",
			MatchPercentage: 94,
			SalaryRange:     "SAR 45,000 - 60,000 / mo",
			Tags:            []string{"PyTorch", "Distributed Training", "LLM", "Vector DB"},
			CreatedAt:       time.Now().Add(-14 * time.Hour),
		},
	}

	r.companies = []domain.FeaturedCompany{
		{
			ID:            uuid.New(),
			Name:          "Careem Global",
			LogoURL:       "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=150",
			OpenPositions: 42,
			Industry:      "Fintech & Mobility",
			Location:      "Dubai Internet City, UAE",
			CreatedAt:     time.Now(),
		},
	}

	r.testimonials = []domain.Testimonial{
		{
			ID:          uuid.New(),
			AuthorName:  "Sarah Al-Mansoor",
			AuthorRole:  "Lead Cloud Platform Architect",
			CompanyName: "Careem Global",
			AvatarURL:   "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
			Quote:       "Kirmya transformed my career search in the GCC. The verified credential badge allowed me to bypass traditional recruiter filters and land directly with the VP of Engineering within 10 days.",
			Achievement: "Received 3 competitive offers in Dubai within 2 weeks",
			Rating:      5.0,
			IsFeatured:  true,
			CreatedAt:   time.Now(),
		},
	}
}
