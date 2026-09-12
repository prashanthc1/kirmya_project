package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/repository"
	"kirmya/internal/shared/events"
	"kirmya/internal/shared/telemetry"

	"github.com/google/uuid"
)

// Refusals a caller can act on, rather than a 500 with a driver message.
var (
	ErrNotProjectOwner         = errors.New("only the client who posted this project can accept a proposal on it")
	ErrProposalAlreadyAccepted = errors.New("this proposal has already been accepted")
	ErrProposalNotOpen         = errors.New("this proposal is not open")

	// ErrFreelancerSuspended is re-exported so the delivery layer can answer
	// 403 with the suspended code rather than reporting a policy decision as a
	// server fault.
	ErrFreelancerSuspended = repository.ErrFreelancerSuspended
	// ErrProfileNotFound means the account has no freelancer profile.
	ErrProfileNotFound = repository.ErrProfileNotFound
	// ErrOnboardingIncomplete reports which details are still missing before
	// the capability can be activated.
	ErrOnboardingIncomplete = errors.New("freelancer onboarding is incomplete")
	// ErrNotAFreelancer means the account has never started onboarding, so
	// there is no capability to move.
	ErrNotAFreelancer = errors.New("this account has no freelancer profile")
	// ErrFreelancerNotActive means the account does not currently hold usable
	// Freelancer capability - it has never onboarded, has not finished, or has
	// been suspended.
	ErrFreelancerNotActive = errors.New("freelancer capability is not active")
	// ErrReasonRequired means an administrative status change arrived with no
	// stated reason. The audit entry is the point of the endpoint.
	ErrReasonRequired = errors.New("a reason is required")
)

// Capability re-exports the repository lifecycle so callers outside the module
// do not import the repository package directly.
type Capability = repository.CapabilityStatus

const (
	CapabilityNone      = repository.CapabilityNone
	CapabilityPending   = repository.CapabilityPending
	CapabilityActive    = repository.CapabilityActive
	CapabilitySuspended = repository.CapabilitySuspended
)

// IncompleteOnboardingError names the fields onboarding still needs.
//
// Typed rather than a formatted string so the handler can return the list to
// the client and a test can assert on it without matching prose.
type IncompleteOnboardingError struct {
	Missing []string
}

func (e *IncompleteOnboardingError) Error() string {
	return fmt.Sprintf("%s: missing %s", ErrOnboardingIncomplete, strings.Join(e.Missing, ", "))
}

func (e *IncompleteOnboardingError) Unwrap() error { return ErrOnboardingIncomplete }

// OnboardingStatus is what the onboarding screen needs to render.
type OnboardingStatus struct {
	// Capability is the lifecycle state: none, pending, active or suspended.
	Capability Capability `json:"capability"`
	// Missing names the profile fields still required before activation. Empty
	// once the profile carries everything, and empty for a suspended account
	// too - what that account is missing is not a field.
	Missing []string `json:"missing,omitempty"`
	// Profile is the caller's own draft, or nil when none exists yet.
	Profile *domain.FreelancerProfile `json:"profile,omitempty"`
}

