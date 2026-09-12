package domain

import "strings"

// The marketplace lifecycles.
//
// Migration 0032 wrote its states in a trailing SQL comment and enforced none of
// them, so a typo was stored and read back as a state no handler had a branch
// for. Each vocabulary below is now three things at once: a CHECK constraint in
// migration 0102, a Parse function that refuses an unknown value at the edge,
// and a transition table that refuses an impossible move at the service layer.
//
// The transition tables are the part a database CHECK cannot express. A CHECK
// says "status is one of these"; it cannot say "a cancelled project does not
// become active again". This file follows internal/company/domain/states.go,
// which is the pattern already established in the repository.

// ProjectStatus is the lifecycle of a client's posted project.
type ProjectStatus string

const (
	// ProjectDraft is written down but shown to nobody. 0032 had no such state:
	// posting a project published it in the same irreversible act.
	ProjectDraft ProjectStatus = "draft"
	// ProjectPublished is visible but not yet taking bids.
	ProjectPublished ProjectStatus = "published"
	// ProjectAcceptingProposals is what 0032 called 'open'.
	ProjectAcceptingProposals ProjectStatus = "accepting_proposals"
	// ProjectHired means a proposal was accepted and a contract exists.
	ProjectHired ProjectStatus = "hired"
	// ProjectActive is what 0032 called 'in_progress'.
	ProjectActive    ProjectStatus = "active"
	ProjectCompleted ProjectStatus = "completed"
	ProjectCancelled ProjectStatus = "cancelled"
	ProjectDisputed  ProjectStatus = "disputed"
)

// ParseProjectStatus rejects unknown values rather than defaulting to one.
func ParseProjectStatus(value string) (ProjectStatus, bool) {
	switch ProjectStatus(normalize(value)) {
	case ProjectDraft:
		return ProjectDraft, true
	case ProjectPublished:
		return ProjectPublished, true
	case ProjectAcceptingProposals:
		return ProjectAcceptingProposals, true
	case ProjectHired:
		return ProjectHired, true
	case ProjectActive:
		return ProjectActive, true
	case ProjectCompleted:
		return ProjectCompleted, true
	case ProjectCancelled:
		return ProjectCancelled, true
	case ProjectDisputed:
		return ProjectDisputed, true
	}
	return "", false
}

// projectTransitions is the whole set of legal moves.
//
// Read it as a one-way street with two exits. Work moves forward through the
// hiring states; cancellation is reachable from anywhere work has not finished;
// completion and cancellation are terminal, and a dispute can only return to
// the state that raised it or end the project.
var projectTransitions = map[ProjectStatus][]ProjectStatus{
	ProjectDraft:              {ProjectPublished, ProjectCancelled},
	ProjectPublished:          {ProjectAcceptingProposals, ProjectDraft, ProjectCancelled},
	ProjectAcceptingProposals: {ProjectHired, ProjectPublished, ProjectCancelled},
	ProjectHired:              {ProjectActive, ProjectCancelled, ProjectDisputed},
	ProjectActive:             {ProjectCompleted, ProjectCancelled, ProjectDisputed},
	ProjectDisputed:           {ProjectActive, ProjectCompleted, ProjectCancelled},
	// Terminal. A finished project is history; re-opening one would silently
	// change what both parties already agreed was done.
	ProjectCompleted: nil,
	ProjectCancelled: nil,
}

// CanTransitionTo reports whether the move is legal. A status is always allowed
// to "move" to itself, so an idempotent write is not an error.
func (s ProjectStatus) CanTransitionTo(next ProjectStatus) bool {
	return allowed(projectTransitions[s], s, next)
}

// IsTerminal reports whether the project can still change.
func (s ProjectStatus) IsTerminal() bool {
	return s == ProjectCompleted || s == ProjectCancelled
}

// AcceptsProposals reports whether a freelancer may bid right now.
func (s ProjectStatus) AcceptsProposals() bool { return s == ProjectAcceptingProposals }

// IsPubliclyVisible reports whether an anonymous visitor may see the project.
// A draft belongs to its client alone.
func (s ProjectStatus) IsPubliclyVisible() bool { return s != ProjectDraft }

// ProposalStatus is the lifecycle of a freelancer's bid.
type ProposalStatus string

const (
	ProposalDraft       ProposalStatus = "draft"
	ProposalSubmitted   ProposalStatus = "submitted"
	ProposalViewed      ProposalStatus = "viewed"
	ProposalShortlisted ProposalStatus = "shortlisted"
	ProposalAccepted    ProposalStatus = "accepted"
	ProposalRejected    ProposalStatus = "rejected"
	ProposalWithdrawn   ProposalStatus = "withdrawn"
)

// ParseProposalStatus rejects unknown values.
func ParseProposalStatus(value string) (ProposalStatus, bool) {
	switch ProposalStatus(normalize(value)) {
	case ProposalDraft:
		return ProposalDraft, true
	case ProposalSubmitted:
		return ProposalSubmitted, true
	case ProposalViewed:
		return ProposalViewed, true
	case ProposalShortlisted:
		return ProposalShortlisted, true
	case ProposalAccepted:
		return ProposalAccepted, true
	case ProposalRejected:
		return ProposalRejected, true
	case ProposalWithdrawn:
		return ProposalWithdrawn, true
	}
	return "", false
}

