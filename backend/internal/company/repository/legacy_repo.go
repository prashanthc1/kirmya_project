package repository

import (
	"context"
	"strings"

	"kirmya/internal/company/models"

	"github.com/google/uuid"
)

// This file backs the company public-profile sub-resources that predate the
// management module — leaders, locations, gallery, saved companies, reports and
// the industry index. They used to be answered from hardcoded slices in the
// service; every one of them now reads the tables migrations 0042 and 0043
// already created. A company with no leaders on file returns no leaders.

// ListLeaders returns a company's published leadership.
func (r *ManagementRepository) ListLeaders(ctx context.Context, companyID uuid.UUID) ([]models.CompanyLeaderDTO, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	rows, err := r.db.Query(ctx, `
		SELECT id, name, designation, COALESCE(photo_url, ''), COALESCE(summary, ''), COALESCE(linkedin_url, '')
		FROM company_leaders
		WHERE company_id = $1
		ORDER BY name ASC`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.CompanyLeaderDTO{}
	for rows.Next() {
		var l models.CompanyLeaderDTO
		if err := rows.Scan(&l.ID, &l.Name, &l.Designation, &l.PhotoURL, &l.Summary, &l.LinkedInURL); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

// ListLocations returns a company's offices, headquarters first.
func (r *ManagementRepository) ListLocations(ctx context.Context, companyID uuid.UUID) ([]models.CompanyLocationDTO, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	rows, err := r.db.Query(ctx, `
		SELECT id, name, type, COALESCE(address, ''), COALESCE(city, ''), COALESCE(country, ''),
		       COALESCE(latitude, 0), COALESCE(longitude, 0)
		FROM company_locations
		WHERE company_id = $1
		ORDER BY is_headquarters DESC, name ASC`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.CompanyLocationDTO{}
	for rows.Next() {
		var l models.CompanyLocationDTO
		if err := rows.Scan(&l.ID, &l.Name, &l.Type, &l.Address, &l.City, &l.Country,
			&l.Latitude, &l.Longitude); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

// ListGallery returns a company's uploaded media.
func (r *ManagementRepository) ListGallery(ctx context.Context, companyID uuid.UUID) ([]models.CompanyGalleryItem, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	rows, err := r.db.Query(ctx, `
		SELECT id, COALESCE(title, ''), media_url, COALESCE(type, 'image'), COALESCE(category, 'workplace')
		FROM company_gallery
		WHERE company_id = $1
		ORDER BY category ASC, title ASC`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.CompanyGalleryItem{}
	for rows.Next() {
		var g models.CompanyGalleryItem
		if err := rows.Scan(&g.ID, &g.Title, &g.MediaURL, &g.Type, &g.Category); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

// SaveCompany bookmarks a company for a user. Saving twice is not an error, so
// a retried request does not surface a spurious failure.
func (r *ManagementRepository) SaveCompany(ctx context.Context, companyID, userID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO company_saved (company_id, user_id) VALUES ($1, $2)
		ON CONFLICT (company_id, user_id) DO NOTHING`, companyID, userID)
	return err
}

// UnsaveCompany removes a bookmark.
func (r *ManagementRepository) UnsaveCompany(ctx context.Context, companyID, userID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	_, err := r.db.Exec(ctx,
		`DELETE FROM company_saved WHERE company_id = $1 AND user_id = $2`, companyID, userID)
	return err
}

// IsSaved reports whether a user has bookmarked a company.
func (r *ManagementRepository) IsSaved(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, ErrNoDatabase
	}
	if userID == uuid.Nil {
		return false, nil
	}
	var saved bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM company_saved WHERE company_id = $1 AND user_id = $2)`,
		companyID, userID).Scan(&saved)
	return saved, err
}

// ReportCompany files a report against a company page for moderation.
func (r *ManagementRepository) ReportCompany(ctx context.Context, companyID, reporterID uuid.UUID, reason, details string) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO company_reports (id, company_id, reporter_id, reason, details)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''))`,
		uuid.New(), companyID, reporterID, reason, details)
	return err
}

// Industries returns the industry index: how many active companies sit in each
// industry and how many live jobs they have between them.
//
// The counts are computed from the companies and jobs tables, so an industry
// with nothing in it does not appear at all.
func (r *ManagementRepository) Industries(ctx context.Context, limit int) ([]models.IndustryCategory, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	if limit <= 0 || limit > 100 {
		limit = 30
	}
	rows, err := r.db.Query(ctx, `
		SELECT p.industry,
		       COUNT(DISTINCT c.id) AS company_count,
		       COALESCE(SUM(j.open_jobs), 0) AS open_jobs
		FROM companies c
		JOIN company_profiles p ON p.company_id = c.id
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS open_jobs FROM jobs
			WHERE jobs.company_id = c.id AND jobs.status = 'active'
		) j ON TRUE
		WHERE c.status = 'active' AND COALESCE(p.industry, '') <> ''
		GROUP BY p.industry
		ORDER BY company_count DESC, p.industry ASC
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.IndustryCategory{}
	for rows.Next() {
		var name string
		var companyCount, openJobs int
		if err := rows.Scan(&name, &companyCount, &openJobs); err != nil {
			return nil, err
		}
		out = append(out, models.IndustryCategory{
			// The id is the slug of the name rather than a surrogate key,
			// because industries are a derived grouping, not stored rows.
			ID:           industrySlug(name),
			Name:         name,
			Icon:         industryIcon(name),
			CompanyCount: companyCount,
			OpenJobs:     openJobs,
		})
	}
	return out, rows.Err()
}

// industrySlug reduces an industry name to a stable url-safe key.
func industrySlug(name string) string {
	var b strings.Builder
	lastDash := true
	for _, r := range strings.ToLower(strings.TrimSpace(name)) {
		switch {
		case (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9'):
			b.WriteRune(r)
			lastDash = false
		case !lastDash:
			b.WriteRune('-')
			lastDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

// industryIconKeywords maps a keyword to the MUI icon the frontend renders.
// It is presentation, not data: an unrecognised industry gets the neutral
// Business icon rather than being dropped from the list.
var industryIconKeywords = []struct {
	keyword string
	icon    string
}{
	{"tech", "Code"},
	{"software", "Code"},
	{"health", "LocalHospital"},
	{"medical", "LocalHospital"},
	{"construct", "Apartment"},
	{"real estate", "Apartment"},
	{"financ", "AccountBalance"},
	{"bank", "AccountBalance"},
	{"logistic", "LocalShipping"},
	{"supply", "LocalShipping"},
	{"transport", "LocalShipping"},
	{"engineer", "Engineering"},
	{"oil", "PropaneTank"},
	{"gas", "PropaneTank"},
	{"energy", "PropaneTank"},
	{"retail", "ShoppingCart"},
	{"commerce", "ShoppingCart"},
	{"hospitality", "Hotel"},
	{"tourism", "Hotel"},
	{"travel", "Hotel"},
	{"education", "School"},
	{"manufactur", "PrecisionManufacturing"},
	{"government", "Security"},
	{"defense", "Security"},
	{"defence", "Security"},
	{"telecom", "CellTower"},
	{"media", "Movie"},
	{"entertainment", "Movie"},
	{"facilit", "Business"},
}

func industryIcon(name string) string {
	lower := strings.ToLower(name)
	for _, entry := range industryIconKeywords {
		if strings.Contains(lower, entry.keyword) {
			return entry.icon
		}
	}
	return "Business"
}
