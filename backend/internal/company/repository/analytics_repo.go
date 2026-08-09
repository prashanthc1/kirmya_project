package repository

import (
	"context"
	"errors"
	"time"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// The ATS stages this module reads. They are the vocabulary job_applications
// already uses; the company module classifies them but does not own them.
var (
	shortlistedStages = []string{"Shortlisted", "Recruiter Review", "Interview", "Technical Round", "Final Interview", "Offer", "Hired"}
	interviewStages   = []string{"Interview", "Technical Round", "Final Interview", "Offer", "Hired"}
	offerStages       = []string{"Offer", "Hired"}
	hiredStages       = []string{"Hired"}
)

// Dashboard assembles the company dashboard summary from live rows.
//
// Every figure is a count of something that exists. A company with no jobs
// reports zero applications rather than a sample number.
func (r *ManagementRepository) Dashboard(ctx context.Context, companyID, viewerID uuid.UUID) (*models.CompanyDashboard, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}

	summary, err := r.companySummary(ctx, companyID, viewerID)
	if err != nil {
		return nil, err
	}

	d := &models.CompanyDashboard{
		Company:            *summary,
		VerificationStatus: summary.VerificationStatus,
		Followers:          summary.FollowersCount,
		RecruiterActivity:  []models.RecruiterActivityItem{},
	}

	err = r.db.QueryRow(ctx, `
		SELECT
			COALESCE(p.profile_completion, 0),
			(SELECT COUNT(*) FROM jobs j WHERE j.company_id = $1 AND j.status = 'active'),
			(SELECT COUNT(*) FROM job_applications a
			 JOIN jobs j ON j.id = a.job_id WHERE j.company_id = $1),
			(SELECT COUNT(DISTINCT a.candidate_id) FROM job_applications a
			 JOIN jobs j ON j.id = a.job_id WHERE j.company_id = $1),
			(SELECT COUNT(*) FROM job_applications a
			 JOIN jobs j ON j.id = a.job_id
			 WHERE j.company_id = $1 AND a.current_stage = ANY($2)),
			(SELECT COUNT(*) FROM job_applications a
			 JOIN jobs j ON j.id = a.job_id
			 WHERE j.company_id = $1 AND a.current_stage = ANY($3)),
			(SELECT COUNT(*) FROM company_profile_views v WHERE v.company_id = $1),
			(SELECT COALESCE(SUM(j.views_count), 0) FROM jobs j WHERE j.company_id = $1),
			(SELECT COUNT(*) FROM company_members m
			 WHERE m.company_id = $1 AND m.status = 'pending')
		FROM company_profiles p
		WHERE p.company_id = $1`,
		companyID, interviewStages, hiredStages,
	).Scan(&d.ProfileCompletion, &d.ActiveJobs, &d.Applications, &d.Candidates,
		&d.Interviews, &d.Hires, &d.ProfileViews, &d.JobViews, &d.PendingApprovals)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	activity, err := r.recruiterActivity(ctx, companyID, time.Time{}, time.Time{})
	if err != nil {
		return nil, err
	}
	d.RecruiterActivity = activity
	return d, nil
}

