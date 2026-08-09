package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"
	"kirmya/internal/company/repository"

	"github.com/google/uuid"
)

// CompanyService serves the public company profile surface: the directory, the
// profile page and its sub-resources. It reads the same tables the management
// module writes, so a page never shows something the owner did not put there.
type CompanyService struct {
	repo *repository.CompanyRepository
	mgmt *repository.ManagementRepository
}

// NewCompanyService wires the public company service.
func NewCompanyService(repo *repository.CompanyRepository, mgmt *repository.ManagementRepository) *CompanyService {
	return &CompanyService{repo: repo, mgmt: mgmt}
}

// RegisterCompany registers a company and makes the creator its owner.
//
// The profile is exactly what the payload contained. Earlier versions of this
// method filled in a mission statement, a rating, a review count and an employee
// headcount that nobody had supplied, and set the company verified on the spot;
// all of that is gone. A new company is unverified with empty counters until
// real activity fills them in.
func (s *CompanyService) RegisterCompany(ctx context.Context, creatorID uuid.UUID, payload *models.RegisterCompanyPayload) (*models.Company, *models.CompanyProfile, error) {
	if creatorID == uuid.Nil {
		return nil, nil, domain.ErrUnauthenticated
	}

	handle := Slugify(payload.Handle)
	if handle == "" {
		handle = Slugify(payload.Name)
	}
	if len(handle) < 2 {
		return nil, nil, fmt.Errorf("%w: handle must be at least two characters", domain.ErrValidation)
	}
	taken, err := s.mgmt.SlugExists(ctx, handle)
	if err != nil {
		return nil, nil, err
	}
	if taken {
		return nil, nil, fmt.Errorf("%w: that company handle is already in use", domain.ErrConflict)
	}

	companyID := uuid.New()
	c := &models.Company{
		ID:        companyID,
		Name:      strings.TrimSpace(payload.Name),
		Handle:    handle,
		CreatedAt: time.Now().UTC(),
	}
	p := &models.CompanyProfile{
		CompanyID:   companyID,
		Industry:    strings.TrimSpace(payload.Industry),
		CompanySize: strings.TrimSpace(payload.CompanySize),
		Location:    strings.TrimSpace(payload.Location),
		Website:     strings.TrimSpace(payload.Website),
		FoundedYear: payload.FoundedYear,
		UpdatedAt:   time.Now().UTC(),
	}
	m := &models.CompanyMember{
		ID:        uuid.New(),
		CompanyID: companyID,
		UserID:    creatorID,
		Role:      string(domain.RoleCompanyOwner),
		CreatedAt: time.Now().UTC(),
	}

	if err := s.repo.CreateCompany(ctx, c, p, m); err != nil {
		return nil, nil, err
	}
	return c, p, nil
}

// GetByHandle loads a company's public profile by its handle.
//
// A handle that does not exist is a not-found, full stop. There is no catalogue
// of demonstration companies behind this call any more.
func (s *CompanyService) GetByHandle(ctx context.Context, handle string) (*models.Company, *models.CompanyProfile, error) {
	return s.repo.GetByHandle(ctx, strings.TrimSpace(handle))
}

