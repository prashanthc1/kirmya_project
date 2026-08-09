package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/career_companion/domain"
	"kirmya/internal/shared/persistence"

	"github.com/google/uuid"
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

// memoryCompanionRepository satisfies CompanionRepository entirely from process
// memory. It accepts the pool so a SQL implementation can take its place
// without changing any caller, but it never queries it: the data lives and
// dies with this process. Registered in internal/shared/persistence.
type memoryCompanionRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	conversations map[uuid.UUID]*domain.AIConversation
	messages      map[uuid.UUID][]domain.AIMessage
	plans         map[uuid.UUID]*domain.CareerPlan
	userContexts  map[uuid.UUID]*domain.AIUserContext
}

func NewCompanionRepository(pool *pgxpool.Pool) CompanionRepository {
	persistence.RegisterEphemeral(persistence.Ephemeral{
		Module:      "career_companion",
		Data:        "companion conversations, messages, career plans and per-user AI context",
		Consequence: "every chat thread is lost and the companion forgets the user it was advising",
	})

	repo := &memoryCompanionRepository{
		pool:          pool,
		conversations: make(map[uuid.UUID]*domain.AIConversation),
		messages:      make(map[uuid.UUID][]domain.AIMessage),
		plans:         make(map[uuid.UUID]*domain.CareerPlan),
		userContexts:  make(map[uuid.UUID]*domain.AIUserContext),
	}
	repo.seedDefaultData()
	return repo
}

func (r *memoryCompanionRepository) seedDefaultData() {
	now := time.Now()
	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")

	convID := uuid.MustParse("c1111111-1111-1111-1111-111111111111")
	c1 := &domain.AIConversation{
		ID:        convID,
		UserID:    userID,
		Title:     "Career Recovery & Resume Guidance",
		Mode:      domain.ModeCareerChat,
		Status:    "active",
		CreatedAt: now,
		UpdatedAt: now,
	}
	r.conversations[convID] = c1

	msgs := []domain.AIMessage{
		{
			ID:             uuid.New(),
			ConversationID: convID,
			Sender:         domain.SenderUser,
			Content:        "Hi AI Companion, I recently experienced job loss and need help optimizing my resume for senior Go engineer roles.",
			TokensUsed:     24,
			CreatedAt:      now.Add(-10 * time.Minute),
		},
		{
			ID:             uuid.New(),
			ConversationID: convID,
			Sender:         domain.SenderAssistant,
			Content:        "Welcome! I am here to help you navigate this transition. Based on your background in Go & React architecture, I recommend highlighting your recent project where you optimized PostgreSQL queries by 40%.",
			TokensUsed:     48,
			CreatedAt:      now.Add(-9 * time.Minute),
		},
	}
	r.messages[convID] = msgs

	planID := uuid.New()
	p1 := &domain.CareerPlan{
		ID:           planID,
		UserID:       userID,
		TargetRole:   "Principal Backend Architect",
		TargetSalary: "$180,000 - $220,000",
		CurrentLevel: "Senior Software Engineer",
		Milestones: []domain.CareerMilestone{
			{StepNumber: 1, Title: "ATS Resume & Portfolio Polish", Description: "Highlight high-throughput Go microservices", Duration: "2 Weeks", KeySkills: []string{"Go", "PostgreSQL"}, Status: "completed"},
			{StepNumber: 2, Title: "System Design Deep Dive", Description: "Master rate limiting & Kafka event streams", Duration: "3 Weeks", KeySkills: []string{"System Design", "Kafka"}, Status: "in_progress"},
		},
		ProgressPercentage: 45,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	r.plans[userID] = p1

	r.userContexts[userID] = &domain.AIUserContext{
		ID:                uuid.New(),
		UserID:            userID,
		CareerGoals:       []string{"Principal Architect Role", "Remote Position", "Team Mentorship"},
		SkillGaps:         []string{"Kafka Event Streaming", "Kubernetes Operator SDK"},
		PreferredIndustry: "Cloud SaaS & Fintech",
		MemorySummary:     "Candidate has 5+ years Go/React experience, recovering from recent transition, targeting $180k+ Principal Architect roles.",
		UpdatedAt:         now,
	}
}

func (r *memoryCompanionRepository) CreateConversation(ctx context.Context, conv *domain.AIConversation) error {
	if conv.ID == uuid.Nil {
		conv.ID = uuid.New()
	}
	conv.CreatedAt = time.Now()
	conv.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.conversations[conv.ID] = conv
	return nil
}

func (r *memoryCompanionRepository) GetConversationByID(ctx context.Context, id uuid.UUID) (*domain.AIConversation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if conv, exists := r.conversations[id]; exists {
		convCopy := *conv
		if msgs, existsMsgs := r.messages[id]; existsMsgs {
			convCopy.Messages = msgs
		}
		return &convCopy, nil
	}
	return nil, fmt.Errorf("conversation not found: %s", id)
}

func (r *memoryCompanionRepository) GetUserConversations(ctx context.Context, userID uuid.UUID) ([]domain.AIConversation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.AIConversation
	for _, conv := range r.conversations {
		if conv.UserID == userID {
			convCopy := *conv
			if msgs, existsMsgs := r.messages[conv.ID]; existsMsgs {
				convCopy.Messages = msgs
			}
			list = append(list, convCopy)
		}
	}
	return list, nil
}

func (r *memoryCompanionRepository) SaveMessage(ctx context.Context, msg *domain.AIMessage) error {
	if msg.ID == uuid.Nil {
		msg.ID = uuid.New()
	}
	msg.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.messages[msg.ConversationID] = append(r.messages[msg.ConversationID], *msg)
	return nil
}

func (r *memoryCompanionRepository) GetConversationMessages(ctx context.Context, conversationID uuid.UUID) ([]domain.AIMessage, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if msgs, exists := r.messages[conversationID]; exists {
		return msgs, nil
	}
	return []domain.AIMessage{}, nil
}

func (r *memoryCompanionRepository) SaveCareerPlan(ctx context.Context, plan *domain.CareerPlan) error {
	if plan.ID == uuid.Nil {
		plan.ID = uuid.New()
	}
	plan.CreatedAt = time.Now()
	plan.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.plans[plan.UserID] = plan
	return nil
}

func (r *memoryCompanionRepository) GetLatestCareerPlan(ctx context.Context, userID uuid.UUID) (*domain.CareerPlan, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if plan, exists := r.plans[userID]; exists {
		planCopy := *plan
		return &planCopy, nil
	}
	return nil, nil
}

func (r *memoryCompanionRepository) SaveUserContext(ctx context.Context, uctx *domain.AIUserContext) error {
	if uctx.ID == uuid.Nil {
		uctx.ID = uuid.New()
	}
	uctx.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.userContexts[uctx.UserID] = uctx
	return nil
}

func (r *memoryCompanionRepository) GetUserContext(ctx context.Context, userID uuid.UUID) (*domain.AIUserContext, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if uctx, exists := r.userContexts[userID]; exists {
		uctxCopy := *uctx
		return &uctxCopy, nil
	}
	return &domain.AIUserContext{
		ID:                uuid.New(),
		UserID:            userID,
		CareerGoals:       []string{"Career Growth & Recovery"},
		SkillGaps:         []string{"System Design"},
		PreferredIndustry: "Tech & Software",
		MemorySummary:     "New user starting AI career guidance.",
		UpdatedAt:         time.Now(),
	}, nil
}
