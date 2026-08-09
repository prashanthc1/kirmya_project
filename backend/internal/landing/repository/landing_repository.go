package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/landing/domain"
	"kirmya/internal/shared/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LandingRepository interface {
	GetLandingContent(ctx context.Context) (*domain.LandingContentResponse, error)
	CreateTestimonial(ctx context.Context, t *domain.Testimonial) error
	CreateFeaturedJob(ctx context.Context, j *domain.FeaturedJob) error
}

// memoryLandingRepository satisfies LandingRepository entirely from process
// memory. It accepts the pool so a SQL implementation can take its place
// without changing any caller, but it never queries it: the data lives and
// dies with this process. Registered in internal/shared/persistence.
type memoryLandingRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	testimonials []domain.Testimonial
	featuredJobs []domain.FeaturedJob
	companies    []domain.FeaturedCompany
	statistics   []domain.LandingStatistic
}

func NewLandingRepository(pool *pgxpool.Pool) LandingRepository {
	persistence.RegisterEphemeral(persistence.Ephemeral{
		Module:      "landing",
		Data:        "seeded landing statistics, testimonials and featured jobs",
		Consequence: "the public landing page publishes invented figures, and submitted testimonials are dropped",
	})

	repo := &memoryLandingRepository{pool: pool}
	repo.seedDefaultData()
	return repo
}

func (r *memoryLandingRepository) seedDefaultData() {
	now := time.Now()

	r.statistics = []domain.LandingStatistic{
		{ID: uuid.New(), StatKey: "professionals_helped", StatValue: "150,000+", StatLabel: "Professionals Reconnected", DisplayOrder: 1},
		{ID: uuid.New(), StatKey: "active_jobs", StatValue: "45,000+", StatLabel: "Active Job Listings", DisplayOrder: 2},
		{ID: uuid.New(), StatKey: "avg_time_to_hire", StatValue: "18 Days", StatLabel: "Average Days to Offer", DisplayOrder: 3},
		{ID: uuid.New(), StatKey: "ai_career_matches", StatValue: "94.8%", StatLabel: "AI Career Match Accuracy", DisplayOrder: 4},
	}

	r.featuredJobs = []domain.FeaturedJob{
		{
			ID:              uuid.New(),
			Title:           "Facilities Coordinator",
			Company:         "Emaar Properties",
			Location:        "Dubai, UAE",
			MatchPercentage: 92,
			SalaryRange:     "$65,000 - $85,000 / yr",
			Tags:            []string{"Facilities", "Vendor Management", "Operations"},
			CreatedAt:       now,
		},
		{
			ID:              uuid.New(),
			Title:           "Senior Go Backend Engineer",
			Company:         "Stripe Global",
			Location:        "Remote / Dubai",
			MatchPercentage: 96,
			SalaryRange:     "$140,000 - $180,000 / yr",
			Tags:            []string{"Go", "PostgreSQL", "Distributed Systems"},
			CreatedAt:       now,
		},
		{
			ID:              uuid.New(),
			Title:           "Regional Marketing Manager",
			Company:         "Careem (Uber)",
			Location:        "Abu Dhabi, UAE",
			MatchPercentage: 89,
			SalaryRange:     "$90,000 - $115,000 / yr",
			Tags:            []string{"Growth", "Brand Strategy", "Campaigns"},
			CreatedAt:       now,
		},
	}

	r.companies = []domain.FeaturedCompany{
		{ID: uuid.New(), Name: "Emaar Properties", LogoURL: "/logos/emaar.png", OpenPositions: 14, Industry: "Real Estate & Facilities", Location: "Dubai", CreatedAt: now},
		{ID: uuid.New(), Name: "Stripe Global", LogoURL: "/logos/stripe.png", OpenPositions: 28, Industry: "Fintech & Cloud", Location: "Global Remote", CreatedAt: now},
		{ID: uuid.New(), Name: "Careem", LogoURL: "/logos/careem.png", OpenPositions: 19, Industry: "Technology & Mobility", Location: "Middle East", CreatedAt: now},
	}

	r.testimonials = []domain.Testimonial{
		{
			ID:          uuid.New(),
			AuthorName:  "Tariq Al-Mansoor",
			AuthorRole:  "Lead Facilities Manager",
			CompanyName: "Emaar Hospitality Group",
			AvatarURL:   "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
			Quote:       "After an unexpected layoff, Kirmya's AI assistant optimized my resume and connected me directly with Emaar recruiters within 12 days.",
			Achievement: "Land 3 offers in 14 days post-layoff",
			Rating:      5.0,
			IsFeatured:  true,
			CreatedAt:   now,
		},
		{
			ID:          uuid.New(),
			AuthorName:  "Priya Sharma",
			AuthorRole:  "Senior Full-Stack Engineer",
			CompanyName: "Fintech Solutions APAC",
			AvatarURL:   "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
			Quote:       "Kirmya's skill gap recommendations showed me exactly which Go microservice patterns I needed. I boosted my salary by 35%!",
			Achievement: "Career Transition to Principal Engineer",
			Rating:      5.0,
			IsFeatured:  true,
			CreatedAt:   now,
		},
		{
			ID:          uuid.New(),
			AuthorName:  "Marcus Vance",
			AuthorRole:  "Operations Specialist",
			CompanyName: "Logistics Global",
			AvatarURL:   "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
			Quote:       "The supportive Kirmya community helped me rebuild my network when I felt completely stuck. Truly a life-saving career platform.",
			Achievement: "Re-employed in 18 days",
			Rating:      5.0,
			IsFeatured:  true,
			CreatedAt:   now,
		},
	}
}

func (r *memoryLandingRepository) GetLandingContent(ctx context.Context) (*domain.LandingContentResponse, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return &domain.LandingContentResponse{
		Statistics:        r.statistics,
		FeaturedJobs:      r.featuredJobs,
		FeaturedCompanies: r.companies,
		Testimonials:      r.testimonials,
	}, nil
}

func (r *memoryLandingRepository) CreateTestimonial(ctx context.Context, t *domain.Testimonial) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	t.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.testimonials = append([]domain.Testimonial{*t}, r.testimonials...)
	return nil
}

func (r *memoryLandingRepository) CreateFeaturedJob(ctx context.Context, j *domain.FeaturedJob) error {
	if j.ID == uuid.Nil {
		j.ID = uuid.New()
	}
	j.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.featuredJobs = append([]domain.FeaturedJob{*j}, r.featuredJobs...)
	return nil
}