type FreelanceService interface {
	CreateProject(ctx context.Context, clientID uuid.UUID, payload domain.CreateProjectPayload) (*domain.Project, error)
	GetProjects(ctx context.Context, status string) ([]domain.Project, error)
	GetProjectByID(ctx context.Context, id uuid.UUID) (*domain.Project, error)

	SubmitProposal(ctx context.Context, freelancerID uuid.UUID, projectID uuid.UUID, payload domain.SubmitProposalPayload) (*domain.Proposal, error)
	AcceptProposal(ctx context.Context, clientID uuid.UUID, proposalID uuid.UUID) (*domain.Contract, error)
	GetUserContracts(ctx context.Context, userID uuid.UUID) ([]domain.Contract, error)

	SaveProfile(ctx context.Context, userID uuid.UUID, payload domain.SaveProfilePayload) (*domain.FreelancerProfile, error)
	GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error)

	// The owner-scoped use-cases. Each takes the caller's id and refuses a row
	// that is not theirs - see internal/freelance/service/projects.go for why
	// that check lives here rather than in the handlers.
	EnableFreelanceProfile(ctx context.Context, userID uuid.UUID) (*OnboardingStatus, error)
	GetOwnProject(ctx context.Context, clientID, projectID uuid.UUID) (*domain.Project, error)
	ListOwnProjects(ctx context.Context, clientID uuid.UUID, filter domain.ProjectFilter, limit, offset int) ([]domain.Project, int, error)
	UpdateOwnProject(ctx context.Context, clientID, projectID uuid.UUID, payload domain.UpdateProjectPayload) (*domain.Project, error)

	// The administrative marketplace use-cases, behind freelance.admin.read and
	// freelance.admin.write respectively.
	ListAllProjects(ctx context.Context, filter domain.ProjectFilter, limit, offset int) ([]domain.Project, int, error)
	AdminCancelProject(ctx context.Context, adminID, projectID uuid.UUID, reason string) (*domain.Project, error)

	// FreelancerCapability answers the one question route protection asks: does
	// this authenticated account hold usable Freelancer capability right now?
	FreelancerCapability(ctx context.Context, userID uuid.UUID) (Capability, error)
	OnboardingStatus(ctx context.Context, userID uuid.UUID) (*OnboardingStatus, error)
	CompleteOnboarding(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error)

	// SuspendCapability and ReinstateCapability are the administrative path.
	SuspendCapability(ctx context.Context, adminID, userID uuid.UUID, reason string) error
	ReinstateCapability(ctx context.Context, adminID, userID uuid.UUID, reason string) error
}

type freelanceService struct {
	repo repository.FreelanceRepository
	// bus is optional. The module works without one - every caller today wires
	// nil - and publish() below is a no-op when it is absent, so a deployment
	// that has not configured an event bus does not lose writes, it loses
	// notifications about them.
	bus events.EventBus
}

func NewFreelanceService(repo repository.FreelanceRepository) FreelanceService {
	return &freelanceService{repo: repo}
}

// NewFreelanceServiceWithEvents wires the module into the repository's existing
// in-process event bus (internal/shared/events).
//
// Events are published after the transaction commits, never inside it. The bus
// is in-memory and dispatches asynchronously, so publishing before the commit
// would let a subscriber act on a contract that a rollback then removed. The
// consequence is the usual one for a non-transactional bus: a crash between
// commit and publish drops the event. A transactional outbox for this module is
// deliberately not built here - see the completion notes - because the only
// outbox in the repository today is notification-specific, and the marketplace
// flows that would need durable delivery are not implemented yet.
func NewFreelanceServiceWithEvents(repo repository.FreelanceRepository, bus events.EventBus) FreelanceService {
	return &freelanceService{repo: repo, bus: bus}
}

// publish emits a domain event, if a bus was configured.
func (s *freelanceService) publish(ctx context.Context, eventType string, payload map[string]interface{}) {
	if s.bus == nil {
		return
	}
	// A failed publish is not a failed write: the row is already committed, and
	// returning an error here would tell the caller their project was not
	// created when it was.
	_ = s.bus.Publish(ctx, events.DomainEvent{
		Type:     eventType,
		Producer: "freelance",
		Payload:  payload,
	})
}

