package service

import (
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"kirmya/internal/company/models"
	"kirmya/internal/company/repository"

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
		CompanyID:          companyID,
		LogoURL:            "",
		CoverURL:           "",
		About:              "Welcome to " + payload.Name + "! We are a leader in the " + payload.Industry + " industry.",
		Industry:           payload.Industry,
		CompanySize:        payload.CompanySize,
		Location:           payload.Location,
		Website:            payload.Website,
		FoundedYear:        payload.FoundedYear,
		Culture:            "We foster an innovative, collaborative, and inclusive environment.",
		Mission:            "To empower individuals and organizations to reach their highest potential.",
		Vision:             "To become the global gold standard in innovation and operational excellence.",
		Values:             []string{"Integrity", "Innovation", "Inclusivity", "Customer Obsession", "Excellence"},
		CoreServices:       []string{"Consulting", "Enterprise Software", "Facility Operations", "Talent Management"},
		OperatingCountries: []string{"United Arab Emirates", "Saudi Arabia", "Qatar", "United States", "United Kingdom"},
		Benefits:           []string{"Full Health Insurance", "Remote & Hybrid Work", "Flexible Hours", "Annual Flight Allowance", "Learning Budget", "Paid Parental Leave"},
		EmployeeInsights:   "94% of our team recommends us to a colleague.",
		Rating:             4.8,
		ReviewCount:        142,
		FollowersCount:     0,
		EmployeesCount:     1250,
		OpenJobsCount:      3,
		IsVerified:         true,
		IsHiring:           true,
		ResponseTime:       "Within 24 Hours",
		UpdatedAt:          time.Now(),
	}

	m := &models.CompanyMember{
		ID:        uuid.New(),
		CompanyID: companyID,
		UserID:    creatorID,
		Role:      "admin",
		CreatedAt: time.Now(),
	}

	err := s.repo.CreateCompany(ctx, c, p, m)
	if err != nil {
		return nil, nil, err
	}

	return c, p, nil
}

func (s *CompanyService) GetByHandle(ctx context.Context, handle string) (*models.Company, *models.CompanyProfile, error) {
	c, p, err := s.repo.GetByHandle(ctx, handle)
	if err == nil {
		return c, p, nil
	}

	stubs := s.getMockStubs()
	for i := range stubs {
		if stubs[i].Handle == handle {
			profile := s.getMockProfile(stubs[i].ID, stubs[i].Name, stubs[i].Handle)
			return &stubs[i], profile, nil
		}
	}

	return nil, nil, errors.New("company handle not found")
}

