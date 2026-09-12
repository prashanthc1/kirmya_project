package domain

import (
	"time"

	"github.com/google/uuid"
)

// The foundation entities.
//
// These mirror the tables migration 0102 creates. No endpoint writes them in
// this change - the marketplace flows they belong to are not built yet - but
// they are defined here so that the repository interfaces in the package next
// door have a type to speak in, and so that the shape of each record is settled
// in one reviewable place rather than invented by whichever handler gets there
// first.
//
// Every monetary field is Amount (minor units) with a sibling Currency, and
// every lifecycle field is one of the typed statuses in states.go.

// ProposalMilestone is one step of a bid's proposed payment schedule.
//
// The schedule is an offer: it stops changing when the proposal is accepted,
// and the ContractMilestone rows created from it are what then moves.
type ProposalMilestone struct {
	ID          uuid.UUID  `json:"id"`
	ProposalID  uuid.UUID  `json:"proposal_id"`
	Position    int        `json:"position"`
	Title       string     `json:"title"`
	Description string     `json:"description,omitempty"`
	Amount      Amount     `json:"amount"`
	Currency    string     `json:"currency"`
	DueAt       *time.Time `json:"due_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// ContractMilestone is one step of a live contract's schedule of work and money.
type ContractMilestone struct {
	ID          uuid.UUID  `json:"id"`
	ContractID  uuid.UUID  `json:"contract_id"`
	Position    int        `json:"position"`
	Title       string     `json:"title"`
	Description string     `json:"description,omitempty"`
	Amount      Amount     `json:"amount"`
	Currency    string     `json:"currency"`
	Status      string     `json:"status"`
	DueAt       *time.Time `json:"due_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Service is a productised offering a freelancer sells at a fixed price, as
// opposed to bidding on a client's project.
type Service struct {
	ID           uuid.UUID        `json:"id"`
	FreelancerID uuid.UUID        `json:"freelancer_id"`
	Title        string           `json:"title"`
	Description  string           `json:"description"`
	Category     string           `json:"category,omitempty"`
	Status       ServiceStatus    `json:"status"`
	Packages     []ServicePackage `json:"packages,omitempty"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
}

// OwnedBy reports whether the account is the freelancer selling the service.
func (s *Service) OwnedBy(userID uuid.UUID) bool {
	return s != nil && s.FreelancerID != uuid.Nil && s.FreelancerID == userID
}

// ServicePackage is one priced tier of a service.
type ServicePackage struct {
	ID           uuid.UUID `json:"id"`
	ServiceID    uuid.UUID `json:"service_id"`
	Tier         string    `json:"tier"`
	Title        string    `json:"title"`
	Description  string    `json:"description,omitempty"`
	Price        Amount    `json:"price"`
	Currency     string    `json:"currency"`
	DeliveryDays int       `json:"delivery_days"`
	Revisions    int       `json:"revisions"`
	CreatedAt    time.Time `json:"created_at"`
}

// Delivery is a submission of work against a contract.
type Delivery struct {
	ID          uuid.UUID  `json:"id"`
	ContractID  uuid.UUID  `json:"contract_id"`
	MilestoneID *uuid.UUID `json:"milestone_id,omitempty"`
	SubmittedBy uuid.UUID  `json:"submitted_by"`
	Summary     string     `json:"summary"`
	Attachments []string   `json:"attachments"`
	Status      string     `json:"status"`
	ReviewedAt  *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// PaymentIntent is a request to move money into escrow for a contract.
//
// Schema and type only. No payment provider is integrated, nothing writes this,
// and Provider is deliberately a bare string rather than a processor-specific
// set of columns: the processor has not been chosen, and modelling one into the
// schema now would have to be undone.
type PaymentIntent struct {
	ID                uuid.UUID  `json:"id"`
	ContractID        uuid.UUID  `json:"contract_id"`
	MilestoneID       *uuid.UUID `json:"milestone_id,omitempty"`
	PayerID           uuid.UUID  `json:"payer_id"`
	Amount            Amount     `json:"amount"`
	Currency          string     `json:"currency"`
	Status            string     `json:"status"`
	Provider          string     `json:"provider,omitempty"`
	ProviderReference string     `json:"provider_reference,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// Payout is money leaving escrow towards a freelancer. Schema and type only.
type Payout struct {
	ID                uuid.UUID  `json:"id"`
	ContractID        *uuid.UUID `json:"contract_id,omitempty"`
	PayeeID           uuid.UUID  `json:"payee_id"`
	Amount            Amount     `json:"amount"`
	Currency          string     `json:"currency"`
	Status            string     `json:"status"`
	Provider          string     `json:"provider,omitempty"`
	ProviderReference string     `json:"provider_reference,omitempty"`
	PaidAt            *time.Time `json:"paid_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// Review is one party's rating of the other after a contract.
type Review struct {
	ID         uuid.UUID `json:"id"`
	ContractID uuid.UUID `json:"contract_id"`
	AuthorID   uuid.UUID `json:"author_id"`
	SubjectID  uuid.UUID `json:"subject_id"`
	Rating     int       `json:"rating"`
	Comment    string    `json:"comment"`
	IsPublic   bool      `json:"is_public"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Dispute is a raised disagreement over a contract.
type Dispute struct {
	ID          uuid.UUID     `json:"id"`
	ContractID  uuid.UUID     `json:"contract_id"`
	MilestoneID *uuid.UUID    `json:"milestone_id,omitempty"`
	RaisedBy    uuid.UUID     `json:"raised_by"`
	Reason      string        `json:"reason"`
	Detail      string        `json:"detail"`
	Status      DisputeStatus `json:"status"`
	Resolution  string        `json:"resolution,omitempty"`
	ResolvedBy  *uuid.UUID    `json:"resolved_by,omitempty"`
	ResolvedAt  *time.Time    `json:"resolved_at,omitempty"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

// DisputeEvidence is one item submitted in support of a dispute.
type DisputeEvidence struct {
	ID         uuid.UUID `json:"id"`
	DisputeID  uuid.UUID `json:"dispute_id"`
	UploadedBy uuid.UUID `json:"uploaded_by"`
	Kind       string    `json:"kind"`
	Body       string    `json:"body"`
	FileURL    string    `json:"file_url,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// VerificationRecord is one check against a freelancer's trading identity.
//
// Distinct from the platform-wide verification module because what is verified
// here is the right to be paid for work, not a profile badge.
type VerificationRecord struct {
	ID         uuid.UUID  `json:"id"`
	ProfileID  uuid.UUID  `json:"profile_id"`
	Kind       string     `json:"kind"`
	Status     string     `json:"status"`
	Reference  string     `json:"reference,omitempty"`
	Notes      string     `json:"notes,omitempty"`
	ReviewedBy *uuid.UUID `json:"reviewed_by,omitempty"`
	ReviewedAt *time.Time `json:"reviewed_at,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

// Favorite is a saved project, service or freelancer.
type Favorite struct {
	UserID     uuid.UUID      `json:"user_id"`
	TargetType FavoriteTarget `json:"target_type"`
	TargetID   uuid.UUID      `json:"target_id"`
	CreatedAt  time.Time      `json:"created_at"`
}