// CreateProject writes a client's project as a draft.
//
// A draft, not a published posting. 0032 defaulted a new project to 'open',
// which made writing one down and showing it to every freelancer on the
// platform the same irreversible act; publishing is now its own transition.
//
// The caller is the owner by construction: clientID comes from the
// authenticated session, never from the payload, so a client cannot post a
// project in somebody else's name.
func (s *freelanceService) CreateProject(ctx context.Context, clientID uuid.UUID, payload domain.CreateProjectPayload) (*domain.Project, error) {
	if clientID == uuid.Nil {
		return nil, domain.ErrUnauthenticated
	}

	proj, err := buildProjectFromPayload(clientID, payload)
	if err != nil {
		return nil, err
	}

	if err := s.repo.CreateProject(ctx, proj); err != nil {
		return nil, err
	}

	// Audit: who created what, not what it pays. Through the same telemetry
	// stream the capability transitions use, rather than a second audit system.
	telemetry.LogUserAction(ctx, clientID.String(), domain.AuditProjectCreated, map[string]interface{}{
		"projectId":  proj.ID.String(),
		"status":     string(proj.Status),
		"skillCount": len(proj.SkillsRequired),
	})
	return proj, nil
}

// GetProjects is the public project board.
//
// Two rules, and the second one is load-bearing.
//
// An unknown status is refused rather than silently ignored: a client filtering
// on a typo used to receive the unfiltered board, which reads as "there are no
// such projects" only if you assume the filter worked.
//
// And a draft never appears here, whatever is asked for. Drafts became possible
// in this change - before it, every project was public the moment it was posted
// - so without this filter the new state would have leaked every client's
// unpublished working copy onto an anonymous endpoint. The filter is applied
// after the status is parsed, so asking for status=draft explicitly returns
// nothing rather than returning the drafts.
func (s *freelanceService) GetProjects(ctx context.Context, status string) ([]domain.Project, error) {
	trimmed := strings.TrimSpace(status)
	if trimmed == "" || strings.EqualFold(trimmed, "ALL") {
		all, err := s.repo.GetProjects(ctx, "")
		if err != nil {
			return nil, err
		}
		return withoutDrafts(all), nil
	}
	parsed, ok := domain.ParseProjectStatus(trimmed)
	if !ok {
		return nil, domain.NewValidationError("status", "is not a project status")
	}
	if !parsed.IsPubliclyVisible() {
		return []domain.Project{}, nil
	}
	return s.repo.GetProjects(ctx, parsed)
}

// withoutDrafts removes the projects an anonymous visitor must not see.
func withoutDrafts(projects []domain.Project) []domain.Project {
	visible := make([]domain.Project, 0, len(projects))
	for _, project := range projects {
		if project.Status.IsPubliclyVisible() {
			visible = append(visible, project)
		}
	}
	return visible
}

func (s *freelanceService) GetProjectByID(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
	proj, err := s.repo.GetProjectByID(ctx, id)
	if err != nil {
		return nil, err
	}
	props, _ := s.repo.GetProjectProposals(ctx, id)
	proj.Proposals = props
	return proj, nil
}

func (s *freelanceService) SubmitProposal(ctx context.Context, freelancerID uuid.UUID, projectID uuid.UUID, payload domain.SubmitProposalPayload) (*domain.Proposal, error) {
	// Checked here as well as in the route middleware. Submitting a proposal is
	// the act of offering to be hired, and it must not be reachable by an
	// account whose freelancing is pending or withdrawn - including through any
	// future caller that reaches the service without passing the middleware.
	capability, err := s.repo.FreelancerCapability(ctx, freelancerID)
	if err != nil {
		return nil, err
	}
	if capability != CapabilityActive {
		return nil, ErrFreelancerNotActive
	}

	// The project has to exist and has to be taking bids. Without this a
	// freelancer could bid on a draft nobody published, or on a project already
	// hired, and the row would sit in the client's inbox looking legitimate.
	proj, err := s.repo.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if !proj.Status.AcceptsProposals() {
		return nil, fmt.Errorf("%w: this project is %s", ErrProposalNotOpen, proj.Status)
	}
	// Bidding on your own project is not a bid.
	if proj.OwnedBy(freelancerID) {
		return nil, domain.NewValidationError("project_id", "cannot be a project you posted yourself")
	}

	currency, err := resolveCurrency(payload.Currency, proj.Currency)
	if err != nil {
		return nil, err
	}
	if err := validateProposalPayload(payload); err != nil {
		return nil, err
	}

	prop := &domain.Proposal{
		ID:           uuid.New(),
		ProjectID:    projectID,
		FreelancerID: freelancerID,
		// The freelancer's display name was the literal "Alex Rivera" here, on
		// every proposal every account submitted. A name is the client's only
		// way to tell one bidder from another, so a fixed one is worse than an
		// empty one: it reads as information. It is left unset and resolved
		// from the profile by whatever renders the proposal.
		FreelancerName: "",
		BidAmount:      payload.BidAmount,
		Currency:       currency,
		EstimatedDays:  payload.EstimatedDays,
		CoverLetter:    payload.CoverLetter,
		Status:         domain.ProposalSubmitted,
		CreatedAt:      time.Now().UTC(),
	}

	if err := s.repo.SubmitProposal(ctx, prop); err != nil {
		return nil, err
	}
	return prop, nil
}

