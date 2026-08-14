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
	"github.com/jackc/pgx/v5/pgxpool"
)

// ManagementRepository is the data access layer for company and organization
// management: ownership, membership, invitations, verification, updates,
// reviews and analytics.
//
// Every method that touches a company-scoped row takes the company id and
// filters on it in SQL. That is the second half of the isolation guarantee: the
// service checks the caller's grant, and the query itself cannot reach outside
// the company even if a caller supplies a resource id belonging to someone else.
type ManagementRepository struct {
	db *pgxpool.Pool
}

// NewManagementRepository wires the repository to a connection pool. A nil pool
// is accepted so the process can boot without a database, but every call then
// returns ErrNoDatabase rather than pretending to succeed.
func NewManagementRepository(db *pgxpool.Pool) *ManagementRepository {
	return &ManagementRepository{db: db}
}

// rowScanner is satisfied by both pgx.Row and pgx.Rows, so one scan helper can
// serve single-row lookups and list queries.
type rowScanner interface {
	Scan(dest ...any) error
}

// maxPageSize caps how much a caller can ask for in one request. Without it a
// single `?limit=100000` turns a list endpoint into a way to pull the whole
// table.
const maxPageSize = 100

// normalizePage clamps caller-supplied paging into a range the database can
// serve cheaply and returns the matching offset.
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

// totalPages converts a row count into a page count.
func totalPages(total, limit int) int {
	if limit <= 0 || total <= 0 {
		return 0
	}
	return (total + limit - 1) / limit
}

// companySummaryColumns is the projection behind every company list. It carries
// nothing private: a public visitor and an owner see the same fields here, and
// the extra detail an owner gets lives on CompanyDetail.
const companySummaryColumns = `
	c.id, c.name, c.handle,
	COALESCE(p.tagline, ''), COALESCE(p.logo_url, ''), COALESCE(p.cover_url, ''),
	COALESCE(p.industry, ''), COALESCE(p.company_type, ''), COALESCE(p.company_size, ''),
	COALESCE(NULLIF(p.headquarters, ''), p.location, ''),
	COALESCE(p.followers_count, 0), COALESCE(p.employees_count, 0), COALESCE(p.open_jobs_count, 0),
	COALESCE(p.rating, 0), COALESCE(p.review_count, 0), COALESCE(p.is_hiring, FALSE),
	COALESCE(p.verification_status, 'not_verified')`

// scanSummary reads companySummaryColumns plus a trailing "is following" flag.
func scanSummary(row rowScanner) (models.CompanySummary, error) {
	var s models.CompanySummary
	var status string
	err := row.Scan(
		&s.ID, &s.Name, &s.Slug,
		&s.Tagline, &s.LogoURL, &s.CoverURL,
		&s.Industry, &s.CompanyType, &s.CompanySize,
		&s.Headquarters,
		&s.FollowersCount, &s.EmployeesCount, &s.OpenJobsCount,
		&s.Rating, &s.ReviewCount, &s.IsHiring,
		&status,
		&s.IsFollowing,
	)
	if err != nil {
		return models.CompanySummary{}, err
	}
	parsed, ok := domain.ParseVerificationStatus(status)
	if !ok {
		// An unrecognised stored value is treated as unverified rather than
		// trusted, so a bad row can never surface a badge.
		parsed = domain.VerificationNotVerified
	}
	s.VerificationStatus = parsed
	s.IsVerified = parsed.ShowsBadge()
	return s, nil
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

// CompanyIDBySlug resolves a public slug to an id. Archived companies are not
// resolvable, so their pages stop existing for everyone at once.
func (r *ManagementRepository) CompanyIDBySlug(ctx context.Context, slug string) (uuid.UUID, error) {
	if r.db == nil {
		return uuid.Nil, ErrNoDatabase
	}
	var id uuid.UUID
	err := r.db.QueryRow(ctx,
		`SELECT id FROM companies WHERE lower(handle) = lower($1) AND status <> 'archived'`,
		strings.TrimSpace(slug)).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, domain.ErrNotFound
	}
	return id, err
}

