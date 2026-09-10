package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"kirmya/internal/workspace/domain"
)

/*
Choosing a workspace.

The write is a single upsert; what is worth testing is what never reaches it.
A key the account's own list does not contain is refused, and so is any key at
all when the list could not be resolved - because a failed resolution is not a
licence to store an unchecked value.
*/

type fakeStore struct {
	stored map[uuid.UUID]string
	err    error
	writes int
}

func newFakeStore() *fakeStore {
	return &fakeStore{stored: map[uuid.UUID]string{}}
}

func (f *fakeStore) LastWorkspace(_ context.Context, userID uuid.UUID) (string, error) {
	if f.err != nil {
		return "", f.err
	}
	return f.stored[userID], nil
}

func (f *fakeStore) SetLastWorkspace(_ context.Context, userID uuid.UUID, key string) error {
	f.writes++
	if f.err != nil {
		return f.err
	}
	f.stored[userID] = key
	return nil
}

type fakeLister struct {
	workspaces []domain.Workspace
	err        error
}

func (f *fakeLister) ResolveForUser(_ context.Context, _ uuid.UUID) ([]domain.Workspace, error) {
	return f.workspaces, f.err
}

func personal() domain.Workspace {
	return domain.Workspace{
		Key: string(domain.TypeProfessional), Type: domain.TypeProfessional,
		Label: "Professional", Route: "/feed", IsDefault: true,
	}
}

func recruiting() domain.Workspace {
	return domain.Workspace{
		Key: string(domain.TypeRecruiting), Type: domain.TypeRecruiting,
		Label: "Recruiting", Route: "/recruiter",
	}
}

func TestSelectRemembersAWorkspaceTheAccountHolds(t *testing.T) {
	store := newFakeStore()
	svc := NewPreferenceService(store, &fakeLister{
		workspaces: []domain.Workspace{personal(), recruiting()},
	})
	userID := uuid.New()

	if err := svc.Select(context.Background(), userID, recruiting().Key); err != nil {
		t.Fatalf("Select: %v", err)
	}
	if store.stored[userID] != recruiting().Key {
		t.Errorf("stored %q, want %q", store.stored[userID], recruiting().Key)
	}

	got, err := svc.LastWorkspace(context.Background(), userID)
	if err != nil {
		t.Fatalf("LastWorkspace: %v", err)
	}
	if got != recruiting().Key {
		t.Errorf("LastWorkspace = %q, want %q", got, recruiting().Key)
	}
}

// The account may not name a workspace it does not hold. Nothing is protected
// by this - a stored key grants nothing - but a key that resolves to nothing
// would be discarded on the way out, leaving a row that behaves like no
// preference while looking like one.
func TestSelectRefusesAWorkspaceTheAccountDoesNotHold(t *testing.T) {
	store := newFakeStore()
	svc := NewPreferenceService(store, &fakeLister{
		workspaces: []domain.Workspace{personal()},
	})

	err := svc.Select(context.Background(), uuid.New(), "platform_admin")
	if !errors.Is(err, ErrWorkspaceNotAvailable) {
		t.Errorf("err = %v, want ErrWorkspaceNotAvailable", err)
	}
	if store.writes != 0 {
		t.Errorf("wrote %d times for a workspace the account does not hold", store.writes)
	}
}

// Someone else's company is someone else's company, however well-formed the key.
func TestSelectRefusesAnotherAccountsEntityWorkspace(t *testing.T) {
	mine := uuid.NewString()
	theirs := uuid.NewString()

	store := newFakeStore()
	svc := NewPreferenceService(store, &fakeLister{workspaces: []domain.Workspace{
		personal(),
		{Key: domain.KeyFor(domain.TypeCompany, mine), Type: domain.TypeCompany, EntityID: &mine, Label: "Mine"},
	}})

	err := svc.Select(context.Background(), uuid.New(), domain.KeyFor(domain.TypeCompany, theirs))
	if !errors.Is(err, ErrWorkspaceNotAvailable) {
		t.Errorf("err = %v, want ErrWorkspaceNotAvailable", err)
	}
	if store.writes != 0 {
		t.Errorf("wrote %d times for another account's company", store.writes)
	}
}

// Fail closed. An unresolvable list cannot vouch for any key.
func TestSelectRefusesWhenTheListCannotBeResolved(t *testing.T) {
	store := newFakeStore()
	svc := NewPreferenceService(store, &fakeLister{
		workspaces: []domain.Workspace{personal()},
		err:        errors.New("company database unavailable"),
	})

	if err := svc.Select(context.Background(), uuid.New(), personal().Key); err == nil {
		t.Error("stored a key against a failed resolution")
	}
	if store.writes != 0 {
		t.Errorf("wrote %d times against a failed resolution", store.writes)
	}
}

// An account that may enter nothing cannot choose where to land.
func TestSelectRefusesAnIneligibleAccount(t *testing.T) {
	store := newFakeStore()
	svc := NewPreferenceService(store, &fakeLister{err: domain.ErrAccountNotEligible})

	err := svc.Select(context.Background(), uuid.New(), "professional")
	if !errors.Is(err, domain.ErrAccountNotEligible) {
		t.Errorf("err = %v, want ErrAccountNotEligible", err)
	}
	if store.writes != 0 {
		t.Errorf("wrote %d times for an ineligible account", store.writes)
	}
}

func TestSelectRefusesAnEmptyKey(t *testing.T) {
	store := newFakeStore()
	svc := NewPreferenceService(store, &fakeLister{workspaces: []domain.Workspace{personal()}})

	if err := svc.Select(context.Background(), uuid.New(), ""); !errors.Is(err, ErrWorkspaceNotAvailable) {
		t.Errorf("err = %v, want ErrWorkspaceNotAvailable for an empty key", err)
	}
	if store.writes != 0 {
		t.Errorf("wrote %d times for an empty key", store.writes)
	}
}

// One account's choice is not another's.
func TestSelectKeepsAccountsApart(t *testing.T) {
	store := newFakeStore()
	svc := NewPreferenceService(store, &fakeLister{
		workspaces: []domain.Workspace{personal(), recruiting()},
	})
	first, second := uuid.New(), uuid.New()

	if err := svc.Select(context.Background(), first, recruiting().Key); err != nil {
		t.Fatalf("Select: %v", err)
	}

	got, err := svc.LastWorkspace(context.Background(), second)
	if err != nil {
		t.Fatalf("LastWorkspace: %v", err)
	}
	if got != "" {
		t.Errorf("second account's preference = %q, want empty: it chose nothing", got)
	}
}

func TestKeyWithinIsTheMembershipRule(t *testing.T) {
	list := []domain.Workspace{personal(), recruiting()}

	if got := domain.KeyWithin(list, recruiting().Key); got != recruiting().Key {
		t.Errorf("KeyWithin(held) = %q, want the key back", got)
	}
	if got := domain.KeyWithin(list, "platform_admin"); got != "" {
		t.Errorf("KeyWithin(not held) = %q, want empty", got)
	}
	if got := domain.KeyWithin(list, ""); got != "" {
		t.Errorf("KeyWithin(empty) = %q, want empty", got)
	}
	if got := domain.KeyWithin(nil, recruiting().Key); got != "" {
		t.Errorf("KeyWithin(no list) = %q, want empty", got)
	}
}
