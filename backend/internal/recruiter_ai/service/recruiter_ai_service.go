package service

import (
	"context"
	"fmt"
	"time"

	"kirmya/internal/recruiter_ai/domain"
	"kirmya/internal/recruiter_ai/repository"

	"github.com/google/uuid"
)

type RecruiterAIService interface {
	RankCandidates(ctx context.Context, orgID, recruiterID uuid.UUID, payload domain.RankCandidatesPayload) (*domain.RecruiterAISession, []domain.AICandidateScore, error)
	GenerateInterviewQuestions(ctx context.Context, orgID, recruiterID uuid.UUID, payload domain.GenerateQuestionsPayload) (*domain.AIGeneratedContent, error)
	OptimizeJobDescription(ctx context.Context, orgID, recruiterID uuid.UUID, payload domain.OptimizeJDPayload) (*domain.AIGeneratedContent, error)
	DraftOutreachEmail(ctx context.Context, orgID, recruiterID uuid.UUID, payload domain.OutreachEmailPayload) (*domain.AIGeneratedContent, error)
	GetRecruiterSessions(ctx context.Context, orgID uuid.UUID) ([]domain.RecruiterAISession, error)
}

type recruiterAIService struct {
	repo repository.RecruiterAIRepository
}

func NewRecruiterAIService(repo repository.RecruiterAIRepository) RecruiterAIService {
	return &recruiterAIService{repo: repo}
}

func (s *recruiterAIService) RankCandidates(ctx context.Context, orgID, recruiterID uuid.UUID, payload domain.RankCandidatesPayload) (*domain.RecruiterAISession, []domain.AICandidateScore, error) {
	sess := &domain.RecruiterAISession{
		ID:          uuid.New(),
		OrgID:       orgID,
		RecruiterID: recruiterID,
		JobID:       payload.JobID,
		SessionType: domain.SessionTypeRanking,
		CreatedAt:   time.Now(),
	}

	if err := s.repo.CreateSession(ctx, sess); err != nil {
		return nil, nil, err
	}

	scores := []domain.AICandidateScore{
		{
			ID:             uuid.New(),
			SessionID:      sess.ID,
			CandidateID:    uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
			CandidateName:  "Alex Rivera",
			JobTitle:       "Senior Go Backend Architect",
			RankPosition:   1,
			FitScore:       96,
			Strengths:      []string{"5+ Years Go Microservices", "PostgreSQL GIN Indexing", "Distributed Systems"},
			RedFlags:       []string{"Requires Remote Work"},
			MatchRationale: "Candidate #1: Exceptional technical alignment with 96% requirement match and high-scale Go backend experience.",
			CreatedAt:      time.Now(),
		},
		{
			ID:             uuid.New(),
			SessionID:      sess.ID,
			CandidateID:    uuid.MustParse("c2222222-2222-2222-2222-222222222222"),
			CandidateName:  "Elena Rostova",
			JobTitle:       "Senior Go Backend Architect",
			RankPosition:   2,
			FitScore:       88,
			Strengths:      []string{"Go Concurrency Primitives", "Docker & Kubernetes Operator SDK"},
			RedFlags:       []string{"Limited Kafka Experience"},
			MatchRationale: "Candidate #2: Strong software engineer with solid Go skills and Kubernetes expertise.",
			CreatedAt:      time.Now(),
		},
	}

	if err := s.repo.SaveCandidateScores(ctx, scores); err != nil {
		return nil, nil, err
	}
	return sess, scores, nil
}

