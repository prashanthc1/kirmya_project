package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ---------------------------------------------------------------------------
// Jobs
//
// This module only reads the jobs table. Creating, editing and publishing a job
// stays in the jobs and recruiter modules; duplicating it here would give the
// platform two sets of rules for the same rows.
// ---------------------------------------------------------------------------

// ListCompanyJobs returns a company's jobs. Public callers get published
// openings only; internal callers holding job:view can ask for drafts and
// closed roles too.
func (r *ManagementRepository) ListCompanyJobs(ctx context.Context, companyID uuid.UUID, status string, includeUnpublished bool, page, limit int) (*models.CompanyJobsPage, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	page, limit, offset := normalizePage(page, limit)

	where := []string{"j.company_id = $1"}
	args := []any{companyID}
	arg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if !includeUnpublished {
		where = append(where, "j.status = 'active'")
	} else if status = strings.ToLower(strings.TrimSpace(status)); status != "" {
		switch status {
		case "draft", "active", "paused", "closed", "expired":
			where = append(where, "j.status = "+arg(status))
		case "featured":
			where = append(where, "j.is_featured = TRUE")
		default:
			return nil, domain.ErrValidation
		}
	}

	clause := strings.Join(where, " AND ")

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM jobs j WHERE "+clause, args...).Scan(&total); err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT j.id, j.title, COALESCE(j.department, ''), COALESCE(j.location, ''),
		       COALESCE(j.work_mode, ''), COALESCE(j.employment_type, ''),
		       COALESCE(j.experience_level, ''), COALESCE(j.salary_range, ''),
		       COALESCE(j.skills, '[]'::jsonb), j.status, j.is_featured,
		       j.views_count, j.applications_count,
		       j.published_at, j.expires_at, j.created_at
		FROM jobs j
		WHERE `+clause+`
		ORDER BY j.is_featured DESC, COALESCE(j.published_at, j.created_at) DESC
		LIMIT `+arg(limit)+` OFFSET `+arg(offset), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.CompanyJob{}
	for rows.Next() {
		var j models.CompanyJob
		if err := rows.Scan(&j.ID, &j.Title, &j.Department, &j.Location,
			&j.WorkMode, &j.EmploymentType, &j.ExperienceLevel, &j.SalaryRange,
			&j.Skills, &j.Status, &j.IsFeatured, &j.ViewsCount, &j.ApplicationsCount,
			&j.PublishedAt, &j.ExpiresAt, &j.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, j)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.CompanyJobsPage{
		Items: items, Total: total, Page: page, Limit: limit,
		TotalPages: totalPages(total, limit),
	}, nil
}

// JobBelongsTo checks that a job id is this company's before any company-scoped
// endpoint reports on it.
func (r *ManagementRepository) JobBelongsTo(ctx context.Context, companyID, jobID uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, ErrNoDatabase
	}
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM jobs WHERE id = $1 AND company_id = $2)`,
		jobID, companyID).Scan(&exists)
	return exists, err
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

const reviewColumns = `
	rv.id, rv.company_id, rv.user_id, rv.is_anonymous,
	TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
	rv.employment_type, rv.employment_started_on, rv.employment_ended_on,
	COALESCE(rv.job_title, ''), rv.overall_rating,
	rv.work_life_balance, rv.compensation_rating, rv.culture_rating,
	rv.management_rating, rv.career_growth_rating,
	COALESCE(rv.title, ''), rv.summary, COALESCE(rv.pros, ''), COALESCE(rv.cons, ''),
	COALESCE(rv.company_response, ''), rv.company_response_at,
	rv.created_at, rv.updated_at`

