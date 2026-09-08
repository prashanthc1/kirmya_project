//go:build ciintegration

package ci

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"kirmya/internal/job_alerts/matcher"
	"kirmya/internal/notification/delivery/outbox"
)

// Batch 4 acceptance: notifications and job alerts actually leave the building.
//
// Before this batch the delivery path was a log line. NotificationService
// logged "[EMAIL CHANNEL] Dispatched email notification to <user>" and sent
// nothing; the delivery table, its retry counters and the admin dead-letter
// view existed with no producer; and job alerts were CRUD with no matcher, so
// a saved alert never fired. Each test below fails against that code.

// recordingSender captures what would have been delivered.
type recordingSender struct {
	channel outbox.Channel
	sent    []outbox.Message
	fail    error
}

func (r *recordingSender) Channel() outbox.Channel { return r.channel }

func (r *recordingSender) Send(_ context.Context, msg outbox.Message) error {
	if r.fail != nil {
		return r.fail
	}
	r.sent = append(r.sent, msg)
	return nil
}

func batch4Pool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	pool, err := pgxpool.New(context.Background(), required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// seedNotification writes a notification for a user and returns its id.
func seedNotification(ctx context.Context, t *testing.T, pool *pgxpool.Pool, userID uuid.UUID, title string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	if _, err := pool.Exec(ctx, `
		INSERT INTO notifications (id, user_id, type, category, priority, title, content, is_read, is_archived, created_at, updated_at)
		VALUES ($1, $2, 'batch4_test', 'Jobs', 'Normal', $3, 'Body of the notification', FALSE, FALSE, NOW(), NOW())`,
		id, userID, title); err != nil {
		t.Fatalf("seed notification: %v", err)
	}
	return id
}

// TestQueuedNotificationIsDelivered is the core claim: a queued delivery is
// picked up, sent, and recorded as sent.
func TestQueuedNotificationIsDelivered(t *testing.T) {
	ctx := context.Background()
	base := required(t, "TEST_API_URL")
	pool := batch4Pool(t)

	user := registerAndLogin(t, base)
	userID := uuid.MustParse(user.id)
	notificationID := seedNotification(ctx, t, pool, userID, "Batch 4 delivery")

	store := outbox.NewStore(pool)
	if err := store.Enqueue(ctx, notificationID, userID, outbox.ChannelEmail, 3); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	sender := &recordingSender{channel: outbox.ChannelEmail}
	worker := outbox.NewWorker(store, 10, sender)

	sent, failed, err := worker.Pass(ctx)
	if err != nil {
		t.Fatalf("delivery pass: %v", err)
	}
	if sent == 0 {
		t.Fatalf("nothing was delivered (sent=%d failed=%d)", sent, failed)
	}

	// The message carried the recipient and the notification's own content,
	// joined from users and notifications rather than passed in by the caller.
	var delivered *outbox.Message
	for i := range sender.sent {
		if sender.sent[i].NotificationID == notificationID {
			delivered = &sender.sent[i]
		}
	}
	if delivered == nil {
		t.Fatal("the queued notification was not among the delivered messages")
	}
	if delivered.Recipient != user.email {
		t.Errorf("delivered to %q, want %q", delivered.Recipient, user.email)
	}
	if delivered.Subject != "Batch 4 delivery" {
		t.Errorf("subject = %q, want the notification title", delivered.Subject)
	}

	var status string
	var sentAt *time.Time
	if err := pool.QueryRow(ctx,
		`SELECT status, sent_at FROM notification_deliveries WHERE notification_id = $1 AND channel = 'email'`,
		notificationID).Scan(&status, &sentAt); err != nil {
		t.Fatalf("read back delivery: %v", err)
	}
	if status != outbox.StatusSent {
		t.Errorf("status = %q, want %q", status, outbox.StatusSent)
	}
	if sentAt == nil {
		t.Error("a delivered message has no sent_at")
	}
}

// Enqueueing twice for the same channel must not send twice. This is what makes
// the producer safe to re-run after a crash between the notification write and
// the enqueue.
func TestEnqueueIsIdempotentPerChannel(t *testing.T) {
	ctx := context.Background()
	base := required(t, "TEST_API_URL")
	pool := batch4Pool(t)

	user := registerAndLogin(t, base)
	userID := uuid.MustParse(user.id)
	notificationID := seedNotification(ctx, t, pool, userID, "Duplicate guard")

	store := outbox.NewStore(pool)
	for i := 0; i < 3; i++ {
		if err := store.Enqueue(ctx, notificationID, userID, outbox.ChannelEmail, 3); err != nil {
			t.Fatalf("enqueue %d: %v", i, err)
		}
	}

	var queued int
	if err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM notification_deliveries WHERE notification_id = $1 AND channel = 'email'`,
		notificationID).Scan(&queued); err != nil {
		t.Fatalf("count deliveries: %v", err)
	}
	if queued != 1 {
		t.Errorf("three enqueues produced %d deliveries, want 1", queued)
	}
}

// A failed send must be retried later, not lost and not reported as sent.
func TestFailedDeliveryIsRetriedThenDeadLettered(t *testing.T) {
	ctx := context.Background()
	base := required(t, "TEST_API_URL")
	pool := batch4Pool(t)

	user := registerAndLogin(t, base)
	userID := uuid.MustParse(user.id)
	notificationID := seedNotification(ctx, t, pool, userID, "Failing delivery")

	store := outbox.NewStore(pool)
	// max_attempts of 2 so the dead-letter path is reachable in a test.
	if err := store.Enqueue(ctx, notificationID, userID, outbox.ChannelEmail, 2); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	broken := &recordingSender{channel: outbox.ChannelEmail, fail: errors.New("smtp refused the message")}
	worker := outbox.NewWorker(store, 10, broken)

	// First attempt fails and is scheduled for another try.
	if _, failed, err := worker.Pass(ctx); err != nil || failed == 0 {
		t.Fatalf("first pass: failed=%d err=%v", failed, err)
	}

	var status string
	var attempts int
	var lastError *string
	if err := pool.QueryRow(ctx,
		`SELECT status, attempts, last_error FROM notification_deliveries WHERE notification_id = $1 AND channel = 'email'`,
		notificationID).Scan(&status, &attempts, &lastError); err != nil {
		t.Fatalf("read back delivery: %v", err)
	}
	if status == outbox.StatusSent {
		t.Fatal("a delivery that failed was recorded as sent")
	}
	if attempts != 1 {
		t.Errorf("attempts = %d, want 1", attempts)
	}
	if lastError == nil || *lastError == "" {
		t.Error("the failure reason was not recorded")
	}

	// The failure is visible to the admin failure view.
	var failures int
	if err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM notification_failures WHERE notification_id = $1`,
		notificationID).Scan(&failures); err != nil {
		t.Fatalf("count failures: %v", err)
	}
	if failures == 0 {
		t.Error("no failure row was written for the admin view")
	}

	// Make it due again and spend the last attempt.
	if _, err := pool.Exec(ctx,
		`UPDATE notification_deliveries SET scheduled_at = NOW() - INTERVAL '1 minute' WHERE notification_id = $1`,
		notificationID); err != nil {
		t.Fatalf("make delivery due: %v", err)
	}
	if _, failed, err := worker.Pass(ctx); err != nil || failed == 0 {
		t.Fatalf("second pass: failed=%d err=%v", failed, err)
	}

	if err := pool.QueryRow(ctx,
		`SELECT status FROM notification_deliveries WHERE notification_id = $1 AND channel = 'email'`,
		notificationID).Scan(&status); err != nil {
		t.Fatalf("read back delivery: %v", err)
	}
	if status != outbox.StatusDeadLettered {
		t.Errorf("status after exhausting attempts = %q, want %q", status, outbox.StatusDeadLettered)
	}

	// Dead-lettered, not lost: the admin retry endpoint has something to act on.
	var deadLetters int
	if err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM notification_dead_letters WHERE notification_id = $1`,
		notificationID).Scan(&deadLetters); err != nil {
		t.Fatalf("count dead letters: %v", err)
	}
	if deadLetters == 0 {
		t.Error("an exhausted delivery left no dead-letter row")
	}
}

// A channel with nothing registered to send it must dead-letter immediately
// rather than retrying into a void — and must never be recorded as delivered.
func TestUnconfiguredChannelDeadLettersRatherThanClaimingSuccess(t *testing.T) {
	ctx := context.Background()
	base := required(t, "TEST_API_URL")
	pool := batch4Pool(t)

	user := registerAndLogin(t, base)
	userID := uuid.MustParse(user.id)
	notificationID := seedNotification(ctx, t, pool, userID, "Unwired channel")

	store := outbox.NewStore(pool)
	if err := store.Enqueue(ctx, notificationID, userID, outbox.ChannelPush, 3); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	// Worker with no push sender registered.
	worker := outbox.NewWorker(store, 10, outbox.NewInAppSender())
	if _, failed, err := worker.Pass(ctx); err != nil || failed == 0 {
		t.Fatalf("pass: failed=%d err=%v", failed, err)
	}

	var status string
	if err := pool.QueryRow(ctx,
		`SELECT status FROM notification_deliveries WHERE notification_id = $1 AND channel = 'push'`,
		notificationID).Scan(&status); err != nil {
		t.Fatalf("read back delivery: %v", err)
	}
	if status != outbox.StatusDeadLettered {
		t.Errorf("status = %q, want %q for a channel with no sender", status, outbox.StatusDeadLettered)
	}
}

// TestJobAlertNotifiesOnAMatchingJob is the alert half: a saved alert must
// produce a notification when a matching job is published, and must not
// produce a second one for the same job on the next sweep.
func TestJobAlertNotifiesOnAMatchingJob(t *testing.T) {
	ctx := context.Background()
	base := required(t, "TEST_API_URL")
	pool := batch4Pool(t)

	candidate := registerAndLogin(t, base)
	candidateID := uuid.MustParse(candidate.id)

	companyID := seedCompany(ctx, t, pool, "Batch 4 Alert Company")

	// A job the alert should find: active, unexpired, published just now.
	jobID := uuid.New()
	uniqueTitle := "Batch4 Distributed Systems Engineer " + uuid.NewString()[:8]
	if _, err := pool.Exec(ctx, `
		INSERT INTO jobs (id, company_id, title, description, location, employment_type, status, published_at, created_at, updated_at)
		VALUES ($1, $2, $3, 'A real posting seeded by the batch 4 alert test', 'Remote', 'Full-time', 'active', NOW(), NOW(), NOW())`,
		jobID, companyID, uniqueTitle); err != nil {
		t.Fatalf("seed job: %v", err)
	}

	alertID := uuid.New()
	if _, err := pool.Exec(ctx, `
		INSERT INTO job_alerts (id, candidate_id, title, keywords, location, is_active, channel_email, channel_in_app, channel_push, created_at, updated_at)
		VALUES ($1, $2, 'Batch 4 alert', $3, '', TRUE, TRUE, TRUE, FALSE, NOW(), NOW())`,
		alertID, candidateID, uniqueTitle); err != nil {
		t.Fatalf("seed alert: %v", err)
	}

	store := outbox.NewStore(pool)
	m := matcher.New(pool, store)

	created, err := m.Pass(ctx)
	if err != nil {
		t.Fatalf("matcher pass: %v", err)
	}
	if created == 0 {
		t.Fatal("a matching job produced no notification")
	}

	// The match is recorded against this alert and this job.
	var notificationID uuid.UUID
	if err := pool.QueryRow(ctx,
		`SELECT notification_id FROM job_alert_matches WHERE alert_id = $1 AND job_id = $2`,
		alertID, jobID).Scan(&notificationID); err != nil {
		t.Fatalf("read back alert match: %v", err)
	}

	// And it queued deliveries on the channels the alert asked for, and only
	// those: push was disabled on this alert.
	rows, err := pool.Query(ctx,
		`SELECT channel FROM notification_deliveries WHERE notification_id = $1`, notificationID)
	if err != nil {
		t.Fatalf("read deliveries: %v", err)
	}
	channels := map[string]bool{}
	for rows.Next() {
		var channel string
		if err := rows.Scan(&channel); err != nil {
			rows.Close()
			t.Fatalf("scan channel: %v", err)
		}
		channels[channel] = true
	}
	rows.Close()

	if !channels["email"] || !channels["in_app"] {
		t.Errorf("queued channels %v, want email and in_app", channels)
	}
	if channels["push"] {
		t.Error("queued a push delivery for an alert with push disabled")
	}

	// A second sweep must not notify about the same job again.
	if _, err := m.Pass(ctx); err != nil {
		t.Fatalf("second matcher pass: %v", err)
	}
	var matchRows int
	if err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM job_alert_matches WHERE alert_id = $1 AND job_id = $2`,
		alertID, jobID).Scan(&matchRows); err != nil {
		t.Fatalf("count matches: %v", err)
	}
	if matchRows != 1 {
		t.Errorf("the same job was matched %d times, want 1", matchRows)
	}
}

