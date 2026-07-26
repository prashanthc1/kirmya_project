package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/recruiter_ai/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecruiterAIRepository interface {
	CreateSession(ctx context.Context, sess *domain.RecruiterAISession) error
	SaveCandidateScores(ctx context.Context, scores []domain.AICandidateScore) error
	GetSessionCandidateScores(ctx context.Context, sessionID uuid.UUID) ([]domain.AICandidateScore, error)

	SaveGeneratedContent(ctx context.Context, content *domain.AIGeneratedContent) error
	GetSessionContent(ctx context.Context, sessionID uuid.UUID) ([]domain.AIGeneratedContent, error)

	GetRecruiterSessions(ctx context.Context, orgID uuid.UUID) ([]domain.RecruiterAISession, error)
}

type pgxRecruiterAIRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	sessions map[uuid.UUID]*domain.RecruiterAISession
	scores   map[uuid.UUID][]domain.AICandidateScore
	contents map[uuid.UUID][]domain.AIGeneratedContent
}

func NewRecruiterAIRepository(pool *pgxpool.Pool) RecruiterAIRepository {
	repo := &pgxRecruiterAIRepository{
		pool:     pool,
		sessions: make(map[uuid.UUID]*domain.RecruiterAISession),
		scores:   make(map[uuid.UUID][]domain.AICandidateScore),
		contents: make(map[uuid.UUID][]domain.AIGeneratedContent),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxRecruiterAIRepository) seedDefaultData() {
	now := time.Now()
	orgID := uuid.MustParse("00000000-0000-0000-0000-000000000000")
	recruiterID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	jobID := uuid.MustParse("j1111111-1111-1111-1111-111111111111")

	sessID := uuid.MustParse("s1111111-1111-1111-1111-111111111111")
	s1 := &domain.RecruiterAISession{
		ID:          sessID,
		OrgID:       orgID,
		RecruiterID: recruiterID,
		JobID:       jobID,
		SessionType: domain.SessionTypeRanking,
		CreatedAt:   now,
	}
	r.sessions[sessID] = s1

	scores := []domain.AICandidateScore{
		{
			ID:             uuid.New(),
			SessionID:      sessID,
			CandidateID:    uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
			CandidateName:  "Alex Rivera",
			JobTitle:       "Senior Go Backend Architect",
			RankPosition:   1,
			FitScore:       96,
			Strengths:      []string{"5+ Years Go Microservices", "PostgreSQL GIN Index Optimization", "Distributed System Design"},
			RedFlags:       []string{"Requires Remote Work"},
			MatchRationale: "Top candidate with proven high-concurrency Go experience and 96% requirement overlap.",
			CreatedAt:      now,
		},
		{
			ID:             uuid.New(),
			SessionID:      sessID,
			CandidateID:    uuid.MustParse("c2222222-2222-2222-2222-222222222222"),
			CandidateName:  "Elena Rostova",
			JobTitle:       "Senior Go Backend Architect",
			RankPosition:   2,
			FitScore:       88,
			Strengths:      []string{"Go Concurrency Primitives", "Docker & Kubernetes Operator SDK"},
			RedFlags:       []string{"Limited Kafka Experience"},
			MatchRationale: "Strong backend engineer with solid Go skills and Kubernetes expertise.",
			CreatedAt:      now,
		},
	}
	r.scores[sessID] = scores
}

func (r *pgxRecruiterAIRepository) CreateSession(ctx context.Context, sess *domain.RecruiterAISession) error {
	if sess.ID == uuid.Nil {
		sess.ID = uuid.New()
	}
	sess.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.sessions[sess.ID] = sess
	return nil
}

func (r *pgxRecruiterAIRepository) SaveCandidateScores(ctx context.Context, scores []domain.AICandidateScore) error {
	if len(scores) == 0 {
		return nil
	}
	sessionID := scores[0].SessionID

	r.mu.Lock()
	defer r.mu.Unlock()

	r.scores[sessionID] = append(r.scores[sessionID], scores...)
	return nil
}

func (r *pgxRecruiterAIRepository) GetSessionCandidateScores(ctx context.Context, sessionID uuid.UUID) ([]domain.AICandidateScore, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if list, exists := r.scores[sessionID]; exists {
		return list, nil
	}
	return []domain.AICandidateScore{}, nil
}

func (r *pgxRecruiterAIRepository) SaveGeneratedContent(ctx context.Context, content *domain.AIGeneratedContent) error {
	if content.ID == uuid.Nil {
		content.ID = uuid.New()
	}
	content.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.contents[content.SessionID] = append(r.contents[content.SessionID], *content)
	return nil
}

func (r *pgxRecruiterAIRepository) GetSessionContent(ctx context.Context, sessionID uuid.UUID) ([]domain.AIGeneratedContent, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if list, exists := r.contents[sessionID]; exists {
		return list, nil
	}
	return []domain.AIGeneratedContent{}, nil
}

func (r *pgxRecruiterAIRepository) GetRecruiterSessions(ctx context.Context, orgID uuid.UUID) ([]domain.RecruiterAISession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.RecruiterAISession
	for _, s := range r.sessions {
		if s.OrgID == orgID {
			list = append(list, *s)
		}
	}
	return list, nil
}