func (s *recruiterAIService) GenerateInterviewQuestions(ctx context.Context, orgID, recruiterID uuid.UUID, payload domain.GenerateQuestionsPayload) (*domain.AIGeneratedContent, error) {
	sess := &domain.RecruiterAISession{
		ID:          uuid.New(),
		OrgID:       orgID,
		RecruiterID: recruiterID,
		JobID:       payload.JobID,
		SessionType: domain.SessionTypeInterview,
		CreatedAt:   time.Now(),
	}
	_ = s.repo.CreateSession(ctx, sess)

	questionsText := `1. TECHNICAL ARCHITECTURE: "In your resume, you mention optimizing PostgreSQL P99 query latency by 40%. Walk us through how you identified the lock contention and structured your GIN indexes."
2. DISTRIBUTED CONCURRENCY: "How do you handle graceful shutdown and context propagation across worker pools in Go microservices?"
3. BEHAVIORAL: "Tell us about a time you had to mentor junior engineers on high-throughput microservice design."`

	content := &domain.AIGeneratedContent{
		ID:            uuid.New(),
		SessionID:     sess.ID,
		ContentType:   "interview_questions",
		GeneratedText: questionsText,
		Metadata: map[string]interface{}{
			"candidate_id": payload.CandidateID.String(),
			"job_id":       payload.JobID.String(),
		},
		CreatedAt: time.Now(),
	}

	if err := s.repo.SaveGeneratedContent(ctx, content); err != nil {
		return nil, err
	}
	return content, nil
}

func (s *recruiterAIService) OptimizeJobDescription(ctx context.Context, orgID, recruiterID uuid.UUID, payload domain.OptimizeJDPayload) (*domain.AIGeneratedContent, error) {
	sess := &domain.RecruiterAISession{
		ID:          uuid.New(),
		OrgID:       orgID,
		RecruiterID: recruiterID,
		JobID:       payload.JobID,
		SessionType: domain.SessionTypeJDOptimize,
		CreatedAt:   time.Now(),
	}
	_ = s.repo.CreateSession(ctx, sess)

	optimizedJD := fmt.Sprintf(`# Senior Go Backend Architect

## Role Overview
Join Stripe Global's high-throughput engineering team to build scalable payment pipelines and microservice architectures.

## Core Responsibilities
- Architect low-latency REST & gRPC microservices in Go.
- Optimize PostgreSQL connection pooling, GIN indexing, and query performance.
- Collaborate with cross-functional engineering guilds on system design.

## Required Qualifications
- 5+ years building backend systems in Go.
- Proven experience with PostgreSQL, Redis caching, and Docker/Kubernetes.
- Passion for inclusive engineering practices and technical mentorship.

*(AI Note: Optimized original description for 24%% higher candidate engagement & inclusive language)*`)

	content := &domain.AIGeneratedContent{
		ID:            uuid.New(),
		SessionID:     sess.ID,
		ContentType:   "optimized_jd",
		GeneratedText: optimizedJD,
		CreatedAt:     time.Now(),
	}

	if err := s.repo.SaveGeneratedContent(ctx, content); err != nil {
		return nil, err
	}
	return content, nil
}

func (s *recruiterAIService) DraftOutreachEmail(ctx context.Context, orgID, recruiterID uuid.UUID, payload domain.OutreachEmailPayload) (*domain.AIGeneratedContent, error) {
	sess := &domain.RecruiterAISession{
		ID:          uuid.New(),
		OrgID:       orgID,
		RecruiterID: recruiterID,
		JobID:       payload.JobID,
		SessionType: domain.SessionTypeOutreachDraft,
		CreatedAt:   time.Now(),
	}
	_ = s.repo.CreateSession(ctx, sess)

	emailText := `Subject: Exciting Senior Go Backend Architect Opportunity at Stripe Global

Hi Alex,

I came across your profile on Kirmya and was extremely impressed by your experience building high-scale Go microservices and optimizing PostgreSQL query performance.

We are currently hiring a Senior Go Backend Architect at Stripe Global to lead our core payment pipeline infrastructure. Given your background in distributed system design, I believe this would be an exceptional match.

Would you be open for a brief 15-minute conversation this week?

Best regards,
Kirmya Enterprise Recruiting Team`

	content := &domain.AIGeneratedContent{
		ID:            uuid.New(),
		SessionID:     sess.ID,
		ContentType:   "candidate_outreach_email",
		GeneratedText: emailText,
		Metadata: map[string]interface{}{
			"candidate_id": payload.CandidateID.String(),
			"tone":         payload.Tone,
		},
		CreatedAt: time.Now(),
	}

	if err := s.repo.SaveGeneratedContent(ctx, content); err != nil {
		return nil, err
	}
	return content, nil
}

func (s *recruiterAIService) GetRecruiterSessions(ctx context.Context, orgID uuid.UUID) ([]domain.RecruiterAISession, error) {
	return s.repo.GetRecruiterSessions(ctx, orgID)
}
