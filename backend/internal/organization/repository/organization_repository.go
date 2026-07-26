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

	roles := []string{domain.RoleAdmin, domain.RoleRecruiter, domain.RoleInstructor, domain.RoleViewer}
	resources := []string{"interviews", "assessments", "learning", "referrals", "verifications", "organization"}
	actions := []string{"read", "write", "delete", "manage"}

	for _, role := range roles {
		for _, res := range resources {
			for _, act := range actions {
				p := &domain.OrganizationPermission{
					ID:        uuid.New(),
					Role:      role,
					Resource:  res,
					Action:    act,
					CreatedAt: now,
				}
				r.permissions[p.ID] = p
			}
		}
	}
}

func (r *pgxOrganizationRepository) CreateOrganization(ctx context.Context, org *domain.Organization) error {
	if org.ID == uuid.Nil {
		org.ID = uuid.New()
	}
	org.CreatedAt = time.Now()
	org.UpdatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO organizations (id, name, org_type, tenant_domain, status, tier, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
		_, err := r.pool.Exec(ctx, query, org.ID, org.Name, org.OrgType, org.TenantDomain, org.Status, org.Tier, org.CreatedAt, org.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.organizations[org.ID] = org
	return nil
}

func (r *pgxOrganizationRepository) GetOrganizationByID(ctx context.Context, id uuid.UUID) (*domain.Organization, error) {
	if r.pool != nil {
		query := `SELECT id, name, org_type, tenant_domain, status, tier, created_at, updated_at FROM organizations WHERE id = $1`
		org := &domain.Organization{}
		err := r.pool.QueryRow(ctx, query, id).Scan(
			&org.ID, &org.Name, &org.OrgType, &org.TenantDomain, &org.Status, &org.Tier, &org.CreatedAt, &org.UpdatedAt,
		)
		if err == nil {
			return org, nil
		}
	}

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
	if r.pool != nil {
		query := `SELECT o.id, o.name, o.org_type, o.tenant_domain, o.status, o.tier, o.created_at, o.updated_at 
		          FROM organizations o 
		          JOIN organization_users ou ON o.id = ou.org_id 
		          WHERE ou.user_id = $1`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.Organization
			for rows.Next() {
				var o domain.Organization
				if err := rows.Scan(&o.ID, &o.Name, &o.OrgType, &o.TenantDomain, &o.Status, &o.Tier, &o.CreatedAt, &o.UpdatedAt); err == nil {
					list = append(list, o)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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

	if r.pool != nil {
		query := `INSERT INTO organization_users (id, org_id, user_id, user_name, user_email, role, status, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
		_, err := r.pool.Exec(ctx, query, member.ID, member.OrgID, member.UserID, member.UserName, member.UserEmail, member.Role, member.Status, member.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.members[member.ID] = member
	return nil
}

func (r *pgxOrganizationRepository) GetOrgMembers(ctx context.Context, orgID uuid.UUID) ([]domain.OrganizationUser, error) {
	if r.pool != nil {
		query := `SELECT id, org_id, user_id, user_name, user_email, role, status, created_at FROM organization_users WHERE org_id = $1`
		rows, err := r.pool.Query(ctx, query, orgID)
		if err == nil {
			defer rows.Close()
			var list []domain.OrganizationUser
			for rows.Next() {
				var m domain.OrganizationUser
				if err := rows.Scan(&m.ID, &m.OrgID, &m.UserID, &m.UserName, &m.UserEmail, &m.Role, &m.Status, &m.CreatedAt); err == nil {
					list = append(list, m)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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
	if r.pool != nil {
		query := `SELECT role FROM organization_users WHERE org_id = $1 AND user_id = $2`
		var role string
		err := r.pool.QueryRow(ctx, query, orgID, userID).Scan(&role)
		if err == nil {
			return role, nil
		}
	}

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
	if r.pool != nil {
		query := `SELECT id, role, resource, action, created_at FROM organization_permissions WHERE role = $1`
		rows, err := r.pool.Query(ctx, query, role)
		if err == nil {
			defer rows.Close()
			var list []domain.OrganizationPermission
			for rows.Next() {
				var p domain.OrganizationPermission
				if err := rows.Scan(&p.ID, &p.Role, &p.Resource, &p.Action, &p.CreatedAt); err == nil {
					list = append(list, p)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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
	if r.pool != nil {
		query := `SELECT id, role, resource, action, created_at FROM organization_permissions`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.OrganizationPermission
			for rows.Next() {
				var p domain.OrganizationPermission
				if err := rows.Scan(&p.ID, &p.Role, &p.Resource, &p.Action, &p.CreatedAt); err == nil {
					list = append(list, p)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.OrganizationPermission
	for _, p := range r.permissions {
		list = append(list, *p)
	}
	return list, nil
}
