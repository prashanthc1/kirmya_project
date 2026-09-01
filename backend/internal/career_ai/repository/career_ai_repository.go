package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/career_ai/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

type postgresCareerAIRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	sessions        map[uuid.UUID]*domain.CareerSession
	recommendations map[uuid.UUID]*domain.AIRecommendation
	usageLogs       map[uuid.UUID]*domain.AIUsageLog
}

func NewCareerAIRepository(pool *pgxpool.Pool) CareerAIRepository {
	return &postgresCareerAIRepository{
		pool:            pool,
		sessions:        make(map[uuid.UUID]*domain.CareerSession),
		recommendations: make(map[uuid.UUID]*domain.AIRecommendation),
		usageLogs:       make(map[uuid.UUID]*domain.AIUsageLog),
	}
}

func (r *postgresCareerAIRepository) CreateSession(ctx context.Context, session *domain.CareerSession) error {
	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	now := time.Now()
	session.CreatedAt = now
	session.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.sessions[session.ID] = session
		return nil
	}

	contextJSON, err := json.Marshal(session.UserContextSnapshot)
	if err != nil {
		contextJSON = []byte("{}")
	}

	query := `
		INSERT INTO career_sessions (
			id, user_id, session_type, title, active_topic, user_context_snapshot, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err = r.pool.Exec(ctx, query,
		session.ID, session.UserID, session.SessionType, session.Title, session.ActiveTopic,
		contextJSON, session.Status, session.CreatedAt, session.UpdatedAt,
	)
	return err
}

func (r *postgresCareerAIRepository) GetSessionByID(ctx context.Context, id uuid.UUID) (*domain.CareerSession, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if sess, exists := r.sessions[id]; exists {
			sCopy := *sess
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

	query := `
		SELECT id, user_id, session_type, title, active_topic, user_context_snapshot, status, created_at, updated_at
		FROM career_sessions
		WHERE id = $1
	`
	var sess domain.CareerSession
	var contextJSON []byte
	var topic *string
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&sess.ID, &sess.UserID, &sess.SessionType, &sess.Title, &topic,
		&contextJSON, &sess.Status, &sess.CreatedAt, &sess.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("career session not found: %s", id)
		}
		return nil, err
	}
	if topic != nil {
		sess.ActiveTopic = *topic
	}
	if len(contextJSON) > 0 {
		_ = json.Unmarshal(contextJSON, &sess.UserContextSnapshot)
	}

	recs, err := r.GetRecommendationsBySession(ctx, id)
	if err == nil {
		sess.Recommendations = recs
	}
	return &sess, nil
}

func (r *postgresCareerAIRepository) GetUserSessions(ctx context.Context, userID uuid.UUID) ([]domain.CareerSession, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []domain.CareerSession
		for _, sess := range r.sessions {
			if sess.UserID == userID {
				sCopy := *sess
				var recs []domain.AIRecommendation
				for _, rec := range r.recommendations {
					if rec.SessionID == sess.ID {
						recs = append(recs, *rec)
					}
				}
				sCopy.Recommendations = recs
				list = append(list, sCopy)
			}
		}
		return list, nil
	}

	query := `
		SELECT id, user_id, session_type, title, active_topic, user_context_snapshot, status, created_at, updated_at
		FROM career_sessions
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.CareerSession
	for rows.Next() {
		var sess domain.CareerSession
		var contextJSON []byte
		var topic *string
		if err := rows.Scan(
			&sess.ID, &sess.UserID, &sess.SessionType, &sess.Title, &topic,
			&contextJSON, &sess.Status, &sess.CreatedAt, &sess.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if topic != nil {
			sess.ActiveTopic = *topic
		}
		if len(contextJSON) > 0 {
			_ = json.Unmarshal(contextJSON, &sess.UserContextSnapshot)
		}
		recs, _ := r.GetRecommendationsBySession(ctx, sess.ID)
		sess.Recommendations = recs
		list = append(list, sess)
	}
	return list, rows.Err()
}

func (r *postgresCareerAIRepository) SaveRecommendation(ctx context.Context, rec *domain.AIRecommendation) error {
	if rec.ID == uuid.Nil {
		rec.ID = uuid.New()
	}
	now := time.Now()
	rec.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.recommendations[rec.ID] = rec
		return nil
	}

	query := `
		INSERT INTO ai_recommendations (
			id, session_id, user_id, category, title, content_text, priority_score, action_items, bookmarked, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.pool.Exec(ctx, query,
		rec.ID, rec.SessionID, rec.UserID, rec.Category, rec.Title, rec.ContentText,
		rec.PriorityScore, rec.ActionItems, rec.Bookmarked, rec.CreatedAt,
	)
	return err
}

func (r *postgresCareerAIRepository) GetRecommendationsBySession(ctx context.Context, sessionID uuid.UUID) ([]domain.AIRecommendation, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, session_id, user_id, category, title, content_text, priority_score, action_items, bookmarked, created_at
		FROM ai_recommendations
		WHERE session_id = $1
		ORDER BY priority_score DESC, created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.AIRecommendation
	for rows.Next() {
		var rec domain.AIRecommendation
		if err := rows.Scan(
			&rec.ID, &rec.SessionID, &rec.UserID, &rec.Category, &rec.Title,
			&rec.ContentText, &rec.PriorityScore, &rec.ActionItems, &rec.Bookmarked, &rec.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, rec)
	}
	return list, rows.Err()
}

func (r *postgresCareerAIRepository) GetUserRecommendations(ctx context.Context, userID uuid.UUID) ([]domain.AIRecommendation, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, session_id, user_id, category, title, content_text, priority_score, action_items, bookmarked, created_at
		FROM ai_recommendations
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.AIRecommendation
	for rows.Next() {
		var rec domain.AIRecommendation
		if err := rows.Scan(
			&rec.ID, &rec.SessionID, &rec.UserID, &rec.Category, &rec.Title,
			&rec.ContentText, &rec.PriorityScore, &rec.ActionItems, &rec.Bookmarked, &rec.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, rec)
	}
	return list, rows.Err()
}

func (r *postgresCareerAIRepository) LogUsage(ctx context.Context, log *domain.AIUsageLog) error {
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	now := time.Now()
	log.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.usageLogs[log.ID] = log
		return nil
	}

	query := `
		INSERT INTO ai_usage_logs (
			id, user_id, session_id, provider_name, model_name, request_type,
			prompt_tokens, completion_tokens, total_tokens, latency_ms, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.pool.Exec(ctx, query,
		log.ID, log.UserID, log.SessionID, log.ProviderName, log.ModelName, log.RequestType,
		log.PromptTokens, log.CompletionTokens, log.TotalTokens, log.LatencyMS, log.CreatedAt,
	)
	return err
}

func (r *postgresCareerAIRepository) GetUserUsageLogs(ctx context.Context, userID uuid.UUID) ([]domain.AIUsageLog, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, user_id, session_id, provider_name, model_name, request_type,
		       prompt_tokens, completion_tokens, total_tokens, latency_ms, created_at
		FROM ai_usage_logs
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.AIUsageLog
	for rows.Next() {
		var l domain.AIUsageLog
		if err := rows.Scan(
			&l.ID, &l.UserID, &l.SessionID, &l.ProviderName, &l.ModelName, &l.RequestType,
			&l.PromptTokens, &l.CompletionTokens, &l.TotalTokens, &l.LatencyMS, &l.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, l)
	}
	return list, rows.Err()
}
