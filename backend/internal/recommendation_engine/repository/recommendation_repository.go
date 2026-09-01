package repository

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"kirmya/internal/recommendation_engine/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecommendationRepository interface {
	TrackEvent(ctx context.Context, evt *domain.Event) error
	GetUserPreferences(ctx context.Context, userID uuid.UUID) (*domain.UserPreference, error)
	SaveUserPreferences(ctx context.Context, pref *domain.UserPreference) error
	GetActiveModelWeights(ctx context.Context) (*domain.ModelWeights, error)
	GetCandidatesByDomain(ctx context.Context, itemType string) ([]domain.RecommendationItem, error)
	GetActiveConfig(ctx context.Context) (*domain.RecommendationConfig, error)
	UpdateActiveConfig(ctx context.Context, cfg *domain.RecommendationConfig) error
	GetDailyMetrics(ctx context.Context) ([]domain.RecommendationMetricsDaily, error)
	GetCareerGapAnalysis(ctx context.Context, userID uuid.UUID) (*domain.CareerGapAnalysis, error)
}

type postgresRecommendationRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	events      []domain.Event
	preferences map[uuid.UUID]*domain.UserPreference
	models      *domain.ModelWeights
	candidates  map[string][]domain.RecommendationItem
	config      *domain.RecommendationConfig
	metrics     []domain.RecommendationMetricsDaily
}

func NewRecommendationRepository(pool *pgxpool.Pool) RecommendationRepository {
	repo := &postgresRecommendationRepository{
		pool:        pool,
		preferences: make(map[uuid.UUID]*domain.UserPreference),
		candidates:  make(map[string][]domain.RecommendationItem),
	}
	repo.seedDefaultDataIfMemory()
	return repo
}

