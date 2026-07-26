package service

import (
	"context"
	"time"

	"kirmya/internal/career_companion/domain"
	"kirmya/internal/career_companion/prompt"
	"kirmya/internal/career_companion/provider"
	"kirmya/internal/career_companion/repository"

	"github.com/google/uuid"
)

type CompanionService interface {
	CreateConversation(ctx context.Context, userID uuid.UUID, payload domain.CreateConversationPayload) (*domain.AIConversation, error)
	SendMessage(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, payload domain.SendMessagePayload) (*domain.AIMessage, error)
	GetUserConversations(ctx context.Context, userID uuid.UUID) ([]domain.AIConversation, error)

	GenerateRoadmap(ctx context.Context, userID uuid.UUID, payload domain.GenerateRoadmapPayload) (*domain.CareerPlan, error)
	GetLatestCareerPlan(ctx context.Context, userID uuid.UUID) (*domain.CareerPlan, error)
	GetUserContext(ctx context.Context, userID uuid.UUID) (*domain.AIUserContext, error)
}

type companionService struct {
	repo       repository.CompanionRepository
	aiProvider provider.CareerAIProvider
	promptMgr  *prompt.PromptManager
}

func NewCompanionService(repo repository.CompanionRepository, aiProvider provider.CareerAIProvider, promptMgr *prompt.PromptManager) CompanionService {
	return &companionService{
		repo:       repo,
		aiProvider: aiProvider,
		promptMgr:  promptMgr,
	}
}

func (s *companionService) CreateConversation(ctx context.Context, userID uuid.UUID, payload domain.CreateConversationPayload) (*domain.AIConversation, error) {
	mode := payload.Mode
	if mode == "" {
		mode = domain.ModeCareerChat
	}
	title := payload.Title
	if title == "" {
		title = "New Career Guidance Session"
	}

	conv := &domain.AIConversation{
		ID:        uuid.New(),
		UserID:    userID,
		Title:     title,
		Mode:      mode,
		Status:    "active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.CreateConversation(ctx, conv); err != nil {
		return nil, err
	}
	return conv, nil
}

func (s *companionService) SendMessage(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, payload domain.SendMessagePayload) (*domain.AIMessage, error) {
	conv, err := s.repo.GetConversationByID(ctx, conversationID)
	if err != nil {
		return nil, err
	}

	// 1. Save user message
	userMsg := &domain.AIMessage{
		ID:             uuid.New(),
		ConversationID: conversationID,
		Sender:         domain.SenderUser,
		Content:        payload.Content,
		TokensUsed:     len(payload.Content) / 4,
		CreatedAt:      time.Now(),
	}
	_ = s.repo.SaveMessage(ctx, userMsg)

	// 2. Fetch user career memory context
	uctx, _ := s.repo.GetUserContext(ctx, userID)
	memSummary := ""
	if uctx != nil {
		memSummary = uctx.MemorySummary
	}

	// 3. Build system prompt & call AI provider
	systemPrompt := s.promptMgr.GetSystemPrompt(conv.Mode, memSummary)
	history, _ := s.repo.GetConversationMessages(ctx, conversationID)

	aiText, tokens, err := s.aiProvider.GenerateResponse(ctx, systemPrompt, payload.Content, history)
	if err != nil {
		return nil, err
	}

	// 4. Save assistant response
	aiMsg := &domain.AIMessage{
		ID:             uuid.New(),
		ConversationID: conversationID,
		Sender:         domain.SenderAssistant,
		Content:        aiText,
		TokensUsed:     tokens,
		CreatedAt:      time.Now(),
	}
	_ = s.repo.SaveMessage(ctx, aiMsg)

	return aiMsg, nil
}

func (s *companionService) GetUserConversations(ctx context.Context, userID uuid.UUID) ([]domain.AIConversation, error) {
	return s.repo.GetUserConversations(ctx, userID)
}

func (s *companionService) GenerateRoadmap(ctx context.Context, userID uuid.UUID, payload domain.GenerateRoadmapPayload) (*domain.CareerPlan, error) {
	milestones, err := s.aiProvider.GenerateStructuredRoadmap(ctx, payload.TargetRole, payload.CurrentLevel)
	if err != nil {
		return nil, err
	}

	salary := payload.TargetSalary
	if salary == "" {
		salary = "$180,000 - $220,000"
	}
	currentLevel := payload.CurrentLevel
	if currentLevel == "" {
		currentLevel = "Senior Software Engineer"
	}

	plan := &domain.CareerPlan{
		ID:                 uuid.New(),
		UserID:             userID,
		TargetRole:         payload.TargetRole,
		TargetSalary:       salary,
		CurrentLevel:       currentLevel,
		Milestones:         milestones,
		ProgressPercentage: 25,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.repo.SaveCareerPlan(ctx, plan); err != nil {
		return nil, err
	}
	return plan, nil
}

func (s *companionService) GetLatestCareerPlan(ctx context.Context, userID uuid.UUID) (*domain.CareerPlan, error) {
	return s.repo.GetLatestCareerPlan(ctx, userID)
}

func (s *companionService) GetUserContext(ctx context.Context, userID uuid.UUID) (*domain.AIUserContext, error) {
	return s.repo.GetUserContext(ctx, userID)
}
