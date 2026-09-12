package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

// CapabilityStatus is the freelancer capability lifecycle, as stored in
// freelancer_profiles.capability_status.
//
// It answers "may this account act as a freelancer", which is a different
// question from AvailabilityStatus ("does this freelancer want work this week").
// Conflating them would let a suspended freelancer lift their own suspension by
// marking themselves available.
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

// PortfolioItem is one entry in a freelancer's portfolio.
//
// Stored in freelance_portfolio_items since migration 0102. It used to be an
// element of a JSONB array on the profile, which could not be indexed, ordered
// or referenced; the JSON shape below is unchanged so the existing client reads
// it exactly as before.
type PortfolioItem struct {
	ID          uuid.UUID `json:"id,omitempty"`
	Title       string    `json:"title"`
	URL         string    `json:"url"`
	Description string    `json:"description,omitempty"`
	Position    int       `json:"position,omitempty"`
}

// FreelancerProfile is a freelancer's trading identity.
type FreelancerProfile struct {
	ID     uuid.UUID `json:"id"`
	UserID uuid.UUID `json:"user_id"`
	// CapabilityStatus is the lifecycle state; see CapabilityStatus above.
	CapabilityStatus CapabilityStatus `json:"capability_status"`
	// HourlyRate is minor units of Currency. It marshals as the decimal number
	// the existing client already sends and reads - see Amount in money.go for
	// why the conversion never touches a float64.
	HourlyRate         Amount             `json:"hourly_rate"`
	Currency           string             `json:"currency"`
	Tagline            string             `json:"tagline"`
	Skills             []string           `json:"skills"`
	PortfolioLinks     []PortfolioItem    `json:"portfolio_links"`
	AvailabilityStatus AvailabilityStatus `json:"availability_status"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
}

// Money returns the rate as a currency-tagged amount.
func (p *FreelancerProfile) Money() Money {
	return Money{MinorUnits: int64(p.HourlyRate), Currency: p.Currency}
}

// Project is a piece of work a client wants done.
type Project struct {
	ID             uuid.UUID     `json:"id"`
	ClientID       uuid.UUID     `json:"client_id"`
	Title          string        `json:"title"`
	Description    string        `json:"description"`
	Budget         Amount        `json:"budget"`
	Currency       string        `json:"currency"`
	BudgetType     BudgetType    `json:"budget_type"`
	SkillsRequired []string      `json:"skills_required"`
	Status         ProjectStatus `json:"status"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
	ProposalsCount int           `json:"proposals_count,omitempty"`
	Proposals      []Proposal    `json:"proposals,omitempty"`
}

// Money returns the budget as a currency-tagged amount.
func (p *Project) Money() Money {
	return Money{MinorUnits: int64(p.Budget), Currency: p.Currency}
}

// OwnedBy reports whether the account is the client who posted the project.
//
// The ownership question lives on the entity rather than in each handler so
// there is one answer to it, and a test can exercise that answer directly.
func (p *Project) OwnedBy(userID uuid.UUID) bool {
	return p != nil && p.ClientID != uuid.Nil && p.ClientID == userID
}

// Proposal is a freelancer's bid on a project.
type Proposal struct {
	ID             uuid.UUID      `json:"id"`
	ProjectID      uuid.UUID      `json:"project_id"`
	FreelancerID   uuid.UUID      `json:"freelancer_id"`
	FreelancerName string         `json:"freelancer_name"`
	BidAmount      Amount         `json:"bid_amount"`
	Currency       string         `json:"currency"`
	EstimatedDays  int            `json:"estimated_days"`
	CoverLetter    string         `json:"cover_letter"`
	Status         ProposalStatus `json:"status"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at,omitempty"`
}

// Money returns the bid as a currency-tagged amount.
func (p *Proposal) Money() Money {
	return Money{MinorUnits: int64(p.BidAmount), Currency: p.Currency}
}

// OwnedBy reports whether the account is the freelancer who wrote the bid.
func (p *Proposal) OwnedBy(userID uuid.UUID) bool {
	return p != nil && p.FreelancerID != uuid.Nil && p.FreelancerID == userID
}

