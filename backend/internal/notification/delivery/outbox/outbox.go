// Package outbox turns stored notifications into delivered messages.
//
// Notifications were written to the database and never sent anywhere. The
// mailer was wired to exactly one caller — email verification — and the
// notification service's Send() created a row and returned. Job alerts, saved
// searches, recruiter messages and application updates all "notified" the user
// by adding a row nobody would see unless they happened to open the app.
//
// The delivery table, its retry counters, its dead-letter table and the admin
// endpoints for inspecting and replaying failures were all already built. This
// package is the producer and the worker that were missing.
//
// The shape is a transactional outbox: the caller enqueues a delivery in the
// same breath as the notification, and a worker claims due rows, sends them,
// and records what happened. A crash between enqueue and send loses nothing —
// the row is still due — which is the property that makes "we notified them"
// true rather than hopeful.
package outbox

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Channel names a delivery route. They match the values the existing
// notification_preferences and notification_deliveries rows already use.
type Channel string

const (
	ChannelEmail Channel = "email"
	ChannelInApp Channel = "in_app"
	ChannelPush  Channel = "push"
)

// Delivery states. These are the values the admin dead-letter and retry
// endpoints already read.
const (
	StatusPending      = "Pending"
	StatusRetrying     = "Retrying"
	StatusSent         = "Sent"
	StatusFailed       = "Failed"
	StatusDeadLettered = "DeadLettered"
)

// Message is one thing to deliver, assembled from the notification and the
// recipient. The worker hands it to a Sender.
type Message struct {
	DeliveryID     uuid.UUID
	NotificationID uuid.UUID
	UserID         uuid.UUID
	Channel        Channel

	Recipient string // email address, device token, or empty for in-app
	Subject   string
	Body      string

	Attempts int
}

// Sender delivers one message over one channel.
//
// It returns an error to mean "this did not arrive". A Sender that cannot
// deliver at all — no SMTP host configured, say — should say so rather than
// returning nil, or the outbox will record a delivery that never happened.
type Sender interface {
	Channel() Channel
	Send(ctx context.Context, msg Message) error
}

// ErrNoSender reports a delivery queued for a channel nothing can send. It is
// terminal: retrying cannot help until the deployment is configured.
var ErrNoSender = errors.New("no sender configured for channel")

// Store is the outbox's persistence.
type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

// Enqueue records a delivery intent for a notification on one channel.
//
// It is idempotent per (notification, channel): a retry after a crash mid-
// enqueue updates nothing and adds nothing, so the recipient cannot be sent the
// same notification twice by the producer. Deduplication within a channel is
// the unique index from migration 0095, not an application-side check, so two
// concurrent producers cannot both win.
func (s *Store) Enqueue(ctx context.Context, notificationID, userID uuid.UUID, channel Channel, maxAttempts int) error {
	return s.EnqueueAt(ctx, notificationID, userID, channel, maxAttempts, time.Time{})
}

// EnqueueAt is Enqueue with a delivery time.
//
// A zero time means "as soon as the worker gets to it". A future time is how
// quiet hours are honoured: the message is deferred rather than dropped. The
// previous code logged "Email delivery deferred for user X due to quiet hours"
// and then did nothing at all, so a notification that arrived during someone's
// quiet hours was never sent — deferred permanently.
func (s *Store) EnqueueAt(ctx context.Context, notificationID, userID uuid.UUID, channel Channel, maxAttempts int, notBefore time.Time) error {
	if s.pool == nil {
		return nil
	}
	if maxAttempts <= 0 {
		maxAttempts = 5
	}
	scheduledAt := time.Now().UTC()
	if notBefore.After(scheduledAt) {
		scheduledAt = notBefore.UTC()
	}

	_, err := s.pool.Exec(ctx, `
		INSERT INTO notification_deliveries
			(id, notification_id, user_id, channel, status, attempts, max_attempts, scheduled_at, created_at)
		VALUES ($1, $2, $3, $4, $5, 0, $6, $7, NOW())
		ON CONFLICT (notification_id, channel) DO NOTHING`,
		uuid.New(), notificationID, userID, string(channel), StatusPending, maxAttempts, scheduledAt)
	if err != nil {
		return fmt.Errorf("enqueue %s delivery: %w", channel, err)
	}
	return nil
}

