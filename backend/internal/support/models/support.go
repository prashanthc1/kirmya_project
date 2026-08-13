package models

import (
	"time"

	"github.com/google/uuid"
)

// SupportArticleCategory represents knowledge base category metadata.
type SupportArticleCategory struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Code        string    `json:"code" db:"code"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description,omitempty" db:"description"`
	DisplayOrder int      `json:"display_order" db:"display_order"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// SupportArticle represents a public or internal knowledge base article.
type SupportArticle struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	Title           string     `json:"title" db:"title"`
	Slug            string     `json:"slug" db:"slug"`
	Summary         string     `json:"summary" db:"summary"`
	Content         string     `json:"content" db:"content"`
	CategoryCode    string     `json:"category_code" db:"category_code"`
	Tags            []string   `json:"tags,omitempty" db:"tags"`
	Status          string     `json:"status" db:"status"` // draft, review, published, archived
	AuthorID        *uuid.UUID `json:"author_id,omitempty" db:"author_id"`
	Version         int        `json:"version" db:"version"`
	ViewCount       int        `json:"view_count" db:"view_count"`
	HelpfulCount    int        `json:"helpful_count" db:"helpful_count"`
	NotHelpfulCount int        `json:"not_helpful_count" db:"not_helpful_count"`
	PublishedAt     *time.Time `json:"published_at,omitempty" db:"published_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// ArticleFeedbackPayload for "Was this helpful?" submissions.
type ArticleFeedbackPayload struct {
	IsHelpful bool   `json:"is_helpful"`
	Feedback  string `json:"feedback,omitempty"`
}

// SupportTicket represents a customer support request.
type SupportTicket struct {
	ID                  uuid.UUID  `json:"id" db:"id"`
	TicketNumber        string     `json:"ticket_number" db:"ticket_number"`
	UserID              *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	UserEmail           string     `json:"user_email" db:"user_email"`
	UserName            string     `json:"user_name" db:"user_name"`
	Category            string     `json:"category" db:"category"` // account, auth, profile, jobs, applications, recruiters, companies, messaging, notifications, privacy, security, trust_safety, technical, feedback, feature_request, other
	Subject             string     `json:"subject" db:"subject"`
	Description         string     `json:"description" db:"description"`
	Priority            string     `json:"priority" db:"priority"` // low, normal, high, urgent
	Status              string     `json:"status" db:"status"`     // open, pending, in_progress, waiting_for_user, waiting_for_internal, escalated, resolved, closed, reopened
	AssignedAgentID     *uuid.UUID `json:"assigned_agent_id,omitempty" db:"assigned_agent_id"`
	AssignedTeam        string     `json:"assigned_team" db:"assigned_team"`
	RelatedResourceType string     `json:"related_resource_type,omitempty" db:"related_resource_type"`
	RelatedResourceID   *uuid.UUID `json:"related_resource_id,omitempty" db:"related_resource_id"`
	SLADueAt            *time.Time `json:"sla_due_at,omitempty" db:"sla_due_at"`
	SatisfactionRating  int        `json:"satisfaction_rating,omitempty" db:"satisfaction_rating"` // 1-5
	SatisfactionFeedback string    `json:"satisfaction_feedback,omitempty" db:"satisfaction_feedback"`
	ResolvedAt          *time.Time `json:"resolved_at,omitempty" db:"resolved_at"`
	ClosedAt            *time.Time `json:"closed_at,omitempty" db:"closed_at"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at"`
}

// CreateTicketPayload payload for creating a new support ticket.
type CreateTicketPayload struct {
	UserEmail           string   `json:"user_email"`
	UserName            string   `json:"user_name"`
	Category            string   `json:"category" binding:"required"`
	Subject             string   `json:"subject" binding:"required"`
	Description         string   `json:"description" binding:"required"`
	Priority            string   `json:"priority"`
	RelatedResourceType string   `json:"related_resource_type"`
	RelatedResourceID   string   `json:"related_resource_id"`
	Attachments         []string `json:"attachments"`
}

