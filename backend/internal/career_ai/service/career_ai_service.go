package service

import (
	"context"
	"fmt"
	"time"

	"kirmya/internal/career_ai/domain"
	"kirmya/internal/career_ai/prompts"
	"kirmya/internal/career_ai/provider"
	"kirmya/internal/career_ai/repository"

	"github.com/google/uuid"
)

type CareerAIService interface {
	GenerateCareerAdvice(ctx context.Context, userID uuid.UUID, req domain.GenerateCareerRequest) (*domain.AIRecommendation, error)
	AnalyzeResume(ctx context.Context, userID uuid.UUID, req domain.ResumeCritiqueRequest) (*domain.AIRecommendation, error)
	IdentifySkillGaps(ctx context.Context, userID uuid.UUID, req domain.SkillGapRequest) (*domain.AIRecommendation, error)
	GenerateJobGuidance(ctx context.Context, userID uuid.UUID, req domain.JobGuidanceRequest) (*domain.AIRecommendation, error)
	GenerateInterviewPrep(ctx context.Context, userID uuid.UUID, req domain.InterviewPrepRequest) (*domain.AIRecommendation, error)

	GetUserRecommendations(ctx context.Context, userID uuid.UUID) ([]domain.AIRecommendation, error)
	GetUserUsage(ctx context.Context, userID uuid.UUID) ([]domain.AIUsageLog, error)
}

type careerAIService struct {
	repo          repository.CareerAIRepository
	aiProvider    provider.CareerAIProvider
	promptManager prompts.PromptManager
}

func NewCareerAIService(repo repository.CareerAIRepository, aiProv provider.CareerAIProvider, pm prompts.PromptManager) CareerAIService {
	return &careerAIService{
		repo:          repo,
		aiProvider:    aiProv,
		promptManager: pm,
	}
}

func (s *careerAIService) logUsage(ctx context.Context, userID uuid.UUID, sessionID *uuid.UUID, reqType string, payload *provider.AIResultPayload, start time.Time) {
	latency := int(time.Since(start).Milliseconds())
	if latency == 0 {
		latency = 120
	}

	log := &domain.AIUsageLog{
		ID:               uuid.New(),
		UserID:           userID,
		SessionID:        sessionID,
		ProviderName:     s.aiProvider.GetProviderName(),
		ModelName:        payload.ModelName,
		RequestType:      reqType,
		PromptTokens:     payload.PromptTokens,
		CompletionTokens: payload.CompletionTokens,
		TotalTokens:      payload.PromptTokens + payload.CompletionTokens,
		LatencyMS:        latency,
		CreatedAt:        time.Now(),
	}
	_ = s.repo.LogUsage(ctx, log)
}

func (s *careerAIService) getOrCreateSession(ctx context.Context, userID uuid.UUID, sessionType, title string, userCtx domain.UserContext) (*domain.CareerSession, error) {
	sessions, err := s.repo.GetUserSessions(ctx, userID)
	if err == nil {
		for _, sess := range sessions {
			if sess.SessionType == sessionType && sess.Status == "active" {
				return &sess, nil
			}
		}
	}

	sess := &domain.CareerSession{
		ID:                  uuid.New(),
		UserID:              userID,
		SessionType:         sessionType,
		Title:               title,
		ActiveTopic:         userCtx.TargetRole,
		UserContextSnapshot: userCtx,
		Status:              "active",
	}

	if err := s.repo.CreateSession(ctx, sess); err != nil {
		return nil, err
	}
	return sess, nil
}

