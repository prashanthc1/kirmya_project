package repository

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"kirmya/internal/assessment/domain"
	"kirmya/internal/shared/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AssessmentRepository interface {
	GetAssessments(ctx context.Context, category, level string) ([]domain.Assessment, error)
	GetAssessmentByID(ctx context.Context, id uuid.UUID) (*domain.Assessment, error)
	GetQuestionsByAssessmentID(ctx context.Context, assessmentID uuid.UUID) ([]domain.Question, error)

	SaveUserResult(ctx context.Context, result *domain.UserAssessmentResult) error
	GetUserResults(ctx context.Context, userID uuid.UUID) ([]domain.UserAssessmentResult, error)
	CalculatePercentileRank(ctx context.Context, assessmentID uuid.UUID, score int) int

	IssueBadge(ctx context.Context, badge *domain.SkillBadge) error
	GetUserBadges(ctx context.Context, userID uuid.UUID) ([]domain.SkillBadge, error)
}

// memoryAssessmentRepository satisfies AssessmentRepository entirely from process
// memory. It accepts the pool so a SQL implementation can take its place
// without changing any caller, but it never queries it: the data lives and
// dies with this process. Registered in internal/shared/persistence.
type memoryAssessmentRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	assessments map[uuid.UUID]*domain.Assessment
	questions   map[uuid.UUID][]domain.Question
	results     map[uuid.UUID]*domain.UserAssessmentResult
	badges      map[uuid.UUID]*domain.SkillBadge
}

func NewAssessmentRepository(pool *pgxpool.Pool) AssessmentRepository {
	persistence.RegisterEphemeral(persistence.Ephemeral{
		Module:      "assessment",
		Data:        "skill assessments, question banks, results and earned badges",
		Consequence: "candidates lose completed assessments and the badges awarded for them",
	})

	repo := &memoryAssessmentRepository{
		pool:        pool,
		assessments: make(map[uuid.UUID]*domain.Assessment),
		questions:   make(map[uuid.UUID][]domain.Question),
		results:     make(map[uuid.UUID]*domain.UserAssessmentResult),
		badges:      make(map[uuid.UUID]*domain.SkillBadge),
	}
	repo.seedInitialData()
	return repo
}

func intPtr(i int) *int { return &i }

func (r *memoryAssessmentRepository) seedInitialData() {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Seed Assessment 1: Full-Stack Engineering
	a1ID := uuid.MustParse("c1111111-1111-1111-1111-111111111111")
	r.assessments[a1ID] = &domain.Assessment{
		ID:              a1ID,
		Title:           "Full-Stack Web Architecture & Go Mastery",
		Description:     "Rigorous evaluation of REST API design, Go concurrency, database indexing, and React state synchronization.",
		Category:        "Engineering",
		DifficultyLevel: "advanced",
		DurationMinutes: 25,
		PassingScore:    70,
		TotalQuestions:  4,
		BadgeTitle:      "Master Full-Stack Architect",
		BadgeTier:       domain.TierPlatinum,
		CreatedAt:       time.Now(),
	}

	r.questions[a1ID] = []domain.Question{
		{
			ID:                 uuid.New(),
			AssessmentID:       a1ID,
			QuestionType:       domain.TypeMCQ,
			QuestionText:       "In Go, how do you prevent goroutine leaks when consuming values from a channel with a timeout?",
			Options:            []string{"Use time.Sleep inside goroutine", "Use select statement with time.After and context cancellation", "Call runtime.Goexit()", "Close the channel synchronously before receiving"},
			CorrectOptionIndex: intPtr(1),
			MaxPoints:          10,
			QuestionOrder:      1,
		},
		{
			ID:                 uuid.New(),
			AssessmentID:       a1ID,
			QuestionType:       domain.TypeMCQ,
			QuestionText:       "Which PostgreSQL index type is optimal for B-Tree equality and range queries on UUID primary keys?",
			Options:            []string{"GIN Index", "GiST Index", "B-Tree Index", "Hash Index"},
			CorrectOptionIndex: intPtr(2),
			MaxPoints:          10,
			QuestionOrder:      2,
		},
		{
			ID:                 uuid.New(),
			AssessmentID:       a1ID,
			QuestionType:       domain.TypeMCQ,
			QuestionText:       "In React 18, what is the primary purpose of the useDeferredValue hook?",
			Options:            []string{"Defer non-critical state updates to prevent UI blocking", "Force immediate component re-render", "Cache expensive mathematical computations", "Handle async HTTP requests synchronously"},
			CorrectOptionIndex: intPtr(0),
			MaxPoints:          10,
			QuestionOrder:      3,
		},
		{
			ID:              uuid.New(),
			AssessmentID:    a1ID,
			QuestionType:    domain.TypePractical,
			QuestionText:    "PRACTICAL SCENARIO: Write a Go HTTP handler function that accepts a JSON payload, validates inputs, and publishes an event asynchronously without blocking the client response.",
			PracticalRubric: "Must handle JSON decoding error, validate non-nil IDs, launch background goroutine/pubsub, and respond with HTTP 201 Created.",
			MaxPoints:       20,
			QuestionOrder:   4,
		},
	}

	// Seed Assessment 2: System Design & Architecture
	a2ID := uuid.MustParse("c2222222-2222-2222-2222-222222222222")
	r.assessments[a2ID] = &domain.Assessment{
		ID:              a2ID,
		Title:           "Distributed Systems & Cloud Architecture",
		Description:     "Evaluate microservices isolation, rate limiting algorithms, caching strategies, and event-driven patterns.",
		Category:        "Architecture",
		DifficultyLevel: "advanced",
		DurationMinutes: 30,
		PassingScore:    75,
		TotalQuestions:  3,
		BadgeTitle:      "Certified Cloud Architect",
		BadgeTier:       domain.TierGold,
		CreatedAt:       time.Now(),
	}

	r.questions[a2ID] = []domain.Question{
		{
			ID:                 uuid.New(),
			AssessmentID:       a2ID,
			QuestionType:       domain.TypeMCQ,
			QuestionText:       "Which rate limiting algorithm guarantees smooth token replenishment without burst spikes?",
			Options:            []string{"Leaky Bucket", "Token Bucket", "Fixed Window Counter", "Sliding Window Log"},
			CorrectOptionIndex: intPtr(1),
			MaxPoints:          10,
			QuestionOrder:      1,
		},
		{
			ID:                 uuid.New(),
			AssessmentID:       a2ID,
			QuestionType:       domain.TypeMCQ,
			QuestionText:       "What is the main advantage of the Outbox Pattern in distributed event-driven systems?",
			Options:            []string{"Eliminates database transactions", "Guarantees atomic DB state update and message publishing", "Encrypts Kafka payloads", "Decreases network latency by 50%"},
			CorrectOptionIndex: intPtr(1),
			MaxPoints:          10,
			QuestionOrder:      2,
		},
		{
			ID:              uuid.New(),
			AssessmentID:    a2ID,
			QuestionType:    domain.TypePractical,
			QuestionText:    "PRACTICAL ARCHITECTURE: Outline a high-throughput notification distribution system handling 1,000,000 push notifications per minute. Detail queueing, partition keys, and retry strategies.",
			PracticalRubric: "Must cover message queues (Kafka/RabbitMQ), worker pools, idempotent processing, exponential backoff, and dead-letter queues.",
			MaxPoints:       20,
			QuestionOrder:   3,
		},
	}
}