func (r *postgresRecommendationRepository) TrackEvent(ctx context.Context, evt *domain.Event) error {
	if evt.ID == uuid.Nil {
		evt.ID = uuid.New()
	}
	now := time.Now()
	evt.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.events = append(r.events, *evt)
		return nil
	}

	contextJSON, err := json.Marshal(evt.Context)
	if err != nil {
		contextJSON = []byte("{}")
	}

	query := `
		INSERT INTO recommendation_events (
			id, user_id, item_type, item_id, action, context, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err = r.pool.Exec(ctx, query,
		evt.ID, evt.UserID, evt.ItemType, evt.ItemID, evt.Action, contextJSON, evt.CreatedAt,
	)
	return err
}

func (r *postgresRecommendationRepository) GetUserPreferences(ctx context.Context, userID uuid.UUID) (*domain.UserPreference, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if p, exists := r.preferences[userID]; exists {
			pCopy := *p
			return &pCopy, nil
		}
		return &domain.UserPreference{
			ID:                 uuid.New(),
			UserID:             userID,
			PreferredSkills:    []string{"Go", "PostgreSQL", "Kubernetes", "High-Throughput"},
			PreferredLocations: []string{"Dubai, UAE", "Remote", "Riyadh, Saudi Arabia"},
			DislikedItems:      []string{},
			FeatureVector:      []float64{0.92, 0.88, 0.95, 0.90, 0.85, 0.78, 0.94, 0.89, 0.91, 0.86, 0.80, 0.93},
			UpdatedAt:          time.Now(),
		}, nil
	}

	query := `
		SELECT id, user_id, preferred_skills, preferred_locations, disliked_items, feature_vector, updated_at
		FROM user_preferences
		WHERE user_id = $1
	`
	var pref domain.UserPreference
	var skillsJSON, locsJSON, dislikedJSON, vecJSON []byte
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&pref.ID, &pref.UserID, &skillsJSON, &locsJSON, &dislikedJSON, &vecJSON, &pref.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.UserPreference{
				ID:                 uuid.New(),
				UserID:             userID,
				PreferredSkills:    []string{"Go", "PostgreSQL", "Kubernetes", "High-Throughput"},
				PreferredLocations: []string{"Dubai, UAE", "Remote", "Riyadh, Saudi Arabia"},
				DislikedItems:      []string{},
				FeatureVector:      []float64{0.92, 0.88, 0.95, 0.90, 0.85, 0.78, 0.94, 0.89, 0.91, 0.86, 0.80, 0.93},
				UpdatedAt:          time.Now(),
			}, nil
		}
		return nil, err
	}
	if len(skillsJSON) > 0 {
		_ = json.Unmarshal(skillsJSON, &pref.PreferredSkills)
	}
	if len(locsJSON) > 0 {
		_ = json.Unmarshal(locsJSON, &pref.PreferredLocations)
	}
	if len(dislikedJSON) > 0 {
		_ = json.Unmarshal(dislikedJSON, &pref.DislikedItems)
	}
	if len(vecJSON) > 0 {
		_ = json.Unmarshal(vecJSON, &pref.FeatureVector)
	}
	return &pref, nil
}

func (r *postgresRecommendationRepository) SaveUserPreferences(ctx context.Context, pref *domain.UserPreference) error {
	if pref.ID == uuid.Nil {
		pref.ID = uuid.New()
	}
	now := time.Now()
	pref.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.preferences[pref.UserID] = pref
		return nil
	}

	skillsJSON, _ := json.Marshal(pref.PreferredSkills)
	locsJSON, _ := json.Marshal(pref.PreferredLocations)
	dislikedJSON, _ := json.Marshal(pref.DislikedItems)
	vecJSON, _ := json.Marshal(pref.FeatureVector)

	query := `
		INSERT INTO user_preferences (
			id, user_id, preferred_skills, preferred_locations, disliked_items, feature_vector, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id) DO UPDATE SET
			preferred_skills = EXCLUDED.preferred_skills,
			preferred_locations = EXCLUDED.preferred_locations,
			disliked_items = EXCLUDED.disliked_items,
			feature_vector = EXCLUDED.feature_vector,
			updated_at = EXCLUDED.updated_at
	`
	_, err := r.pool.Exec(ctx, query,
		pref.ID, pref.UserID, skillsJSON, locsJSON, dislikedJSON, vecJSON, pref.UpdatedAt,
	)
	return err
}

func (r *postgresRecommendationRepository) GetActiveModelWeights(ctx context.Context) (*domain.ModelWeights, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.models, nil
	}

	query := `
		SELECT id, model_name, version, weights, is_active, trained_at
		FROM recommendation_models
		WHERE is_active = true
		ORDER BY trained_at DESC
		LIMIT 1
	`
	var m domain.ModelWeights
	var weightsJSON []byte
	err := r.pool.QueryRow(ctx, query).Scan(
		&m.ID, &m.ModelName, &m.Version, &weightsJSON, &m.IsActive, &m.TrainedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return r.models, nil
		}
		return nil, err
	}
	if len(weightsJSON) > 0 {
		_ = json.Unmarshal(weightsJSON, &m.Weights)
	}
	return &m, nil
}

func (r *postgresRecommendationRepository) GetCandidatesByDomain(ctx context.Context, itemType string) ([]domain.RecommendationItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.candidates[itemType], nil
}

func (r *postgresRecommendationRepository) GetActiveConfig(ctx context.Context) (*domain.RecommendationConfig, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.config, nil
}

func (r *postgresRecommendationRepository) UpdateActiveConfig(ctx context.Context, cfg *domain.RecommendationConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.config = cfg
	return nil
}

func (r *postgresRecommendationRepository) GetDailyMetrics(ctx context.Context) ([]domain.RecommendationMetricsDaily, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.metrics, nil
}

func (r *postgresRecommendationRepository) GetCareerGapAnalysis(ctx context.Context, userID uuid.UUID) (*domain.CareerGapAnalysis, error) {
	return &domain.CareerGapAnalysis{
		TargetRole:    "Staff Infrastructure Architect",
		CurrentSkills: []string{"Go Concurrency", "PostgreSQL Query Tuning", "Microservices Design", "Kubernetes"},
		MissingSkills: []domain.SkillRecommendation{
			{SkillName: "eBPF Observability", Category: "Systems", DemandScore: 94, RelevanceReason: "Essential for microsecond latency profiling", TargetJobsCount: 18},
			{SkillName: "Raft Consensus", Category: "Distributed Systems", DemandScore: 88, RelevanceReason: "Core pattern for distributed coordination", TargetJobsCount: 12},
		},
		StrengthsSummary: "Exceptional foundation in backend high-throughput engineering and Go language internals.",
		GapSeverity:      "Medium",
		SuggestedActions: []string{"Complete eBPF profiling sandbox", "Contribute to open source consensus module"},
	}, nil
}

func (r *postgresRecommendationRepository) seedDefaultDataIfMemory() {
	now := time.Now()
	r.models = &domain.ModelWeights{
		ID:        uuid.New(),
		ModelName: "two_tower_career_ranker_v2",
		Version:   "2.4.1",
		Weights: map[string]float64{
			"skill_overlap_cosine": 0.40,
			"title_seniority_bias": 0.25,
			"location_affinity":    0.15,
			"trust_score_boost":    0.10,
			"recency_decay":        0.10,
		},
		IsActive:  true,
		TrainedAt: now.Add(-24 * time.Hour),
	}

	r.config = &domain.RecommendationConfig{
		ID:                  uuid.New(),
		ModelName:           "two_tower_career_ranker_v2",
		AlgorithmVersion:    "2.4.1",
		SkillMatchWeight:    0.40,
		TitleMatchWeight:    0.25,
		LocationMatchWeight: 0.15,
		IndustryMatchWeight: 0.10,
		DiversityPenalty:    0.10,
		CandidatePoolLimit:  100,
		MinScoreThreshold:   60,
		IsActive:            true,
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	r.metrics = []domain.RecommendationMetricsDaily{
		{ID: uuid.New(), MetricDate: now.Add(-48 * time.Hour), ItemType: domain.ItemTypeJob, TotalImpressions: 14200, TotalClicks: 3820, TotalSaves: 1200, TotalApplies: 840, TotalDismissals: 420, AvgMatchScore: 88, AvgLatencyMS: 12, CreatedAt: now},
		{ID: uuid.New(), MetricDate: now.Add(-24 * time.Hour), ItemType: domain.ItemTypeJob, TotalImpressions: 15600, TotalClicks: 4100, TotalSaves: 1350, TotalApplies: 920, TotalDismissals: 390, AvgMatchScore: 89, AvgLatencyMS: 11, CreatedAt: now},
		{ID: uuid.New(), MetricDate: now, ItemType: domain.ItemTypeJob, TotalImpressions: 16900, TotalClicks: 4580, TotalSaves: 1480, TotalApplies: 1040, TotalDismissals: 360, AvgMatchScore: 91, AvgLatencyMS: 10, CreatedAt: now},
	}

	r.candidates[domain.ItemTypeJob] = []domain.RecommendationItem{
		{
			ItemID:         uuid.MustParse("99999999-9999-9999-9999-999999999901"),
			ItemType:       domain.ItemTypeJob,
			Title:          "Staff Infrastructure Architect",
			Subtitle:       "Careem Global • Dubai, UAE (Hybrid)",
			Description:    "Architect core Go distributed microservices handling 50M+ requests per day with sub-millisecond latencies.",
			CategoryTag:    "Engineering",
			MatchScore:     96,
			MatchRationale: "Matches your verified Go concurrency badge & distributed system background",
			FeatureVector:  []float64{0.96, 0.92, 0.88, 0.94, 0.91, 0.85, 0.98, 0.90, 0.87, 0.93, 0.89, 0.95},
			Metadata: map[string]interface{}{
				"salary": "$210,000 - $260,000",
				"tier":   "Verified Employer",
			},
		},
	}
}