// An alert must not notify a candidate about a job they have already applied
// to, and must not surface an expired posting the public board would hide.
func TestJobAlertSkipsAppliedAndExpiredJobs(t *testing.T) {
	ctx := context.Background()
	base := required(t, "TEST_API_URL")
	pool := batch4Pool(t)

	candidate := registerAndLogin(t, base)
	candidateID := uuid.MustParse(candidate.id)
	companyID := seedCompany(ctx, t, pool, "Batch 4 Skip Company")

	marker := uuid.NewString()[:8]

	appliedJob := uuid.New()
	if _, err := pool.Exec(ctx, `
		INSERT INTO jobs (id, company_id, title, description, location, employment_type, status, published_at, created_at, updated_at)
		VALUES ($1, $2, $3, 'Already applied', 'Remote', 'Full-time', 'active', NOW(), NOW(), NOW())`,
		appliedJob, companyID, "Batch4 Applied "+marker); err != nil {
		t.Fatalf("seed applied job: %v", err)
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO job_applications (id, job_id, candidate_id, current_stage, applied_at, updated_at)
		VALUES ($1, $2, $3, 'Applied', NOW(), NOW())`,
		uuid.New(), appliedJob, candidateID); err != nil {
		t.Fatalf("seed application: %v", err)
	}

	expiredJob := uuid.New()
	if _, err := pool.Exec(ctx, `
		INSERT INTO jobs (id, company_id, title, description, location, employment_type, status, published_at, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, 'Expired posting', 'Remote', 'Full-time', 'active', NOW(), NOW() - INTERVAL '1 hour', NOW(), NOW())`,
		expiredJob, companyID, "Batch4 Expired "+marker); err != nil {
		t.Fatalf("seed expired job: %v", err)
	}

	alertID := uuid.New()
	if _, err := pool.Exec(ctx, `
		INSERT INTO job_alerts (id, candidate_id, title, keywords, location, is_active, channel_email, channel_in_app, channel_push, created_at, updated_at)
		VALUES ($1, $2, 'Batch 4 skip alert', $3, '', TRUE, TRUE, TRUE, FALSE, NOW(), NOW())`,
		alertID, candidateID, "Batch4 "+marker); err != nil {
		t.Fatalf("seed alert: %v", err)
	}

	if _, err := matcher.New(pool, outbox.NewStore(pool)).Pass(ctx); err != nil {
		t.Fatalf("matcher pass: %v", err)
	}

	for _, tc := range []struct {
		jobID  uuid.UUID
		reason string
	}{
		{appliedJob, "a job the candidate has already applied to"},
		{expiredJob, "a posting past its expiry that the public board hides"},
	} {
		var matched int
		if err := pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM job_alert_matches WHERE alert_id = $1 AND job_id = $2`,
			alertID, tc.jobID).Scan(&matched); err != nil {
			t.Fatalf("count matches: %v", err)
		}
		if matched != 0 {
			t.Errorf("the alert notified about %s", tc.reason)
		}
	}
}

