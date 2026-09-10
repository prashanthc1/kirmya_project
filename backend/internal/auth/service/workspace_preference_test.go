package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"kirmya/internal/auth/repository"
	workspaceDomain "kirmya/internal/workspace/domain"
)

/*
The landing hint half of /auth/me.

Serving a remembered workspace is a field assignment; the reason these tests
exist is everything that must stop it. The stored key is the older answer and
the resolved list is the current one, so the list wins in every disagreement,
and each way it can disagree lands the account on its default instead.
*/

type stubPreference struct {
	key   string
	err   error
	calls int
}

func (s *stubPreference) LastWorkspace(_ context.Context, _ uuid.UUID) (string, error) {
	s.calls++
	return s.key, s.err
}

func companyWorkspace(id string) workspaceDomain.Workspace {
	return workspaceDomain.Workspace{
		Key:      workspaceDomain.KeyFor(workspaceDomain.TypeCompany, id),
		Type:     workspaceDomain.TypeCompany,
		EntityID: &id,
		Label:    "Acme LLC",
		Slug:     "acme",
		Route:    "/companies/acme/admin",
	}
}

// The ordinary case: a key the account still holds is served back.
func TestGetUserMeServesTheRememberedWorkspace(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	companyID := uuid.NewString()
	company := companyWorkspace(companyID)
	svc.WithWorkspaceResolver(&stubResolver{
		workspaces: []workspaceDomain.Workspace{professional(), company},
	})
	svc.WithWorkspacePreference(&stubPreference{key: company.Key})

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe: %v", err)
	}
	if me.LastWorkspaceKey != company.Key {
		t.Errorf("lastWorkspaceKey = %q, want %q", me.LastWorkspaceKey, company.Key)
	}

	// Whatever is served must be findable in the list served beside it,
	// otherwise the client is handed a key it cannot turn into a route.
	if workspaceDomain.KeyWithin(me.Workspaces, me.LastWorkspaceKey) == "" {
		t.Error("served a key that is not in the workspaces served with it")
	}
}

// The case this check exists for: the membership is gone since the choice.
func TestGetUserMeDropsARememberedWorkspaceTheAccountNoLongerHolds(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	// Chosen last week; the account was removed from Acme since.
	revoked := workspaceDomain.KeyFor(workspaceDomain.TypeCompany, uuid.NewString())
	svc.WithWorkspaceResolver(&stubResolver{
		workspaces: []workspaceDomain.Workspace{professional()},
	})
	svc.WithWorkspacePreference(&stubPreference{key: revoked})

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe: %v", err)
	}
	if me.LastWorkspaceKey != "" {
		t.Errorf("lastWorkspaceKey = %q, want empty: that workspace is no longer this account's",
			me.LastWorkspaceKey)
	}
}

// A degraded list is professional-only, so checking a company key against it
// would answer "revoked" for what is really an outage. Serve nothing instead.
func TestGetUserMeServesNoPreferenceAgainstAnIncompleteList(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	companyID := uuid.NewString()
	company := companyWorkspace(companyID)
	svc.WithWorkspaceResolver(&stubResolver{
		workspaces: []workspaceDomain.Workspace{professional(), company},
		err:        errors.New("company database unavailable"),
	})
	preference := &stubPreference{key: company.Key}
	svc.WithWorkspacePreference(preference)

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe: %v", err)
	}
	if me.WorkspacesComplete {
		t.Fatal("precondition: this test needs a degraded list")
	}
	if me.LastWorkspaceKey != "" {
		t.Errorf("lastWorkspaceKey = %q, want empty against an incomplete list", me.LastWorkspaceKey)
	}
	if preference.calls != 0 {
		t.Errorf("read the preference %d times against an incomplete list; there is nothing to check it against",
			preference.calls)
	}
}

// A preference is a convenience. No convenience fails a bootstrap that runs on
// every page load.
func TestGetUserMeSurvivesAFailedPreferenceLookup(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	svc.WithWorkspaceResolver(&stubResolver{workspaces: []workspaceDomain.Workspace{professional()}})
	svc.WithWorkspacePreference(&stubPreference{err: errors.New("preference store unavailable")})

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("a failed preference lookup failed the whole bootstrap: %v", err)
	}
	if me.LastWorkspaceKey != "" {
		t.Errorf("lastWorkspaceKey = %q, want empty after a failed lookup", me.LastWorkspaceKey)
	}
	if !me.WorkspacesComplete {
		t.Error("a preference failure was reported as a workspace failure; they are different outages")
	}
}

// Unwired, every account is served no preference - the same answer as an
// account that has never chosen one, and it lands in the same place.
func TestGetUserMeWithoutAPreferenceStoreServesNoKey(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	svc.WithWorkspaceResolver(&stubResolver{workspaces: []workspaceDomain.Workspace{professional()}})

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe: %v", err)
	}
	if me.LastWorkspaceKey != "" {
		t.Errorf("lastWorkspaceKey = %q, want empty when no store is wired", me.LastWorkspaceKey)
	}
}

// An ineligible account holds nothing, so it can be sent nowhere - even if a
// row survives from when it was active.
func TestGetUserMeServesNoPreferenceToAnIneligibleAccount(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	userID := meFixture(t, svc, repo)

	svc.WithWorkspaceResolver(&stubResolver{err: workspaceDomain.ErrAccountNotEligible})
	svc.WithWorkspacePreference(&stubPreference{key: "platform_admin"})

	me, err := svc.GetUserMe(context.Background(), userID)
	if err != nil {
		t.Fatalf("GetUserMe: %v", err)
	}
	if me.LastWorkspaceKey != "" {
		t.Errorf("lastWorkspaceKey = %q, want empty: this account may enter nothing", me.LastWorkspaceKey)
	}
}
