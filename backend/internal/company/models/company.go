package models

import (
	"time"

	"github.com/google/uuid"
)

// Company represents a registered entity.
type Company struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Handle    string    `json:"handle"`
	CreatedAt time.Time `json:"createdAt"`
}

// CompanyProfile details profile properties and sections.
type CompanyProfile struct {
	CompanyID        uuid.UUID `json:"companyId"`
	LogoURL          string    `json:"logoUrl"`
	CoverURL         string    `json:"coverUrl"`
	About            string    `json:"about"`
	Industry         string    `json:"industry"`
	CompanySize      string    `json:"companySize"`
	Location         string    `json:"location"`
	Website          string    `json:"website"`
	FoundedYear      int       `json:"foundedYear"`
	Culture          string    `json:"culture"`
	Mission          string    `json:"mission"`
	Vision           string    `json:"vision"`
	Values           []string  `json:"values"`
	CoreServices     []string  `json:"coreServices"`
	OperatingCountries []string `json:"operatingCountries"`
	Benefits         []string  `json:"benefits"`
	EmployeeInsights string    `json:"employeeInsights"`
	Rating           float64   `json:"rating"`
	ReviewCount      int       `json:"reviewCount"`
	FollowersCount   int       `json:"followersCount"`
	EmployeesCount   int       `json:"employeesCount"`
	OpenJobsCount    int       `json:"openJobsCount"`
	IsVerified       bool      `json:"isVerified"`
	IsHiring         bool      `json:"isHiring"`
	IsFollowing      bool      `json:"isFollowing"`
	IsSaved          bool      `json:"isSaved"`
	ResponseTime     string    `json:"responseTime"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type CompanyLeaderDTO struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Designation string    `json:"designation"`
	PhotoURL    string    `json:"photoUrl"`
	Summary     string    `json:"summary"`
	LinkedInURL string    `json:"linkedinUrl"`
}

type CompanyLocationDTO struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"` // Headquarters, Regional Office, Branch
	Address   string    `json:"address"`
	City      string    `json:"city"`
	Country   string    `json:"country"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
}

type CompanyDepartmentDTO struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	OpenJobs      int       `json:"openJobs"`
	EmployeeCount int       `json:"employeeCount"`
}

type CompanyGalleryItem struct {
	ID       uuid.UUID `json:"id"`
	Title    string    `json:"title"`
	MediaURL string    `json:"mediaUrl"`
	Type     string    `json:"type"`     // image, video
	Category string    `json:"category"` // office, event, award, workplace
}

type CompanyEmployeeDTO struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	Title      string    `json:"title"`
	Department string    `json:"department"`
	PhotoURL   string    `json:"photoUrl"`
	RoleType   string    `json:"roleType"` // Recruiter, Hiring Manager, Employee
}

type CompanyJobDTO struct {
	ID               uuid.UUID `json:"id"`
	Title            string    `json:"title"`
	Department       string    `json:"department"`
	Location         string    `json:"location"`
	EmploymentType   string    `json:"employmentType"`
	SalaryRange      string    `json:"salaryRange"`
	PostedDate       string    `json:"postedDate"`
	Deadline         string    `json:"deadline"`
	IsSaved          bool      `json:"isSaved"`
}

type CompanyDirectoryItem struct {
	Company Company        `json:"company"`
	Profile CompanyProfile `json:"profile"`
}

type CompanyDirectoryResponse struct {
	Companies  []CompanyDirectoryItem `json:"companies"`
	Total      int                    `json:"total"`
	Page       int                    `json:"page"`
	Limit      int                    `json:"limit"`
	TotalPages int                    `json:"totalPages"`
}

type CompanyFilterQuery struct {
	Query         string `form:"query"`
	Industry      string `form:"industry"`
	CompanySize   string `form:"size"`
	Country       string `form:"country"`
	City          string `form:"city"`
	ActivelyHiring bool   `form:"actively_hiring"`
	Verified      bool   `form:"verified"`
	SortBy        string `form:"sort"`
	Page          int    `form:"page"`
	Limit         int    `form:"limit"`
}

type IndustryCategory struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Icon         string `json:"icon"`
	CompanyCount int    `json:"companyCount"`
	OpenJobs     int    `json:"openJobs"`
}

type CompanyMember struct {
	ID        uuid.UUID `json:"id"`
	CompanyID uuid.UUID `json:"companyId"`
	UserID    uuid.UUID `json:"userId"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

type CompanyVerificationRequest struct {
	ID          uuid.UUID `json:"id"`
	CompanyID   uuid.UUID `json:"companyId"`
	RequesterID uuid.UUID `json:"requesterId"`
	Status      string    `json:"status"`
	Documents   []string  `json:"documents"`
	CreatedAt   time.Time `json:"createdAt"`
}

type RegisterCompanyPayload struct {
	Name        string `json:"name" binding:"required"`
	Handle      string `json:"handle" binding:"required"`
	Industry    string `json:"industry" binding:"required"`
	Location    string `json:"location" binding:"required"`
	Website     string `json:"website" binding:"required"`
	CompanySize string `json:"companySize" binding:"required"`
	FoundedYear int    `json:"foundedYear" binding:"required"`
}

type UpdateProfilePayload struct {
	About            string   `json:"about"`
	LogoURL          string   `json:"logoUrl"`
	CoverURL         string   `json:"coverUrl"`
	Website          string   `json:"website"`
	Location         string   `json:"location"`
	CompanySize      string   `json:"companySize"`
	Culture          string   `json:"culture"`
	Benefits         []string `json:"benefits"`
	EmployeeInsights string   `json:"employeeInsights"`
}

type ReportCompanyPayload struct {
	Reason  string `json:"reason" binding:"required"`
	Details string `json:"details"`
}
