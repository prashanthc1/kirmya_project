package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"kirmya/internal/system_health/models"

	"github.com/google/uuid"
)

type HealthRepository struct {
	db *sql.DB
}

func NewHealthRepository(db *sql.DB) *HealthRepository {
	return &HealthRepository{db: db}
}

func (r *HealthRepository) UpsertIncident(ctx context.Context, inc *models.HealthIncident) error {
	if r.db == nil {
		return nil
	}

	query := `
		INSERT INTO health_incidents (
			id, component_name, severity, status, failure_type, error_message,
			first_seen_at, last_seen_at, resolved_at, dedup_count, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (id) DO UPDATE SET
			status = EXCLUDED.status,
			last_seen_at = EXCLUDED.last_seen_at,
			resolved_at = EXCLUDED.resolved_at,
			dedup_count = health_incidents.dedup_count + 1;
	`

	_, err := r.db.ExecContext(
		ctx, query,
		inc.ID, inc.ComponentName, inc.Severity, inc.Status, inc.FailureType, inc.ErrorMessage,
		inc.FirstSeenAt, inc.LastSeenAt, inc.ResolvedAt, inc.DedupCount, inc.CreatedAt,
	)

	return err
}

func (r *HealthRepository) ListActiveIncidents(ctx context.Context) ([]models.HealthIncident, error) {
	if r.db == nil {
		now := time.Now()
		return []models.HealthIncident{
			{
				ID:           uuid.MustParse("e0e0e0e0-0000-0000-0000-000000000001"),
				ComponentName: "opensearch",
				Severity:     "degraded",
				Status:       "investigating",
				FailureType:  "SearchLatencySpike",
				ErrorMessage: "OpenSearch latency elevated, fallback database search active",
				FirstSeenAt:  now.Add(-15 * time.Minute),
				LastSeenAt:   now.Add(-1 * time.Minute),
				DedupCount:   3,
				CreatedAt:    now.Add(-15 * time.Minute),
			},
		}, nil
	}

	query := `
		SELECT id, component_name, severity, status, failure_type, error_message,
		       first_seen_at, last_seen_at, resolved_at, dedup_count, created_at
		FROM health_incidents
		WHERE status IN ('open', 'investigating', 'self_healing')
		ORDER BY created_at DESC;
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.HealthIncident
	for rows.Next() {
		inc := models.HealthIncident{}
		var resolvedAt sql.NullTime
		err := rows.Scan(
			&inc.ID, &inc.ComponentName, &inc.Severity, &inc.Status, &inc.FailureType, &inc.ErrorMessage,
			&inc.FirstSeenAt, &inc.LastSeenAt, &resolvedAt, &inc.DedupCount, &inc.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		if resolvedAt.Valid {
			inc.ResolvedAt = &resolvedAt.Time
		}
		list = append(list, inc)
	}

	return list, nil
}

func (r *HealthRepository) CreateRecoveryAction(ctx context.Context, act *models.HealthRecoveryAction) error {
	if r.db == nil {
		return nil
	}

	query := `
		INSERT INTO health_recovery_actions (
			id, incident_id, action_type, component_name, status, result_summary,
			executed_by, started_at, completed_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
	`

	_, err := r.db.ExecContext(
		ctx, query,
		act.ID, act.IncidentID, act.ActionType, act.ComponentName, act.Status, act.ResultSummary,
		act.ExecutedBy, act.StartedAt, act.CompletedAt, act.CreatedAt,
	)

	return err
}

func (r *HealthRepository) ListRecoveryActions(ctx context.Context, limit int) ([]models.HealthRecoveryAction, error) {
	if r.db == nil {
		now := time.Now()
		comp := now.Add(-5 * time.Minute)
		return []models.HealthRecoveryAction{
			{
				ID:            uuid.MustParse("f0f0f0f0-0000-0000-0000-000000000001"),
				ActionType:    "clear_transient_cache",
				ComponentName: "redis",
				Status:        "completed",
				ResultSummary: "Successfully cleared stale cache keys and re-established connection pool",
				StartedAt:     now.Add(-6 * time.Minute),
				CompletedAt:   &comp,
				CreatedAt:     now.Add(-6 * time.Minute),
			},
		}, nil
	}

	query := `
		SELECT id, incident_id, action_type, component_name, status, result_summary,
		       executed_by, started_at, completed_at, created_at
		FROM health_recovery_actions
		ORDER BY created_at DESC
		LIMIT $1;
	`

	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.HealthRecoveryAction
	for rows.Next() {
		act := models.HealthRecoveryAction{}
		var incidentID, executedBy sql.NullString
		var completedAt sql.NullTime

		err := rows.Scan(
			&act.ID, &incidentID, &act.ActionType, &act.ComponentName, &act.Status, &act.ResultSummary,
			&executedBy, &act.StartedAt, &completedAt, &act.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if incidentID.Valid {
			u, _ := uuid.Parse(incidentID.String)
			act.IncidentID = &u
		}
		if executedBy.Valid {
			u, _ := uuid.Parse(executedBy.String)
			act.ExecutedBy = &u
		}
		if completedAt.Valid {
			act.CompletedAt = &completedAt.Time
		}
		list = append(list, act)
	}

	return list, nil
}

func (r *HealthRepository) SetMaintenanceMode(ctx context.Context, mode *models.MaintenanceModeConfig) error {
	if r.db == nil {
		return nil
	}

	allowedJSON, _ := json.Marshal(mode.AllowedAdminIDs)

	query := `
		INSERT INTO maintenance_modes (
			id, is_enabled, reason, allowed_admin_ids, enabled_by, enabled_at, disabled_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
	`

	_, err := r.db.ExecContext(
		ctx, query,
		mode.ID, mode.IsEnabled, mode.Reason, string(allowedJSON), mode.EnabledBy, mode.EnabledAt, mode.DisabledAt, mode.CreatedAt,
	)

	return err
}

func (r *HealthRepository) GetActiveMaintenanceMode(ctx context.Context) (*models.MaintenanceModeConfig, error) {
	if r.db == nil {
		return &models.MaintenanceModeConfig{
			ID:              uuid.Nil,
			IsEnabled:       false,
			Reason:          "",
			AllowedAdminIDs: []string{},
			CreatedAt:       time.Now(),
		}, nil
	}

	query := `
		SELECT id, is_enabled, reason, allowed_admin_ids, enabled_by, enabled_at, disabled_at, created_at
		FROM maintenance_modes
		ORDER BY created_at DESC
		LIMIT 1;
	`

	row := r.db.QueryRowContext(ctx, query)
	mode := &models.MaintenanceModeConfig{}
	var allowedRaw string
	var enabledBy sql.NullString
	var enabledAt, disabledAt sql.NullTime

	err := row.Scan(
		&mode.ID, &mode.IsEnabled, &mode.Reason, &allowedRaw, &enabledBy, &enabledAt, &disabledAt, &mode.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return &models.MaintenanceModeConfig{IsEnabled: false}, nil
	} else if err != nil {
		return nil, err
	}

	_ = json.Unmarshal([]byte(allowedRaw), &mode.AllowedAdminIDs)
	if enabledBy.Valid {
		u, _ := uuid.Parse(enabledBy.String)
		mode.EnabledBy = &u
	}
	if enabledAt.Valid {
		mode.EnabledAt = &enabledAt.Time
	}
	if disabledAt.Valid {
		mode.DisabledAt = &disabledAt.Time
	}

	return mode, nil
}
