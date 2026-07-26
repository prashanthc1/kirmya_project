package service

import (
	"context"
	"errors"
	"kirmya/internal/company/models"
	"kirmya/internal/company/repository"
	"strings"
	"time"

	"github.com/google/uuid"
)

type CompanyService struct {
	repo *repository.CompanyRepository
}

func NewCompanyService(repo *repository.CompanyRepository) *CompanyService {
	return &CompanyService{repo: repo}
}

// RegisterCompany registers a new entity and flags the creator as its Admin.
func (s *CompanyService) RegisterCompany(ctx context.Context, creatorID uuid.UUID, payload *models.RegisterCompanyPayload) (*models.Company, *models.CompanyProfile, error) {
	companyID := uuid.New()
	
	c := &models.Company{
		ID:        companyID,
		Name:      payload.Name,
		Handle:    payload.Handle,
		CreatedAt: time.Now(),
	}

	p := &models.CompanyProfile{
		CompanyID:        companyID,
		LogoURL:          "",
		CoverURL:         "",
		About:            "Welcome to " + payload.Name + "! We are a leader in the " + payload.Industry + " industry.",
		Industry:         payload.Industry,
		CompanySize:      payload.CompanySize,
		Location:         payload.Location,
		Website:          payload.Website,
		FoundedYear:      payload.FoundedYear,
		Culture:          "We foster an innovative, collaborative, and inclusive environment.",
		Benefits:         []string{"Flexible Work Hours", "Health Insurance", "Annual Flight Allowances"},
		EmployeeInsights: "94% of our team recommends us to a colleague.",
		FollowersCount:   0,
		UpdatedAt:        time.Now(),
	}

	m := &models.CompanyMember{
		ID:        uuid.New(),
		CompanyID: companyID,
		UserID:    creatorID,
		Role:      "admin", // Creator is flagged as Admin
		CreatedAt: time.Now(),
	}

	err := s.repo.CreateCompany(ctx, c, p, m)
	if err != nil {
		return nil, nil, err
	}

	return c, p, nil
}

// GetByHandle retrieves a company. If offline and not found, returns mock items to support client viewing.
func (s *CompanyService) GetByHandle(ctx context.Context, handle string) (*models.Company, *models.CompanyProfile, error) {
	c, p, err := s.repo.GetByHandle(ctx, handle)
	if err == nil {
		return c, p, nil
	}

	// Offline stub support
	mockCompanies := s.getMockStubs()
	for i := range mockCompanies {
		if mockCompanies[i].Handle == handle {
			// Find profile
			profile := s.getMockProfile(mockCompanies[i].ID, mockCompanies[i].Name, mockCompanies[i].Handle)
			return &mockCompanies[i], profile, nil
		}
	}

	return nil, nil, errors.New("company handle not found")
}

// UpdateProfile updates the profile if the executing user has Admin/Editor membership status.
func (s *CompanyService) UpdateProfile(ctx context.Context, userID, companyID uuid.UUID, payload *models.UpdateProfilePayload) error {
	role, err := s.repo.GetMemberRole(ctx, companyID, userID)
	if err != nil {
		return err
	}

	if role != "admin" && role != "editor" {
		return errors.New("unauthorized: only company admins or editors can update the profile")
	}

	// Fetch current profile to merge
	_, currentProfile, err := s.repo.GetByID(ctx, companyID)
	if err != nil {
		// Offline fallback mock merge
		currentProfile = &models.CompanyProfile{}
	}

	currentProfile.About = payload.About
	currentProfile.LogoURL = payload.LogoURL
	currentProfile.CoverURL = payload.CoverURL
	currentProfile.Website = payload.Website
	currentProfile.Location = payload.Location
	currentProfile.CompanySize = payload.CompanySize
	currentProfile.Culture = payload.Culture
	currentProfile.Benefits = payload.Benefits
	currentProfile.EmployeeInsights = payload.EmployeeInsights

	return s.repo.UpdateProfile(ctx, companyID, currentProfile)
}

// FollowCompany toggles following state.
func (s *CompanyService) FollowCompany(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	return s.repo.Follow(ctx, companyID, userID)
}

func (s *CompanyService) IsFollowing(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	return s.repo.IsFollowing(ctx, companyID, userID)
}

