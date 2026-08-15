package repository

import (
	"context"
	"errors"
	"kirmya/internal/admin/models"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepository struct {
	db             *pgxpool.Pool
	mu             sync.RWMutex
	userRoles      map[uuid.UUID][]string
	jobs           map[uuid.UUID]*models.BackgroundJobItem
	incidents      map[uuid.UUID]*models.IncidentItem
	maintConfig    *models.MaintenanceModeConfig
	impersonations map[uuid.UUID]*models.UserImpersonationSession
}

func NewAdminRepository(db *pgxpool.Pool) *AdminRepository {
	repo := &AdminRepository{
		db:             db,
		userRoles:      make(map[uuid.UUID][]string),
		jobs:           make(map[uuid.UUID]*models.BackgroundJobItem),
		incidents:      make(map[uuid.UUID]*models.IncidentItem),
		maintConfig:    &models.MaintenanceModeConfig{IsEnabled: false, UpdatedAt: time.Now()},
		impersonations: make(map[uuid.UUID]*models.UserImpersonationSession),
	}

	// Initialize default mock background job
	mockJobID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	repo.jobs[mockJobID] = &models.BackgroundJobItem{
		ID:         mockJobID,
		Name:       "email_digest_worker",
		Queue:      "notifications",
		Status:     "Failed",
		RetryCount: 1,
		MaxRetries: 3,
		LastError:  "SMTP gateway timeout",
		Payload:    map[string]interface{}{"batchSize": 100},
		CreatedAt:  time.Now().Add(-1 * time.Hour),
		UpdatedAt:  time.Now().Add(-1 * time.Hour),
	}

	// Initialize default mock incident
	mockIncidentID := uuid.MustParse("00000000-0000-0000-0000-000000000002")
	repo.incidents[mockIncidentID] = &models.IncidentItem{
		ID:          mockIncidentID,
		Title:       "High API Latency on Search",
		Description: "OpenSearch cluster node 2 reporting elevated query latency",
		Severity:    "Major",
		Status:      "Investigating",
		CreatedBy:   uuid.New(),
		CreatedAt:   time.Now().Add(-30 * time.Minute),
		UpdatedAt:   time.Now().Add(-10 * time.Minute),
	}

	return repo
}


// CreateAuditLog inserts an immutable audit log record.
func (r *AdminRepository) CreateAuditLog(ctx context.Context, l *models.AdminAuditLog) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO admin_audit_logs (id, admin_id, admin_email, role_code, action, target_type, target_id, previous_state, new_state, reason, ip_address, user_agent, request_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`
	_, err := r.db.Exec(ctx, query, l.ID, l.AdminID, l.AdminEmail, l.RoleCode, l.Action, l.TargetType, l.TargetID, l.PreviousState, l.NewState, l.Reason, l.IPAddress, l.UserAgent, l.RequestID)
	return err
}

// ListAuditLogs returns filtered audit log entries.
func (r *AdminRepository) ListAuditLogs(ctx context.Context, queryStr string, adminID string, targetType string, limit int, offset int) ([]models.AdminAuditLog, error) {
	if r.db == nil {
		return []models.AdminAuditLog{}, nil
	}
	if limit <= 0 {
		limit = 50
	}

	query := `SELECT id, admin_id, COALESCE(admin_email, ''), COALESCE(role_code, ''), action, target_type, target_id, previous_state, new_state, COALESCE(reason, ''), COALESCE(ip_address, ''), COALESCE(user_agent, ''), COALESCE(request_id, ''), created_at
		FROM admin_audit_logs WHERE 1=1`

	args := []interface{}{}
	paramIdx := 1

	if adminID != "" {
		query += ` AND admin_id = $` + string(rune('0'+paramIdx))
		args = append(args, adminID)
		paramIdx++
	}
	if targetType != "" {
		query += ` AND LOWER(target_type) = LOWER($` + string(rune('0'+paramIdx)) + `)`
		args = append(args, targetType)
		paramIdx++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + string(rune('0'+paramIdx)) + ` OFFSET $` + string(rune('0'+paramIdx+1))
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.AdminAuditLog
	for rows.Next() {
		var l models.AdminAuditLog
		if err := rows.Scan(&l.ID, &l.AdminID, &l.AdminEmail, &l.RoleCode, &l.Action, &l.TargetType, &l.TargetID, &l.PreviousState, &l.NewState, &l.Reason, &l.IPAddress, &l.UserAgent, &l.RequestID, &l.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, l)
	}
	return list, nil
}

// GetUserPermissions fetches all permission codes granted to an admin user through their roles.
func (r *AdminRepository) GetUserPermissions(ctx context.Context, userID uuid.UUID) ([]string, error) {
	if r.db == nil {
		r.mu.RLock()
		roles, exists := r.userRoles[userID]
		r.mu.RUnlock()

		if exists && len(roles) > 0 {
			var perms []string
			for _, role := range roles {
				switch role {
				case "super_admin":
					return []string{"super_admin", "*"}, nil
				case "platform_admin":
					perms = append(perms, "users.read", "users.update", "system_settings.manage", "feature_flags.manage")
				case "trust_safety_admin":
					perms = append(perms, "reports.read", "reports.resolve", "moderation.review", "trust_safety.manage", "users.suspend")
				case "content_moderator":
					perms = append(perms, "jobs.read", "jobs.moderate", "reports.read", "reports.resolve", "moderation.review")
				case "support_admin":
					perms = append(perms, "users.read", "users.impersonate", "tickets.manage", "reports.read")
				case "analytics_admin":
					perms = append(perms, "analytics.read", "audit_logs.read", "metrics.read")
				case "operations_admin":
					perms = append(perms, "system_jobs.read", "system_jobs.retry", "incidents.manage", "maintenance.manage", "health.read")
				}
			}
			return perms, nil
		}

		// Mock fallback for unit testing / development
		return []string{
			"super_admin", "*",
			"users.read", "users.update", "users.suspend", "users.delete", "users.impersonate",
			"companies.read", "companies.verify", "companies.suspend",
			"recruiters.read", "recruiters.manage",
			"jobs.read", "jobs.moderate", "jobs.approve", "jobs.remove",
			"applications.read", "communities.moderate",
			"reports.read", "reports.resolve", "moderation.review",
			"trust_safety.manage", "audit_logs.read", "analytics.read",
			"system_settings.manage", "notifications.manage",
			"system_jobs.read", "system_jobs.retry", "incidents.manage", "maintenance.manage", "health.read",
		}, nil
	}

	query := `SELECT DISTINCT p.code
		FROM admin_permissions p
		JOIN admin_role_permissions rp ON p.id = rp.permission_id
		JOIN admin_user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err == nil {
			permissions = append(permissions, code)
		}
	}
	return permissions, nil
}

