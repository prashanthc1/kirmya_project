package repository

import (
	"context"
	"encoding/json"
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
	jobID := uuid.MustParse("b1111111-1111-1111-1111-111111111111")

	sessID := uuid.MustParse("a1111111-1111-1111-1111-111111111111")
	s1 := &domain.RecruiterAISession{
		ID:          sessID,
		OrgID:       orgID,
		RecruiterID: recruiterID,
		JobID:       jobID,
		SessionType: domain.SessionTypeRanking,
		CreatedAt:   now,
	}
	r.sessions[sessID] = s1

	candID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	scoresList := []domain.AICandidateScore{
		{
			ID:             uuid.New(),
			SessionID:      sessID,
			CandidateID:    candID,
			CandidateName:  "Alex Rivera",
			JobTitle:       "Senior Go Backend Architect",
			RankPosition:   1,
			FitScore:       96,
			Strengths:      []string{"5+ Yrs Go Microservices", "PostgreSQL GIN Index Tuning", "High-Throughput REST APIs"},
			RedFlags:       []string{},
			MatchRationale: "Top-ranked candidate with 96% direct skill & experience alignment for Senior Go Architect role.",
			CreatedAt:      now,
		},
	}
	r.scores[sessID] = scoresList

	contentList := []domain.AIGeneratedContent{
		{
			ID:            uuid.New(),
			SessionID:     sessID,
			ContentType:   "interview_questions",
			GeneratedText: "1. Explain how you manage PostgreSQL connection pool contention under 50,000 req/sec in Go.\n2. Walk through a recent distributed microservice architecture you designed.",
			CreatedAt:     now,
		},
	}
	r.contents[sessID] = contentList
}

func (r *pgxRecruiterAIRepository) CreateSession(ctx context.Context, sess *domain.RecruiterAISession) error {
	if sess.ID == uuid.Nil {
		sess.ID = uuid.New()
	}
	sess.CreatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO recruiter_ai_sessions (id, org_id, recruiter_id, job_id, session_type, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.pool.Exec(ctx, query, sess.ID, sess.OrgID, sess.RecruiterID, sess.JobID, sess.SessionType, sess.CreatedAt)
		if err != nil {
			return err
		}
	}

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

	if r.pool != nil {
		for _, s := range scores {
			sID := s.ID
			if sID == uuid.Nil {
				sID = uuid.New()
			}
			strengthsBytes, _ := json.Marshal(s.Strengths)
			redFlagsBytes, _ := json.Marshal(s.RedFlags)
			query := `INSERT INTO ai_candidate_scores (id, session_id, candidate_id, job_id, rank_position, fit_score, strengths, red_flags, match_rationale, created_at) 
			          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
			_, _ = r.pool.Exec(ctx, query, sID, s.SessionID, s.CandidateID, uuid.Nil, s.RankPosition, s.FitScore, strengthsBytes, redFlagsBytes, s.MatchRationale, time.Now())
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.scores[sessionID] = append(r.scores[sessionID], scores...)
	return nil
}

func (r *pgxRecruiterAIRepository) GetSessionCandidateScores(ctx context.Context, sessionID uuid.UUID) ([]domain.AICandidateScore, error) {
	if r.pool != nil {
		query := `SELECT id, session_id, candidate_id, rank_position, fit_score, strengths, red_flags, match_rationale, created_at 
		          FROM ai_candidate_scores WHERE session_id = $1 ORDER BY rank_position ASC`
		rows, err := r.pool.Query(ctx, query, sessionID)
		if err == nil {
			defer rows.Close()
			var list []domain.AICandidateScore
			for rows.Next() {
				var s domain.AICandidateScore
				var sBytes, rBytes []byte
				if err := rows.Scan(&s.ID, &s.SessionID, &s.CandidateID, &s.RankPosition, &s.FitScore, &sBytes, &rBytes, &s.MatchRationale, &s.CreatedAt); err == nil {
					_ = json.Unmarshal(sBytes, &s.Strengths)
					_ = json.Unmarshal(rBytes, &s.RedFlags)
					list = append(list, s)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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

	if r.pool != nil {
		query := `INSERT INTO ai_generated_content (id, session_id, content_type, generated_text, created_at) 
		          VALUES ($1, $2, $3, $4, $5)`
		_, err := r.pool.Exec(ctx, query, content.ID, content.SessionID, content.ContentType, content.GeneratedText, content.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.contents[content.SessionID] = append(r.contents[content.SessionID], *content)
	return nil
}

func (r *pgxRecruiterAIRepository) GetSessionContent(ctx context.Context, sessionID uuid.UUID) ([]domain.AIGeneratedContent, error) {
	if r.pool != nil {
		query := `SELECT id, session_id, content_type, generated_text, created_at FROM ai_generated_content WHERE session_id = $1 ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query, sessionID)
		if err == nil {
			defer rows.Close()
			var list []domain.AIGeneratedContent
			for rows.Next() {
				var c domain.AIGeneratedContent
				if err := rows.Scan(&c.ID, &c.SessionID, &c.ContentType, &c.GeneratedText, &c.CreatedAt); err == nil {
					list = append(list, c)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if list, exists := r.contents[sessionID]; exists {
		return list, nil
	}
	return []domain.AIGeneratedContent{}, nil
}

func (r *pgxRecruiterAIRepository) GetRecruiterSessions(ctx context.Context, orgID uuid.UUID) ([]domain.RecruiterAISession, error) {
	if r.pool != nil {
		query := `SELECT id, org_id, recruiter_id, job_id, session_type, created_at FROM recruiter_ai_sessions WHERE org_id = $1 ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query, orgID)
		if err == nil {
			defer rows.Close()
			var list []domain.RecruiterAISession
			for rows.Next() {
				var s domain.RecruiterAISession
				if err := rows.Scan(&s.ID, &s.OrgID, &s.RecruiterID, &s.JobID, &s.SessionType, &s.CreatedAt); err == nil {
					list = append(list, s)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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