func (s *careerAIService) GenerateCareerAdvice(ctx context.Context, userID uuid.UUID, req domain.GenerateCareerRequest) (*domain.AIRecommendation, error) {
	start := time.Now()
	sess, err := s.getOrCreateSession(ctx, userID, domain.SessionCareerRec, "Career Trajectory Strategy", req.UserContext)
	if err != nil {
		return nil, err
	}

	_, userPrompt := s.promptManager.BuildCareerTrajectoryPrompt(req.UserContext, req.Topic)
	res, err := s.aiProvider.GenerateCareerAdvice(ctx, req.UserContext, userPrompt)
	if err != nil {
		return nil, fmt.Errorf("AI provider failed: %w", err)
	}

	s.logUsage(ctx, userID, &sess.ID, "career_advice", res, start)

	rec := &domain.AIRecommendation{
		ID:            uuid.New(),
		SessionID:     sess.ID,
		UserID:        userID,
		Category:      "career_trajectory",
		Title:         res.Title,
		ContentText:   res.Content,
		PriorityScore: res.Priority,
		ActionItems:   res.ActionItems,
		Bookmarked:    false,
	}

	if err := s.repo.SaveRecommendation(ctx, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

func (s *careerAIService) AnalyzeResume(ctx context.Context, userID uuid.UUID, req domain.ResumeCritiqueRequest) (*domain.AIRecommendation, error) {
	start := time.Now()
	userCtx := domain.UserContext{TargetRole: req.TargetRole, ResumeSnippet: req.ResumeText}
	sess, err := s.getOrCreateSession(ctx, userID, domain.SessionResume, "Resume Critique & ATS Optimization", userCtx)
	if err != nil {
		return nil, err
	}

	res, err := s.aiProvider.AnalyzeResume(ctx, req.ResumeText, req.TargetRole)
	if err != nil {
		return nil, fmt.Errorf("AI provider resume analysis failed: %w", err)
	}

	s.logUsage(ctx, userID, &sess.ID, "resume_critique", res, start)

	rec := &domain.AIRecommendation{
		ID:            uuid.New(),
		SessionID:     sess.ID,
		UserID:        userID,
		Category:      "resume_fix",
		Title:         res.Title,
		ContentText:   res.Content,
		PriorityScore: res.Priority,
		ActionItems:   res.ActionItems,
		Bookmarked:    true,
	}

	if err := s.repo.SaveRecommendation(ctx, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

func (s *careerAIService) IdentifySkillGaps(ctx context.Context, userID uuid.UUID, req domain.SkillGapRequest) (*domain.AIRecommendation, error) {
	start := time.Now()
	userCtx := domain.UserContext{TargetRole: req.TargetRole, CurrentSkills: req.CurrentSkills}
	sess, err := s.getOrCreateSession(ctx, userID, domain.SessionSkillGap, "Skill Gap & Bridge Strategy", userCtx)
	if err != nil {
		return nil, err
	}

	res, err := s.aiProvider.IdentifySkillGaps(ctx, req.CurrentSkills, req.TargetRole)
	if err != nil {
		return nil, fmt.Errorf("AI provider skill gap analysis failed: %w", err)
	}

	s.logUsage(ctx, userID, &sess.ID, "skill_gap", res, start)

	rec := &domain.AIRecommendation{
		ID:            uuid.New(),
		SessionID:     sess.ID,
		UserID:        userID,
		Category:      "skill_bridge",
		Title:         res.Title,
		ContentText:   res.Content,
		PriorityScore: res.Priority,
		ActionItems:   res.ActionItems,
		Bookmarked:    false,
	}

	if err := s.repo.SaveRecommendation(ctx, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

func (s *careerAIService) GenerateJobGuidance(ctx context.Context, userID uuid.UUID, req domain.JobGuidanceRequest) (*domain.AIRecommendation, error) {
	start := time.Now()
	userCtx := domain.UserContext{TargetRole: req.TargetRole}
	sess, err := s.getOrCreateSession(ctx, userID, domain.SessionJobGuide, "Job Search & Outreach Guidance", userCtx)
	if err != nil {
		return nil, err
	}

	res, err := s.aiProvider.GenerateCareerAdvice(ctx, userCtx, "Job search and recruiter outreach strategy")
	if err != nil {
		return nil, err
	}
	res.Title = fmt.Sprintf("Targeted Job Search Strategy for %s", req.TargetRole)

	s.logUsage(ctx, userID, &sess.ID, "job_guidance", res, start)

	rec := &domain.AIRecommendation{
		ID:            uuid.New(),
		SessionID:     sess.ID,
		UserID:        userID,
		Category:      "search_strategy",
		Title:         res.Title,
		ContentText:   res.Content,
		PriorityScore: res.Priority,
		ActionItems:   res.ActionItems,
		Bookmarked:    false,
	}

	if err := s.repo.SaveRecommendation(ctx, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

func (s *careerAIService) GenerateInterviewPrep(ctx context.Context, userID uuid.UUID, req domain.InterviewPrepRequest) (*domain.AIRecommendation, error) {
	start := time.Now()
	focus := req.FocusArea
	if focus == "" {
		focus = "technical & behavioral"
	}
	userCtx := domain.UserContext{TargetRole: req.TargetRole}
	sess, err := s.getOrCreateSession(ctx, userID, domain.SessionInterview, "Interview Preparation Coach", userCtx)
	if err != nil {
		return nil, err
	}

	res, err := s.aiProvider.GenerateInterviewPrep(ctx, req.TargetRole, focus)
	if err != nil {
		return nil, fmt.Errorf("AI provider interview prep failed: %w", err)
	}

	s.logUsage(ctx, userID, &sess.ID, "interview_prep", res, start)

	rec := &domain.AIRecommendation{
		ID:            uuid.New(),
		SessionID:     sess.ID,
		UserID:        userID,
		Category:      "interview_hint",
		Title:         res.Title,
		ContentText:   res.Content,
		PriorityScore: res.Priority,
		ActionItems:   res.ActionItems,
		Bookmarked:    true,
	}

	if err := s.repo.SaveRecommendation(ctx, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

func (s *careerAIService) GetUserRecommendations(ctx context.Context, userID uuid.UUID) ([]domain.AIRecommendation, error) {
	return s.repo.GetUserRecommendations(ctx, userID)
}

func (s *careerAIService) GetUserUsage(ctx context.Context, userID uuid.UUID) ([]domain.AIUsageLog, error) {
	return s.repo.GetUserUsageLogs(ctx, userID)
}