// scanReview reads a review and applies the two privacy rules that matter:
// an anonymous review never carries the author's name, and the employment
// period is reduced to a coarse label rather than exact dates.
func scanReview(row rowScanner, viewerID uuid.UUID) (models.CompanyReview, error) {
	var rv models.CompanyReview
	var authorID uuid.UUID
	var authorName string
	var employmentType string
	var startedOn, endedOn *time.Time
	err := row.Scan(
		&rv.ID, &rv.CompanyID, &authorID, &rv.IsAnonymous, &authorName,
		&employmentType, &startedOn, &endedOn,
		&rv.JobTitle, &rv.OverallRating,
		&rv.WorkLifeBalance, &rv.CompensationRating, &rv.CultureRating,
		&rv.ManagementRating, &rv.CareerGrowthRating,
		&rv.Title, &rv.Summary, &rv.Pros, &rv.Cons,
		&rv.CompanyResponse, &rv.CompanyResponseAt,
		&rv.CreatedAt, &rv.UpdatedAt,
	)
	if err != nil {
		return models.CompanyReview{}, err
	}
	if parsed, ok := domain.ParseReviewEmploymentType(employmentType); ok {
		rv.EmploymentType = parsed
	}
	rv.IsOwnReview = viewerID != uuid.Nil && viewerID == authorID
	if !rv.IsAnonymous {
		rv.AuthorName = strings.TrimSpace(authorName)
	}
	if rv.IsAnonymous {
		// An anonymous reviewer's job title is often enough to identify them in
		// a small team, so it is dropped along with the name.
		rv.JobTitle = ""
	}
	rv.EmploymentPeriod = employmentPeriodLabel(startedOn, endedOn)
	return rv, nil
}

// employmentPeriodLabel reduces a date range to years. "2019 - 2022" is enough
// context for a reader and is not the identifying detail an exact start date is.
func employmentPeriodLabel(started, ended *time.Time) string {
	switch {
	case started == nil && ended == nil:
		return ""
	case started == nil:
		return fmt.Sprintf("until %d", ended.Year())
	case ended == nil:
		return fmt.Sprintf("%d - present", started.Year())
	default:
		if started.Year() == ended.Year() {
			return fmt.Sprintf("%d", started.Year())
		}
		return fmt.Sprintf("%d - %d", started.Year(), ended.Year())
	}
}

