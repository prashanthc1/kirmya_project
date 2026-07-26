package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/freelance/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
		Title:          "PostgreSQL Query Optimization & Indexing Benchmark",
		Description:    "Audit 38 migration files and add GIN / partial indexes for 10M rows scale",
		Budget:         3500,
		BudgetType:     domain.BudgetTypeFixed,
		SkillsRequired: []string{"PostgreSQL", "Go", "Database Tuning"},
		Status:         domain.ProjectStatusOpen,
		ProposalsCount: 8,
		CreatedAt:      now.Add(-6 * time.Hour),
		UpdatedAt:      now.Add(-6 * time.Hour),
	}

	p2ID := uuid.MustParse("f2222222-2222-2222-2222-222222222222")
	p2 := &domain.Project{
		ID:             p2ID,
		ClientID:       clientID,
		Title:          "Next.js MUI v6 Glassmorphism Dashboard Engineering",
		Description:    "Build high-performance recruiter talent pipeline UI components",
		Budget:         120,
		BudgetType:     domain.BudgetTypeHourly,
		SkillsRequired: []string{"Next.js", "TypeScript", "MUI v6", "React"},
		Status:         domain.ProjectStatusInProgress,
		ProposalsCount: 14,
		CreatedAt:      now.Add(-48 * time.Hour),
		UpdatedAt:      now.Add(-48 * time.Hour),
	}

	r.projects[p1.ID] = p1
	r.projects[p2.ID] = p2

	prop1ID := uuid.New()
	prop1 := &domain.Proposal{
		ID:            prop1ID,
		ProjectID:     p1ID,
		FreelancerID:  userID,
		BidAmount:     3400,
		EstimatedDays: 4,
		CoverLetter:   "Staff Database Architect with extensive experience in pgxpool connection management.",
		Status:        domain.ProposalStatusSubmitted,
		CreatedAt:     now.Add(-2 * time.Hour),
	}
	r.proposals[prop1ID] = prop1

	contract1ID := uuid.New()
	contract1 := &domain.Contract{
		ID:           contract1ID,
		ProjectID:    p2ID,
		ProposalID:   uuid.New(),
		ClientID:     clientID,
		FreelancerID: userID,
		TotalAmount:  4800,
		Status:       "active",
		CreatedAt:    now.Add(-24 * time.Hour),
		UpdatedAt:    now.Add(-24 * time.Hour),
	}
	r.contracts[contract1ID] = contract1

	r.profiles[userID] = &domain.FreelancerProfile{
		ID:                 uuid.New(),
		UserID:             userID,
		HourlyRate:         125,
		Tagline:            "Principal Go & Distributed Systems Architect",
		Skills:             []string{"Go", "PostgreSQL", "Microservices", "System Design", "Docker"},
		PortfolioLinks:     []domain.PortfolioItem{{Title: "Kirmya Core Architecture", URL: "https://kirmya.com"}},
		AvailabilityStatus: "available",
		CreatedAt:          now,
		UpdatedAt:          now,
	}
}

