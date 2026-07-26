package repository

import (
	"context"
	"errors"
	"kirmya/internal/profile/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProfileRepository struct {
	db *pgxpool.Pool
}

func NewProfileRepository(db *pgxpool.Pool) *ProfileRepository {
	return &ProfileRepository{db: db}
}

// GetByUserID retrieves user profile header and sub-tables.
func (r *ProfileRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.UserProfile, error) {
	p := &models.UserProfile{}
	query := `SELECT id, user_id, headline, summary, availability_status, profile_completed_percentage, volunteering, publications, licenses, created_at, updated_at 
	          FROM user_profiles WHERE user_id = $1`

	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.ID, &p.UserID, &p.Headline, &p.Summary, &p.AvailabilityStatus,
		&p.ProfileCompletedPercentage, &p.Volunteering, &p.Publications, &p.Licenses,
		&p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // Profile not created yet
		}
		return nil, err
	}

	// Fetch sub-tables
	skills, err := r.GetSkills(ctx, p.ID)
	if err == nil {
		p.Skills = skills
	}
	certs, err := r.GetCertifications(ctx, p.ID)
	if err == nil {
		p.Certifications = certs
	}
	projects, err := r.GetProjects(ctx, p.ID)
	if err == nil {
		p.Projects = projects
	}
	languages, err := r.GetLanguages(ctx, p.ID)
	if err == nil {
		p.Languages = languages
	}
	achievements, err := r.GetAchievements(ctx, p.ID)
	if err == nil {
		p.Achievements = achievements
	}

	return p, nil
}

func (r *ProfileRepository) Create(ctx context.Context, p *models.UserProfile) error {
	query := `INSERT INTO user_profiles (id, user_id, headline, summary, availability_status, profile_completed_percentage, volunteering, publications, licenses, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
	_, err := r.db.Exec(ctx, query, p.ID, p.UserID, p.Headline, p.Summary, p.AvailabilityStatus, p.ProfileCompletedPercentage, p.Volunteering, p.Publications, p.Licenses, p.CreatedAt, p.UpdatedAt)
	return err
}

func (r *ProfileRepository) Update(ctx context.Context, p *models.UserProfile) error {
	query := `UPDATE user_profiles SET headline = $1, summary = $2, availability_status = $3, profile_completed_percentage = $4, volunteering = $5, publications = $6, licenses = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8`
	_, err := r.db.Exec(ctx, query, p.Headline, p.Summary, p.AvailabilityStatus, p.ProfileCompletedPercentage, p.Volunteering, p.Publications, p.Licenses, p.ID)
	return err
}

// Sub-resource database operations: Skills
func (r *ProfileRepository) GetSkills(ctx context.Context, profileID uuid.UUID) ([]models.UserSkill, error) {
	rows, err := r.db.Query(ctx, "SELECT id, profile_id, name, proficiency_level FROM user_skills WHERE profile_id = $1", profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []models.UserSkill
	for rows.Next() {
		var s models.UserSkill
		if err := rows.Scan(&s.ID, &s.ProfileID, &s.Name, &s.ProficiencyLevel); err != nil {
			return nil, err
		}
		skills = append(skills, s)
	}
	return skills, nil
}

func (r *ProfileRepository) AddSkill(ctx context.Context, s *models.UserSkill) error {
	query := `INSERT INTO user_skills (id, profile_id, name, proficiency_level) VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(ctx, query, s.ID, s.ProfileID, s.Name, s.ProficiencyLevel)
	return err
}

func (r *ProfileRepository) DeleteSkill(ctx context.Context, profileID uuid.UUID, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM user_skills WHERE id = $1 AND profile_id = $2", id, profileID)
	return err
}