// GetUserRoles fetches role codes assigned to an admin user.
func (r *AdminRepository) GetUserRoles(ctx context.Context, userID uuid.UUID) ([]string, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if roles, exists := r.userRoles[userID]; exists && len(roles) > 0 {
			return roles, nil
		}
		return []string{"super_admin"}, nil
	}

	query := `SELECT r.code FROM admin_roles r JOIN admin_user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err == nil {
			roles = append(roles, code)
		}
	}
	return roles, nil
}

// GetDashboardStats aggregates system dashboard counters.
func (r *AdminRepository) GetDashboardStats(ctx context.Context) (*models.AdminDashboardStats, error) {
	if r.db == nil {
		return &models.AdminDashboardStats{
			TotalUsers:           12450,
			ActiveUsers:          11200,
			NewUsers:             450,
			SuspendedUsers:       42,
			VerifiedUsers:        8900,
			Companies:            1280,
			VerifiedCompanies:    940,
			Recruiters:           3200,
			ActiveJobs:           4850,
			Applications:         34200,
			Reports:              86,
			PendingModeration:    14,
			PendingVerifications: 28,
			SecurityAlerts:       5,
			SystemHealth: models.SystemHealth{
				APIStatus:           "Healthy",
				DatabaseStatus:      "Healthy",
				RedisStatus:         "Healthy",
				QueueStatus:         "Healthy",
				NotificationStatus:  "Healthy",
				AIServiceStatus:     "Healthy",
				SearchServiceStatus: "Healthy",
				StorageStatus:       "Healthy",
				WorkersStatus:       "Healthy",
			},
			GrowthTrends: map[string]int64{
				"UserGrowth":        12,
				"JobGrowth":         18,
				"ApplicationGrowth": 24,
				"ReportVolume":      -5,
			},
		}, nil
	}

	var totalUsers, activeJobs, totalReports, pendingMod, pendingVerif int64
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&totalUsers)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM jobs WHERE is_active = TRUE").Scan(&activeJobs)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM content_reports").Scan(&totalReports)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM moderation_cases WHERE status = 'New' OR status = 'Under Review'").Scan(&pendingMod)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM verification_reviews WHERE status = 'Pending'").Scan(&pendingVerif)

	return &models.AdminDashboardStats{
		TotalUsers:           totalUsers,
		ActiveUsers:          totalUsers,
		ActiveJobs:           activeJobs,
		Reports:              totalReports,
		PendingModeration:    pendingMod,
		PendingVerifications: pendingVerif,
		SystemHealth: models.SystemHealth{
			APIStatus:      "Healthy",
			DatabaseStatus: "Healthy",
		},
		GrowthTrends: map[string]int64{
			"UserGrowth": 12,
		},
	}, nil
}

// ListUsers queries user accounts for admin search.
func (r *AdminRepository) ListUsers(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return []map[string]interface{}{
			{
				"id":                 "u1",
				"email":              "user1@kirmya.com",
				"fullName":           "Tariq Al-Mansoor",
				"status":             "Active",
				"verificationStatus": "Verified",
				"role":               "JobSeeker",
				"createdAt":          "2026-01-15T10:00:00Z",
			},
			{
				"id":                 "u2",
				"email":              "suspicious@kirmya.com",
				"fullName":           "John Doe",
				"status":             "Suspended",
				"verificationStatus": "Unverified",
				"role":               "JobSeeker",
				"createdAt":          "2026-08-01T12:00:00Z",
			},
		}, nil
	}

	query := `SELECT id, email, COALESCE(full_name, ''), status, COALESCE(role, 'JobSeeker'), created_at FROM users WHERE 1=1`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var id uuid.UUID
		var email, name, st, role string
		var createdAt interface{}
		if err := rows.Scan(&id, &email, &name, &st, &role, &createdAt); err == nil {
			list = append(list, map[string]interface{}{
				"id":        id.String(),
				"email":     email,
				"fullName":  name,
				"status":    st,
				"role":      role,
				"createdAt": createdAt,
			})
		}
	}
	return list, nil
}

// UpdateUserStatus changes a user's account status.
func (r *AdminRepository) UpdateUserStatus(ctx context.Context, id uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

// ListCompanies queries registered companies.
func (r *AdminRepository) ListCompanies(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return []map[string]interface{}{
			{
				"id":          "c1",
				"name":        "TechCorp Middle East",
				"slug":        "techcorp-me",
				"industry":    "Software & Technology",
				"status":      "Active",
				"isVerified":  true,
				"recruiterCount": 8,
				"activeJobs":  14,
			},
		}, nil
	}
	return []map[string]interface{}{}, nil
}

// UpdateCompanyStatus updates company status.
func (r *AdminRepository) UpdateCompanyStatus(ctx context.Context, id uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE companies SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

// ListJobs queries jobs for moderation.
func (r *AdminRepository) ListJobs(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return []map[string]interface{}{
			{
				"id":          "j1",
				"title":       "Lead Go Architect",
				"companyName": "TechCorp",
				"status":      "Active",
				"riskScore":   0.12,
				"createdAt":   "2026-08-10T14:00:00Z",
			},
		}, nil
	}
	return []map[string]interface{}{}, nil
}

// ModerateJob updates a job's moderation status.
func (r *AdminRepository) ModerateJob(ctx context.Context, id uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE jobs SET moderation_status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

// ListReports fetches content reports.
func (r *AdminRepository) ListReports(ctx context.Context, status string, priority string, limit int, offset int) ([]models.ContentReport, error) {
	if r.db == nil {
		return []models.ContentReport{
			{
				ID:          uuid.New(),
				ReporterID:  uuid.New(),
				TargetType:  "Job",
				TargetID:    "j2",
				TargetTitle: "Remote Data Entry - $5000/week",
				Category:    "Job Scam",
				Reason:      "Suspicious high payment upfront asking for fee payment.",
				Status:      "New",
				Priority:    "Critical",
				CreatedAt:   time.Now(),
			},
		}, nil
	}
	return []models.ContentReport{}, nil
}

// GetReportByID returns a single content report.
func (r *AdminRepository) GetReportByID(ctx context.Context, id uuid.UUID) (*models.ContentReport, error) {
	if r.db == nil {
		return &models.ContentReport{
			ID:          id,
			ReporterID:  uuid.New(),
			TargetType:  "Job",
			TargetID:    "j2",
			TargetTitle: "Remote Data Entry",
			Category:    "Job Scam",
			Reason:      "Suspicious job offer",
			Status:      "New",
			Priority:    "Critical",
			CreatedAt:   time.Now(),
		}, nil
	}
	return nil, errors.New("report not found")
}

// ListModerationQueue lists queued moderation cases.
func (r *AdminRepository) ListModerationQueue(ctx context.Context, status string, priority string, limit int, offset int) ([]models.ModerationCase, error) {
	if r.db == nil {
		return []models.ModerationCase{
			{
				ID:               uuid.New(),
				CaseNumber:       "MOD-2026-0812",
				TargetType:       "User",
				TargetID:         "u2",
				TargetTitle:      "John Doe (Spam Account)",
				Category:         "Spam",
				Priority:         "High",
				RiskScore:        0.88,
				Status:           "New",
				AISummary:        "Rapid messaging pattern detected across 15 communities within 3 minutes.",
				AIRecommendation: "Restrict messaging capability pending manual identity check.",
				CreatedAt:        time.Now(),
			},
		}, nil
	}
	return []models.ModerationCase{}, nil
}

// ListVerifications lists pending verification reviews.
func (r *AdminRepository) ListVerifications(ctx context.Context, status string, limit int, offset int) ([]models.VerificationReview, error) {
	if r.db == nil {
		return []models.VerificationReview{
			{
				ID:               uuid.New(),
				EntityType:       "Company",
				EntityID:         "c1",
				VerificationType: "Trade License & Commercial Register",
				Status:           "Pending",
				CreatedAt:        time.Now(),
			},
		}, nil
	}
	return []models.VerificationReview{}, nil
}

// ListSecurityEvents lists security logs.
func (r *AdminRepository) ListSecurityEvents(ctx context.Context, userID string, limit int, offset int) ([]models.SecurityEvent, error) {
	if r.db == nil {
		return []models.SecurityEvent{
			{
				ID:        uuid.New(),
				UserID:    uuid.New(),
				EventType: "Failed Login",
				Status:    "Failed",
				IPAddress: "192.168.1.1",
				Location:  "Dubai, UAE",
				CreatedAt: time.Now(),
			},
		}, nil
	}
	return []models.SecurityEvent{}, nil
}

// ListFeatureFlags retrieves environment feature flags.
func (r *AdminRepository) ListFeatureFlags(ctx context.Context) ([]models.FeatureFlag, error) {
	if r.db == nil {
		return []models.FeatureFlag{
			{
				ID:                uuid.New(),
				Name:              "ai_moderation_v2",
				Description:       "Enable assistive AI risk scoring in moderation queue",
				IsEnabled:         true,
				Environment:       "production",
				RolloutPercentage: 100,
				UpdatedAt:         time.Now(),
			},
		}, nil
	}
	return []models.FeatureFlag{}, nil
}

// UpsertFeatureFlag updates feature flag.
func (r *AdminRepository) UpsertFeatureFlag(ctx context.Context, flag *models.FeatureFlag) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO feature_flags (id, name, description, is_enabled, environment, rollout_percentage, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (name) DO UPDATE SET is_enabled = $4, rollout_percentage = $6, updated_at = NOW()`
	_, err := r.db.Exec(ctx, query, flag.ID, flag.Name, flag.Description, flag.IsEnabled, flag.Environment, flag.RolloutPercentage)
	return err
}

