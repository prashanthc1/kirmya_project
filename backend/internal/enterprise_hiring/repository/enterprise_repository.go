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
		CreatedAt:      now.Add(-10 * 24 * time.Hour),
	}

	p1ID := uuid.New()
	r.pools[p1ID] = &domain.CandidatePool{
		ID:             p1ID,
		EnterpriseID:   entID,
		Name:           "Senior Go & Distributed Systems Talent Pipeline",
		Description:    "Pre-vetted 90%+ AI Match candidates with 5+ years microservice experience",
		CandidateCount: 342,
		CreatedAt:      now,
	}

	actorID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	r.logs = []domain.AuditLog{
		{
			ID:           uuid.New(),
			EnterpriseID: entID,
			ActorID:      actorID,
			ActorEmail:   "alex.rivera@stripe.com",
			Action:       "CANDIDATE_POOL_EXPORT",
			Resource:     "Candidate Pool: Senior Go Talent Pipeline",
			IPAddress:    "192.168.1.100",
			CreatedAt:    now.Add(-15 * time.Minute),
		},
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

	r.mu.Lock()
	defer r.mu.Unlock()

	r.teams[team.ID] = team
	return nil
}

func (r *pgxEnterpriseRepository) GetCandidatePools(ctx context.Context, entID uuid.UUID) ([]domain.CandidatePool, error) {
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

	r.mu.Lock()
	defer r.mu.Unlock()

	r.pools[pool.ID] = pool
	return nil
}

func (r *pgxEnterpriseRepository) GetAuditLogs(ctx context.Context, entID uuid.UUID) ([]domain.AuditLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.logs, nil
}

func (r *pgxEnterpriseRepository) LogAction(ctx context.Context, log *domain.AuditLog) error {
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	log.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.logs = append([]domain.AuditLog{*log}, r.logs...)
	return nil
}