// TicketMessage represents a message in a ticket conversation thread.
type TicketMessage struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	TicketID       uuid.UUID  `json:"ticket_id" db:"ticket_id"`
	SenderID       *uuid.UUID `json:"sender_id,omitempty" db:"sender_id"`
	SenderType     string     `json:"sender_type" db:"sender_type"` // user, agent, system
	MessageText    string     `json:"message_text" db:"message_text"`
	IsInternalNote bool       `json:"is_internal_note" db:"is_internal_note"`
	AttachmentURLs []string   `json:"attachment_urls,omitempty" db:"attachment_urls"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
}

// CreateMessagePayload payload for adding a message or internal note.
type CreateMessagePayload struct {
	MessageText    string   `json:"message_text" binding:"required"`
	IsInternalNote bool     `json:"is_internal_note"`
	Attachments    []string `json:"attachments"`
}

// AssignTicketPayload payload for reassigning a ticket.
type AssignTicketPayload struct {
	AgentID *string `json:"agent_id"`
	Team    string  `json:"team"`
}

// CSATFeedbackPayload rating payload.
type CSATFeedbackPayload struct {
	Rating   int    `json:"rating" binding:"required"`
	Feedback string `json:"feedback"`
}

// FeatureRequest payload & model.
type FeatureRequest struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	UserID       *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	Title        string     `json:"title" db:"title"`
	Category     string     `json:"category" db:"category"`
	Description  string     `json:"description" db:"description"`
	Status       string     `json:"status" db:"status"` // submitted, under_review, planned, in_development, released, declined
	UpvotesCount int        `json:"upvotes_count" db:"upvotes_count"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

// CreateFeatureRequestPayload payload.
type CreateFeatureRequestPayload struct {
	Title       string `json:"title" binding:"required"`
	Category    string `json:"category" binding:"required"`
	Description string `json:"description" binding:"required"`
}

// BugReport payload & model.
type BugReport struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	UserID            *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	Title             string     `json:"title" db:"title"`
	Description       string     `json:"description" db:"description"`
	StepsToReproduce  string     `json:"steps_to_reproduce,omitempty" db:"steps_to_reproduce"`
	ExpectedBehavior  string     `json:"expected_behavior,omitempty" db:"expected_behavior"`
	ActualBehavior    string     `json:"actual_behavior,omitempty" db:"actual_behavior"`
	Browser           string     `json:"browser,omitempty" db:"browser"`
	OS                string     `json:"os,omitempty" db:"os"`
	Device            string     `json:"device,omitempty" db:"device"`
	ScreenshotURLs    []string   `json:"screenshot_urls,omitempty" db:"screenshot_urls"`
	Status            string     `json:"status" db:"status"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
}

// CreateBugReportPayload payload.
type CreateBugReportPayload struct {
	Title            string   `json:"title" binding:"required"`
	Description      string   `json:"description" binding:"required"`
	StepsToReproduce string   `json:"steps_to_reproduce"`
	ExpectedBehavior string   `json:"expected_behavior"`
	ActualBehavior   string   `json:"actual_behavior"`
	Browser          string   `json:"browser"`
	OS               string   `json:"os"`
	Device           string   `json:"device"`
	ScreenshotURLs   []string `json:"screenshot_urls"`
}

// SupportAnalyticsSummary metrics.
type SupportAnalyticsSummary struct {
	OpenTickets             int64            `json:"open_tickets"`
	UnassignedTickets       int64            `json:"unassigned_tickets"`
	HighPriorityTickets     int64            `json:"high_priority_tickets"`
	OverdueTickets          int64            `json:"overdue_tickets"`
	AverageFirstResponseTime string           `json:"average_first_response_time"`
	AverageResolutionTime   string           `json:"average_resolution_time"`
	CSATScore               float64          `json:"csat_score"`
	TicketsByCategory       map[string]int64 `json:"tickets_by_category"`
}
