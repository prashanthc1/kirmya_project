package service

import (
	"context"

	"kirmya/internal/resume_analysis/domain"
	"kirmya/internal/resume_analysis/provider"
	"kirmya/internal/resume_analysis/repository"

	"github.com/google/uuid"
)

type ResumeAnalysisService interface {
	AnalyzeResume(ctx context.Context, userID uuid.UUID, req domain.AnalyzeResumePayload) (*domain.ResumeAnalysis, error)
	GetAnalysisByID(ctx context.Context, id uuid.UUID) (*domain.ResumeAnalysis, error)
	GetUserAnalysisHistory(ctx context.Context, userID uuid.UUID) ([]domain.ResumeAnalysis, error)
}

type resumeAnalysisService struct {
	repo       repository.ResumeAnalysisRepository
	aiProvider provider.ResumeAIProvider
}

func NewResumeAnalysisService(repo repository.ResumeAnalysisRepository, aiProv provider.ResumeAIProvider) ResumeAnalysisService {
	return &resumeAnalysisService{
		repo:       repo,
		aiProvider: aiProv,
	}
}

func (s *resumeAnalysisService) AnalyzeResume(ctx context.Context, userID uuid.UUID, req domain.AnalyzeResumePayload) (*domain.ResumeAnalysis, error) {
	evalResult, err := s.aiProvider.AnalyzeResume(ctx, req.ResumeText, req.TargetJobTitle, req.TargetJobDescription)
	if err != nil {
		return nil, err
	}

	analysisID := uuid.New()

	scores := &domain.ResumeScores{
		ID:                    uuid.New(),
		AnalysisID:            analysisID,
		OverallScore:          evalResult.OverallScore,
		ATSCompatibilityScore: evalResult.ATSCompatibilityScore,
		StructureScore:        evalResult.StructureScore,
		SkillsScore:           evalResult.SkillsScore,
		ExperienceScore:       evalResult.ExperienceScore,
		JobMatchScore:         evalResult.JobMatchScore,
	}

	improvements := &domain.ImprovementHistory{
		ID:                    uuid.New(),
		AnalysisID:            analysisID,
		UserID:                userID,
		MissingSkills:         evalResult.MissingSkills,
		PresentKeywords:       evalResult.PresentKeywords,
		MissingKeywords:       evalResult.MissingKeywords,
		KeywordDensityScore:   evalResult.KeywordDensityScore,
		StructureFeedback:     evalResult.StructureFeedback,
		ExperienceBulletFixes: evalResult.ExperienceBulletFixes,
		GeneralSuggestions:    evalResult.GeneralSuggestions,
	}

	analysis := &domain.ResumeAnalysis{
		ID:                   analysisID,
		UserID:               userID,
		TargetJobTitle:       req.TargetJobTitle,
		TargetJobDescription: req.TargetJobDescription,
		ResumeText:           req.ResumeText,
		Status:               "completed",
		Scores:               scores,
		Improvements:         improvements,
	}

	if err := s.repo.SaveAnalysis(ctx, analysis); err != nil {
		return nil, err
	}

	return analysis, nil
}

func (s *resumeAnalysisService) GetAnalysisByID(ctx context.Context, id uuid.UUID) (*domain.ResumeAnalysis, error) {
	return s.repo.GetAnalysisByID(ctx, id)
}

func (s *resumeAnalysisService) GetUserAnalysisHistory(ctx context.Context, userID uuid.UUID) ([]domain.ResumeAnalysis, error) {
	return s.repo.GetUserAnalysisHistory(ctx, userID)
}
