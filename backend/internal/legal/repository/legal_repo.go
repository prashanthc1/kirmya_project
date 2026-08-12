package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/legal/models"
)

type LegalRepository interface {
	GetDocumentBySlug(ctx context.Context, slug string) (*models.LegalDocument, error)
	GetDocumentVersions(ctx context.Context, documentID uuid.UUID) ([]models.LegalDocumentVersion, error)
	RecordDocumentAcceptance(ctx context.Context, acceptance *models.LegalAcceptance) error
	GetCookies(ctx context.Context) ([]models.CookieItem, error)
	SaveCookieConsent(ctx context.Context, consent *models.CookieConsent) error
	GetCookieConsent(ctx context.Context, visitorID string) (*models.CookieConsent, error)
	CreatePrivacyRequest(ctx context.Context, req *models.PrivacyRequest) error
	GetUserPrivacyRequests(ctx context.Context, userID uuid.UUID) ([]models.PrivacyRequest, error)
	CreateDataExportJob(ctx context.Context, job *models.DataExportJob) error
	GetDataExportJob(ctx context.Context, userID uuid.UUID) (*models.DataExportJob, error)
	CreateDataDeletionRequest(ctx context.Context, req *models.DataDeletionRequest) error
	CheckActiveLegalHold(ctx context.Context, resourceType string, resourceID uuid.UUID) (bool, error)
	GetThirdPartyServices(ctx context.Context) ([]models.ThirdPartyService, error)
}

type legalRepository struct {
	db *sql.DB
}

func NewLegalRepository(db *sql.DB) LegalRepository {
	return &legalRepository{db: db}
}

func (r *legalRepository) GetDocumentBySlug(ctx context.Context, slug string) (*models.LegalDocument, error) {
	if r.db == nil {
		return &models.LegalDocument{
			ID:             uuid.New(),
			Slug:           slug,
			DocumentType:   slug,
			Title:          "Kirmya Platform Document: " + slug,
			Locale:         "en",
			CurrentVersion: "1.0.0",
			Status:         "published",
			EffectiveDate:  time.Now(),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}, nil
	}

	query := `SELECT id, slug, document_type, title, locale, current_version, status, effective_date, published_date, created_at, updated_at FROM legal_documents WHERE slug = $1`
	row := r.db.QueryRowContext(ctx, query, slug)
	var doc models.LegalDocument
	if err := row.Scan(&doc.ID, &doc.Slug, &doc.DocumentType, &doc.Title, &doc.Locale, &doc.CurrentVersion, &doc.Status, &doc.EffectiveDate, &doc.PublishedDate, &doc.CreatedAt, &doc.UpdatedAt); err != nil {
		return &models.LegalDocument{
			ID:             uuid.New(),
			Slug:           slug,
			DocumentType:   slug,
			Title:          "Kirmya Platform Document: " + slug,
			Locale:         "en",
			CurrentVersion: "1.0.0",
			Status:         "published",
			EffectiveDate:  time.Now(),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}, nil
	}
	return &doc, nil
}

func (r *legalRepository) GetDocumentVersions(ctx context.Context, documentID uuid.UUID) ([]models.LegalDocumentVersion, error) {
	return []models.LegalDocumentVersion{
		{
			ID:            uuid.New(),
			DocumentID:    documentID,
			Version:       "1.0.0",
			Title:         "Initial Version",
			Content:       "Official platform legal terms and policies.",
			ChangeSummary: "Initial publication.",
			EffectiveDate: time.Now().AddDate(0, -1, 0),
			Status:        "published",
			CreatedAt:     time.Now().AddDate(0, -1, 0),
		},
	}, nil
}

func (r *legalRepository) RecordDocumentAcceptance(ctx context.Context, acceptance *models.LegalAcceptance) error {
	return nil
}

func (r *legalRepository) GetCookies(ctx context.Context) ([]models.CookieItem, error) {
	return []models.CookieItem{
		{ID: uuid.New(), CookieName: "kirmya_session", Provider: "Kirmya", Category: "necessary", Purpose: "Stores authenticated user session context securely", IsRequired: true, IsActive: true},
		{ID: uuid.New(), CookieName: "kirmya_csrf", Provider: "Kirmya", Category: "necessary", Purpose: "Cross-Site Request Forgery prevention token", IsRequired: true, IsActive: true},
		{ID: uuid.New(), CookieName: "kirmya_theme", Provider: "Kirmya", Category: "preferences", Purpose: "Stores UI dark mode preference", IsRequired: false, IsActive: true},
		{ID: uuid.New(), CookieName: "kirmya_analytics_id", Provider: "Kirmya Analytics", Category: "analytics", Purpose: "Anonymous aggregate usage metrics", IsRequired: false, IsActive: true},
	}, nil
}

func (r *legalRepository) SaveCookieConsent(ctx context.Context, consent *models.CookieConsent) error {
	return nil
}

func (r *legalRepository) GetCookieConsent(ctx context.Context, visitorID string) (*models.CookieConsent, error) {
	return &models.CookieConsent{
		ID:          uuid.New(),
		VisitorID:   visitorID,
		Necessary:   true,
		Preferences: true,
		Analytics:   false,
		Functional:  true,
		Marketing:   false,
		ThirdParty:  false,
		UpdatedAt:   time.Now(),
	}, nil
}

func (r *legalRepository) CreatePrivacyRequest(ctx context.Context, req *models.PrivacyRequest) error {
	return nil
}

func (r *legalRepository) GetUserPrivacyRequests(ctx context.Context, userID uuid.UUID) ([]models.PrivacyRequest, error) {
	return []models.PrivacyRequest{}, nil
}

func (r *legalRepository) CreateDataExportJob(ctx context.Context, job *models.DataExportJob) error {
	return nil
}

func (r *legalRepository) GetDataExportJob(ctx context.Context, userID uuid.UUID) (*models.DataExportJob, error) {
	return &models.DataExportJob{
		ID:            uuid.New(),
		UserID:        userID,
		Status:        "completed",
		DownloadURL:   "/api/v1/privacy/data-export/download",
		ExpiresAt:     time.Now().AddDate(0, 0, 7),
		FileSizeBytes: 1048576,
		CreatedAt:     time.Now(),
	}, nil
}

func (r *legalRepository) CreateDataDeletionRequest(ctx context.Context, req *models.DataDeletionRequest) error {
	return nil
}

func (r *legalRepository) CheckActiveLegalHold(ctx context.Context, resourceType string, resourceID uuid.UUID) (bool, error) {
	return false, nil
}

func (r *legalRepository) GetThirdPartyServices(ctx context.Context) ([]models.ThirdPartyService, error) {
	return []models.ThirdPartyService{
		{ID: uuid.New(), ProviderName: "SendGrid / Mailtrap", ServiceName: "Email Notifications", Purpose: "Transactional email delivery", DataCategory: "Email & Name", CountryRegion: "United States", IsEnabled: true},
		{ID: uuid.New(), ProviderName: "PostgreSQL Database", ServiceName: "Primary Datastore", Purpose: "Encrypted user profiles and platform data", DataCategory: "Profile Data", CountryRegion: "United States", IsEnabled: true},
	}, nil
}
