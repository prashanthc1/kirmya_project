package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/freelance/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FreelanceRepository interface {
	CreateProject(ctx context.Context, proj *domain.Project) error
	GetProjects(ctx context.Context, status string) ([]domain.Project, error)
	GetProjectByID(ctx context.Context, id uuid.UUID) (*domain.Project, error)
	UpdateProjectStatus(ctx context.Context, id uuid.UUID, status string) error

	SubmitProposal(ctx context.Context, prop *domain.Proposal) error
	GetProjectProposals(ctx context.Context, projectID uuid.UUID) ([]domain.Proposal, error)
	GetProposalByID(ctx context.Context, id uuid.UUID) (*domain.Proposal, error)
	UpdateProposalStatus(ctx context.Context, id uuid.UUID, status string) error

	CreateContract(ctx context.Context, contract *domain.Contract) error
	GetUserContracts(ctx context.Context, userID uuid.UUID) ([]domain.Contract, error)

	SaveProfile(ctx context.Context, prof *domain.FreelancerProfile) error
	GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error)
}

type pgxFreelanceRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	profiles  map[uuid.UUID]*domain.FreelancerProfile
	projects  map[uuid.UUID]*domain.Project
	proposals map[uuid.UUID]*domain.Proposal
	contracts map[uuid.UUID]*domain.Contract
}

func NewFreelanceRepository(pool *pgxpool.Pool) FreelanceRepository {
	repo := &pgxFreelanceRepository{
		pool:      pool,
		profiles:  make(map[uuid.UUID]*domain.FreelancerProfile),
		projects:  make(map[uuid.UUID]*domain.Project),
		proposals: make(map[uuid.UUID]*domain.Proposal),
		contracts: make(map[uuid.UUID]*domain.Contract),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxFreelanceRepository) seedDefaultData() {
	now := time.Now()
	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	clientID := uuid.MustParse("c9999999-9999-9999-9999-999999999999")

	p1ID := uuid.MustParse("f1111111-1111-1111-1111-111111111111")
	p1 := &domain.Project{
		ID:             p1ID,
		ClientID:       clientID,
		Title:          "Build High-Throughput Go Microservice & Redis Caching Layer",
		Description:    "Short-term contract to optimize an existing payment processing API in Go. Requires deep PostgreSQL GIN index experience.",
		Budget:         1500,
		BudgetType:     domain.BudgetTypeFixed,
		SkillsRequired: []string{"Go", "PostgreSQL", "Redis", "REST API"},
		Status:         domain.ProjectStatusOpen,
		CreatedAt:      now,
		UpdatedAt:      now,
		ProposalsCount: 2,
	}
	r.projects[p1ID] = p1

	p2ID := uuid.MustParse("f2222222-2222-2222-2222-222222222222")
	p2 := &domain.Project{
		ID:             p2ID,
		ClientID:       clientID,
		Title:          "Next.js Dashboard & Material UI Glassmorphism UI Polish",
		Description:    "Help us polish 5 React/Next.js dashboard pages with dark-mode HSL glassmorphic styling.",
		Budget:         85,
		BudgetType:     domain.BudgetTypeHourly,
		SkillsRequired: []string{"Next.js", "React", "TypeScript", "Material UI"},
		Status:         domain.ProjectStatusOpen,
		CreatedAt:      now.Add(-2 * time.Hour),
		UpdatedAt:      now.Add(-2 * time.Hour),
		ProposalsCount: 1,
	}
	r.projects[p2ID] = p2

	prof := &domain.FreelancerProfile{
		ID:                 uuid.New(),
		UserID:             userID,
		HourlyRate:         85,
		Tagline:            "Senior Full-Stack Go & Next.js Systems Architect",
		Skills:             []string{"Go", "PostgreSQL", "Next.js", "React", "Docker"},
		PortfolioLinks:     []domain.PortfolioItem{{Title: "High-Scale Payment Pipeline", URL: "https://github.com/kirmya/go-pipeline"}},
		AvailabilityStatus: "available",
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	r.profiles[userID] = prof
}

func (r *pgxFreelanceRepository) CreateProject(ctx context.Context, proj *domain.Project) error {
	if proj.ID == uuid.Nil {
		proj.ID = uuid.New()
	}
	proj.CreatedAt = time.Now()
	proj.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.projects[proj.ID] = proj
	return nil
}

func (r *pgxFreelanceRepository) GetProjects(ctx context.Context, status string) ([]domain.Project, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Project
	for _, p := range r.projects {
		if status == "" || status == "ALL" || p.Status == status {
			list = append(list, *p)
		}
	}
	return list, nil
}

func (r *pgxFreelanceRepository) GetProjectByID(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if p, exists := r.projects[id]; exists {
		pCopy := *p
		return &pCopy, nil
	}
	return nil, fmt.Errorf("project not found: %s", id)
}

func (r *pgxFreelanceRepository) UpdateProjectStatus(ctx context.Context, id uuid.UUID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if p, exists := r.projects[id]; exists {
		p.Status = status
		p.UpdatedAt = time.Now()
	}
	return nil
}

func (r *pgxFreelanceRepository) SubmitProposal(ctx context.Context, prop *domain.Proposal) error {
	if prop.ID == uuid.Nil {
		prop.ID = uuid.New()
	}
	prop.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.proposals[prop.ID] = prop
	if p, exists := r.projects[prop.ProjectID]; exists {
		p.ProposalsCount++
	}
	return nil
}

func (r *pgxFreelanceRepository) GetProjectProposals(ctx context.Context, projectID uuid.UUID) ([]domain.Proposal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Proposal
	for _, p := range r.proposals {
		if p.ProjectID == projectID {
			list = append(list, *p)
		}
	}
	return list, nil
}

func (r *pgxFreelanceRepository) GetProposalByID(ctx context.Context, id uuid.UUID) (*domain.Proposal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if p, exists := r.proposals[id]; exists {
		pCopy := *p
		return &pCopy, nil
	}
	return nil, fmt.Errorf("proposal not found: %s", id)
}

func (r *pgxFreelanceRepository) UpdateProposalStatus(ctx context.Context, id uuid.UUID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if p, exists := r.proposals[id]; exists {
		p.Status = status
	}
	return nil
}

func (r *pgxFreelanceRepository) CreateContract(ctx context.Context, contract *domain.Contract) error {
	if contract.ID == uuid.Nil {
		contract.ID = uuid.New()
	}
	contract.CreatedAt = time.Now()
	contract.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.contracts[contract.ID] = contract
	return nil
}

func (r *pgxFreelanceRepository) GetUserContracts(ctx context.Context, userID uuid.UUID) ([]domain.Contract, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Contract
	for _, c := range r.contracts {
		if c.FreelancerID == userID || c.ClientID == userID {
			list = append(list, *c)
		}
	}
	return list, nil
}

func (r *pgxFreelanceRepository) SaveProfile(ctx context.Context, prof *domain.FreelancerProfile) error {
	if prof.ID == uuid.Nil {
		prof.ID = uuid.New()
	}
	prof.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.profiles[prof.UserID] = prof
	return nil
}

func (r *pgxFreelanceRepository) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if prof, exists := r.profiles[userID]; exists {
		profCopy := *prof
		return &profCopy, nil
	}
	return &domain.FreelancerProfile{
		ID:                 uuid.New(),
		UserID:             userID,
		HourlyRate:         75,
		Tagline:            "Software Engineer & Consultant",
		Skills:             []string{"Software Engineering"},
		PortfolioLinks:     []domain.PortfolioItem{},
		AvailabilityStatus: "available",
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}, nil
}
