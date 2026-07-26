package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/trust_safety/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
		TargetID:   uuid.MustParse("a9999999-9999-9999-9999-999999999999"),
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
		TargetName: "Spam Recruiter Bot",
		Category:   "spam",
		Reason:     "Automated repetitive cold messaging across 50 candidate profiles.",
		Status:     domain.ReportStatusResolved,
		CreatedAt:  now.Add(-2 * time.Hour),
	}

	modID := uuid.New()
	r.actions = []domain.ModerationAction{
		{
			ID:          uuid.New(),
			ModeratorID: modID,
			TargetID:    r2ID,
			TargetType:  domain.TargetTypeUser,
			Action:      domain.ActionSuspend,
			Notes:       "Account suspended pending identity re-verification due to automated spam violations.",
			CreatedAt:   now.Add(-1 * time.Hour),
		},
	}

	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")
	r.badges[userID] = []domain.VerificationBadge{
		{
			ID:         uuid.New(),
			EntityID:   userID,
			EntityType: domain.TargetTypeUser,
			BadgeType:  domain.BadgeIdentityVerified,
			IssuedAt:   now.Add(-24 * time.Hour),
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

	if r.pool != nil {
		query := `INSERT INTO reports (id, reporter_id, target_type, target_id, category, reason, status, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
		_, err := r.pool.Exec(ctx, query, report.ID, report.ReporterID, report.TargetType, report.TargetID, report.Category, report.Reason, report.Status, report.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.reports[report.ID] = report
	return nil
}

func (r *pgxTrustRepository) GetReports(ctx context.Context, status string) ([]domain.Report, error) {
	if r.pool != nil {
		var query string
		var rows pgx.Rows
		var err error

		if status != "" && status != "ALL" {
			query = `SELECT id, reporter_id, target_type, target_id, category, reason, status, created_at FROM reports WHERE status = $1 ORDER BY created_at DESC`
			rows, err = r.pool.Query(ctx, query, status)
		} else {
			query = `SELECT id, reporter_id, target_type, target_id, category, reason, status, created_at FROM reports ORDER BY created_at DESC`
			rows, err = r.pool.Query(ctx, query)
		}

		if err == nil {
			defer rows.Close()
			var list []domain.Report
			for rows.Next() {
				var rep domain.Report
				if err := rows.Scan(&rep.ID, &rep.ReporterID, &rep.TargetType, &rep.TargetID, &rep.Category, &rep.Reason, &rep.Status, &rep.CreatedAt); err == nil {
					list = append(list, rep)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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
	if r.pool != nil {
		query := `UPDATE reports SET status = $1 WHERE id = $2`
		_, err := r.pool.Exec(ctx, query, status, id)
		if err != nil {
			return err
		}
	}

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

	if r.pool != nil {
		query := `INSERT INTO moderation_actions (id, moderator_id, target_id, target_type, action, notes, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7)`
		_, err := r.pool.Exec(ctx, query, action.ID, action.ModeratorID, action.TargetID, action.TargetType, action.Action, action.Notes, action.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.actions = append([]domain.ModerationAction{*action}, r.actions...)
	return nil
}

func (r *pgxTrustRepository) GetModerationActions(ctx context.Context) ([]domain.ModerationAction, error) {
	if r.pool != nil {
		query := `SELECT id, moderator_id, target_id, target_type, action, notes, created_at FROM moderation_actions ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.ModerationAction
			for rows.Next() {
				var a domain.ModerationAction
				if err := rows.Scan(&a.ID, &a.ModeratorID, &a.TargetID, &a.TargetType, &a.Action, &a.Notes, &a.CreatedAt); err == nil {
					list = append(list, a)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.actions, nil
}

func (r *pgxTrustRepository) IssueBadge(ctx context.Context, badge *domain.VerificationBadge) error {
	if badge.ID == uuid.Nil {
		badge.ID = uuid.New()
	}
	badge.IssuedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO verification_badges (id, entity_id, entity_type, badge_type, issued_at) 
		          VALUES ($1, $2, $3, $4, $5)`
		_, err := r.pool.Exec(ctx, query, badge.ID, badge.EntityID, badge.EntityType, badge.BadgeType, badge.IssuedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.badges[badge.EntityID] = append(r.badges[badge.EntityID], *badge)
	return nil
}

func (r *pgxTrustRepository) GetBadges(ctx context.Context, entityType string, entityID uuid.UUID) ([]domain.VerificationBadge, error) {
	if r.pool != nil {
		query := `SELECT id, entity_id, entity_type, badge_type, issued_at FROM verification_badges WHERE entity_type = $1 AND entity_id = $2`
		rows, err := r.pool.Query(ctx, query, entityType, entityID)
		if err == nil {
			defer rows.Close()
			var list []domain.VerificationBadge
			for rows.Next() {
				var b domain.VerificationBadge
				if err := rows.Scan(&b.ID, &b.EntityID, &b.EntityType, &b.BadgeType, &b.IssuedAt); err == nil {
					list = append(list, b)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.badges[entityID], nil
}

func (r *pgxTrustRepository) LogFraud(ctx context.Context, fraud *domain.FraudLog) error {
	if fraud.ID == uuid.Nil {
		fraud.ID = uuid.New()
	}
	fraud.CreatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO fraud_detection_logs (id, entity_type, entity_id, fraud_score, action_taken, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.pool.Exec(ctx, query, fraud.ID, fraud.EntityType, fraud.EntityID, fraud.FraudScore, fraud.ActionTaken, fraud.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.fraudLogs = append([]domain.FraudLog{*fraud}, r.fraudLogs...)
	return nil
}

func (r *pgxTrustRepository) GetFraudLogs(ctx context.Context) ([]domain.FraudLog, error) {
	if r.pool != nil {
		query := `SELECT id, entity_type, entity_id, fraud_score, action_taken, created_at FROM fraud_detection_logs ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.FraudLog
			for rows.Next() {
				var f domain.FraudLog
				if err := rows.Scan(&f.ID, &f.EntityType, &f.EntityID, &f.FraudScore, &f.ActionTaken, &f.CreatedAt); err == nil {
					list = append(list, f)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.fraudLogs, nil
}