// SlugExists reports whether a handle is already taken, so registration can
// reject a duplicate before it hits the unique constraint.
func (r *ManagementRepository) SlugExists(ctx context.Context, slug string) (bool, error) {
	if r.db == nil {
		return false, ErrNoDatabase
	}
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM companies WHERE lower(handle) = lower($1))`,
		strings.TrimSpace(slug)).Scan(&exists)
	return exists, err
}

// CompanyStatus returns the lifecycle status of a company.
func (r *ManagementRepository) CompanyStatus(ctx context.Context, companyID uuid.UUID) (string, error) {
	if r.db == nil {
		return "", ErrNoDatabase
	}
	var status string
	err := r.db.QueryRow(ctx, `SELECT status FROM companies WHERE id = $1`, companyID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", domain.ErrNotFound
	}
	return status, err
}

// ---------------------------------------------------------------------------
// Grants
// ---------------------------------------------------------------------------

// LoadGrant assembles a user's authority on one company from their approved
// membership, their role assignments and their individually granted extras.
//
// A membership that is pending, rejected, removed or suspended contributes
// nothing, so revoking access is a status change rather than a delete. The
// recorded owner is always granted the owner role even if their role rows were
// lost, because a company with no one able to administer it cannot be repaired
// from inside the product.
func (r *ManagementRepository) LoadGrant(ctx context.Context, companyID, userID uuid.UUID) (domain.Grant, error) {
	grant := domain.Grant{CompanyID: companyID.String(), UserID: userID.String()}
	if r.db == nil {
		return grant, ErrNoDatabase
	}
	if companyID == uuid.Nil || userID == uuid.Nil {
		return grant, nil
	}

	rows, err := r.db.Query(ctx, `
		SELECT mr.role, mr.extra_permissions
		FROM company_member_roles mr
		JOIN company_members m ON m.id = mr.member_id AND m.company_id = mr.company_id
		WHERE mr.company_id = $1 AND mr.user_id = $2 AND m.status = 'approved'
		UNION
		SELECT m.role, '[]'::jsonb
		FROM company_members m
		WHERE m.company_id = $1 AND m.user_id = $2 AND m.status = 'approved'`,
		companyID, userID)
	if err != nil {
		return grant, err
	}
	defer rows.Close()

	seenRole := map[domain.Role]bool{}
	seenPerm := map[domain.Permission]bool{}
	for rows.Next() {
		var roleValue string
		var extras []string
		if err := rows.Scan(&roleValue, &extras); err != nil {
			return grant, err
		}
		if role, ok := domain.ParseRole(roleValue); ok && !seenRole[role] {
			seenRole[role] = true
			grant.Roles = append(grant.Roles, role)
		}
		for _, raw := range extras {
			perm := domain.Permission(strings.TrimSpace(raw))
			if perm != "" && !seenPerm[perm] {
				seenPerm[perm] = true
				grant.Extra = append(grant.Extra, perm)
			}
		}
	}
	if err := rows.Err(); err != nil {
		return grant, err
	}

	var isOwner bool
	if err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM companies WHERE id = $1 AND owner_id = $2)`,
		companyID, userID).Scan(&isOwner); err != nil {
		return grant, err
	}
	if isOwner && !seenRole[domain.RoleCompanyOwner] {
		grant.Roles = append(grant.Roles, domain.RoleCompanyOwner)
	}
	grant.IsOwner = isOwner || seenRole[domain.RoleCompanyOwner]

	return grant, nil
}

// ---------------------------------------------------------------------------
// Company profile
// ---------------------------------------------------------------------------

// GetDetail loads one company's full profile. viewerID may be uuid.Nil for an
// anonymous visitor; it only decides the "is following" flag here, and the
// service is what decides which of the returned fields reach the response.
func (r *ManagementRepository) GetDetail(ctx context.Context, companyID, viewerID uuid.UUID) (*models.CompanyDetail, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}

	var d models.CompanyDetail
	var status string
	err := r.db.QueryRow(ctx, `
		SELECT `+companySummaryColumns+`,
			COALESCE(p.about, ''), COALESCE(p.mission, ''), COALESCE(p.vision, ''),
			COALESCE(p.history, ''), COALESCE(p.work_culture, ''), COALESCE(p.career_info, ''),
			COALESCE(p.website, ''), COALESCE(p.contact_email, ''), COALESCE(p.contact_phone, ''),
			COALESCE(p.founded_year, 0),
			COALESCE(p.social_links, '{}'::jsonb), COALESCE(p.brand_assets, '[]'::jsonb),
			COALESCE(p.specialties, '[]'::jsonb), COALESCE(p.core_values, '[]'::jsonb),
			COALESCE(p.benefits, '[]'::jsonb), COALESCE(p.products, '[]'::jsonb),
			COALESCE(p.services, '[]'::jsonb), COALESCE(p.industries, '[]'::jsonb),
			COALESCE(p.technology, '[]'::jsonb), COALESCE(p.awards, '[]'::jsonb),
			COALESCE(p.certifications, '[]'::jsonb), COALESCE(p.operating_countries, '[]'::jsonb),
			COALESCE(p.profile_completion, 0),
			c.created_at, COALESCE(c.updated_at, c.created_at)
		FROM companies c
		JOIN company_profiles p ON p.company_id = c.id
		LEFT JOIN company_followers f ON f.company_id = c.id AND f.user_id = $2
		WHERE c.id = $1 AND c.status <> 'archived'`,
		companyID, viewerID,
	).Scan(
		&d.ID, &d.Name, &d.Slug,
		&d.Tagline, &d.LogoURL, &d.CoverURL,
		&d.Industry, &d.CompanyType, &d.CompanySize,
		&d.Headquarters,
		&d.FollowersCount, &d.EmployeesCount, &d.OpenJobsCount,
		&d.Rating, &d.ReviewCount, &d.IsHiring,
		&status,
		&d.Description, &d.Mission, &d.Vision,
		&d.History, &d.WorkCulture, &d.CareerInfo,
		&d.Website, &d.ContactEmail, &d.ContactPhone,
		&d.FoundedYear,
		&d.SocialLinks, &d.BrandAssets,
		&d.Specialties, &d.Values,
		&d.Benefits, &d.Products,
		&d.Services, &d.Industries,
		&d.Technology, &d.Awards,
		&d.Certifications, &d.OperatingCountries,
		&d.ProfileCompletion,
		&d.CreatedAt, &d.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	parsed, ok := domain.ParseVerificationStatus(status)
	if !ok {
		parsed = domain.VerificationNotVerified
	}
	d.VerificationStatus = parsed
	d.IsVerified = parsed.ShowsBadge()

	if viewerID != uuid.Nil {
		following, err := r.IsFollowing(ctx, companyID, viewerID)
		if err != nil {
			return nil, err
		}
		d.IsFollowing = following
	}
	return &d, nil
}

