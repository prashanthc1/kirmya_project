package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"kirmya/internal/auth/models"
	"kirmya/internal/auth/repository"
	workspaceDomain "kirmya/internal/workspace/domain"
)

/*
The workspace half of /auth/me.

What matters here is not that the list is forwarded - that part is a field
assignment - but that the three failure shapes are told apart. A degraded list
and a genuinely single-workspace account look identical on the wire, and a
client that cannot distinguish them will cache "you were removed from Acme" as
though it were true. The flag is the whole point, so these tests are mostly
about the flag.
*/

type stubResolver struct {
	workspaces []workspaceDomain.Workspace
	err        error
	calls      int
}

func (s *stubResolver) ResolveForUser(_ context.Context, _ uuid.UUID) ([]workspaceDomain.Workspace, error) {
	s.calls++
	return s.workspaces, s.err
}

func professional() workspaceDomain.Workspace {
	return workspaceDomain.Workspace{
		Key:       "professional",
		Type:      workspaceDomain.TypeProfessional,
		Label:     "Professional",
		Route:     "/feed",
		IsDefault: true,
	}
}

// meFixture registers an account through the real service so /auth/me has
// something to read, and returns its id.
func meFixture(t *testing.T, svc *AuthService, repo *repository.AuthRepository) uuid.UUID {
	t.Helper()
	id := uuid.New()
	user := &models.User{
		ID:        id,
		UUID:      id,
		FirstName: "Workspace",
		LastName:  "Bootstrap",
		Email:     "ws-" + id.String() + "@example.invalid",
		RoleID:    "user",
		Status:    "active",
	}
	if err := repo.CreateUser(context.Background(), user); err != nil {
		t.Fatalf("seeding user: %v", err)
	}
	return id
}

func TestGetUserMeServesResolvedWorkspaces(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	companyID := uuid.NewString()
	resolver := &stubResolver{workspaces: []workspaceDomain.Workspace{
		professional(),
		{Key: "company:" + companyID, Type: workspaceDomain.TypeCompany, EntityID: &companyID,
			Label: "Acme LLC", Slug: "acme", Route: "/companies/acme/admin"},
	}}
	svc.WithWorkspaceResolver(resolver)

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe: %v", err)
	}

	if !me.WorkspacesComplete {
		t.Error("workspacesComplete is false for a successful resolution")
	}
	if len(me.Workspaces) != 2 {
		t.Fatalf("workspaces = %v, want the two the resolver returned", me.Workspaces)
	}
	if me.Workspaces[1].Label != "Acme LLC" {
		t.Errorf("company label = %q, want the resolver's value", me.Workspaces[1].Label)
	}
	if resolver.calls != 1 {
		t.Errorf("resolver called %d times, want once per /auth/me", resolver.calls)
	}

	// The existing payload is untouched. This endpoint is a hot path with live
	// consumers, and the change is additive or it is a breaking change.
	if me.User.Email != "ws-"+userID.String()+"@example.invalid" {
		t.Errorf("user email = %q, want the account's own", me.User.Email)
	}
	if len(me.Permissions) == 0 {
		t.Error("permissions disappeared from the payload")
	}
}

// A failed resolution degrades to the professional workspace and says so.
func TestGetUserMeDegradesRatherThanFailingTheBootstrap(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	// The resolver's contract: the professional-only floor alongside the error.
	svc.WithWorkspaceResolver(&stubResolver{
		workspaces: []workspaceDomain.Workspace{professional()},
		err:        errors.New("company database unavailable"),
	})

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe failed the whole bootstrap over a workspace lookup: %v", err)
	}
	if me.WorkspacesComplete {
		t.Error("a degraded list is reported as complete; a client cannot tell it from a revocation")
	}
	if len(me.Workspaces) != 1 || me.Workspaces[0].Type != workspaceDomain.TypeProfessional {
		t.Errorf("degraded workspaces = %v, want professional only", me.Workspaces)
	}
	// And the rest of the payload still arrives, which is the reason to degrade
	// rather than fail.
	if me.User.ID != userID {
		t.Error("the user object was lost along with the workspace list")
	}
}

// A privileged workspace can never survive a failed resolution, even if a
// resolver hands one back with an error.
func TestGetUserMeNeverServesPrivilegedWorkspacesOnFailure(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	companyID := uuid.NewString()
	svc.WithWorkspaceResolver(&stubResolver{
		workspaces: []workspaceDomain.Workspace{
			professional(),
			{Key: "platform_admin", Type: workspaceDomain.TypePlatformAdmin, Label: "Kirmya Administration", Route: "/admin"},
			{Key: "company:" + companyID, Type: workspaceDomain.TypeCompany, EntityID: &companyID, Label: "Acme LLC"},
		},
		err: errors.New("partial failure"),
	})

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe: %v", err)
	}
	if me.WorkspacesComplete {
		t.Error("an errored resolution was reported complete")
	}
	for _, workspace := range me.Workspaces {
		if workspace.Type != workspaceDomain.TypeProfessional {
			t.Errorf("served %q from a failed resolution; only professional may survive one", workspace.Type)
		}
	}
}

// An account that may enter nothing gets a complete, empty list - a definite
// answer, not a failure.
func TestGetUserMeReportsIneligibleAccountAsCompleteAndEmpty(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	svc.WithWorkspaceResolver(&stubResolver{err: workspaceDomain.ErrAccountNotEligible})

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe: %v", err)
	}
	if !me.WorkspacesComplete {
		t.Error("an ineligible account is reported incomplete; 'none' is an answer, not an outage")
	}
	if len(me.Workspaces) != 0 {
		t.Errorf("workspaces = %v, want empty for an ineligible account", me.Workspaces)
	}
	if me.Workspaces == nil {
		t.Error("workspaces is nil rather than an empty list; the two differ on the wire")
	}
}

// A service built without a resolver says the list is incomplete rather than
// asserting the account has no workspaces.
func TestGetUserMeWithoutAResolverDoesNotClaimAnEmptyList(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe: %v", err)
	}
	if me.WorkspacesComplete {
		t.Error("an unwired deployment reports its missing wiring as a complete answer")
	}
	if len(me.Workspaces) != 0 {
		t.Errorf("workspaces = %v, want none when no resolver is wired", me.Workspaces)
	}
}
