package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/trust_safety/models"
	"kirmya/internal/trust_safety/repository"
)

type TrustSafetyService interface {
	SubmitReport(ctx context.Context, reporterID uuid.UUID, targetType string, targetID uuid.UUID, title string, category string, description string, evidence []string) (*models.SafetyReport, error)
	GetUserReports(ctx context.Context, userID uuid.UUID) ([]models.SafetyReport, error)
	BlockUser(ctx context.Context, blockerID uuid.UUID, blockedType string, blockedID uuid.UUID, reason string) error
	UnblockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error
	GetUserBlocks(ctx context.Context, blockerID uuid.UUID) ([]models.UserBlock, error)
	IsBlocked(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) (bool, error)
	GetAdminCases(ctx context.Context, status string) ([]models.SafetyCase, error)
	ApplyModerationAction(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, actionType string, level string, reason string, durationDays int) (*models.ModerationDecision, error)
	SubmitAppeal(ctx context.Context, decisionID uuid.UUID, userID uuid.UUID, reason string, explanation string, evidence []string) (*models.SafetyAppeal, error)
	ResolveAppeal(ctx context.Context, appealID uuid.UUID, adminID uuid.UUID, status string, notes string) error
	EvaluateJobScamRisk(ctx context.Context, jobTitle string, jobDescription string, salaryRange string) (float64, string)
}

type trustSafetyService struct {
	repo repository.TrustSafetyRepository
}

func NewTrustSafetyService(repo repository.TrustSafetyRepository) TrustSafetyService {
	return &trustSafetyService{repo: repo}
}

