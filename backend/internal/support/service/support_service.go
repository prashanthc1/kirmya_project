package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/support/models"
	"kirmya/internal/support/repository"
)

type SupportService interface {
	GetCategories(ctx context.Context) ([]models.SupportArticleCategory, error)
	GetArticles(ctx context.Context, category string, search string, isStaff bool) ([]models.SupportArticle, error)
	GetArticleBySlug(ctx context.Context, slug string) (*models.SupportArticle, error)
	RecordArticleFeedback(ctx context.Context, articleID uuid.UUID, userID *uuid.UUID, isHelpful bool, feedback string) error
	CreateArticle(ctx context.Context, authorID uuid.UUID, title string, categoryCode string, summary string, content string, tags []string, status string) (*models.SupportArticle, error)

	CreateTicket(ctx context.Context, userID *uuid.UUID, payload models.CreateTicketPayload) (*models.SupportTicket, error)
	GetTicketByID(ctx context.Context, ticketID uuid.UUID, isStaff bool) (*models.SupportTicket, error)
	GetUserTickets(ctx context.Context, userID uuid.UUID) ([]models.SupportTicket, error)
	GetAdminTickets(ctx context.Context, status string, priority string, category string) ([]models.SupportTicket, error)
	AddMessage(ctx context.Context, ticketID uuid.UUID, senderID *uuid.UUID, senderType string, isInternalNote bool, messageText string, attachments []string) (*models.TicketMessage, error)
	GetTicketMessages(ctx context.Context, ticketID uuid.UUID, isStaff bool) ([]models.TicketMessage, error)

	AssignTicket(ctx context.Context, ticketID uuid.UUID, agentID *uuid.UUID, team string) error
	ResolveTicket(ctx context.Context, ticketID uuid.UUID, notes string) error
	CloseTicket(ctx context.Context, ticketID uuid.UUID) error
	ReopenTicket(ctx context.Context, ticketID uuid.UUID) error
	RecordCSAT(ctx context.Context, ticketID uuid.UUID, rating int, feedback string) error

	CreateFeatureRequest(ctx context.Context, userID *uuid.UUID, payload models.CreateFeatureRequestPayload) (*models.FeatureRequest, error)
	GetFeatureRequests(ctx context.Context) ([]models.FeatureRequest, error)
	CreateBugReport(ctx context.Context, userID *uuid.UUID, payload models.CreateBugReportPayload) (*models.BugReport, error)
	GetBugReports(ctx context.Context) ([]models.BugReport, error)

	GetAnalyticsSummary(ctx context.Context) (*models.SupportAnalyticsSummary, error)
}

type supportService struct {
	repo repository.SupportRepository
}

func NewSupportService(repo repository.SupportRepository) SupportService {
	return &supportService{repo: repo}
}

func (s *supportService) GetCategories(ctx context.Context) ([]models.SupportArticleCategory, error) {
	return s.repo.GetCategories(ctx)
}

func (s *supportService) GetArticles(ctx context.Context, category string, search string, isStaff bool) ([]models.SupportArticle, error) {
	status := "published"
	if isStaff {
		status = "" // Return all statuses for admins
	}
	return s.repo.GetArticles(ctx, category, search, status)
}

func (s *supportService) GetArticleBySlug(ctx context.Context, slug string) (*models.SupportArticle, error) {
	return s.repo.GetArticleBySlug(ctx, slug)
}

func (s *supportService) RecordArticleFeedback(ctx context.Context, articleID uuid.UUID, userID *uuid.UUID, isHelpful bool, feedback string) error {
	return s.repo.RecordArticleFeedback(ctx, articleID, userID, isHelpful, feedback)
}

