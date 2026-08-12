// Package swagger holds the reusable request/response schemas referenced from
// the OpenAPI annotations in every module's swagger.go. Keeping them in one
// place means a change to the platform's envelope shape (errors, pagination,
// auth payloads) is reflected across the whole published contract at once.
//
// These types are documentation models: they mirror what handlers actually put
// on the wire, but nothing serialises through them at runtime.
package swagger

// SuccessResponse is the generic envelope for a successful call whose payload
// has no dedicated schema.
type SuccessResponse struct {
	Success bool        `json:"success" example:"true"`
	Message string      `json:"message,omitempty" example:"Operation completed successfully"`
	Data    interface{} `json:"data,omitempty"`
}

// HealthResponse is the liveness probe's payload. It is deliberately not the
// SuccessResponse envelope: the probe answers before the rest of the platform
// is necessarily up, so it carries the one field it can always report and
// nothing that would need a working dependency to populate.
type HealthResponse struct {
	Status string `json:"status" example:"ok"`
}

// ErrorResponse is returned for every non-2xx status. Handlers emit the bare
// `error` field; `code` and `details` are populated where the module classifies
// the failure.
type ErrorResponse struct {
	Success bool   `json:"success" example:"false"`
	Error   string `json:"error" example:"invalid request payload"`
	Code    string `json:"code,omitempty" example:"BAD_REQUEST"`
	Details string `json:"details,omitempty"`
}

// ValidationError describes a single field that failed binding or validation.
type ValidationError struct {
	Field   string `json:"field" example:"email"`
	Message string `json:"message" example:"must be a valid email address"`
	Value   string `json:"value,omitempty" example:"not-an-email"`
}

// ValidationErrorResponse is the body returned when request binding fails on
// one or more fields.
type ValidationErrorResponse struct {
	Success bool              `json:"success" example:"false"`
	Error   string            `json:"error" example:"validation failed"`
	Details []ValidationError `json:"details"`
}

// PaginationMeta carries the page cursor returned alongside list endpoints that
// use shared/pagination.
type PaginationMeta struct {
	Page       int `json:"page" example:"1"`
	Limit      int `json:"limit" example:"20"`
	TotalItems int `json:"total_items" example:"137"`
	TotalPages int `json:"total_pages" example:"7"`
}

// PaginationResponse is the envelope for paginated collections. It mirrors
// shared/pagination.PaginatedResponse.
type PaginationResponse struct {
	Page       int         `json:"page" example:"1"`
	Limit      int         `json:"limit" example:"20"`
	TotalItems int         `json:"total_items" example:"137"`
	TotalPages int         `json:"total_pages" example:"7"`
	Data       interface{} `json:"data"`
}