// proposalTransitions.
//
// viewed and shortlisted are the client reading and sorting; withdrawn is the
// freelancer's own exit and is available right up until acceptance, because a
// freelancer who has taken other work must be able to say so. Once accepted the
// bid is the basis of a contract and stops moving.
var proposalTransitions = map[ProposalStatus][]ProposalStatus{
	ProposalDraft:       {ProposalSubmitted, ProposalWithdrawn},
	ProposalSubmitted:   {ProposalViewed, ProposalShortlisted, ProposalAccepted, ProposalRejected, ProposalWithdrawn},
	ProposalViewed:      {ProposalShortlisted, ProposalAccepted, ProposalRejected, ProposalWithdrawn},
	ProposalShortlisted: {ProposalAccepted, ProposalRejected, ProposalWithdrawn},
	// Terminal.
	ProposalAccepted:  nil,
	ProposalRejected:  nil,
	ProposalWithdrawn: nil,
}

func (s ProposalStatus) CanTransitionTo(next ProposalStatus) bool {
	return allowed(proposalTransitions[s], s, next)
}

// IsOpen reports whether the bid is still in play for the client to accept.
func (s ProposalStatus) IsOpen() bool {
	return s == ProposalSubmitted || s == ProposalViewed || s == ProposalShortlisted
}

func (s ProposalStatus) IsTerminal() bool {
	return s == ProposalAccepted || s == ProposalRejected || s == ProposalWithdrawn
}

// ContractStatus is the lifecycle of the agreement itself.
type ContractStatus string

const (
	// ContractPending is created but not yet started - the state a contract is
	// in between acceptance and the first payment or kickoff.
	ContractPending           ContractStatus = "pending"
	ContractActive            ContractStatus = "active"
	ContractInProgress        ContractStatus = "in_progress"
	ContractSubmitted         ContractStatus = "submitted"
	ContractRevisionRequested ContractStatus = "revision_requested"
	ContractCompleted         ContractStatus = "completed"
	ContractCancelled         ContractStatus = "cancelled"
	ContractDisputed          ContractStatus = "disputed"
)

// ParseContractStatus rejects unknown values.
func ParseContractStatus(value string) (ContractStatus, bool) {
	switch ContractStatus(normalize(value)) {
	case ContractPending:
		return ContractPending, true
	case ContractActive:
		return ContractActive, true
	case ContractInProgress:
		return ContractInProgress, true
	case ContractSubmitted:
		return ContractSubmitted, true
	case ContractRevisionRequested:
		return ContractRevisionRequested, true
	case ContractCompleted:
		return ContractCompleted, true
	case ContractCancelled:
		return ContractCancelled, true
	case ContractDisputed:
		return ContractDisputed, true
	}
	return "", false
}

// contractTransitions.
//
// The submitted / revision_requested pair is the review loop, and it is a loop
// on purpose: a client may ask for changes more than once. A dispute is
// reachable from every live state and can end in completion (settled in the
// freelancer's favour), cancellation (the client's), or a return to work.
var contractTransitions = map[ContractStatus][]ContractStatus{
	ContractPending:           {ContractActive, ContractCancelled},
	ContractActive:            {ContractInProgress, ContractCompleted, ContractCancelled, ContractDisputed},
	ContractInProgress:        {ContractSubmitted, ContractCancelled, ContractDisputed},
	ContractSubmitted:         {ContractCompleted, ContractRevisionRequested, ContractDisputed},
	ContractRevisionRequested: {ContractInProgress, ContractSubmitted, ContractCancelled, ContractDisputed},
	ContractDisputed:          {ContractInProgress, ContractCompleted, ContractCancelled},
	// Terminal. Money has changed hands by this point.
	ContractCompleted: nil,
	ContractCancelled: nil,
}

func (s ContractStatus) CanTransitionTo(next ContractStatus) bool {
	return allowed(contractTransitions[s], s, next)
}

func (s ContractStatus) IsTerminal() bool {
	return s == ContractCompleted || s == ContractCancelled
}

// IsLive reports whether the engagement is still running, which is what decides
// whether a dispute may be opened against it.
func (s ContractStatus) IsLive() bool { return !s.IsTerminal() }

// DisputeStatus is the lifecycle of a raised dispute.
type DisputeStatus string

const (
	DisputeOpen             DisputeStatus = "open"
	DisputeUnderReview      DisputeStatus = "under_review"
	DisputeAwaitingEvidence DisputeStatus = "awaiting_evidence"
	DisputeResolved         DisputeStatus = "resolved"
	DisputeWithdrawn        DisputeStatus = "withdrawn"
	DisputeEscalated        DisputeStatus = "escalated"
)

