package service

import (
	"context"
	"time"

	"kirmya/internal/trust_safety/domain"
	"kirmya/internal/trust_safety/repository"

	"github.com/google/uuid"
)

type TrustService interface {
	SubmitReport(ctx context.Context, reporterID uuid.UUID, payload domain.SubmitReportPayload) (*domain.Report, error)
	GetReports(ctx context.Context, status string) ([]domain.Report, error)
	ExecuteModerationAction(ctx context.Context, moderatorID uuid.UUID, reportID uuid.UUID, payload domain.ModerationActionPayload) (*domain.ModerationAction, error)

	BlockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID, reason string) error
	GetBadges(ctx context.Context, entityType string, entityID uuid.UUID) ([]domain.VerificationBadge, error)
	IssueBadge(ctx context.Context, entityType string, entityID uuid.UUID, badgeType string) (*domain.VerificationBadge, error)

	GetFraudLogs(ctx context.Context) ([]domain.FraudLog, error)
}

type trustService struct {
	repo repository.TrustRepository
}

func NewTrustService(repo repository.TrustRepository) TrustService {
	return &trustService{repo: repo}
}

func (s *trustService) SubmitReport(ctx context.Context, reporterID uuid.UUID, payload domain.SubmitReportPayload) (*domain.Report, error) {
	rep := &domain.Report{
		ID:         uuid.New(),
		ReporterID: reporterID,
		TargetType: payload.TargetType,
		TargetID:   payload.TargetID,
		TargetName: "Reported Target (" + payload.TargetType + ")",
		Category:   payload.Category,
		Reason:     payload.Reason,
		Status:     domain.ReportStatusPending,
		CreatedAt:  time.Now(),
	}

	if err := s.repo.CreateReport(ctx, rep); err != nil {
		return nil, err
	}
	return rep, nil
}

func (s *trustService) GetReports(ctx context.Context, status string) ([]domain.Report, error) {
	return s.repo.GetReports(ctx, status)
}

func (s *trustService) ExecuteModerationAction(ctx context.Context, moderatorID uuid.UUID, reportID uuid.UUID, payload domain.ModerationActionPayload) (*domain.ModerationAction, error) {
	_ = s.repo.UpdateReportStatus(ctx, reportID, domain.ReportStatusResolved)

	action := &domain.ModerationAction{
		ID:          uuid.New(),
		ModeratorID: moderatorID,
		TargetID:    reportID,
		TargetType:  "report",
		Action:      payload.Action,
		Notes:       payload.Notes,
		CreatedAt:   time.Now(),
	}

	if err := s.repo.LogAction(ctx, action); err != nil {
		return nil, err
	}
	return action, nil
}

func (s *trustService) BlockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID, reason string) error {
	action := &domain.ModerationAction{
		ID:          uuid.New(),
		ModeratorID: blockerID,
		TargetID:    blockedID,
		TargetType:  domain.TargetTypeUser,
		Action:      domain.ActionBlock,
		Notes:       "User block: " + reason,
		CreatedAt:   time.Now(),
	}
	return s.repo.LogAction(ctx, action)
}

func (s *trustService) GetBadges(ctx context.Context, entityType string, entityID uuid.UUID) ([]domain.VerificationBadge, error) {
	return s.repo.GetBadges(ctx, entityType, entityID)
}

func (s *trustService) IssueBadge(ctx context.Context, entityType string, entityID uuid.UUID, badgeType string) (*domain.VerificationBadge, error) {
	badge := &domain.VerificationBadge{
		ID:         uuid.New(),
		EntityID:   entityID,
		EntityType: entityType,
		BadgeType:  badgeType,
		IssuedAt:   time.Now(),
	}

	if err := s.repo.IssueBadge(ctx, badge); err != nil {
		return nil, err
	}
	return badge, nil
}

func (s *trustService) GetFraudLogs(ctx context.Context) ([]domain.FraudLog, error) {
	return s.repo.GetFraudLogs(ctx)
}