// JWTResponse is the credential payload returned by the auth endpoints. The
// refresh token is deliberately absent: it is delivered as an HttpOnly, Secure,
// SameSite=Strict cookie scoped to /api/v1/auth.
type JWTResponse struct {
	AccessToken string       `json:"access_token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	TokenType   string       `json:"token_type" example:"Bearer"`
	ExpiresIn   int64        `json:"expires_in" example:"86400"`
	User        UserResponse `json:"user"`
	Message     string       `json:"message,omitempty" example:"Login successful"`
}

// UserResponse is the non-sensitive view of an account. Password hashes, MFA
// secrets and internal audit columns are never exposed.
type UserResponse struct {
	ID               string `json:"id" example:"6f1c9a52-3d1e-4a3b-9f18-6a2f7c4e0b11"`
	UUID             string `json:"uuid" example:"6f1c9a52-3d1e-4a3b-9f18-6a2f7c4e0b11"`
	FirstName        string `json:"firstName" example:"Ada"`
	LastName         string `json:"lastName" example:"Lovelace"`
	Email            string `json:"email" example:"ada@example.com"`
	EmailVerified    bool   `json:"emailVerified" example:"true"`
	RoleID           string `json:"roleId" example:"candidate"`
	Status           string `json:"status" example:"active"`
	Country          string `json:"country" example:"India"`
	CurrentLocation  string `json:"currentLocation" example:"Hyderabad, Telangana"`
	JobTitle         string `json:"jobTitle" example:"Senior Backend Engineer"`
	EmploymentStatus string `json:"employmentStatus" example:"open_to_work"`
	CreatedAt        string `json:"createdAt" example:"2026-01-14T09:30:00Z"`
	UpdatedAt        string `json:"updatedAt" example:"2026-02-02T11:05:00Z"`
}

// ProfileResponse is the professional profile attached to an account.
type ProfileResponse struct {
	ID              string   `json:"id" example:"1b7a1f60-8f2d-4c5a-b2f0-9a4c1d7e5f22"`
	UserID          string   `json:"user_id" example:"6f1c9a52-3d1e-4a3b-9f18-6a2f7c4e0b11"`
	Headline        string   `json:"headline" example:"Backend engineer focused on distributed systems"`
	Summary         string   `json:"summary" example:"12 years building high-throughput Go services."`
	Location        string   `json:"location" example:"Hyderabad, Telangana"`
	ProfileImageURL string   `json:"profile_image_url" example:"https://cdn.kirmya.com/avatars/ada.png"`
	OpenToWork      bool     `json:"open_to_work" example:"true"`
	Skills          []string `json:"skills" example:"Go,PostgreSQL,Kubernetes"`
	CompletionScore int      `json:"completion_score" example:"82"`
	CreatedAt       string   `json:"created_at" example:"2026-01-14T09:30:00Z"`
	UpdatedAt       string   `json:"updated_at" example:"2026-02-02T11:05:00Z"`
}

// JobResponse is a job posting as returned by the jobs, search and recruiter
// modules.
type JobResponse struct {
	ID             string   `json:"id" example:"9c3e2a41-77bd-4f0c-8a1e-2d5b6c9f3a04"`
	Title          string   `json:"title" example:"Senior Backend Engineer"`
	CompanyID      string   `json:"company_id" example:"3a5d8e10-4c2b-4f77-9d61-8e0f2a7b1c33"`
	CompanyName    string   `json:"company_name" example:"Kirmya Technologies"`
	Location       string   `json:"location" example:"Remote - India"`
	EmploymentType string   `json:"employment_type" example:"full_time"`
	Description    string   `json:"description" example:"Own and scale the matching platform."`
	Skills         []string `json:"skills" example:"Go,PostgreSQL,gRPC"`
	SalaryMin      int      `json:"salary_min" example:"3500000"`
	SalaryMax      int      `json:"salary_max" example:"5200000"`
	Currency       string   `json:"currency" example:"INR"`
	Status         string   `json:"status" example:"open"`
	PostedAt       string   `json:"posted_at" example:"2026-02-01T08:00:00Z"`
}

// ApplicationResponse tracks a candidate's application through the ATS
// pipeline.
type ApplicationResponse struct {
	ID          string `json:"id" example:"5d2b7c14-9e3a-42f8-b0c6-7f1a3e8d2b55"`
	JobID       string `json:"job_id" example:"9c3e2a41-77bd-4f0c-8a1e-2d5b6c9f3a04"`
	CandidateID string `json:"candidate_id" example:"6f1c9a52-3d1e-4a3b-9f18-6a2f7c4e0b11"`
	Status      string `json:"status" example:"in_review"`
	Stage       string `json:"stage" example:"technical_screen"`
	ResumeID    string `json:"resume_id,omitempty" example:"c4e9f2a7-1b8d-4a06-9e35-2f7c1d4b8a90"`
	CoverLetter string `json:"cover_letter,omitempty" example:"I am excited to apply because..."`
	MatchScore  int    `json:"match_score,omitempty" example:"87"`
	AppliedAt   string `json:"applied_at" example:"2026-02-03T13:22:00Z"`
	UpdatedAt   string `json:"updated_at" example:"2026-02-05T09:10:00Z"`
}
