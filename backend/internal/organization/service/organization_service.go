package service

import (
	"context"
	"fmt"
	"time"

	"kirmya/internal/organization/domain"
	"kirmya/internal/organization/repository"

	"github.com/google/uuid"
)

type OrganizationService interface {
	CreateOrganization(ctx context.Context, userID uuid.UUID, payload domain.CreateOrganizationPayload) (*domain.Organization, error)
	GetOrganizationByID(ctx context.Context, orgID uuid.UUID) (*domain.Organization, error)
	GetOrganizationsForUser(ctx context.Context, userID uuid.UUID) ([]domain.Organization, error)

	AddMember(ctx context.Context, orgID uuid.UUID, payload domain.InviteMemberPayload) (*domain.OrganizationUser, error)
	GetOrgMembers(ctx context.Context, orgID uuid.UUID) ([]domain.OrganizationUser, error)

	CheckPermission(ctx context.Context, orgID, userID uuid.UUID, resource, action string) (bool, error)
	GetAllPermissions(ctx context.Context) ([]domain.OrganizationPermission, error)
}

type organizationService struct {
	repo repository.OrganizationRepository
}

func NewOrganizationService(repo repository.OrganizationRepository) OrganizationService {
	return &organizationService{repo: repo}
}

func (s *organizationService) CreateOrganization(ctx context.Context, userID uuid.UUID, payload domain.CreateOrganizationPayload) (*domain.Organization, error) {
	tier := payload.Tier
	if tier == "" {
		tier = domain.TierEnterprise
	}

	org := &domain.Organization{
		ID:           uuid.New(),
		Name:         payload.Name,
		OrgType:      payload.OrgType,
		TenantDomain: payload.TenantDomain,
		Status:       "active",
		Tier:         tier,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		MemberCount:  1,
	}

	if err := s.repo.CreateOrganization(ctx, org); err != nil {
		return nil, err
	}

	// Creator automatically becomes org_admin
	member := &domain.OrganizationUser{
		ID:        uuid.New(),
		OrgID:     org.ID,
		UserID:    userID,
		UserName:  "Alex Rivera",
		UserEmail: "alex.rivera@example.com",
		Role:      domain.RoleAdmin,
		Status:    "active",
		CreatedAt: time.Now(),
	}
	_ = s.repo.AddMember(ctx, member)

	return org, nil
}

func (s *organizationService) GetOrganizationByID(ctx context.Context, orgID uuid.UUID) (*domain.Organization, error) {
	return s.repo.GetOrganizationByID(ctx, orgID)
}

func (s *organizationService) GetOrganizationsForUser(ctx context.Context, userID uuid.UUID) ([]domain.Organization, error) {
	return s.repo.GetOrganizationsForUser(ctx, userID)
}

func (s *organizationService) AddMember(ctx context.Context, orgID uuid.UUID, payload domain.InviteMemberPayload) (*domain.OrganizationUser, error) {
	member := &domain.OrganizationUser{
		ID:        uuid.New(),
		OrgID:     orgID,
		UserID:    uuid.New(), // Generates new invited user context
		UserName:  payload.UserName,
		UserEmail: payload.UserEmail,
		Role:      payload.Role,
		Status:    "active",
		CreatedAt: time.Now(),
	}

	if err := s.repo.AddMember(ctx, member); err != nil {
		return nil, err
	}
	return member, nil
}

func (s *organizationService) GetOrgMembers(ctx context.Context, orgID uuid.UUID) ([]domain.OrganizationUser, error) {
	return s.repo.GetOrgMembers(ctx, orgID)
}

func (s *organizationService) CheckPermission(ctx context.Context, orgID, userID uuid.UUID, resource, action string) (bool, error) {
	role, err := s.repo.GetUserRoleInOrg(ctx, orgID, userID)
	if err != nil {
		return false, err
	}

	if role == domain.RoleAdmin {
		return true, nil
	}

	perms, err := s.repo.GetPermissionsByRole(ctx, role)
	if err != nil {
		return false, err
	}

	for _, p := range perms {
		if p.Resource == resource && (p.Action == action || p.Action == "manage") {
			return true, nil
		}
	}
	return false, fmt.Errorf("permission denied for role %s on resource %s", role, resource)
}

func (s *organizationService) GetAllPermissions(ctx context.Context) ([]domain.OrganizationPermission, error) {
	return s.repo.GetAllPermissions(ctx)
}
