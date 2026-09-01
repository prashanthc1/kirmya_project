package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/career_companion/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CompanionRepository interface {
	CreateConversation(ctx context.Context, conv *domain.AIConversation) error
	GetConversationByID(ctx context.Context, id uuid.UUID) (*domain.AIConversation, error)
	GetUserConversations(ctx context.Context, userID uuid.UUID) ([]domain.AIConversation, error)

	SaveMessage(ctx context.Context, msg *domain.AIMessage) error
	GetConversationMessages(ctx context.Context, conversationID uuid.UUID) ([]domain.AIMessage, error)

	SaveCareerPlan(ctx context.Context, plan *domain.CareerPlan) error
	GetLatestCareerPlan(ctx context.Context, userID uuid.UUID) (*domain.CareerPlan, error)

	SaveUserContext(ctx context.Context, uctx *domain.AIUserContext) error
	GetUserContext(ctx context.Context, userID uuid.UUID) (*domain.AIUserContext, error)
}

type postgresCompanionRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	conversations map[uuid.UUID]*domain.AIConversation
	messages      map[uuid.UUID][]domain.AIMessage
	plans         map[uuid.UUID]*domain.CareerPlan
	userContexts  map[uuid.UUID]*domain.AIUserContext
}

func NewCompanionRepository(pool *pgxpool.Pool) CompanionRepository {
	repo := &postgresCompanionRepository{
		pool:          pool,
		conversations: make(map[uuid.UUID]*domain.AIConversation),
		messages:      make(map[uuid.UUID][]domain.AIMessage),
		plans:         make(map[uuid.UUID]*domain.CareerPlan),
		userContexts:  make(map[uuid.UUID]*domain.AIUserContext),
	}
	repo.seedDefaultDataIfMemory()
	return repo
}

func (r *postgresCompanionRepository) CreateConversation(ctx context.Context, conv *domain.AIConversation) error {
	if conv.ID == uuid.Nil {
		conv.ID = uuid.New()
	}
	now := time.Now()
	conv.CreatedAt = now
	conv.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.conversations[conv.ID] = conv
		return nil
	}

	query := `
		INSERT INTO ai_conversations (
			id, user_id, title, mode, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.pool.Exec(ctx, query,
		conv.ID, conv.UserID, conv.Title, conv.Mode, conv.Status, conv.CreatedAt, conv.UpdatedAt,
	)
	return err
}

func (r *postgresCompanionRepository) GetConversationByID(ctx context.Context, id uuid.UUID) (*domain.AIConversation, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if conv, exists := r.conversations[id]; exists {
			cCopy := *conv
			cCopy.Messages = r.messages[id]
			return &cCopy, nil
		}
		return nil, fmt.Errorf("conversation not found: %s", id)
	}

	query := `
		SELECT id, user_id, title, mode, status, created_at, updated_at
		FROM ai_conversations
		WHERE id = $1
	`
	var conv domain.AIConversation
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&conv.ID, &conv.UserID, &conv.Title, &conv.Mode, &conv.Status, &conv.CreatedAt, &conv.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("conversation not found: %s", id)
		}
		return nil, err
	}

	msgs, err := r.GetConversationMessages(ctx, id)
	if err == nil {
		conv.Messages = msgs
	}
	return &conv, nil
}

func (r *postgresCompanionRepository) GetUserConversations(ctx context.Context, userID uuid.UUID) ([]domain.AIConversation, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []domain.AIConversation
		for _, conv := range r.conversations {
			if conv.UserID == userID {
				cCopy := *conv
				cCopy.Messages = r.messages[conv.ID]
				list = append(list, cCopy)
			}
		}
		return list, nil
	}

	query := `
		SELECT id, user_id, title, mode, status, created_at, updated_at
		FROM ai_conversations
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.AIConversation
	for rows.Next() {
		var conv domain.AIConversation
		if err := rows.Scan(
			&conv.ID, &conv.UserID, &conv.Title, &conv.Mode, &conv.Status, &conv.CreatedAt, &conv.UpdatedAt,
		); err != nil {
			return nil, err
		}
		msgs, _ := r.GetConversationMessages(ctx, conv.ID)
		conv.Messages = msgs
		list = append(list, conv)
	}
	return list, rows.Err()
}

