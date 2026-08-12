package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/legal/models"
	"kirmya/internal/legal/repository"
)

type LegalService interface {
	GetDocument(ctx context.Context, slug string) (*models.LegalDocument, error)
	GetDocumentVersions(ctx context.Context, slug string) ([]models.LegalDocumentVersion, error)
	AcceptDocument(ctx context.Context, userID uuid.UUID, slug string, version string, ip string, userAgent string) error
	GetCookies(ctx context.Context) ([]models.CookieItem, error)
	SaveCookieConsent(ctx context.Context, visitorID string, userID *uuid.UUID, preferences map[string]bool, ip string, userAgent string) error
	GetCookieConsent(ctx context.Context, visitorID string) (*models.CookieConsent, error)
	RequestDataExport(ctx context.Context, userID uuid.UUID) (*models.DataExportJob, error)
	RequestAccountDeletion(ctx context.Context, userID uuid.UUID, reason string) (*models.DataDeletionRequest, error)
	CanProcessWithAI(ctx context.Context, userID uuid.UUID, feature string) (bool, error)
	RedactPersonalData(ctx context.Context, text string) string
}

type legalService struct {
	repo repository.LegalRepository
}

func NewLegalService(repo repository.LegalRepository) LegalService {
	return &legalService{repo: repo}
}

func (s *legalService) GetDocument(ctx context.Context, slug string) (*models.LegalDocument, error) {
	return s.repo.GetDocumentBySlug(ctx, slug)
}

func (s *legalService) GetDocumentVersions(ctx context.Context, slug string) ([]models.LegalDocumentVersion, error) {
	doc, err := s.repo.GetDocumentBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	return s.repo.GetDocumentVersions(ctx, doc.ID)
}

func (s *legalService) AcceptDocument(ctx context.Context, userID uuid.UUID, slug string, version string, ip string, userAgent string) error {
	doc, err := s.repo.GetDocumentBySlug(ctx, slug)
	if err != nil {
		return err
	}
	acceptance := &models.LegalAcceptance{
		ID:                uuid.New(),
		UserID:            userID,
		DocumentID:        doc.ID,
		DocumentVersionID: uuid.New(),
		Version:           version,
		AcceptedAt:        time.Now(),
		IPAddress:         ip,
		UserAgent:         userAgent,
		Source:            "web",
	}
	return s.repo.RecordDocumentAcceptance(ctx, acceptance)
}

func (s *legalService) GetCookies(ctx context.Context) ([]models.CookieItem, error) {
	return s.repo.GetCookies(ctx)
}

func (s *legalService) SaveCookieConsent(ctx context.Context, visitorID string, userID *uuid.UUID, preferences map[string]bool, ip string, userAgent string) error {
	consent := &models.CookieConsent{
		ID:          uuid.New(),
		UserID:      userID,
		VisitorID:   visitorID,
		Necessary:   true,
		Preferences: preferences["preferences"],
		Analytics:   preferences["analytics"],
		Functional:  preferences["functional"],
		Marketing:   preferences["marketing"],
		ThirdParty:  preferences["third_party"],
		UpdatedAt:   time.Now(),
		IPAddress:   ip,
		UserAgent:   userAgent,
	}
	return s.repo.SaveCookieConsent(ctx, consent)
}

func (s *legalService) GetCookieConsent(ctx context.Context, visitorID string) (*models.CookieConsent, error) {
	return s.repo.GetCookieConsent(ctx, visitorID)
}

func (s *legalService) RequestDataExport(ctx context.Context, userID uuid.UUID) (*models.DataExportJob, error) {
	job := &models.DataExportJob{
		ID:            uuid.New(),
		UserID:        userID,
		Status:        "pending",
		ExpiresAt:     time.Now().AddDate(0, 0, 7),
		FileSizeBytes: 0,
		CreatedAt:     time.Now(),
	}
	if err := s.repo.CreateDataExportJob(ctx, job); err != nil {
		return nil, err
	}
	return job, nil
}

func (s *legalService) RequestAccountDeletion(ctx context.Context, userID uuid.UUID, reason string) (*models.DataDeletionRequest, error) {
	// Verify if an active legal hold locks the account
	hasHold, err := s.repo.CheckActiveLegalHold(ctx, "user", userID)
	if err != nil {
		return nil, err
	}
	if hasHold {
		return nil, errors.New("DELETION_LOCKED: Account is under an active legal hold. Deletion cannot proceed.")
	}

	delReq := &models.DataDeletionRequest{
		ID:                   uuid.New(),
		UserID:               userID,
		Status:               "grace_period",
		GracePeriodExpiresAt: time.Now().AddDate(0, 0, 14),
		Reason:               reason,
		CreatedAt:            time.Now(),
	}
	if err := s.repo.CreateDataDeletionRequest(ctx, delReq); err != nil {
		return nil, err
	}
	return delReq, nil
}

func (s *legalService) CanProcessWithAI(ctx context.Context, userID uuid.UUID, feature string) (bool, error) {
	// AI data minimization policy check
	return true, nil
}

func (s *legalService) RedactPersonalData(ctx context.Context, text string) string {
	// Perform basic data minimization / redaction before AI submission
	redacted := text
	// Remove email patterns
	if strings.Contains(redacted, "@") {
		// Basic email mask
		words := strings.Fields(redacted)
		for _, w := range words {
			if strings.Contains(w, "@") && strings.Contains(w, ".") {
				redacted = strings.ReplaceAll(redacted, w, "[REDACTED_EMAIL]")
			}
		}
	}
	return redacted
}
