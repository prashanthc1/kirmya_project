package service

import (
	"context"
	"fmt"
	"time"

	"kirmya/internal/compliance/domain"
	"kirmya/internal/compliance/repository"

	"github.com/google/uuid"
)

type ComplianceService interface {
	UpdateConsent(ctx context.Context, userID uuid.UUID, payload domain.UpdateConsentPayload, ipAddress string) error
	GetUserConsents(ctx context.Context, userID uuid.UUID) ([]domain.ConsentRecord, error)

	RequestDataExport(ctx context.Context, userID uuid.UUID) (*domain.DataRequest, error)
	RequestAccountDeletion(ctx context.Context, userID uuid.UUID) (*domain.DataRequest, error)
	GetUserDataRequests(ctx context.Context, userID uuid.UUID) ([]domain.DataRequest, error)
}

type complianceService struct {
	repo repository.ComplianceRepository
}

func NewComplianceService(repo repository.ComplianceRepository) ComplianceService {
	return &complianceService{repo: repo}
}

func (s *complianceService) UpdateConsent(ctx context.Context, userID uuid.UUID, payload domain.UpdateConsentPayload, ipAddress string) error {
	record := &domain.ConsentRecord{
		ID:          uuid.New(),
		UserID:      userID,
		ConsentType: payload.ConsentType,
		IsGranted:   payload.IsGranted,
		GrantedAt:   time.Now(),
		IPAddress:   ipAddress,
	}

	if err := s.repo.SaveConsent(ctx, record); err != nil {
		return err
	}

	_ = s.repo.LogAuditEvent(ctx, &domain.AuditEvent{
		ID:        uuid.New(),
		UserID:    userID,
		EventType: "CONSENT_UPDATED",
		Resource:  payload.ConsentType,
		Details:   map[string]interface{}{"is_granted": payload.IsGranted, "ip": ipAddress},
		CreatedAt: time.Now(),
	})

	return nil
}

func (s *complianceService) GetUserConsents(ctx context.Context, userID uuid.UUID) ([]domain.ConsentRecord, error) {
	return s.repo.GetUserConsents(ctx, userID)
}

func (s *complianceService) RequestDataExport(ctx context.Context, userID uuid.UUID) (*domain.DataRequest, error) {
	completedAt := time.Now()
	req := &domain.DataRequest{
		ID:          uuid.New(),
		UserID:      userID,
		RequestType: domain.RequestTypeExport,
		Status:      domain.RequestStatusCompleted,
		DownloadURL: fmt.Sprintf("https://cdn.kirmya.dev/gdpr/exports/gdpr_export_%s_%d.json", userID.String()[:8], time.Now().Unix()),
		RequestedAt: time.Now(),
		CompletedAt: &completedAt,
	}

	if err := s.repo.CreateDataRequest(ctx, req); err != nil {
		return nil, err
	}

	_ = s.repo.LogAuditEvent(ctx, &domain.AuditEvent{
		ID:        uuid.New(),
		UserID:    userID,
		EventType: "GDPR_DATA_EXPORT_REQUESTED",
		Resource:  "User Personal Data Package Archive",
		Details:   map[string]interface{}{"request_id": req.ID.String()},
		CreatedAt: time.Now(),
	})

	return req, nil
}

func (s *complianceService) RequestAccountDeletion(ctx context.Context, userID uuid.UUID) (*domain.DataRequest, error) {
	req := &domain.DataRequest{
		ID:          uuid.New(),
		UserID:      userID,
		RequestType: domain.RequestTypeDeletion,
		Status:      domain.RequestStatusPending,
		RequestedAt: time.Now(),
	}

	if err := s.repo.CreateDataRequest(ctx, req); err != nil {
		return nil, err
	}

	_ = s.repo.LogAuditEvent(ctx, &domain.AuditEvent{
		ID:        uuid.New(),
		UserID:    userID,
		EventType: "ACCOUNT_DELETION_REQUESTED",
		Resource:  "Right to be Forgotten Purge",
		Details:   map[string]interface{}{"request_id": req.ID.String()},
		CreatedAt: time.Now(),
	})

	return req, nil
}

func (s *complianceService) GetUserDataRequests(ctx context.Context, userID uuid.UUID) ([]domain.DataRequest, error) {
	return s.repo.GetUserDataRequests(ctx, userID)
}