func (r *pgxFreelanceRepository) CreateProject(ctx context.Context, proj *domain.Project) error {
	if proj.ID == uuid.Nil {
		proj.ID = uuid.New()
	}
	proj.CreatedAt = time.Now()
	proj.UpdatedAt = time.Now()

	if r.pool != nil {
		skillsBytes, _ := json.Marshal(proj.SkillsRequired)
		query := `INSERT INTO projects (id, client_id, title, description, budget, budget_type, skills_required, status, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
		_, err := r.pool.Exec(ctx, query, proj.ID, proj.ClientID, proj.Title, proj.Description, proj.Budget, proj.BudgetType, skillsBytes, proj.Status, proj.CreatedAt, proj.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.projects[proj.ID] = proj
	return nil
}

func (r *pgxFreelanceRepository) GetProjects(ctx context.Context, status string) ([]domain.Project, error) {
	if r.pool != nil {
		var query string
		var rows pgx.Rows
		var err error

		if status != "" && status != "ALL" {
			query = `SELECT id, client_id, title, description, budget, budget_type, skills_required, status, created_at, updated_at FROM projects WHERE status = $1 ORDER BY created_at DESC`
			rows, err = r.pool.Query(ctx, query, status)
		} else {
			query = `SELECT id, client_id, title, description, budget, budget_type, skills_required, status, created_at, updated_at FROM projects ORDER BY created_at DESC`
			rows, err = r.pool.Query(ctx, query)
		}

		if err == nil {
			defer rows.Close()
			var list []domain.Project
			for rows.Next() {
				var p domain.Project
				var skillsBytes []byte
				if err := rows.Scan(&p.ID, &p.ClientID, &p.Title, &p.Description, &p.Budget, &p.BudgetType, &skillsBytes, &p.Status, &p.CreatedAt, &p.UpdatedAt); err == nil {
					_ = json.Unmarshal(skillsBytes, &p.SkillsRequired)
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

	var list []domain.Project
	for _, p := range r.projects {
		if status == "" || status == "ALL" || p.Status == status {
			list = append(list, *p)
		}
	}
	return list, nil
}

func (r *pgxFreelanceRepository) GetProjectByID(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
	if r.pool != nil {
		query := `SELECT id, client_id, title, description, budget, budget_type, skills_required, status, created_at, updated_at FROM projects WHERE id = $1`
		p := &domain.Project{}
		var skillsBytes []byte
		err := r.pool.QueryRow(ctx, query, id).Scan(
			&p.ID, &p.ClientID, &p.Title, &p.Description, &p.Budget, &p.BudgetType, &skillsBytes, &p.Status, &p.CreatedAt, &p.UpdatedAt,
		)
		if err == nil {
			_ = json.Unmarshal(skillsBytes, &p.SkillsRequired)
			return p, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if p, exists := r.projects[id]; exists {
		pCopy := *p
		return &pCopy, nil
	}
	return nil, fmt.Errorf("project not found: %s", id)
}

func (r *pgxFreelanceRepository) UpdateProjectStatus(ctx context.Context, id uuid.UUID, status string) error {
	if r.pool != nil {
		query := `UPDATE projects SET status = $1, updated_at = $2 WHERE id = $3`
		_, err := r.pool.Exec(ctx, query, status, time.Now(), id)
		if err != nil {
			return err
		}
	}

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

	if r.pool != nil {
		query := `INSERT INTO proposals (id, project_id, freelancer_id, bid_amount, estimated_days, cover_letter, status, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
		_, err := r.pool.Exec(ctx, query, prop.ID, prop.ProjectID, prop.FreelancerID, prop.BidAmount, prop.EstimatedDays, prop.CoverLetter, prop.Status, prop.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.proposals[prop.ID] = prop
	if p, exists := r.projects[prop.ProjectID]; exists {
		p.ProposalsCount++
	}
	return nil
}

func (r *pgxFreelanceRepository) GetProjectProposals(ctx context.Context, projectID uuid.UUID) ([]domain.Proposal, error) {
	if r.pool != nil {
		query := `SELECT id, project_id, freelancer_id, bid_amount, estimated_days, cover_letter, status, created_at FROM proposals WHERE project_id = $1 ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query, projectID)
		if err == nil {
			defer rows.Close()
			var list []domain.Proposal
			for rows.Next() {
				var p domain.Proposal
				if err := rows.Scan(&p.ID, &p.ProjectID, &p.FreelancerID, &p.BidAmount, &p.EstimatedDays, &p.CoverLetter, &p.Status, &p.CreatedAt); err == nil {
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

	var list []domain.Proposal
	for _, p := range r.proposals {
		if p.ProjectID == projectID {
			list = append(list, *p)
		}
	}
	return list, nil
}

func (r *pgxFreelanceRepository) GetProposalByID(ctx context.Context, id uuid.UUID) (*domain.Proposal, error) {
	if r.pool != nil {
		query := `SELECT id, project_id, freelancer_id, bid_amount, estimated_days, cover_letter, status, created_at FROM proposals WHERE id = $1`
		p := &domain.Proposal{}
		err := r.pool.QueryRow(ctx, query, id).Scan(
			&p.ID, &p.ProjectID, &p.FreelancerID, &p.BidAmount, &p.EstimatedDays, &p.CoverLetter, &p.Status, &p.CreatedAt,
		)
		if err == nil {
			return p, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if p, exists := r.proposals[id]; exists {
		pCopy := *p
		return &pCopy, nil
	}
	return nil, fmt.Errorf("proposal not found: %s", id)
}

func (r *pgxFreelanceRepository) UpdateProposalStatus(ctx context.Context, id uuid.UUID, status string) error {
	if r.pool != nil {
		query := `UPDATE proposals SET status = $1 WHERE id = $2`
		_, err := r.pool.Exec(ctx, query, status, id)
		if err != nil {
			return err
		}
	}

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

	if r.pool != nil {
		query := `INSERT INTO contracts (id, project_id, proposal_id, client_id, freelancer_id, total_amount, status, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
		_, err := r.pool.Exec(ctx, query, contract.ID, contract.ProjectID, contract.ProposalID, contract.ClientID, contract.FreelancerID, contract.TotalAmount, contract.Status, contract.CreatedAt, contract.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.contracts[contract.ID] = contract
	return nil
}

func (r *pgxFreelanceRepository) GetUserContracts(ctx context.Context, userID uuid.UUID) ([]domain.Contract, error) {
	if r.pool != nil {
		query := `SELECT id, project_id, proposal_id, client_id, freelancer_id, total_amount, status, created_at, updated_at FROM contracts WHERE freelancer_id = $1 OR client_id = $1 ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.Contract
			for rows.Next() {
				var c domain.Contract
				if err := rows.Scan(&c.ID, &c.ProjectID, &c.ProposalID, &c.ClientID, &c.FreelancerID, &c.TotalAmount, &c.Status, &c.CreatedAt, &c.UpdatedAt); err == nil {
					list = append(list, c)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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

	if r.pool != nil {
		skillsBytes, _ := json.Marshal(prof.Skills)
		portfolioBytes, _ := json.Marshal(prof.PortfolioLinks)
		query := `INSERT INTO freelancer_profiles (id, user_id, hourly_rate, tagline, skills, portfolio_links, availability_status, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
		          ON CONFLICT (user_id) DO UPDATE SET hourly_rate = EXCLUDED.hourly_rate, tagline = EXCLUDED.tagline, skills = EXCLUDED.skills, portfolio_links = EXCLUDED.portfolio_links, availability_status = EXCLUDED.availability_status, updated_at = EXCLUDED.updated_at`
		_, err := r.pool.Exec(ctx, query, prof.ID, prof.UserID, prof.HourlyRate, prof.Tagline, skillsBytes, portfolioBytes, prof.AvailabilityStatus, prof.CreatedAt, prof.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.profiles[prof.UserID] = prof
	return nil
}

func (r *pgxFreelanceRepository) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, hourly_rate, tagline, skills, portfolio_links, availability_status, created_at, updated_at FROM freelancer_profiles WHERE user_id = $1`
		prof := &domain.FreelancerProfile{}
		var skillsBytes, portfolioBytes []byte
		err := r.pool.QueryRow(ctx, query, userID).Scan(
			&prof.ID, &prof.UserID, &prof.HourlyRate, &prof.Tagline, &skillsBytes, &portfolioBytes, &prof.AvailabilityStatus, &prof.CreatedAt, &prof.UpdatedAt,
		)
		if err == nil {
			_ = json.Unmarshal(skillsBytes, &prof.Skills)
			_ = json.Unmarshal(portfolioBytes, &prof.PortfolioLinks)
			return prof, nil
		}
	}

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