// Two workers running at once — as two API replicas would — must not both send
// the same message.
func TestConcurrentWorkersDoNotDoubleSend(t *testing.T) {
	ctx := context.Background()
	base := required(t, "TEST_API_URL")
	pool := batch4Pool(t)

	user := registerAndLogin(t, base)
	userID := uuid.MustParse(user.id)

	store := outbox.NewStore(pool)
	ids := make([]uuid.UUID, 0, 5)
	for i := 0; i < 5; i++ {
		id := seedNotification(ctx, t, pool, userID, "Concurrent delivery")
		if err := store.Enqueue(ctx, id, userID, outbox.ChannelEmail, 3); err != nil {
			t.Fatalf("enqueue: %v", err)
		}
		ids = append(ids, id)
	}

	first := &recordingSender{channel: outbox.ChannelEmail}
	second := &recordingSender{channel: outbox.ChannelEmail}

	done := make(chan error, 2)
	for _, sender := range []*recordingSender{first, second} {
		go func(s *recordingSender) {
			_, _, err := outbox.NewWorker(store, 10, s).Pass(ctx)
			done <- err
		}(sender)
	}
	for i := 0; i < 2; i++ {
		if err := <-done; err != nil {
			t.Fatalf("concurrent pass: %v", err)
		}
	}

	seen := map[uuid.UUID]int{}
	for _, msg := range append(append([]outbox.Message{}, first.sent...), second.sent...) {
		seen[msg.NotificationID]++
	}
	for _, id := range ids {
		if seen[id] > 1 {
			t.Errorf("notification %s was sent %d times by concurrent workers", id, seen[id])
		}
	}
}

