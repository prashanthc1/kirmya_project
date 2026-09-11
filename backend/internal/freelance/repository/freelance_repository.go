package repository

import (
	"context"
	"encoding/json"
	"errors"
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

	// FreelancerCapability is the single authority for "may this account act as
	// a freelancer right now". Everything else - the workspace resolver, the
	// route middleware, the service - asks this and nothing else.
	FreelancerCapability(ctx context.Context, userID uuid.UUID) (CapabilityStatus, error)
	ActivateFreelancerCapability(ctx context.Context, userID uuid.UUID) error
	SetFreelancerCapability(ctx context.Context, userID uuid.UUID, status CapabilityStatus) error
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
	// No seeding. The demo records this used to install - two projects, a
	// proposal, a contract and a "Principal Go & Distributed Systems Architect"
	// profile, all for one hardcoded user id - went into the same maps the
	// pooled read paths fell back to, so a project that did not exist in
	// PostgreSQL was answered with a fabricated one. See GetProjectByID.
	return repo
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
			// An empty result set is an empty result set. This used to fall through
			// to the seeded records below, so a table with no rows answered with
			// sample data that looked exactly like real data.
			return list, rows.Err()
		}
		return nil, err
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
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("%w: %s", ErrProjectNotFound, id)
		}
		if err != nil {
			// The database answered, and it answered with a failure. Falling
			// through to the in-memory map here is what turned a missing row -
			// or an outage - into one of the seeded demo projects.
			return nil, err
		}
		_ = json.Unmarshal(skillsBytes, &p.SkillsRequired)
		return p, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if p, exists := r.projects[id]; exists {
		pCopy := *p
		return &pCopy, nil
	}
	return nil, fmt.Errorf("%w: %s", ErrProjectNotFound, id)
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
			// An empty result set is an empty result set. This used to fall through
			// to the seeded records below, so a table with no rows answered with
			// sample data that looked exactly like real data.
			return list, rows.Err()
		}
		return nil, err
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
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("%w: %s", ErrProposalNotFound, id)
		}
		if err != nil {
			return nil, err
		}
		return p, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if p, exists := r.proposals[id]; exists {
		pCopy := *p
		return &pCopy, nil
	}
	return nil, fmt.Errorf("%w: %s", ErrProposalNotFound, id)
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
			// An empty result set is an empty result set. This used to fall through
			// to the seeded records below, so a table with no rows answered with
			// sample data that looked exactly like real data.
			return list, rows.Err()
		}
		return nil, err
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
		          ON CONFLICT (user_id) DO UPDATE SET hourly_rate = EXCLUDED.hourly_rate, tagline = EXCLUDED.tagline, skills = EXCLUDED.skills, portfolio_links = EXCLUDED.portfolio_links, availability_status = EXCLUDED.availability_status, updated_at = EXCLUDED.updated_at
		          RETURNING id, capability_status`
		var capabilityStatus string
		// capability_status is absent from both the column list and the
		// DO UPDATE set, deliberately. Saving profile details must not move the
		// lifecycle: a new row takes the column default ('pending') and an
		// existing row keeps whatever it has, so editing a tagline cannot
		// activate a pending capability or lift a suspension.
		//
		// RETURNING reports the status the database actually holds, so the
		// caller is told the real state rather than the one it sent.
		if err := r.pool.QueryRow(ctx, query,
			prof.ID, prof.UserID, prof.HourlyRate, prof.Tagline, skillsBytes, portfolioBytes,
			prof.AvailabilityStatus, prof.CreatedAt, prof.UpdatedAt,
		).Scan(&prof.ID, &capabilityStatus); err != nil {
			return err
		}
		prof.CapabilityStatus = domain.CapabilityStatus(normaliseCapability(capabilityStatus))
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	// Same rule without a database: an existing profile keeps its lifecycle
	// state, a new one starts pending.
	if existing, ok := r.profiles[prof.UserID]; ok {
		prof.CapabilityStatus = existing.CapabilityStatus
	} else if prof.CapabilityStatus == "" {
		prof.CapabilityStatus = domain.CapabilityPending
	}
	r.profiles[prof.UserID] = prof
	return nil
}

// Errors a caller can act on, rather than a formatted string it must match.
var (
	// ErrNoDatabase reports that a query needing PostgreSQL was asked of a
	// repository that has none.
	ErrNoDatabase = errors.New("freelance repository requires PostgreSQL")
	// ErrProfileNotFound means the account has no freelancer profile row.
	ErrProfileNotFound = errors.New("freelancer profile not found")
	// ErrProjectNotFound means no such project.
	ErrProjectNotFound = errors.New("project not found")
	// ErrProposalNotFound means no such proposal.
	ErrProposalNotFound = errors.New("proposal not found")
	// ErrFreelancerSuspended reports that the capability exists but was
	// withdrawn. Distinct from "not onboarded" so the API can tell the two
	// apart: one is resolved by onboarding, the other only by an administrator.
	ErrFreelancerSuspended = errors.New("freelancer capability is suspended")
)

// CapabilityStatus is the freelancer capability lifecycle for one account.
type CapabilityStatus string

const (
	// CapabilityNone means no freelancer profile exists at all.
	CapabilityNone CapabilityStatus = "none"
	// CapabilityPending means a profile exists but onboarding is not complete.
	CapabilityPending CapabilityStatus = "pending"
	// CapabilityActive means onboarding completed and the capability is usable.
	CapabilityActive CapabilityStatus = "active"
	// CapabilitySuspended means an administrator withdrew the capability.
	CapabilitySuspended CapabilityStatus = "suspended"
)

// FreelancerCapability reads the caller's freelancer capability state.
//
// This is the single authority for "does this account hold usable Freelancer
// capability". It reads the database and nothing else: not users.role_id, not
// the workspace the client claims to be in, not whether a proposal or contract
// exists, not whether anybody has visited /freelance. Profile existence is no
// longer the rule - it was, and that is why freelancing could not be withdrawn
// without suspending the whole account.
//
// A missing profile is CapabilityNone rather than an error, because "this
// account is not a freelancer" is an ordinary answer rather than a failure.
func (r *pgxFreelanceRepository) FreelancerCapability(ctx context.Context, userID uuid.UUID) (CapabilityStatus, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		prof, exists := r.profiles[userID]
		if !exists {
			return CapabilityNone, nil
		}
		return normaliseCapability(string(prof.CapabilityStatus)), nil
	}

	var status string
	err := r.pool.QueryRow(ctx,
		`SELECT capability_status FROM freelancer_profiles WHERE user_id = $1`, userID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return CapabilityNone, nil
	}
	if err != nil {
		// A failed lookup must not become access. It becomes no access, and the
		// error is returned so the caller answers 500 rather than 403 - denying
		// for the wrong reason hides an outage behind an authorization message.
		return CapabilityNone, err
	}
	return normaliseCapability(status), nil
}

// normaliseCapability refuses to guess. An unrecognised value is not a grant,
// and the safe reading of a value the code does not know is the state that
// permits nothing but onboarding.
func normaliseCapability(status string) CapabilityStatus {
	switch CapabilityStatus(status) {
	case CapabilityActive, CapabilityPending, CapabilitySuspended:
		return CapabilityStatus(status)
	default:
		return CapabilityPending
	}
}

// ActivateFreelancerCapability completes onboarding for an existing profile.
//
// Separate from profile creation on purpose: creating the row and being allowed
// to freelance are two decisions, and collapsing them is what made an empty
// POST body enough to acquire the workspace. A suspended capability is not
// reactivated here - that is an administrative decision, not a self-service
// one, which is why the UPDATE is guarded on 'pending'.
func (r *pgxFreelanceRepository) ActivateFreelancerCapability(ctx context.Context, userID uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		prof, exists := r.profiles[userID]
		if !exists {
			r.mu.Unlock()
			return ErrProfileNotFound
		}
		current := normaliseCapability(string(prof.CapabilityStatus))
		if current == CapabilitySuspended {
			r.mu.Unlock()
			return ErrFreelancerSuspended
		}
		prof.CapabilityStatus = domain.CapabilityActive
		r.mu.Unlock()
		return nil
	}

	tag, err := r.pool.Exec(ctx,
		`UPDATE freelancer_profiles SET capability_status = 'active', updated_at = NOW()
		 WHERE user_id = $1 AND capability_status = 'pending'`, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		// Either there is no profile, or it is already active, or it is
		// suspended. Re-read so the caller can tell which.
		status, statusErr := r.FreelancerCapability(ctx, userID)
		if statusErr != nil {
			return statusErr
		}
		switch status {
		case CapabilitySuspended:
			return ErrFreelancerSuspended
		case CapabilityNone:
			return ErrProfileNotFound
		}
	}
	return nil
}

// SetFreelancerCapability moves an existing capability to a given state.
//
// The administrative path: suspend, and reinstate. It updates rather than
// deletes, so the profile, its portfolio, and every proposal and contract
// attached to it survive a suspension and are still there on the way back.
// It will not create a profile, so an administrator cannot make somebody a
// freelancer who never chose to be one.
func (r *pgxFreelanceRepository) SetFreelancerCapability(ctx context.Context, userID uuid.UUID, status CapabilityStatus) error {
	switch status {
	case CapabilityPending, CapabilityActive, CapabilitySuspended:
	default:
		return fmt.Errorf("unknown freelancer capability status: %q", status)
	}

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		prof, exists := r.profiles[userID]
		if !exists {
			return ErrProfileNotFound
		}
		prof.CapabilityStatus = domain.CapabilityStatus(status)
		return nil
	}

	tag, err := r.pool.Exec(ctx,
		`UPDATE freelancer_profiles SET capability_status = $2, updated_at = NOW() WHERE user_id = $1`,
		userID, string(status))
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrProfileNotFound
	}
	return nil
}

func (r *pgxFreelanceRepository) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, hourly_rate, tagline, skills, portfolio_links, availability_status, capability_status, created_at, updated_at FROM freelancer_profiles WHERE user_id = $1`
		prof := &domain.FreelancerProfile{}
		var skillsBytes, portfolioBytes []byte
		var capabilityStatus string
		err := r.pool.QueryRow(ctx, query, userID).Scan(
			&prof.ID, &prof.UserID, &prof.HourlyRate, &prof.Tagline, &skillsBytes, &portfolioBytes, &prof.AvailabilityStatus, &capabilityStatus, &prof.CreatedAt, &prof.UpdatedAt,
		)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		if err != nil {
			return nil, err
		}
		_ = json.Unmarshal(skillsBytes, &prof.Skills)
		_ = json.Unmarshal(portfolioBytes, &prof.PortfolioLinks)
		prof.CapabilityStatus = domain.CapabilityStatus(normaliseCapability(capabilityStatus))
		return prof, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if prof, exists := r.profiles[userID]; exists {
		profCopy := *prof
		return &profCopy, nil
	}
	// An account with no freelancer profile has no freelancer profile.
	//
	// This used to answer with an invented one - a "Software Engineer &
	// Consultant" charging 75 an hour, with a fabricated id, for whoever asked.
	// It meant the freelancer profile endpoint never returned "not found", that
	// any caller could be shown business details nobody had entered, and that
	// an existence check built on this method would have said yes for the whole
	// user base. The capability lookup below deliberately reads the database
	// rather than reusing this method, and now there is nothing left for it to
	// be confused by.
	return nil, ErrProfileNotFound
}
