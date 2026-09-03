package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"kirmya/internal/profile/models"
	"kirmya/internal/profile/repository"
	"kirmya/internal/shared/cache"

	"github.com/google/uuid"
)

var (
	ErrInvalidDates    = errors.New("end date cannot precede start date")
	ErrReservedName    = errors.New("this username is reserved by the platform")
	ErrInvalidUsername = errors.New("username must be 3-30 alphanumeric characters or underscores")
)

var reservedUsernames = map[string]bool{
	"admin": true, "administrator": true, "support": true, "help": true, "api": true,
	"settings": true, "login": true, "signup": true, "root": true, "kirmya": true,
	"security": true, "privacy": true, "jobs": true, "companies": true,
}

type ProfileService struct {
	repo        *repository.ProfileRepository
	cache       cache.MultiTierCache
	mu          sync.RWMutex
	memProfiles map[uuid.UUID]*models.UserProfile
}

func NewProfileService(repo *repository.ProfileRepository) *ProfileService {
	return &ProfileService{
		repo:        repo,
		memProfiles: make(map[uuid.UUID]*models.UserProfile),
	}
}

func (s *ProfileService) SetCache(c cache.Cache) {
	if c != nil {
		s.cache = cache.NewMultiTierCache(c)
	}
}

func (s *ProfileService) GetOrCreateProfile(ctx context.Context, userID uuid.UUID) (*models.UserProfile, error) {
	var p *models.UserProfile
	if s.repo != nil {
		var err error
		p, err = s.repo.GetByUserID(ctx, userID)
		if err != nil {
			return nil, err
		}
	} else {
		s.mu.RLock()
		if s.memProfiles != nil {
			p = s.memProfiles[userID]
		}
		s.mu.RUnlock()
	}

	if p == nil {
		defaultUsername := fmt.Sprintf("user_%s", userID.String()[:8])
		p = &models.UserProfile{
			ID:                         uuid.New(),
			UserID:                     userID,
			Username:                   defaultUsername,
			Headline:                   "Professional at Kirmya",
			Summary:                    "",
			AvailabilityStatus:         "looking_for_networking",
			OpenToWork:                 true,
			OpenToRecruiters:           true,
			TargetRoles:                []string{},
			PreferredLocations:         []string{},
			ProfileCompletedPercentage: 25,
			VerificationStatus:         "unverified",
			CreatedAt:                  time.Now(),
			UpdatedAt:                  time.Now(),
		}
		if s.repo != nil {
			if err := s.repo.Create(ctx, p); err != nil {
				return nil, err
			}
		} else {
			s.mu.Lock()
			if s.memProfiles == nil {
				s.memProfiles = make(map[uuid.UUID]*models.UserProfile)
			}
			s.memProfiles[userID] = p
			s.mu.Unlock()
		}
	}
	return p, nil
}

func (s *ProfileService) GetProfileByUsername(ctx context.Context, username string) (*models.UserProfile, error) {
	p, err := s.repo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, errors.New("profile not found")
	}
	if p.IsPrivate || p.IsRestricted {
		// Filter sensitive fields for restricted/private view
		p.Volunteering = ""
		p.Licenses = ""
		p.Publications = ""
	}
	return p, nil
}

func (s *ProfileService) CalculateAndUpdateCompletion(ctx context.Context, profileID uuid.UUID, userID uuid.UUID) (int, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return 0, err
	}

	score := 0
	if p.AvatarURL != "" {
		score += 10
	}
	if p.Headline != "" && p.Headline != "Professional at Kirmya" {
		score += 10
	}
	if p.Summary != "" {
		score += 15
	}
	if len(p.WorkExperiences) > 0 {
		score += 20
	}
	if len(p.Educations) > 0 {
		score += 15
	}
	if len(p.Skills) > 0 {
		score += 10
	}
	if len(p.Certifications) > 0 {
		score += 10
	}
	if len(p.Projects) > 0 {
		score += 5
	}
	if len(p.Languages) > 0 {
		score += 5
	}

	if score > 100 {
		score = 100
	}

	if score != p.ProfileCompletedPercentage {
		p.ProfileCompletedPercentage = score
		if s.repo != nil {
			_ = s.repo.Update(ctx, p)
		}
	}

	return score, nil
}