// Certifications
func (r *ProfileRepository) GetCertifications(ctx context.Context, profileID uuid.UUID) ([]models.UserCertification, error) {
	rows, err := r.db.Query(ctx, "SELECT id, profile_id, name, issuing_organization, issue_date, expiration_date, credential_id, credential_url FROM user_certifications WHERE profile_id = $1", profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var certs []models.UserCertification
	for rows.Next() {
		var c models.UserCertification
		if err := rows.Scan(&c.ID, &c.ProfileID, &c.Name, &c.IssuingOrganization, &c.IssueDate, &c.ExpirationDate, &c.CredentialID, &c.CredentialURL); err != nil {
			return nil, err
		}
		certs = append(certs, c)
	}
	return certs, nil
}

func (r *ProfileRepository) AddCertification(ctx context.Context, c *models.UserCertification) error {
	query := `INSERT INTO user_certifications (id, profile_id, name, issuing_organization, issue_date, expiration_date, credential_id, credential_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.Exec(ctx, query, c.ID, c.ProfileID, c.Name, c.IssuingOrganization, c.IssueDate, c.ExpirationDate, c.CredentialID, c.CredentialURL)
	return err
}

func (r *ProfileRepository) DeleteCertification(ctx context.Context, profileID uuid.UUID, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM user_certifications WHERE id = $1 AND profile_id = $2", id, profileID)
	return err
}

// Projects
func (r *ProfileRepository) GetProjects(ctx context.Context, profileID uuid.UUID) ([]models.UserProject, error) {
	rows, err := r.db.Query(ctx, "SELECT id, profile_id, title, description, url, start_date, end_date FROM user_projects WHERE profile_id = $1", profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.UserProject
	for rows.Next() {
		var p models.UserProject
		if err := rows.Scan(&p.ID, &p.ProfileID, &p.Title, &p.Description, &p.URL, &p.StartDate, &p.EndDate); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *ProfileRepository) AddProject(ctx context.Context, p *models.UserProject) error {
	query := `INSERT INTO user_projects (id, profile_id, title, description, url, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query, p.ID, p.ProfileID, p.Title, p.Description, p.URL, p.StartDate, p.EndDate)
	return err
}

func (r *ProfileRepository) DeleteProject(ctx context.Context, profileID uuid.UUID, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM user_projects WHERE id = $1 AND profile_id = $2", id, profileID)
	return err
}

// Languages
func (r *ProfileRepository) GetLanguages(ctx context.Context, profileID uuid.UUID) ([]models.UserLanguage, error) {
	rows, err := r.db.Query(ctx, "SELECT id, profile_id, name, proficiency FROM user_languages WHERE profile_id = $1", profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var langs []models.UserLanguage
	for rows.Next() {
		var l models.UserLanguage
		if err := rows.Scan(&l.ID, &l.ProfileID, &l.Name, &l.Proficiency); err != nil {
			return nil, err
		}
		langs = append(langs, l)
	}
	return langs, nil
}

func (r *ProfileRepository) AddLanguage(ctx context.Context, l *models.UserLanguage) error {
	query := `INSERT INTO user_languages (id, profile_id, name, proficiency) VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(ctx, query, l.ID, l.ProfileID, l.Name, l.Proficiency)
	return err
}

func (r *ProfileRepository) DeleteLanguage(ctx context.Context, profileID uuid.UUID, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM user_languages WHERE id = $1 AND profile_id = $2", id, profileID)
	return err
}

// Achievements
func (r *ProfileRepository) GetAchievements(ctx context.Context, profileID uuid.UUID) ([]models.UserAchievement, error) {
	rows, err := r.db.Query(ctx, "SELECT id, profile_id, title, description, date_achieved FROM user_achievements WHERE profile_id = $1", profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var achs []models.UserAchievement
	for rows.Next() {
		var a models.UserAchievement
		if err := rows.Scan(&a.ID, &a.ProfileID, &a.Title, &a.Description, &a.DateAchieved); err != nil {
			return nil, err
		}
		achs = append(achs, a)
	}
	return achs, nil
}

func (r *ProfileRepository) AddAchievement(ctx context.Context, a *models.UserAchievement) error {
	query := `INSERT INTO user_achievements (id, profile_id, title, description, date_achieved) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, a.ID, a.ProfileID, a.Title, a.Description, a.DateAchieved)
	return err
}

func (r *ProfileRepository) DeleteAchievement(ctx context.Context, profileID uuid.UUID, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM user_achievements WHERE id = $1 AND profile_id = $2", id, profileID)
	return err
}

// UserPreferences
func (r *ProfileRepository) GetPreferences(ctx context.Context, userID uuid.UUID) (*models.UserPreference, error) {
	pref := &models.UserPreference{}
	query := `SELECT id, user_id, profile_visibility, created_at, updated_at FROM user_preferences WHERE user_id = $1`
	err := r.db.QueryRow(ctx, query, userID).Scan(&pref.ID, &pref.UserID, &pref.ProfileVisibility, &pref.CreatedAt, &pref.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return pref, nil
}

func (r *ProfileRepository) CreatePreferences(ctx context.Context, p *models.UserPreference) error {
	query := `INSERT INTO user_preferences (id, user_id, profile_visibility, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, p.ID, p.UserID, p.ProfileVisibility, p.CreatedAt, p.UpdatedAt)
	return err
}

func (r *ProfileRepository) UpdatePreferences(ctx context.Context, p *models.UserPreference) error {
	query := `UPDATE user_preferences SET profile_visibility = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`
	_, err := r.db.Exec(ctx, query, p.ProfileVisibility, p.UserID)
	return err
}
