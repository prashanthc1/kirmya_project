package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/recommendation_engine/domain"
	"kirmya/internal/shared/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecommendationRepository interface {
	TrackEvent(ctx context.Context, evt *domain.Event) error
	GetUserPreferences(ctx context.Context, userID uuid.UUID) (*domain.UserPreference, error)
	SaveUserPreferences(ctx context.Context, pref *domain.UserPreference) error
	GetActiveModelWeights(ctx context.Context) (*domain.ModelWeights, error)
	GetCandidatesByDomain(ctx context.Context, itemType string) ([]domain.RecommendationItem, error)
}

// memoryRecommendationRepository satisfies RecommendationRepository entirely from process
// memory. It accepts the pool so a SQL implementation can take its place
// without changing any caller, but it never queries it: the data lives and
// dies with this process. Registered in internal/shared/persistence.
type memoryRecommendationRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	events      []domain.Event
	preferences map[uuid.UUID]*domain.UserPreference
	models      *domain.ModelWeights
	candidates  map[string][]domain.RecommendationItem
}

func NewRecommendationRepository(pool *pgxpool.Pool) RecommendationRepository {
	persistence.RegisterEphemeral(persistence.Ephemeral{
		Module:      "recommendation_engine",
		Data:        "user recommendation preferences and candidate recommendation sets",
		Consequence: "personalisation resets to the seeded defaults for everyone",
	})

	repo := &memoryRecommendationRepository{
		pool:        pool,
		preferences: make(map[uuid.UUID]*domain.UserPreference),
		candidates:  make(map[string][]domain.RecommendationItem),
	}
	repo.seedDefaultData()
	return repo
}