func (s *supportService) CreateArticle(ctx context.Context, authorID uuid.UUID, title string, categoryCode string, summary string, content string, tags []string, status string) (*models.SupportArticle, error) {
	slug := strings.ToLower(strings.ReplaceAll(title, " ", "-"))
	article := &models.SupportArticle{
		ID:           uuid.New(),
		Title:        title,
		Slug:         slug,
		Summary:      summary,
		Content:      content,
		CategoryCode: categoryCode,
		Tags:         tags,
		Status:       status,
		AuthorID:     &authorID,
		Version:      1,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.repo.CreateArticle(ctx, article); err != nil {
		return nil, err
	}
	return article, nil
}

func (s *supportService) CreateTicket(ctx context.Context, userID *uuid.UUID, payload models.CreateTicketPayload) (*models.SupportTicket, error) {
	// Generate unique human-readable ticket number: KIR-2026-XXXXXX
	numBuf := make([]byte, 3)
	_, _ = rand.Read(numBuf)
	ticketNumber := fmt.Sprintf("KIR-2026-%06X", numBuf)

	priority := payload.Priority
	if priority == "" {
		priority = "normal"
	}

	// Calculate SLA due date
	var slaHours time.Duration
	switch priority {
	case "urgent":
		slaHours = 1 * time.Hour
	case "high":
		slaHours = 4 * time.Hour
	case "low":
		slaHours = 48 * time.Hour
	default:
		slaHours = 24 * time.Hour
	}
	slaDueAt := time.Now().Add(slaHours)

	var relatedResourceID *uuid.UUID
	if payload.RelatedResourceID != "" {
		if id, err := uuid.Parse(payload.RelatedResourceID); err == nil {
			relatedResourceID = &id
		}
	}

	assignedTeam := "General Support"
	if payload.Category == "security" {
		assignedTeam = "Security"
	} else if payload.Category == "privacy" {
		assignedTeam = "Privacy"
	} else if payload.Category == "trust_safety" {
		assignedTeam = "Trust & Safety"
	} else if payload.Category == "jobs" || payload.Category == "applications" {
		assignedTeam = "Jobs Support"
	}

	ticket := &models.SupportTicket{
		ID:                  uuid.New(),
		TicketNumber:        ticketNumber,
		UserID:              userID,
		UserEmail:           payload.UserEmail,
		UserName:            payload.UserName,
		Category:            payload.Category,
		Subject:             payload.Subject,
		Description:         payload.Description,
		Priority:            priority,
		Status:              "open",
		AssignedTeam:        assignedTeam,
		RelatedResourceType: payload.RelatedResourceType,
		RelatedResourceID:   relatedResourceID,
		SLADueAt:            &slaDueAt,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	if err := s.repo.CreateTicket(ctx, ticket); err != nil {
		return nil, err
	}

	// Initial message in thread
	initialMsg := &models.TicketMessage{
		ID:             uuid.New(),
		TicketID:       ticket.ID,
		SenderID:       userID,
		SenderType:     "user",
		MessageText:    payload.Description,
		IsInternalNote: false,
		AttachmentURLs: payload.Attachments,
		CreatedAt:      time.Now(),
	}
	_ = s.repo.AddMessage(ctx, initialMsg)

	return ticket, nil
}

func (s *supportService) GetTicketByID(ctx context.Context, ticketID uuid.UUID, isStaff bool) (*models.SupportTicket, error) {
	return s.repo.GetTicketByID(ctx, ticketID)
}

func (s *supportService) GetUserTickets(ctx context.Context, userID uuid.UUID) ([]models.SupportTicket, error) {
	return s.repo.GetUserTickets(ctx, userID)
}

func (s *supportService) GetAdminTickets(ctx context.Context, status string, priority string, category string) ([]models.SupportTicket, error) {
	return s.repo.GetAdminTickets(ctx, status, priority, category)
}

func (s *supportService) AddMessage(ctx context.Context, ticketID uuid.UUID, senderID *uuid.UUID, senderType string, isInternalNote bool, messageText string, attachments []string) (*models.TicketMessage, error) {
	if isInternalNote && senderType != "agent" {
		return nil, errors.New("UNAUTHORIZED_INTERNAL_NOTE: Only authorized support staff can create internal notes.")
	}

	msg := &models.TicketMessage{
		ID:             uuid.New(),
		TicketID:       ticketID,
		SenderID:       senderID,
		SenderType:     senderType,
		MessageText:    messageText,
		IsInternalNote: isInternalNote,
		AttachmentURLs: attachments,
		CreatedAt:      time.Now(),
	}

	if err := s.repo.AddMessage(ctx, msg); err != nil {
		return nil, err
	}
	return msg, nil
}

func (s *supportService) GetTicketMessages(ctx context.Context, ticketID uuid.UUID, isStaff bool) ([]models.TicketMessage, error) {
	return s.repo.GetTicketMessages(ctx, ticketID, isStaff)
}

func (s *supportService) AssignTicket(ctx context.Context, ticketID uuid.UUID, agentID *uuid.UUID, team string) error {
	ticket, err := s.repo.GetTicketByID(ctx, ticketID)
	if err != nil {
		return err
	}
	ticket.AssignedAgentID = agentID
	if team != "" {
		ticket.AssignedTeam = team
	}
	ticket.UpdatedAt = time.Now()
	return s.repo.UpdateTicket(ctx, ticket)
}

func (s *supportService) ResolveTicket(ctx context.Context, ticketID uuid.UUID, notes string) error {
	ticket, err := s.repo.GetTicketByID(ctx, ticketID)
	if err != nil {
		return err
	}
	ticket.Status = "resolved"
	now := time.Now()
	ticket.ResolvedAt = &now
	ticket.UpdatedAt = now
	return s.repo.UpdateTicket(ctx, ticket)
}

func (s *supportService) CloseTicket(ctx context.Context, ticketID uuid.UUID) error {
	ticket, err := s.repo.GetTicketByID(ctx, ticketID)
	if err != nil {
		return err
	}
	ticket.Status = "closed"
	now := time.Now()
	ticket.ClosedAt = &now
	ticket.UpdatedAt = now
	return s.repo.UpdateTicket(ctx, ticket)
}

func (s *supportService) ReopenTicket(ctx context.Context, ticketID uuid.UUID) error {
	ticket, err := s.repo.GetTicketByID(ctx, ticketID)
	if err != nil {
		return err
	}
	ticket.Status = "reopened"
	ticket.UpdatedAt = time.Now()
	return s.repo.UpdateTicket(ctx, ticket)
}

func (s *supportService) RecordCSAT(ctx context.Context, ticketID uuid.UUID, rating int, feedback string) error {
	if rating < 1 || rating > 5 {
		return errors.New("INVALID_RATING: Rating must be between 1 and 5.")
	}

	ticket, err := s.repo.GetTicketByID(ctx, ticketID)
	if err != nil {
		return err
	}
	ticket.SatisfactionRating = rating
	ticket.SatisfactionFeedback = feedback
	ticket.UpdatedAt = time.Now()
	return s.repo.UpdateTicket(ctx, ticket)
}

func (s *supportService) CreateFeatureRequest(ctx context.Context, userID *uuid.UUID, payload models.CreateFeatureRequestPayload) (*models.FeatureRequest, error) {
	req := &models.FeatureRequest{
		ID:           uuid.New(),
		UserID:       userID,
		Title:        payload.Title,
		Category:     payload.Category,
		Description:  payload.Description,
		Status:       "submitted",
		UpvotesCount: 1,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if err := s.repo.CreateFeatureRequest(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *supportService) GetFeatureRequests(ctx context.Context) ([]models.FeatureRequest, error) {
	return s.repo.GetFeatureRequests(ctx)
}

func (s *supportService) CreateBugReport(ctx context.Context, userID *uuid.UUID, payload models.CreateBugReportPayload) (*models.BugReport, error) {
	bug := &models.BugReport{
		ID:               uuid.New(),
		UserID:           userID,
		Title:            payload.Title,
		Description:      payload.Description,
		StepsToReproduce: payload.StepsToReproduce,
		ExpectedBehavior: payload.ExpectedBehavior,
		ActualBehavior:   payload.ActualBehavior,
		Browser:          payload.Browser,
		OS:               payload.OS,
		Device:           payload.Device,
		ScreenshotURLs:   payload.ScreenshotURLs,
		Status:           "new",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	if err := s.repo.CreateBugReport(ctx, bug); err != nil {
		return nil, err
	}
	return bug, nil
}

func (s *supportService) GetBugReports(ctx context.Context) ([]models.BugReport, error) {
	return s.repo.GetBugReports(ctx)
}

func (s *supportService) GetAnalyticsSummary(ctx context.Context) (*models.SupportAnalyticsSummary, error) {
	return s.repo.GetAnalyticsSummary(ctx)
}
