package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"kirmya/internal/freelance/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// FreelanceRepository is the module's persistence boundary.
//
// Every status argument is a typed domain status rather than a string: passing
// a ProposalStatus where a ProjectStatus belongs no longer compiles, and an
// arbitrary string can no longer reach a column that has a CHECK constraint on
// it.
type FreelanceRepository interface {
	CreateProject(ctx context.Context, proj *domain.Project) error
	GetProjects(ctx context.Context, status domain.ProjectStatus) ([]domain.Project, error)
	GetProjectByID(ctx context.Context, id uuid.UUID) (*domain.Project, error)
	UpdateProjectStatus(ctx context.Context, id uuid.UUID, status domain.ProjectStatus) error
	// ListProjects is the filtered, paginated listing behind both the public
	// board and a client's own project list. The caller-scoping lives in the
	// filter's ClientID, which the service sets from the authenticated user and
	// never from a query parameter.
	ListProjects(ctx context.Context, filter domain.ProjectFilter, limit, offset int) ([]domain.Project, int, error)
	// UpdateProject applies an owner's edit. It takes the whole entity because
	// the service has already loaded, authorized and validated it.
	UpdateProject(ctx context.Context, proj *domain.Project) error

	SubmitProposal(ctx context.Context, prop *domain.Proposal) error
	GetProjectProposals(ctx context.Context, projectID uuid.UUID) ([]domain.Proposal, error)
	GetProposalByID(ctx context.Context, id uuid.UUID) (*domain.Proposal, error)
	UpdateProposalStatus(ctx context.Context, id uuid.UUID, status domain.ProposalStatus) error

	CreateContract(ctx context.Context, contract *domain.Contract) error
	GetUserContracts(ctx context.Context, userID uuid.UUID) ([]domain.Contract, error)

	SaveProfile(ctx context.Context, prof *domain.FreelancerProfile) error
	GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error)

	// AcceptProposalTx performs the proposal-acceptance flow - proposal
	// accepted, competing proposals rejected, project moved to hired, contract
	// created - as one transaction. See the method for why it cannot be four
	// separate writes.
	AcceptProposalTx(ctx context.Context, proposalID uuid.UUID, contract *domain.Contract) error

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

// projectColumns is the select list for a project, including its skills.
//
// The skills come back as a PostgreSQL array built by a correlated subquery
// rather than by a second round trip per project, which is what an N+1 over a
// project board would become.
const projectColumns = `p.id, p.client_id, p.title, p.description,
	p.budget_minor_units, p.currency, p.budget_type, p.status, p.created_at, p.updated_at,
	COALESCE(ARRAY(SELECT s.skill FROM freelance_project_skills s
	               WHERE s.project_id = p.id ORDER BY s.skill), '{}')`

func scanProject(row pgx.Row) (*domain.Project, error) {
	p := &domain.Project{}
	var budget int64
	var budgetType, status string
	var skills []string
	if err := row.Scan(&p.ID, &p.ClientID, &p.Title, &p.Description,
		&budget, &p.Currency, &budgetType, &status, &p.CreatedAt, &p.UpdatedAt, &skills); err != nil {
		return nil, err
	}
	p.Budget = domain.Amount(budget)
	p.BudgetType = domain.BudgetType(budgetType)
	p.Status = domain.ProjectStatus(status)
	p.SkillsRequired = skills
	if p.SkillsRequired == nil {
		p.SkillsRequired = []string{}
	}
	return p, nil
}

// replaceProjectSkills rewrites a project's skill rows inside a transaction.
//
// Delete-then-insert rather than a diff: the set is small, the write is inside
// the same transaction as the project row, and a diff would have to handle
// case and whitespace collisions that the normalization in the service already
// resolved.
func replaceProjectSkills(ctx context.Context, tx pgx.Tx, projectID uuid.UUID, skills []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM freelance_project_skills WHERE project_id = $1`, projectID); err != nil {
		return err
	}
	for _, skill := range skills {
		trimmed := strings.TrimSpace(skill)
		if trimmed == "" {
			continue
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO freelance_project_skills (project_id, skill) VALUES ($1, $2)
			 ON CONFLICT DO NOTHING`, projectID, trimmed); err != nil {
			return err
		}
	}
	return nil
}