// companySummary loads the list-level view of one company.
func (r *ManagementRepository) companySummary(ctx context.Context, companyID, viewerID uuid.UUID) (*models.CompanySummary, error) {
	row := r.db.QueryRow(ctx, `
		SELECT `+companySummaryColumns+`, (f.user_id IS NOT NULL)
		FROM companies c
		JOIN company_profiles p ON p.company_id = c.id
		LEFT JOIN company_followers f ON f.company_id = c.id AND f.user_id = $2
		WHERE c.id = $1`, companyID, viewerID)
	s, err := scanSummary(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// Analytics aggregates a company's performance over a date range.
//
// Profile views come from the raw event table and job funnel figures from the
// ATS tables, so the numbers agree with what the rest of the product shows.
func (r *ManagementRepository) Analytics(ctx context.Context, companyID uuid.UUID, from, to time.Time) (*models.CompanyAnalytics, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}

	a := &models.CompanyAnalytics{
		From: from, To: to,
		CandidateSources:  map[string]int{},
		Series:            []models.AnalyticsPoint{},
		RecruiterActivity: []models.RecruiterActivityItem{},
	}
	err := r.db.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM company_profile_views v
			 WHERE v.company_id = $1 AND v.viewed_on BETWEEN $2 AND $3),
			(SELECT COUNT(DISTINCT COALESCE(v.viewer_id::text, v.visitor_hash)) FROM company_profile_views v
			 WHERE v.company_id = $1 AND v.viewed_on BETWEEN $2 AND $3
			   AND COALESCE(v.viewer_id::text, v.visitor_hash) IS NOT NULL),
			(SELECT COUNT(*) FROM company_followers f WHERE f.company_id = $1),
			(SELECT COUNT(*) FROM company_followers f
			 WHERE f.company_id = $1 AND f.created_at::date BETWEEN $2 AND $3),
			(SELECT COALESCE(SUM(j.views_count), 0) FROM jobs j WHERE j.company_id = $1),
			(SELECT COUNT(*) FROM job_applications ap
			 JOIN jobs j ON j.id = ap.job_id
			 WHERE j.company_id = $1 AND ap.applied_at::date BETWEEN $2 AND $3),
			(SELECT COUNT(*) FROM job_applications ap
			 JOIN jobs j ON j.id = ap.job_id
			 WHERE j.company_id = $1 AND ap.applied_at::date BETWEEN $2 AND $3
			   AND ap.current_stage = ANY($4)),
			(SELECT COUNT(*) FROM job_applications ap
			 JOIN jobs j ON j.id = ap.job_id
			 WHERE j.company_id = $1 AND ap.applied_at::date BETWEEN $2 AND $3
			   AND ap.current_stage = ANY($5)),
			(SELECT COUNT(*) FROM job_applications ap
			 JOIN jobs j ON j.id = ap.job_id
			 WHERE j.company_id = $1 AND ap.applied_at::date BETWEEN $2 AND $3
			   AND ap.current_stage = ANY($6))`,
		companyID, from, to, interviewStages, offerStages, hiredStages,
	).Scan(&a.ProfileViews, &a.UniqueVisitors, &a.Followers, &a.FollowerGrowth,
		&a.JobViews, &a.Applications, &a.Interviews, &a.Offers, &a.Hires)
	if err != nil {
		return nil, err
	}

	// The funnel is reported as a share of the applications it came from, so a
	// company with three applications and one hire reads 33.3% rather than 1.
	a.InterviewRate = percentage(a.Interviews, a.Applications)
	a.OfferRate = percentage(a.Offers, a.Applications)
	a.HireRate = percentage(a.Hires, a.Applications)
	a.ApplicationConversion = percentage(a.Applications, a.JobViews)

	sources, err := r.candidateSources(ctx, companyID, from, to)
	if err != nil {
		return nil, err
	}
	a.CandidateSources = sources

	series, err := r.analyticsSeries(ctx, companyID, from, to)
	if err != nil {
		return nil, err
	}
	a.Series = series

	activity, err := r.recruiterActivity(ctx, companyID, from, to)
	if err != nil {
		return nil, err
	}
	a.RecruiterActivity = activity
	return a, nil
}

// percentage returns part/whole as a percentage rounded to one decimal, and 0
// when there is nothing to divide by.
func percentage(part, whole int) float64 {
	if whole <= 0 {
		return 0
	}
	value := float64(part) / float64(whole) * 100
	return float64(int(value*10+0.5)) / 10
}

// candidateSources counts where applicants came from. Applications with no
// recorded source are grouped under "direct" rather than dropped, so the
// buckets always add up to the application total.
func (r *ManagementRepository) candidateSources(ctx context.Context, companyID uuid.UUID, from, to time.Time) (map[string]int, error) {
	rows, err := r.db.Query(ctx, `
		SELECT CASE WHEN ap.recruiter_id IS NOT NULL THEN 'recruiter_sourced' ELSE 'direct' END AS source,
		       COUNT(*)
		FROM job_applications ap
		JOIN jobs j ON j.id = ap.job_id
		WHERE j.company_id = $1 AND ap.applied_at::date BETWEEN $2 AND $3
		GROUP BY 1`, companyID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := map[string]int{}
	for rows.Next() {
		var source string
		var count int
		if err := rows.Scan(&source, &count); err != nil {
			return nil, err
		}
		out[source] = count
	}
	return out, rows.Err()
}

// analyticsSeries produces one point per day across the range. Days with no
// activity are present with zeros so a chart does not silently compress gaps.
func (r *ManagementRepository) analyticsSeries(ctx context.Context, companyID uuid.UUID, from, to time.Time) ([]models.AnalyticsPoint, error) {
	rows, err := r.db.Query(ctx, `
		SELECT d::date AS day,
			(SELECT COUNT(*) FROM company_profile_views v
			 WHERE v.company_id = $1 AND v.viewed_on = d::date),
			(SELECT COUNT(DISTINCT COALESCE(v.viewer_id::text, v.visitor_hash)) FROM company_profile_views v
			 WHERE v.company_id = $1 AND v.viewed_on = d::date
			   AND COALESCE(v.viewer_id::text, v.visitor_hash) IS NOT NULL),
			(SELECT COALESCE(SUM(ja.views), 0) FROM company_job_analytics ja
			 WHERE ja.company_id = $1 AND ja.metric_date = d::date),
			(SELECT COUNT(*) FROM job_applications ap
			 JOIN jobs j ON j.id = ap.job_id
			 WHERE j.company_id = $1 AND ap.applied_at::date = d::date),
			(SELECT COUNT(*) FROM company_followers f
			 WHERE f.company_id = $1 AND f.created_at::date <= d::date)
		FROM generate_series($2::date, $3::date, INTERVAL '1 day') d
		ORDER BY day ASC`, companyID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.AnalyticsPoint{}
	for rows.Next() {
		var day time.Time
		var p models.AnalyticsPoint
		if err := rows.Scan(&day, &p.ProfileViews, &p.UniqueVisitors, &p.JobViews,
			&p.Applications, &p.Followers); err != nil {
			return nil, err
		}
		p.Date = day.Format("2006-01-02")
		out = append(out, p)
	}
	return out, rows.Err()
}

// recruiterActivity summarises what each recruiter on the company did. A zero
// range means "all time", which is what the dashboard wants.
func (r *ManagementRepository) recruiterActivity(ctx context.Context, companyID uuid.UUID, from, to time.Time) ([]models.RecruiterActivityItem, error) {
	bounded := !from.IsZero() && !to.IsZero()
	if !bounded {
		from = time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)
		to = nowUTC().AddDate(1, 0, 0)
	}

	rows, err := r.db.Query(ctx, `
		SELECT m.user_id,
		       TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
		       (SELECT COUNT(*) FROM jobs j
		        WHERE j.company_id = $1 AND j.recruiter_id = m.user_id
		          AND j.created_at::date BETWEEN $2 AND $3),
		       (SELECT COUNT(*) FROM job_applications ap
		        JOIN jobs j ON j.id = ap.job_id
		        WHERE j.company_id = $1 AND ap.recruiter_id = m.user_id
		          AND ap.updated_at::date BETWEEN $2 AND $3),
		       (SELECT COUNT(*) FROM job_applications ap
		        JOIN jobs j ON j.id = ap.job_id
		        WHERE j.company_id = $1 AND ap.recruiter_id = m.user_id
		          AND ap.current_stage = ANY($4)
		          AND ap.updated_at::date BETWEEN $2 AND $3),
		       (SELECT COUNT(*) FROM job_applications ap
		        JOIN jobs j ON j.id = ap.job_id
		        WHERE j.company_id = $1 AND ap.recruiter_id = m.user_id
		          AND ap.current_stage = ANY($5)
		          AND ap.updated_at::date BETWEEN $2 AND $3)
		FROM company_members m
		LEFT JOIN users u ON u.id = m.user_id
		WHERE m.company_id = $1 AND m.status = 'approved'
		  AND m.role IN ('recruiter', 'recruiter_admin', 'hiring_manager')
		ORDER BY 3 DESC, 2 ASC
		LIMIT 50`, companyID, from, to, interviewStages, hiredStages)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.RecruiterActivityItem{}
	for rows.Next() {
		var item models.RecruiterActivityItem
		if err := rows.Scan(&item.UserID, &item.Name, &item.JobsPosted,
			&item.ApplicationsRead, &item.Interviews, &item.Hires); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

// JobAnalytics returns the funnel for one job. The caller must already have
// established that the job belongs to the company.
func (r *ManagementRepository) JobAnalytics(ctx context.Context, companyID, jobID uuid.UUID) (*models.JobAnalytics, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}

	a := &models.JobAnalytics{JobID: jobID}
	var totalReviewMinutes, totalHireMinutes, reviewedApplications int64

	err := r.db.QueryRow(ctx, `
		SELECT j.title, j.views_count, COALESCE(j.unique_views_count, 0),
			(SELECT COUNT(*) FROM job_applications ap WHERE ap.job_id = j.id),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.current_stage <> 'Rejected'),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.current_stage = ANY($3)),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.current_stage = ANY($4)),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.current_stage = ANY($5)),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.current_stage = ANY($6)),
			-- Time to first review: the gap between applying and the first stage move.
			(SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (h.first_move - ap.applied_at)) / 60), 0)::bigint
			 FROM job_applications ap
			 JOIN (SELECT application_id, MIN(moved_at) AS first_move
			       FROM application_stage_history GROUP BY application_id) h
			   ON h.application_id = ap.id
			 WHERE ap.job_id = j.id),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id
			   AND EXISTS (SELECT 1 FROM application_stage_history h WHERE h.application_id = ap.id)),
			-- Time to hire: applied until the move into a hired stage.
			(SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (h.hired_at - ap.applied_at)) / 60), 0)::bigint
			 FROM job_applications ap
			 JOIN (SELECT application_id, MIN(moved_at) AS hired_at
			       FROM application_stage_history WHERE to_stage = ANY($6)
			       GROUP BY application_id) h
			   ON h.application_id = ap.id
			 WHERE ap.job_id = j.id)
		FROM jobs j
		WHERE j.id = $1 AND j.company_id = $2`,
		jobID, companyID, shortlistedStages, interviewStages, offerStages, hiredStages,
	).Scan(&a.Title, &a.Views, &a.UniqueViews, &a.Applications, &a.QualifiedApplications,
		&a.Shortlisted, &a.Interviews, &a.Offers, &a.Hires,
		&totalReviewMinutes, &reviewedApplications, &totalHireMinutes)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	a.ConversionRate = percentage(a.Applications, a.Views)
	if reviewedApplications > 0 {
		a.AvgTimeToReviewHours = roundTo1(float64(totalReviewMinutes) / float64(reviewedApplications) / 60)
	}
	if a.Hires > 0 {
		a.AvgTimeToHireHours = roundTo1(float64(totalHireMinutes) / float64(a.Hires) / 60)
	}
	return a, nil
}

func roundTo1(v float64) float64 {
	return float64(int(v*10+0.5)) / 10
}

// RollUpAnalytics writes one day's figures into company_analytics. Running it
// twice for the same day overwrites rather than doubles, so a retried
// background job cannot inflate the numbers.
func (r *ManagementRepository) RollUpAnalytics(ctx context.Context, day time.Time) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO company_analytics
			(id, company_id, metric_date, profile_views, unique_visitors, followers,
			 follower_growth, job_views, applications, interviews, offers, hires)
		SELECT gen_random_uuid(), c.id, $1::date,
			(SELECT COUNT(*) FROM company_profile_views v
			 WHERE v.company_id = c.id AND v.viewed_on = $1::date),
			(SELECT COUNT(DISTINCT COALESCE(v.viewer_id::text, v.visitor_hash))
			 FROM company_profile_views v
			 WHERE v.company_id = c.id AND v.viewed_on = $1::date
			   AND COALESCE(v.viewer_id::text, v.visitor_hash) IS NOT NULL),
			(SELECT COUNT(*) FROM company_followers f
			 WHERE f.company_id = c.id AND f.created_at::date <= $1::date),
			(SELECT COUNT(*) FROM company_followers f
			 WHERE f.company_id = c.id AND f.created_at::date = $1::date),
			(SELECT COALESCE(SUM(j.views_count), 0) FROM jobs j WHERE j.company_id = c.id),
			(SELECT COUNT(*) FROM job_applications ap JOIN jobs j ON j.id = ap.job_id
			 WHERE j.company_id = c.id AND ap.applied_at::date = $1::date),
			(SELECT COUNT(*) FROM job_applications ap JOIN jobs j ON j.id = ap.job_id
			 WHERE j.company_id = c.id AND ap.updated_at::date = $1::date
			   AND ap.current_stage = ANY($2)),
			(SELECT COUNT(*) FROM job_applications ap JOIN jobs j ON j.id = ap.job_id
			 WHERE j.company_id = c.id AND ap.updated_at::date = $1::date
			   AND ap.current_stage = ANY($3)),
			(SELECT COUNT(*) FROM job_applications ap JOIN jobs j ON j.id = ap.job_id
			 WHERE j.company_id = c.id AND ap.updated_at::date = $1::date
			   AND ap.current_stage = ANY($4))
		FROM companies c
		WHERE c.status = 'active'
		ON CONFLICT (company_id, metric_date) DO UPDATE SET
			profile_views   = EXCLUDED.profile_views,
			unique_visitors = EXCLUDED.unique_visitors,
			followers       = EXCLUDED.followers,
			follower_growth = EXCLUDED.follower_growth,
			job_views       = EXCLUDED.job_views,
			applications    = EXCLUDED.applications,
			interviews      = EXCLUDED.interviews,
			offers          = EXCLUDED.offers,
			hires           = EXCLUDED.hires,
			updated_at      = NOW()`,
		day, interviewStages, offerStages, hiredStages)
	return err
}