func (r *postgresCompanionRepository) SaveMessage(ctx context.Context, msg *domain.AIMessage) error {
	if msg.ID == uuid.Nil {
		msg.ID = uuid.New()
	}
	now := time.Now()
	msg.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.messages[msg.ConversationID] = append(r.messages[msg.ConversationID], *msg)
		if conv, ok := r.conversations[msg.ConversationID]; ok {
			conv.UpdatedAt = now
		}
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) // nolint:errcheck

	query := `
		INSERT INTO ai_messages (
			id, conversation_id, sender, content, tokens_used, created_at
		) VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err = tx.Exec(ctx, query,
		msg.ID, msg.ConversationID, msg.Sender, msg.Content, msg.TokensUsed, msg.CreatedAt,
	)
	if err != nil {
		return err
	}

	updateConvQuery := `
		UPDATE ai_conversations
		SET updated_at = $1
		WHERE id = $2
	`
	_, err = tx.Exec(ctx, updateConvQuery, now, msg.ConversationID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *postgresCompanionRepository) GetConversationMessages(ctx context.Context, conversationID uuid.UUID) ([]domain.AIMessage, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.messages[conversationID], nil
	}

	query := `
		SELECT id, conversation_id, sender, content, tokens_used, created_at
		FROM ai_messages
		WHERE conversation_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.AIMessage
	for rows.Next() {
		var msg domain.AIMessage
		if err := rows.Scan(
			&msg.ID, &msg.ConversationID, &msg.Sender, &msg.Content, &msg.TokensUsed, &msg.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, msg)
	}
	return list, rows.Err()
}

func (r *postgresCompanionRepository) SaveCareerPlan(ctx context.Context, plan *domain.CareerPlan) error {
	if plan.ID == uuid.Nil {
		plan.ID = uuid.New()
	}
	now := time.Now()
	plan.CreatedAt = now
	plan.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.plans[plan.UserID] = plan
		return nil
	}

	milestonesJSON, err := json.Marshal(plan.Milestones)
	if err != nil {
		milestonesJSON = []byte("[]")
	}

	query := `
		INSERT INTO career_plans (
			id, user_id, target_role, target_salary, current_level, milestones, progress_percentage, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err = r.pool.Exec(ctx, query,
		plan.ID, plan.UserID, plan.TargetRole, plan.TargetSalary, plan.CurrentLevel,
		milestonesJSON, plan.ProgressPercentage, plan.CreatedAt, plan.UpdatedAt,
	)
	return err
}

func (r *postgresCompanionRepository) GetLatestCareerPlan(ctx context.Context, userID uuid.UUID) (*domain.CareerPlan, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if plan, exists := r.plans[userID]; exists {
			pCopy := *plan
			return &pCopy, nil
		}
		return nil, nil
	}

	query := `
		SELECT id, user_id, target_role, target_salary, current_level, milestones, progress_percentage, created_at, updated_at
		FROM career_plans
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	var plan domain.CareerPlan
	var milestonesJSON []byte
	var salary, level *string
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&plan.ID, &plan.UserID, &plan.TargetRole, &salary, &level,
		&milestonesJSON, &plan.ProgressPercentage, &plan.CreatedAt, &plan.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if salary != nil {
		plan.TargetSalary = *salary
	}
	if level != nil {
		plan.CurrentLevel = *level
	}
	if len(milestonesJSON) > 0 {
		_ = json.Unmarshal(milestonesJSON, &plan.Milestones)
	}
	return &plan, nil
}

