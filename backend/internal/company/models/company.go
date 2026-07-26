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
	Benefits         []string  `json:"benefits"`
	EmployeeInsights string    `json:"employeeInsights"`
	FollowersCount   int       `json:"followersCount"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// CompanyMember links users to companies with specific roles.
type CompanyMember struct {
	ID        uuid.UUID `json:"id"`
	CompanyID uuid.UUID `json:"companyId"`
	UserID    uuid.UUID `json:"userId"`
	Role      string    `json:"role"` // 'admin', 'editor', 'employee'
	CreatedAt time.Time `json:"createdAt"`
}

// CompanyVerificationRequest logs verification claims.
type CompanyVerificationRequest struct {
	ID          uuid.UUID `json:"id"`
	CompanyID   uuid.UUID `json:"companyId"`
	RequesterID uuid.UUID `json:"requesterId"`
	Status      string    `json:"status"` // 'pending', 'approved', 'rejected'
	Documents   []string  `json:"documents"`
	CreatedAt   time.Time `json:"createdAt"`
}

// RegisterCompanyPayload describes payload to spawn new companies.
type RegisterCompanyPayload struct {
	Name        string `json:"name" binding:"required"`
	Handle      string `json:"handle" binding:"required"`
	Industry    string `json:"industry" binding:"required"`
	Location    string `json:"location" binding:"required"`
	Website     string `json:"website" binding:"required"`
	CompanySize string `json:"companySize" binding:"required"`
	FoundedYear int    `json:"foundedYear" binding:"required"`
}

// UpdateProfilePayload describes edit payloads.
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
