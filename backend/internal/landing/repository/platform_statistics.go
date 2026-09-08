package repository

import (
	"context"
	"fmt"

	"kirmya/internal/landing/domain"
)

// Platform statistics are counted from the tables that hold the real thing,
// rather than read from a content table of hand-typed strings.
//
// The landing page used to render whatever `landing_statistics` happened to
// contain, and to fall back to a seeded set — "18,450+ Verified Careers
// Matched", "850+ Vetted Enterprise Employers" — whenever that table was empty
// or the query failed. On a fresh deployment that is always, so the first thing
// every visitor saw was four invented numbers. Counting real rows means the
// figure is either true or absent.
//
// The open-jobs predicate is deliberately identical to the one the public board
// filters on (JobRepository.SearchJobs): a job counted here must be a job a
// visitor can actually find. `expires_at` is checked rather than trusted to a
// sweep, so a posting past its expiry is not counted just because nothing has
// run yet.
const (
	openJobsSQL = `
		SELECT COUNT(*) FROM jobs
		WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())`

	hiringCompaniesSQL = `
		SELECT COUNT(DISTINCT company_id) FROM jobs
		WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
		  AND company_id IS NOT NULL`

	membersSQL = `SELECT COUNT(*) FROM users WHERE status = 'active'`

	applicationsSQL = `SELECT COUNT(*) FROM job_applications`
)

// GetPlatformStatistics counts the live platform figures.
//
// A failure is returned rather than swallowed. The previous behaviour — answer
// with the seeded numbers on any error — meant a database problem was rendered
// to visitors as confident marketing claims, which is the worst of both: the
// outage is invisible and the numbers are false.
func (r *postgresLandingRepository) GetPlatformStatistics(ctx context.Context) (*domain.PlatformStatistics, error) {
	if r.pool == nil {
		// No database: there is nothing true to report, and inventing something
		// is what this replaced. The caller renders an honest empty state.
		return nil, domain.ErrStatisticsUnavailable
	}

	stats := &domain.PlatformStatistics{}

	for _, q := range []struct {
		sql  string
		into *int64
		name string
	}{
		{openJobsSQL, &stats.OpenJobs, "open jobs"},
		{hiringCompaniesSQL, &stats.HiringCompanies, "hiring companies"},
		{membersSQL, &stats.Members, "members"},
		{applicationsSQL, &stats.ApplicationsSubmitted, "applications"},
	} {
		if err := r.pool.QueryRow(ctx, q.sql).Scan(q.into); err != nil {
			return nil, fmt.Errorf("count %s: %w", q.name, err)
		}
	}

	return stats, nil
}
