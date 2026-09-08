// Package matcher turns saved job alerts into notifications.
//
// Job alerts were create/read/update/delete and nothing else. A candidate could
// name an alert, choose keywords, a location and a frequency, tick "email me",
// and never hear anything: no code ever compared a new posting against a saved
// alert. GetAlertHistory read a table that nothing wrote to.
//
// This is the missing half. Each pass finds jobs published since the alert was
// last matched, keeps the ones that fit, and creates a notification per hit —
// which the outbox then delivers over whichever channels the candidate enabled.
package matcher

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"kirmya/internal/notification/delivery/outbox"
)

// Matcher sweeps active alerts.
type Matcher struct {
	pool   *pgxpool.Pool
	outbox *outbox.Store
	logger *slog.Logger

	// maxJobsPerAlert bounds how many notifications one pass can produce for a
	// single alert. A broad alert against a bulk import would otherwise mail
	// someone hundreds of times in one go, which is how a useful feature
	// becomes the reason people unsubscribe.
	maxJobsPerAlert int
}

func New(pool *pgxpool.Pool, box *outbox.Store) *Matcher {
	return &Matcher{pool: pool, outbox: box, logger: slog.Default(), maxJobsPerAlert: 10}
}

// alert is one saved alert plus its watermark.
type alert struct {
	ID             uuid.UUID
	CandidateID    uuid.UUID
	Title          string
	Keywords       string
	JobTitles      []string
	Skills         []string
	Location       string
	EmploymentType string
	SalaryMin      int
	LastMatchedAt  *time.Time
	Email          bool
	Push           bool
	InApp          bool
}

// Run sweeps on an interval until the context is cancelled.
func (m *Matcher) Run(ctx context.Context, interval time.Duration) {
	if interval <= 0 {
		interval = 5 * time.Minute
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			matched, err := m.Pass(ctx)
			if err != nil {
				m.logger.Error("job alert pass failed", slog.String("error", err.Error()))
			} else if matched > 0 {
				m.logger.Info("job alert pass", slog.Int("notifications", matched))
			}
		}
	}
}

// Pass runs one sweep and reports how many notifications it created.
func (m *Matcher) Pass(ctx context.Context) (int, error) {
	if m.pool == nil {
		return 0, nil
	}

	alerts, err := m.dueAlerts(ctx)
	if err != nil {
		return 0, err
	}

	created := 0
	for _, a := range alerts {
		n, err := m.matchOne(ctx, a)
		if err != nil {
			// One bad alert must not stop the sweep: the rest are still due,
			// and a permanently failing alert should be visible without
			// starving every other candidate's.
			m.logger.Error("job alert could not be matched",
				slog.String("alert_id", a.ID.String()), slog.String("error", err.Error()))
			continue
		}
		created += n
	}
	return created, nil
}

// dueAlerts reads active alerts, oldest watermark first.
func (m *Matcher) dueAlerts(ctx context.Context) ([]alert, error) {
	rows, err := m.pool.Query(ctx, `
		SELECT id, candidate_id, title, COALESCE(keywords, ''),
		       COALESCE(job_titles, '{}'), COALESCE(skills, '{}'),
		       COALESCE(location, ''), COALESCE(employment_type, ''),
		       COALESCE(salary_min, 0), last_matched_at,
		       COALESCE(channel_email, TRUE), COALESCE(channel_push, TRUE),
		       COALESCE(channel_in_app, TRUE)
		FROM job_alerts
		WHERE is_active = TRUE
		ORDER BY last_matched_at NULLS FIRST
		LIMIT 200`)
	if err != nil {
		return nil, fmt.Errorf("read due job alerts: %w", err)
	}
	defer rows.Close()

	var alerts []alert
	for rows.Next() {
		var a alert
		if err := rows.Scan(&a.ID, &a.CandidateID, &a.Title, &a.Keywords,
			&a.JobTitles, &a.Skills, &a.Location, &a.EmploymentType,
			&a.SalaryMin, &a.LastMatchedAt, &a.Email, &a.Push, &a.InApp); err != nil {
			return nil, fmt.Errorf("scan job alert: %w", err)
		}
		alerts = append(alerts, a)
	}
	return alerts, rows.Err()
}