// ClaimDue takes up to limit deliveries that are ready to send.
//
// FOR UPDATE SKIP LOCKED is what lets more than one worker — or more than one
// API replica — run this at the same time without two of them sending the same
// message. A row another worker holds is skipped rather than waited for.
//
// The claim marks rows Retrying inside the same transaction it selects them in,
// so a worker that dies mid-send leaves the row claimed but past its schedule,
// and the reaper below returns it to the queue.
func (s *Store) ClaimDue(ctx context.Context, limit int) ([]Message, error) {
	if s.pool == nil {
		return nil, nil
	}
	if limit <= 0 {
		limit = 20
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin delivery claim: %w", err)
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT d.id, d.notification_id, d.user_id, d.channel, d.attempts,
		       COALESCE(u.email, ''), COALESCE(n.title, ''), COALESCE(n.content, '')
		FROM notification_deliveries d
		JOIN notifications n ON n.id = d.notification_id
		LEFT JOIN users u ON u.id = d.user_id
		WHERE d.status IN ($1, $2)
		  AND d.scheduled_at <= NOW()
		ORDER BY d.scheduled_at
		LIMIT $3
		FOR UPDATE OF d SKIP LOCKED`,
		StatusPending, StatusRetrying, limit)
	if err != nil {
		return nil, fmt.Errorf("claim due deliveries: %w", err)
	}

	var claimed []Message
	var ids []uuid.UUID
	for rows.Next() {
		var m Message
		var channel string
		if err := rows.Scan(&m.DeliveryID, &m.NotificationID, &m.UserID, &channel,
			&m.Attempts, &m.Recipient, &m.Subject, &m.Body); err != nil {
			rows.Close()
			return nil, fmt.Errorf("scan due delivery: %w", err)
		}
		m.Channel = Channel(channel)
		claimed = append(claimed, m)
		ids = append(ids, m.DeliveryID)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate due deliveries: %w", err)
	}

	if len(ids) == 0 {
		return nil, tx.Commit(ctx)
	}

	// Push the claimed rows out of the way of other workers for the length of
	// one attempt. If this worker dies, they come back when that window passes.
	if _, err := tx.Exec(ctx, `
		UPDATE notification_deliveries
		SET status = $1, scheduled_at = NOW() + INTERVAL '5 minutes'
		WHERE id = ANY($2)`, StatusRetrying, ids); err != nil {
		return nil, fmt.Errorf("mark deliveries claimed: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit delivery claim: %w", err)
	}
	return claimed, nil
}

// MarkSent records a delivery that arrived.
func (s *Store) MarkSent(ctx context.Context, deliveryID uuid.UUID, provider string) error {
	if s.pool == nil {
		return nil
	}
	_, err := s.pool.Exec(ctx, `
		UPDATE notification_deliveries
		SET status = $1, attempts = attempts + 1, sent_at = NOW(),
		    delivered_at = NOW(), provider = $2, last_error = NULL
		WHERE id = $3`, StatusSent, provider, deliveryID)
	if err != nil {
		return fmt.Errorf("mark delivery sent: %w", err)
	}
	return nil
}

// MarkFailed records an attempt that did not arrive and schedules the next one,
// or dead-letters the delivery when its attempts are spent.
//
// The failure is recorded whether or not the row is dead-lettered, because a
// delivery that eventually succeeds after four failures is still four failures
// worth of signal about a provider.
func (s *Store) MarkFailed(ctx context.Context, msg Message, cause error, terminal bool) error {
	if s.pool == nil {
		return nil
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin delivery failure: %w", err)
	}
	defer tx.Rollback(ctx)

	attempts := msg.Attempts + 1
	var maxAttempts int
	if err := tx.QueryRow(ctx,
		`SELECT max_attempts FROM notification_deliveries WHERE id = $1`, msg.DeliveryID).
		Scan(&maxAttempts); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return fmt.Errorf("read delivery attempts: %w", err)
	}

	exhausted := terminal || attempts >= maxAttempts

	status := StatusRetrying
	if exhausted {
		status = StatusDeadLettered
	}

	if _, err := tx.Exec(ctx, `
		UPDATE notification_deliveries
		SET status = $1, attempts = $2, last_error = $3, scheduled_at = $4
		WHERE id = $5`,
		status, attempts, cause.Error(), time.Now().UTC().Add(backoff(attempts)), msg.DeliveryID); err != nil {
		return fmt.Errorf("record delivery failure: %w", err)
	}

	// notification_failures is what the admin failure view reads.
	if _, err := tx.Exec(ctx, `
		INSERT INTO notification_failures
			(id, delivery_id, notification_id, user_id, channel, error_message, retry_count, is_dead_letter, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
		uuid.New(), msg.DeliveryID, msg.NotificationID, msg.UserID,
		string(msg.Channel), cause.Error(), attempts, exhausted); err != nil {
		return fmt.Errorf("record delivery failure detail: %w", err)
	}

	if exhausted {
		// The dead-letter row is what the admin retry endpoint acts on, so a
		// message that ran out of attempts can be replayed deliberately rather
		// than being lost.
		payload, marshalErr := json.Marshal(map[string]any{
			"delivery_id": msg.DeliveryID,
			"subject":     msg.Subject,
			"recipient":   msg.Recipient,
		})
		if marshalErr != nil {
			payload = []byte(`{}`)
		}

		if _, err := tx.Exec(ctx, `
			INSERT INTO notification_dead_letters
				(id, notification_id, user_id, channel, provider, failure_reason, attempts_made, payload, status, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'dead_lettered', NOW(), NOW())
			ON CONFLICT DO NOTHING`,
			uuid.New(), msg.NotificationID, msg.UserID, string(msg.Channel),
			string(msg.Channel), cause.Error(), attempts, payload); err != nil {
			return fmt.Errorf("dead-letter delivery: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit delivery failure: %w", err)
	}
	return nil
}

// backoff spaces retries out so a provider having a bad minute is not hammered,
// and a genuinely broken address is not retried tightly for hours.
func backoff(attempt int) time.Duration {
	switch {
	case attempt <= 1:
		return time.Minute
	case attempt == 2:
		return 5 * time.Minute
	case attempt == 3:
		return 30 * time.Minute
	default:
		return 2 * time.Hour
	}
}
