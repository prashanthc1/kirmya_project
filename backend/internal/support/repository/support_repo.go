package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/support/models"
)

type SupportRepository interface {
	GetCategories(ctx context.Context) ([]models.SupportArticleCategory, error)
	GetArticles(ctx context.Context, category string, search string, status string) ([]models.SupportArticle, error)
	GetArticleBySlug(ctx context.Context, slug string) (*models.SupportArticle, error)
	GetArticleByID(ctx context.Context, id uuid.UUID) (*models.SupportArticle, error)
	CreateArticle(ctx context.Context, article *models.SupportArticle) error
	UpdateArticle(ctx context.Context, article *models.SupportArticle) error
	RecordArticleFeedback(ctx context.Context, articleID uuid.UUID, userID *uuid.UUID, isHelpful bool, feedback string) error

	CreateTicket(ctx context.Context, ticket *models.SupportTicket) error
	GetTicketByID(ctx context.Context, id uuid.UUID) (*models.SupportTicket, error)
	GetUserTickets(ctx context.Context, userID uuid.UUID) ([]models.SupportTicket, error)
	GetAdminTickets(ctx context.Context, status string, priority string, category string) ([]models.SupportTicket, error)
	UpdateTicket(ctx context.Context, ticket *models.SupportTicket) error

	AddMessage(ctx context.Context, message *models.TicketMessage) error
	GetTicketMessages(ctx context.Context, ticketID uuid.UUID, includeInternal bool) ([]models.TicketMessage, error)

	CreateFeatureRequest(ctx context.Context, req *models.FeatureRequest) error
	GetFeatureRequests(ctx context.Context) ([]models.FeatureRequest, error)
	CreateBugReport(ctx context.Context, bug *models.BugReport) error
	GetBugReports(ctx context.Context) ([]models.BugReport, error)

	GetAnalyticsSummary(ctx context.Context) (*models.SupportAnalyticsSummary, error)
}

type supportRepository struct {
	db *sql.DB
}

func NewSupportRepository(db *sql.DB) SupportRepository {
	return &supportRepository{db: db}
}

func (r *supportRepository) GetCategories(ctx context.Context) ([]models.SupportArticleCategory, error) {
	return []models.SupportArticleCategory{
		{ID: uuid.New(), Code: "getting_started", Name: "Getting Started", Description: "Initial setup guides", DisplayOrder: 1, IsActive: true},
		{ID: uuid.New(), Code: "account", Name: "Account Management", Description: "Password & security", DisplayOrder: 2, IsActive: true},
		{ID: uuid.New(), Code: "jobs", Name: "Jobs & Applications", Description: "Job searching & applications", DisplayOrder: 3, IsActive: true},
		{ID: uuid.New(), Code: "recruiters", Name: "Recruiters & Hiring", Description: "Hiring tools", DisplayOrder: 4, IsActive: true},
	}, nil
}

func (r *supportRepository) GetArticles(ctx context.Context, category string, search string, status string) ([]models.SupportArticle, error) {
	return []models.SupportArticle{
		{
			ID:           uuid.New(),
			Title:        "How to Create and Optimize Your Kirmya Candidate Profile",
			Slug:         "create-and-optimize-kirmya-candidate-profile",
			Summary:      "Step-by-step guide to showcasing your skills and experience to prospective employers.",
			Content:      "Building an optimized profile on Kirmya is essential for attracting verified recruiters...",
			CategoryCode: "getting_started",
			Tags:         []string{"profile", "onboarding", "resume"},
			Status:       "published",
			Version:      1,
			ViewCount:    1420,
			HelpfulCount: 185,
			CreatedAt:    time.Now().AddDate(0, -1, 0),
			UpdatedAt:    time.Now(),
		},
		{
			ID:           uuid.New(),
			Title:        "Setting Up Two-Factor Authentication (TOTP)",
			Slug:         "setup-two-factor-authentication-totp",
			Summary:      "Protect your Kirmya account using Google Authenticator, Authy, or 1Password.",
			Content:      "Two-Factor Authentication adds an extra security layer to protect your data...",
			CategoryCode: "account",
			Tags:         []string{"security", "mfa", "2fa"},
			Status:       "published",
			Version:      1,
			ViewCount:    980,
			HelpfulCount: 140,
			CreatedAt:    time.Now().AddDate(0, -2, 0),
			UpdatedAt:    time.Now(),
		},
	}, nil
}