// ListReviews returns a company's published reviews plus the rating breakdown.
// Reviews pulled for moderation are not returned to anyone here.
func (r *ManagementRepository) ListReviews(ctx context.Context, companyID, viewerID uuid.UUID, page, limit int) (*models.CompanyReviewsPage, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	page, limit, offset := normalizePage(page, limit)

	var total int
	var average float64
	if err := r.db.QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0)
		FROM company_reviews WHERE company_id = $1 AND status = 'published'`,
		companyID).Scan(&total, &average); err != nil {
		return nil, err
	}

	breakdown := map[string]int{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
	bRows, err := r.db.Query(ctx, `
		SELECT overall_rating, COUNT(*) FROM company_reviews
		WHERE company_id = $1 AND status = 'published' GROUP BY overall_rating`, companyID)
	if err != nil {
		return nil, err
	}
	for bRows.Next() {
		var rating, count int
		if err := bRows.Scan(&rating, &count); err != nil {
			bRows.Close()
			return nil, err
		}
		breakdown[fmt.Sprintf("%d", rating)] = count
	}
	bRows.Close()
	if err := bRows.Err(); err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, "SELECT "+reviewColumns+`
		FROM company_reviews rv
		LEFT JOIN users u ON u.id = rv.user_id
		WHERE rv.company_id = $1 AND rv.status = 'published'
		ORDER BY rv.created_at DESC
		LIMIT $2 OFFSET $3`, companyID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.CompanyReview{}
	for rows.Next() {
		rv, err := scanReview(rows, viewerID)
		if err != nil {
			return nil, err
		}
		items = append(items, rv)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.CompanyReviewsPage{
		Items: items, Total: total, Page: page, Limit: limit,
		TotalPages: totalPages(total, limit), AverageRating: average,
		RatingBreakdown: breakdown,
	}, nil
}

// GetReview loads one review belonging to a company.
func (r *ManagementRepository) GetReview(ctx context.Context, companyID, reviewID, viewerID uuid.UUID) (*models.CompanyReview, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	row := r.db.QueryRow(ctx, "SELECT "+reviewColumns+`
		FROM company_reviews rv
		LEFT JOIN users u ON u.id = rv.user_id
		WHERE rv.company_id = $1 AND rv.id = $2 AND rv.status <> 'removed'`,
		companyID, reviewID)
	rv, err := scanReview(row, viewerID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &rv, nil
}

// ReviewAuthor returns the author of a review, so the service can check that an
// edit or delete is the reviewer's own.
func (r *ManagementRepository) ReviewAuthor(ctx context.Context, companyID, reviewID uuid.UUID) (uuid.UUID, error) {
	if r.db == nil {
		return uuid.Nil, ErrNoDatabase
	}
	var author uuid.UUID
	err := r.db.QueryRow(ctx,
		`SELECT user_id FROM company_reviews WHERE company_id = $1 AND id = $2 AND status <> 'removed'`,
		companyID, reviewID).Scan(&author)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, domain.ErrNotFound
	}
	return author, err
}

// CreateReview stores a review written by a real user about a real employment
// period. The unique index on (company, user, employment type, start month) is
// what stops one person filing the same review repeatedly; hitting it comes
// back as a conflict, not a duplicate row.
func (r *ManagementRepository) CreateReview(ctx context.Context, companyID, userID uuid.UUID, p models.ReviewPayload) (uuid.UUID, error) {
	if r.db == nil {
		return uuid.Nil, ErrNoDatabase
	}
	employment, ok := domain.ParseReviewEmploymentType(p.EmploymentType)
	if !ok {
		return uuid.Nil, domain.ErrValidation
	}
	started, err := parseOptionalDate(p.EmploymentStartedOn)
	if err != nil {
		return uuid.Nil, domain.ErrValidation
	}
	ended, err := parseOptionalDate(p.EmploymentEndedOn)
	if err != nil {
		return uuid.Nil, domain.ErrValidation
	}
	anonymous := true
	if p.IsAnonymous != nil {
		anonymous = *p.IsAnonymous
	}

	id := uuid.New()
	_, err = r.db.Exec(ctx, `
		INSERT INTO company_reviews
			(id, company_id, user_id, employment_type, employment_started_on, employment_ended_on,
			 job_title, overall_rating, work_life_balance, compensation_rating, culture_rating,
			 management_rating, career_growth_rating, title, summary, pros, cons, is_anonymous)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
		id, companyID, userID, string(employment), started, ended,
		strings.TrimSpace(p.JobTitle), p.OverallRating, p.WorkLifeBalance, p.CompensationRating,
		p.CultureRating, p.ManagementRating, p.CareerGrowthRating,
		strings.TrimSpace(p.Title), strings.TrimSpace(p.Summary),
		strings.TrimSpace(p.Pros), strings.TrimSpace(p.Cons), anonymous)
	if isUniqueViolation(err) {
		return uuid.Nil, domain.ErrConflict
	}
	if err != nil {
		return uuid.Nil, err
	}
	if err := r.RefreshCounters(ctx, companyID); err != nil {
		return uuid.Nil, err
	}
	return id, nil
}

