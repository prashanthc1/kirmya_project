package service

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"kirmya/internal/workspace/domain"
)

// ErrWorkspaceNotAvailable reports that the account asked to remember a
// workspace its own list does not contain.
//
// Distinct from a lookup failure, and distinct from "not authorized": choosing
// a workspace authorizes nothing, so this refusal protects no data. It keeps
// the store honest instead - a key nothing can resolve is a key that would be
// discarded on the way out anyway, and storing it would leave a row that looks
// like a preference and behaves like none.
var ErrWorkspaceNotAvailable = errors.New("workspace is not available to this account")

// preferenceStore is the persistence this service needs, and no more.
type preferenceStore interface {
	LastWorkspace(ctx context.Context, userID uuid.UUID) (string, error)
	SetLastWorkspace(ctx context.Context, userID uuid.UUID, key string) error
}

// workspaceLister is the resolver, narrowed to the one question a write asks.
type workspaceLister interface {
	ResolveForUser(ctx context.Context, userID uuid.UUID) ([]domain.Workspace, error)
}

// PreferenceService remembers which workspace an account chose to enter.
//
// It exists to answer one question the URL cannot: where to land when there is
// no URL yet - at sign-in, with no returnUrl. The active workspace is still
// derived from the address bar and is not stored anywhere; this never overrides
// a path, and a client that consults it while a URL is available has misused it.
//
// Everything it stores is a preference. Nothing it stores is a grant.
type PreferenceService struct {
	store    preferenceStore
	resolver workspaceLister
}

// NewPreferenceService builds the service.
func NewPreferenceService(store preferenceStore, resolver workspaceLister) *PreferenceService {
	return &PreferenceService{store: store, resolver: resolver}
}

// Select records the account's chosen workspace, after checking the account
// actually has it.
//
// The check is the resolver's, not this package's - asking any other question
// here would put a second eligibility rule in the codebase. A key that is not
// in the resolved list is refused rather than stored; see ErrWorkspaceNotAvailable
// for why that is bookkeeping and not protection.
//
// This is the first of two validations. The second happens when the key is
// served, because a membership can be revoked between the two and the write is
// the older answer.
func (s *PreferenceService) Select(ctx context.Context, userID uuid.UUID, key string) error {
	if s == nil || s.store == nil || s.resolver == nil {
		return errors.New("workspace preferences are not configured")
	}

	resolved, err := s.resolver.ResolveForUser(ctx, userID)
	if err != nil {
		// Includes ErrAccountNotEligible: an account that may enter nothing
		// cannot choose where to land. Fail closed - a failed resolution is not
		// a licence to store an unchecked key.
		return err
	}

	if domain.KeyWithin(resolved, key) == "" {
		return ErrWorkspaceNotAvailable
	}
	return s.store.SetLastWorkspace(ctx, userID, key)
}

// LastWorkspace returns the stored key without judging it.
//
// Deliberately unvalidated: the caller that serves this holds the resolved list
// already, and filtering there rather than here means the invariant is applied
// at the boundary that publishes it. Callers must not treat this value as a
// workspace the account holds.
func (s *PreferenceService) LastWorkspace(ctx context.Context, userID uuid.UUID) (string, error) {
	if s == nil || s.store == nil {
		return "", nil
	}
	return s.store.LastWorkspace(ctx, userID)
}