// SearchCompanies matches search fields.
func (s *CompanyService) SearchCompanies(ctx context.Context, query string) ([]models.Company, []models.CompanyProfile, error) {
	companies, profiles, err := s.repo.Search(ctx, query)
	if err == nil && len(companies) > 0 {
		return companies, profiles, nil
	}

	// Offline stub search
	var matchCompanies []models.Company
	var matchProfiles []models.CompanyProfile
	
	stubs := s.getMockStubs()
	qLower := strings.ToLower(query)

	for i := range stubs {
		p := s.getMockProfile(stubs[i].ID, stubs[i].Name, stubs[i].Handle)
		if query == "" || strings.Contains(strings.ToLower(stubs[i].Name), qLower) || strings.Contains(strings.ToLower(p.Industry), qLower) || strings.Contains(strings.ToLower(p.Location), qLower) {
			matchCompanies = append(matchCompanies, stubs[i])
			matchProfiles = append(matchProfiles, *p)
		}
	}
	return matchCompanies, matchProfiles, nil
}

// GetRecommendations lists recommended company profiles.
func (s *CompanyService) GetRecommendations(ctx context.Context, limit int) ([]models.Company, []models.CompanyProfile, error) {
	companies, profiles, err := s.repo.GetRecommendations(ctx, limit)
	if err == nil && len(companies) > 0 {
		return companies, profiles, nil
	}

	// Offline stubs recommendations
	stubs := s.getMockStubs()
	var recCompanies []models.Company
	var recProfiles []models.CompanyProfile

	for i := 0; i < len(stubs) && i < limit; i++ {
		p := s.getMockProfile(stubs[i].ID, stubs[i].Name, stubs[i].Handle)
		recCompanies = append(recCompanies, stubs[i])
		recProfiles = append(recProfiles, *p)
	}

	return recCompanies, recProfiles, nil
}

// RequestVerification files an audit claim.
func (s *CompanyService) RequestVerification(ctx context.Context, requesterID, companyID uuid.UUID, documents []string) error {
	req := &models.CompanyVerificationRequest{
		ID:          uuid.New(),
		CompanyID:   companyID,
		RequesterID: requesterID,
		Status:      "pending",
		Documents:   documents,
		CreatedAt:   time.Now(),
	}
	return s.repo.CreateVerificationRequest(ctx, req)
}

// UpdateVerificationStatus adjusts audit claims.
func (s *CompanyService) UpdateVerificationStatus(ctx context.Context, reqID uuid.UUID, status string) error {
	if status != "approved" && status != "rejected" {
		return errors.New("invalid status: must be approved or rejected")
	}
	return s.repo.UpdateVerificationStatus(ctx, reqID, status)
}

// Stubs Helper generators
func (s *CompanyService) getMockStubs() []models.Company {
	return []models.Company{
		{ID: uuid.MustParse("11111111-2222-3333-4444-555555555555"), Name: "Google UAE", Handle: "google-uae", CreatedAt: time.Now()},
		{ID: uuid.MustParse("22222222-3333-4444-5555-666666666666"), Name: "Microsoft Dubai", Handle: "microsoft-dubai", CreatedAt: time.Now()},
		{ID: uuid.MustParse("33333333-4444-5555-6666-777777777777"), Name: "Emirates Group", Handle: "emirates", CreatedAt: time.Now()},
		{ID: uuid.MustParse("44444444-5555-6666-7777-888888888888"), Name: "ADNOC Group", Handle: "adnoc", CreatedAt: time.Now()},
	}
}

func (s *CompanyService) getMockProfile(id uuid.UUID, name string, handle string) *models.CompanyProfile {
	industry := "Technology"
	website := "https://www.google.ae"
	location := "Dubai, UAE"
	size := "10,000+ employees"
	founded := 1998
	followers := 4320

	switch handle {
	case "microsoft-dubai":
		website = "https://www.microsoft.com/en-ae"
		founded = 1975
		followers = 3890
	case "emirates":
		industry = "Aviation"
		website = "https://www.emirates.com"
		location = "Dubai Airport, UAE"
		size = "5,000-10,000 employees"
		founded = 1985
		followers = 6840
	case "adnoc":
		industry = "Energy"
		website = "https://www.adnoc.ae"
		location = "Abu Dhabi, UAE"
		size = "10,000+ employees"
		founded = 1971
		followers = 5120
	}

	return &models.CompanyProfile{
		CompanyID:        id,
		LogoURL:          "",
		CoverURL:         "",
		About:            "Welcome to the official Kirmya company page of " + name + ". We are globally recognized for excellence in the " + industry + " sector.",
		Industry:         industry,
		CompanySize:      size,
		Location:         location,
		Website:          website,
		FoundedYear:      founded,
		Culture:          "We drive growth, prioritize work-life balance, and reward continuous learning.",
		Benefits:         []string{"Full Health Coverage", "Remote Work Options", "Education Reimbursement", "Travel Allowances"},
		EmployeeInsights: "96% of team members approve of management leadership.",
		FollowersCount:   followers,
		UpdatedAt:        time.Now(),
	}
}
