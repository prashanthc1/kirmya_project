package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/ai_job_match/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MatchingRepository interface {
	SaveMatch(ctx context.Context, match *domain.AIJobMatch, breakdown *domain.MatchingScore) error
	GetUserMatches(ctx context.Context, userID uuid.UUID) ([]domain.AIJobMatch, error)
	GetMatchByID(ctx context.Context, id uuid.UUID) (*domain.AIJobMatch, error)
	SaveFeedback(ctx context.Context, feedback *domain.MatchingFeedback) error
}

type pgxMatchingRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	matches   map[uuid.UUID]*domain.AIJobMatch
	scores    map[uuid.UUID]*domain.MatchingScore
	feedbacks map[uuid.UUID]*domain.MatchingFeedback
}

func NewMatchingRepository(pool *pgxpool.Pool) MatchingRepository {
	repo := &pgxMatchingRepository{
		pool:      pool,
		matches:   make(map[uuid.UUID]*domain.AIJobMatch),
		scores:    make(map[uuid.UUID]*domain.MatchingScore),
		feedbacks: make(map[uuid.UUID]*domain.MatchingFeedback),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxMatchingRepository) seedDefaultData() {
	now := time.Now()
	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")

	m1ID := uuid.MustParse("m1111111-1111-1111-1111-111111111111")
	m1 := &domain.AIJobMatch{
		ID:            m1ID,
		UserID:        userID,
		JobID:         uuid.MustParse("j1111111-1111-1111-1111-111111111111"),
		JobTitle:      "Senior Go Backend Architect",
		CompanyName:   "Stripe Global",
		OverallScore:  96,
		MatchTier:     domain.TierStrongMatch,
		Explanation:   "You match 96% of requirements. Your 5+ years of Go microservices and PostgreSQL GIN index optimization perfectly fit Stripe's high-throughput architecture.",
		MatchedSkills: []string{"Go", "PostgreSQL", "Microservices", "REST API", "Docker"},
		MissingSkills: []string{"Kafka Event Streaming"},
		RecommendedActions: []domain.RecommendedAction{
			{
				Type:        "course",
				Title:       "Master Kafka Event Streaming",
				Description: "Bridge your Kafka requirement gap with our 3-hour fast-track course.",
				ActionURL:   "/learning/courses/kafka-mastery",
			},
		},
		CreatedAt: now,
		Breakdown: &domain.MatchingScore{
			ID:                uuid.New(),
			MatchID:           m1ID,
			SkillsScore:       95,
			ExperienceScore:   100,
			GoalsScore:        100,
			LocationScore:     100,
			SalaryScore:       90,
			LearningScore:     90,
			ApplicationsScore: 100,
			FeatureVector: map[string]interface{}{
				"skills_overlap_ratio": 0.92,
				"model_version":        "v1.2.0-xgboost-ready",
			},
			CreatedAt: now,
		},
	}
	r.matches[m1ID] = m1

	m2ID := uuid.MustParse("m2222222-2222-2222-2222-222222222222")
	m2 := &domain.AIJobMatch{
		ID:            m2ID,
		UserID:        userID,
		JobID:         uuid.MustParse("j2222222-2222-2222-2222-222222222222"),
		JobTitle:      "Lead Distributed Systems Engineer",
		CompanyName:   "TechCorp Cloud",
		OverallScore:  88,
		MatchTier:     domain.TierStrongMatch,
		Explanation:   "Strong 88% match. Excellent overlap on Go concurrency and Docker deployment, with minor growth potential in Kubernetes Operators.",
		MatchedSkills: []string{"Go", "Microservices", "Docker", "Redis"},
		MissingSkills: []string{"Kubernetes Operator SDK"},
		RecommendedActions: []domain.RecommendedAction{
			{
				Type:        "certification",
				Title:       "Kubernetes Application Developer (CKAD)",
				Description: "Boost your match to 98% by adding CKAD certification.",
				ActionURL:   "/learning/courses/ckad-prep",
			},
		},
		CreatedAt: now.Add(-1 * time.Hour),
		Breakdown: &domain.MatchingScore{
			ID:                uuid.New(),
			MatchID:           m2ID,
			SkillsScore:       85,
			ExperienceScore:   90,
			GoalsScore:        90,
			LocationScore:     100,
			SalaryScore:       85,
			LearningScore:     80,
			ApplicationsScore: 100,
			CreatedAt:         now.Add(-1 * time.Hour),
		},
	}
	r.matches[m2ID] = m2
}

func (r *pgxMatchingRepository) SaveMatch(ctx context.Context, match *domain.AIJobMatch, breakdown *domain.MatchingScore) error {
	if match.ID == uuid.Nil {
		match.ID = uuid.New()
	}
	match.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	if breakdown != nil {
		breakdown.ID = uuid.New()
		breakdown.MatchID = match.ID
		breakdown.CreatedAt = time.Now()
		r.scores[match.ID] = breakdown
		match.Breakdown = breakdown
	}

	r.matches[match.ID] = match
	return nil
}

func (r *pgxMatchingRepository) GetUserMatches(ctx context.Context, userID uuid.UUID) ([]domain.AIJobMatch, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.AIJobMatch
	for _, m := range r.matches {
		if m.UserID == userID {
			mCopy := *m
			if score, exists := r.scores[m.ID]; exists {
				mCopy.Breakdown = score
			}
			list = append(list, mCopy)
		}
	}
	return list, nil
}

func (r *pgxMatchingRepository) GetMatchByID(ctx context.Context, id uuid.UUID) (*domain.AIJobMatch, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if m, exists := r.matches[id]; exists {
		mCopy := *m
		if score, existsScore := r.scores[id]; existsScore {
			mCopy.Breakdown = score
		}
		return &mCopy, nil
	}
	return nil, fmt.Errorf("match not found: %s", id)
}

func (r *pgxMatchingRepository) SaveFeedback(ctx context.Context, feedback *domain.MatchingFeedback) error {
	if feedback.ID == uuid.Nil {
		feedback.ID = uuid.New()
	}
	feedback.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.feedbacks[feedback.ID] = feedback
	return nil
}