func (s *trustSafetyService) SubmitReport(ctx context.Context, reporterID uuid.UUID, targetType string, targetID uuid.UUID, title string, category string, description string, evidence []string) (*models.SafetyReport, error) {
	priority := "normal"
	if category == "threat" || category == "scam" || category == "phishing" {
		priority = "high"
	}

	report := &models.SafetyReport{
		ID:           uuid.New(),
		ReporterID:   reporterID,
		TargetType:   targetType,
		TargetID:     targetID,
		TargetTitle:  title,
		Category:     category,
		Description:  description,
		EvidenceURLs: evidence,
		Status:       "submitted",
		Priority:     priority,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.repo.CreateReport(ctx, report); err != nil {
		return nil, err
	}

	// Create linked moderation case
	caseObj := &models.SafetyCase{
		ID:               uuid.New(),
		CaseNumber:       fmt.Sprintf("CASE-%d", time.Now().UnixNano()%1000000),
		TargetType:       targetType,
		TargetID:         targetID,
		TargetTitle:      title,
		ReporterID:       &reporterID,
		Category:         category,
		Priority:         priority,
		RiskScore:        50.0,
		Status:           "new",
		AssignedTeam:     "General Safety",
		AISummary:        fmt.Sprintf("Report submitted under category %s: %s", category, description),
		AIRecommendation: "Human review required before enforcement.",
		AIConfidence:     0.85,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	_ = s.repo.CreateCase(ctx, caseObj)

	return report, nil
}

func (s *trustSafetyService) GetUserReports(ctx context.Context, userID uuid.UUID) ([]models.SafetyReport, error) {
	return s.repo.GetUserReports(ctx, userID)
}

func (s *trustSafetyService) BlockUser(ctx context.Context, blockerID uuid.UUID, blockedType string, blockedID uuid.UUID, reason string) error {
	block := &models.UserBlock{
		ID:          uuid.New(),
		BlockerID:   blockerID,
		BlockedType: blockedType,
		BlockedID:   blockedID,
		Reason:      reason,
		Scope:       "all",
		CreatedAt:   time.Now(),
	}
	return s.repo.BlockUser(ctx, block)
}

func (s *trustSafetyService) UnblockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error {
	return s.repo.UnblockUser(ctx, blockerID, blockedID)
}

func (s *trustSafetyService) GetUserBlocks(ctx context.Context, blockerID uuid.UUID) ([]models.UserBlock, error) {
	return s.repo.GetUserBlocks(ctx, blockerID)
}

func (s *trustSafetyService) IsBlocked(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) (bool, error) {
	return s.repo.IsBlocked(ctx, blockerID, blockedID)
}

func (s *trustSafetyService) GetAdminCases(ctx context.Context, status string) ([]models.SafetyCase, error) {
	return s.repo.GetAdminCases(ctx, status)
}

func (s *trustSafetyService) ApplyModerationAction(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, actionType string, level string, reason string, durationDays int) (*models.ModerationDecision, error) {
	// Require human decision confirmation: AI cannot auto permanently ban
	if actionType == "permanent_suspension" && adminID == uuid.Nil {
		return nil, errors.New("HUMAN_OVERVIEW_REQUIRED: Permanent suspension requires explicit human moderator authorization.")
	}

	var expiresAt *time.Time
	if durationDays > 0 {
		t := time.Now().AddDate(0, 0, durationDays)
		expiresAt = &t
	}

	decision := &models.ModerationDecision{
		ID:               uuid.New(),
		CaseID:           &caseID,
		AdminID:          adminID,
		TargetType:       "user",
		TargetID:         uuid.New(),
		ActionType:       actionType,
		EnforcementLevel: level,
		Reason:           reason,
		PolicyVersion:    "1.0.0",
		DurationDays:     durationDays,
		ExpiresAt:        expiresAt,
		IsActive:         true,
		AIAssisted:       true,
		CreatedAt:        time.Now(),
	}

	if err := s.repo.CreateModerationDecision(ctx, decision); err != nil {
		return nil, err
	}

	// Create active restriction record if temporary
	if actionType == "messaging_restriction" || actionType == "job_posting_restriction" || actionType == "application_restriction" {
		restriction := &models.UserRestriction{
			ID:               uuid.New(),
			UserID:           decision.TargetID,
			RestrictionScope: actionType,
			Reason:           reason,
			StartsAt:         time.Now(),
			ExpiresAt:        expiresAt,
			CreatedBy:        &adminID,
			IsActive:         true,
			CreatedAt:        time.Now(),
		}
		_ = s.repo.CreateRestriction(ctx, restriction)
	}

	return decision, nil
}

func (s *trustSafetyService) SubmitAppeal(ctx context.Context, decisionID uuid.UUID, userID uuid.UUID, reason string, explanation string, evidence []string) (*models.SafetyAppeal, error) {
	appeal := &models.SafetyAppeal{
		ID:           uuid.New(),
		DecisionID:   decisionID,
		UserID:       userID,
		Reason:       reason,
		Explanation:  explanation,
		EvidenceURLs: evidence,
		Status:       "submitted",
		SubmittedAt:  time.Now(),
	}

	if err := s.repo.CreateAppeal(ctx, appeal); err != nil {
		return nil, err
	}
	return appeal, nil
}

func (s *trustSafetyService) ResolveAppeal(ctx context.Context, appealID uuid.UUID, adminID uuid.UUID, status string, notes string) error {
	return s.repo.ResolveAppeal(ctx, appealID, status, notes, adminID)
}

func (s *trustSafetyService) EvaluateJobScamRisk(ctx context.Context, jobTitle string, jobDescription string, salaryRange string) (float64, string) {
	score := 10.0
	triggers := []string{}

	descLower := strings.ToLower(jobDescription)
	if strings.Contains(descLower, "wire transfer") || strings.Contains(descLower, "western union") || strings.Contains(descLower, "pay fee before starting") {
		score += 65.0
		triggers = append(triggers, "advance_payment_request")
	}
	if strings.Contains(descLower, "telegram") || strings.Contains(descLower, "whatsapp only") {
		score += 20.0
		triggers = append(triggers, "off_platform_communication")
	}

	if score > 100.0 {
		score = 100.0
	}
	return score, strings.Join(triggers, ", ")
}