func (s *ProfileService) UpdateProfile(ctx context.Context, userID uuid.UUID, dto *models.UpdateProfileDTO) (*models.UserProfile, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	if dto.Username != "" && dto.Username != p.Username {
		cleanUser := strings.ToLower(strings.TrimSpace(dto.Username))
		if reservedUsernames[cleanUser] {
			return nil, ErrReservedName
		}
		if match, _ := regexp.MatchString(`^[a-z0-9_]{3,30}$`, cleanUser); !match {
			return nil, ErrInvalidUsername
		}
		p.Username = cleanUser
	}

	p.Headline = dto.Headline
	p.Summary = dto.Summary
	p.Location = dto.Location
	p.Country = dto.Country
	p.Industry = dto.Industry
	p.CurrentPosition = dto.CurrentPosition
	p.AvailabilityStatus = dto.AvailabilityStatus
	p.OpenToWork = dto.OpenToWork
	p.OpenToRecruiters = dto.OpenToRecruiters
	p.TargetRoles = dto.TargetRoles
	p.PreferredLocations = dto.PreferredLocations
	p.Volunteering = dto.Volunteering
	p.Publications = dto.Publications
	p.Licenses = dto.Licenses

	if s.repo != nil {
		if err := s.repo.Update(ctx, p); err != nil {
			return nil, err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return s.repo.GetByUserID(ctx, userID)
	}

	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return p, nil
}

func (s *ProfileService) UpdateProfileAbout(ctx context.Context, userID uuid.UUID, summary string) (*models.UserProfile, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}
	p.Summary = summary
	if s.repo != nil {
		if err := s.repo.Update(ctx, p); err != nil {
			return nil, err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return s.repo.GetByUserID(ctx, userID)
	}
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return p, nil
}

func (s *ProfileService) UpdateProfileHeadline(ctx context.Context, userID uuid.UUID, headline string) (*models.UserProfile, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}
	p.Headline = headline
	if s.repo != nil {
		if err := s.repo.Update(ctx, p); err != nil {
			return nil, err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return s.repo.GetByUserID(ctx, userID)
	}
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return p, nil
}

// Work Experience CRUD
func (s *ProfileService) AddWorkExperience(ctx context.Context, userID uuid.UUID, dto *models.WorkExperienceDTO) ([]models.UserWorkExperience, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	start, err := time.Parse("2006-01-02", dto.StartDate)
	if err != nil {
		start = time.Now()
	}
	var end *time.Time
	if dto.EndDate != "" && !dto.IsCurrentJob {
		if parsedEnd, err := time.Parse("2006-01-02", dto.EndDate); err == nil {
			if parsedEnd.Before(start) {
				return nil, ErrInvalidDates
			}
			end = &parsedEnd
		}
	}

	exp := &models.UserWorkExperience{
		ID:             uuid.New(),
		ProfileID:      p.ID,
		Company:        dto.Company,
		JobTitle:       dto.JobTitle,
		EmploymentType: dto.EmploymentType,
		Location:       dto.Location,
		StartDate:      start,
		EndDate:        end,
		IsCurrentJob:   dto.IsCurrentJob,
		Description:    dto.Description,
		SkillsUsed:     dto.SkillsUsed,
		Achievements:   dto.Achievements,
	}

	if s.repo != nil {
		if err := s.repo.AddWorkExperience(ctx, exp); err != nil {
			return nil, err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return s.repo.GetWorkExperiences(ctx, p.ID)
	}

	p.WorkExperiences = append(p.WorkExperiences, *exp)
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return p.WorkExperiences, nil
}

func (s *ProfileService) UpdateWorkExperience(ctx context.Context, userID uuid.UUID, id uuid.UUID, dto *models.WorkExperienceDTO) ([]models.UserWorkExperience, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	start, _ := time.Parse("2006-01-02", dto.StartDate)
	var end *time.Time
	if dto.EndDate != "" && !dto.IsCurrentJob {
		if parsedEnd, err := time.Parse("2006-01-02", dto.EndDate); err == nil {
			if parsedEnd.Before(start) {
				return nil, ErrInvalidDates
			}
			end = &parsedEnd
		}
	}

	exp := &models.UserWorkExperience{
		ID:             id,
		ProfileID:      p.ID,
		Company:        dto.Company,
		JobTitle:       dto.JobTitle,
		EmploymentType: dto.EmploymentType,
		Location:       dto.Location,
		StartDate:      start,
		EndDate:        end,
		IsCurrentJob:   dto.IsCurrentJob,
		Description:    dto.Description,
		SkillsUsed:     dto.SkillsUsed,
		Achievements:   dto.Achievements,
	}

	if s.repo != nil {
		if err := s.repo.UpdateWorkExperience(ctx, exp); err != nil {
			return nil, err
		}
		return s.repo.GetWorkExperiences(ctx, p.ID)
	}

	for i, existing := range p.WorkExperiences {
		if existing.ID == id {
			p.WorkExperiences[i] = *exp
			break
		}
	}
	return p.WorkExperiences, nil
}

func (s *ProfileService) DeleteWorkExperience(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}
	if s.repo != nil {
		if err := s.repo.DeleteWorkExperience(ctx, p.ID, id); err != nil {
			return err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return nil
	}

	filtered := make([]models.UserWorkExperience, 0, len(p.WorkExperiences))
	for _, existing := range p.WorkExperiences {
		if existing.ID != id {
			filtered = append(filtered, existing)
		}
	}
	p.WorkExperiences = filtered
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return nil
}

// Education CRUD
func (s *ProfileService) AddEducation(ctx context.Context, userID uuid.UUID, dto *models.EducationDTO) ([]models.UserEducation, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	var start, end *time.Time
	if dto.StartDate != "" {
		if t, err := time.Parse("2006-01-02", dto.StartDate); err == nil {
			start = &t
		}
	}
	if dto.EndDate != "" {
		if t, err := time.Parse("2006-01-02", dto.EndDate); err == nil {
			if start != nil && t.Before(*start) {
				return nil, ErrInvalidDates
			}
			end = &t
		}
	}

	edu := &models.UserEducation{
		ID:           uuid.New(),
		ProfileID:    p.ID,
		Institution:  dto.Institution,
		Degree:       dto.Degree,
		FieldOfStudy: dto.FieldOfStudy,
		StartDate:    start,
		EndDate:      end,
		Grade:        dto.Grade,
		Description:  dto.Description,
	}

	if s.repo != nil {
		if err := s.repo.AddEducation(ctx, edu); err != nil {
			return nil, err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return s.repo.GetEducations(ctx, p.ID)
	}

	p.Educations = append(p.Educations, *edu)
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return p.Educations, nil
}

func (s *ProfileService) UpdateEducation(ctx context.Context, userID uuid.UUID, id uuid.UUID, dto *models.EducationDTO) ([]models.UserEducation, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	var start, end *time.Time
	if dto.StartDate != "" {
		if t, err := time.Parse("2006-01-02", dto.StartDate); err == nil {
			start = &t
		}
	}
	if dto.EndDate != "" {
		if t, err := time.Parse("2006-01-02", dto.EndDate); err == nil {
			if start != nil && t.Before(*start) {
				return nil, ErrInvalidDates
			}
			end = &t
		}
	}

	edu := &models.UserEducation{
		ID:           id,
		ProfileID:    p.ID,
		Institution:  dto.Institution,
		Degree:       dto.Degree,
		FieldOfStudy: dto.FieldOfStudy,
		StartDate:    start,
		EndDate:      end,
		Grade:        dto.Grade,
		Description:  dto.Description,
	}

	if s.repo != nil {
		if err := s.repo.UpdateEducation(ctx, edu); err != nil {
			return nil, err
		}
		return s.repo.GetEducations(ctx, p.ID)
	}

	for i, existing := range p.Educations {
		if existing.ID == id {
			p.Educations[i] = *edu
			break
		}
	}
	return p.Educations, nil
}

func (s *ProfileService) DeleteEducation(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}
	if s.repo != nil {
		if err := s.repo.DeleteEducation(ctx, p.ID, id); err != nil {
			return err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return nil
	}

	filtered := make([]models.UserEducation, 0, len(p.Educations))
	for _, existing := range p.Educations {
		if existing.ID != id {
			filtered = append(filtered, existing)
		}
	}
	p.Educations = filtered
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return nil
}

// Skills CRUD
func (s *ProfileService) AddSkill(ctx context.Context, userID uuid.UUID, name, proficiency string) ([]models.UserSkill, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	trimmedName := strings.TrimSpace(name)
	if trimmedName == "" {
		return nil, errors.New("skill name cannot be empty")
	}
	if len(trimmedName) > 100 {
		return nil, errors.New("skill name cannot exceed 100 characters")
	}

	prof := strings.TrimSpace(proficiency)
	if prof == "" {
		prof = "Intermediate"
	}

	// Normalization & duplicate protection
	for _, existing := range p.Skills {
		if strings.EqualFold(strings.TrimSpace(existing.Name), trimmedName) {
			return p.Skills, nil
		}
	}

	skill := &models.UserSkill{
		ID:               uuid.New(),
		ProfileID:        p.ID,
		Name:             trimmedName,
		ProficiencyLevel: prof,
	}

	if s.repo != nil {
		if err := s.repo.AddSkill(ctx, skill); err != nil {
			return nil, err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return s.repo.GetSkills(ctx, p.ID)
	}

	p.Skills = append(p.Skills, *skill)
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return p.Skills, nil
}

func (s *ProfileService) DeleteSkill(ctx context.Context, userID uuid.UUID, skillID uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if s.repo != nil {
		if err := s.repo.DeleteSkill(ctx, p.ID, skillID); err != nil {
			return err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return nil
	}

	filtered := make([]models.UserSkill, 0, len(p.Skills))
	for _, existing := range p.Skills {
		if existing.ID != skillID {
			filtered = append(filtered, existing)
		}
	}
	p.Skills = filtered
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

	if s.repo != nil {
		if err := s.repo.AddCertification(ctx, cert); err != nil {
			return nil, err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return s.repo.GetCertifications(ctx, p.ID)
	}

	p.Certifications = append(p.Certifications, *cert)
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return p.Certifications, nil
}

func (s *ProfileService) DeleteCertification(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if s.repo != nil {
		if err := s.repo.DeleteCertification(ctx, p.ID, id); err != nil {
			return err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return nil
	}

	filtered := make([]models.UserCertification, 0, len(p.Certifications))
	for _, existing := range p.Certifications {
		if existing.ID != id {
			filtered = append(filtered, existing)
		}
	}
	p.Certifications = filtered
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

	if s.repo != nil {
		if err := s.repo.AddProject(ctx, project); err != nil {
			return nil, err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return s.repo.GetProjects(ctx, p.ID)
	}

	p.Projects = append(p.Projects, *project)
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return p.Projects, nil
}

func (s *ProfileService) DeleteProject(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if s.repo != nil {
		if err := s.repo.DeleteProject(ctx, p.ID, id); err != nil {
			return err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return nil
	}

	filtered := make([]models.UserProject, 0, len(p.Projects))
	for _, existing := range p.Projects {
		if existing.ID != id {
			filtered = append(filtered, existing)
		}
	}
	p.Projects = filtered
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

	if s.repo != nil {
		if err := s.repo.AddLanguage(ctx, lang); err != nil {
			return nil, err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return s.repo.GetLanguages(ctx, p.ID)
	}

	p.Languages = append(p.Languages, *lang)
	_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	return p.Languages, nil
}

func (s *ProfileService) DeleteLanguage(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if s.repo != nil {
		if err := s.repo.DeleteLanguage(ctx, p.ID, id); err != nil {
			return err
		}
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		return nil
	}

	filtered := make([]models.UserLanguage, 0, len(p.Languages))
	for _, existing := range p.Languages {
		if existing.ID != id {
			filtered = append(filtered, existing)
		}
	}
	p.Languages = filtered
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

	if s.repo != nil {
		if err := s.repo.AddAchievement(ctx, ach); err != nil {
			return nil, err
		}
		return s.repo.GetAchievements(ctx, p.ID)
	}

	p.Achievements = append(p.Achievements, *ach)
	return p.Achievements, nil
}

func (s *ProfileService) DeleteAchievement(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return err
	}

	if s.repo != nil {
		return s.repo.DeleteAchievement(ctx, p.ID, id)
	}

	filtered := make([]models.UserAchievement, 0, len(p.Achievements))
	for _, existing := range p.Achievements {
		if existing.ID != id {
			filtered = append(filtered, existing)
		}
	}
	p.Achievements = filtered
	return nil
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

func (s *ProfileService) UpdatePhoto(ctx context.Context, userID uuid.UUID, avatarURL string) error {
	if s.repo != nil {
		if err := s.repo.UpdatePhoto(ctx, userID, avatarURL); err != nil {
			return err
		}
		p, _ := s.repo.GetByUserID(ctx, userID)
		if p != nil {
			_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
		}
		return nil
	}
	p, _ := s.GetOrCreateProfile(ctx, userID)
	if p != nil {
		p.AvatarURL = avatarURL
		_, _ = s.CalculateAndUpdateCompletion(ctx, p.ID, userID)
	}
	return nil
}

func (s *ProfileService) UpdateCover(ctx context.Context, userID uuid.UUID, coverURL string) error {
	if s.repo != nil {
		return s.repo.UpdateCover(ctx, userID, coverURL)
	}
	p, _ := s.GetOrCreateProfile(ctx, userID)
	if p != nil {
		p.CoverURL = coverURL
	}
	return nil
}

func (s *ProfileService) ReportProfile(ctx context.Context, reporterID, reportedUserID uuid.UUID, reason, desc string) error {
	return s.repo.CreateReport(ctx, reporterID, reportedUserID, reason, desc)
}

func (s *ProfileService) AdminVerifyProfile(ctx context.Context, userID uuid.UUID, status, notes string) error {
	return s.repo.AdminUpdateVerification(ctx, userID, status, notes)
}

func (s *ProfileService) AdminRestrictProfile(ctx context.Context, userID uuid.UUID, isRestricted bool) error {
	return s.repo.AdminUpdateRestriction(ctx, userID, isRestricted)
}

func (s *ProfileService) CalculateCompleteness(ctx context.Context, userID uuid.UUID) (*models.ProfileCompletenessDTO, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	missingSections := make([]string, 0)
	recommendations := make([]string, 0)

	if p.AvatarURL == "" {
		missingSections = append(missingSections, "photo")
		recommendations = append(recommendations, "Upload a professional profile photo")
	}
	if p.Headline == "" || p.Headline == "Professional at Kirmya" {
		missingSections = append(missingSections, "headline")
		recommendations = append(recommendations, "Add a custom professional headline")
	}
	if p.Summary == "" {
		missingSections = append(missingSections, "summary")
		recommendations = append(recommendations, "Add a professional summary")
	}
	if len(p.WorkExperiences) == 0 {
		missingSections = append(missingSections, "work_experience")
		recommendations = append(recommendations, "Add your work experiences")
	}
	if len(p.Educations) == 0 {
		missingSections = append(missingSections, "education")
		recommendations = append(recommendations, "Add your education history")
	}
	if len(p.Skills) == 0 {
		missingSections = append(missingSections, "skills")
		recommendations = append(recommendations, "Add relevant skills")
	}
	if len(p.Certifications) == 0 {
		missingSections = append(missingSections, "certifications")
		recommendations = append(recommendations, "Add licenses and certifications")
	}
	if len(p.Projects) == 0 {
		missingSections = append(missingSections, "projects")
		recommendations = append(recommendations, "Add portfolio projects")
	}
	if len(p.Languages) == 0 {
		missingSections = append(missingSections, "languages")
		recommendations = append(recommendations, "Add spoken languages")
	}

	percentage, _ := s.CalculateAndUpdateCompletion(ctx, p.ID, userID)

	return &models.ProfileCompletenessDTO{
		Percentage:        percentage,
		MissingSections:   missingSections,
		Recommendations:   recommendations,
		IsProfileComplete: percentage >= 80,
	}, nil
}

func (s *ProfileService) CheckResumeConsistency(ctx context.Context, userID uuid.UUID) (*models.ResumeConsistencyDTO, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	missingSkills := make([]string, 0)
	titleDiscrepancies := make([]string, 0)

	existingSkills := make(map[string]bool)
	for _, sk := range p.Skills {
		existingSkills[strings.ToLower(strings.TrimSpace(sk.Name))] = true
	}

	seenMissing := make(map[string]bool)
	for _, exp := range p.WorkExperiences {
		for _, sk := range exp.SkillsUsed {
			cleanSk := strings.ToLower(strings.TrimSpace(sk))
			if cleanSk != "" && !existingSkills[cleanSk] && !seenMissing[cleanSk] {
				seenMissing[cleanSk] = true
				missingSkills = append(missingSkills, sk)
			}
		}
	}

	if len(p.WorkExperiences) > 0 {
		latestExp := p.WorkExperiences[0]
		if p.CurrentPosition != "" && latestExp.JobTitle != "" {
			if !strings.EqualFold(strings.TrimSpace(p.CurrentPosition), strings.TrimSpace(latestExp.JobTitle)) {
				titleDiscrepancies = append(titleDiscrepancies, fmt.Sprintf("Current position '%s' does not match recent job title '%s'", p.CurrentPosition, latestExp.JobTitle))
			}
		}
	}

	score := 100 - (len(missingSkills) * 10) - (len(titleDiscrepancies) * 20)
	if score < 0 {
		score = 0
	}

	return &models.ResumeConsistencyDTO{
		Score:              score,
		MissingSkills:      missingSkills,
		TitleDiscrepancies: titleDiscrepancies,
		IsConsistent:       score >= 80 && len(titleDiscrepancies) == 0,
	}, nil
}

func (s *ProfileService) RequestVerification(ctx context.Context, userID uuid.UUID, payload models.VerificationRequestPayload) (*models.UserProfile, error) {
	if payload.DocumentType == "" || payload.DocumentURL == "" {
		return nil, errors.New("documentType and documentUrl are required")
	}

	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	p.VerificationStatus = "pending"
	p.VerificationNotes = fmt.Sprintf("Document: %s | URL: %s | Notes: %s", payload.DocumentType, payload.DocumentURL, payload.Notes)

	if s.repo != nil {
		if err := s.repo.AdminUpdateVerification(ctx, userID, p.VerificationStatus, p.VerificationNotes); err != nil {
			return nil, err
		}
	}

	return p, nil
}

func (s *ProfileService) UpdateCareerPreferences(ctx context.Context, userID uuid.UUID, payload models.CareerPreferencesDTO) (*models.UserProfile, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	p.AvailabilityStatus = payload.AvailabilityStatus
	p.OpenToWork = payload.OpenToWork
	p.OpenToRecruiters = payload.OpenToRecruiters
	if payload.TargetRoles != nil {
		p.TargetRoles = payload.TargetRoles
	}
	if payload.PreferredLocations != nil {
		p.PreferredLocations = payload.PreferredLocations
	}

	if s.repo != nil {
		if err := s.repo.Update(ctx, p); err != nil {
			return nil, err
		}
		return s.repo.GetByUserID(ctx, userID)
	}

	return p, nil
}

func (s *ProfileService) GetAnalytics(ctx context.Context, userID uuid.UUID) (*models.ProfileAnalyticsDTO, error) {
	p, err := s.GetOrCreateProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &models.ProfileAnalyticsDTO{
		ProfileViews:       p.ProfileViewsCount,
		SearchAppearances:  p.SearchAppearancesCount,
		ConnectionRequests: 0,
	}, nil
}