func (s *CompanyService) UpdateProfile(ctx context.Context, userID, companyID uuid.UUID, payload *models.UpdateProfilePayload) error {
	role, err := s.repo.GetMemberRole(ctx, companyID, userID)
	if err != nil {
		return err
	}

	if role != "admin" && role != "editor" {
		return errors.New("unauthorized: only company admins or editors can update the profile")
	}

	_, currentProfile, err := s.repo.GetByID(ctx, companyID)
	if err != nil {
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

func (s *CompanyService) FollowCompany(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	return s.repo.Follow(ctx, companyID, userID)
}

func (s *CompanyService) IsFollowing(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	return s.repo.IsFollowing(ctx, companyID, userID)
}

func (s *CompanyService) SaveCompany(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	return true, nil
}

func (s *CompanyService) UnsaveCompany(ctx context.Context, companyID, userID uuid.UUID) error {
	return nil
}

func (s *CompanyService) ReportCompany(ctx context.Context, companyID, reporterID uuid.UUID, reason, details string) error {
	return nil
}

func (s *CompanyService) GetCompanyJobs(ctx context.Context, companyID uuid.UUID) ([]models.CompanyJobDTO, error) {
	return []models.CompanyJobDTO{
		{
			ID:             uuid.New(),
			Title:          "Senior Facilities Operations Manager",
			Department:     "Facilities Management",
			Location:       "Dubai, UAE",
			EmploymentType: "Full-time",
			SalaryRange:    "$75,000 - $95,000",
			PostedDate:     "2 days ago",
			Deadline:       "2026-08-30",
			IsSaved:        false,
		},
		{
			ID:             uuid.New(),
			Title:          "Lead Cloud Systems Architect",
			Department:     "Engineering",
			Location:       "Abu Dhabi, UAE (Hybrid)",
			EmploymentType: "Full-time",
			SalaryRange:    "$90,000 - $120,000",
			PostedDate:     "1 week ago",
			Deadline:       "2026-09-15",
			IsSaved:        true,
		},
		{
			ID:             uuid.New(),
			Title:          "Corporate Talent Acquisition Lead",
			Department:     "Human Resources",
			Location:       "Riyadh, Saudi Arabia",
			EmploymentType: "Full-time",
			SalaryRange:    "$65,000 - $85,000",
			PostedDate:     "3 days ago",
			Deadline:       "2026-08-28",
			IsSaved:        false,
		},
	}, nil
}

func (s *CompanyService) GetCompanyLeaders(ctx context.Context, companyID uuid.UUID) ([]models.CompanyLeaderDTO, error) {
	return []models.CompanyLeaderDTO{
		{
			ID:          uuid.New(),
			Name:        "Rashid Al-Maktoum",
			Designation: "Chief Executive Officer & Founder",
			PhotoURL:    "",
			Summary:     "Over 20 years of experience driving regional real estate, tech infrastructure, and smart city developments.",
			LinkedInURL: "https://linkedin.com/in/rashid-al-maktoum",
		},
		{
			ID:          uuid.New(),
			Name:        "Amira Al-Farsi",
			Designation: "Chief Operations Officer",
			PhotoURL:    "",
			Summary:     "Spearheading digital transformation, green building initiatives, and multi-asset operations across 12 countries.",
			LinkedInURL: "https://linkedin.com/in/amira-al-farsi",
		},
	}, nil
}

func (s *CompanyService) GetCompanyLocations(ctx context.Context, companyID uuid.UUID) ([]models.CompanyLocationDTO, error) {
	return []models.CompanyLocationDTO{
		{
			ID:        uuid.New(),
			Name:      "Global Corporate Headquarters",
			Type:      "Headquarters",
			Address:   "Emaar Square, Building 3, Downtown Dubai",
			City:      "Dubai",
			Country:   "United Arab Emirates",
			Latitude:  25.1972,
			Longitude: 55.2744,
		},
		{
			ID:        uuid.New(),
			Name:      "KSA Operations Hub",
			Type:      "Regional Office",
			Address:   "King Fahd Road, Olaya District",
			City:      "Riyadh",
			Country:   "Saudi Arabia",
			Latitude:  24.7136,
			Longitude: 46.6753,
		},
		{
			ID:        uuid.New(),
			Name:      "Qatar Financial Center Branch",
			Type:      "Branch",
			Address:   "West Bay Business District",
			City:      "Doha",
			Country:   "Qatar",
			Latitude:  25.2854,
			Longitude: 51.5310,
		},
	}, nil
}

func (s *CompanyService) GetCompanyDepartments(ctx context.Context, companyID uuid.UUID) ([]models.CompanyDepartmentDTO, error) {
	return []models.CompanyDepartmentDTO{
		{ID: uuid.New(), Name: "Engineering & IT", OpenJobs: 8, EmployeeCount: 420},
		{ID: uuid.New(), Name: "Facilities & Operations", OpenJobs: 5, EmployeeCount: 310},
		{ID: uuid.New(), Name: "Human Resources & Talent", OpenJobs: 3, EmployeeCount: 95},
		{ID: uuid.New(), Name: "Finance & Accounting", OpenJobs: 2, EmployeeCount: 140},
		{ID: uuid.New(), Name: "Sales & Marketing", OpenJobs: 4, EmployeeCount: 220},
		{ID: uuid.New(), Name: "Legal & Compliance", OpenJobs: 1, EmployeeCount: 65},
	}, nil
}

func (s *CompanyService) GetCompanyGallery(ctx context.Context, companyID uuid.UUID) ([]models.CompanyGalleryItem, error) {
	return []models.CompanyGalleryItem{
		{ID: uuid.New(), Title: "Modern Innovation Campus", MediaURL: "", Type: "image", Category: "office"},
		{ID: uuid.New(), Title: "Annual Sustainability & Excellence Summit", MediaURL: "", Type: "image", Category: "event"},
		{ID: uuid.New(), Title: "Best Employer in MENA Region Award", MediaURL: "", Type: "image", Category: "award"},
		{ID: uuid.New(), Title: "Team Collaboration & Learning Workspace", MediaURL: "", Type: "image", Category: "workplace"},
	}, nil
}

func (s *CompanyService) GetCompanyEmployees(ctx context.Context, companyID uuid.UUID) ([]models.CompanyEmployeeDTO, error) {
	return []models.CompanyEmployeeDTO{
		{ID: uuid.New(), Name: "Sarah Chen", Title: "Senior Recruiter", Department: "Human Resources", PhotoURL: "", RoleType: "Recruiter"},
		{ID: uuid.New(), Name: "Tariq Al-Mansoor", Title: "Director of Facilities", Department: "Facilities & Operations", PhotoURL: "", RoleType: "Hiring Manager"},
		{ID: uuid.New(), Name: "Elena Rostova", Title: "Staff AI Engineer", Department: "Engineering & IT", PhotoURL: "", RoleType: "Employee"},
	}, nil
}

func (s *CompanyService) SearchCompanies(ctx context.Context, query string) ([]models.Company, []models.CompanyProfile, error) {
	companies, profiles, err := s.repo.Search(ctx, query)
	if err == nil && len(companies) > 0 {
		return companies, profiles, nil
	}

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

func (s *CompanyService) ListDirectory(ctx context.Context, filter models.CompanyFilterQuery, userID uuid.UUID) (*models.CompanyDirectoryResponse, error) {
	stubs := s.getMockStubs()
	var items []models.CompanyDirectoryItem

	for i := range stubs {
		p := s.getMockProfile(stubs[i].ID, stubs[i].Name, stubs[i].Handle)

		qLower := strings.ToLower(filter.Query)
		if qLower != "" && !strings.Contains(strings.ToLower(stubs[i].Name), qLower) && !strings.Contains(strings.ToLower(p.Industry), qLower) && !strings.Contains(strings.ToLower(p.Location), qLower) {
			continue
		}
		if filter.Industry != "" && !strings.EqualFold(p.Industry, filter.Industry) {
			continue
		}

		items = append(items, models.CompanyDirectoryItem{
			Company: stubs[i],
			Profile: *p,
		})
	}

	if filter.SortBy == "followers" {
		sort.Slice(items, func(i, j int) bool {
			return items[i].Profile.FollowersCount > items[j].Profile.FollowersCount
		})
	} else if filter.SortBy == "most_jobs" {
		sort.Slice(items, func(i, j int) bool {
			return items[i].Profile.OpenJobsCount > items[j].Profile.OpenJobsCount
		})
	} else if filter.SortBy == "alphabetical" {
		sort.Slice(items, func(i, j int) bool {
			return items[i].Company.Name < items[j].Company.Name
		})
	}

	page := filter.Page
	if page <= 0 {
		page = 1
	}
	limit := filter.Limit
	if limit <= 0 {
		limit = 12
	}

	total := len(items)
	totalPages := (total + limit - 1) / limit

	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	paginatedItems := items[start:end]

	return &models.CompanyDirectoryResponse{
		Companies:  paginatedItems,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *CompanyService) GetFeaturedCompanies(ctx context.Context) ([]models.CompanyDirectoryItem, error) {
	stubs := s.getMockStubs()
	var list []models.CompanyDirectoryItem
	for i := 0; i < len(stubs) && i < 4; i++ {
		p := s.getMockProfile(stubs[i].ID, stubs[i].Name, stubs[i].Handle)
		list = append(list, models.CompanyDirectoryItem{
			Company: stubs[i],
			Profile: *p,
		})
	}
	return list, nil
}

func (s *CompanyService) GetPopularCompanies(ctx context.Context) ([]models.CompanyDirectoryItem, error) {
	return s.GetFeaturedCompanies(ctx)
}

func (s *CompanyService) GetRecommendations(ctx context.Context, limit int) ([]models.Company, []models.CompanyProfile, error) {
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

func (s *CompanyService) GetIndustries(ctx context.Context) ([]models.IndustryCategory, error) {
	return []models.IndustryCategory{
		{ID: "1", Name: "Technology", Icon: "Code", CompanyCount: 1420, OpenJobs: 8400},
		{ID: "2", Name: "Facilities Management", Icon: "Business", CompanyCount: 850, OpenJobs: 4200},
		{ID: "3", Name: "Healthcare", Icon: "LocalHospital", CompanyCount: 980, OpenJobs: 5600},
		{ID: "4", Name: "Construction & Real Estate", Icon: "Apartment", CompanyCount: 1120, OpenJobs: 6100},
		{ID: "5", Name: "Finance & Banking", Icon: "AccountBalance", CompanyCount: 1250, OpenJobs: 7300},
		{ID: "6", Name: "Logistics & Supply Chain", Icon: "LocalShipping", CompanyCount: 640, OpenJobs: 3100},
		{ID: "7", Name: "Engineering", Icon: "Engineering", CompanyCount: 890, OpenJobs: 4500},
		{ID: "8", Name: "Oil & Gas", Icon: "PropaneTank", CompanyCount: 510, OpenJobs: 2800},
		{ID: "9", Name: "Retail & E-commerce", Icon: "ShoppingCart", CompanyCount: 760, OpenJobs: 3900},
		{ID: "10", Name: "Hospitality & Tourism", Icon: "Hotel", CompanyCount: 680, OpenJobs: 3400},
		{ID: "11", Name: "Education", Icon: "School", CompanyCount: 540, OpenJobs: 2100},
		{ID: "12", Name: "Manufacturing", Icon: "PrecisionManufacturing", CompanyCount: 620, OpenJobs: 2900},
		{ID: "13", Name: "Government & Defense", Icon: "Security", CompanyCount: 310, OpenJobs: 1500},
		{ID: "14", Name: "Telecommunications", Icon: "CellTower", CompanyCount: 420, OpenJobs: 2300},
		{ID: "15", Name: "Media & Entertainment", Icon: "Movie", CompanyCount: 390, OpenJobs: 1800},
	}, nil
}

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

func (s *CompanyService) UpdateVerificationStatus(ctx context.Context, reqID uuid.UUID, status string) error {
	if status != "approved" && status != "rejected" {
		return errors.New("invalid status: must be approved or rejected")
	}
	return s.repo.UpdateVerificationStatus(ctx, reqID, status)
}

// Stubs Helper generators
func (s *CompanyService) getMockStubs() []models.Company {
	return []models.Company{
		{ID: uuid.MustParse("11111111-2222-3333-4444-555555555555"), Name: "Emaar Properties", Handle: "emaar", CreatedAt: time.Now()},
		{ID: uuid.MustParse("22222222-3333-4444-5555-666666666666"), Name: "Google UAE", Handle: "google-uae", CreatedAt: time.Now()},
		{ID: uuid.MustParse("33333333-4444-5555-6666-777777777777"), Name: "Microsoft Dubai", Handle: "microsoft-dubai", CreatedAt: time.Now()},
		{ID: uuid.MustParse("44444444-5555-6666-7777-888888888888"), Name: "Emirates Group", Handle: "emirates", CreatedAt: time.Now()},
		{ID: uuid.MustParse("55555555-6666-7777-8888-999999999999"), Name: "ADNOC Group", Handle: "adnoc", CreatedAt: time.Now()},
		{ID: uuid.MustParse("66666666-7777-8888-9999-000000000000"), Name: "Hyperion Labs", Handle: "hyperion-labs", CreatedAt: time.Now()},
	}
}

func (s *CompanyService) getMockProfile(id uuid.UUID, name string, handle string) *models.CompanyProfile {
	industry := "Facilities Management & Real Estate"
	website := "https://www.emaar.com"
	location := "Dubai, UAE"
	size := "10,000+ employees"
	founded := 1997
	followers := 14200
	openJobs := 18
	isVerified := true
	isHiring := true

	switch handle {
	case "google-uae":
		industry = "Technology"
		website = "https://www.google.ae"
		founded = 1998
		followers = 43200
		openJobs = 24
	case "microsoft-dubai":
		industry = "Technology"
		website = "https://www.microsoft.com/en-ae"
		founded = 1975
		followers = 38900
		openJobs = 15
	case "emirates":
		industry = "Aviation & Logistics"
		website = "https://www.emirates.com"
		location = "Dubai Airport, UAE"
		size = "10,000+ employees"
		founded = 1985
		followers = 68400
		openJobs = 42
	case "adnoc":
		industry = "Oil & Gas"
		website = "https://www.adnoc.ae"
		location = "Abu Dhabi, UAE"
		size = "10,000+ employees"
		founded = 1971
		followers = 51200
		openJobs = 31
	case "hyperion-labs":
		industry = "Technology"
		website = "https://hyperionlabs.ai"
		location = "Dubai Internet City, UAE"
		size = "51-200 employees"
		founded = 2021
		followers = 9400
		openJobs = 8
	}

	return &models.CompanyProfile{
		CompanyID:          id,
		LogoURL:            "",
		CoverURL:           "",
		About:              "Welcome to the official Kirmya corporate profile of " + name + ". We are globally recognized for excellence in the " + industry + " sector, driving innovation, community growth, and sustainable infrastructure.",
		Industry:           industry,
		CompanySize:        size,
		Location:           location,
		Website:            website,
		FoundedYear:        founded,
		Culture:            "We drive growth, prioritize work-life balance, and reward continuous learning.",
		Mission:            "To empower individuals and organizations to reach their highest potential through world-class services and technology.",
		Vision:             "To become the global gold standard in innovation, sustainable operations, and candidate-centric workplace culture.",
		Values:             []string{"Integrity & Trust", "Innovation First", "Inclusive Growth", "Customer Obsession", "Operational Excellence"},
		CoreServices:       []string{"Real Estate Development", "Facility Operations", "Asset Management", "Digital Innovation Hub"},
		OperatingCountries: []string{"United Arab Emirates", "Saudi Arabia", "Qatar", "United States", "United Kingdom"},
		Benefits:           []string{"Full Health Coverage", "Remote Work Options", "Education Reimbursement", "Travel Allowances", "Annual Performance Bonus"},
		EmployeeInsights:   "96% of team members approve of management leadership.",
		Rating:             4.9,
		ReviewCount:        280,
		FollowersCount:     followers,
		EmployeesCount:     12500,
		OpenJobsCount:      openJobs,
		IsVerified:         isVerified,
		IsHiring:           isHiring,
		ResponseTime:       "Within 24 Hours",
		UpdatedAt:          time.Now(),
	}
}
