package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/enterprise_hiring/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EnterpriseRepository interface {
	GetEnterpriseOverview(ctx context.Context, entID uuid.UUID) (*domain.Enterprise, error)
	GetTeams(ctx context.Context, entID uuid.UUID) ([]domain.HiringTeam, error)
	CreateTeam(ctx context.Context, team *domain.HiringTeam) error

	GetCandidatePools(ctx context.Context, entID uuid.UUID) ([]domain.CandidatePool, error)
	CreateCandidatePool(ctx context.Context, pool *domain.CandidatePool) error

	GetAuditLogs(ctx context.Context, entID uuid.UUID) ([]domain.AuditLog, error)
	LogAction(ctx context.Context, log *domain.AuditLog) error
}

type pgxEnterpriseRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	enterprises map[uuid.UUID]*domain.Enterprise
	teams       map[uuid.UUID]*domain.HiringTeam
	pools       map[uuid.UUID]*domain.CandidatePool
	logs        []domain.AuditLog
}

func NewEnterpriseRepository(pool *pgxpool.Pool) EnterpriseRepository {
	repo := &pgxEnterpriseRepository{
		pool:        pool,
		enterprises: make(map[uuid.UUID]*domain.Enterprise),
		teams:       make(map[uuid.UUID]*domain.HiringTeam),
		pools:       make(map[uuid.UUID]*domain.CandidatePool),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxEnterpriseRepository) seedDefaultData() {
	now := time.Now()
	entID := uuid.MustParse("e1111111-1111-1111-1111-111111111111")
	ent := &domain.Enterprise{
		ID:        entID,
		Name:      "Stripe Global Enterprise",
		Industry:  "Fintech & Financial Infrastructure",
		Tier:      "enterprise_premium",
		Domain:    "stripe.com",
		CreatedAt: now,
		UpdatedAt: now,
	}
	r.enterprises[entID] = ent

	t1ID := uuid.New()
	r.teams[t1ID] = &domain.HiringTeam{
		ID:             t1ID,
		EnterpriseID:   entID,
		DepartmentName: "Infrastructure & Platform Systems",
		TeamName:       "Go Microservices Hiring Squad",
		TeamLeadID:     uuid.New(),
		TeamLeadName:   "Sarah Chen (Staff Engineer)",
		MemberCount:    12,
		CreatedAt:      now,
	}

	t2ID := uuid.New()
	r.teams[t2ID] = &domain.HiringTeam{
		ID:             t2ID,
		EnterpriseID:   entID,
		DepartmentName: "Machine Learning & AI Platform",
		TeamName:       "AI Career & Matching Squad",
		TeamLeadID:     uuid.New(),
		TeamLeadName:   "Dr. Marcus Vance (VP AI)",
		MemberCount:    8,
		CreatedAt:      now,
	}

	p1ID := uuid.New()
	r.pools[p1ID] = &domain.CandidatePool{
		ID:             p1ID,
		EnterpriseID:   entID,
		Name:           "Principal Systems Engineers Pipeline",
		Description:    "Pre-vetted Senior & Staff Go Engineers for core platform scale",
		CandidateCount: 42,
		CreatedAt:      now,
	}

	actorID := uuid.New()
	r.logs = []domain.AuditLog{
		{
			ID:           uuid.New(),
			EnterpriseID: entID,
			ActorID:      actorID,
			ActorEmail:   "sarah.chen@stripe.com",
			Action:       "RECRUITER_ROLE_ASSIGN",
			Resource:     "User: james.wilson@stripe.com -> Role: Lead Recruiter",
			IPAddress:    "192.168.1.105",
			CreatedAt:    now.Add(-1 * time.Hour),
		},
	}
}

func (r *pgxEnterpriseRepository) GetEnterpriseOverview(ctx context.Context, entID uuid.UUID) (*domain.Enterprise, error) {
	if r.pool != nil {
		query := `SELECT id, name, industry, tier, domain, created_at, updated_at FROM enterprises WHERE id = $1`
		ent := &domain.Enterprise{}
		err := r.pool.QueryRow(ctx, query, entID).Scan(
			&ent.ID, &ent.Name, &ent.Industry, &ent.Tier, &ent.Domain, &ent.CreatedAt, &ent.UpdatedAt,
		)
		if err == nil {
			return ent, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if ent, exists := r.enterprises[entID]; exists {
		entCopy := *ent
		return &entCopy, nil
	}
	defaultEntID := uuid.MustParse("e1111111-1111-1111-1111-111111111111")
	return r.enterprises[defaultEntID], nil
}

func (r *pgxEnterpriseRepository) GetTeams(ctx context.Context, entID uuid.UUID) ([]domain.HiringTeam, error) {
	if r.pool != nil {
		query := `SELECT id, enterprise_id, department_name, team_name, team_lead_id, created_at FROM teams WHERE enterprise_id = $1`
		rows, err := r.pool.Query(ctx, query, entID)
		if err == nil {
			defer rows.Close()
			var list []domain.HiringTeam
			for rows.Next() {
				var t domain.HiringTeam
				if err := rows.Scan(&t.ID, &t.EnterpriseID, &t.DepartmentName, &t.TeamName, &t.TeamLeadID, &t.CreatedAt); err == nil {
					list = append(list, t)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.HiringTeam
	for _, t := range r.teams {
		list = append(list, *t)
	}
	return list, nil
}

func (r *pgxEnterpriseRepository) CreateTeam(ctx context.Context, team *domain.HiringTeam) error {
	if team.ID == uuid.Nil {
		team.ID = uuid.New()
	}
	team.CreatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO teams (id, enterprise_id, department_name, team_name, team_lead_id, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.pool.Exec(ctx, query, team.ID, team.EnterpriseID, team.DepartmentName, team.TeamName, team.TeamLeadID, team.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.teams[team.ID] = team
	return nil
}

func (r *pgxEnterpriseRepository) GetCandidatePools(ctx context.Context, entID uuid.UUID) ([]domain.CandidatePool, error) {
	if r.pool != nil {
		query := `SELECT id, enterprise_id, name, description, candidate_count, created_at FROM candidate_pools WHERE enterprise_id = $1`
		rows, err := r.pool.Query(ctx, query, entID)
		if err == nil {
			defer rows.Close()
			var list []domain.CandidatePool
			for rows.Next() {
				var p domain.CandidatePool
				if err := rows.Scan(&p.ID, &p.EnterpriseID, &p.Name, &p.Description, &p.CandidateCount, &p.CreatedAt); err == nil {
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

	var list []domain.CandidatePool
	for _, p := range r.pools {
		list = append(list, *p)
	}
	return list, nil
}

func (r *pgxEnterpriseRepository) CreateCandidatePool(ctx context.Context, pool *domain.CandidatePool) error {
	if pool.ID == uuid.Nil {
		pool.ID = uuid.New()
	}
	pool.CreatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO candidate_pools (id, enterprise_id, name, description, candidate_count, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.pool.Exec(ctx, query, pool.ID, pool.EnterpriseID, pool.Name, pool.Description, pool.CandidateCount, pool.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.pools[pool.ID] = pool
	return nil
}

func (r *pgxEnterpriseRepository) GetAuditLogs(ctx context.Context, entID uuid.UUID) ([]domain.AuditLog, error) {
	if r.pool != nil {
		query := `SELECT id, enterprise_id, actor_id, actor_email, action, resource, ip_address, created_at 
		          FROM audit_logs WHERE enterprise_id = $1 ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query, entID)
		if err == nil {
			defer rows.Close()
			var list []domain.AuditLog
			for rows.Next() {
				var l domain.AuditLog
				if err := rows.Scan(&l.ID, &l.EnterpriseID, &l.ActorID, &l.ActorEmail, &l.Action, &l.Resource, &l.IPAddress, &l.CreatedAt); err == nil {
					list = append(list, l)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.logs, nil
}

func (r *pgxEnterpriseRepository) LogAction(ctx context.Context, log *domain.AuditLog) error {
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	log.CreatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO audit_logs (id, enterprise_id, actor_id, actor_email, action, resource, ip_address, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
		_, err := r.pool.Exec(ctx, query, log.ID, log.EnterpriseID, log.ActorID, log.ActorEmail, log.Action, log.Resource, log.IPAddress, log.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.logs = append([]domain.AuditLog{*log}, r.logs...)
	return nil
}
