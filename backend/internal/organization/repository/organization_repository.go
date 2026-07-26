package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/organization/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OrganizationRepository interface {
	CreateOrganization(ctx context.Context, org *domain.Organization) error
	GetOrganizationByID(ctx context.Context, id uuid.UUID) (*domain.Organization, error)
	GetOrganizationsForUser(ctx context.Context, userID uuid.UUID) ([]domain.Organization, error)

	AddMember(ctx context.Context, member *domain.OrganizationUser) error
	GetOrgMembers(ctx context.Context, orgID uuid.UUID) ([]domain.OrganizationUser, error)
	GetUserRoleInOrg(ctx context.Context, orgID, userID uuid.UUID) (string, error)

	GetPermissionsByRole(ctx context.Context, role string) ([]domain.OrganizationPermission, error)
	GetAllPermissions(ctx context.Context) ([]domain.OrganizationPermission, error)
}

type pgxOrganizationRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	organizations map[uuid.UUID]*domain.Organization
	members       map[uuid.UUID]*domain.OrganizationUser
	permissions   map[uuid.UUID]*domain.OrganizationPermission
}

func NewOrganizationRepository(pool *pgxpool.Pool) OrganizationRepository {
	repo := &pgxOrganizationRepository{
		pool:          pool,
		organizations: make(map[uuid.UUID]*domain.Organization),
		members:       make(map[uuid.UUID]*domain.OrganizationUser),
		permissions:   make(map[uuid.UUID]*domain.OrganizationPermission),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxOrganizationRepository) seedDefaultData() {
	now := time.Now()

	org1 := &domain.Organization{
		ID:           uuid.MustParse("00000000-0000-0000-0000-000000000000"),
		Name:         "Default Kirmya Enterprise Tenant",
		OrgType:      domain.TypeCompany,
		TenantDomain: "kirmya-default.tenant",
		Status:       "active",
		Tier:         domain.TierEnterprise,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	org2 := &domain.Organization{
		ID:           uuid.MustParse("00022222-2222-2222-2222-222222222222"),
		Name:         "TechCorp Global Recruiting",
		OrgType:      domain.TypeRecruiterAgency,
		TenantDomain: "techcorp-agency.tenant",
		Status:       "active",
		Tier:         domain.TierEnterprise,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	org3 := &domain.Organization{
		ID:           uuid.MustParse("00033333-3333-3333-3333-333333333333"),
		Name:         "Kirmya Leadership Academy",
		OrgType:      domain.TypeTrainingProvider,
		TenantDomain: "leadership-academy.tenant",
		Status:       "active",
		Tier:         domain.TierPro,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	r.organizations[org1.ID] = org1
	r.organizations[org2.ID] = org2
	r.organizations[org3.ID] = org3

	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")

	m1 := &domain.OrganizationUser{
		ID:        uuid.New(),
		OrgID:     org1.ID,
		UserID:    userID,
		UserName:  "Alex Rivera",
		UserEmail: "alex.rivera@example.com",
		Role:      domain.RoleAdmin,
		Status:    "active",
		CreatedAt: now,
	}

	m2 := &domain.OrganizationUser{
		ID:        uuid.New(),
		OrgID:     org2.ID,
		UserID:    userID,
		UserName:  "Alex Rivera",
		UserEmail: "alex.rivera@example.com",
		Role:      domain.RoleRecruiter,
		Status:    "active",
		CreatedAt: now,
	}

	r.members[m1.ID] = m1
	r.members[m2.ID] = m2

	// Seed RBAC Permissions Matrix
	roles := []string{domain.RoleAdmin, domain.RoleRecruiter, domain.RoleInstructor, domain.RoleViewer}
	resources := []string{"interviews", "assessments", "learning", "referrals", "verifications", "organization"}

	for _, role := range roles {
		for _, res := range resources {
			p := &domain.OrganizationPermission{
				ID:        uuid.New(),
				Role:      role,
				Resource:  res,
				Action:    "read",
				CreatedAt: now,
			}
			if role == domain.RoleAdmin {
				p.Action = "manage"
			} else if role == domain.RoleRecruiter && (res == "interviews" || res == "referrals" || res == "verifications") {
				p.Action = "write"
			} else if role == domain.RoleInstructor && (res == "learning" || res == "assessments") {
				p.Action = "write"
			}
			r.permissions[p.ID] = p
		}
	}
}

func (r *pgxOrganizationRepository) CreateOrganization(ctx context.Context, org *domain.Organization) error {
	if org.ID == uuid.Nil {
		org.ID = uuid.New()
	}
	org.CreatedAt = time.Now()
	org.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.organizations[org.ID] = org
	return nil
}

func (r *pgxOrganizationRepository) GetOrganizationByID(ctx context.Context, id uuid.UUID) (*domain.Organization, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if org, exists := r.organizations[id]; exists {
		orgCopy := *org
		count := 0
		for _, m := range r.members {
			if m.OrgID == id {
				count++
			}
		}
		orgCopy.MemberCount = count
		return &orgCopy, nil
	}
	return nil, fmt.Errorf("organization not found: %s", id)
}

func (r *pgxOrganizationRepository) GetOrganizationsForUser(ctx context.Context, userID uuid.UUID) ([]domain.Organization, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Organization
	for _, m := range r.members {
		if m.UserID == userID {
			if org, exists := r.organizations[m.OrgID]; exists {
				orgCopy := *org
				count := 0
				for _, mem := range r.members {
					if mem.OrgID == org.ID {
						count++
					}
				}
				orgCopy.MemberCount = count
				list = append(list, orgCopy)
			}
		}
	}

	if len(list) == 0 {
		if org1, exists := r.organizations[uuid.MustParse("00000000-0000-0000-0000-000000000000")]; exists {
			list = append(list, *org1)
		}
	}

	return list, nil
}

func (r *pgxOrganizationRepository) AddMember(ctx context.Context, member *domain.OrganizationUser) error {
	if member.ID == uuid.Nil {
		member.ID = uuid.New()
	}
	member.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.members[member.ID] = member
	return nil
}

func (r *pgxOrganizationRepository) GetOrgMembers(ctx context.Context, orgID uuid.UUID) ([]domain.OrganizationUser, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.OrganizationUser
	for _, m := range r.members {
		if m.OrgID == orgID {
			list = append(list, *m)
		}
	}
	return list, nil
}

func (r *pgxOrganizationRepository) GetUserRoleInOrg(ctx context.Context, orgID, userID uuid.UUID) (string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, m := range r.members {
		if m.OrgID == orgID && m.UserID == userID {
			return m.Role, nil
		}
	}
	return domain.RoleViewer, nil
}

func (r *pgxOrganizationRepository) GetPermissionsByRole(ctx context.Context, role string) ([]domain.OrganizationPermission, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.OrganizationPermission
	for _, p := range r.permissions {
		if p.Role == role {
			list = append(list, *p)
		}
	}
	return list, nil
}

func (r *pgxOrganizationRepository) GetAllPermissions(ctx context.Context) ([]domain.OrganizationPermission, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.OrganizationPermission
	for _, p := range r.permissions {
		list = append(list, *p)
	}
	return list, nil
}