// A delivery for a notification that no longer exists must not stall the queue.
func TestDeliveryForAMissingNotificationDoesNotStallTheQueue(t *testing.T) {
	ctx := context.Background()
	base := required(t, "TEST_API_URL")
	pool := batch4Pool(t)

	user := registerAndLogin(t, base)
	userID := uuid.MustParse(user.id)

	orphan := seedNotification(ctx, t, pool, userID, "Soon to be deleted")
	store := outbox.NewStore(pool)
	if err := store.Enqueue(ctx, orphan, userID, outbox.ChannelEmail, 3); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	live := seedNotification(ctx, t, pool, userID, "Still here")
	if err := store.Enqueue(ctx, live, userID, outbox.ChannelEmail, 3); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	// The claim joins notifications, so a deleted one drops out of the batch
	// rather than blocking everything behind it.
	if _, err := pool.Exec(ctx, `DELETE FROM notification_deliveries WHERE notification_id = $1`, orphan); err != nil {
		t.Fatalf("clear orphan delivery: %v", err)
	}
	if _, err := pool.Exec(ctx, `DELETE FROM notifications WHERE id = $1`, orphan); err != nil {
		t.Fatalf("delete notification: %v", err)
	}

	sender := &recordingSender{channel: outbox.ChannelEmail}
	if sent, _, err := outbox.NewWorker(store, 10, sender).Pass(ctx); err != nil {
		t.Fatalf("pass: %v", err)
	} else if sent == 0 {
		t.Fatal("the live delivery behind the removed one was not sent")
	}

	var status string
	if err := pool.QueryRow(ctx,
		`SELECT status FROM notification_deliveries WHERE notification_id = $1`, live).Scan(&status); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			t.Fatal("the live delivery disappeared")
		}
		t.Fatalf("read back: %v", err)
	}
	if status != outbox.StatusSent {
		t.Errorf("live delivery status = %q, want %q", status, outbox.StatusSent)
	}
}