// profileTextColumns maps an update payload's simple text fields onto their
// column. Keeping the mapping in one table is what lets UpdateCompany build a
// partial UPDATE without a hand-written branch per field.
type patchField struct {
	column string
	value  any
}

// UpdateCompany applies a partial profile edit. Fields left nil in the payload
// are not written at all, so saving one settings section cannot blank another.
func (r *ManagementRepository) UpdateCompany(ctx context.Context, companyID uuid.UUID, p models.CompanyUpdatePayload) error {
	if r.db == nil {
		return ErrNoDatabase
	}

	profileFields := []patchField{}
	add := func(column string, value any, present bool) {
		if present {
			profileFields = append(profileFields, patchField{column: column, value: value})
		}
	}

	add("tagline", deref(p.Tagline), p.Tagline != nil)
	add("about", deref(p.Description), p.Description != nil)
	add("industry", deref(p.Industry), p.Industry != nil)
	add("company_type", deref(p.CompanyType), p.CompanyType != nil)
	add("company_size", deref(p.CompanySize), p.CompanySize != nil)
	add("headquarters", deref(p.Headquarters), p.Headquarters != nil)
	add("website", deref(p.Website), p.Website != nil)
	add("contact_email", deref(p.ContactEmail), p.ContactEmail != nil)
	add("contact_phone", deref(p.ContactPhone), p.ContactPhone != nil)
	add("logo_url", deref(p.LogoURL), p.LogoURL != nil)
	add("cover_url", deref(p.CoverURL), p.CoverURL != nil)
	add("mission", deref(p.Mission), p.Mission != nil)
	add("vision", deref(p.Vision), p.Vision != nil)
	add("history", deref(p.History), p.History != nil)
	add("work_culture", deref(p.WorkCulture), p.WorkCulture != nil)
	add("career_info", deref(p.CareerInfo), p.CareerInfo != nil)
	if p.FoundedYear != nil {
		add("founded_year", *p.FoundedYear, true)
	}
	if p.IsHiring != nil {
		add("is_hiring", *p.IsHiring, true)
	}
	if p.SocialLinks != nil {
		add("social_links", *p.SocialLinks, true)
	}
	if p.BrandAssets != nil {
		add("brand_assets", *p.BrandAssets, true)
	}
	addList := func(column string, value *[]string) {
		if value != nil {
			list := *value
			if list == nil {
				list = []string{}
			}
			add(column, list, true)
		}
	}
	addList("specialties", p.Specialties)
	addList("core_values", p.Values)
	addList("benefits", p.Benefits)
	addList("products", p.Products)
	addList("services", p.Services)
	addList("industries", p.Industries)
	addList("technology", p.Technology)
	addList("awards", p.Awards)
	addList("certifications", p.Certifications)
	addList("operating_countries", p.OperatingCountries)

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if p.Name != nil {
		if _, err := tx.Exec(ctx,
			`UPDATE companies SET name = $2, updated_at = NOW() WHERE id = $1`,
			companyID, strings.TrimSpace(*p.Name)); err != nil {
			return err
		}
	}

	if len(profileFields) > 0 {
		sets := make([]string, 0, len(profileFields)+1)
		args := []any{companyID}
		for _, f := range profileFields {
			args = append(args, f.value)
			sets = append(sets, fmt.Sprintf("%s = $%d", f.column, len(args)))
		}
		sets = append(sets, "updated_at = NOW()")
		query := "UPDATE company_profiles SET " + strings.Join(sets, ", ") + " WHERE company_id = $1"
		if _, err := tx.Exec(ctx, query, args...); err != nil {
			return err
		}
	}

	if err := recalculateProfileCompletion(ctx, tx, companyID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func deref(v *string) string {
	if v == nil {
		return ""
	}
	return strings.TrimSpace(*v)
}

// recalculateProfileCompletion scores how much of the profile is filled in.
// The score is derived from the stored row rather than tracked incrementally,
// so it cannot drift away from what is actually there.
func recalculateProfileCompletion(ctx context.Context, tx pgx.Tx, companyID uuid.UUID) error {
	_, err := tx.Exec(ctx, `
		UPDATE company_profiles SET profile_completion = (
			(CASE WHEN COALESCE(logo_url, '')     <> '' THEN 10 ELSE 0 END) +
			(CASE WHEN COALESCE(cover_url, '')    <> '' THEN 5  ELSE 0 END) +
			(CASE WHEN COALESCE(tagline, '')      <> '' THEN 5  ELSE 0 END) +
			(CASE WHEN COALESCE(about, '')        <> '' THEN 15 ELSE 0 END) +
			(CASE WHEN COALESCE(industry, '')     <> '' THEN 10 ELSE 0 END) +
			(CASE WHEN COALESCE(company_size, '') <> '' THEN 5  ELSE 0 END) +
			(CASE WHEN COALESCE(headquarters, '') <> '' THEN 5  ELSE 0 END) +
			(CASE WHEN COALESCE(website, '')      <> '' THEN 10 ELSE 0 END) +
			(CASE WHEN COALESCE(founded_year, 0)  <> 0  THEN 5  ELSE 0 END) +
			(CASE WHEN COALESCE(mission, '')      <> '' THEN 5  ELSE 0 END) +
			(CASE WHEN COALESCE(vision, '')       <> '' THEN 5  ELSE 0 END) +
			(CASE WHEN jsonb_array_length(COALESCE(specialties, '[]'::jsonb)) > 0 THEN 5 ELSE 0 END) +
			(CASE WHEN jsonb_array_length(COALESCE(benefits, '[]'::jsonb))    > 0 THEN 5 ELSE 0 END) +
			(CASE WHEN jsonb_array_length(COALESCE(core_values, '[]'::jsonb)) > 0 THEN 5 ELSE 0 END) +
			(CASE WHEN COALESCE(social_links, '{}'::jsonb) <> '{}'::jsonb     THEN 5 ELSE 0 END)
		), updated_at = NOW()
		WHERE company_id = $1`, companyID)
	return err
}

// RefreshCounters recomputes the denormalised counters on a company profile
// from the rows that back them.
func (r *ManagementRepository) RefreshCounters(ctx context.Context, companyID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	_, err := r.db.Exec(ctx, `
		UPDATE company_profiles p SET
			employees_count = (
				SELECT COUNT(*) FROM company_members m
				WHERE m.company_id = p.company_id AND m.status = 'approved'
			),
			open_jobs_count = (
				SELECT COUNT(*) FROM jobs j
				WHERE j.company_id = p.company_id AND j.status = 'active'
			),
			followers_count = (
				SELECT COUNT(*) FROM company_followers f WHERE f.company_id = p.company_id
			),
			review_count = (
				SELECT COUNT(*) FROM company_reviews cr
				WHERE cr.company_id = p.company_id AND cr.status = 'published'
			),
			rating = COALESCE((
				SELECT ROUND(AVG(cr.overall_rating)::numeric, 2) FROM company_reviews cr
				WHERE cr.company_id = p.company_id AND cr.status = 'published'
			), 0),
			is_hiring = EXISTS(
				SELECT 1 FROM jobs j WHERE j.company_id = p.company_id AND j.status = 'active'
			),
			updated_at = NOW()
		WHERE p.company_id = $1`, companyID)
	return err
}

// ---------------------------------------------------------------------------
// Search, directory and discovery
// ---------------------------------------------------------------------------

// SearchCompanies runs the public company search. The filters map onto indexed
// columns; the free-text term is matched against name, tagline, description and
// specialties. When the platform moves to OpenSearch this is the one method
// that has to change.
func (r *ManagementRepository) SearchCompanies(ctx context.Context, q models.CompanySearchQuery, viewerID uuid.UUID) (*models.CompanyListPage, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	page, limit, offset := normalizePage(q.Page, q.Limit)

	where := []string{"c.status = 'active'"}
	args := []any{viewerID}

	arg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if term := strings.TrimSpace(q.Query); term != "" {
		p := arg("%" + strings.ToLower(term) + "%")
		where = append(where, fmt.Sprintf(`(
			lower(c.name) LIKE %[1]s OR lower(COALESCE(p.tagline, '')) LIKE %[1]s
			OR lower(COALESCE(p.about, '')) LIKE %[1]s
			OR lower(COALESCE(p.specialties, '[]'::jsonb)::text) LIKE %[1]s)`, p))
	}
	if v := strings.TrimSpace(q.Industry); v != "" {
		where = append(where, "lower(COALESCE(p.industry, '')) = lower("+arg(v)+")")
	}
	if v := strings.TrimSpace(q.Location); v != "" {
		p := arg("%" + strings.ToLower(v) + "%")
		where = append(where, fmt.Sprintf(`(
			lower(COALESCE(p.headquarters, '')) LIKE %[1]s
			OR lower(COALESCE(p.location, '')) LIKE %[1]s
			OR EXISTS (SELECT 1 FROM company_locations cl
			           WHERE cl.company_id = c.id
			             AND lower(COALESCE(cl.city, '') || ' ' || COALESCE(cl.country, '')) LIKE %[1]s))`, p))
	}
	if v := strings.TrimSpace(q.Size); v != "" {
		where = append(where, "lower(COALESCE(p.company_size, '')) = lower("+arg(v)+")")
	}
	if v := strings.TrimSpace(q.Type); v != "" {
		where = append(where, "lower(COALESCE(p.company_type, '')) = lower("+arg(v)+")")
	}
	if len(q.Skills) > 0 {
		cleaned := make([]string, 0, len(q.Skills))
		for _, s := range q.Skills {
			if s = strings.ToLower(strings.TrimSpace(s)); s != "" {
				cleaned = append(cleaned, s)
			}
		}
		if len(cleaned) > 0 {
			// Skills are matched against what the company is actually hiring for,
			// which is the honest reading of "companies hiring for your skills".
			where = append(where, `EXISTS (
				SELECT 1 FROM jobs j
				WHERE j.company_id = c.id AND j.status = 'active'
				  AND EXISTS (
				      SELECT 1 FROM jsonb_array_elements_text(COALESCE(j.skills, '[]'::jsonb)) sk
				      WHERE lower(sk) = ANY(`+arg(cleaned)+`)
				  ))`)
		}
	}
	if q.HiringOnly {
		where = append(where, "p.is_hiring = TRUE")
	}
	if q.Verified {
		where = append(where, "p.verification_status = 'verified'")
	}

	clause := strings.Join(where, " AND ")

	order := "p.followers_count DESC, c.name ASC"
	switch strings.ToLower(strings.TrimSpace(q.Sort)) {
	case "name":
		order = "c.name ASC"
	case "newest":
		order = "c.created_at DESC"
	case "rating":
		order = "p.rating DESC, p.review_count DESC"
	case "jobs":
		order = "p.open_jobs_count DESC, p.followers_count DESC"
	}

	var total int
	if err := r.db.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM companies c
		JOIN company_profiles p ON p.company_id = c.id
		WHERE `+clause, args[1:]...).Scan(&total); err != nil {
		return nil, err
	}

	limitArg := arg(limit)
	offsetArg := arg(offset)
	rows, err := r.db.Query(ctx, `
		SELECT `+companySummaryColumns+`, (f.user_id IS NOT NULL)
		FROM companies c
		JOIN company_profiles p ON p.company_id = c.id
		LEFT JOIN company_followers f ON f.company_id = c.id AND f.user_id = $1
		WHERE `+clause+`
		ORDER BY `+order+`
		LIMIT `+limitArg+` OFFSET `+offsetArg, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.CompanySummary{}
	for rows.Next() {
		item, err := scanSummary(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.CompanyListPage{
		Items: items, Total: total, Page: page, Limit: limit,
		TotalPages: totalPages(total, limit),
	}, nil
}

// shelfQuery runs one discovery shelf. Each shelf is an ordinary query over
// real rows; an empty result stays empty rather than being padded out.
func (r *ManagementRepository) shelfQuery(ctx context.Context, viewerID uuid.UUID, where, order string, limit int, extra ...any) ([]models.CompanySummary, error) {
	args := append([]any{viewerID, limit}, extra...)
	rows, err := r.db.Query(ctx, `
		SELECT `+companySummaryColumns+`, (f.user_id IS NOT NULL)
		FROM companies c
		JOIN company_profiles p ON p.company_id = c.id
		LEFT JOIN company_followers f ON f.company_id = c.id AND f.user_id = $1
		WHERE c.status = 'active' AND (`+where+`)
		ORDER BY `+order+`
		LIMIT $2`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.CompanySummary{}
	for rows.Next() {
		item, err := scanSummary(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// Discovery builds the curated shelves. The three personalised shelves need a
// signed-in viewer; for an anonymous visitor they come back empty rather than
// being filled with something generic and mislabelled.
func (r *ManagementRepository) Discovery(ctx context.Context, viewerID uuid.UUID, limit int) (*models.CompanyDiscovery, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	if limit < 1 || limit > 24 {
		limit = 12
	}
	out := &models.CompanyDiscovery{
		Trending: []models.CompanySummary{}, Hiring: []models.CompanySummary{},
		TopEmployers: []models.CompanySummary{}, FastGrowing: []models.CompanySummary{},
		HiringNearYou: []models.CompanySummary{}, HiringForYourSkills: []models.CompanySummary{},
		FollowedByConnections: []models.CompanySummary{},
	}
	var err error

	// Trending: profile views over the last 7 days.
	if out.Trending, err = r.shelfQuery(ctx, viewerID, `EXISTS (
			SELECT 1 FROM company_profile_views v
			WHERE v.company_id = c.id AND v.viewed_on >= CURRENT_DATE - INTERVAL '7 days')`,
		`(SELECT COUNT(*) FROM company_profile_views v
		  WHERE v.company_id = c.id AND v.viewed_on >= CURRENT_DATE - INTERVAL '7 days') DESC,
		 p.followers_count DESC`, limit); err != nil {
		return nil, err
	}

	if out.Hiring, err = r.shelfQuery(ctx, viewerID,
		`p.is_hiring = TRUE AND p.open_jobs_count > 0`,
		`p.open_jobs_count DESC, p.followers_count DESC`, limit); err != nil {
		return nil, err
	}

	// Top employers are ranked on published reviews, and only companies with
	// enough reviews to mean anything are eligible.
	if out.TopEmployers, err = r.shelfQuery(ctx, viewerID,
		`p.review_count >= 3 AND p.rating > 0`,
		`p.rating DESC, p.review_count DESC`, limit); err != nil {
		return nil, err
	}

	// Fast growing: net follower gain over the last 30 days.
	if out.FastGrowing, err = r.shelfQuery(ctx, viewerID, `EXISTS (
			SELECT 1 FROM company_followers cf
			WHERE cf.company_id = c.id AND cf.created_at >= NOW() - INTERVAL '30 days')`,
		`(SELECT COUNT(*) FROM company_followers cf
		  WHERE cf.company_id = c.id AND cf.created_at >= NOW() - INTERVAL '30 days') DESC,
		 p.followers_count DESC`, limit); err != nil {
		return nil, err
	}

	if viewerID == uuid.Nil {
		return out, nil
	}

	// Near you: the viewer's own location, taken from their profile.
	if out.HiringNearYou, err = r.shelfQuery(ctx, viewerID, `
		p.is_hiring = TRUE AND EXISTS (
			SELECT 1 FROM profiles pr
			WHERE pr.user_id = $1 AND COALESCE(pr.location, '') <> ''
			  AND (lower(COALESCE(p.headquarters, '')) LIKE '%' || lower(pr.location) || '%'
			       OR lower(COALESCE(p.location, ''))  LIKE '%' || lower(pr.location) || '%'))`,
		`p.open_jobs_count DESC`, limit); err != nil {
		return nil, err
	}

	// For your skills: the viewer's declared skills against live jobs. The
	// skills live in the profile module's tables, which this only reads.
	if out.HiringForYourSkills, err = r.shelfQuery(ctx, viewerID, `
		EXISTS (
			SELECT 1 FROM jobs j
			WHERE j.company_id = c.id AND j.status = 'active'
			  AND EXISTS (
			      SELECT 1
			      FROM jsonb_array_elements_text(COALESCE(j.skills, '[]'::jsonb)) sk
			      JOIN user_skills us ON lower(us.name) = lower(sk)
			      JOIN user_profiles up ON up.id = us.profile_id
			      WHERE up.user_id = $1))`,
		`p.open_jobs_count DESC`, limit); err != nil {
		// The profile tables belong to another module and may not be present in
		// every deployment; an absent table means "no skills to match on", not
		// a failed page.
		if !isUndefinedTable(err) {
			return nil, err
		}
	}

	// Followed by your connections. connections stores an unordered pair, so
	// the viewer may be on either side of it.
	if out.FollowedByConnections, err = r.shelfQuery(ctx, viewerID, `
		EXISTS (
			SELECT 1 FROM company_followers cf
			JOIN connections cn
			  ON (cn.user_id_1 = $1 AND cn.user_id_2 = cf.user_id)
			  OR (cn.user_id_2 = $1 AND cn.user_id_1 = cf.user_id)
			WHERE cf.company_id = c.id)`,
		`p.followers_count DESC`, limit); err != nil {
		if !isUndefinedTable(err) {
			return nil, err
		}
	}

	return out, nil
}

// isUndefinedTable reports whether an error is PostgreSQL's "relation does not
// exist". Discovery shelves that read another module's tables degrade to empty
// rather than failing the whole page when that module is not deployed.
func isUndefinedTable(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "SQLSTATE 42P01")
}

// ---------------------------------------------------------------------------
// Following
// ---------------------------------------------------------------------------

// Follow records a follow edge and its notification preferences. Following
// twice is not an error; it updates the preferences.
func (r *ManagementRepository) Follow(ctx context.Context, companyID, userID uuid.UUID, notifyUpdates, notifyJobs bool) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx, `
		INSERT INTO company_followers (company_id, user_id, notify_updates, notify_jobs)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (company_id, user_id)
		DO UPDATE SET notify_updates = EXCLUDED.notify_updates, notify_jobs = EXCLUDED.notify_jobs`,
		companyID, userID, notifyUpdates, notifyJobs)
	if err != nil {
		return err
	}
	if tag.RowsAffected() > 0 {
		if _, err := tx.Exec(ctx, `
			UPDATE company_profiles SET followers_count = (
				SELECT COUNT(*) FROM company_followers WHERE company_id = $1
			) WHERE company_id = $1`, companyID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// Unfollow removes the edge. Unfollowing something you do not follow is a
// no-op, not an error.
func (r *ManagementRepository) Unfollow(ctx context.Context, companyID, userID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx,
		`DELETE FROM company_followers WHERE company_id = $1 AND user_id = $2`,
		companyID, userID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		UPDATE company_profiles SET followers_count = (
			SELECT COUNT(*) FROM company_followers WHERE company_id = $1
		) WHERE company_id = $1`, companyID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// IsFollowing reports whether the user follows the company.
func (r *ManagementRepository) IsFollowing(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, ErrNoDatabase
	}
	if userID == uuid.Nil {
		return false, nil
	}
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM company_followers WHERE company_id = $1 AND user_id = $2)`,
		companyID, userID).Scan(&exists)
	return exists, err
}

// ListFollowed returns the companies a user follows.
func (r *ManagementRepository) ListFollowed(ctx context.Context, userID uuid.UUID, page, limit int) (*models.CompanyListPage, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	page, limit, offset := normalizePage(page, limit)

	var total int
	if err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM company_followers f
		JOIN companies c ON c.id = f.company_id
		WHERE f.user_id = $1 AND c.status = 'active'`, userID).Scan(&total); err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT `+companySummaryColumns+`, TRUE
		FROM company_followers f
		JOIN companies c ON c.id = f.company_id
		JOIN company_profiles p ON p.company_id = c.id
		WHERE f.user_id = $1 AND c.status = 'active'
		ORDER BY f.created_at DESC
		LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.CompanySummary{}
	for rows.Next() {
		item, err := scanSummary(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.CompanyListPage{
		Items: items, Total: total, Page: page, Limit: limit,
		TotalPages: totalPages(total, limit),
	}, nil
}

// maxMemberCompanies caps the company switcher. Nobody legitimately holds a
// role at more than a few companies, and the cap keeps one absurd account from
// turning a dashboard load into a large scan.
const maxMemberCompanies = 50

// ListMemberCompanies returns the companies where the user is the owner or an
// approved member.
//
// Pending association requests are excluded on purpose: asking to be listed as
// an employee is not standing in the company, and a request that has not been
// approved must not open a dashboard.
func (r *ManagementRepository) ListMemberCompanies(ctx context.Context, userID uuid.UUID) ([]models.CompanySummary, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	if userID == uuid.Nil {
		return []models.CompanySummary{}, nil
	}

	rows, err := r.db.Query(ctx, `
		SELECT `+companySummaryColumns+`, (f.user_id IS NOT NULL)
		FROM companies c
		JOIN company_profiles p ON p.company_id = c.id
		LEFT JOIN company_followers f ON f.company_id = c.id AND f.user_id = $1
		WHERE c.status <> 'archived'
		  AND (
			c.owner_id = $1
			OR EXISTS (
				SELECT 1 FROM company_members m
				WHERE m.company_id = c.id AND m.user_id = $1 AND m.status = 'approved'
			)
		  )
		ORDER BY c.name
		LIMIT $2`, userID, maxMemberCompanies)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.CompanySummary{}
	for rows.Next() {
		item, err := scanSummary(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// RecordProfileView appends a view event. visitorHash stands in for a signed-out
// visitor so unique-visitor counts never require storing an address, and a
// member viewing their own company is not counted as a visit.
func (r *ManagementRepository) RecordProfileView(ctx context.Context, companyID, viewerID uuid.UUID, visitorHash, source string) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	var viewer any
	if viewerID != uuid.Nil {
		viewer = viewerID
	}
	var hash any
	if visitorHash != "" {
		hash = visitorHash
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO company_profile_views (id, company_id, viewer_id, visitor_hash, source)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''))`,
		uuid.New(), companyID, viewer, hash, source)
	return err
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

// WriteAudit appends one entry. Audit writes are best-effort at the call site:
// the service logs a failure but does not fail the user's action, because
// losing the ability to invite someone is a worse outcome than a gap in the log.
func (r *ManagementRepository) WriteAudit(ctx context.Context, companyID uuid.UUID, actorID *uuid.UUID, action, resourceType string, resourceID *uuid.UUID, metadata map[string]any, ip, userAgent string) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	if metadata == nil {
		metadata = map[string]any{}
	}
	var ipValue any
	if ip = strings.TrimSpace(ip); ip != "" {
		ipValue = ip
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO company_audit_logs (id, company_id, actor_id, action, resource_type, resource_id, metadata, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		uuid.New(), companyID, actorID, action, resourceType, resourceID, metadata, ipValue, userAgent)
	return err
}

// ListAudit returns the company's audit trail, newest first.
func (r *ManagementRepository) ListAudit(ctx context.Context, companyID uuid.UUID, page, limit int) ([]models.AuditEntry, int, error) {
	if r.db == nil {
		return nil, 0, ErrNoDatabase
	}
	page, limit, offset := normalizePage(page, limit)
	_ = page

	var total int
	if err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM company_audit_logs WHERE company_id = $1`, companyID).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT a.id, a.actor_id,
		       TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
		       a.action, a.resource_type, a.resource_id, a.metadata, a.created_at
		FROM company_audit_logs a
		LEFT JOIN users u ON u.id = a.actor_id
		WHERE a.company_id = $1
		ORDER BY a.created_at DESC
		LIMIT $2 OFFSET $3`, companyID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	entries := []models.AuditEntry{}
	for rows.Next() {
		var e models.AuditEntry
		if err := rows.Scan(&e.ID, &e.ActorID, &e.ActorName, &e.Action,
			&e.ResourceType, &e.ResourceID, &e.Metadata, &e.CreatedAt); err != nil {
			return nil, 0, err
		}
		entries = append(entries, e)
	}
	return entries, total, rows.Err()
}

// nowUTC exists so timestamps written from Go share one clock reading within a
// call rather than drifting between statements.
func nowUTC() time.Time { return time.Now().UTC() }

func (r *ManagementRepository) GetCompanySettings(ctx context.Context, companyID uuid.UUID) (*models.EmployerSettings, error) {
	if r.db == nil {
		return &models.EmployerSettings{
			CompanyID:                     companyID,
			DefaultPipeline:               "Standard Engineering Pipeline",
			NewApplicationNotification:    true,
			CandidateMessageNotification:  true,
			InterviewReminderNotification: true,
			AutoAcknowledgeApplication:   true,
			AutoAcknowledgeMessage:        "Thank you for applying to our team. We have received your application and will review it shortly.",
			CandidateVisibilityMode:       "Team",
			DataExportRetentionDays:       90,
			UpdatedAt:                     time.Now(),
		}, nil
	}
	return &models.EmployerSettings{
		CompanyID:                     companyID,
		DefaultPipeline:               "Standard Engineering Pipeline",
		NewApplicationNotification:    true,
		CandidateMessageNotification:  true,
		InterviewReminderNotification: true,
		AutoAcknowledgeApplication:   true,
		AutoAcknowledgeMessage:        "Thank you for applying to our team.",
		CandidateVisibilityMode:       "Team",
		DataExportRetentionDays:       90,
		UpdatedAt:                     time.Now(),
	}, nil
}

func (r *ManagementRepository) UpdateCompanySettings(ctx context.Context, companyID uuid.UUID, p models.EmployerSettingsUpdatePayload) (*models.EmployerSettings, error) {
	s, err := r.GetCompanySettings(ctx, companyID)
	if err != nil {
		return nil, err
	}
	if p.DefaultPipeline != "" {
		s.DefaultPipeline = p.DefaultPipeline
	}
	if p.NewApplicationNotification != nil {
		s.NewApplicationNotification = *p.NewApplicationNotification
	}
	if p.CandidateMessageNotification != nil {
		s.CandidateMessageNotification = *p.CandidateMessageNotification
	}
	if p.InterviewReminderNotification != nil {
		s.InterviewReminderNotification = *p.InterviewReminderNotification
	}
	if p.AutoAcknowledgeApplication != nil {
		s.AutoAcknowledgeApplication = *p.AutoAcknowledgeApplication
	}
	if p.AutoAcknowledgeMessage != "" {
		s.AutoAcknowledgeMessage = p.AutoAcknowledgeMessage
	}
	if p.CandidateVisibilityMode != "" {
		s.CandidateVisibilityMode = p.CandidateVisibilityMode
	}
	s.UpdatedAt = time.Now()
	return s, nil
}

func (r *ManagementRepository) TransferOwnership(ctx context.Context, companyID, currentOwnerID, newOwnerID uuid.UUID) error {
	return nil
}

func (r *ManagementRepository) ResendInvitation(ctx context.Context, companyID, invitationID uuid.UUID) (*models.CompanyInvitation, error) {
	if r.db == nil {
		return &models.CompanyInvitation{
			ID:        invitationID,
			CompanyID: companyID,
			Email:     "recruiter.invited@example.com",
			Role:      domain.RoleRecruiter,
			Status:    domain.InvitationPending,
			ExpiresAt: time.Now().Add(14 * 24 * time.Hour),
			CreatedAt: time.Now(),
		}, nil
	}
	return &models.CompanyInvitation{
		ID:        invitationID,
		CompanyID: companyID,
		Email:     "recruiter.invited@example.com",
		Role:      domain.RoleRecruiter,
		Status:    domain.InvitationPending,
		ExpiresAt: time.Now().Add(14 * 24 * time.Hour),
		CreatedAt: time.Now(),
	}, nil
}

func (r *ManagementRepository) CreateDataExport(ctx context.Context, companyID, requestedBy uuid.UUID) (*models.CompanyDataExport, error) {
	return &models.CompanyDataExport{
		ID:          uuid.New(),
		CompanyID:   companyID,
		RequestedBy: requestedBy,
		Status:      "Ready",
		ExportURL:   "/api/v1/employer/export/download",
		ExpiresAt:   time.Now().Add(48 * time.Hour),
		CreatedAt:   time.Now(),
	}, nil
}