// ParseDisputeStatus rejects unknown values.
func ParseDisputeStatus(value string) (DisputeStatus, bool) {
	switch DisputeStatus(normalize(value)) {
	case DisputeOpen:
		return DisputeOpen, true
	case DisputeUnderReview:
		return DisputeUnderReview, true
	case DisputeAwaitingEvidence:
		return DisputeAwaitingEvidence, true
	case DisputeResolved:
		return DisputeResolved, true
	case DisputeWithdrawn:
		return DisputeWithdrawn, true
	case DisputeEscalated:
		return DisputeEscalated, true
	}
	return "", false
}

var disputeTransitions = map[DisputeStatus][]DisputeStatus{
	DisputeOpen:             {DisputeUnderReview, DisputeAwaitingEvidence, DisputeWithdrawn, DisputeResolved, DisputeEscalated},
	DisputeUnderReview:      {DisputeAwaitingEvidence, DisputeResolved, DisputeEscalated, DisputeWithdrawn},
	DisputeAwaitingEvidence: {DisputeUnderReview, DisputeResolved, DisputeEscalated, DisputeWithdrawn},
	DisputeEscalated:        {DisputeResolved, DisputeUnderReview},
	// Terminal.
	DisputeResolved:  nil,
	DisputeWithdrawn: nil,
}

func (s DisputeStatus) CanTransitionTo(next DisputeStatus) bool {
	return allowed(disputeTransitions[s], s, next)
}

// IsOpen reports whether the dispute still needs an outcome, which is what the
// one-open-dispute-per-contract rule is keyed on.
func (s DisputeStatus) IsOpen() bool {
	return s == DisputeOpen || s == DisputeUnderReview ||
		s == DisputeAwaitingEvidence || s == DisputeEscalated
}

// ServiceStatus is the lifecycle of a productised service listing.
type ServiceStatus string

const (
	ServiceDraft     ServiceStatus = "draft"
	ServicePublished ServiceStatus = "published"
	ServicePaused    ServiceStatus = "paused"
	ServiceArchived  ServiceStatus = "archived"
)

// ParseServiceStatus rejects unknown values.
func ParseServiceStatus(value string) (ServiceStatus, bool) {
	switch ServiceStatus(normalize(value)) {
	case ServiceDraft:
		return ServiceDraft, true
	case ServicePublished:
		return ServicePublished, true
	case ServicePaused:
		return ServicePaused, true
	case ServiceArchived:
		return ServiceArchived, true
	}
	return "", false
}

var serviceTransitions = map[ServiceStatus][]ServiceStatus{
	ServiceDraft:     {ServicePublished, ServiceArchived},
	ServicePublished: {ServicePaused, ServiceArchived},
	ServicePaused:    {ServicePublished, ServiceArchived},
	ServiceArchived:  nil,
}

func (s ServiceStatus) CanTransitionTo(next ServiceStatus) bool {
	return allowed(serviceTransitions[s], s, next)
}

// BudgetType is how a project pays.
type BudgetType string

const (
	BudgetFixed  BudgetType = "fixed"
	BudgetHourly BudgetType = "hourly"
)

// ParseBudgetType rejects unknown values.
func ParseBudgetType(value string) (BudgetType, bool) {
	switch BudgetType(normalize(value)) {
	case BudgetFixed:
		return BudgetFixed, true
	case BudgetHourly:
		return BudgetHourly, true
	}
	return "", false
}

// AvailabilityStatus is whether a freelancer wants work, which is a different
// question from whether Kirmya permits them to take it. See CapabilityStatus.
type AvailabilityStatus string

const (
	AvailabilityAvailable   AvailabilityStatus = "available"
	AvailabilityBusy        AvailabilityStatus = "busy"
	AvailabilityUnavailable AvailabilityStatus = "unavailable"
)

// ParseAvailabilityStatus rejects unknown values.
func ParseAvailabilityStatus(value string) (AvailabilityStatus, bool) {
	switch AvailabilityStatus(normalize(value)) {
	case AvailabilityAvailable:
		return AvailabilityAvailable, true
	case AvailabilityBusy:
		return AvailabilityBusy, true
	case AvailabilityUnavailable:
		return AvailabilityUnavailable, true
	}
	return "", false
}

// FavoriteTarget is what a saved item points at.
type FavoriteTarget string

const (
	FavoriteProject    FavoriteTarget = "project"
	FavoriteService    FavoriteTarget = "service"
	FavoriteFreelancer FavoriteTarget = "freelancer"
)

// ParseFavoriteTarget rejects unknown values.
func ParseFavoriteTarget(value string) (FavoriteTarget, bool) {
	switch FavoriteTarget(normalize(value)) {
	case FavoriteProject:
		return FavoriteProject, true
	case FavoriteService:
		return FavoriteService, true
	case FavoriteFreelancer:
		return FavoriteFreelancer, true
	}
	return "", false
}

func normalize(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

// allowed reports whether next is in the permitted set, treating a move to the
// same state as a no-op rather than a violation.
//
// Generic over the status types so each lifecycle keeps its own type at the
// call site: passing a ProposalStatus where a ProjectStatus belongs does not
// compile, which is the whole reason these are distinct types rather than
// strings.
func allowed[T ~string](permitted []T, current, next T) bool {
	if current == next {
		return true
	}
	for _, candidate := range permitted {
		if candidate == next {
			return true
		}
	}
	return false
}
