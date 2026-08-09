package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/career_ai/domain"
	"kirmya/internal/shared/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CareerAIRepository interface {
	CreateSession(ctx context.Context, session *domain.CareerSession) error
	GetSessionByID(ctx context.Context, id uuid.UUID) (*domain.CareerSession, error)
	GetUserSessions(ctx context.Context, userID uuid.UUID) ([]domain.CareerSession, error)

	SaveRecommendation(ctx context.Context, rec *domain.AIRecommendation) error
	GetRecommendationsBySession(ctx context.Context, sessionID uuid.UUID) ([]domain.AIRecommendation, error)
	GetUserRecommendations(ctx context.Context, userID uuid.UUID) ([]domain.AIRecommendation, error)

	LogUsage(ctx context.Context, log *domain.AIUsageLog) error
	GetUserUsageLogs(ctx context.Context, userID uuid.UUID) ([]domain.AIUsageLog, error)
}

// memoryCareerAIRepository satisfies CareerAIRepository entirely from process
// memory. It accepts the pool so a SQL implementation can take its place
// without changing any caller, but it never queries it: the data lives and
// dies with this process. Registered in internal/shared/persistence.
type memoryCareerAIRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	sessions        map[uuid.UUID]*domain.CareerSession
	recommendations map[uuid.UUID]*domain.AIRecommendation
	usageLogs       map[uuid.UUID]*domain.AIUsageLog
}

func NewCareerAIRepository(pool *pgxpool.Pool) CareerAIRepository {
	persistence.RegisterEphemeral(persistence.Ephemeral{
		Module:      "career_ai",
		Data:        "career sessions, AI recommendations and AI usage logs",
		Consequence: "advice history disappears and the usage counters any cost control relies on reset to zero",
	})

	return &memoryCareerAIRepository{
		pool:            pool,
		sessions:        make(map[uuid.UUID]*domain.CareerSession),
		recommendations: make(map[uuid.UUID]*domain.AIRecommendation),
		usageLogs:       make(map[uuid.UUID]*domain.AIUsageLog),
	}
}

func (r *memoryCareerAIRepository) CreateSession(ctx context.Context, session *domain.CareerSession) error {
	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	session.CreatedAt = time.Now()
	session.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.sessions[session.ID] = session
	return nil
}

func (r *memoryCareerAIRepository) GetSessionByID(ctx context.Context, id uuid.UUID) (*domain.CareerSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if s, exists := r.sessions[id]; exists {
		sCopy := *s
		var recs []domain.AIRecommendation
		for _, rec := range r.recommendations {
			if rec.SessionID == id {
				recs = append(recs, *rec)
			}
		}
		sCopy.Recommendations = recs
		return &sCopy, nil
	}
	return nil, fmt.Errorf("career session not found: %s", id)
}

func (r *memoryCareerAIRepository) GetUserSessions(ctx context.Context, userID uuid.UUID) ([]domain.CareerSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.CareerSession
	for _, s := range r.sessions {
		if s.UserID == userID {
			list = append(list, *s)
		}
	}
	return list, nil
}

func (r *memoryCareerAIRepository) SaveRecommendation(ctx context.Context, rec *domain.AIRecommendation) error {
	if rec.ID == uuid.Nil {
		rec.ID = uuid.New()
	}
	rec.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.recommendations[rec.ID] = rec
	return nil
}

func (r *memoryCareerAIRepository) GetRecommendationsBySession(ctx context.Context, sessionID uuid.UUID) ([]domain.AIRecommendation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.AIRecommendation
	for _, rec := range r.recommendations {
		if rec.SessionID == sessionID {
			list = append(list, *rec)
		}
	}
	return list, nil
}

func (r *memoryCareerAIRepository) GetUserRecommendations(ctx context.Context, userID uuid.UUID) ([]domain.AIRecommendation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.AIRecommendation
	for _, rec := range r.recommendations {
		if rec.UserID == userID {
			list = append(list, *rec)
		}
	}
	return list, nil
}

func (r *memoryCareerAIRepository) LogUsage(ctx context.Context, log *domain.AIUsageLog) error {
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	log.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.usageLogs[log.ID] = log
	return nil
}

func (r *memoryCareerAIRepository) GetUserUsageLogs(ctx context.Context, userID uuid.UUID) ([]domain.AIUsageLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.AIUsageLog
	for _, log := range r.usageLogs {
		if log.UserID == userID {
			list = append(list, *log)
		}
	}
	return list, nil
}
