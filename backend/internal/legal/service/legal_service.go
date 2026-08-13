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
	GetPrivacyPreferences(ctx context.Context, userID uuid.UUID) (*models.PrivacyPreferences, error)
	UpdatePrivacyPreferences(ctx context.Context, userID uuid.UUID, payload models.UpdatePrivacyPreferencesPayload) (*models.PrivacyPreferences, error)
	GetConsentHistory(ctx context.Context, userID uuid.UUID) ([]models.ConsentHistoryItem, error)
	CreatePrivacyRequest(ctx context.Context, userID uuid.UUID, reqType string) (*models.PrivacyRequest, error)
	GetUserPrivacyRequests(ctx context.Context, userID uuid.UUID) ([]models.PrivacyRequest, error)
	GetPrivacyRequestByID(ctx context.Context, id uuid.UUID) (*models.PrivacyRequest, error)
	RequestDataExport(ctx context.Context, userID uuid.UUID) (*models.DataExportJob, error)
	GetDataExportJob(ctx context.Context, userID uuid.UUID) (*models.DataExportJob, error)
	RequestAccountDeletion(ctx context.Context, userID uuid.UUID, reason string) (*models.DataDeletionRequest, error)
	CancelAccountDeletion(ctx context.Context, userID uuid.UUID) error
	CanProcessWithAI(ctx context.Context, userID uuid.UUID, feature string) (bool, error)
	RedactPersonalData(ctx context.Context, text string) string
	GetThirdPartyServices(ctx context.Context) ([]models.ThirdPartyService, error)
	GetDataProcessingRecords(ctx context.Context) ([]models.DataProcessingRecord, error)
	GetRetentionPolicies(ctx context.Context) ([]models.RetentionPolicy, error)
	UpdateRetentionPolicy(ctx context.Context, p *models.RetentionPolicy) error
	GetPrivacyDashboardSummary(ctx context.Context) (*models.PrivacyDashboardSummary, error)
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

func (s *legalService) GetPrivacyPreferences(ctx context.Context, userID uuid.UUID) (*models.PrivacyPreferences, error) {
	return s.repo.GetPrivacyPreferences(ctx, userID)
}

func (s *legalService) UpdatePrivacyPreferences(ctx context.Context, userID uuid.UUID, payload models.UpdatePrivacyPreferencesPayload) (*models.PrivacyPreferences, error) {
	prefs, err := s.repo.GetPrivacyPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	if payload.ProfileVisibility != "" {
		prefs.ProfileVisibility = payload.ProfileVisibility
	}
	if payload.DiscoverInSearch != nil {
		prefs.DiscoverInSearch = *payload.DiscoverInSearch
	}
	if payload.RecruiterDiscoverable != nil {
		prefs.RecruiterDiscoverable = *payload.RecruiterDiscoverable
	}
	if payload.RecruiterContactable != nil {
		prefs.RecruiterContactable = *payload.RecruiterContactable
	}
	if payload.ShowResumeToRecruiters != nil {
		prefs.ShowResumeToRecruiters = *payload.ShowResumeToRecruiters
	}
	if payload.MessagingPermission != "" {
		prefs.MessagingPermission = payload.MessagingPermission
	}
	if payload.CommunityVisibility != "" {
		prefs.CommunityVisibility = payload.CommunityVisibility
	}
	if payload.SearchPersonalization != nil {
		prefs.SearchPersonalization = *payload.SearchPersonalization
	}
	if payload.AIDataUsage != nil {
		prefs.AIDataUsage = *payload.AIDataUsage
	}
	if payload.AnalyticsConsent != nil {
		prefs.AnalyticsConsent = *payload.AnalyticsConsent
	}
	if payload.MarketingConsent != nil {
		prefs.MarketingConsent = *payload.MarketingConsent
	}

	prefs.UpdatedAt = time.Now()
	if err := s.repo.UpdatePrivacyPreferences(ctx, prefs); err != nil {
		return nil, err
	}
	return prefs, nil
}

func (s *legalService) GetConsentHistory(ctx context.Context, userID uuid.UUID) ([]models.ConsentHistoryItem, error) {
	return s.repo.GetConsentHistory(ctx, userID)
}

func (s *legalService) CreatePrivacyRequest(ctx context.Context, userID uuid.UUID, reqType string) (*models.PrivacyRequest, error) {
	req := &models.PrivacyRequest{
		ID:          uuid.New(),
		UserID:      userID,
		RequestType: reqType,
		Status:      "received",
		DueDate:     time.Now().AddDate(0, 0, 30),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if err := s.repo.CreatePrivacyRequest(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *legalService) GetUserPrivacyRequests(ctx context.Context, userID uuid.UUID) ([]models.PrivacyRequest, error) {
	return s.repo.GetUserPrivacyRequests(ctx, userID)
}

func (s *legalService) GetPrivacyRequestByID(ctx context.Context, id uuid.UUID) (*models.PrivacyRequest, error) {
	return s.repo.GetPrivacyRequestByID(ctx, id)
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

func (s *legalService) GetDataExportJob(ctx context.Context, userID uuid.UUID) (*models.DataExportJob, error) {
	return s.repo.GetDataExportJob(ctx, userID)
}

func (s *legalService) RequestAccountDeletion(ctx context.Context, userID uuid.UUID, reason string) (*models.DataDeletionRequest, error) {
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

func (s *legalService) CancelAccountDeletion(ctx context.Context, userID uuid.UUID) error {
	return s.repo.CancelAccountDeletion(ctx, userID)
}

func (s *legalService) CanProcessWithAI(ctx context.Context, userID uuid.UUID, feature string) (bool, error) {
	return true, nil
}

func (s *legalService) RedactPersonalData(ctx context.Context, text string) string {
	redacted := text
	if strings.Contains(redacted, "@") {
		words := strings.Fields(redacted)
		for _, w := range words {
			if strings.Contains(w, "@") && strings.Contains(w, ".") {
				redacted = strings.ReplaceAll(redacted, w, "[REDACTED_EMAIL]")
			}
		}
	}
	return redacted
}

func (s *legalService) GetThirdPartyServices(ctx context.Context) ([]models.ThirdPartyService, error) {
	return s.repo.GetThirdPartyServices(ctx)
}

func (s *legalService) GetDataProcessingRecords(ctx context.Context) ([]models.DataProcessingRecord, error) {
	return s.repo.GetDataProcessingRecords(ctx)
}

func (s *legalService) GetRetentionPolicies(ctx context.Context) ([]models.RetentionPolicy, error) {
	return s.repo.GetRetentionPolicies(ctx)
}

func (s *legalService) UpdateRetentionPolicy(ctx context.Context, p *models.RetentionPolicy) error {
	return s.repo.UpdateRetentionPolicy(ctx, p)
}

func (s *legalService) GetPrivacyDashboardSummary(ctx context.Context) (*models.PrivacyDashboardSummary, error) {
	return s.repo.GetPrivacyDashboardSummary(ctx)
}
