package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	TypeCompany           = "company"
	TypeRecruiterAgency   = "recruiter_agency"
	TypeTrainingProvider  = "training_provider"

	RoleAdmin      = "org_admin"
	RoleRecruiter  = "recruiter"
	RoleInstructor = "instructor"
	RoleViewer     = "viewer"

	TierEnterprise = "enterprise"
	TierPro        = "pro"
	TierBasic      = "basic"
)

type Organization struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	OrgType      string    `json:"org_type"`
	TenantDomain string    `json:"tenant_domain"`
	Status       string    `json:"status"`
	Tier         string    `json:"tier"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	MemberCount  int       `json:"member_count,omitempty"`
}

type OrganizationUser struct {
	ID        uuid.UUID `json:"id"`
	OrgID     uuid.UUID `json:"org_id"`
	UserID    uuid.UUID `json:"user_id"`
	UserName  string    `json:"user_name"`
	UserEmail string    `json:"user_email"`
	Role      string    `json:"role"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type OrganizationPermission struct {
	ID        uuid.UUID `json:"id"`
	Role      string    `json:"role"`
	Resource  string    `json:"resource"`
	Action    string    `json:"action"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateOrganizationPayload struct {
	Name         string `json:"name" binding:"required"`
	OrgType      string `json:"org_type" binding:"required"` // 'company', 'recruiter_agency', 'training_provider'
	TenantDomain string `json:"tenant_domain" binding:"required"`
	Tier         string `json:"tier"`
}

type InviteMemberPayload struct {
	UserEmail string `json:"user_email" binding:"required"`
	UserName  string `json:"user_name"`
	Role      string `json:"role" binding:"required"` // 'org_admin', 'recruiter', 'instructor', 'viewer'
}
