package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	BudgetTypeFixed  = "fixed"
	BudgetTypeHourly = "hourly"

	ProjectStatusOpen       = "open"
	ProjectStatusInProgress = "in_progress"
	ProjectStatusCompleted  = "completed"

	ProposalStatusSubmitted = "submitted"
	ProposalStatusAccepted  = "accepted"
	ProposalStatusRejected  = "rejected"

	ContractStatusActive    = "active"
	ContractStatusCompleted = "completed"
)

type PortfolioItem struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type FreelancerProfile struct {
	ID                 uuid.UUID       `json:"id"`
	UserID             uuid.UUID       `json:"user_id"`
	HourlyRate         float64         `json:"hourly_rate"`
	Tagline            string          `json:"tagline"`
	Skills             []string        `json:"skills"`
	PortfolioLinks     []PortfolioItem `json:"portfolio_links"`
	AvailabilityStatus string          `json:"availability_status"` // 'available', 'busy'
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}

type Project struct {
	ID             uuid.UUID  `json:"id"`
	ClientID       uuid.UUID  `json:"client_id"`
	Title          string     `json:"title"`
	Description    string     `json:"description"`
	Budget         float64    `json:"budget"`
	BudgetType     string     `json:"budget_type"`
	SkillsRequired []string   `json:"skills_required"`
	Status         string     `json:"status"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	ProposalsCount int        `json:"proposals_count,omitempty"`
	Proposals      []Proposal `json:"proposals,omitempty"`
}

type Proposal struct {
	ID             uuid.UUID `json:"id"`
	ProjectID      uuid.UUID `json:"project_id"`
	FreelancerID   uuid.UUID `json:"freelancer_id"`
	FreelancerName string    `json:"freelancer_name"`
	BidAmount      float64   `json:"bid_amount"`
	EstimatedDays  int       `json:"estimated_days"`
	CoverLetter    string    `json:"cover_letter"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}

type Contract struct {
	ID           uuid.UUID `json:"id"`
	ProjectID    uuid.UUID `json:"project_id"`
	ProposalID   uuid.UUID `json:"proposal_id"`
	ProjectTitle string    `json:"project_title"`
	ClientID     uuid.UUID `json:"client_id"`
	FreelancerID uuid.UUID `json:"freelancer_id"`
	TotalAmount  float64   `json:"total_amount"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateProjectPayload struct {
	Title          string   `json:"title" binding:"required"`
	Description    string   `json:"description" binding:"required"`
	Budget         float64  `json:"budget" binding:"required"`
	BudgetType     string   `json:"budget_type"` // 'fixed', 'hourly'
	SkillsRequired []string `json:"skills_required"`
}

type SubmitProposalPayload struct {
	BidAmount     float64 `json:"bid_amount" binding:"required"`
	EstimatedDays int     `json:"estimated_days" binding:"required"`
	CoverLetter   string  `json:"cover_letter" binding:"required"`
}

type SaveProfilePayload struct {
	HourlyRate     float64         `json:"hourly_rate"`
	Tagline        string          `json:"tagline"`
	Skills         []string        `json:"skills"`
	PortfolioLinks []PortfolioItem `json:"portfolio_links"`
}
