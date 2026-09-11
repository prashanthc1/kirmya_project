package domain

import (
	"strings"
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

// CapabilityStatus is the freelancer capability lifecycle, as stored in
// freelancer_profiles.capability_status.
//
// It answers "may this account act as a freelancer", which is a different
// question from AvailabilityStatus below ("does this freelancer want work this
// week"). Conflating them would let a suspended freelancer lift their own
// suspension by marking themselves available.
type CapabilityStatus string

const (
	// CapabilityPending: a profile exists, onboarding is not complete. The
	// account may finish onboarding and do nothing else as a freelancer.
	CapabilityPending CapabilityStatus = "pending"
	// CapabilityActive: onboarding completed; the capability is usable.
	CapabilityActive CapabilityStatus = "active"
	// CapabilitySuspended: withdrawn by an administrator. Denied, not
	// self-restorable, and the Kirmya account itself is untouched.
	CapabilitySuspended CapabilityStatus = "suspended"
)

// RequiredForActivation reports whether a profile carries the details a
// freelancer needs before they can be hired, and is the rule that decides
// whether onboarding may complete.
//
// A rate, a tagline and at least one skill. These are the three things a client
// sees when deciding whether to hire, and requiring them is what makes
// completing onboarding a deliberate act rather than a side effect of an empty
// POST body - which is exactly what used to grant the Freelancer workspace.
//
// It is also the rule migration 0101 backfills with, so a legacy profile and a
// new one are judged complete by the same standard.
func (p *FreelancerProfile) RequiredForActivation() []string {
	var missing []string
	if p == nil {
		return []string{"hourly_rate", "tagline", "skills"}
	}
	if p.HourlyRate <= 0 {
		missing = append(missing, "hourly_rate")
	}
	if strings.TrimSpace(p.Tagline) == "" {
		missing = append(missing, "tagline")
	}
	if len(p.Skills) == 0 {
		missing = append(missing, "skills")
	}
	return missing
}

type PortfolioItem struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type FreelancerProfile struct {
	ID     uuid.UUID `json:"id"`
	UserID uuid.UUID `json:"user_id"`
	// CapabilityStatus is the lifecycle state; see CapabilityStatus above.
	CapabilityStatus   CapabilityStatus `json:"capability_status"`
	HourlyRate         float64          `json:"hourly_rate"`
	Tagline            string           `json:"tagline"`
	Skills             []string         `json:"skills"`
	PortfolioLinks     []PortfolioItem  `json:"portfolio_links"`
	AvailabilityStatus string           `json:"availability_status"` // 'available', 'busy'
	CreatedAt          time.Time        `json:"created_at"`
	UpdatedAt          time.Time        `json:"updated_at"`
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