// Contract is the agreement produced by accepting a proposal.
type Contract struct {
	ID           uuid.UUID      `json:"id"`
	ProjectID    uuid.UUID      `json:"project_id"`
	ProposalID   uuid.UUID      `json:"proposal_id"`
	ProjectTitle string         `json:"project_title"`
	ClientID     uuid.UUID      `json:"client_id"`
	FreelancerID uuid.UUID      `json:"freelancer_id"`
	TotalAmount  Amount         `json:"total_amount"`
	Currency     string         `json:"currency"`
	Status       ContractStatus `json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// Money returns the contract value as a currency-tagged amount.
func (c *Contract) Money() Money {
	return Money{MinorUnits: int64(c.TotalAmount), Currency: c.Currency}
}

// IsParty reports whether the account is on one side of the contract.
//
// Both sides, deliberately: a contract is the one marketplace record neither
// party may be shut out of, which is why a suspended freelancer keeps read
// access to engagements they are already bound by.
func (c *Contract) IsParty(userID uuid.UUID) bool {
	if c == nil || userID == uuid.Nil {
		return false
	}
	return c.ClientID == userID || c.FreelancerID == userID
}

// CreateProjectPayload is the client's request to post a project.
//
// Budget carries no `binding:"required"` because a draft may legitimately be
// written down before its budget is settled, and because `required` on a
// numeric field rejects a deliberate zero. The service validates it instead,
// where the rule can depend on whether the project is being published.
type CreateProjectPayload struct {
	Title          string   `json:"title" binding:"required"`
	Description    string   `json:"description" binding:"required"`
	Budget         Amount   `json:"budget"`
	Currency       string   `json:"currency"`
	BudgetType     string   `json:"budget_type"`
	SkillsRequired []string `json:"skills_required"`
}

// SubmitProposalPayload is a freelancer's bid.
type SubmitProposalPayload struct {
	BidAmount     Amount `json:"bid_amount"`
	Currency      string `json:"currency"`
	EstimatedDays int    `json:"estimated_days" binding:"required"`
	CoverLetter   string `json:"cover_letter" binding:"required"`
}

// SaveProfilePayload is a freelancer's own profile draft.
type SaveProfilePayload struct {
	HourlyRate     Amount          `json:"hourly_rate"`
	Currency       string          `json:"currency"`
	Tagline        string          `json:"tagline"`
	Skills         []string        `json:"skills"`
	PortfolioLinks []PortfolioItem `json:"portfolio_links"`
	// Availability is optional; an empty string leaves the stored value alone.
	Availability string `json:"availability_status"`
}

// UpdateProjectPayload is a partial update to a project the caller owns.
//
// Every field is a pointer so that "absent" and "set to empty" are different
// requests: a client clearing a description sends "", and a client who did not
// mention the description sends nothing at all.
type UpdateProjectPayload struct {
	Title          *string   `json:"title"`
	Description    *string   `json:"description"`
	Budget         *Amount   `json:"budget"`
	Currency       *string   `json:"currency"`
	BudgetType     *string   `json:"budget_type"`
	SkillsRequired *[]string `json:"skills_required"`
	Status         *string   `json:"status"`
}

// ProjectFilter is how the module's list endpoints narrow a result set.
//
// One filter type for every project listing, so the query parameters mean the
// same thing on the public board and on a client's own list. Pagination is
// carried separately by shared/pagination, which is the repository's existing
// format - see internal/shared/pagination.
type ProjectFilter struct {
	// ClientID restricts to one client's projects. Set by the service from the
	// authenticated caller on the "my projects" path; never read from a query
	// parameter, because that would be the whole IDOR.
	ClientID uuid.UUID
	Statuses []ProjectStatus
	Skills   []string
	// MinBudget and MaxBudget are minor units of Currency.
	MinBudget  *int64
	MaxBudget  *int64
	Currency   string
	BudgetType *BudgetType
	Search     string
	// Sort is a whitelisted key, resolved to a column by the repository. A raw
	// column name from a query string would be an injection vector.
	Sort string
}

// SortKey is a permitted ordering for a project listing.
type SortKey string

const (
	SortNewest      SortKey = "newest"
	SortOldest      SortKey = "oldest"
	SortBudgetHigh  SortKey = "budget_high"
	SortBudgetLow   SortKey = "budget_low"
	SortRecentlyUpd SortKey = "recently_updated"
)

// ParseSortKey rejects anything not on the list, so the repository never
// interpolates a caller-supplied string into an ORDER BY.
func ParseSortKey(value string) (SortKey, bool) {
	switch SortKey(normalize(value)) {
	case SortNewest:
		return SortNewest, true
	case SortOldest:
		return SortOldest, true
	case SortBudgetHigh:
		return SortBudgetHigh, true
	case SortBudgetLow:
		return SortBudgetLow, true
	case SortRecentlyUpd:
		return SortRecentlyUpd, true
	case "":
		return SortNewest, true
	}
	return "", false
}