func (s *freelanceService) AcceptProposal(ctx context.Context, clientID uuid.UUID, proposalID uuid.UUID) (*domain.Contract, error) {
	prop, err := s.repo.GetProposalByID(ctx, proposalID)
	if err != nil {
		return nil, err
	}

	proj, err := s.repo.GetProjectByID(ctx, prop.ProjectID)
	if err != nil {
		return nil, err
	}

	// Only the client who posted the project may accept a proposal on it. This
	// was unchecked, so the freelancer who wrote the proposal could accept it
	// themselves - and could do it repeatedly, each time writing another
	// contract for the same work.
	if !proj.OwnedBy(clientID) {
		return nil, ErrNotProjectOwner
	}
	if prop.Status == domain.ProposalAccepted {
		return nil, ErrProposalAlreadyAccepted
	}
	if !prop.Status.IsOpen() {
		return nil, fmt.Errorf("%w: proposal is %s", ErrProposalNotOpen, prop.Status)
	}
	// The project must legally be able to reach 'hired' from where it is. A
	// cancelled project with an old open proposal on it would otherwise produce
	// a live contract against work nobody is doing.
	if !proj.Status.CanTransitionTo(domain.ProjectHired) {
		return nil, &domain.TransitionError{Entity: "project", From: string(proj.Status), To: string(domain.ProjectHired)}
	}

	contract := &domain.Contract{
		ID:           uuid.New(),
		ProjectID:    proj.ID,
		ProposalID:   proposalID,
		ProjectTitle: proj.Title,
		ClientID:     clientID,
		FreelancerID: prop.FreelancerID,
		TotalAmount:  prop.BidAmount,
		Currency:     prop.Currency,
		Status:       domain.ContractPending,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	// One transaction for all four writes. See AcceptProposalTx: accepting a
	// proposal, rejecting the competing ones, moving the project and writing the
	// contract have to commit together or not at all.
	if err := s.repo.AcceptProposalTx(ctx, proposalID, contract); err != nil {
		return nil, err
	}

	telemetry.LogUserAction(ctx, clientID.String(), domain.AuditProposalAccepted, map[string]interface{}{
		"proposalId":   proposalID.String(),
		"projectId":    proj.ID.String(),
		"contractId":   contract.ID.String(),
		"freelancerId": prop.FreelancerID.String(),
	})
	s.publish(ctx, domain.EventProposalAccepted, map[string]interface{}{
		"proposal_id": proposalID.String(),
		"project_id":  proj.ID.String(),
		"contract_id": contract.ID.String(),
	})
	s.publish(ctx, domain.EventContractCreated, map[string]interface{}{
		"contract_id":   contract.ID.String(),
		"project_id":    proj.ID.String(),
		"client_id":     clientID.String(),
		"freelancer_id": prop.FreelancerID.String(),
	})
	return contract, nil
}

func (s *freelanceService) GetUserContracts(ctx context.Context, userID uuid.UUID) ([]domain.Contract, error) {
	return s.repo.GetUserContracts(ctx, userID)
}

// SaveProfile writes the caller's freelancer profile draft.
//
// It is an onboarding action, reachable by any authenticated account, and it
// creates the profile row on first call. What it deliberately does not do is
// grant anything: the row it creates is 'pending', and only CompleteOnboarding
// moves it. That separation is the fix for the old behaviour, where this method
// was the whole of becoming a freelancer and an empty JSON body was enough.
func (s *freelanceService) SaveProfile(ctx context.Context, userID uuid.UUID, payload domain.SaveProfilePayload) (*domain.FreelancerProfile, error) {
	// Checked before anything is written. Editing a marketplace listing is not a
	// way back in from a suspension, and a suspended account rewriting its
	// tagline on the way to being refused is a write a refusal should not have
	// allowed.
	capability, err := s.repo.FreelancerCapability(ctx, userID)
	if err != nil {
		return nil, err
	}
	if capability == CapabilitySuspended {
		return nil, ErrFreelancerSuspended
	}

	currency, err := resolveCurrency(payload.Currency, domain.DefaultCurrency)
	if err != nil {
		return nil, err
	}
	if err := validateProfilePayload(payload); err != nil {
		return nil, err
	}

	availability := domain.AvailabilityAvailable
	if strings.TrimSpace(payload.Availability) != "" {
		parsed, ok := domain.ParseAvailabilityStatus(payload.Availability)
		if !ok {
			return nil, domain.NewValidationError("availability_status", "is not one of available, busy, unavailable")
		}
		availability = parsed
	}

	prof := &domain.FreelancerProfile{
		ID:                 uuid.New(),
		UserID:             userID,
		HourlyRate:         payload.HourlyRate,
		Currency:           currency,
		Tagline:            strings.TrimSpace(payload.Tagline),
		Skills:             normalizeSkills(payload.Skills),
		PortfolioLinks:     payload.PortfolioLinks,
		AvailabilityStatus: availability,
		CreatedAt:          time.Now().UTC(),
		UpdatedAt:          time.Now().UTC(),
	}

	if err := s.repo.SaveProfile(ctx, prof); err != nil {
		return nil, err
	}

	telemetry.LogUserAction(ctx, userID.String(), domain.AuditProfileUpdated, map[string]interface{}{
		"freelancerProfileId": prof.ID.String(),
		"skillCount":          len(prof.Skills),
	})
	return prof, nil
}

func (s *freelanceService) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error) {
	return s.repo.GetProfileByUserID(ctx, userID)
}