// RollUpJobAnalytics writes one day's per-job figures.
func (r *ManagementRepository) RollUpJobAnalytics(ctx context.Context, day time.Time) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO company_job_analytics
			(id, company_id, job_id, metric_date, views, unique_views, applications,
			 qualified_applications, shortlisted, interviews, offers, hires)
		SELECT gen_random_uuid(), j.company_id, j.id, $1::date,
			j.views_count, COALESCE(j.unique_views_count, 0),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.applied_at::date = $1::date),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.applied_at::date = $1::date
			   AND ap.current_stage <> 'Rejected'),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.current_stage = ANY($2)),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.current_stage = ANY($3)),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.current_stage = ANY($4)),
			(SELECT COUNT(*) FROM job_applications ap
			 WHERE ap.job_id = j.id AND ap.current_stage = ANY($5))
		FROM jobs j
		WHERE j.company_id IS NOT NULL
		ON CONFLICT (job_id, metric_date) DO UPDATE SET
			views                  = EXCLUDED.views,
			unique_views           = EXCLUDED.unique_views,
			applications           = EXCLUDED.applications,
			qualified_applications = EXCLUDED.qualified_applications,
			shortlisted            = EXCLUDED.shortlisted,
			interviews             = EXCLUDED.interviews,
			offers                 = EXCLUDED.offers,
			hires                  = EXCLUDED.hires,
			updated_at             = NOW()`,
		day, shortlistedStages, interviewStages, offerStages, hiredStages)
	return err
}
