package repository

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"kirmya/internal/analytics/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AnalyticsRepository interface {
	TrackEvent(ctx context.Context, event *domain.AnalyticsEvent) error
	GetAdminAnalytics(ctx context.Context, tenantID uuid.UUID) (*domain.AdminAnalytics, error)
	GetRecruiterAnalytics(ctx context.Context, tenantID uuid.UUID) (*domain.RecruiterAnalytics, error)
	GetUserAnalytics(ctx context.Context, tenantID, userID uuid.UUID) (*domain.UserAnalytics, error)
}

type pgxAnalyticsRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	events  map[uuid.UUID]*domain.AnalyticsEvent
	metrics map[string]*domain.AggregatedMetric
}

func NewAnalyticsRepository(pool *pgxpool.Pool) AnalyticsRepository {
	return &pgxAnalyticsRepository{
		pool:    pool,
		events:  make(map[uuid.UUID]*domain.AnalyticsEvent),
		metrics: make(map[string]*domain.AggregatedMetric),
	}
}

func (r *pgxAnalyticsRepository) TrackEvent(ctx context.Context, event *domain.AnalyticsEvent) error {
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	event.CreatedAt = time.Now()

	if r.pool != nil {
		metaBytes, _ := json.Marshal(event.Properties)
		query := `INSERT INTO analytics_events (id, user_id, event_type, event_metadata, created_at) 
		          VALUES ($1, $2, $3, $4, $5)`
		_, err := r.pool.Exec(ctx, query, event.ID, event.UserID, event.EventName, metaBytes, event.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.events[event.ID] = event
	return nil
}

func (r *pgxAnalyticsRepository) GetAdminAnalytics(ctx context.Context, tenantID uuid.UUID) (*domain.AdminAnalytics, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return &domain.AdminAnalytics{
		TotalUsers:         12450,
		ActiveUsers:        8920,
		UserGrowthRate:     14.5,
		TotalJobOpenings:   1840,
		HiringVelocityDays: 18.2,
		SkillDemandHeatmap: []domain.SkillDemandItem{
			{Skill: "Go / Golang", Count: 98, Share: 24.5},
			{Skill: "PostgreSQL Architecture", Count: 95, Share: 18.2},
			{Skill: "Next.js & React", Count: 92, Share: 15.0},
			{Skill: "Docker & Kubernetes", Count: 89, Share: 12.8},
		},
		MarketTrendSummary: "High candidate migration toward Go backend engineering and AI career platform tools.",
	}, nil
}

func (r *pgxAnalyticsRepository) GetRecruiterAnalytics(ctx context.Context, tenantID uuid.UUID) (*domain.RecruiterAnalytics, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return &domain.RecruiterAnalytics{
		TotalCandidatesScreened: 480,
		AvgTimeToHireDays:       16.5,
		ApplicationToOfferRate:  22.4,
		CandidateFunnel: []domain.ConversionStage{
			{Stage: "Applied", Count: 1280, Percentage: 100.0},
			{Stage: "AI Screened", Count: 420, Percentage: 32.8},
			{Stage: "Interviewed", Count: 140, Percentage: 10.9},
			{Stage: "Offered", Count: 28, Percentage: 2.2},
		},
		TopPerformingJob: "Senior Go Microservices Engineer",
		JobViewsCount:    3450,
	}, nil
}

func (r *pgxAnalyticsRepository) GetUserAnalytics(ctx context.Context, tenantID, userID uuid.UUID) (*domain.UserAnalytics, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return &domain.UserAnalytics{
		ProfileViewsCount:       342,
		SearchAppearancesCount:  128,
		ApplicationsCount:       14,
		InterviewInvitationRate: 35.7,
		ProfileCompleteness:     95,
		TopSearchingCompanies:   []string{"Stripe", "Datadog", "Cloudflare"},
	}, nil
}
