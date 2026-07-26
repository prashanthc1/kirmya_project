package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/trust_safety/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TrustRepository interface {
	CreateReport(ctx context.Context, report *domain.Report) error
	GetReports(ctx context.Context, status string) ([]domain.Report, error)
	UpdateReportStatus(ctx context.Context, id uuid.UUID, status string) error

	LogAction(ctx context.Context, action *domain.ModerationAction) error
	GetModerationActions(ctx context.Context) ([]domain.ModerationAction, error)

	IssueBadge(ctx context.Context, badge *domain.VerificationBadge) error
	GetBadges(ctx context.Context, entityType string, entityID uuid.UUID) ([]domain.VerificationBadge, error)

	LogFraud(ctx context.Context, fraud *domain.FraudLog) error
	GetFraudLogs(ctx context.Context) ([]domain.FraudLog, error)
}

type pgxTrustRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	reports   map[uuid.UUID]*domain.Report
	actions   []domain.ModerationAction
	badges    map[uuid.UUID][]domain.VerificationBadge
	fraudLogs []domain.FraudLog
}

func NewTrustRepository(pool *pgxpool.Pool) TrustRepository {
	repo := &pgxTrustRepository{
		pool:    pool,
		reports: make(map[uuid.UUID]*domain.Report),
		badges:  make(map[uuid.UUID][]domain.VerificationBadge),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxTrustRepository) seedDefaultData() {
	now := time.Now()
	reporterID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")

	r1ID := uuid.New()
	r.reports[r1ID] = &domain.Report{
		ID:         r1ID,
		ReporterID: reporterID,
		TargetType: domain.TargetTypeJob,
		TargetID:   uuid.MustParse("j9999999-9999-9999-9999-999999999999"),
		TargetName: "Suspicious Remote Data Entry Job ($200/hr no experience)",
		Category:   "fake_job",
		Reason:     "Job post requests upfront processing fee before interview.",
		Status:     domain.ReportStatusPending,
		CreatedAt:  now.Add(-30 * time.Minute),
	}

	r2ID := uuid.New()
	r.reports[r2ID] = &domain.Report{
		ID:         r2ID,
		ReporterID: reporterID,
		TargetType: domain.TargetTypeUser,
		TargetID:   uuid.New(),
		TargetName: "Unverified Recruiter Bot Account",
		Category:   "spam",
		Reason:     "Sending unsolicited automated phishing links in direct messages.",
		Status:     domain.ReportStatusPending,
		CreatedAt:  now.Add(-2 * time.Hour),
	}

	r.fraudLogs = []domain.FraudLog{
		{
			ID:          uuid.New(),
			EntityType:  domain.TargetTypeJob,
			EntityID:    uuid.MustParse("j9999999-9999-9999-9999-999999999999"),
			EntityTitle: "Suspicious Remote Data Entry Job ($200/hr no experience)",
			FraudScore:  94.50,
			Triggers:    []string{"Upfront fee request keyword", "Unusually high wage for low skill", "New unverified employer account"},
			ActionTaken: "Flagged for manual moderation review",
			CreatedAt:   now.Add(-30 * time.Minute),
		},
	}

	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	r.badges[userID] = []domain.VerificationBadge{
		{
			ID:         uuid.New(),
			EntityID:   userID,
			EntityType: domain.TargetTypeUser,
			BadgeType:  domain.BadgeIdentityVerified,
			IssuedAt:   now,
		},
		{
			ID:         uuid.New(),
			EntityID:   userID,
			EntityType: domain.TargetTypeUser,
			BadgeType:  domain.BadgeEmploymentVerified,
			IssuedAt:   now,
		},
	}
}

func (r *pgxTrustRepository) CreateReport(ctx context.Context, report *domain.Report) error {
	if report.ID == uuid.Nil {
		report.ID = uuid.New()
	}
	report.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.reports[report.ID] = report
	return nil
}

func (r *pgxTrustRepository) GetReports(ctx context.Context, status string) ([]domain.Report, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Report
	for _, rep := range r.reports {
		if status == "" || status == "ALL" || rep.Status == status {
			list = append(list, *rep)
		}
	}
	return list, nil
}

func (r *pgxTrustRepository) UpdateReportStatus(ctx context.Context, id uuid.UUID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if rep, exists := r.reports[id]; exists {
		rep.Status = status
	}
	return nil
}

func (r *pgxTrustRepository) LogAction(ctx context.Context, action *domain.ModerationAction) error {
	if action.ID == uuid.Nil {
		action.ID = uuid.New()
	}
	action.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.actions = append([]domain.ModerationAction{*action}, r.actions...)
	return nil
}

func (r *pgxTrustRepository) GetModerationActions(ctx context.Context) ([]domain.ModerationAction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.actions, nil
}

func (r *pgxTrustRepository) IssueBadge(ctx context.Context, badge *domain.VerificationBadge) error {
	if badge.ID == uuid.Nil {
		badge.ID = uuid.New()
	}
	badge.IssuedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.badges[badge.EntityID] = append(r.badges[badge.EntityID], *badge)
	return nil
}

func (r *pgxTrustRepository) GetBadges(ctx context.Context, entityType string, entityID uuid.UUID) ([]domain.VerificationBadge, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.badges[entityID], nil
}

func (r *pgxTrustRepository) LogFraud(ctx context.Context, fraud *domain.FraudLog) error {
	if fraud.ID == uuid.Nil {
		fraud.ID = uuid.New()
	}
	fraud.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.fraudLogs = append([]domain.FraudLog{*fraud}, r.fraudLogs...)
	return nil
}

func (r *pgxTrustRepository) GetFraudLogs(ctx context.Context) ([]domain.FraudLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.fraudLogs, nil
}