// CreateProject writes the project and its skills as one unit.
//
// A transaction because they are two tables: a project that committed without
// its skills would be a posting nobody searching for those skills can find, and
// it would be indistinguishable from a project that genuinely needs none.
func (r *pgxFreelanceRepository) CreateProject(ctx context.Context, proj *domain.Project) error {
	if proj.ID == uuid.Nil {
		proj.ID = uuid.New()
	}
	now := time.Now().UTC()
	proj.CreatedAt = now
	proj.UpdatedAt = now

	if r.pool != nil {
		tx, err := r.pool.Begin(ctx)
		if err != nil {
			return err
		}
		defer func() { _ = tx.Rollback(ctx) }()

		if _, err := tx.Exec(ctx,
			`INSERT INTO freelance_projects
			   (id, client_id, title, description, budget_minor_units, currency, budget_type, status, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			proj.ID, proj.ClientID, proj.Title, proj.Description,
			int64(proj.Budget), proj.Currency, string(proj.BudgetType), string(proj.Status),
			proj.CreatedAt, proj.UpdatedAt); err != nil {
			return err
		}
		if err := replaceProjectSkills(ctx, tx, proj.ID, proj.SkillsRequired); err != nil {
			return err
		}
		return tx.Commit(ctx)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.projects[proj.ID] = proj
	return nil
}

// UpdateProject applies an owner's edit to the row and its skills together.
func (r *pgxFreelanceRepository) UpdateProject(ctx context.Context, proj *domain.Project) error {
	proj.UpdatedAt = time.Now().UTC()

	if r.pool != nil {
		tx, err := r.pool.Begin(ctx)
		if err != nil {
			return err
		}
		defer func() { _ = tx.Rollback(ctx) }()

		tag, err := tx.Exec(ctx,
			`UPDATE freelance_projects
			    SET title = $2, description = $3, budget_minor_units = $4, currency = $5,
			        budget_type = $6, status = $7, updated_at = $8
			  WHERE id = $1`,
			proj.ID, proj.Title, proj.Description, int64(proj.Budget), proj.Currency,
			string(proj.BudgetType), string(proj.Status), proj.UpdatedAt)
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return fmt.Errorf("%w: %s", ErrProjectNotFound, proj.ID)
		}
		if err := replaceProjectSkills(ctx, tx, proj.ID, proj.SkillsRequired); err != nil {
			return err
		}
		return tx.Commit(ctx)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.projects[proj.ID]; !exists {
		return fmt.Errorf("%w: %s", ErrProjectNotFound, proj.ID)
	}
	r.projects[proj.ID] = proj
	return nil
}

func (r *pgxFreelanceRepository) GetProjects(ctx context.Context, status domain.ProjectStatus) ([]domain.Project, error) {
	if r.pool != nil {
		var rows pgx.Rows
		var err error
		if status != "" && status != "ALL" {
			rows, err = r.pool.Query(ctx,
				`SELECT `+projectColumns+` FROM freelance_projects p WHERE p.status = $1 ORDER BY p.created_at DESC`,
				string(status))
		} else {
			rows, err = r.pool.Query(ctx,
				`SELECT `+projectColumns+` FROM freelance_projects p ORDER BY p.created_at DESC`)
		}
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		list := []domain.Project{}
		for rows.Next() {
			p, scanErr := scanProject(rows)
			if scanErr != nil {
				return nil, scanErr
			}
			list = append(list, *p)
		}
		// An empty result set is an empty result set. This used to fall through
		// to the seeded records below, so a table with no rows answered with
		// sample data that looked exactly like real data.
		return list, rows.Err()
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	list := []domain.Project{}
	for _, p := range r.projects {
		if status == "" || status == "ALL" || p.Status == status {
			list = append(list, *p)
		}
	}
	return list, nil
}

// sortClause maps a whitelisted sort key to an ORDER BY.
//
// A map from a closed vocabulary, never the caller's string: domain.ParseSortKey
// rejects anything not on this list before it reaches here, so no part of the
// ORDER BY is ever caller-supplied text.
var sortClause = map[domain.SortKey]string{
	domain.SortNewest:      "p.created_at DESC",
	domain.SortOldest:      "p.created_at ASC",
	domain.SortBudgetHigh:  "p.budget_minor_units DESC, p.created_at DESC",
	domain.SortBudgetLow:   "p.budget_minor_units ASC, p.created_at DESC",
	domain.SortRecentlyUpd: "p.updated_at DESC",
}

// ListProjects is the filtered listing. It returns the page and the total count
// so the caller can build the repository's standard pagination envelope.
func (r *pgxFreelanceRepository) ListProjects(ctx context.Context, filter domain.ProjectFilter, limit, offset int) ([]domain.Project, int, error) {
	if r.pool == nil {
		return nil, 0, ErrNoDatabase
	}

	var conditions []string
	var args []any
	add := func(clause string, value any) {
		args = append(args, value)
		conditions = append(conditions, fmt.Sprintf(clause, len(args)))
	}

	if filter.ClientID != uuid.Nil {
		add("p.client_id = $%d", filter.ClientID)
	}
	if len(filter.Statuses) > 0 {
		statuses := make([]string, 0, len(filter.Statuses))
		for _, s := range filter.Statuses {
			statuses = append(statuses, string(s))
		}
		add("p.status = ANY($%d)", statuses)
	}
	if filter.BudgetType != nil {
		add("p.budget_type = $%d", string(*filter.BudgetType))
	}
	if filter.Currency != "" {
		add("p.currency = $%d", filter.Currency)
	}
	if filter.MinBudget != nil {
		add("p.budget_minor_units >= $%d", *filter.MinBudget)
	}
	if filter.MaxBudget != nil {
		add("p.budget_minor_units <= $%d", *filter.MaxBudget)
	}
	if search := strings.TrimSpace(filter.Search); search != "" {
		// Parameterised and escaped: the caller's text is a value, never part
		// of the pattern's structure.
		escaped := strings.NewReplacer("\\", "\\\\", "%", "\\%", "_", "\\_").Replace(search)
		add("(p.title ILIKE '%%' || $%d || '%%' OR p.description ILIKE '%%' || $%d || '%%')", escaped)
		// The clause above consumes one placeholder twice, so re-point it.
		conditions[len(conditions)-1] = fmt.Sprintf(
			"(p.title ILIKE '%%' || $%d || '%%' OR p.description ILIKE '%%' || $%d || '%%')", len(args), len(args))
	}
	if len(filter.Skills) > 0 {
		args = append(args, filter.Skills)
		conditions = append(conditions, fmt.Sprintf(
			`EXISTS (SELECT 1 FROM freelance_project_skills s
			          WHERE s.project_id = p.id AND s.skill = ANY($%d))`, len(args)))
	}

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM freelance_projects p`+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	if total == 0 {
		return []domain.Project{}, 0, nil
	}

	order, ok := sortClause[domain.SortKey(filter.Sort)]
	if !ok {
		order = sortClause[domain.SortNewest]
	}
	args = append(args, limit, offset)
	query := `SELECT ` + projectColumns + ` FROM freelance_projects p` + where +
		` ORDER BY ` + order + fmt.Sprintf(` LIMIT $%d OFFSET $%d`, len(args)-1, len(args))

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	list := []domain.Project{}
	for rows.Next() {
		p, scanErr := scanProject(rows)
		if scanErr != nil {
			return nil, 0, scanErr
		}
		list = append(list, *p)
	}
	return list, total, rows.Err()
}

func (r *pgxFreelanceRepository) GetProjectByID(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
	if r.pool != nil {
		p, err := scanProject(r.pool.QueryRow(ctx,
			`SELECT `+projectColumns+` FROM freelance_projects p WHERE p.id = $1`, id))
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("%w: %s", ErrProjectNotFound, id)
		}
		if err != nil {
			// The database answered, and it answered with a failure. Falling
			// through to the in-memory map here is what turned a missing row -
			// or an outage - into one of the seeded demo projects.
			return nil, err
		}
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

func (r *pgxFreelanceRepository) UpdateProjectStatus(ctx context.Context, id uuid.UUID, status domain.ProjectStatus) error {
	if r.pool != nil {
		_, err := r.pool.Exec(ctx,
			`UPDATE freelance_projects SET status = $1, updated_at = $2 WHERE id = $3`,
			string(status), time.Now().UTC(), id)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if p, exists := r.projects[id]; exists {
		p.Status = status
		p.UpdatedAt = time.Now().UTC()
	}
	return nil
}

const proposalColumns = `id, project_id, freelancer_id, bid_amount_minor_units, currency,
	estimated_days, cover_letter, status, created_at, updated_at`

func scanProposal(row pgx.Row) (*domain.Proposal, error) {
	p := &domain.Proposal{}
	var bid int64
	var status string
	if err := row.Scan(&p.ID, &p.ProjectID, &p.FreelancerID, &bid, &p.Currency,
		&p.EstimatedDays, &p.CoverLetter, &status, &p.CreatedAt, &p.UpdatedAt); err != nil {
		return nil, err
	}
	p.BidAmount = domain.Amount(bid)
	p.Status = domain.ProposalStatus(status)
	return p, nil
}

func (r *pgxFreelanceRepository) SubmitProposal(ctx context.Context, prop *domain.Proposal) error {
	if prop.ID == uuid.Nil {
		prop.ID = uuid.New()
	}
	now := time.Now().UTC()
	prop.CreatedAt = now
	prop.UpdatedAt = now

	if r.pool != nil {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO freelance_proposals
			   (id, project_id, freelancer_id, bid_amount_minor_units, currency, estimated_days, cover_letter, status, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			prop.ID, prop.ProjectID, prop.FreelancerID, int64(prop.BidAmount), prop.Currency,
			prop.EstimatedDays, prop.CoverLetter, string(prop.Status), prop.CreatedAt, prop.UpdatedAt)
		if err != nil {
			// uq_freelance_proposals_live: one live bid per freelancer per
			// project. Reported as a conflict the caller can act on rather than
			// as a driver error.
			if isUniqueViolation(err) {
				return ErrProposalAlreadyExists
			}
			return err
		}
		return nil
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
		rows, err := r.pool.Query(ctx,
			`SELECT `+proposalColumns+` FROM freelance_proposals WHERE project_id = $1 ORDER BY created_at DESC`,
			projectID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		list := []domain.Proposal{}
		for rows.Next() {
			p, scanErr := scanProposal(rows)
			if scanErr != nil {
				return nil, scanErr
			}
			list = append(list, *p)
		}
		// An empty result set is an empty result set. This used to fall through
		// to the seeded records below, so a table with no rows answered with
		// sample data that looked exactly like real data.
		return list, rows.Err()
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	list := []domain.Proposal{}
	for _, p := range r.proposals {
		if p.ProjectID == projectID {
			list = append(list, *p)
		}
	}
	return list, nil
}

func (r *pgxFreelanceRepository) GetProposalByID(ctx context.Context, id uuid.UUID) (*domain.Proposal, error) {
	if r.pool != nil {
		p, err := scanProposal(r.pool.QueryRow(ctx,
			`SELECT `+proposalColumns+` FROM freelance_proposals WHERE id = $1`, id))
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

func (r *pgxFreelanceRepository) UpdateProposalStatus(ctx context.Context, id uuid.UUID, status domain.ProposalStatus) error {
	if r.pool != nil {
		_, err := r.pool.Exec(ctx,
			`UPDATE freelance_proposals SET status = $1, updated_at = NOW() WHERE id = $2`,
			string(status), id)
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

const contractColumns = `id, project_id, proposal_id, client_id, freelancer_id,
	total_amount_minor_units, currency, status, created_at, updated_at`

func scanContract(row pgx.Row) (*domain.Contract, error) {
	c := &domain.Contract{}
	var total int64
	var status string
	if err := row.Scan(&c.ID, &c.ProjectID, &c.ProposalID, &c.ClientID, &c.FreelancerID,
		&total, &c.Currency, &status, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	c.TotalAmount = domain.Amount(total)
	c.Status = domain.ContractStatus(status)
	return c, nil
}

func (r *pgxFreelanceRepository) CreateContract(ctx context.Context, contract *domain.Contract) error {
	if contract.ID == uuid.Nil {
		contract.ID = uuid.New()
	}
	now := time.Now().UTC()
	contract.CreatedAt = now
	contract.UpdatedAt = now

	if r.pool != nil {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO freelance_contracts
			   (id, project_id, proposal_id, client_id, freelancer_id, total_amount_minor_units, currency, status, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			contract.ID, contract.ProjectID, contract.ProposalID, contract.ClientID, contract.FreelancerID,
			int64(contract.TotalAmount), contract.Currency, string(contract.Status),
			contract.CreatedAt, contract.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.contracts[contract.ID] = contract
	return nil
}

// AcceptProposalTx is the proposal-acceptance flow, as one transaction.
//
// Four writes have to agree: the accepted proposal, every competing proposal on
// the same project, the project's own status, and the new contract. Run as
// separate statements, a failure between any two leaves the marketplace in a
// state no rule allows - a project hired with no contract, or a contract whose
// proposal is still open for a second client to accept.
//
// The contract insert also has uq_freelance_contracts_proposal behind it, so
// two concurrent acceptances of the same proposal cannot both produce one: the
// loser's INSERT violates the unique index and the whole transaction rolls back.
func (r *pgxFreelanceRepository) AcceptProposalTx(ctx context.Context, proposalID uuid.UUID, contract *domain.Contract) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		prop, exists := r.proposals[proposalID]
		if !exists {
			return fmt.Errorf("%w: %s", ErrProposalNotFound, proposalID)
		}
		prop.Status = domain.ProposalAccepted
		for _, other := range r.proposals {
			if other.ProjectID == prop.ProjectID && other.ID != proposalID && other.Status.IsOpen() {
				other.Status = domain.ProposalRejected
			}
		}
		if p, ok := r.projects[prop.ProjectID]; ok {
			p.Status = domain.ProjectHired
		}
		if contract.ID == uuid.Nil {
			contract.ID = uuid.New()
		}
		contract.CreatedAt = time.Now().UTC()
		contract.UpdatedAt = contract.CreatedAt
		r.contracts[contract.ID] = contract
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// Guarded on the current status rather than blindly set: if the proposal is
	// no longer open, no row is updated and the whole flow stops here, which is
	// what makes a double acceptance impossible rather than merely unlikely.
	tag, err := tx.Exec(ctx,
		`UPDATE freelance_proposals SET status = 'accepted', updated_at = NOW()
		  WHERE id = $1 AND status IN ('submitted', 'viewed', 'shortlisted')`, proposalID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrProposalNotOpen
	}

	if _, err := tx.Exec(ctx,
		`UPDATE freelance_proposals SET status = 'rejected', updated_at = NOW()
		  WHERE project_id = $1 AND id <> $2 AND status IN ('submitted', 'viewed', 'shortlisted')`,
		contract.ProjectID, proposalID); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx,
		`UPDATE freelance_projects SET status = 'hired', updated_at = NOW() WHERE id = $1`,
		contract.ProjectID); err != nil {
		return err
	}

	if contract.ID == uuid.Nil {
		contract.ID = uuid.New()
	}
	now := time.Now().UTC()
	contract.CreatedAt = now
	contract.UpdatedAt = now
	if _, err := tx.Exec(ctx,
		`INSERT INTO freelance_contracts
		   (id, project_id, proposal_id, client_id, freelancer_id, total_amount_minor_units, currency, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		contract.ID, contract.ProjectID, contract.ProposalID, contract.ClientID, contract.FreelancerID,
		int64(contract.TotalAmount), contract.Currency, string(contract.Status),
		contract.CreatedAt, contract.UpdatedAt); err != nil {
		if isUniqueViolation(err) {
			return ErrProposalAlreadyAccepted
		}
		return err
	}

	return tx.Commit(ctx)
}

func (r *pgxFreelanceRepository) GetUserContracts(ctx context.Context, userID uuid.UUID) ([]domain.Contract, error) {
	if r.pool != nil {
		rows, err := r.pool.Query(ctx,
			`SELECT `+contractColumns+` FROM freelance_contracts
			  WHERE freelancer_id = $1 OR client_id = $1 ORDER BY created_at DESC`, userID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		list := []domain.Contract{}
		for rows.Next() {
			c, scanErr := scanContract(rows)
			if scanErr != nil {
				return nil, scanErr
			}
			list = append(list, *c)
		}
		// An empty result set is an empty result set. This used to fall through
		// to the seeded records below, so a table with no rows answered with
		// sample data that looked exactly like real data.
		return list, rows.Err()
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	list := []domain.Contract{}
	for _, c := range r.contracts {
		if c.FreelancerID == userID || c.ClientID == userID {
			list = append(list, *c)
		}
	}
	return list, nil
}

// SaveProfile writes the profile and its portfolio rows as one unit.
func (r *pgxFreelanceRepository) SaveProfile(ctx context.Context, prof *domain.FreelancerProfile) error {
	if prof.ID == uuid.Nil {
		prof.ID = uuid.New()
	}
	prof.UpdatedAt = time.Now().UTC()
	if prof.CreatedAt.IsZero() {
		prof.CreatedAt = prof.UpdatedAt
	}

	if r.pool != nil {
		tx, err := r.pool.Begin(ctx)
		if err != nil {
			return err
		}
		defer func() { _ = tx.Rollback(ctx) }()

		skillsBytes, _ := json.Marshal(prof.Skills)
		// capability_status is absent from both the column list and the
		// DO UPDATE set, deliberately. Saving profile details must not move the
		// lifecycle: a new row takes the column default ('pending') and an
		// existing row keeps whatever it has, so editing a tagline cannot
		// activate a pending capability or lift a suspension.
		//
		// RETURNING reports the status the database actually holds, so the
		// caller is told the real state rather than the one it sent.
		var capabilityStatus string
		if err := tx.QueryRow(ctx,
			`INSERT INTO freelancer_profiles
			   (id, user_id, hourly_rate_minor_units, currency, tagline, skills, availability_status, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			 ON CONFLICT (user_id) DO UPDATE SET
			   hourly_rate_minor_units = EXCLUDED.hourly_rate_minor_units,
			   currency = EXCLUDED.currency,
			   tagline = EXCLUDED.tagline,
			   skills = EXCLUDED.skills,
			   availability_status = EXCLUDED.availability_status,
			   updated_at = EXCLUDED.updated_at
			 RETURNING id, capability_status`,
			prof.ID, prof.UserID, int64(prof.HourlyRate), prof.Currency, prof.Tagline, skillsBytes,
			string(prof.AvailabilityStatus), prof.CreatedAt, prof.UpdatedAt,
		).Scan(&prof.ID, &capabilityStatus); err != nil {
			return err
		}
		prof.CapabilityStatus = domain.CapabilityStatus(normaliseCapability(capabilityStatus))

		if _, err := tx.Exec(ctx,
			`DELETE FROM freelance_portfolio_items WHERE profile_id = $1`, prof.ID); err != nil {
			return err
		}
		for position, item := range prof.PortfolioLinks {
			title := strings.TrimSpace(item.Title)
			if title == "" {
				continue
			}
			if _, err := tx.Exec(ctx,
				`INSERT INTO freelance_portfolio_items (profile_id, title, url, description, position)
				 VALUES ($1, $2, $3, $4, $5)`,
				prof.ID, title, item.URL, item.Description, position); err != nil {
				return err
			}
		}
		return tx.Commit(ctx)
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
	// ErrProposalAlreadyExists reports uq_freelance_proposals_live: this
	// freelancer already has a live bid on this project.
	ErrProposalAlreadyExists = errors.New("a live proposal from this freelancer already exists on this project")
	// ErrProposalNotOpen means the bid is no longer in a state that can be
	// accepted - already accepted, rejected or withdrawn.
	ErrProposalNotOpen = errors.New("this proposal is not open")
	// ErrProposalAlreadyAccepted reports uq_freelance_contracts_proposal: a
	// contract already exists for this proposal.
	ErrProposalAlreadyAccepted = errors.New("this proposal has already been accepted")
	// ErrFreelancerSuspended reports that the capability exists but was
	// withdrawn. Distinct from "not onboarded" so the API can tell the two
	// apart: one is resolved by onboarding, the other only by an administrator.
	ErrFreelancerSuspended = errors.New("freelancer capability is suspended")
)

// isUniqueViolation reports a PostgreSQL 23505, which is how a partial unique
// index refuses a duplicate. Matching on the SQLSTATE rather than on the
// message, which is localised and can change between releases.
func isUniqueViolation(err error) bool {
	var pgErr interface{ SQLState() string }
	if errors.As(err, &pgErr) {
		return pgErr.SQLState() == "23505"
	}
	return false
}

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
		prof := &domain.FreelancerProfile{}
		var skillsBytes []byte
		var capabilityStatus, availability string
		var rate int64
		err := r.pool.QueryRow(ctx,
			`SELECT id, user_id, hourly_rate_minor_units, currency, tagline, skills,
			        availability_status, capability_status, created_at, updated_at
			   FROM freelancer_profiles WHERE user_id = $1`, userID).Scan(
			&prof.ID, &prof.UserID, &rate, &prof.Currency, &prof.Tagline, &skillsBytes,
			&availability, &capabilityStatus, &prof.CreatedAt, &prof.UpdatedAt)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		if err != nil {
			return nil, err
		}
		prof.HourlyRate = domain.Amount(rate)
		prof.AvailabilityStatus = domain.AvailabilityStatus(availability)
		_ = json.Unmarshal(skillsBytes, &prof.Skills)
		prof.CapabilityStatus = domain.CapabilityStatus(normaliseCapability(capabilityStatus))

		items, err := r.portfolioFor(ctx, prof.ID)
		if err != nil {
			return nil, err
		}
		prof.PortfolioLinks = items
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

// portfolioFor reads a profile's portfolio rows in display order.
func (r *pgxFreelanceRepository) portfolioFor(ctx context.Context, profileID uuid.UUID) ([]domain.PortfolioItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, title, COALESCE(url, ''), COALESCE(description, ''), position
		   FROM freelance_portfolio_items WHERE profile_id = $1 ORDER BY position, title`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []domain.PortfolioItem{}
	for rows.Next() {
		var item domain.PortfolioItem
		if err := rows.Scan(&item.ID, &item.Title, &item.URL, &item.Description, &item.Position); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