func (r *memoryRecommendationRepository) seedDefaultData() {
	now := time.Now()
	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")

	r.preferences[userID] = &domain.UserPreference{
		ID:                 uuid.New(),
		UserID:             userID,
		PreferredSkills:    []string{"Go", "PostgreSQL", "Microservices", "Distributed Systems"},
		PreferredLocations: []string{"Remote", "Dubai", "Bengaluru"},
		DislikedItems:      []string{},
		FeatureVector:      []float64{0.95, 0.90, 0.88, 0.82, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40},
		UpdatedAt:          now,
	}

	r.models = &domain.ModelWeights{
		ID:        uuid.New(),
		ModelName: "Kirmya Hybrid Collaborative & Content Filtering v3.2",
		Version:   "3.2.0-ml",
		Weights: map[string]float64{
			"skills_weight":   0.35,
			"affinity_weight": 0.25,
			"location_weight": 0.15,
			"recency_weight":  0.15,
			"popularity_w":    0.10,
		},
		IsActive:  true,
		TrainedAt: now,
	}

	r.candidates[domain.ItemTypeJob] = []domain.RecommendationItem{
		{
			ItemID:         uuid.MustParse("b1111111-1111-1111-1111-111111111111"),
			ItemType:       domain.ItemTypeJob,
			Title:          "Senior Go Backend Architect",
			Subtitle:       "Stripe Global • $180k - $220k • Remote",
			Description:    "5+ years Go & microservice architecture experience.",
			CategoryTag:    "Job Opportunity",
			MatchScore:     96,
			MatchRationale: "96% match with your Go microservices & PostgreSQL index optimization vector",
			FeatureVector:  []float64{0.96, 0.92, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45},
		},
	}

	r.candidates[domain.ItemTypePerson] = []domain.RecommendationItem{
		{
			ItemID:         uuid.New(),
			ItemType:       domain.ItemTypePerson,
			Title:          "Sarah Chen",
			Subtitle:       "Staff Distributed Systems Engineer @ Stripe",
			Description:    "Expert in Raft consensus & Go memory optimization.",
			CategoryTag:    "Peer Connection",
			MatchScore:     94,
			MatchRationale: "Shares 4 mutual skills and active in Go Guild",
			FeatureVector:  []float64{0.94, 0.89, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40},
		},
	}

	r.candidates[domain.ItemTypeCommunity] = []domain.RecommendationItem{
		{
			ItemID:         uuid.New(),
			ItemType:       domain.ItemTypeCommunity,
			Title:          "Go & Distributed Systems Guild",
			Subtitle:       "4,250 Members • Weekly Technical Deep Dives",
			Description:    "Community for high-scale backend engineers.",
			CategoryTag:    "Professional Guild",
			MatchScore:     95,
			MatchRationale: "Top trending community aligned with your backend skills",
			FeatureVector:  []float64{0.95, 0.91, 0.87, 0.83, 0.79, 0.75, 0.71, 0.67, 0.63, 0.59, 0.55, 0.51},
		},
	}

	r.candidates[domain.ItemTypeCourse] = []domain.RecommendationItem{
		{
			ItemID:         uuid.New(),
			ItemType:       domain.ItemTypeCourse,
			Title:          "Advanced PostgreSQL Internals & GIN Index Tuning",
			Subtitle:       "12 Modules • Certificate of Mastery",
			Description:    "Master query planner execution and B-tree / GIN index structures.",
			CategoryTag:    "Skill Course",
			MatchScore:     92,
			MatchRationale: "Recommended skill upgrade for Principal Architect salary bump",
			FeatureVector:  []float64{0.92, 0.88, 0.84, 0.80, 0.76, 0.72, 0.68, 0.64, 0.60, 0.56, 0.52, 0.48},
		},
	}

	r.candidates[domain.ItemTypeEvent] = []domain.RecommendationItem{
		{
			ItemID:         uuid.New(),
			ItemType:       domain.ItemTypeEvent,
			Title:          "Global High-Scale Microservices Summit 2026",
			Subtitle:       "Live Stream & WebRTC Networking Room",
			Description:    "Keynotes from Stripe, Google, and Netflix engineers.",
			CategoryTag:    "Live Event",
			MatchScore:     90,
			MatchRationale: "Aligned with your target role and network connections",
			FeatureVector:  []float64{0.90, 0.86, 0.82, 0.78, 0.74, 0.70, 0.66, 0.62, 0.58, 0.54, 0.50, 0.46},
		},
	}

	r.candidates[domain.ItemTypeCandidate] = []domain.RecommendationItem{
		{
			ItemID:         uuid.New(),
			ItemType:       domain.ItemTypeCandidate,
			Title:          "Alex Rivera",
			Subtitle:       "Senior Go Backend Architect • Verified",
			Description:    "5+ years microservices, GIN indexing, Docker & Kubernetes.",
			CategoryTag:    "Verified Candidate",
			MatchScore:     96,
			MatchRationale: "Top candidate for Senior Go Backend Architect opening",
			FeatureVector:  []float64{0.96, 0.92, 0.88, 0.84, 0.80, 0.76, 0.72, 0.68, 0.64, 0.60, 0.56, 0.52},
		},
	}

	r.candidates[domain.ItemTypeTalentPool] = []domain.RecommendationItem{
		{
			ItemID:         uuid.New(),
			ItemType:       domain.ItemTypeTalentPool,
			Title:          "Go & Microservices Talent Pipeline",
			Subtitle:       "342 Pre-Vetted 90%+ Match Candidates",
			Description:    "Bulk candidate pool for backend infrastructure teams.",
			CategoryTag:    "Talent Pool",
			MatchScore:     95,
			MatchRationale: "Curated pool matching enterprise infrastructure hiring needs",
			FeatureVector:  []float64{0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40},
		},
	}
}

func (r *memoryRecommendationRepository) TrackEvent(ctx context.Context, evt *domain.Event) error {
	if evt.ID == uuid.Nil {
		evt.ID = uuid.New()
	}
	evt.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.events = append([]domain.Event{*evt}, r.events...)
	return nil
}

func (r *memoryRecommendationRepository) GetUserPreferences(ctx context.Context, userID uuid.UUID) (*domain.UserPreference, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if pref, exists := r.preferences[userID]; exists {
		prefCopy := *pref
		return &prefCopy, nil
	}
	return &domain.UserPreference{
		ID:                 uuid.New(),
		UserID:             userID,
		PreferredSkills:    []string{"Software Engineering"},
		PreferredLocations: []string{"Remote"},
		DislikedItems:      []string{},
		FeatureVector:      []float64{0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5},
		UpdatedAt:          time.Now(),
	}, nil
}

func (r *memoryRecommendationRepository) SaveUserPreferences(ctx context.Context, pref *domain.UserPreference) error {
	if pref.ID == uuid.Nil {
		pref.ID = uuid.New()
	}
	pref.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.preferences[pref.UserID] = pref
	return nil
}

func (r *memoryRecommendationRepository) GetActiveModelWeights(ctx context.Context) (*domain.ModelWeights, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.models, nil
}

func (r *memoryRecommendationRepository) GetCandidatesByDomain(ctx context.Context, itemType string) ([]domain.RecommendationItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.candidates[itemType], nil
}