// UpdateReview rewrites the caller's own review. The predicate carries the
// author id, so an edit aimed at somebody else's review matches nothing.
func (r *ManagementRepository) UpdateReview(ctx context.Context, companyID, reviewID, userID uuid.UUID, p models.ReviewPayload) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	employment, ok := domain.ParseReviewEmploymentType(p.EmploymentType)
	if !ok {
		return domain.ErrValidation
	}
	started, err := parseOptionalDate(p.EmploymentStartedOn)
	if err != nil {
		return domain.ErrValidation
	}
	ended, err := parseOptionalDate(p.EmploymentEndedOn)
	if err != nil {
		return domain.ErrValidation
	}
	anonymous := true
	if p.IsAnonymous != nil {
		anonymous = *p.IsAnonymous
	}

	tag, err := r.db.Exec(ctx, `
		UPDATE company_reviews SET
			employment_type = $4, employment_started_on = $5, employment_ended_on = $6,
			job_title = $7, overall_rating = $8, work_life_balance = $9,
			compensation_rating = $10, culture_rating = $11, management_rating = $12,
			career_growth_rating = $13, title = $14, summary = $15, pros = $16, cons = $17,
			is_anonymous = $18, updated_at = NOW()
		WHERE company_id = $1 AND id = $2 AND user_id = $3 AND status <> 'removed'`,
		companyID, reviewID, userID, string(employment), started, ended,
		strings.TrimSpace(p.JobTitle), p.OverallRating, p.WorkLifeBalance, p.CompensationRating,
		p.CultureRating, p.ManagementRating, p.CareerGrowthRating,
		strings.TrimSpace(p.Title), strings.TrimSpace(p.Summary),
		strings.TrimSpace(p.Pros), strings.TrimSpace(p.Cons), anonymous)
	if isUniqueViolation(err) {
		return domain.ErrConflict
	}
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return r.RefreshCounters(ctx, companyID)
}

// DeleteReview removes the caller's own review.
func (r *ManagementRepository) DeleteReview(ctx context.Context, companyID, reviewID, userID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	tag, err := r.db.Exec(ctx, `
		UPDATE company_reviews SET status = 'removed', updated_at = NOW()
		WHERE company_id = $1 AND id = $2 AND user_id = $3 AND status <> 'removed'`,
		companyID, reviewID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return r.RefreshCounters(ctx, companyID)
}

// ReportReview files a moderation report.
//
// A review is only pulled from public view once distinct reporters reach the
// threshold. A single report cannot hide criticism, and the same person cannot
// report twice — the unique constraint on (review, reporter) sees to that.
func (r *ManagementRepository) ReportReview(ctx context.Context, companyID, reviewID, reporterID uuid.UUID, reason, details string) error {
	if r.db == nil {
		return ErrNoDatabase
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var exists bool
	if err := tx.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM company_reviews WHERE id = $1 AND company_id = $2 AND status <> 'removed')`,
		reviewID, companyID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return domain.ErrNotFound
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO company_review_reports (id, review_id, company_id, reporter_id, reason, details)
		VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''))`,
		uuid.New(), reviewID, companyID, reporterID, reason, strings.TrimSpace(details)); err != nil {
		if isUniqueViolation(err) {
			return domain.ErrConflict
		}
		return err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE company_reviews SET
			reports_count = (SELECT COUNT(*) FROM company_review_reports WHERE review_id = $1),
			status = CASE
				WHEN (SELECT COUNT(*) FROM company_review_reports WHERE review_id = $1) >= $2
				THEN 'under_review' ELSE status END,
			updated_at = NOW()
		WHERE id = $1`, reviewID, domain.ReviewReportThreshold); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}
	return r.RefreshCounters(ctx, companyID)
}

// RespondToReview attaches the company's public reply. It replaces the previous
// reply rather than appending, so a company has one voice per review.
func (r *ManagementRepository) RespondToReview(ctx context.Context, companyID, reviewID, responderID uuid.UUID, response string) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	tag, err := r.db.Exec(ctx, `
		UPDATE company_reviews
		SET company_response = $4, company_response_by = $3, company_response_at = NOW(), updated_at = NOW()
		WHERE company_id = $1 AND id = $2 AND status = 'published'`,
		companyID, reviewID, responderID, strings.TrimSpace(response))
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// HasReviewed reports whether a user already has a live review for a company,
// which the reviews page uses to decide whether to offer the write form.
func (r *ManagementRepository) HasReviewed(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, ErrNoDatabase
	}
	if userID == uuid.Nil {
		return false, nil
	}
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM company_reviews
		WHERE company_id = $1 AND user_id = $2 AND status <> 'removed')`,
		companyID, userID).Scan(&exists)
	return exists, err
}

