package repository

import (
	"context"
	"errors"
	"kirmya/internal/company/models"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CompanyRepository struct {
	db *pgxpool.Pool
}

func NewCompanyRepository(db *pgxpool.Pool) *CompanyRepository {
	return &CompanyRepository{db: db}
}

// CreateCompany registers a company, its default profile, and registers the initial admin member in a database transaction.
func (r *CompanyRepository) CreateCompany(ctx context.Context, c *models.Company, p *models.CompanyProfile, m *models.CompanyMember) error {
	if r.db == nil {
		return nil
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Insert company
	_, err = tx.Exec(ctx, "INSERT INTO companies (id, name, handle) VALUES ($1, $2, $3)", c.ID, c.Name, c.Handle)
	if err != nil {
		return err
	}

	// 2. Insert profile
	_, err = tx.Exec(ctx, `INSERT INTO company_profiles 
		(company_id, logo_url, cover_url, about, industry, company_size, location, website, founded_year, culture, benefits, employee_insights) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		p.CompanyID, p.LogoURL, p.CoverURL, p.About, p.Industry, p.CompanySize, p.Location, p.Website, p.FoundedYear, p.Culture, p.Benefits, p.EmployeeInsights)
	if err != nil {
		return err
	}

	// 3. Insert initial admin member
	_, err = tx.Exec(ctx, "INSERT INTO company_members (id, company_id, user_id, role) VALUES ($1, $2, $3, $4)", m.ID, m.CompanyID, m.UserID, m.Role)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// GetByHandle retrieves a company and its profile using its unique handle string.
func (r *CompanyRepository) GetByHandle(ctx context.Context, handle string) (*models.Company, *models.CompanyProfile, error) {
	if r.db == nil {
		return nil, nil, pgx.ErrNoRows
	}

	var c models.Company
	var p models.CompanyProfile

	query := `SELECT c.id, c.name, c.handle, c.created_at,
	                 p.logo_url, p.cover_url, p.about, p.industry, p.company_size, 
	                 p.location, p.website, p.founded_year, p.culture, p.benefits, p.employee_insights, p.followers_count
	          FROM companies c
	          JOIN company_profiles p ON c.id = p.company_id
	          WHERE c.handle = $1`

	err := r.db.QueryRow(ctx, query, handle).Scan(
		&c.ID, &c.Name, &c.Handle, &c.CreatedAt,
		&p.LogoURL, &p.CoverURL, &p.About, &p.Industry, &p.CompanySize,
		&p.Location, &p.Website, &p.FoundedYear, &p.Culture, &p.Benefits, &p.EmployeeInsights, &p.FollowersCount,
	)
	if err != nil {
		return nil, nil, err
	}
	p.CompanyID = c.ID
	return &c, &p, nil
}

// GetByID retrieves a company and its profile using its UUID.
func (r *CompanyRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Company, *models.CompanyProfile, error) {
	if r.db == nil {
		return nil, nil, pgx.ErrNoRows
	}

	var c models.Company
	var p models.CompanyProfile

	query := `SELECT c.id, c.name, c.handle, c.created_at,
	                 p.logo_url, p.cover_url, p.about, p.industry, p.company_size, 
	                 p.location, p.website, p.founded_year, p.culture, p.benefits, p.employee_insights, p.followers_count
	          FROM companies c
	          JOIN company_profiles p ON c.id = p.company_id
	          WHERE c.id = $1`

	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.Name, &c.Handle, &c.CreatedAt,
		&p.LogoURL, &p.CoverURL, &p.About, &p.Industry, &p.CompanySize,
		&p.Location, &p.Website, &p.FoundedYear, &p.Culture, &p.Benefits, &p.EmployeeInsights, &p.FollowersCount,
	)
	if err != nil {
		return nil, nil, err
	}
	p.CompanyID = c.ID
	return &c, &p, nil
}

// UpdateProfile updates the detailed sections of a company profile.
func (r *CompanyRepository) UpdateProfile(ctx context.Context, companyID uuid.UUID, p *models.CompanyProfile) error {
	if r.db == nil {
		return nil
	}
	query := `UPDATE company_profiles SET 
	          logo_url = $1, cover_url = $2, about = $3, website = $4, location = $5, 
	          company_size = $6, culture = $7, benefits = $8, employee_insights = $9, updated_at = NOW()
	          WHERE company_id = $10`
	_, err := r.db.Exec(ctx, query, p.LogoURL, p.CoverURL, p.About, p.Website, p.Location, p.CompanySize, p.Culture, p.Benefits, p.EmployeeInsights, companyID)
	return err
}

// GetMemberRole returns the role ('admin', 'editor', 'employee') for a given user in a company.
func (r *CompanyRepository) GetMemberRole(ctx context.Context, companyID, userID uuid.UUID) (string, error) {
	if r.db == nil {
		return "admin", nil // Default to admin for simple testing on offline mocks
	}
	var role string
	err := r.db.QueryRow(ctx, "SELECT role FROM company_members WHERE company_id = $1 AND user_id = $2", companyID, userID).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil // No membership record found
		}
		return "", err
	}
	return role, nil
}

// Search queries companies matching a specific text prefix.
func (r *CompanyRepository) Search(ctx context.Context, searchQ string) ([]models.Company, []models.CompanyProfile, error) {
	if r.db == nil {
		return []models.Company{}, []models.CompanyProfile{}, nil
	}

	query := `SELECT c.id, c.name, c.handle, c.created_at,
	                 p.logo_url, p.cover_url, p.about, p.industry, p.company_size, 
	                 p.location, p.website, p.founded_year, p.culture, p.benefits, p.employee_insights, p.followers_count
	          FROM companies c
	          JOIN company_profiles p ON c.id = p.company_id
	          WHERE LOWER(c.name) LIKE $1 OR LOWER(p.industry) LIKE $1 OR LOWER(p.location) LIKE $1
	          ORDER BY p.followers_count DESC`

	likeQ := "%" + strings.ToLower(searchQ) + "%"
	rows, err := r.db.Query(ctx, query, likeQ)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var companies []models.Company
	var profiles []models.CompanyProfile

	for rows.Next() {
		var c models.Company
		var p models.CompanyProfile
		err := rows.Scan(
			&c.ID, &c.Name, &c.Handle, &c.CreatedAt,
			&p.LogoURL, &p.CoverURL, &p.About, &p.Industry, &p.CompanySize,
			&p.Location, &p.Website, &p.FoundedYear, &p.Culture, &p.Benefits, &p.EmployeeInsights, &p.FollowersCount,
		)
		if err != nil {
			return nil, nil, err
		}
		p.CompanyID = c.ID
		companies = append(companies, c)
		profiles = append(profiles, p)
	}

	return companies, profiles, nil
}

// Follow toggles the follow state of a user for a company, updating the followers count.
func (r *CompanyRepository) Follow(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	if r.db == nil {
		return true, nil
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	// Check if already following
	var exists bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM company_followers WHERE company_id = $1 AND user_id = $2)", companyID, userID).Scan(&exists)
	if err != nil {
		return false, err
	}

	var following bool
	if exists {
		// Unfollow
		_, err = tx.Exec(ctx, "DELETE FROM company_followers WHERE company_id = $1 AND user_id = $2", companyID, userID)
		if err != nil {
			return false, err
		}
		_, err = tx.Exec(ctx, "UPDATE company_profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE company_id = $1", companyID)
		if err != nil {
			return false, err
		}
		following = false
	} else {
		// Follow
		_, err = tx.Exec(ctx, "INSERT INTO company_followers (company_id, user_id) VALUES ($1, $2)", companyID, userID)
		if err != nil {
			return false, err
		}
		_, err = tx.Exec(ctx, "UPDATE company_profiles SET followers_count = followers_count + 1 WHERE company_id = $1", companyID)
		if err != nil {
			return false, err
		}
		following = true
	}

	err = tx.Commit(ctx)
	return following, err
}

func (r *CompanyRepository) IsFollowing(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, nil
	}
	var exists bool
	err := r.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM company_followers WHERE company_id = $1 AND user_id = $2)", companyID, userID).Scan(&exists)
	return exists, err
}

// GetRecommendations retrieves the most followed companies as suggested profiles.
func (r *CompanyRepository) GetRecommendations(ctx context.Context, limit int) ([]models.Company, []models.CompanyProfile, error) {
	if r.db == nil {
		return []models.Company{}, []models.CompanyProfile{}, nil
	}

	query := `SELECT c.id, c.name, c.handle, c.created_at,
	                 p.logo_url, p.cover_url, p.about, p.industry, p.company_size, 
	                 p.location, p.website, p.founded_year, p.culture, p.benefits, p.employee_insights, p.followers_count
	          FROM companies c
	          JOIN company_profiles p ON c.id = p.company_id
	          ORDER BY p.followers_count DESC, c.name ASC
	          LIMIT $1`

	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var companies []models.Company
	var profiles []models.CompanyProfile

	for rows.Next() {
		var c models.Company
		var p models.CompanyProfile
		err := rows.Scan(
			&c.ID, &c.Name, &c.Handle, &c.CreatedAt,
			&p.LogoURL, &p.CoverURL, &p.About, &p.Industry, &p.CompanySize,
			&p.Location, &p.Website, &p.FoundedYear, &p.Culture, &p.Benefits, &p.EmployeeInsights, &p.FollowersCount,
		)
		if err != nil {
			return nil, nil, err
		}
		p.CompanyID = c.ID
		companies = append(companies, c)
		profiles = append(profiles, p)
	}

	return companies, profiles, nil
}

// CreateVerificationRequest submits an verification audit record.
func (r *CompanyRepository) CreateVerificationRequest(ctx context.Context, req *models.CompanyVerificationRequest) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO company_verification_requests (id, company_id, requester_id, status, documents)
	          VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, req.ID, req.CompanyID, req.RequesterID, req.Status, req.Documents)
	return err
}

// UpdateVerificationStatus updates verification requests state.
func (r *CompanyRepository) UpdateVerificationStatus(ctx context.Context, reqID uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE company_verification_requests SET status = $1 WHERE id = $2", status, reqID)
	return err
}