// UpdateProfile edits a company profile.
//
// Authorization runs through the same org-scoped grant the management module
// uses, so the permission a user holds on one company says nothing about any
// other. The previous string comparison against "admin" or "editor" is gone.
func (s *CompanyService) UpdateProfile(ctx context.Context, userID, companyID uuid.UUID, payload *models.UpdateProfilePayload) error {
	if userID == uuid.Nil {
		return domain.ErrUnauthenticated
	}
	grant, err := s.mgmt.LoadGrant(ctx, companyID, userID)
	if err != nil {
		return err
	}
	if !grant.Has(domain.PermCompanyEdit) {
		if len(grant.Roles) == 0 {
			return domain.ErrNotFound
		}
		return domain.ErrForbidden
	}

	_, currentProfile, err := s.repo.GetByID(ctx, companyID)
	if err != nil {
		return err
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

// FollowCompany toggles the caller's follow on a company and reports the state
// they ended up in.
func (s *CompanyService) FollowCompany(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	if userID == uuid.Nil {
		return false, domain.ErrUnauthenticated
	}
	return s.repo.Follow(ctx, companyID, userID)
}

// Unfollow removes the caller's follow on a company.
func (s *CompanyService) Unfollow(ctx context.Context, companyID, userID uuid.UUID) error {
	if userID == uuid.Nil {
		return domain.ErrUnauthenticated
	}
	return s.mgmt.Unfollow(ctx, companyID, userID)
}

// IsFollowing reports whether a user follows a company.
func (s *CompanyService) IsFollowing(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	if userID == uuid.Nil {
		return false, nil
	}
	return s.repo.IsFollowing(ctx, companyID, userID)
}

// SaveCompany bookmarks a company for the caller.
func (s *CompanyService) SaveCompany(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	if userID == uuid.Nil {
		return false, domain.ErrUnauthenticated
	}
	if err := s.mgmt.SaveCompany(ctx, companyID, userID); err != nil {
		return false, err
	}
	return true, nil
}

// UnsaveCompany removes a bookmark.
func (s *CompanyService) UnsaveCompany(ctx context.Context, companyID, userID uuid.UUID) error {
	if userID == uuid.Nil {
		return domain.ErrUnauthenticated
	}
	return s.mgmt.UnsaveCompany(ctx, companyID, userID)
}

// IsSaved reports whether the caller has bookmarked a company.
func (s *CompanyService) IsSaved(ctx context.Context, companyID, userID uuid.UUID) (bool, error) {
	return s.mgmt.IsSaved(ctx, companyID, userID)
}

// ReportCompany files a moderation report against a company page.
func (s *CompanyService) ReportCompany(ctx context.Context, companyID, reporterID uuid.UUID, reason, details string) error {
	if reporterID == uuid.Nil {
		return domain.ErrUnauthenticated
	}
	if strings.TrimSpace(reason) == "" {
		return fmt.Errorf("%w: a report needs a reason", domain.ErrValidation)
	}
	return s.mgmt.ReportCompany(ctx, companyID, reporterID, strings.TrimSpace(reason), strings.TrimSpace(details))
}

// GetCompanyJobs returns a company's live openings, read from the jobs table
// the jobs module owns. Nothing about a job is created or duplicated here.
func (s *CompanyService) GetCompanyJobs(ctx context.Context, companyID uuid.UUID) ([]models.CompanyJobDTO, error) {
	page, err := s.mgmt.ListCompanyJobs(ctx, companyID, "", false, 1, 50)
	if err != nil {
		return nil, err
	}

	out := make([]models.CompanyJobDTO, 0, len(page.Items))
	for _, job := range page.Items {
		dto := models.CompanyJobDTO{
			ID:             job.ID,
			Title:          job.Title,
			Department:     job.Department,
			Location:       job.Location,
			EmploymentType: job.EmploymentType,
			SalaryRange:    job.SalaryRange,
		}
		if job.PublishedAt != nil {
			dto.PostedDate = job.PublishedAt.Format(time.RFC3339)
		}
		if job.ExpiresAt != nil {
			dto.Deadline = job.ExpiresAt.Format("2006-01-02")
		}
		out = append(out, dto)
	}
	return out, nil
}

// GetCompanyLeaders returns the leadership a company published.
func (s *CompanyService) GetCompanyLeaders(ctx context.Context, companyID uuid.UUID) ([]models.CompanyLeaderDTO, error) {
	return s.mgmt.ListLeaders(ctx, companyID)
}

// GetCompanyLocations returns a company's offices.
func (s *CompanyService) GetCompanyLocations(ctx context.Context, companyID uuid.UUID) ([]models.CompanyLocationDTO, error) {
	return s.mgmt.ListLocations(ctx, companyID)
}

// GetCompanyDepartments returns a company's departments with their live counts.
func (s *CompanyService) GetCompanyDepartments(ctx context.Context, companyID uuid.UUID) ([]models.CompanyDepartmentDTO, error) {
	departments, err := s.mgmt.ListDepartments(ctx, companyID)
	if err != nil {
		return nil, err
	}
	out := make([]models.CompanyDepartmentDTO, 0, len(departments))
	for _, d := range departments {
		out = append(out, models.CompanyDepartmentDTO{
			ID:            d.ID,
			Name:          d.Name,
			OpenJobs:      d.OpenJobs,
			EmployeeCount: d.EmployeeCount,
		})
	}
	return out, nil
}

// GetCompanyGallery returns a company's media.
func (s *CompanyService) GetCompanyGallery(ctx context.Context, companyID uuid.UUID) ([]models.CompanyGalleryItem, error) {
	return s.mgmt.ListGallery(ctx, companyID)
}

// GetCompanyEmployees returns the people who chose to show their association
// publicly. Members who kept their association private are not in this list and
// never reach the response, because the filter is applied in the query.
func (s *CompanyService) GetCompanyEmployees(ctx context.Context, companyID uuid.UUID) ([]models.CompanyEmployeeDTO, error) {
	people, err := s.mgmt.ListPeople(ctx, companyID, models.PeopleQuery{Page: 1, Limit: 50}, false)
	if err != nil {
		return nil, err
	}

	out := make([]models.CompanyEmployeeDTO, 0, len(people.Items))
	for _, person := range people.Items {
		out = append(out, models.CompanyEmployeeDTO{
			ID:         person.ID,
			Name:       person.Name,
			Title:      person.JobTitle,
			Department: person.Department,
			PhotoURL:   person.PhotoURL,
			RoleType:   roleLabel(person.Role),
		})
	}
	return out, nil
}

// roleLabel renders an org role for the public people list.
func roleLabel(role domain.Role) string {
	switch role {
	case domain.RoleCompanyOwner:
		return "Owner"
	case domain.RoleOrgAdmin:
		return "Administrator"
	case domain.RoleRecruiterAdmin:
		return "Recruiting Lead"
	case domain.RoleHiringManager:
		return "Hiring Manager"
	case domain.RoleRecruiter:
		return "Recruiter"
	case domain.RoleViewer:
		return "Viewer"
	default:
		return "Employee"
	}
}

// SearchCompanies runs a keyword search and returns the legacy company/profile
// pair shape the existing clients expect.
func (s *CompanyService) SearchCompanies(ctx context.Context, query string) ([]models.Company, []models.CompanyProfile, error) {
	page, err := s.mgmt.SearchCompanies(ctx, models.CompanySearchQuery{
		Query: query, Page: 1, Limit: 20,
	}, uuid.Nil)
	if err != nil {
		return nil, nil, err
	}

	companies := make([]models.Company, 0, len(page.Items))
	profiles := make([]models.CompanyProfile, 0, len(page.Items))
	for _, item := range page.Items {
		company, profile := splitSummary(item)
		companies = append(companies, company)
		profiles = append(profiles, profile)
	}
	return companies, profiles, nil
}

// ListDirectory is the paginated, filtered company directory.
func (s *CompanyService) ListDirectory(ctx context.Context, filter models.CompanyFilterQuery, userID uuid.UUID) (*models.CompanyDirectoryResponse, error) {
	location := strings.TrimSpace(filter.City)
	if location == "" {
		location = strings.TrimSpace(filter.Country)
	}

	page, err := s.mgmt.SearchCompanies(ctx, models.CompanySearchQuery{
		Query:      filter.Query,
		Industry:   filter.Industry,
		Location:   location,
		Size:       filter.CompanySize,
		HiringOnly: filter.ActivelyHiring,
		Verified:   filter.Verified,
		Sort:       directorySort(filter.SortBy),
		Page:       filter.Page,
		Limit:      filter.Limit,
	}, userID)
	if err != nil {
		return nil, err
	}

	items := make([]models.CompanyDirectoryItem, 0, len(page.Items))
	for _, item := range page.Items {
		company, profile := splitSummary(item)
		items = append(items, models.CompanyDirectoryItem{Company: company, Profile: profile})
	}

	return &models.CompanyDirectoryResponse{
		Companies:  items,
		Total:      page.Total,
		Page:       page.Page,
		Limit:      page.Limit,
		TotalPages: page.TotalPages,
	}, nil
}

// directorySort translates the directory's sort vocabulary into the search
// repository's. An unrecognised value falls through to the default ordering
// rather than being passed to SQL.
func directorySort(sortBy string) string {
	switch strings.ToLower(strings.TrimSpace(sortBy)) {
	case "alphabetical":
		return "name"
	case "most_jobs":
		return "jobs"
	case "newest":
		return "newest"
	case "rating":
		return "rating"
	default:
		return ""
	}
}

// GetFeaturedCompanies returns verified companies that are actively hiring,
// ordered by how many people follow them.
func (s *CompanyService) GetFeaturedCompanies(ctx context.Context) ([]models.CompanyDirectoryItem, error) {
	page, err := s.mgmt.SearchCompanies(ctx, models.CompanySearchQuery{
		Verified: true, HiringOnly: true, Page: 1, Limit: 8,
	}, uuid.Nil)
	if err != nil {
		return nil, err
	}
	return toDirectoryItems(page.Items), nil
}

// GetPopularCompanies returns the most-followed companies.
func (s *CompanyService) GetPopularCompanies(ctx context.Context) ([]models.CompanyDirectoryItem, error) {
	page, err := s.mgmt.SearchCompanies(ctx, models.CompanySearchQuery{Page: 1, Limit: 8}, uuid.Nil)
	if err != nil {
		return nil, err
	}
	return toDirectoryItems(page.Items), nil
}

// GetRecommendations returns companies worth surfacing to a signed-in user,
// drawn from the discovery shelves that are personalised to them and falling
// back to companies that are hiring when the user has nothing to match on.
func (s *CompanyService) GetRecommendations(ctx context.Context, userID uuid.UUID, limit int) ([]models.Company, []models.CompanyProfile, error) {
	if limit <= 0 || limit > 24 {
		limit = 4
	}
	discovery, err := s.mgmt.Discovery(ctx, userID, limit)
	if err != nil {
		return nil, nil, err
	}

	seen := map[uuid.UUID]bool{}
	companies := []models.Company{}
	profiles := []models.CompanyProfile{}
	shelves := [][]models.CompanySummary{
		discovery.HiringForYourSkills,
		discovery.HiringNearYou,
		discovery.FollowedByConnections,
		discovery.Hiring,
		discovery.Trending,
	}
	for _, shelf := range shelves {
		for _, item := range shelf {
			if len(companies) >= limit {
				return companies, profiles, nil
			}
			if seen[item.ID] {
				continue
			}
			seen[item.ID] = true
			company, profile := splitSummary(item)
			companies = append(companies, company)
			profiles = append(profiles, profile)
		}
	}
	return companies, profiles, nil
}

// GetIndustries returns the industry index computed from live companies and
// jobs.
func (s *CompanyService) GetIndustries(ctx context.Context) ([]models.IndustryCategory, error) {
	return s.mgmt.Industries(ctx, 30)
}

// toDirectoryItems maps summaries onto the legacy directory shape.
func toDirectoryItems(items []models.CompanySummary) []models.CompanyDirectoryItem {
	out := make([]models.CompanyDirectoryItem, 0, len(items))
	for _, item := range items {
		company, profile := splitSummary(item)
		out = append(out, models.CompanyDirectoryItem{Company: company, Profile: profile})
	}
	return out
}

// splitSummary projects a company summary onto the older company/profile pair.
//
// Only fields the summary actually carries are populated. The rest stay at
// their zero values, which is how the client learns the data is not there.
func splitSummary(item models.CompanySummary) (models.Company, models.CompanyProfile) {
	company := models.Company{
		ID:     item.ID,
		Name:   item.Name,
		Handle: item.Slug,
	}
	profile := models.CompanyProfile{
		CompanyID:      item.ID,
		LogoURL:        item.LogoURL,
		CoverURL:       item.CoverURL,
		Industry:       item.Industry,
		CompanySize:    item.CompanySize,
		Location:       item.Headquarters,
		Rating:         item.Rating,
		ReviewCount:    item.ReviewCount,
		FollowersCount: item.FollowersCount,
		EmployeesCount: item.EmployeesCount,
		OpenJobsCount:  item.OpenJobsCount,
		IsVerified:     item.IsVerified,
		IsHiring:       item.IsHiring,
		IsFollowing:    item.IsFollowing,
	}
	return company, profile
}