// parseOptionalDate accepts YYYY-MM-DD or an empty value.
func parseOptionalDate(value *string) (*time.Time, error) {
	if value == nil {
		return nil, nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, nil
	}
	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

// ---------------------------------------------------------------------------
// Updates (company posts)
// ---------------------------------------------------------------------------

const updateColumns = `
	cu.id, cu.company_id, cu.author_id,
	TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
	cu.type, COALESCE(cu.title, ''), cu.body,
	COALESCE(cu.media, '[]'::jsonb), COALESCE(cu.links, '[]'::jsonb), cu.job_id,
	cu.status, cu.scheduled_at, cu.published_at,
	cu.views_count, cu.reactions_count, cu.comments_count,
	cu.created_at, cu.updated_at`

func scanUpdate(row rowScanner) (models.CompanyUpdate, error) {
	var u models.CompanyUpdate
	var updateType, status string
	err := row.Scan(&u.ID, &u.CompanyID, &u.AuthorID, &u.AuthorName,
		&updateType, &u.Title, &u.Body, &u.Media, &u.Links, &u.JobID,
		&status, &u.ScheduledAt, &u.PublishedAt,
		&u.ViewsCount, &u.ReactionsCount, &u.CommentsCount,
		&u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return models.CompanyUpdate{}, err
	}
	if parsed, ok := domain.ParseUpdateType(updateType); ok {
		u.Type = parsed
	}
	if parsed, ok := domain.ParseUpdateStatus(status); ok {
		u.Status = parsed
	}
	return u, nil
}

// ListUpdates returns a company's posts. Public callers see published posts
// only; callers holding update:create also see drafts, scheduled and archived
// items so the dashboard can manage them.
func (r *ManagementRepository) ListUpdates(ctx context.Context, companyID uuid.UUID, includeUnpublished bool, page, limit int) (*models.CompanyUpdatesPage, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	page, limit, offset := normalizePage(page, limit)

	clause := "cu.company_id = $1"
	if !includeUnpublished {
		clause += " AND cu.status = 'published' AND cu.published_at <= NOW()"
	}

	var total int
	if err := r.db.QueryRow(ctx,
		"SELECT COUNT(*) FROM company_updates cu WHERE "+clause, companyID).Scan(&total); err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, "SELECT "+updateColumns+`
		FROM company_updates cu
		LEFT JOIN users u ON u.id = cu.author_id
		WHERE `+clause+`
		ORDER BY COALESCE(cu.published_at, cu.scheduled_at, cu.created_at) DESC
		LIMIT $2 OFFSET $3`, companyID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.CompanyUpdate{}
	for rows.Next() {
		u, err := scanUpdate(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.CompanyUpdatesPage{
		Items: items, Total: total, Page: page, Limit: limit,
		TotalPages: totalPages(total, limit),
	}, nil
}

// GetUpdate loads one post belonging to a company.
func (r *ManagementRepository) GetUpdate(ctx context.Context, companyID, updateID uuid.UUID) (*models.CompanyUpdate, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	row := r.db.QueryRow(ctx, "SELECT "+updateColumns+`
		FROM company_updates cu
		LEFT JOIN users u ON u.id = cu.author_id
		WHERE cu.company_id = $1 AND cu.id = $2`, companyID, updateID)
	u, err := scanUpdate(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// CreateUpdate writes a post. published_at is set by the database at the moment
// of publication rather than taken from the payload, so a post cannot be
// backdated into someone else's timeline.
func (r *ManagementRepository) CreateUpdate(ctx context.Context, companyID, authorID uuid.UUID, p models.UpdatePayload) (uuid.UUID, error) {
	if r.db == nil {
		return uuid.Nil, ErrNoDatabase
	}
	updateType, ok := domain.ParseUpdateType(p.Type)
	if !ok {
		return uuid.Nil, domain.ErrValidation
	}
	status, ok := domain.ParseUpdateStatus(p.Status)
	if !ok {
		return uuid.Nil, domain.ErrValidation
	}
	if status == domain.UpdateScheduled && p.ScheduledAt == nil {
		return uuid.Nil, domain.ErrValidation
	}

	media := p.Media
	if media == nil {
		media = []string{}
	}
	links := p.Links
	if links == nil {
		links = []string{}
	}

	id := uuid.New()
	_, err := r.db.Exec(ctx, `
		INSERT INTO company_updates
			(id, company_id, author_id, type, title, body, media, links, job_id, status, scheduled_at, published_at)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6, $7, $8, $9, $10, $11,
			CASE WHEN $10 = 'published' THEN NOW() ELSE NULL END)`,
		id, companyID, authorID, string(updateType), strings.TrimSpace(p.Title),
		strings.TrimSpace(p.Body), media, links, p.JobID, string(status), p.ScheduledAt)
	if err != nil {
		return uuid.Nil, err
	}
	return id, nil
}

// EditUpdate rewrites a post. Publishing stamps published_at only the first
// time, so re-editing a live post does not move it back to the top of the feed.
func (r *ManagementRepository) EditUpdate(ctx context.Context, companyID, updateID uuid.UUID, p models.UpdatePayload) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	updateType, ok := domain.ParseUpdateType(p.Type)
	if !ok {
		return domain.ErrValidation
	}
	status, ok := domain.ParseUpdateStatus(p.Status)
	if !ok {
		return domain.ErrValidation
	}
	if status == domain.UpdateScheduled && p.ScheduledAt == nil {
		return domain.ErrValidation
	}

	media := p.Media
	if media == nil {
		media = []string{}
	}
	links := p.Links
	if links == nil {
		links = []string{}
	}

	tag, err := r.db.Exec(ctx, `
		UPDATE company_updates SET
			type = $3, title = NULLIF($4, ''), body = $5, media = $6, links = $7,
			job_id = $8, status = $9, scheduled_at = $10,
			published_at = CASE WHEN $9 = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END,
			archived_at  = CASE WHEN $9 = 'archived'  THEN COALESCE(archived_at, NOW())  ELSE NULL END,
			updated_at = NOW()
		WHERE company_id = $1 AND id = $2`,
		companyID, updateID, string(updateType), strings.TrimSpace(p.Title),
		strings.TrimSpace(p.Body), media, links, p.JobID, string(status), p.ScheduledAt)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// DeleteUpdate removes a post.
func (r *ManagementRepository) DeleteUpdate(ctx context.Context, companyID, updateID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	tag, err := r.db.Exec(ctx,
		`DELETE FROM company_updates WHERE company_id = $1 AND id = $2`, companyID, updateID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// PublishDueUpdates promotes scheduled posts whose time has come. It returns
// the posts it published so the caller can notify followers about them.
func (r *ManagementRepository) PublishDueUpdates(ctx context.Context) ([]models.CompanyUpdate, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	rows, err := r.db.Query(ctx, `
		UPDATE company_updates
		SET status = 'published', published_at = NOW(), updated_at = NOW()
		WHERE status = 'scheduled' AND scheduled_at <= NOW()
		RETURNING id, company_id, type, COALESCE(title, ''), body`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.CompanyUpdate{}
	for rows.Next() {
		var u models.CompanyUpdate
		var updateType string
		if err := rows.Scan(&u.ID, &u.CompanyID, &updateType, &u.Title, &u.Body); err != nil {
			return nil, err
		}
		if parsed, ok := domain.ParseUpdateType(updateType); ok {
			u.Type = parsed
		}
		u.Status = domain.UpdatePublished
		out = append(out, u)
	}
	return out, rows.Err()
}

// FollowersToNotify returns the users who asked to hear about a company, split
// by what they opted into. Someone who turned a category off is not returned,
// so the notification module never has to re-check the preference.
func (r *ManagementRepository) FollowersToNotify(ctx context.Context, companyID uuid.UUID, aboutJobs bool) ([]uuid.UUID, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	column := "notify_updates"
	if aboutJobs {
		column = "notify_jobs"
	}
	rows, err := r.db.Query(ctx,
		`SELECT user_id FROM company_followers WHERE company_id = $1 AND `+column+` = TRUE`,
		companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []uuid.UUID{}
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out = append(out, id)
	}
	return out, rows.Err()
}
