package repository

import (
	"context"
	"encoding/json"
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

func (r *ProfileRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.UserProfile, error) {
	p := &models.UserProfile{}
	query := `
		SELECT id, user_id, COALESCE(username, ''), COALESCE(avatar_url, ''), COALESCE(cover_url, ''),
		       headline, summary, COALESCE(location, ''), COALESCE(country, ''), COALESCE(industry, ''),
		       COALESCE(current_position, ''), availability_status, open_to_work, open_to_recruiters,
		       target_roles, preferred_locations, profile_completed_percentage, volunteering, publications,
		       licenses, verification_status, COALESCE(verification_notes, ''), is_restricted, is_private,
		       profile_views_count, search_appearances_count, created_at, updated_at
		FROM user_profiles WHERE user_id = $1
	`

	var targetRolesJSON, preferredLocsJSON []byte
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.ID, &p.UserID, &p.Username, &p.AvatarURL, &p.CoverURL,
		&p.Headline, &p.Summary, &p.Location, &p.Country, &p.Industry,
		&p.CurrentPosition, &p.AvailabilityStatus, &p.OpenToWork, &p.OpenToRecruiters,
		&targetRolesJSON, &preferredLocsJSON, &p.ProfileCompletedPercentage, &p.Volunteering, &p.Publications,
		&p.Licenses, &p.VerificationStatus, &p.VerificationNotes, &p.IsRestricted, &p.IsPrivate,
		&p.ProfileViewsCount, &p.SearchAppearancesCount, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	_ = json.Unmarshal(targetRolesJSON, &p.TargetRoles)
	_ = json.Unmarshal(preferredLocsJSON, &p.PreferredLocations)

	// Fetch user details
	_ = r.db.QueryRow(ctx, "SELECT first_name, last_name FROM users WHERE id = $1", userID).Scan(&p.FirstName, &p.LastName)

	// Fetch sub-tables
	work, _ := r.GetWorkExperiences(ctx, p.ID)
	p.WorkExperiences = work

	edu, _ := r.GetEducations(ctx, p.ID)
	p.Educations = edu

	skills, _ := r.GetSkills(ctx, p.ID)
	p.Skills = skills

	certs, _ := r.GetCertifications(ctx, p.ID)
	p.Certifications = certs

	projects, _ := r.GetProjects(ctx, p.ID)
	p.Projects = projects

	languages, _ := r.GetLanguages(ctx, p.ID)
	p.Languages = languages

	achievements, _ := r.GetAchievements(ctx, p.ID)
	p.Achievements = achievements

	return p, nil
}

func (r *ProfileRepository) GetByUsername(ctx context.Context, username string) (*models.UserProfile, error) {
	var userID uuid.UUID
	err := r.db.QueryRow(ctx, "SELECT user_id FROM user_profiles WHERE username = $1", username).Scan(&userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return r.GetByUserID(ctx, userID)
}

func (r *ProfileRepository) Create(ctx context.Context, p *models.UserProfile) error {
	targetRolesJSON, _ := json.Marshal(p.TargetRoles)
	preferredLocsJSON, _ := json.Marshal(p.PreferredLocations)
	query := `
		INSERT INTO user_profiles (
			id, user_id, username, avatar_url, cover_url, headline, summary, location, country, industry,
			current_position, availability_status, open_to_work, open_to_recruiters, target_roles, preferred_locations,
			profile_completed_percentage, volunteering, publications, licenses, verification_status, verification_notes,
			is_restricted, is_private, profile_views_count, search_appearances_count, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
	`
	_, err := r.db.Exec(ctx, query,
		p.ID, p.UserID, p.Username, p.AvatarURL, p.CoverURL, p.Headline, p.Summary, p.Location, p.Country, p.Industry,
		p.CurrentPosition, p.AvailabilityStatus, p.OpenToWork, p.OpenToRecruiters, targetRolesJSON, preferredLocsJSON,
		p.ProfileCompletedPercentage, p.Volunteering, p.Publications, p.Licenses, p.VerificationStatus, p.VerificationNotes,
		p.IsRestricted, p.IsPrivate, p.ProfileViewsCount, p.SearchAppearancesCount, p.CreatedAt, p.UpdatedAt,
	)
	return err
}

func (r *ProfileRepository) Update(ctx context.Context, p *models.UserProfile) error {
	targetRolesJSON, _ := json.Marshal(p.TargetRoles)
	preferredLocsJSON, _ := json.Marshal(p.PreferredLocations)
	query := `
		UPDATE user_profiles SET
			username = $1, headline = $2, summary = $3, location = $4, country = $5, industry = $6,
			current_position = $7, availability_status = $8, open_to_work = $9, open_to_recruiters = $10,
			target_roles = $11, preferred_locations = $12, profile_completed_percentage = $13,
			volunteering = $14, publications = $15, licenses = $16, updated_at = CURRENT_TIMESTAMP
		WHERE id = $17
	`
	_, err := r.db.Exec(ctx, query,
		p.Username, p.Headline, p.Summary, p.Location, p.Country, p.Industry,
		p.CurrentPosition, p.AvailabilityStatus, p.OpenToWork, p.OpenToRecruiters,
		targetRolesJSON, preferredLocsJSON, p.ProfileCompletedPercentage,
		p.Volunteering, p.Publications, p.Licenses, p.ID,
	)
	return err
}

// Work Experience
func (r *ProfileRepository) GetWorkExperiences(ctx context.Context, profileID uuid.UUID) ([]models.UserWorkExperience, error) {
	query := `SELECT id, profile_id, company, job_title, employment_type, location, start_date, end_date, is_current_job, description, skills_used, achievements, sort_order, created_at, updated_at FROM user_work_experiences WHERE profile_id = $1 ORDER BY start_date DESC`
	rows, err := r.db.Query(ctx, query, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.UserWorkExperience
	for rows.Next() {
		var w models.UserWorkExperience
		var skillsJSON []byte
		if err := rows.Scan(&w.ID, &w.ProfileID, &w.Company, &w.JobTitle, &w.EmploymentType, &w.Location, &w.StartDate, &w.EndDate, &w.IsCurrentJob, &w.Description, &skillsJSON, &w.Achievements, &w.SortOrder, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(skillsJSON, &w.SkillsUsed)
		list = append(list, w)
	}
	return list, nil
}

func (r *ProfileRepository) AddWorkExperience(ctx context.Context, w *models.UserWorkExperience) error {
	skillsJSON, _ := json.Marshal(w.SkillsUsed)
	query := `INSERT INTO user_work_experiences (id, profile_id, company, job_title, employment_type, location, start_date, end_date, is_current_job, description, skills_used, achievements, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`
	_, err := r.db.Exec(ctx, query, w.ID, w.ProfileID, w.Company, w.JobTitle, w.EmploymentType, w.Location, w.StartDate, w.EndDate, w.IsCurrentJob, w.Description, skillsJSON, w.Achievements, w.SortOrder)
	return err
}

func (r *ProfileRepository) UpdateWorkExperience(ctx context.Context, w *models.UserWorkExperience) error {
	skillsJSON, _ := json.Marshal(w.SkillsUsed)
	query := `UPDATE user_work_experiences SET company = $1, job_title = $2, employment_type = $3, location = $4, start_date = $5, end_date = $6, is_current_job = $7, description = $8, skills_used = $9, achievements = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11 AND profile_id = $12`
	_, err := r.db.Exec(ctx, query, w.Company, w.JobTitle, w.EmploymentType, w.Location, w.StartDate, w.EndDate, w.IsCurrentJob, w.Description, skillsJSON, w.Achievements, w.ID, w.ProfileID)
	return err
}

func (r *ProfileRepository) DeleteWorkExperience(ctx context.Context, profileID uuid.UUID, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM user_work_experiences WHERE id = $1 AND profile_id = $2", id, profileID)
	return err
}

// Education
func (r *ProfileRepository) GetEducations(ctx context.Context, profileID uuid.UUID) ([]models.UserEducation, error) {
	query := `SELECT id, profile_id, institution, degree, field_of_study, start_date, end_date, grade, description, sort_order, created_at, updated_at FROM user_educations WHERE profile_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.UserEducation
	for rows.Next() {
		var e models.UserEducation
		if err := rows.Scan(&e.ID, &e.ProfileID, &e.Institution, &e.Degree, &e.FieldOfStudy, &e.StartDate, &e.EndDate, &e.Grade, &e.Description, &e.SortOrder, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}

func (r *ProfileRepository) AddEducation(ctx context.Context, e *models.UserEducation) error {
	query := `INSERT INTO user_educations (id, profile_id, institution, degree, field_of_study, start_date, end_date, grade, description, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err := r.db.Exec(ctx, query, e.ID, e.ProfileID, e.Institution, e.Degree, e.FieldOfStudy, e.StartDate, e.EndDate, e.Grade, e.Description, e.SortOrder)
	return err
}

func (r *ProfileRepository) UpdateEducation(ctx context.Context, e *models.UserEducation) error {
	query := `UPDATE user_educations SET institution = $1, degree = $2, field_of_study = $3, start_date = $4, end_date = $5, grade = $6, description = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND profile_id = $9`
	_, err := r.db.Exec(ctx, query, e.Institution, e.Degree, e.FieldOfStudy, e.StartDate, e.EndDate, e.Grade, e.Description, e.ID, e.ProfileID)
	return err
}

func (r *ProfileRepository) DeleteEducation(ctx context.Context, profileID uuid.UUID, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM user_educations WHERE id = $1 AND profile_id = $2", id, profileID)
	return err
}

// Skills
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

func (r *ProfileRepository) UpdateCertification(ctx context.Context, c *models.UserCertification) error {
	query := `UPDATE user_certifications SET name = $1, issuing_organization = $2, issue_date = $3, expiration_date = $4, credential_id = $5, credential_url = $6 WHERE id = $7 AND profile_id = $8`
	_, err := r.db.Exec(ctx, query, c.Name, c.IssuingOrganization, c.IssueDate, c.ExpirationDate, c.CredentialID, c.CredentialURL, c.ID, c.ProfileID)
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

func (r *ProfileRepository) UpdateProject(ctx context.Context, p *models.UserProject) error {
	query := `UPDATE user_projects SET title = $1, description = $2, url = $3, start_date = $4, end_date = $5 WHERE id = $6 AND profile_id = $7`
	_, err := r.db.Exec(ctx, query, p.Title, p.Description, p.URL, p.StartDate, p.EndDate, p.ID, p.ProfileID)
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

func (r *ProfileRepository) UpdatePhoto(ctx context.Context, userID uuid.UUID, avatarURL string) error {
	_, err := r.db.Exec(ctx, "UPDATE user_profiles SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2", avatarURL, userID)
	return err
}

func (r *ProfileRepository) UpdateCover(ctx context.Context, userID uuid.UUID, coverURL string) error {
	_, err := r.db.Exec(ctx, "UPDATE user_profiles SET cover_url = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2", coverURL, userID)
	return err
}

func (r *ProfileRepository) CreateReport(ctx context.Context, reporterID, reportedUserID uuid.UUID, reason, desc string) error {
	query := `INSERT INTO user_profile_reports (id, reporter_id, reported_user_id, reason, description, status) VALUES ($1, $2, $3, $4, $5, 'pending')`
	_, err := r.db.Exec(ctx, query, uuid.New(), reporterID, reportedUserID, reason, desc)
	return err
}

func (r *ProfileRepository) AdminUpdateVerification(ctx context.Context, userID uuid.UUID, status, notes string) error {
	query := `UPDATE user_profiles SET verification_status = $1, verification_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3`
	_, err := r.db.Exec(ctx, query, status, notes, userID)
	return err
}

func (r *ProfileRepository) AdminUpdateRestriction(ctx context.Context, userID uuid.UUID, isRestricted bool) error {
	query := `UPDATE user_profiles SET is_restricted = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`
	_, err := r.db.Exec(ctx, query, isRestricted, userID)
	return err
}