// AssignUserRole assigns an administrative role to a user.
func (r *AdminRepository) AssignUserRole(ctx context.Context, userID uuid.UUID, roleCode string) error {
	r.mu.Lock()
	r.userRoles[userID] = append(r.userRoles[userID], roleCode)
	r.mu.Unlock()

	if r.db != nil {
		query := `INSERT INTO admin_user_roles (user_id, role_id)
			SELECT $1, id FROM admin_roles WHERE code = $2
			ON CONFLICT DO NOTHING`
		_, err := r.db.Exec(ctx, query, userID, roleCode)
		return err
	}
	return nil
}

// GetRoles lists all predefined administrative roles.
func (r *AdminRepository) GetRoles(ctx context.Context) ([]models.AdminRole, error) {
	if r.db == nil {
		return []models.AdminRole{
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000001"), Code: "super_admin", Name: "Super Admin", Description: "Unrestricted platform control", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000002"), Code: "platform_admin", Name: "Platform Admin", Description: "Platform infrastructure & config management", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000003"), Code: "trust_safety_admin", Name: "Trust & Safety Admin", Description: "Trust & Safety policy enforcement and user risk management", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000004"), Code: "content_moderator", Name: "Content Moderator", Description: "Content review and moderation queue handling", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000005"), Code: "support_admin", Name: "Support Admin", Description: "Customer support, ticket management, and impersonation", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000006"), Code: "analytics_admin", Name: "Analytics Admin", Description: "Platform telemetry and reporting access", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000007"), Code: "operations_admin", Name: "Operations Admin", Description: "Background jobs, incidents, and maintenance mode controls", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		}, nil
	}

	query := `SELECT id, code, name, description, is_system, created_at, updated_at FROM admin_roles ORDER BY name ASC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []models.AdminRole
	for rows.Next() {
		var role models.AdminRole
		if err := rows.Scan(&role.ID, &role.Code, &role.Name, &role.Description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt); err == nil {
			roles = append(roles, role)
		}
	}
	return roles, nil
}

// LogAdminAction records an admin action audit log.
func (r *AdminRepository) LogAdminAction(ctx context.Context, l *models.AdminAuditLog) error {
	return r.CreateAuditLog(ctx, l)
}

// ListBackgroundJobs queries asynchronous worker background tasks.
func (r *AdminRepository) ListBackgroundJobs(ctx context.Context, status string, queue string, limit int, offset int) ([]models.BackgroundJobItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.BackgroundJobItem
	for _, job := range r.jobs {
		if status != "" && !strings.EqualFold(job.Status, status) {
			continue
		}
		if queue != "" && !strings.EqualFold(job.Queue, queue) {
			continue
		}
		result = append(result, *job)
	}
	return result, nil
}

// GetBackgroundJobByID fetches a specific background job by ID.
func (r *AdminRepository) GetBackgroundJobByID(ctx context.Context, id uuid.UUID) (*models.BackgroundJobItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	job, exists := r.jobs[id]
	if !exists {
		return nil, errors.New("background job not found")
	}
	return job, nil
}

// UpdateBackgroundJobStatus updates execution state and retry count of a background job.
func (r *AdminRepository) UpdateBackgroundJobStatus(ctx context.Context, id uuid.UUID, status string, retryCount int, lastError string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	job, exists := r.jobs[id]
	if !exists {
		return errors.New("background job not found")
	}
	job.Status = status
	job.RetryCount = retryCount
	if lastError != "" {
		job.LastError = lastError
	}
	job.UpdatedAt = time.Now()
	return nil
}

// ListIncidents lists system operation incidents.
func (r *AdminRepository) ListIncidents(ctx context.Context, status string, severity string, limit int, offset int) ([]models.IncidentItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.IncidentItem
	for _, inc := range r.incidents {
		if status != "" && !strings.EqualFold(inc.Status, status) {
			continue
		}
		if severity != "" && !strings.EqualFold(inc.Severity, severity) {
			continue
		}
		result = append(result, *inc)
	}
	return result, nil
}

// GetIncidentByID retrieves an incident by ID.
func (r *AdminRepository) GetIncidentByID(ctx context.Context, id uuid.UUID) (*models.IncidentItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	inc, exists := r.incidents[id]
	if !exists {
		return nil, errors.New("incident not found")
	}
	return inc, nil
}

// CreateIncident logs a new platform operational incident.
func (r *AdminRepository) CreateIncident(ctx context.Context, incident *models.IncidentItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if incident.ID == uuid.Nil {
		incident.ID = uuid.New()
	}
	incident.CreatedAt = time.Now()
	incident.UpdatedAt = time.Now()
	r.incidents[incident.ID] = incident
	return nil
}

// UpdateIncident updates incident resolution status.
func (r *AdminRepository) UpdateIncident(ctx context.Context, id uuid.UUID, status string, resolvedAt *time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	inc, exists := r.incidents[id]
	if !exists {
		return errors.New("incident not found")
	}
	inc.Status = status
	if resolvedAt != nil {
		inc.ResolvedAt = resolvedAt
	}
	inc.UpdatedAt = time.Now()
	return nil
}

// GetMaintenanceModeConfig retrieves current platform maintenance configuration.
func (r *AdminRepository) GetMaintenanceModeConfig(ctx context.Context) (*models.MaintenanceModeConfig, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.maintConfig, nil
}

// UpdateMaintenanceModeConfig modifies maintenance mode settings.
func (r *AdminRepository) UpdateMaintenanceModeConfig(ctx context.Context, cfg *models.MaintenanceModeConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	cfg.UpdatedAt = time.Now()
	r.maintConfig = cfg
	return nil
}

// CreateImpersonationSession creates a user support impersonation session.
func (r *AdminRepository) CreateImpersonationSession(ctx context.Context, session *models.UserImpersonationSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	session.CreatedAt = time.Now()
	r.impersonations[session.ID] = session
	return nil
}

// GetImpersonationSession returns an active impersonation session by ID.
func (r *AdminRepository) GetImpersonationSession(ctx context.Context, id uuid.UUID) (*models.UserImpersonationSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	sess, exists := r.impersonations[id]
	if !exists {
		return nil, errors.New("impersonation session not found")
	}
	return sess, nil
}

// RevokeImpersonationSession deactivates an active support impersonation token.
func (r *AdminRepository) RevokeImpersonationSession(ctx context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	sess, exists := r.impersonations[id]
	if !exists {
		return errors.New("impersonation session not found")
	}
	sess.IsActive = false
	return nil
}