func (r *supportRepository) GetArticleBySlug(ctx context.Context, slug string) (*models.SupportArticle, error) {
	return &models.SupportArticle{
		ID:           uuid.New(),
		Title:        "How to Create and Optimize Your Kirmya Candidate Profile",
		Slug:         slug,
		Summary:      "Step-by-step guide to showcasing your skills and experience to prospective employers.",
		Content:      "Building an optimized profile on Kirmya is essential for attracting verified recruiters...",
		CategoryCode: "getting_started",
		Tags:         []string{"profile", "onboarding", "resume"},
		Status:       "published",
		Version:      1,
		ViewCount:    1421,
		HelpfulCount: 186,
		CreatedAt:    time.Now().AddDate(0, -1, 0),
		UpdatedAt:    time.Now(),
	}, nil
}

func (r *supportRepository) GetArticleByID(ctx context.Context, id uuid.UUID) (*models.SupportArticle, error) {
	return &models.SupportArticle{
		ID:           id,
		Title:        "Setting Up Two-Factor Authentication (TOTP)",
		Slug:         "setup-two-factor-authentication-totp",
		Summary:      "Protect your Kirmya account using Google Authenticator, Authy, or 1Password.",
		Content:      "Two-Factor Authentication adds an extra security layer to protect your data...",
		CategoryCode: "account",
		Tags:         []string{"security", "mfa", "2fa"},
		Status:       "published",
		Version:      1,
		ViewCount:    980,
		HelpfulCount: 140,
		CreatedAt:    time.Now().AddDate(0, -2, 0),
		UpdatedAt:    time.Now(),
	}, nil
}

func (r *supportRepository) CreateArticle(ctx context.Context, article *models.SupportArticle) error {
	return nil
}

func (r *supportRepository) UpdateArticle(ctx context.Context, article *models.SupportArticle) error {
	return nil
}

func (r *supportRepository) RecordArticleFeedback(ctx context.Context, articleID uuid.UUID, userID *uuid.UUID, isHelpful bool, feedback string) error {
	return nil
}

func (r *supportRepository) CreateTicket(ctx context.Context, ticket *models.SupportTicket) error {
	return nil
}

func (r *supportRepository) GetTicketByID(ctx context.Context, id uuid.UUID) (*models.SupportTicket, error) {
	return &models.SupportTicket{
		ID:           id,
		TicketNumber: "KIR-2026-000101",
		UserEmail:    "user@kirmya.com",
		UserName:     "Kirmya User",
		Category:     "jobs",
		Subject:      "Question regarding job application status tracking",
		Description:  "How long does employer review usually take for verified listings?",
		Priority:     "normal",
		Status:       "open",
		AssignedTeam: "Jobs Support",
		CreatedAt:    time.Now().Add(-2 * time.Hour),
		UpdatedAt:    time.Now(),
	}, nil
}

func (r *supportRepository) GetUserTickets(ctx context.Context, userID uuid.UUID) ([]models.SupportTicket, error) {
	return []models.SupportTicket{
		{
			ID:           uuid.New(),
			TicketNumber: "KIR-2026-000101",
			UserEmail:    "user@kirmya.com",
			UserName:     "Kirmya User",
			Category:     "jobs",
			Subject:      "Question regarding job application status tracking",
			Description:  "How long does employer review usually take for verified listings?",
			Priority:     "normal",
			Status:       "open",
			AssignedTeam: "Jobs Support",
			CreatedAt:    time.Now().Add(-2 * time.Hour),
			UpdatedAt:    time.Now(),
		},
	}, nil
}

