package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PreferenceRepository stores the workspace an account last chose to enter.
//
// It stores a key and nothing else. There is no history, no timestamp the
// product reads, and no per-device row: the question this answers is "where
// should this account land when nothing else says", and that has exactly one
// answer at a time.
//
// Nothing here validates the key against anything. Whether a key names a
// workspace the account may enter is a question for the resolver, and it is
// asked twice - once before a write reaches this repository, and again when the
// stored key is served - because the answer can change in between.
type PreferenceRepository struct {
	db *pgxpool.Pool
}

// NewPreferenceRepository builds the store.
func NewPreferenceRepository(db *pgxpool.Pool) *PreferenceRepository {
	return &PreferenceRepository{db: db}
}

// LastWorkspace returns the stored key, or "" when the account has none.
//
// A missing row is not an error. Most accounts have exactly one workspace and
// will never write here, so "no preference" is the ordinary case and has to be
// cheap to say.
func (r *PreferenceRepository) LastWorkspace(ctx context.Context, userID uuid.UUID) (string, error) {
	if r == nil || r.db == nil {
		return "", nil
	}

	var key string
	err := r.db.QueryRow(ctx,
		`SELECT last_workspace_key FROM workspace_preferences WHERE user_id = $1`,
		userID,
	).Scan(&key)
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		return "", nil
	case err != nil:
		return "", err
	}
	return strings.TrimSpace(key), nil
}

// SetLastWorkspace records the account's choice, replacing any previous one.
//
// Keyed by the authenticated user id passed in by the caller, never by anything
// the request body carries, so one account cannot write another's preference.
func (r *PreferenceRepository) SetLastWorkspace(ctx context.Context, userID uuid.UUID, key string) error {
	trimmed := strings.TrimSpace(key)
	if trimmed == "" {
		// The column refuses this too. Failing here keeps the reason legible
		// rather than surfacing as a constraint violation.
		return errors.New("workspace key is required")
	}

	_, err := r.db.Exec(ctx,
		`INSERT INTO workspace_preferences (user_id, last_workspace_key, updated_at)
		 VALUES ($1, $2, CURRENT_TIMESTAMP)
		 ON CONFLICT (user_id) DO UPDATE
		 SET last_workspace_key = EXCLUDED.last_workspace_key,
		     updated_at = CURRENT_TIMESTAMP`,
		userID, trimmed,
	)
	return err
}

// ClearLastWorkspace removes the preference, returning the account to the
// default landing. Used when an account gives up a workspace it had chosen.
func (r *PreferenceRepository) ClearLastWorkspace(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`DELETE FROM workspace_preferences WHERE user_id = $1`, userID)
	return err
}
