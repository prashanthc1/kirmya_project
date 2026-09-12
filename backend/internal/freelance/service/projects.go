package service

import (
	"context"
	"strings"
	"time"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/shared/telemetry"

	"github.com/google/uuid"
)

// The client-side project use-cases, and the ownership rule they all share.
//
// Every method here takes the caller's id as its first argument and refuses to
// act on a row that is not theirs. That is the whole of the IDOR defence, and it
// lives at this layer rather than in the handlers for one reason: a handler is
// one caller. A second handler, a background job, or a test that reaches the
// service directly would each have to remember the check independently, and the
// one that forgot would be the vulnerability.

// buildProjectFromPayload validates a create request and turns it into an entity.
//
// Shared by CreateProject so that validation and construction cannot drift: the
// entity is only ever built from a payload that has already been checked.
func buildProjectFromPayload(clientID uuid.UUID, payload domain.CreateProjectPayload) (*domain.Project, error) {
	if err := validateProjectPayload(payload); err != nil {
		return nil, err
	}

	currency, err := resolveCurrency(payload.Currency, domain.DefaultCurrency)
	if err != nil {
		return nil, err
	}

	budgetType := domain.BudgetFixed
	if strings.TrimSpace(payload.BudgetType) != "" {
		parsed, ok := domain.ParseBudgetType(payload.BudgetType)
		if !ok {
			return nil, domain.NewValidationError("budget_type", "must be fixed or hourly")
		}
		budgetType = parsed
	}

	now := time.Now().UTC()
	return &domain.Project{
		ID:             uuid.New(),
		ClientID:       clientID,
		Title:          strings.TrimSpace(payload.Title),
		Description:    strings.TrimSpace(payload.Description),
		Budget:         payload.Budget,
		Currency:       currency,
		BudgetType:     budgetType,
		SkillsRequired: normalizeSkills(payload.SkillsRequired),
		// A draft. Publishing is a separate, deliberate transition.
		Status:    domain.ProjectDraft,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// GetOwnProject returns one of the caller's own projects.
//
// A project belonging to somebody else answers ErrNotFound, not ErrForbidden.
// That is deliberate and it is the same rule internal/company/domain uses: a 403
// would confirm that the id names a real project, so walking ids would map the
// whole board including every unpublished draft. 404 reveals nothing.
func (s *freelanceService) GetOwnProject(ctx context.Context, clientID, projectID uuid.UUID) (*domain.Project, error) {
	if clientID == uuid.Nil {
		return nil, domain.ErrUnauthenticated
	}
	proj, err := s.repo.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, domain.ErrNotFound
	}
	if !proj.OwnedBy(clientID) {
		return nil, domain.ErrNotFound
	}

	// Proposals are part of the client's own view of their project. They are
	// attached here and nowhere in the public read path, because a competing
	// freelancer must not see what anybody else bid.
	if proposals, propErr := s.repo.GetProjectProposals(ctx, projectID); propErr == nil {
		proj.Proposals = proposals
		proj.ProposalsCount = len(proposals)
	}
	return proj, nil
}

// ListOwnProjects returns the caller's projects, filtered and paginated.
//
// The filter's ClientID is overwritten with the authenticated caller rather than
// read from the request. A client_id query parameter would be the entire IDOR:
// "my projects" would become "anybody's projects" for whoever guessed a uuid.
func (s *freelanceService) ListOwnProjects(ctx context.Context, clientID uuid.UUID, filter domain.ProjectFilter, limit, offset int) ([]domain.Project, int, error) {
	if clientID == uuid.Nil {
		return nil, 0, domain.ErrUnauthenticated
	}
	filter.ClientID = clientID
	return s.repo.ListProjects(ctx, filter, limit, offset)
}

// UpdateOwnProject applies an owner's edit.
//
// Three things have to hold, in this order: the project exists, the caller owns
// it, and the change it asks for is legal. Checking ownership before validity
// matters - validating first would let a stranger learn, from the shape of the
// error, whether a project exists and what state it is in.
func (s *freelanceService) UpdateOwnProject(ctx context.Context, clientID, projectID uuid.UUID, payload domain.UpdateProjectPayload) (*domain.Project, error) {
	proj, err := s.GetOwnProject(ctx, clientID, projectID)
	if err != nil {
		return nil, err
	}
	if proj.Status.IsTerminal() {
		return nil, &domain.TransitionError{
			Entity: "project", From: string(proj.Status), To: "edited",
		}
	}

	if payload.Title != nil {
		if err := checkText("title", *payload.Title, true, maxTitleLen); err != nil {
			return nil, err
		}
		proj.Title = strings.TrimSpace(*payload.Title)
	}
	if payload.Description != nil {
		if err := checkText("description", *payload.Description, true, maxDescriptionLen); err != nil {
			return nil, err
		}
		proj.Description = strings.TrimSpace(*payload.Description)
	}
	if payload.Budget != nil {
		if *payload.Budget < 0 {
			return nil, domain.NewValidationError("budget", "cannot be negative")
		}
		proj.Budget = *payload.Budget
	}
	if payload.Currency != nil {
		currency, err := resolveCurrency(*payload.Currency, proj.Currency)
		if err != nil {
			return nil, err
		}
		proj.Currency = currency
	}
	if payload.BudgetType != nil {
		parsed, ok := domain.ParseBudgetType(*payload.BudgetType)
		if !ok {
			return nil, domain.NewValidationError("budget_type", "must be fixed or hourly")
		}
		proj.BudgetType = parsed
	}
	if payload.SkillsRequired != nil {
		skills := normalizeSkills(*payload.SkillsRequired)
		if err := validateSkills(skills); err != nil {
			return nil, err
		}
		proj.SkillsRequired = skills
	}

	previous := proj.Status
	if payload.Status != nil {
		next, ok := domain.ParseProjectStatus(*payload.Status)
		if !ok {
			return nil, domain.NewValidationError("status", "is not a project status")
		}
		// The transition table, not a free assignment. Without this a client
		// could move a project straight from draft to completed, or revive a
		// cancelled one, and every downstream rule that assumes the lifecycle
		// was followed would be reasoning about a state that never happened.
		if !previous.CanTransitionTo(next) {
			return nil, &domain.TransitionError{
				Entity: "project", From: string(previous), To: string(next),
			}
		}
		proj.Status = next
	}

	if err := s.repo.UpdateProject(ctx, proj); err != nil {
		return nil, err
	}

	telemetry.LogUserAction(ctx, clientID.String(), domain.AuditProjectUpdated, map[string]interface{}{
		"projectId": proj.ID.String(),
		"from":      string(previous),
		"to":        string(proj.Status),
	})

	// Publishing and cancelling are the two transitions other modules care
	// about: one puts work on the board, the other takes it off.
	if previous != proj.Status {
		switch proj.Status {
		case domain.ProjectPublished, domain.ProjectAcceptingProposals:
			telemetry.LogUserAction(ctx, clientID.String(), domain.AuditProjectPublished,
				map[string]interface{}{"projectId": proj.ID.String()})
			s.publish(ctx, domain.EventProjectPublished, map[string]interface{}{
				"project_id": proj.ID.String(),
				"client_id":  clientID.String(),
			})
		case domain.ProjectCancelled:
			s.publish(ctx, domain.EventProjectCancelled, map[string]interface{}{
				"project_id": proj.ID.String(),
				"client_id":  clientID.String(),
			})
		}
	}
	return proj, nil
}

// EnableFreelanceProfile is the deliberate act of turning freelancing on.
//
// It creates the profile row if there is none and leaves an existing one alone,
// and in both cases the capability it produces is 'pending': enabling is not
// activation. Onboarding still has to be completed, which is what keeps an empty
// request from becoming a usable freelancer identity - the defect migration 0101
// was written to remove.
func (s *freelanceService) EnableFreelanceProfile(ctx context.Context, userID uuid.UUID) (*OnboardingStatus, error) {
	if userID == uuid.Nil {
		return nil, domain.ErrUnauthenticated
	}

	capability, err := s.repo.FreelancerCapability(ctx, userID)
	if err != nil {
		return nil, err
	}
	switch capability {
	case CapabilitySuspended:
		// Enabling is not a way back from a suspension.
		return nil, ErrFreelancerSuspended
	case CapabilityPending, CapabilityActive:
		// Already enabled. Idempotent rather than an error, and nothing is
		// written: a second call must not reset a profile somebody has filled in.
		return s.OnboardingStatus(ctx, userID)
	}

	prof := &domain.FreelancerProfile{
		ID:                 uuid.New(),
		UserID:             userID,
		Currency:           domain.DefaultCurrency,
		Skills:             []string{},
		PortfolioLinks:     []domain.PortfolioItem{},
		AvailabilityStatus: domain.AvailabilityAvailable,
		CreatedAt:          time.Now().UTC(),
		UpdatedAt:          time.Now().UTC(),
	}
	if err := s.repo.SaveProfile(ctx, prof); err != nil {
		return nil, err
	}

	telemetry.LogUserAction(ctx, userID.String(), domain.AuditProfileCreated, map[string]interface{}{
		"freelancerProfileId": prof.ID.String(),
	})
	s.publish(ctx, domain.EventProfileEnabled, map[string]interface{}{
		"user_id":    userID.String(),
		"profile_id": prof.ID.String(),
	})
	return s.OnboardingStatus(ctx, userID)
}

// ListAllProjects is the administrative cross-account listing.
//
// Unscoped by design: the caller is an administrator holding
// freelance.admin.read, and the whole point of the endpoint is to see projects
// that are not theirs. It is a separate method from ListOwnProjects rather than
// a flag on it, because a boolean like `asAdmin` on the owner-scoped method is
// one mistaken `false` away from being an authorization bypass, and the two
// callers would be indistinguishable in a diff.
func (s *freelanceService) ListAllProjects(ctx context.Context, filter domain.ProjectFilter, limit, offset int) ([]domain.Project, int, error) {
	return s.repo.ListProjects(ctx, filter, limit, offset)
}

// AdminCancelProject takes a project off the marketplace.
//
// The transition goes through the same table a client's own edit uses: an
// administrator may cancel a live project, and may not resurrect a completed one
// or cancel something twice into a different state. Administrative authority is
// authority over whose project it is, not over what the lifecycle permits.
func (s *freelanceService) AdminCancelProject(ctx context.Context, adminID, projectID uuid.UUID, reason string) (*domain.Project, error) {
	if adminID == uuid.Nil {
		return nil, domain.ErrUnauthenticated
	}
	if strings.TrimSpace(reason) == "" {
		return nil, domain.NewValidationError("reason", "is required")
	}

	proj, err := s.repo.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, domain.ErrNotFound
	}
	if !proj.Status.CanTransitionTo(domain.ProjectCancelled) {
		return nil, &domain.TransitionError{
			Entity: "project", From: string(proj.Status), To: string(domain.ProjectCancelled),
		}
	}

	previous := proj.Status
	if err := s.repo.UpdateProjectStatus(ctx, projectID, domain.ProjectCancelled); err != nil {
		return nil, err
	}
	proj.Status = domain.ProjectCancelled

	// The administrator, the project, the owner whose posting was removed, the
	// state it came from, and the stated reason. This is the entry somebody
	// reads when the client asks why their project vanished.
	telemetry.LogUserAction(ctx, adminID.String(), domain.AuditAdminActionTook, map[string]interface{}{
		"action":    "project_cancelled",
		"projectId": projectID.String(),
		"ownerId":   proj.ClientID.String(),
		"from":      string(previous),
		"reason":    reason,
	})
	s.publish(ctx, domain.EventProjectCancelled, map[string]interface{}{
		"project_id": projectID.String(),
		"client_id":  proj.ClientID.String(),
		"by_admin":   true,
	})
	return proj, nil
}