func (r *postgresCompanionRepository) SaveUserContext(ctx context.Context, uctx *domain.AIUserContext) error {
	if uctx.ID == uuid.Nil {
		uctx.ID = uuid.New()
	}
	now := time.Now()
	uctx.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.userContexts[uctx.UserID] = uctx
		return nil
	}

	goalsJSON, err := json.Marshal(uctx.CareerGoals)
	if err != nil {
		goalsJSON = []byte("[]")
	}
	gapsJSON, err := json.Marshal(uctx.SkillGaps)
	if err != nil {
		gapsJSON = []byte("[]")
	}

	query := `
		INSERT INTO ai_user_context (
			id, user_id, career_goals, skill_gaps, preferred_industry, memory_summary, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id) DO UPDATE SET
			career_goals = EXCLUDED.career_goals,
			skill_gaps = EXCLUDED.skill_gaps,
			preferred_industry = EXCLUDED.preferred_industry,
			memory_summary = EXCLUDED.memory_summary,
			updated_at = EXCLUDED.updated_at
	`
	_, err = r.pool.Exec(ctx, query,
		uctx.ID, uctx.UserID, goalsJSON, gapsJSON, uctx.PreferredIndustry, uctx.MemorySummary, uctx.UpdatedAt,
	)
	return err
}

func (r *postgresCompanionRepository) GetUserContext(ctx context.Context, userID uuid.UUID) (*domain.AIUserContext, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if uctx, exists := r.userContexts[userID]; exists {
			uCopy := *uctx
			return &uCopy, nil
		}
		return &domain.AIUserContext{
			ID:                uuid.New(),
			UserID:            userID,
			CareerGoals:       []string{"Principal Engineer Transition", "Remote First"},
			SkillGaps:         []string{"Distributed Systems Tuning", "gRPC Mesh"},
			PreferredIndustry: "Cloud Infrastructure / Fintech",
			MemorySummary:     "Prefers concise answers and pragmatic engineering trade-offs.",
			UpdatedAt:         time.Now(),
		}, nil
	}

	query := `
		SELECT id, user_id, career_goals, skill_gaps, preferred_industry, memory_summary, updated_at
		FROM ai_user_context
		WHERE user_id = $1
	`
	var uctx domain.AIUserContext
	var goalsJSON, gapsJSON []byte
	var industry, memory *string
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&uctx.ID, &uctx.UserID, &goalsJSON, &gapsJSON, &industry, &memory, &uctx.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.AIUserContext{
				ID:                uuid.New(),
				UserID:            userID,
				CareerGoals:       []string{"Principal Engineer Transition", "Remote First"},
				SkillGaps:         []string{"Distributed Systems Tuning", "gRPC Mesh"},
				PreferredIndustry: "Cloud Infrastructure / Fintech",
				MemorySummary:     "Prefers concise answers and pragmatic engineering trade-offs.",
				UpdatedAt:         time.Now(),
			}, nil
		}
		return nil, err
	}
	if industry != nil {
		uctx.PreferredIndustry = *industry
	}
	if memory != nil {
		uctx.MemorySummary = *memory
	}
	if len(goalsJSON) > 0 {
		_ = json.Unmarshal(goalsJSON, &uctx.CareerGoals)
	}
	if len(gapsJSON) > 0 {
		_ = json.Unmarshal(gapsJSON, &uctx.SkillGaps)
	}
	return &uctx, nil
}

func (r *postgresCompanionRepository) seedDefaultDataIfMemory() {
	defaultConvID := uuid.MustParse("33333333-3333-3333-3333-333333333301")
	sampleUserID := uuid.MustParse("00000000-0000-0000-0000-000000000001")

	r.conversations[defaultConvID] = &domain.AIConversation{
		ID:        defaultConvID,
		UserID:    sampleUserID,
		Title:     "Targeting Staff Platform Engineer Roles",
		Mode:      domain.ModeCareerChat,
		Status:    "active",
		CreatedAt: time.Now().Add(-2 * time.Hour),
		UpdatedAt: time.Now().Add(-15 * time.Minute),
	}

	r.messages[defaultConvID] = []domain.AIMessage{
		{
			ID:             uuid.New(),
			ConversationID: defaultConvID,
			Sender:         domain.SenderAssistant,
			Content:        "Hello! I am your Kirmya Career Companion. How can I help propel your career forward today?",
			TokensUsed:     45,
			CreatedAt:      time.Now().Add(-2 * time.Hour),
		},
	}
}