// FreelancerCapability reads the caller's capability state.
//
// Server-side and authoritative. It reads the freelancer profile lifecycle and
// nothing else - not users.role_id, not whether a proposal or contract exists,
// not any workspace context the client claims to be in.
func (s *freelanceService) FreelancerCapability(ctx context.Context, userID uuid.UUID) (Capability, error) {
	return s.repo.FreelancerCapability(ctx, userID)
}

// OnboardingStatus reports where the caller is in becoming a freelancer.
//
// Read-only, and it creates nothing. An account that has never started gets
// CapabilityNone and the full list of what onboarding will ask for, which is
// what lets the client render "Become a freelancer" without first provisioning
// anybody.
func (s *freelanceService) OnboardingStatus(ctx context.Context, userID uuid.UUID) (*OnboardingStatus, error) {
	capability, err := s.repo.FreelancerCapability(ctx, userID)
	if err != nil {
		return nil, err
	}
	status := &OnboardingStatus{Capability: capability}
	if capability == CapabilityNone {
		status.Missing = (*domain.FreelancerProfile)(nil).RequiredForActivation()
		return status, nil
	}

	prof, err := s.repo.GetProfileByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, ErrProfileNotFound) {
			// The capability said a row exists and the profile read says it
			// does not. That is an inconsistency, not an invitation to invent
			// one: report it rather than answering with a profile nobody wrote.
			return nil, err
		}
		return nil, err
	}
	status.Profile = prof
	if capability == CapabilityPending {
		status.Missing = prof.RequiredForActivation()
	}
	return status, nil
}