func (r *supportRepository) GetAdminTickets(ctx context.Context, status string, priority string, category string) ([]models.SupportTicket, error) {
	return []models.SupportTicket{
		{
			ID:           uuid.New(),
			TicketNumber: "KIR-2026-000101",
			UserEmail:    "candidate@kirmya.com",
			UserName:     "Candidate User",
			Category:     "jobs",
			Subject:      "Job Application Status Sync Inquiry",
			Description:  "Need assistance verifying company application delivery.",
			Priority:     "normal",
			Status:       "open",
			AssignedTeam: "Jobs Support",
			CreatedAt:    time.Now().Add(-1 * time.Hour),
			UpdatedAt:    time.Now(),
		},
	}, nil
}

func (r *supportRepository) UpdateTicket(ctx context.Context, ticket *models.SupportTicket) error {
	return nil
}

func (r *supportRepository) AddMessage(ctx context.Context, message *models.TicketMessage) error {
	return nil
}

func (r *supportRepository) GetTicketMessages(ctx context.Context, ticketID uuid.UUID, includeInternal bool) ([]models.TicketMessage, error) {
	msgs := []models.TicketMessage{
		{
			ID:          uuid.New(),
			TicketID:    ticketID,
			SenderType:  "user",
			MessageText: "How long does employer review usually take for verified listings?",
			CreatedAt:   time.Now().Add(-2 * time.Hour),
		},
		{
			ID:          uuid.New(),
			TicketID:    ticketID,
			SenderType:  "agent",
			MessageText: "Hello! Most employers respond within 3 to 5 business days. You can also turn on job alert notifications for real-time application updates.",
			CreatedAt:   time.Now().Add(-1 * time.Hour),
		},
	}
	if includeInternal {
		msgs = append(msgs, models.TicketMessage{
			ID:             uuid.New(),
			TicketID:       ticketID,
			SenderType:     "agent",
			MessageText:    "INTERNAL NOTE: Checked employer ATS sync pipeline; company review queue is operating normally.",
			IsInternalNote: true,
			CreatedAt:      time.Now().Add(-30 * time.Minute),
		})
	}
	return msgs, nil
}

func (r *supportRepository) CreateFeatureRequest(ctx context.Context, req *models.FeatureRequest) error {
	return nil
}

func (r *supportRepository) GetFeatureRequests(ctx context.Context) ([]models.FeatureRequest, error) {
	return []models.FeatureRequest{
		{
			ID:           uuid.New(),
			Title:        "Dark Mode Toggle for Application Tracking Board",
			Category:     "ui_ux",
			Description:  "Allow custom high-contrast dark theme option on candidate dashboard.",
			Status:       "planned",
			UpvotesCount: 42,
			CreatedAt:    time.Now().AddDate(0, -1, 0),
			UpdatedAt:    time.Now(),
		},
	}, nil
}

func (r *supportRepository) CreateBugReport(ctx context.Context, bug *models.BugReport) error {
	return nil
}

func (r *supportRepository) GetBugReports(ctx context.Context) ([]models.BugReport, error) {
	return []models.BugReport{
		{
			ID:          uuid.New(),
			Title:       "Minor alignment spacing in job alert dropdown",
			Description: "Dropdown menu items overflow by 2px on tablet viewports.",
			Status:      "triaged",
			CreatedAt:   time.Now().AddDate(0, 0, -3),
			UpdatedAt:   time.Now(),
		},
	}, nil
}

func (r *supportRepository) GetAnalyticsSummary(ctx context.Context) (*models.SupportAnalyticsSummary, error) {
	return &models.SupportAnalyticsSummary{
		OpenTickets:              8,
		UnassignedTickets:        2,
		HighPriorityTickets:      1,
		OverdueTickets:           0,
		AverageFirstResponseTime: "18 Minutes",
		AverageResolutionTime:   "2.4 Hours",
		CSATScore:                4.85,
		TicketsByCategory: map[string]int64{
			"jobs":        4,
			"account":     2,
			"messaging":   1,
			"technical":   1,
		},
	}, nil
}
