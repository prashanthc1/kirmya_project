package service

import (
	"context"
	"kirmya/internal/profile/models"
	"kirmya/internal/profile/repository"
	"time"

	"github.com/google/uuid"
)

type ProfileService struct {
	repo *repository.ProfileRepository
}

func NewProfileService(repo *repository.ProfileRepository) *ProfileService {
	return &ProfileService{repo: repo}
}

// GetOrCreateProfile retrieves the profile for a user, or creates a default one if none exists.
func (s *ProfileService) GetOrCreateProfile(ctx context.Context, userID uuid.UUID) (*models.UserProfile, error) {
	p, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if p == nil {
		// Initialize default profile
		p = &models.UserProfile{
			ID:                         uuid.New(),
			UserID:                     userID,
			Headline:                   "Professional at Kirmya",
			Summary:                    "",
			AvailabilityStatus:         "looking_for_networking",
			ProfileCompletedPercentage: 25, // default initialized fields score (headline + availability status)
			Volunteering:               "",
			Publications:               "",
			Licenses:                   "",
			CreatedAt:                  time.Now(),
			UpdatedAt:                  time.Now(),
		}
		if err := s.repo.Create(ctx, p); err != nil {
			return nil, err
		}
	}

	return p, nil
}

// CalculateAndUpdateCompletion scores profile progress and saves updates.
func (s *ProfileService) CalculateAndUpdateCompletion(ctx context.Context, profileID uuid.UUID, userID uuid.UUID) (int, error) {
	p, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return 0, err
	}

	score := 0
	if p.Headline != "" && p.Headline != "Professional at Kirmya" {
		score += 10
	}
	if p.Summary != "" {
		score += 15
	}
	if len(p.Skills) > 0 {
		score += 20
	}
	if len(p.Certifications) > 0 {
		score += 15
	}
	if len(p.Projects) > 0 {
		score += 15
	}
	if len(p.Languages) > 0 {
		score += 10
	}
	if p.AvailabilityStatus != "" {
		score += 15
	}

	if score > 100 {
		score = 100
	}

	if score != p.ProfileCompletedPercentage {
		p.ProfileCompletedPercentage = score
		if err := s.repo.Update(ctx, p); err != nil {
			return 0, err
		}
	}

	return score, nil
}

func (s *ProfileService) UpdateProfile(ctx context.Context, userID uuid.UUID, headline, summary, availability, volunteering, publications, licenses string) (*models.UserProfile, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	p.Headline = headline
	p.Summary = summary
	p.AvailabilityStatus = availability
	p.Volunteering = volunteering
	p.Publications = publications
	p.Licenses = licenses

	if err := s.repo.Update(ctx, p); err != nil {
		return nil, err
	}

	_, err = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	if err != nil {
		return nil, err
	}

	return s.repo.GetByUserID(ctx, userID)
}

// Skills CRUD
func (s *ProfileService) AddSkill(ctx context.Context, userID uuid.UUID, name, proficiency string) ([]models.UserSkill, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	skill := &models.UserSkill{
		ID:               uuid.New(),
		ProfileID:        p.ID,
		Name:             name,
		ProficiencyLevel: proficiency,
	}

	if err := s.repo.AddSkill(ctx, skill); err != nil {
		return nil, err
	}

	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return s.repo.GetSkills(ctx, p.ID)
}

func (s *ProfileService) DeleteSkill(ctx context.Context, userID uuid.UUID, skillID uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if err := s.repo.DeleteSkill(ctx, p.ID, skillID); err != nil {
		return err
	}

	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return nil
}

// Certifications CRUD
func (s *ProfileService) AddCertification(ctx context.Context, userID uuid.UUID, name, org string, issueDate, expDate *time.Time, credID, credURL string) ([]models.UserCertification, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	cert := &models.UserCertification{
		ID:                  uuid.New(),
		ProfileID:           p.ID,
		Name:                name,
		IssuingOrganization: org,
		IssueDate:           issueDate,
		ExpirationDate:      expDate,
		CredentialID:        credID,
		CredentialURL:       credURL,
	}

	if err := s.repo.AddCertification(ctx, cert); err != nil {
		return nil, err
	}

	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return s.repo.GetCertifications(ctx, p.ID)
}

func (s *ProfileService) DeleteCertification(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if err := s.repo.DeleteCertification(ctx, p.ID, id); err != nil {
		return err
	}

	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return nil
}

// Projects CRUD
func (s *ProfileService) AddProject(ctx context.Context, userID uuid.UUID, title, desc, url string, startDate, endDate *time.Time) ([]models.UserProject, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	project := &models.UserProject{
		ID:          uuid.New(),
		ProfileID:   p.ID,
		Title:       title,
		Description: desc,
		URL:         url,
		StartDate:   startDate,
		EndDate:     endDate,
	}

	if err := s.repo.AddProject(ctx, project); err != nil {
		return nil, err
	}

	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return s.repo.GetProjects(ctx, p.ID)
}

func (s *ProfileService) DeleteProject(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if err := s.repo.DeleteProject(ctx, p.ID, id); err != nil {
		return err
	}

	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return nil
}

// Languages CRUD
func (s *ProfileService) AddLanguage(ctx context.Context, userID uuid.UUID, name, proficiency string) ([]models.UserLanguage, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	lang := &models.UserLanguage{
		ID:          uuid.New(),
		ProfileID:   p.ID,
		Name:        name,
		Proficiency: proficiency,
	}

	if err := s.repo.AddLanguage(ctx, lang); err != nil {
		return nil, err
	}

	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return s.repo.GetLanguages(ctx, p.ID)
}

func (s *ProfileService) DeleteLanguage(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if err := s.repo.DeleteLanguage(ctx, p.ID, id); err != nil {
		return err
	}

	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return nil
}

// Achievements CRUD
func (s *ProfileService) AddAchievement(ctx context.Context, userID uuid.UUID, title, desc string, dateAchieved *time.Time) ([]models.UserAchievement, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	ach := &models.UserAchievement{
		ID:           uuid.New(),
		ProfileID:    p.ID,
		Title:        title,
		Description:  desc,
		DateAchieved: dateAchieved,
	}

	if err := s.repo.AddAchievement(ctx, ach); err != nil {
		return nil, err
	}

	return s.repo.GetAchievements(ctx, p.ID)
}

func (s *ProfileService) DeleteAchievement(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	return s.repo.DeleteAchievement(ctx, p.ID, id)
}

// UserPreferences CRUD
func (s *ProfileService) GetOrCreatePreferences(ctx context.Context, userID uuid.UUID) (*models.UserPreference, error) {
	pref, err := s.repo.GetPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	if pref == nil {
		pref = &models.UserPreference{
			ID:                uuid.New(),
			UserID:            userID,
			ProfileVisibility: "public",
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}
		if err := s.repo.CreatePreferences(ctx, pref); err != nil {
			return nil, err
		}
	}

	return pref, nil
}

func (s *ProfileService) UpdatePreferences(ctx context.Context, userID uuid.UUID, visibility string) (*models.UserPreference, error) {
	pref, err := s.GetOrCreatePreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	pref.ProfileVisibility = visibility
	if err := s.repo.UpdatePreferences(ctx, pref); err != nil {
		return nil, err
	}

	return s.repo.GetPreferences(ctx, userID)
}