// CompleteOnboarding is the one transition that grants the capability.
//
// It is deliberate, it is explicit, and it is the only way in: no read path
// creates it, no route grants it as a side effect, and requesting /freelance/*
// does not produce it. The profile must already carry what a client needs in
// order to hire somebody, which is what makes completion mean something.
func (s *freelanceService) CompleteOnboarding(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error) {
	capability, err := s.repo.FreelancerCapability(ctx, userID)
	if err != nil {
		return nil, err
	}
	switch capability {
	case CapabilityNone:
		// Nothing to complete. Creating the profile here would make this an
		// implicit provisioning path, which is the defect being removed.
		return nil, ErrNotAFreelancer
	case CapabilitySuspended:
		return nil, ErrFreelancerSuspended
	}

	prof, err := s.repo.GetProfileByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if missing := prof.RequiredForActivation(); len(missing) > 0 {
		return nil, &IncompleteOnboardingError{Missing: missing}
	}

	if capability == CapabilityActive {
		// Already done. Idempotent rather than an error: a client retrying a
		// completed step should not be told something went wrong.
		return prof, nil
	}

	if err := s.repo.ActivateFreelancerCapability(ctx, userID); err != nil {
		return nil, err
	}
	prof.CapabilityStatus = domain.CapabilityActive

	// The grant, in the same stream as the refusals the capability middleware
	// records, so a capability can be traced from first denial to grant without
	// joining two systems. The profile id and the skill count, and nothing about
	// rates or portfolio contents - the audit question is "who became a
	// freelancer, and when", not what they charge.
	telemetry.LogUserAction(ctx, userID.String(), "FREELANCER_CAPABILITY_GRANTED", map[string]interface{}{
		"freelancerProfileId": prof.ID.String(),
		"skillCount":          len(prof.Skills),
	})
	return prof, nil
}

// SuspendCapability withdraws freelancing from an account, and nothing else.
//
// The Kirmya account is untouched: the person keeps their feed, their network,
// their messages and their job applications, and their professional workspace
// still resolves. Their portfolio, proposals and contracts are all preserved -
// this is a status transition, not a deletion - so reinstating restores the
// same freelancer identity rather than creating a second one.
func (s *freelanceService) SuspendCapability(ctx context.Context, adminID, userID uuid.UUID, reason string) error {
	return s.setCapability(ctx, adminID, userID, CapabilitySuspended, reason, "FREELANCER_CAPABILITY_SUSPENDED")
}

// ReinstateCapability returns a suspended account to active freelancing.
//
// It moves the existing profile back rather than creating one, so portfolio,
// reviews, proposals and contracts stay attached to the same identity.
func (s *freelanceService) ReinstateCapability(ctx context.Context, adminID, userID uuid.UUID, reason string) error {
	return s.setCapability(ctx, adminID, userID, CapabilityActive, reason, "FREELANCER_CAPABILITY_REINSTATED")
}

func (s *freelanceService) setCapability(ctx context.Context, adminID, userID uuid.UUID, target Capability, reason, event string) error {
	if strings.TrimSpace(reason) == "" {
		return ErrReasonRequired
	}

	previous, err := s.repo.FreelancerCapability(ctx, userID)
	if err != nil {
		return err
	}
	if previous == CapabilityNone {
		// An administrator may withdraw freelancing from a freelancer. They may
		// not make one: that would be authority created by an administrative
		// action rather than chosen by the person it belongs to.
		return ErrNotAFreelancer
	}
	if previous == target {
		return nil
	}

	if err := s.repo.SetFreelancerCapability(ctx, userID, target); err != nil {
		return err
	}

	// The real previous state, so the entry says what changed rather than
	// asserting a transition that may not have happened. No payment or private
	// contract detail: the audit question is who changed whose standing, and why.
	telemetry.LogUserAction(ctx, adminID.String(), event, map[string]interface{}{
		"targetUserId": userID.String(),
		"from":         string(previous),
		"to":           string(target),
		"reason":       reason,
	})
	return nil
}