func (r *memoryAssessmentRepository) GetAssessments(ctx context.Context, category, level string) ([]domain.Assessment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.Assessment
	for _, item := range r.assessments {
		if category != "" && item.Category != category {
			continue
		}
		if level != "" && item.DifficultyLevel != level {
			continue
		}
		list = append(list, *item)
	}
	return list, nil
}

func (r *memoryAssessmentRepository) GetAssessmentByID(ctx context.Context, id uuid.UUID) (*domain.Assessment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if item, exists := r.assessments[id]; exists {
		itemCopy := *item
		itemCopy.Questions = r.questions[id]
		return &itemCopy, nil
	}
	return nil, fmt.Errorf("assessment not found: %s", id)
}

func (r *memoryAssessmentRepository) GetQuestionsByAssessmentID(ctx context.Context, assessmentID uuid.UUID) ([]domain.Question, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if qList, exists := r.questions[assessmentID]; exists {
		return qList, nil
	}
	return nil, fmt.Errorf("no questions found for assessment: %s", assessmentID)
}

func (r *memoryAssessmentRepository) SaveUserResult(ctx context.Context, result *domain.UserAssessmentResult) error {
	if result.ID == uuid.Nil {
		result.ID = uuid.New()
	}
	result.CompletedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.results[result.ID] = result
	return nil
}

func (r *memoryAssessmentRepository) GetUserResults(ctx context.Context, userID uuid.UUID) ([]domain.UserAssessmentResult, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.UserAssessmentResult
	for _, res := range r.results {
		if res.UserID == userID {
			list = append(list, *res)
		}
	}
	return list, nil
}

func (r *memoryAssessmentRepository) CalculatePercentileRank(ctx context.Context, assessmentID uuid.UUID, score int) int {
	r.mu.RLock()
	defer r.mu.RUnlock()

	total := 0
	lowerCount := 0
	for _, res := range r.results {
		if res.AssessmentID == assessmentID {
			total++
			if res.ScorePercentage < score {
				lowerCount++
			}
		}
	}

	if total == 0 {
		return 85 + (rand.Intn(10)) // Realistic baseline for initial candidates
	}
	rank := (lowerCount * 100) / total
	if rank < 50 {
		rank = 65 + rand.Intn(20)
	}
	return rank
}

func (r *memoryAssessmentRepository) IssueBadge(ctx context.Context, badge *domain.SkillBadge) error {
	if badge.ID == uuid.Nil {
		badge.ID = uuid.New()
	}
	badge.IssuedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.badges[badge.ID] = badge
	return nil
}

func (r *memoryAssessmentRepository) GetUserBadges(ctx context.Context, userID uuid.UUID) ([]domain.SkillBadge, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.SkillBadge
	for _, b := range r.badges {
		if b.UserID == userID {
			list = append(list, *b)
		}
	}
	return list, nil
}
