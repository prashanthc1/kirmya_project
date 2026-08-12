package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"kirmya/internal/jobs/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNoDatabase = errors.New("jobs repository: no database connection")

const maxPageSize = 100

// JobRepository reads the platform-wide job listing. It is backed by the real
// `jobs` table (migration 0043b), not fixtures — nothing here is ephemeral.
type JobRepository struct {
	db *pgxpool.Pool
}

func NewJobRepository(db *pgxpool.Pool) *JobRepository {
	return &JobRepository{db: db}
}

func normalizePage(page, limit int) (int, int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > maxPageSize {
		limit = maxPageSize
	}
	return page, limit, (page - 1) * limit
}

// SearchJobs runs the public job listing. Only 'active' postings are ever
// returned, so drafts, paused, closed and expired rows stay private regardless
// of the filters supplied. Expired-by-date rows are excluded too: `status` is
// only corrected by a sweep, so a posting past `expires_at` must not surface
// just because nothing has run yet.
func (r *JobRepository) SearchJobs(ctx context.Context, q models.JobSearchQuery) (*models.JobListPage, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	page, limit, offset := normalizePage(q.Page, q.Limit)

	where := []string{
		"j.status = 'active'",
		"(j.expires_at IS NULL OR j.expires_at > NOW())",
	}
	var args []any

	arg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if term := strings.TrimSpace(q.Query); term != "" {
		p := arg("%" + strings.ToLower(term) + "%")
		where = append(where, fmt.Sprintf(`(
			lower(j.title) LIKE %[1]s
			OR lower(COALESCE(j.description, '')) LIKE %[1]s
			OR lower(COALESCE(j.department, '')) LIKE %[1]s
			OR lower(COALESCE(c.name, '')) LIKE %[1]s
			OR EXISTS (
			    SELECT 1 FROM jsonb_array_elements_text(COALESCE(j.skills, '[]'::jsonb)) sk
			    WHERE lower(sk) LIKE %[1]s
			))`, p))
	}
	if v := strings.TrimSpace(q.Location); v != "" {
		where = append(where, "lower(COALESCE(j.location, '')) LIKE "+arg("%"+strings.ToLower(v)+"%"))
	}
	if v := strings.TrimSpace(q.WorkMode); v != "" {
		where = append(where, "lower(COALESCE(j.work_mode, '')) = lower("+arg(v)+")")
	}
	if v := strings.TrimSpace(q.EmploymentType); v != "" {
		where = append(where, "lower(COALESCE(j.employment_type, '')) = lower("+arg(v)+")")
	}
	if v := strings.TrimSpace(q.ExperienceLevel); v != "" {
		where = append(where, "lower(COALESCE(j.experience_level, '')) = lower("+arg(v)+")")
	}

	clause := strings.Join(where, " AND ")

	// Featured first is a deliberate default for the public board. COALESCE keeps
	// postings with no published_at from sorting above everything else on NULL.
	order := "j.is_featured DESC, COALESCE(j.published_at, j.created_at) DESC"
	switch strings.ToLower(strings.TrimSpace(q.Sort)) {
	case "newest":
		order = "COALESCE(j.published_at, j.created_at) DESC"
	case "title":
		order = "j.title ASC"
	case "salary":
		order = "j.salary_max DESC NULLS LAST, j.salary_min DESC NULLS LAST"
	}

	from := `
		FROM jobs j
		LEFT JOIN companies c ON c.id = j.company_id AND c.status = 'active'
		LEFT JOIN company_profiles p ON p.company_id = c.id`

	var total int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*)`+from+` WHERE `+clause, args...).Scan(&total); err != nil {
		return nil, err
	}

	limitArg := arg(limit)
	offsetArg := arg(offset)

	rows, err := r.db.Query(ctx, `
		SELECT
			j.id, j.title, j.company_id,
			COALESCE(c.name, ''), COALESCE(c.handle, ''), COALESCE(p.logo_url, ''),
			COALESCE(j.location, ''), COALESCE(j.work_mode, ''),
			COALESCE(j.employment_type, ''), COALESCE(j.experience_level, ''),
			COALESCE(j.department, ''),
			COALESCE(j.salary_range, ''), j.salary_min, j.salary_max,
			COALESCE(j.salary_currency, ''),
			-- Unrolled to a text[] in SQL so pgx scans straight into []string,
			-- rather than decoding jsonb on the Go side.
			COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(j.skills, '[]'::jsonb))), '{}'),
			j.is_featured,
			j.published_at, j.created_at`+from+`
		WHERE `+clause+`
		ORDER BY `+order+`
		LIMIT `+limitArg+` OFFSET `+offsetArg, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]models.JobSummary, 0, limit)
	for rows.Next() {
		var j models.JobSummary
		if err := rows.Scan(
			&j.ID, &j.Title, &j.CompanyID,
			&j.CompanyName, &j.CompanyHandle, &j.CompanyLogo,
			&j.Location, &j.WorkMode,
			&j.EmploymentType, &j.ExperienceLevel,
			&j.Department,
			&j.SalaryRange, &j.SalaryMin, &j.SalaryMax,
			&j.SalaryCurrency,
			&j.Skills, &j.IsFeatured,
			&j.PublishedAt, &j.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, j)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	totalPages := 0
	if total > 0 {
		totalPages = (total + limit - 1) / limit
	}

	return &models.JobListPage{
		Data:       out,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}
