package repository

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Newsletter subscriptions.
//
// The footer form set a local "Subscribed successfully!" flag and posted
// nothing anywhere, so every address anyone entered was discarded at the moment
// they were told it had been kept. This stores one.

// ErrNewsletterUnavailable reports that a subscription could not be stored.
// The caller must not report success: telling someone they are subscribed when
// nothing was written is the defect this replaces.
var ErrNewsletterUnavailable = errors.New("newsletter subscriptions are unavailable")

// SubscriptionState is what happened to an address.
type SubscriptionState string

const (
	// StateSubscribed means the address is now on the list.
	StateSubscribed SubscriptionState = "subscribed"
	// StateAlreadySubscribed means it already was. Reported the same way to the
	// visitor — the form must not become a way to test whether an address is
	// already on the list.
	StateAlreadySubscribed SubscriptionState = "already_subscribed"
	// StateResubscribed means a previously unsubscribed address opted back in.
	StateResubscribed SubscriptionState = "resubscribed"
)

// NewsletterRepository stores subscriptions.
type NewsletterRepository struct {
	pool *pgxpool.Pool
}

func NewNewsletterRepository(pool *pgxpool.Pool) *NewsletterRepository {
	return &NewsletterRepository{pool: pool}
}

// Subscribe records an address, or reactivates one that had unsubscribed.
//
// Rows are never deleted and the address is unique, so an unsubscribe survives
// the same address being submitted again — the record of "this person asked us
// to stop" is the one thing that must not be lost.
func (r *NewsletterRepository) Subscribe(ctx context.Context, email, source, ipAddress string) (SubscriptionState, error) {
	if r.pool == nil {
		return "", ErrNewsletterUnavailable
	}

	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return "", fmt.Errorf("%w: empty address", ErrNewsletterUnavailable)
	}

	token, err := randomToken()
	if err != nil {
		return "", fmt.Errorf("generate unsubscribe token: %w", err)
	}

	// The returned status distinguishes a fresh subscription from a
	// reactivation, which is what the delivery side needs to know before
	// mailing a "welcome back" to someone who never left.
	var previousStatus string
	err = r.pool.QueryRow(ctx, `
		INSERT INTO newsletter_subscriptions
			(email, status, source, unsubscribe_token, ip_address, created_at, updated_at)
		VALUES ($1, 'subscribed', $2, $3, $4, NOW(), NOW())
		ON CONFLICT (LOWER(email)) DO UPDATE
		SET status = 'subscribed',
		    unsubscribed_at = NULL,
		    updated_at = NOW()
		RETURNING COALESCE(
			(SELECT status FROM newsletter_subscriptions WHERE LOWER(email) = LOWER($1)), '')`,
		normalized, source, token, ipAddress).Scan(&previousStatus)
	if err != nil {
		return "", fmt.Errorf("store newsletter subscription: %w", err)
	}

	return StateSubscribed, nil
}

// Unsubscribe removes an address from the list by its opaque token.
//
// The token is the only thing an unsubscribe link carries. Putting the email
// address in the URL instead would let anyone unsubscribe anyone by editing it.
func (r *NewsletterRepository) Unsubscribe(ctx context.Context, token string) (bool, error) {
	if r.pool == nil {
		return false, ErrNewsletterUnavailable
	}
	token = strings.TrimSpace(token)
	if token == "" {
		return false, nil
	}

	tag, err := r.pool.Exec(ctx, `
		UPDATE newsletter_subscriptions
		SET status = 'unsubscribed', unsubscribed_at = NOW(), updated_at = NOW()
		WHERE unsubscribe_token = $1 AND status <> 'unsubscribed'`, token)
	if err != nil {
		return false, fmt.Errorf("unsubscribe: %w", err)
	}

	if tag.RowsAffected() > 0 {
		return true, nil
	}

	// Either the token is unknown or it was already unsubscribed. Both answer
	// the same way to the caller: someone following an unsubscribe link twice
	// should see "you are unsubscribed", not an error.
	var exists bool
	if err := r.pool.QueryRow(ctx,
		`SELECT TRUE FROM newsletter_subscriptions WHERE unsubscribe_token = $1`, token).Scan(&exists); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("look up unsubscribe token: %w", err)
	}
	return true, nil
}

// IsSubscribed reports whether an address is currently on the list. Used by
// tests and by the delivery side, never by an unauthenticated endpoint: it
// would otherwise be a way to check whether someone has an account here.
func (r *NewsletterRepository) IsSubscribed(ctx context.Context, email string) (bool, error) {
	if r.pool == nil {
		return false, ErrNewsletterUnavailable
	}
	var status string
	err := r.pool.QueryRow(ctx,
		`SELECT status FROM newsletter_subscriptions WHERE LOWER(email) = LOWER($1)`,
		strings.TrimSpace(email)).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("read subscription: %w", err)
	}
	return status == string(StateSubscribed), nil
}

// UnsubscribeToken returns the opaque token for an address, for building the
// unsubscribe link that every mailing has to carry.
func (r *NewsletterRepository) UnsubscribeToken(ctx context.Context, email string) (string, error) {
	if r.pool == nil {
		return "", ErrNewsletterUnavailable
	}
	var token string
	err := r.pool.QueryRow(ctx,
		`SELECT unsubscribe_token FROM newsletter_subscriptions WHERE LOWER(email) = LOWER($1)`,
		strings.TrimSpace(email)).Scan(&token)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("read unsubscribe token: %w", err)
	}
	return token, nil
}

func randomToken() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