// matchOne finds new jobs for one alert, notifies, and advances its watermark.
//
// The watermark moves whether or not anything matched. Leaving it behind on an
// empty pass would make every subsequent pass rescan the same widening window,
// and the first match after a quiet month would arrive with a month of backlog.
func (m *Matcher) matchOne(ctx context.Context, a alert) (int, error) {
	// A brand-new alert looks back a bounded distance rather than over the
	// whole board: a candidate who creates an alert should hear about what
	// comes next, not receive fifty notifications about the existing archive.
	since := time.Now().UTC().Add(-24 * time.Hour)
	if a.LastMatchedAt != nil && a.LastMatchedAt.After(since) {
		since = *a.LastMatchedAt
	}

	// The open-job predicate matches the public board's exactly, so an alert
	// cannot notify anyone about a posting they would not be able to open.
	where := []string{
		"j.status = 'active'",
		"(j.expires_at IS NULL OR j.expires_at > NOW())",
		"COALESCE(j.published_at, j.created_at) > $2",
	}
	args := []any{a.CandidateID, since}

	add := func(clause string, value any) {
		args = append(args, value)
		where = append(where, fmt.Sprintf(clause, len(args)))
	}

	if kw := strings.TrimSpace(a.Keywords); kw != "" {
		add("(j.title ILIKE '%%' || $%d || '%%' OR j.description ILIKE '%%' || $%d || '%%')", kw)
		// The clause above needs the same placeholder twice; rebuild it.
		where[len(where)-1] = fmt.Sprintf(
			"(j.title ILIKE '%%' || $%d || '%%' OR j.description ILIKE '%%' || $%d || '%%')",
			len(args), len(args))
	}
	if loc := strings.TrimSpace(a.Location); loc != "" {
		add("j.location ILIKE '%%' || $%d || '%%'", loc)
	}
	if et := strings.TrimSpace(a.EmploymentType); et != "" {
		add("j.employment_type = $%d", et)
	}
	if a.SalaryMin > 0 {
		add("(j.salary_max IS NULL OR j.salary_max >= $%d)", a.SalaryMin)
	}
	if len(a.JobTitles) > 0 {
		add("j.title ILIKE ANY($%d)", titlePatterns(a.JobTitles))
	}

	query := fmt.Sprintf(`
		SELECT j.id, j.title, COALESCE(j.location, '')
		FROM jobs j
		WHERE %s
		  AND NOT EXISTS (
		      SELECT 1 FROM job_applications ja
		      WHERE ja.job_id = j.id AND ja.candidate_id = $1
		  )
		ORDER BY COALESCE(j.published_at, j.created_at) DESC
		LIMIT %d`, strings.Join(where, " AND "), m.maxJobsPerAlert)

	rows, err := m.pool.Query(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("match jobs for alert: %w", err)
	}

	type hit struct {
		id       uuid.UUID
		title    string
		location string
	}
	var hits []hit
	for rows.Next() {
		var h hit
		if err := rows.Scan(&h.id, &h.title, &h.location); err != nil {
			rows.Close()
			return 0, fmt.Errorf("scan matched job: %w", err)
		}
		hits = append(hits, h)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, fmt.Errorf("iterate matched jobs: %w", err)
	}

	created := 0
	for _, h := range hits {
		if err := m.notify(ctx, a, h.id, h.title, h.location); err != nil {
			m.logger.Error("could not notify a job alert match",
				slog.String("alert_id", a.ID.String()),
				slog.String("job_id", h.id.String()),
				slog.String("error", err.Error()))
			continue
		}
		created++
	}

	if _, err := m.pool.Exec(ctx,
		`UPDATE job_alerts SET last_matched_at = NOW(), updated_at = NOW() WHERE id = $1`, a.ID); err != nil {
		return created, fmt.Errorf("advance alert watermark: %w", err)
	}

	return created, nil
}

// notify writes the notification and queues it on the alert's enabled channels.
func (m *Matcher) notify(ctx context.Context, a alert, jobID uuid.UUID, title, location string) error {
	notificationID := uuid.New()

	where := title
	if location != "" {
		where = fmt.Sprintf("%s — %s", title, location)
	}

	// A candidate must not be told about the same job by the same alert twice,
	// however often the sweep runs. The claim is the insert itself: if it
	// conflicts, another pass already sent this one and there is nothing to do.
	// Deciding in the database rather than with a prior SELECT is what makes
	// two concurrent sweeps safe.
	var claimed bool
	if err := m.pool.QueryRow(ctx, `
		INSERT INTO job_alert_matches (id, alert_id, candidate_id, job_id, notification_id, matched_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (alert_id, job_id) DO NOTHING
		RETURNING TRUE`,
		uuid.New(), a.ID, a.CandidateID, jobID, notificationID).Scan(&claimed); err != nil {
		// pgx.ErrNoRows here means the conflict fired: already notified.
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return fmt.Errorf("claim alert match: %w", err)
	}

	if _, err := m.pool.Exec(ctx, `
		INSERT INTO notifications
			(id, user_id, type, category, priority, title, content, action_url, is_read, is_archived, created_at, updated_at)
		VALUES ($1, $2, 'job_alert_match', 'Jobs', 'Normal', $3, $4, $5, FALSE, FALSE, NOW(), NOW())`,
		notificationID, a.CandidateID,
		fmt.Sprintf("New match for %q", a.Title),
		fmt.Sprintf("A job matching your alert was posted: %s", where),
		fmt.Sprintf("/jobs/%s", jobID)); err != nil {
		return fmt.Errorf("create alert notification: %w", err)
	}

	if m.outbox == nil {
		return nil
	}
	if a.InApp {
		if err := m.outbox.Enqueue(ctx, notificationID, a.CandidateID, outbox.ChannelInApp, 0); err != nil {
			return err
		}
	}
	if a.Email {
		if err := m.outbox.Enqueue(ctx, notificationID, a.CandidateID, outbox.ChannelEmail, 0); err != nil {
			return err
		}
	}
	if a.Push {
		if err := m.outbox.Enqueue(ctx, notificationID, a.CandidateID, outbox.ChannelPush, 0); err != nil {
			return err
		}
	}
	return nil
}

// titlePatterns wraps each saved job title for an ILIKE ANY comparison.
func titlePatterns(titles []string) []string {
	patterns := make([]string, 0, len(titles))
	for _, t := range titles {
		if t = strings.TrimSpace(t); t != "" {
			patterns = append(patterns, "%"+t+"%")
		}
	}
	return patterns
}
